import { apiClient } from '../api/client.js?v=147';
import { notifications } from '../utils/notifications.js?v=147';

// ─── Module state ────────────────────────────────────────────────────────────
const slipNo = window.WEIGHMENT_SLIP_NO || '';
const isView = window.IS_VIEW_MODE === true;
const isEdit = !!slipNo;

let matRows = [];  // [{MaterialID, materialName, Bags, GrossWeight, NetWeight, Remarks}]
let selectedGatePass = null;
let grossDatePicker = null;
let tareDatePicker = null;

// ─── Helpers ─────────────────────────────────────────────────────────────────
function getEl(id) { return document.getElementById(id); }
function getVal(id) { const el = getEl(id); return el ? el.value.trim() : ''; }
function setVal(id, v) {
    const el = getEl(id);
    if (el) {
        el.value = (v != null ? v : '');
        if (el.value !== '') {
            el.closest('.form-group')?.classList.add('has-value');
        } else {
            el.closest('.form-group')?.classList.remove('has-value');
        }
    }
}
function getNumVal(id) { const v = parseFloat(getVal(id)); return isNaN(v) ? 0 : v; }
function escHtml(str) {
    return String(str || '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

// ─── Net Weight auto-calculation ─────────────────────────────────────────────
function recalcNetWeight() {
    const gross = getNumVal('GrossWeight');
    const tare  = getNumVal('TareWeight');
    setVal('NetWeight', (gross - tare).toFixed(2));
}

// ─── Sync DOM values → matRows state (called before add/delete re-render) ────
function syncMatRowsFromDOM() {
    const tbody = getEl('matTableBody');
    if (!tbody) return;
    tbody.querySelectorAll('tr[data-row]').forEach(tr => {
        const i = parseInt(tr.dataset.row);
        if (i < 0 || i >= matRows.length) return;
        const nameInp = tr.querySelector('.mat-material-input');
        const idInp   = tr.querySelector('.mat-material-id');
        const bags    = tr.querySelector('.mat-bags');
        const gross   = tr.querySelector('.mat-gross');
        const net     = tr.querySelector('.mat-net');
        const rem     = tr.querySelector('.mat-remarks');
        if (nameInp) matRows[i].materialName = nameInp.value;
        if (idInp)   matRows[i].MaterialID   = idInp.value;
        if (bags)    matRows[i].Bags          = parseFloat(bags.value) || 0;
        if (gross)   matRows[i].GrossWeight   = parseFloat(gross.value) || 0;
        if (net)     matRows[i].NetWeight     = parseFloat(net.value) || 0;
        if (rem)     matRows[i].Remarks       = rem.value;
    });
}

// ─── Render material table (GRN-style: + and delete per row) ─────────────────
function renderMatTable() {
    const tbody = getEl('matTableBody');
    if (!tbody) return;
    tbody.innerHTML = '';

    matRows.forEach((row, idx) => {
        const tr = document.createElement('tr');
        tr.dataset.row = idx;
        tr.innerHTML = `
            <td class="text-center" style="font-size:11px; color:#64748b; font-weight:600;">${idx + 1}</td>
            <td>
                <div style="position:relative;">
                    <input type="text" class="form-control mat-material-input"
                           placeholder="Search material..." data-row="${idx}"
                           value="${escHtml(row.materialName || '')}" autocomplete="off"
                           ${isView ? 'readonly' : ''}>
                    <div class="mat-dropdown card shadow"
                         style="display:none; position:absolute; z-index:999; left:0; right:0;
                                top:28px; padding:4px 0 !important; max-height:150px;
                                overflow-y:auto; border-radius:4px;"></div>
                    <input type="hidden" class="mat-material-id" data-row="${idx}"
                           value="${escHtml(row.MaterialID || '')}">
                </div>
            </td>
            <td>
                <input type="number" step="0.01" class="form-control text-end mat-bags"
                       data-row="${idx}" value="${row.Bags || 0}" min="0"
                       ${isView ? 'disabled' : ''}>
            </td>
            <td>
                <input type="number" step="0.01" class="form-control text-end mat-gross"
                       data-row="${idx}" value="${row.GrossWeight || 0}" min="0"
                       ${isView ? 'disabled' : ''}>
            </td>
            <td>
                <input type="number" step="0.01" class="form-control text-end mat-net"
                       data-row="${idx}" value="${row.NetWeight || 0}" min="0"
                       style="background:#f0fdf4 !important; color:#16a34a !important; font-weight:600;"
                       ${isView ? 'disabled' : ''}>
            </td>
            <td>
                <input type="text" class="form-control mat-remarks"
                       data-row="${idx}" value="${escHtml(row.Remarks || '')}"
                       placeholder="Remarks" ${isView ? 'disabled' : ''}>
            </td>
            <td class="text-center align-middle" style="white-space:nowrap;">
                ${!isView ? `
                    <div class="d-flex justify-content-center align-items-center gap-2">
                        <button type="button" class="erp-action-btn erp-btn-add mat-add-btn"
                                data-row="${idx}" title="Add Row">
                            <i class="bi bi-plus-lg" style="font-size:15px; font-weight:bold;"></i>
                        </button>
                        ${idx > 0 ? `
                            <button type="button" class="erp-action-btn erp-btn-delete mat-delete-btn"
                                    data-row="${idx}" title="Delete Row">
                                <i class="bi bi-trash" style="font-size:14px;"></i>
                            </button>
                        ` : ''}
                    </div>
                ` : ''}
            </td>
        `;
        tbody.appendChild(tr);
    });

    bindAllMatRowEvents();
    updateTotals();
}

// ─── Bind events for all rows after render ───────────────────────────────────
function bindAllMatRowEvents() {
    const tbody = getEl('matTableBody');
    if (!tbody) return;

    // Live totals
    tbody.querySelectorAll('.mat-bags, .mat-gross, .mat-net').forEach(el => {
        el.addEventListener('input', updateTotals);
    });

    // + Add row: insert blank row after current index
    tbody.querySelectorAll('.mat-add-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            syncMatRowsFromDOM();
            const idx = parseInt(btn.dataset.row);
            matRows.splice(idx + 1, 0, {
                MaterialID: '', materialName: '',
                Bags: 0, GrossWeight: 0, NetWeight: 0, Remarks: ''
            });
            renderMatTable();
        });
    });

    // Delete row
    tbody.querySelectorAll('.mat-delete-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            syncMatRowsFromDOM();
            const idx = parseInt(btn.dataset.row);
            matRows.splice(idx, 1);
            renderMatTable();
        });
    });

    // Material AJAX search dropdown per row
    tbody.querySelectorAll('tr[data-row]').forEach(tr => {
        const matInput = tr.querySelector('.mat-material-input');
        const matHid   = tr.querySelector('.mat-material-id');
        const matDrop  = tr.querySelector('.mat-dropdown');

        if (matInput && matDrop) {
            let debounce;
            matInput.addEventListener('input', () => {
                clearTimeout(debounce);
                const q = matInput.value.trim();
                if (!q) { matDrop.style.display = 'none'; return; }
                debounce = setTimeout(async () => {
                    try {
                        const res = await apiClient.get('/api/subsection-x/', {
                            params: { search: q, page_size: 20 }
                        });
                        const items = (res.results || res || [])
                            .filter(i => i.material_name || i.MaterialName);
                        if (!items.length) { matDrop.style.display = 'none'; return; }
                        matDrop.innerHTML = items.map(i => {
                            const name = i.material_name || i.MaterialName || '';
                            const id   = i.id || i.material_id || '';
                            return `<div class="dropdown-item py-1"
                                        style="font-size:12px; cursor:pointer;"
                                        data-id="${escHtml(id)}"
                                        data-name="${escHtml(name)}">${escHtml(name)}</div>`;
                        }).join('');
                        matDrop.style.display = 'block';

                        matDrop.querySelectorAll('.dropdown-item').forEach(item => {
                            item.addEventListener('mousedown', e => {
                                e.preventDefault();
                                const rowIdx = parseInt(tr.dataset.row);
                                matInput.value = item.dataset.name;
                                if (matHid) matHid.value = item.dataset.id;
                                if (rowIdx >= 0 && rowIdx < matRows.length) {
                                    matRows[rowIdx].materialName = item.dataset.name;
                                    matRows[rowIdx].MaterialID   = item.dataset.id;
                                }
                                matDrop.style.display = 'none';
                            });
                        });
                    } catch { matDrop.style.display = 'none'; }
                }, 250);
            });

            matInput.addEventListener('blur', () => {
                setTimeout(() => { matDrop.style.display = 'none'; }, 200);
            });
        }
    });
}

// ─── Totals ───────────────────────────────────────────────────────────────────
function updateTotals() {
    const tbody = getEl('matTableBody');
    if (!tbody) return;
    let totalBags = 0, totalGross = 0, totalNet = 0;
    tbody.querySelectorAll('tr').forEach(tr => {
        totalBags  += parseFloat(tr.querySelector('.mat-bags')?.value  || 0) || 0;
        totalGross += parseFloat(tr.querySelector('.mat-gross')?.value || 0) || 0;
        totalNet   += parseFloat(tr.querySelector('.mat-net')?.value   || 0) || 0;
    });
    const tBags  = getEl('totalBags');
    const tGross = getEl('totalGrossWt');
    const tNet   = getEl('totalNetWt');
    if (tBags)  tBags.textContent  = totalBags.toFixed(2);
    if (tGross) tGross.textContent = totalGross.toFixed(2);
    if (tNet)   tNet.textContent   = totalNet.toFixed(2);
}

// ─── Collect rows for API save (SP payload) ──────────────────────────────────
function collectMatRows() {
    const tbody = getEl('matTableBody');
    if (!tbody) return [];
    const rows = [];
    tbody.querySelectorAll('tr').forEach(tr => {
        rows.push({
            MaterialID:  tr.querySelector('.mat-material-id')?.value  || null,
            Bags:        parseFloat(tr.querySelector('.mat-bags')?.value  || 0) || 0,
            GrossWeight: parseFloat(tr.querySelector('.mat-gross')?.value || 0) || 0,
            NetWeight:   parseFloat(tr.querySelector('.mat-net')?.value   || 0) || 0,
            Remarks:     tr.querySelector('.mat-remarks')?.value || '',
        });
    });
    return rows;
}

// ─── Multi-column Gate Pass dropdown wiring ────────────────────────────────
function initGatePassDropdown() {
    const gpDisplayInput  = getEl('GatePassNoDisplay');
    const gpHiddenInput   = getEl('GatePassNo');
    const gpDropdownPanel = getEl('gpDropdownPanel');
    const gpDropdownList  = getEl('gpDropdownList');
    const gpSearchInput   = getEl('gpSearchInput');
    if (!gpDisplayInput || !gpHiddenInput || !gpDropdownPanel || !gpDropdownList) return;

    // Detach panel to document.body to escape parent stacking/clipping
    if (gpDropdownPanel.parentNode !== document.body) {
        document.body.appendChild(gpDropdownPanel);
    }

    function openGpDropdown() {
        if (isView) return;
        const rect = gpDisplayInput.getBoundingClientRect();
        gpDropdownPanel.style.display  = 'flex';
        gpDropdownPanel.style.top      = (rect.bottom + 4) + 'px';
        gpDropdownPanel.style.left     = (rect.left)     + 'px';
        gpDropdownPanel.style.position = 'fixed';
        gpDropdownPanel.style.zIndex   = '999999';
        if (gpSearchInput) { gpSearchInput.value = ''; gpSearchInput.focus(); }
        renderGpDropdownRows('');
    }

    function closeGpDropdown() {
        gpDropdownPanel.style.display = 'none';
    }

    async function loadGatePasses() {
        try {
            const res = await apiClient.get('/api/gate-pass/');
            return res.results || res || [];
        } catch {
            return [];
        }
    }

    let gateEntries = [];

    async function renderGpDropdownRows(query) {
        if (gateEntries.length === 0) {
            gateEntries = await loadGatePasses();
        }
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
                <span>${String(gp.DriverName || '—')}</span>
                <span>${String(gp.VehicleNo  || '—')}</span>
                <span>${String(gp.WeighmentNo || '—')}</span>
            `;
            row.addEventListener('mouseenter', () => row.style.backgroundColor = '#eff6ff');
            row.addEventListener('mouseleave', () => row.style.backgroundColor = '');
            row.addEventListener('click', () => {
                selectedGatePass = gp.GatePassNo;
                gpHiddenInput.value = gp.GatePassNo;
                gpDisplayInput.value = `GP-${gp.GatePassNo + 10000}`;
                setVal('GatePassDate', gp.GatePassdate ? gp.GatePassdate.split('T')[0] : '');
                setVal('VehicleNo',    gp.VehicleNo);
                setVal('DriverName',   gp.DriverName);

                // Auto-populate header weights from selected Gate Pass
                setVal('GrossWeight', gp.GrossWeight || '');
                setVal('TareWeight',  gp.TareWeight  || '');
                setVal('NetWeight',   gp.NetWeight   || '');

                // Auto-populate Material details from selected Gate Pass items
                function getMaterialNameById(id) {
                    const list = window.MATERIALS_LIST || [];
                    const found = list.find(m => String(m.id) === String(id));
                    return found ? found.name : '';
                }

                if (gp.items && gp.items.length > 0) {
                    matRows = gp.items.map(item => {
                        const matId = item.MaterialID || '';
                        return {
                            MaterialID:   matId,
                            materialName: getMaterialNameById(matId) || String(matId),
                            Bags:         parseFloat(item.Bags) || 0,
                            GrossWeight:  parseFloat(item.GrossWeight) || 0,
                            NetWeight:    parseFloat(item.NetWeight) || 0,
                            Remarks:      ''
                        };
                    });
                } else {
                    matRows = [{ MaterialID: '', materialName: '', Bags: 0, GrossWeight: 0, NetWeight: 0, Remarks: '' }];
                }
                renderMatTable();
                updateTotals();

                closeGpDropdown();
                gpDisplayInput.closest('.form-group')?.classList.add('has-value');
            });
            gpDropdownList.appendChild(row);
        });
    }

    // Toggle dropdown on display input click
    gpDisplayInput.addEventListener('click', (e) => {
        e.stopPropagation();
        if (gpDropdownPanel.style.display === 'flex') {
            closeGpDropdown();
        } else {
            openGpDropdown();
        }
    });

    if (gpSearchInput) {
        gpSearchInput.addEventListener('input', () => {
            renderGpDropdownRows(gpSearchInput.value);
        });
    }

    // Prevent clicks inside panel from closing it
    gpDropdownPanel.addEventListener('click', (e) => e.stopPropagation());

    // Document click to close panel
    document.addEventListener('click', (e) => {
        if (!e.target.closest('#gpDropdownGroup') && !e.target.closest('#gpDropdownPanel')) {
            closeGpDropdown();
        }
    });
}

function clearGatePassFields() {
    setVal('GatePassDate', '');
    setVal('VehicleNo', '');
    setVal('DriverName', '');
}

// ─── Auto / Manual Toggle ─────────────────────────────────────────────────────
function initAutoManualToggle() {
    const btnAuto   = getEl('toggleAuto');
    const btnManual = getEl('toggleManual');
    const hidInput  = getEl('AutoManual');
    if (!btnAuto || !btnManual || !hidInput) return;

    function setToggle(val) {
        hidInput.value = val;
        if (val === 'Auto') {
            btnAuto.classList.add('active');
            btnManual.classList.remove('active');
        } else {
            btnManual.classList.add('active');
            btnAuto.classList.remove('active');
        }
    }

    btnAuto.addEventListener('click',   () => { if (!isView) setToggle('Auto'); });
    btnManual.addEventListener('click', () => { if (!isView) setToggle('Manual'); });
}

// ─── Populate form from API (Edit / View mode) ────────────────────────────────
function populateForm(data) {
    setVal('WeighmentSlipNo', data.WeighmentSlipNo);

    if (data.GatePassNo) {
        selectedGatePass = data.GatePassNo;
        setVal('GatePassNo', data.GatePassNo);
        setVal('GatePassNoDisplay', `GP-${10000 + parseInt(data.GatePassNo)}`);
        getEl('GatePassNoDisplay')?.closest('.form-group')?.classList.add('has-value');
    }
    setVal('GrossWeight',   data.GrossWeight);
    setVal('TareWeight',    data.TareWeight);
    if (grossDatePicker) {
        grossDatePicker.setDate(data.GrossDateTime ? data.GrossDateTime.slice(0, 16) : null);
    } else {
        setVal('GrossDateTime', data.GrossDateTime ? data.GrossDateTime.slice(0, 16) : '');
    }

    if (tareDatePicker) {
        tareDatePicker.setDate(data.TareDateTime ? data.TareDateTime.slice(0, 16) : null);
    } else {
        setVal('TareDateTime',  data.TareDateTime  ? data.TareDateTime.slice(0, 16)  : '');
    }
    setVal('VehicleType',   data.VehicleType);
    setVal('Purchaser',     data.Purchaser);
    setVal('Seller',        data.Seller);
    setVal('Remarks',       data.Remarks);
    setVal('status',        data.status);

    // AutoManual toggle
    const am = data.AutoManual || 'Manual';
    setVal('AutoManual', am);
    const btnAuto   = getEl('toggleAuto');
    const btnManual = getEl('toggleManual');
    if (btnAuto && btnManual) {
        if (am === 'Auto') {
            btnAuto.classList.add('active');
            btnManual.classList.remove('active');
        } else {
            btnManual.classList.add('active');
            btnAuto.classList.remove('active');
        }
    }

    // Build matRows from API response
    matRows = [];
    (data.materials || []).forEach(m => {
        matRows.push({
            MaterialID:   m.MaterialID,
            materialName: m.material_name || String(m.MaterialID || ''),
            Bags:         m.Bags        || 0,
            GrossWeight:  m.GrossWeight || 0,
            NetWeight:    m.NetWeight   || 0,
            Remarks:      m.Remarks     || '',
        });
    });

    // Ensure at least one blank row in edit mode
    if (!isView && matRows.length === 0) {
        matRows.push({ MaterialID: '', materialName: '', Bags: 0, GrossWeight: 0, NetWeight: 0, Remarks: '' });
    }

    renderMatTable();

    // Override NetWeight with stored header value (not row sum)
    setVal('NetWeight', data.NetWeight);
    updateTotals();
}

// ─── Save — routes through sp_manage_weighment via API ───────────────────────
async function saveWeighment() {
    const slipNoVal = getVal('WeighmentSlipNo');
    if (isEdit && !slipNoVal) {
        notifications.error('Weighment Slip No is required.');
        return;
    }

    const headerData = {
        WeighmentSlipNo: slipNoVal || '',
        GatePassNo:      selectedGatePass ||
                         parseInt(getVal('GatePassNo')) ||
                         (parseInt(getVal('GatePassNoDisplay').replace(/[^0-9]/g, '')) - 10000) || null,
        GrossWeight:     getNumVal('GrossWeight'),
        TareWeight:      getNumVal('TareWeight'),
        NetWeight:       getNumVal('NetWeight'),
        GrossDateTime:   getVal('GrossDateTime') || null,
        TareDateTime:    getVal('TareDateTime')  || null,
        AutoManual:      getVal('AutoManual') || 'Manual',
        VehicleType:     getVal('VehicleType') || null,
        Purchaser:       getVal('Purchaser')   || null,
        Seller:          getVal('Seller')      || null,
        Remarks:         getVal('Remarks')     || null,
        status:          parseInt(getVal('status')) || 1,
    };

    const materials = collectMatRows();
    const payload   = { ...headerData, materials };

    const saveBtn = getEl('saveBtn');
    if (saveBtn) {
        saveBtn.disabled = true;
        saveBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-1" role="status"></span> Saving...';
    }

    try {
        let response;
        if (isEdit) {
            response = await apiClient.patch(`/api/weighment/${encodeURIComponent(slipNo)}/`, payload);
            notifications.success(`Weighment Slip ${slipNoVal} updated successfully.`);
        } else {
            response = await apiClient.post('/api/weighment/', payload);
            notifications.success(`Weighment Slip ${slipNoVal} created successfully.`);
            const newSlip = response.WeighmentSlipNo || slipNoVal;
            setTimeout(() => {
                window.location.href = `/weighment/${encodeURIComponent(newSlip)}/edit/`;
            }, 800);
        }
    } catch (err) {
        const detail =
            err.responseData?.detail ||
            err.responseData?.WeighmentSlipNo?.[0] ||
            JSON.stringify(err.responseData || 'Save failed.');
        notifications.error(`Save failed: ${detail}`);
    } finally {
        if (saveBtn) {
            saveBtn.disabled = false;
            saveBtn.innerHTML = '<i class="bi bi-floppy me-1"></i> Save';
        }
    }
}

// ─── Init ─────────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', async () => {
    // Auto/Manual toggle
    initAutoManualToggle();

    // Gate Pass dropdown (edit/create only)
    if (!isView) initGatePassDropdown();

    // Gross / Tare → Net auto-calc
    ['GrossWeight', 'TareWeight'].forEach(id => {
        const el = getEl(id);
        if (el) el.addEventListener('input', recalcNetWeight);
    });

    // Capture weight button (hardware placeholder)
    const captureBtn = getEl('captureWeightBtn');
    if (captureBtn) {
        captureBtn.addEventListener('click', () => {
            notifications.info(
                'Weighbridge capture requires hardware integration. Please enter weight manually.'
            );
        });
    }
    // Initialize Flatpickr for Gross Date & Time and Tare Date & Time
    const grossDateInput = getEl('GrossDateTime');
    if (window.flatpickr && grossDateInput) {
        grossDatePicker = window.flatpickr(grossDateInput, {
            enableTime: true,
            dateFormat: 'Y-m-d H:i',
            altInput: true,
            altFormat: 'd-m-Y h:i K',
            allowInput: !isView,
            clickOpens: !isView,
        });
    }

    const tareDateInput = getEl('TareDateTime');
    if (window.flatpickr && tareDateInput) {
        tareDatePicker = window.flatpickr(tareDateInput, {
            enableTime: true,
            dateFormat: 'Y-m-d H:i',
            altInput: true,
            altFormat: 'd-m-Y h:i K',
            allowInput: !isView,
            clickOpens: !isView,
        });
    }

    // Dynamic floating label toggle for all inputs/selects/textareas
    document.querySelectorAll('.form-group input, .form-group select, .form-group textarea').forEach(el => {
        const toggleClass = () => {
            if (el.value !== '') {
                el.closest('.form-group')?.classList.add('has-value');
            } else {
                el.closest('.form-group')?.classList.remove('has-value');
            }
        };
        el.addEventListener('input', toggleClass);
        el.addEventListener('change', toggleClass);
        // Run once initially
        toggleClass();
    });

    // Load existing record (Edit / View mode)
    if (slipNo) {
        try {
            const data = await apiClient.get(`/api/weighment/${encodeURIComponent(slipNo)}/`);
            populateForm(data);
        } catch (err) {
            notifications.error('Failed to load Weighment record.');
            console.error(err);
        }
    } else {
        // New slip: one blank row, default values
        matRows = [{
            MaterialID: '', materialName: '',
            Bags: 0, GrossWeight: 0, NetWeight: 0, Remarks: ''
        }];
        renderMatTable();
        setVal('status', '1');
        setVal('AutoManual', 'Auto');
        // Pre-fill Gross DateTime to now (local)
        if (grossDatePicker) {
            grossDatePicker.setDate(new Date());
        } else {
            setVal('GrossDateTime', new Date().toISOString().slice(0, 16));
        }
        // WeighmentSlipNo placeholder
        const slipInput = getEl('WeighmentSlipNo');
        if (slipInput) {
            slipInput.placeholder = '(Auto-Generated)';
            slipInput.value = '';
            slipInput.closest('.form-group')?.classList.add('has-value');
        }
    }

    // Save button
    const saveBtn = getEl('saveBtn');
    if (saveBtn) saveBtn.addEventListener('click', saveWeighment);
});
