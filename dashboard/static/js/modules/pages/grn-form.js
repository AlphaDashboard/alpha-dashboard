/**
 * GRN Form — Create / Edit / View
 * Follows the same pattern as sal-pur-group-form.js
 * API endpoint: /api/grn/
 */

document.addEventListener('DOMContentLoaded', () => {

    const cfg       = window.GRN_CONFIG || {};
    const grnNo     = cfg.grnNo     || '';
    const isEdit    = cfg.isEditMode || false;
    let   isView    = cfg.isViewMode || false;

    // ── DOM refs ──────────────────────────────────────────────────────────────
    const form          = document.getElementById('grnForm');
    const matTableBody  = document.getElementById('matTableBody');
    const testTableBody = document.getElementById('testTableBody');
    const pageTitle     = document.getElementById('pageTitle');

    let matRows  = [];   // array of objects: {MaterialID, Bags, Grossweight, Netweight, Remarks}
    let testRows = [];   // array of objects: {TestID, Testmethodid, Testresult, deductedweight, Remarks}
    let isFormDirty = false;

    let activeMaterialSelect = null;
    let activeRowIndex = null;

    const createMaterialModalEl = document.getElementById('createMaterialModal');
    const createMaterialModal = createMaterialModalEl ? new bootstrap.Modal(createMaterialModalEl) : null;
    const createMaterialForm = document.getElementById('createMaterialForm');
    const materialModalError = document.getElementById('materialModalError');

    const TESTS = [
        { id: 1, name: 'Moisture', max: 0.1 },
        { id: 2, name: 'Foreign Particles', max: 0.05 }
    ];

    const METHODS = [
        { id: 1, name: 'Manual' },
        { id: 2, name: 'automatic' },
        { id: 3, name: 'owen' }
    ];

    // ── Flatpickr for GRN Date ────────────────────────────────────────────────
    const grnDateInput = document.getElementById('GrnDate');
    let grnDatePicker = null;
    if (window.flatpickr && grnDateInput) {
        grnDatePicker = window.flatpickr(grnDateInput, {
            dateFormat: 'Y-m-d',
            allowInput: true,
            onChange: () => markDirty(),
        });
    }

    const gatepassDateInput = document.getElementById('GatepassDate');
    let gatepassDatePicker = null;
    if (window.flatpickr && gatepassDateInput) {
        gatepassDatePicker = window.flatpickr(gatepassDateInput, {
            dateFormat: 'Y-m-d',
            allowInput: true,
            onChange: () => markDirty(),
        });
    }

    const weighmentDateInput = document.getElementById('WeighmentDate');
    let weighmentDatePicker = null;
    if (window.flatpickr && weighmentDateInput) {
        weighmentDatePicker = window.flatpickr(weighmentDateInput, {
            dateFormat: 'Y-m-d',
            allowInput: true,
            onChange: () => markDirty(),
        });
    }

    let gateEntries = [];

    // ── Load gate passes and then load record ───────────────────────────────
    // IMPORTANT: lockViewMode() must run AFTER loadGRN() resolves so matRows
    // is already populated when renderMatTable() is called inside lockViewMode().
    // Calling lockViewMode() synchronously (before await) caused an empty table.
    loadGatePasses().then(async () => {
        if (isEdit && grnNo) {
            await loadGRN(grnNo);       // ← await: data loads first
            if (isView) lockViewMode(); // ← THEN lock (matRows already set)
        } else {
            // Create mode — add one empty row to each table
            addMatRow();
            addTestRow();
            updateTotals();
            updateProgress(1);
        }
        // Signal base.html navigateSeamlessly() that the form is ready
        document.dispatchEvent(new CustomEvent('erp-form-ready'));
    });

    // ── Expose currentFormInstance for seamless prev/next navigation ──────────
    // Mirrors the pattern used in subsection-b2-form.js so base.html's
    // navigateSeamlessly() can load new GRN data without a full page reload.
    window.currentFormInstance = {
        loadExistingData: async function(id) {
            // Gate entries are already cached from the initial load;
            // re-fetch only if the cache is empty (e.g. after a seamless nav).
            if (!gateEntries || gateEntries.length === 0) await loadGatePasses();
            await loadGRN(id);
        },
        lockViewMode: function() {
            lockViewMode();
        }
    };

    // ── Events ───────────────────────────────────────────────────────────────

    if (form) {
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            saveGRN();
        });
    }

    if (createMaterialForm) {
        createMaterialForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            if (!materialModalError) return;
            materialModalError.classList.add('d-none');
            materialModalError.textContent = '';

            const saveBtn = document.getElementById('saveMaterialBtn');
            const originalText = saveBtn ? saveBtn.innerHTML : 'Save';
            if (saveBtn) {
                saveBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Saving...';
                saveBtn.disabled = true;
            }

            try {
                const formData = new FormData(createMaterialForm);
                const csrfToken = document.querySelector('[name=csrfmiddlewaretoken]')?.value || '';

                const response = await fetch('/api/material-create/', {
                    method: 'POST',
                    headers: {
                        'X-CSRFToken': csrfToken
                    },
                    body: formData
                });

                const result = await response.json();
                if (result.success) {
                    // Add to materials list config
                    const newMat = { id: parseInt(result.id), name: result.text };
                    cfg.materialsList = cfg.materialsList || [];
                    cfg.materialsList.push(newMat);

                    // Update active row
                    if (activeRowIndex != null) {
                        matRows[activeRowIndex].MaterialID = String(result.id);
                    }

                    renderMatTable();
                    updateTotals();
                    markDirty();

                    if (createMaterialModal) createMaterialModal.hide();
                    showToast('Item added successfully');
                } else {
                    let errorText = 'Failed to create item.';
                    if (result.errors) {
                        errorText = Object.values(result.errors).join('<br>');
                    }
                    materialModalError.innerHTML = errorText;
                    materialModalError.classList.remove('d-none');
                }
            } catch (err) {
                console.error(err);
                materialModalError.textContent = 'An error occurred during submission.';
                materialModalError.classList.remove('d-none');
            } finally {
                if (saveBtn) {
                    saveBtn.innerHTML = originalText;
                    saveBtn.disabled = false;
                }
            }
        });
    }


    // ── Multi-column Gate Pass dropdown wiring ────────────────────────────────
    // The display input opens/closes the custom panel; actual value stored in hidden input.
    const gpDisplayInput  = document.getElementById('GatepassNoDisplay');
    const gpHiddenInput   = document.getElementById('GatepassNo');
    const gpDropdownPanel = document.getElementById('gpDropdownPanel');
    const gpDropdownList  = document.getElementById('gpDropdownList');
    const gpSearchInput   = document.getElementById('gpSearchInput');

    /**
     * Detach panel to document.body so it escapes all parent stacking contexts.
     * This is the same detached dropdown pattern used in Subsection B — ensures
     * position:fixed and z-index work at the true viewport level with no clipping.
     */
    if (gpDropdownPanel && gpDropdownPanel.parentNode !== document.body) {
        document.body.appendChild(gpDropdownPanel);
    }

    /**
     * Opens the Gate Pass multi-column dropdown panel.
     * Recalculates position fresh each time from the display input's bounding rect.
     */
    function openGpDropdown() {
        if (!gpDisplayInput || !gpDropdownPanel || isView) return;
        const rect = gpDisplayInput.getBoundingClientRect();
        gpDropdownPanel.style.display  = 'flex';
        gpDropdownPanel.style.top      = (rect.bottom + window.scrollY + 4) + 'px';
        gpDropdownPanel.style.left     = (rect.left   + window.scrollX)     + 'px';
        gpDropdownPanel.style.position = 'absolute';
        gpDropdownPanel.style.zIndex   = '999999';
        if (gpSearchInput) { gpSearchInput.value = ''; gpSearchInput.focus(); }
        renderGpDropdownRows('');
    }

    /**
     * Closes the Gate Pass multi-column dropdown panel.
     */
    function closeGpDropdown() {
        if (gpDropdownPanel) gpDropdownPanel.style.display = 'none';
    }


    /**
     * Renders the Gate Pass rows inside the dropdown list panel.
     * Filters by search query across GP No, Date, Driver, Vehicle and Weighment No.
     * @param {string} query - Text to filter rows.
     */
    function renderGpDropdownRows(query) {
        if (!gpDropdownList) return;
        const q = (query || '').toLowerCase().trim();
        const filtered = gateEntries.filter(gp => {
            const gpNum  = String(gp.GatePassNo + 10000);
            const date   = (gp.GatePassdate || '').toLowerCase();
            const driver = (gp.DriverName   || '').toLowerCase();
            const veh    = (gp.VehicleNo    || '').toLowerCase();
            const wno    = (gp.WeighmentNo  || '').toLowerCase();
            return !q || gpNum.includes(q) || date.includes(q) || driver.includes(q) || veh.includes(q) || wno.includes(q);
        });

        gpDropdownList.innerHTML = '';
        if (filtered.length === 0) {
            gpDropdownList.innerHTML = '<div style="padding:10px 12px; color:#6b7280; font-size:12px;">No records found</div>';
            return;
        }
        filtered.forEach(gp => {
            const row = document.createElement('div');
            row.style.cssText = 'display:grid; grid-template-columns:90px 100px 120px 130px 130px; padding:6px 10px; font-size:12px; cursor:pointer; border-bottom:1px solid #f1f5f9; color:#334155;';
            row.innerHTML = `
                <span style="font-weight:600; color:#2563eb;">GP-${gp.GatePassNo + 10000}</span>
                <span>${gp.GatePassdate || '—'}</span>
                <span>${esc(gp.DriverName  || '—')}</span>
                <span>${esc(gp.VehicleNo   || '—')}</span>
                <span>${esc(gp.WeighmentNo || '—')}</span>
            `;
            row.addEventListener('mouseenter', () => row.style.backgroundColor = '#eff6ff');
            row.addEventListener('mouseleave',  () => row.style.backgroundColor = '');
            row.addEventListener('click', () => {
                // Set hidden value and display label
                if (gpHiddenInput)  gpHiddenInput.value  = gp.GatePassNo;
                if (gpDisplayInput) {
                    gpDisplayInput.value = `GP-${gp.GatePassNo + 10000}`;
                    gpDisplayInput.closest('.form-group')?.classList.add('has-value');
                }
                closeGpDropdown();
                updateGatePassDetails(gp.GatePassNo, true);
                markDirty();
            });
            gpDropdownList.appendChild(row);
        });
    }

    // Open panel on display input click/focus
    if (gpDisplayInput) {
        gpDisplayInput.addEventListener('click', (e) => {
            e.stopPropagation();
            openGpDropdown();
        });
        gpDisplayInput.addEventListener('focus', () => {
            openGpDropdown();
        });
    }

    // Prevent clicks inside the panel from closing it via the document handler
    if (gpDropdownPanel) {
        gpDropdownPanel.addEventListener('click', (e) => e.stopPropagation());
    }

    // Live search inside panel
    if (gpSearchInput) {
        gpSearchInput.addEventListener('input', () => renderGpDropdownRows(gpSearchInput.value));
    }

    // Close dropdown when clicking anywhere outside the group or panel
    document.addEventListener('click', (e) => {
        if (!e.target.closest('#gpDropdownGroup') && !e.target.closest('#gpDropdownPanel')) {
            closeGpDropdown();
        }
    });

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            closeGpDropdown();
        }
    });

    const statusSelect = document.getElementById('status');
    if (statusSelect) {
        statusSelect.addEventListener('change', (e) => {
            updateProgress(e.target.value);
            markDirty();
        });
    }

    // Dirty tracking
    document.querySelectorAll('#grnForm input, #grnForm select, #grnForm textarea').forEach(el => {
        el.addEventListener('input', markDirty);
        el.addEventListener('change', markDirty);
    });

    // Unsaved changes warning
    window.addEventListener('beforeunload', (e) => {
        if (isFormDirty && !isView) {
            e.preventDefault();
            e.returnValue = '';
        }
    });

    // ── Load GRN from API ─────────────────────────────────────────────────────
    // NOTE: lockViewMode() is intentionally NOT called here anymore.
    // The caller (.then() block above) calls lockViewMode() after this function
    // resolves, ensuring matRows is populated before renderMatTable() runs.
    async function loadGRN(id) {
        try {
            const resp = await fetch(`/api/grn/${encodeURIComponent(id)}/`);
            if (!resp.ok) throw new Error('Not found');
            const data = await resp.json();
            populateForm(data);
            // lockViewMode() removed from here — caller handles it after await
        } catch (err) {
            console.error('Failed to load GRN:', err);
            showToast('Failed to load GRN record.', 'danger');
        }
    }

    // ── Populate form fields ──────────────────────────────────────────────────
    function populateForm(data) {
        setField('GrnNo',          data.GrnNo);
        // Set the hidden GatepassNo value and update the visible display input label
        setField('GatepassNo', data.GatepassNo);
        if (data.GatepassNo) {
            const displayEl = document.getElementById('GatepassNoDisplay');
            if (displayEl) {
                displayEl.value = `GP-${parseInt(data.GatepassNo) + 10000}`;
                displayEl.closest('.form-group')?.classList.add('has-value');
            }
            updateGatePassDetails(data.GatepassNo);
        }
        // NOTE: Netweight, DeductedWeight, Approvedweight are set AFTER updateTotals()
        // below so the stored GRN values always win over the calculated row totals.
        setField('internalnotes',  data.internalnotes);
        setField('status',         data.status);
        if (data.status) {
            updateProgress(data.status);
        }
        if (parseInt(data.status) === 4 || parseInt(data.status) === 5) {
            lockViewMode();
        }

        // ── Approval workflow progress bar — read from tblGRN_User audit log ──────
        // Map actionid (FK to tblApprovalStages) → progress step element ID
        const stepMap = {
            1: 'step-Draft',
            2: 'step-Submitted',
            3: 'step-RefBack',
            4: 'step-Approved',
            5: 'step-Released',
        };

        // First hide all step-details blocks
        Object.values(stepMap).forEach(stepId => {
            document.querySelector(`#${stepId} .step-details`)?.classList.add('d-none');
        });

        // Then populate from approval_log rows (each row = one user action)
        if (data.approval_log && data.approval_log.length) {
            data.approval_log.forEach(log => {
                const stepId = stepMap[parseInt(log.actionid)];
                if (!stepId) return;
                const stepEl = document.getElementById(stepId);
                if (!stepEl) return;
                const detailEl = stepEl.querySelector('.step-details');
                if (detailEl) {
                    detailEl.classList.remove('d-none');
                    // "By: username" label
                    const byEl = detailEl.querySelector('.step-user');
                    if (byEl) byEl.textContent = log.User ? `By: ${log.User}` : '';
                    // "Date: actiondate" label
                    const dateEl = detailEl.querySelector('.step-date');
                    if (dateEl) dateEl.textContent = log.actiondate ? formatDate(log.actiondate) : '';
                }
            });
        }

        // Fallback: also fill from header fields if approval_log is empty (backward compat)
        if (!data.approval_log || data.approval_log.length === 0) {
            if (data.draftedby) {
                document.querySelector('#step-Draft .step-details')?.classList.remove('d-none');
                document.querySelector('#step-Draft .step-user') && (document.querySelector('#step-Draft .step-user').textContent = `By: ${data.draftedby}`);
                document.querySelector('#step-Draft .step-date') && (document.querySelector('#step-Draft .step-date').textContent = data.DraftedDate ? formatDate(data.DraftedDate) : '');
            }
            if (data.submittedby) {
                document.querySelector('#step-Submitted .step-details')?.classList.remove('d-none');
                document.querySelector('#step-Submitted .step-user') && (document.querySelector('#step-Submitted .step-user').textContent = `By: ${data.submittedby}`);
                document.querySelector('#step-Submitted .step-date') && (document.querySelector('#step-Submitted .step-date').textContent = data.SubmissionDate ? formatDate(data.SubmissionDate) : '');
            }
            if (data.referedbackby) {
                document.querySelector('#step-RefBack .step-details')?.classList.remove('d-none');
                document.querySelector('#step-RefBack .step-user') && (document.querySelector('#step-RefBack .step-user').textContent = `By: ${data.referedbackby}`);
                document.querySelector('#step-RefBack .step-date') && (document.querySelector('#step-RefBack .step-date').textContent = data.Referredbackdate ? formatDate(data.Referredbackdate) : '');
            }
            if (data.approvedby) {
                document.querySelector('#step-Approved .step-details')?.classList.remove('d-none');
                document.querySelector('#step-Approved .step-user') && (document.querySelector('#step-Approved .step-user').textContent = `By: ${data.approvedby}`);
                document.querySelector('#step-Approved .step-date') && (document.querySelector('#step-Approved .step-date').textContent = data.ApprovalDate ? formatDate(data.ApprovalDate) : '');
            }
        }


        // GRN Date via flatpickr
        if (grnDatePicker && data.GrnDate) {
            grnDatePicker.setDate(data.GrnDate.substring(0, 10));
        } else if (grnDateInput && data.GrnDate) {
            grnDateInput.value = data.GrnDate.substring(0, 10);
        }

        // Floating label fix for filled inputs
        document.querySelectorAll('.form-group input, .form-group textarea').forEach(el => {
            if (el.value) el.closest('.form-group')?.classList.add('has-value');
        });

        // Render material rows
        matRows = [];
        if (data.materials && data.materials.length) {
            data.materials.forEach(m => {
                matRows.push({
                    MaterialID:  m.MaterialID || '',
                    Bags:        m.Bags        || 0,
                    Grossweight: m.Grossweight || 0,
                    Netweight:   m.Netweight   || 0,
                    Remarks:     m.Remarks     || '',
                });
            });
        }
        renderMatTable();

        // Render test rows
        testRows = [];
        if (data.tests && data.tests.length) {
            data.tests.forEach(t => {
                testRows.push({
                    TestID:       t.TestID       || '',
                    Testmethodid: t.Testmethodid || '',
                    Testresult:   t.Testresult   || 0,
                    deductedweight: t.deductedweight || 0,
                    Remarks:      t.Remarks      || '',
                });
            });
        }
        renderTestTable();

        // In Edit mode, if the saved GRN has no material or test rows,
        // add one blank row each so the user has a row (with + button) to fill in.
        if (!isView) {
            if (matRows.length === 0) {
                addMatRow();
            }
            if (testRows.length === 0) {
                addTestRow();
            }
        }

        // Calculate table footer totals from rows
        updateTotals();

        // IMPORTANT: Re-set the stored GRN header weight values AFTER updateTotals()
        // so they are not overwritten by the row-sum calculation (which would be 0
        // when no material rows exist yet).
        setField('Netweight',      data.Netweight);
        setField('DeductedWeight', data.DeductedWeight);
        setField('Approvedweight', data.Approvedweight);
    }

    // ── Material table ────────────────────────────────────────────────────────
    function addMatRow(data = {}) {
        matRows.push({
            MaterialID:  data.MaterialID  || '',
            Bags:        data.Bags        || '',
            Grossweight: data.Grossweight || '',
            Netweight:   data.Netweight   || '',
            Remarks:     data.Remarks     || '',
        });
        renderMatTable();
    }

    /**
     * Renders the Material Details grid table body dynamically.
     * Generates table row nodes (TR) for each item row in `matRows`.
     * Configures the material select dropdown box, Bags, Gross/Net Weight input fields,
     * hooks up inline validation event listeners (to trigger total calculations on changes),
     * and sets up the row action add (+) and delete (trash) buttons in a flex-container.
     */
    function renderMatTable() {
        if (!matTableBody) return;
        matTableBody.innerHTML = '';
        matRows.forEach((row, idx) => {
            const tr = document.createElement('tr');
            
            let matSelectHTML = `<select class="form-select mat-field" style="min-width: 150px;" data-idx="${idx}" data-field="MaterialID" ${isView ? 'disabled' : ''}>`;
            matSelectHTML += '<option value="">-- Select Material --</option>';
            (cfg.materialsList || []).forEach(m => {
                const selected = parseInt(row.MaterialID) === m.id ? 'selected' : '';
                matSelectHTML += `<option value="${m.id}" ${selected}>${esc(m.name)}</option>`;
            });
            if (!isView) {
                matSelectHTML += '<option value="add_new" style="color: #2563eb; font-weight: 600;">+ Add New Material</option>';
            }
            matSelectHTML += '</select>';

            tr.innerHTML = `
                <td class="text-center" style="color:#64748b; font-size:11px;">${idx + 1}</td>
                <td>${matSelectHTML}</td>
                <td><input type="number" step="0.01" class="form-control mat-field text-end" data-idx="${idx}" data-field="Bags"
                    value="${esc(row.Bags)}" placeholder="0.00" ${isView ? 'disabled' : ''}></td>
                <td><input type="number" step="0.01" class="form-control mat-field text-end" data-idx="${idx}" data-field="Grossweight"
                    value="${esc(row.Grossweight)}" placeholder="0.00" ${isView ? 'disabled' : ''}></td>
                <td><input type="number" step="0.01" class="form-control mat-field text-end" data-idx="${idx}" data-field="Netweight"
                    value="${esc(row.Netweight)}" placeholder="0.00" ${isView ? 'disabled' : ''}></td>
                <td><input type="text" class="form-control mat-field" data-idx="${idx}" data-field="Remarks"
                    value="${esc(row.Remarks)}" placeholder="Remarks" ${isView ? 'disabled' : ''}></td>
                <td class="text-center align-middle" style="white-space:nowrap;">
                    ${!isView ? `
                        <div class="d-flex justify-content-center align-items-center gap-2">
                            <button type="button" class="erp-action-btn erp-btn-add mat-add-btn" data-idx="${idx}" title="Add Row">
                                <i class="bi bi-plus-lg" style="font-size: 16px; font-weight: bold;"></i>
                            </button>
                            ${idx > 0 ? `
                                <button type="button" class="erp-action-btn erp-btn-delete mat-delete-btn" data-idx="${idx}" title="Delete Row">
                                    <i class="bi bi-trash" style="font-size: 15px;"></i>
                                </button>
                            ` : ''}
                        </div>
                    ` : ''}
                </td>`;
            matTableBody.appendChild(tr);
        });

        // Bind row events
        matTableBody.querySelectorAll('.mat-field').forEach(input => {
            const eventType = input.tagName === 'SELECT' ? 'change' : 'input';
            input.addEventListener(eventType, (e) => {
                const idx   = parseInt(e.target.dataset.idx);
                const field = e.target.dataset.field;

                if (field === 'MaterialID' && e.target.value === 'add_new') {
                    e.target.value = matRows[idx].MaterialID || ''; // Reset selection back to original
                    activeMaterialSelect = e.target;
                    activeRowIndex = idx;

                    if (createMaterialForm) createMaterialForm.reset();
                    if (materialModalError) {
                        materialModalError.classList.add('d-none');
                        materialModalError.textContent = '';
                    }
                    if (createMaterialModal) createMaterialModal.show();
                    return;
                }

                matRows[idx][field] = e.target.value;
                updateTotals();
                markDirty();
            });
        });
        matTableBody.querySelectorAll('.mat-add-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const idx = parseInt(btn.dataset.idx);
                matRows.splice(idx + 1, 0, {
                    MaterialID:  '',
                    Bags:        '',
                    Grossweight: '',
                    Netweight:   '',
                    Remarks:     '',
                });
                renderMatTable();
                updateTotals();
                markDirty();
            });
        });
        matTableBody.querySelectorAll('.mat-delete-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const idx = parseInt(btn.dataset.idx);
                matRows.splice(idx, 1);
                renderMatTable();
                updateTotals();
                markDirty();
            });
        });
    }

    // ── Test table ────────────────────────────────────────────────────────────
    function addTestRow(data = {}) {
        testRows.push({
            TestID:         data.TestID         || '',
            Testmethodid:   data.Testmethodid   || '',
            Testresult:     data.Testresult      || '',
            deductedweight: data.deductedweight  || '',
            Remarks:        data.Remarks         || '',
        });
        renderTestTable();
    }

    function renderTestTable() {
        if (!testTableBody) return;
        testTableBody.innerHTML = '';
        testRows.forEach((row, idx) => {
            const tr = document.createElement('tr');
            
            let testSelectHTML = `<select class="form-select test-field" style="min-width: 150px;" data-idx="${idx}" data-field="TestID" ${isView ? 'disabled' : ''}>`;
            testSelectHTML += '<option value="">-- Select Test --</option>';
            TESTS.forEach(t => {
                const selected = parseInt(row.TestID) === t.id ? 'selected' : '';
                testSelectHTML += `<option value="${t.id}" ${selected}>${esc(t.name)}</option>`;
            });
            testSelectHTML += '</select>';

            let methodSelectHTML = `<select class="form-select test-field" style="min-width: 150px;" data-idx="${idx}" data-field="Testmethodid" ${isView ? 'disabled' : ''}>`;
            methodSelectHTML += '<option value="">-- Select Method --</option>';
            METHODS.forEach(m => {
                const selected = parseInt(row.Testmethodid) === m.id ? 'selected' : '';
                methodSelectHTML += `<option value="${m.id}" ${selected}>${esc(m.name)}</option>`;
            });
            methodSelectHTML += '</select>';

            tr.innerHTML = `
                <td class="text-center" style="color:#64748b; font-size:11px;">${idx + 1}</td>
                <td>${testSelectHTML}</td>
                <td>${methodSelectHTML}</td>
                <td><input type="number" step="0.01" class="form-control test-field text-end" data-idx="${idx}" data-field="Testresult"
                    value="${esc(row.Testresult)}" placeholder="0.00" ${isView ? 'disabled' : ''}></td>
                <td><input type="number" step="0.01" class="form-control test-field text-end" data-idx="${idx}" data-field="deductedweight"
                    value="${esc(row.deductedweight)}" placeholder="0.00" ${isView ? 'disabled' : ''}></td>
                <td><input type="text" class="form-control test-field" data-idx="${idx}" data-field="Remarks"
                    value="${esc(row.Remarks)}" placeholder="Remarks" ${isView ? 'disabled' : ''}></td>
                <td class="text-center align-middle" style="white-space:nowrap;">
                    ${!isView ? `
                        <div class="d-flex justify-content-center align-items-center gap-2">
                            <button type="button" class="erp-action-btn erp-btn-add test-add-btn" data-idx="${idx}" title="Add Row">
                                <i class="bi bi-plus-lg" style="font-size: 16px; font-weight: bold;"></i>
                            </button>
                            ${idx > 0 ? `
                                <button type="button" class="erp-action-btn erp-btn-delete test-delete-btn" data-idx="${idx}" title="Delete Row">
                                    <i class="bi bi-trash" style="font-size: 15px;"></i>
                                </button>
                            ` : ''}
                        </div>
                    ` : ''}
                </td>`;
            testTableBody.appendChild(tr);
        });

        testTableBody.querySelectorAll('.test-field').forEach(input => {
            input.addEventListener('input', (e) => {
                const idx   = parseInt(e.target.dataset.idx);
                const field = e.target.dataset.field;
                testRows[idx][field] = e.target.value;
                updateTotals();
                markDirty();
            });
        });
        testTableBody.querySelectorAll('.test-add-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const idx = parseInt(btn.dataset.idx);
                testRows.splice(idx + 1, 0, {
                    TestID:         '',
                    Testmethodid:   '',
                    Testresult:     '',
                    deductedweight: '',
                    Remarks:        '',
                });
                renderTestTable();
                updateTotals();
                markDirty();
            });
        });
        testTableBody.querySelectorAll('.test-delete-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const idx = parseInt(btn.dataset.idx);
                testRows.splice(idx, 1);
                renderTestTable();
                updateTotals();
                markDirty();
            });
        });
    }

    // ── Totals ────────────────────────────────────────────────────────────────
    function updateTotals() {
        const sum = (arr, field) => arr.reduce((a, r) => a + (parseFloat(r[field]) || 0), 0);

        const totalBags    = sum(matRows, 'Bags');
        const totalGross   = sum(matRows, 'Grossweight');
        const totalNetMat  = sum(matRows, 'Netweight');
        const totalDeducted = sum(testRows, 'deductedweight');
        const totalResult   = sum(testRows, 'Testresult');

        setText('matTotalBags',      totalBags.toFixed(2));
        setText('matTotalGross',     totalGross.toFixed(2));
        setText('matTotalNet',       totalNetMat.toFixed(2));
        setText('testTotalResult',   totalResult.toFixed(2));
        setText('testTotalDeducted', totalDeducted.toFixed(2));

        // Auto-calculate header weights from rows
        const netWeightField = document.getElementById('Netweight');
        const dedWeightField = document.getElementById('DeductedWeight');
        const appWeightField = document.getElementById('Approvedweight');

        if (netWeightField && !isView) netWeightField.value = totalNetMat.toFixed(2);
        if (dedWeightField && !isView) dedWeightField.value = totalDeducted.toFixed(2);
        if (appWeightField && !isView) appWeightField.value = (totalNetMat - totalDeducted).toFixed(2);
    }

    /**
     * Performs form validation checks for all header and transaction details.
     * Automatically highlights invalid/missing fields with red borders using '.is-invalid' class.
     */
    function validateForm() {
        let isValid = true;
        
        // Clear previous validation styles
        document.querySelectorAll('.is-invalid').forEach(el => el.classList.remove('is-invalid'));
        
        // Validate GRN No
        const grnNoVal = document.getElementById('GrnNo')?.value?.trim();
        if (!grnNoVal) {
            document.getElementById('GrnNo')?.classList.add('is-invalid');
            isValid = false;
        }
        
        // Validate GRN Date
        if (grnDateInput && !grnDateInput.value) {
            grnDateInput.classList.add('is-invalid');
            isValid = false;
        }
        
        // Validate Gate Pass selection — check hidden value; highlight visible display input
        const gpHidden  = document.getElementById('GatepassNo');
        const gpDisplay = document.getElementById('GatepassNoDisplay');
        if (gpHidden && !gpHidden.value) {
            if (gpDisplay) gpDisplay.classList.add('is-invalid');
            isValid = false;
        }

        // Validate Status — status is required before saving any GRN record
        const statusEl = document.getElementById('status');
        if (statusEl && !statusEl.value) {
            statusEl.classList.add('is-invalid');
            isValid = false;
        }

        // Validate Material item details grid rows individually
        if (matRows.length === 0) {
            isValid = false;
        } else {
            matRows.forEach((r, idx) => {
                // Validate Material selection
                if (!r.MaterialID) {
                    const el = document.querySelector(`.mat-field[data-idx="${idx}"][data-field="MaterialID"]`);
                    if (el) el.classList.add('is-invalid');
                    isValid = false;
                }
                // Validate Bags input quantity
                if (!r.Bags || parseFloat(r.Bags) <= 0) {
                    const el = document.querySelector(`.mat-field[data-idx="${idx}"][data-field="Bags"]`);
                    if (el) el.classList.add('is-invalid');
                    isValid = false;
                }
                // Validate Gross weight input quantity
                if (!r.Grossweight || parseFloat(r.Grossweight) <= 0) {
                    const el = document.querySelector(`.mat-field[data-idx="${idx}"][data-field="Grossweight"]`);
                    if (el) el.classList.add('is-invalid');
                    isValid = false;
                }
                // Validate Net weight input quantity
                if (!r.Netweight || parseFloat(r.Netweight) <= 0) {
                    const el = document.querySelector(`.mat-field[data-idx="${idx}"][data-field="Netweight"]`);
                    if (el) el.classList.add('is-invalid');
                    isValid = false;
                }
            });
        }

        // Validate quality tests details grid rows individually
        if (testRows.length > 0) {
            testRows.forEach((r, idx) => {
                // Validate Test Name select dropdown
                if (!r.TestID) {
                    const el = document.querySelector(`.test-field[data-idx="${idx}"][data-field="TestID"]`);
                    if (el) el.classList.add('is-invalid');
                    isValid = false;
                }
                // Validate Test Method select dropdown
                if (!r.Testmethodid) {
                    const el = document.querySelector(`.test-field[data-idx="${idx}"][data-field="Testmethodid"]`);
                    if (el) el.classList.add('is-invalid');
                    isValid = false;
                }
            });
        }

        return isValid;
    }

    // ── Save (POST or PATCH) ──────────────────────────────────────────────────
    async function saveGRN() {
        if (!validateForm()) {
            showToast('Please fill all required fields and correct highlighted errors.', 'danger');
            return;
        }
        const grnNoVal = document.getElementById('GrnNo')?.value?.trim();

        const headerData = {
            GrnDate:        grnDateInput?.value || null,
            GatepassNo:     getNumVal('GatepassNo'),
            Netweight:      getNumVal('Netweight'),
            DeductedWeight: getNumVal('DeductedWeight'),
            Approvedweight: getNumVal('Approvedweight'),
            status:         getNumVal('status'),
            internalnotes:  document.getElementById('internalnotes')?.value?.trim() || '',
        };
        if (!isEdit) {
            headerData.GrnNo = grnNoVal;
        }

        const payload = {
            ...headerData,
            materials: matRows.map(r => ({
                MaterialID:  r.MaterialID  ? parseInt(r.MaterialID)  : null,
                Bags:        parseFloat(r.Bags)        || 0,
                Grossweight: parseFloat(r.Grossweight) || 0,
                Netweight:   parseFloat(r.Netweight)   || 0,
                Remarks:     r.Remarks || '',
            })),
            tests: testRows.map(r => ({
                TestID:         r.TestID         ? parseInt(r.TestID)         : null,
                Testmethodid:   r.Testmethodid   ? parseInt(r.Testmethodid)   : null,
                Testresult:     parseFloat(r.Testresult)     || 0,
                deductedweight: parseFloat(r.deductedweight) || 0,
                Remarks:        r.Remarks || '',
            })),
        };

        const method = isEdit ? 'PATCH' : 'POST';
        const url    = isEdit ? `/api/grn/${encodeURIComponent(grnNo)}/` : '/api/grn/';

        try {
            const csrfToken = getCookie('csrftoken');
            const resp = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json', 'X-CSRFToken': csrfToken },
                body: JSON.stringify(payload),
            });

            if (!resp.ok) {
                const errData = await resp.json().catch(() => ({}));
                const msg = errData.detail || JSON.stringify(errData) || 'Save failed.';
                showToast(msg, 'danger');
                return;
            }

            const saved = await resp.json();
            isFormDirty = false;
            showToast(`GRN ${isEdit ? 'updated' : 'created'} successfully!`, 'success');

            // Redirect to edit page after create
            if (!isEdit && saved.GrnNo) {
                setTimeout(() => {
                    window.location.href = `/grn/${encodeURIComponent(saved.GrnNo)}/edit/`;
                }, 800);
            }
        } catch (err) {
            console.error('Save error:', err);
            showToast('An unexpected error occurred. Please try again.', 'danger');
        }
    }

    // ── View mode lock ────────────────────────────────────────────────────────
    function lockViewMode() {
        isView = true;
        if (pageTitle) pageTitle.textContent = 'View GRN';
        form?.querySelectorAll('input, select, textarea, button').forEach(el => {
            if (el.id !== 'btnCancel' && !el.closest('a')) el.disabled = true;
        });
        document.querySelectorAll('.btn-row-add, .btn-row-delete, .btn-footer-save').forEach(el => {
            el.style.display = 'none';
        });
        renderMatTable();
        renderTestTable();
    }

    // ── Helpers ───────────────────────────────────────────────────────────────
    function setField(id, val) {
        const el = document.getElementById(id);
        if (!el) return;
        el.value = val != null ? val : '';
        if (el.value) el.closest?.('.form-group')?.classList.add('has-value');
    }

    function getText(id) {
        return document.getElementById(id)?.value?.trim() || '';
    }

    function getNumVal(id) {
        const v = document.getElementById(id)?.value;
        if (v === '' || v == null) return null;
        const n = parseFloat(v);
        return isNaN(n) ? null : n;
    }

    function setText(id, val) {
        const el = document.getElementById(id);
        if (el) el.textContent = val;
    }

    function esc(v) {
        if (v == null || v === '') return '';
        return String(v).replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    }

    function formatDate(dt) {
        if (!dt) return '';
        return dt.substring(0, 10);
    }

    function markDirty() { isFormDirty = true; }

    function getCookie(name) {
        const match = document.cookie.match(new RegExp('(^|;)\\s*' + name + '\\s*=\\s*([^;]+)'));
        return match ? match[2] : '';
    }

    /**
     * Fetches all registered Gate Pass records from the backend database REST API.
     * Stores them in `gateEntries` for the custom multi-column searchable dropdown.
     * The dropdown is rendered dynamically on open; this just loads and caches the data.
     */
    async function loadGatePasses() {
        try {
            const resp = await fetch('/api/gate-pass/');
            if (!resp.ok) throw new Error('Failed to fetch gate passes');
            gateEntries = await resp.json();
        } catch (err) {
            console.error('Failed to load Gate Passes:', err);
            showToast('Failed to load Gate Pass list.', 'danger');
        }
    }

    /**
     * Looks up gate pass details locally by ID and auto-populates
     * the corresponding header input fields.
     * If this is a manual change (user-triggered select), it also populates
     * the transaction material items list with the gate pass transaction details.
     */
    function updateGatePassDetails(gatepassId, isManualChange = false) {
        const gp = gateEntries.find(g => g.GatePassNo === parseInt(gatepassId));
        const gpDateInput = document.getElementById('GatepassDate');
        const vehicleInput = document.getElementById('VehicleNo');
        const driverInput = document.getElementById('DriverName');
        const weighmentNoInput = document.getElementById('WeighmentNo');
        const weighmentDateInput = document.getElementById('WeighmentDate');
        const netweightInput = document.getElementById('Netweight');

        if (gp) {
            if (gpDateInput) {
                if (gatepassDatePicker) gatepassDatePicker.setDate(formatDate(gp.GatePassdate));
                else gpDateInput.value = formatDate(gp.GatePassdate);
            }
            if (vehicleInput) vehicleInput.value = gp.VehicleNo || '';
            if (driverInput) driverInput.value = gp.DriverName || '';
            if (weighmentNoInput) weighmentNoInput.value = gp.WeighmentNo || '';
            if (weighmentDateInput) {
                if (weighmentDatePicker) {
                    if (gp.WeighmentDate) weighmentDatePicker.setDate(formatDate(gp.WeighmentDate));
                    else weighmentDatePicker.clear();
                } else {
                    weighmentDateInput.value = gp.WeighmentDate ? formatDate(gp.WeighmentDate) : '';
                }
            }
            if (netweightInput) netweightInput.value = gp.NetWeight || '0.00';

            // Auto-populate Material details only on manual changes
            if (isManualChange) {
                if (gp.items && gp.items.length > 0) {
                    matRows = gp.items.map(item => ({
                        MaterialID:  item.MaterialID || '',
                        Bags:        item.Bags        || '',
                        Grossweight: item.GrossWeight || '',
                        Netweight:   item.NetWeight   || '',
                        Remarks:     '',
                    }));
                } else {
                    matRows = [{ MaterialID: '', Bags: '', Grossweight: '', Netweight: '', Remarks: '' }];
                }
                renderMatTable();
                updateTotals();
            }
        } else {
            if (gpDateInput) {
                if (gatepassDatePicker) gatepassDatePicker.clear();
                else gpDateInput.value = '';
            }
            if (vehicleInput) vehicleInput.value = '';
            if (driverInput) driverInput.value = '';
            if (weighmentNoInput) weighmentNoInput.value = '';
            if (weighmentDateInput) {
                if (weighmentDatePicker) weighmentDatePicker.clear();
                else weighmentDateInput.value = '';
            }
            if (netweightInput) netweightInput.value = '';
        }

        document.querySelectorAll('.form-group input').forEach(el => {
            if (el.value) {
                el.closest('.form-group')?.classList.add('has-value');
            } else {
                el.closest('.form-group')?.classList.remove('has-value');
            }
        });
    }

    /**
     * Updates the status progress bar steps and fill line UI dynamically.
     * Sets the active classes for each workflow step (Draft -> Submitted -> etc.)
     * and calculates the width percentage of the completion progress line.
     */
    function updateProgress(statusVal) {
        const status = parseInt(statusVal) || 1;
        const steps = [1, 2, 3, 4, 5];
        const activeIndex = steps.indexOf(status);

        document.querySelectorAll('.progress-step').forEach((el, idx) => {
            el.classList.toggle('active', idx <= activeIndex);
        });

        const fill = document.getElementById('progressLineFill');
        if (fill) {
            fill.style.width = ((activeIndex / (steps.length - 1)) * 100) + '%';
        }
    }

    function showToast(message, type = 'success') {
        // Try project's existing notifications util if available
        if (window.__notifications?.show) {
            window.__notifications.show(message, type);
            return;
        }
        // Simple fallback
        const container = document.getElementById('toastContainer') || (() => {
            const d = document.createElement('div');
            d.id = 'toastContainer';
            d.style.cssText = 'position:fixed; top:16px; right:16px; z-index:9999; display:flex; flex-direction:column; gap:8px;';
            document.body.appendChild(d);
            return d;
        })();

        const toast = document.createElement('div');
        const bg = type === 'success' ? '#10b981' : type === 'danger' ? '#ef4444' : '#3b82f6';
        toast.style.cssText = `background:${bg}; color:#fff; padding:10px 16px; border-radius:6px; font-size:13px; font-weight:500; box-shadow:0 4px 12px rgba(0,0,0,0.15); opacity:0; transition:opacity 0.3s;`;
        toast.textContent = message;
        container.appendChild(toast);
        requestAnimationFrame(() => { toast.style.opacity = '1'; });
        setTimeout(() => {
            toast.style.opacity = '0';
            setTimeout(() => toast.remove(), 400);
        }, 3500);
    }

});
