import { apiClient } from '../api/client.js?v=149';
import { notifications } from '../utils/notifications.js?v=147';

// ─── Module state ────────────────────────────────────────────────────────────
const challanNo = window.CHALLAN_NO || '';
const isView    = window.IS_VIEW_MODE === true;
const isEdit    = !!challanNo;

let matRows = [];  // [{MaterialID, materialName, Bags, GrossWeight, NetWeight, Remarks}]
let selectedGatePass = null;
let selectedPO       = null;   // { po_no, po_date, supplier_name }
let challanDatePicker = null;
let poDatePicker = null;

// ─── Helpers ─────────────────────────────────────────────────────────────────
function getEl(id) { return document.getElementById(id); }
function getVal(id) { const el = getEl(id); return el ? el.value.trim() : ''; }
function setVal(id, v) {
    const el = getEl(id);
    if (!el) return;

    if (el.tagName === 'SELECT' && id === 'SupplierName') {
        const valStr = (v != null ? String(v).trim() : '');
        if (valStr) {
            let found = Array.from(el.options).some(opt => opt.value === valStr);
            if (!found) {
                const newOpt = new Option(valStr, valStr, true, true);
                el.add(newOpt);
            }
            el.value = valStr;
        } else {
            el.value = '';
        }
    } else {
        el.value = (v != null ? v : '');
    }

    if (el.value !== '') {
        el.closest('.form-group')?.classList.add('has-value');
    } else {
        el.closest('.form-group')?.classList.remove('has-value');
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

// ─── Sync Status Stepper Progress Bar ─────────────────────────────────────────
function updateStatusStepper(statusId) {
    const sid = parseInt(statusId) || 1;
    const steps = document.querySelectorAll('.progress-step');
    steps.forEach(step => {
        const sVal = parseInt(step.dataset.status);
        if (sVal <= sid) {
            step.classList.add('active');
        } else {
            step.classList.remove('active');
        }
    });

    const fillLine = getEl('statusProgressFill');
    if (fillLine) {
        const pct = Math.max(0, Math.min(100, (sid - 1) * 25));
        fillLine.style.width = pct + '%';
    }
}

// ─── Sync DOM values → matRows state ────────────────────────────────────────
function syncMatRowsFromDOM() {
    const tbody = getEl('matTableBody');
    if (!tbody) return;
    tbody.querySelectorAll('tr[data-row]').forEach(tr => {
        const i = parseInt(tr.dataset.row);
        if (i < 0 || i >= matRows.length) return;
        const idSelect = tr.querySelector('.mat-material-id');
        const bags     = tr.querySelector('.mat-bags');
        const gross    = tr.querySelector('.mat-gross');
        const net      = tr.querySelector('.mat-net');
        const rem      = tr.querySelector('.mat-remarks');
        if (idSelect) {
            matRows[i].MaterialID = idSelect.value;
            const selectedOpt = idSelect.options[idSelect.selectedIndex];
            matRows[i].materialName = selectedOpt ? selectedOpt.text : '';
        }
        if (bags)    matRows[i].Bags          = parseFloat(bags.value) || 0;
        if (gross)   matRows[i].GrossWeight   = parseFloat(gross.value) || 0;
        if (net)     matRows[i].NetWeight     = parseFloat(net.value) || 0;
        if (rem)     matRows[i].Remarks       = rem.value;
    });
}

// ─── Render material table ──────────────────────────────────────────────────
function renderMatTable() {
    const tbody = getEl('matTableBody');
    if (!tbody) return;
    tbody.innerHTML = '';

    matRows.forEach((row, idx) => {
        const tr = document.createElement('tr');
        tr.dataset.row = idx;
        
        let matSelectHTML = `<select class="form-select mat-material-id" data-row="${idx}" ${isView ? 'disabled' : ''}>`;
        matSelectHTML += '<option value="">-- Select Material --</option>';
        (window.MATERIALS_LIST || []).forEach(m => {
            const selected = String(row.MaterialID) === String(m.id) ? 'selected' : '';
            matSelectHTML += `<option value="${m.id}" ${selected}>${escHtml(m.name)}</option>`;
        });
        matSelectHTML += '</select>';

        tr.innerHTML = `
            <td class="text-center" style="font-size:11px; color:#64748b; font-weight:600;">${idx + 1}</td>
            <td>
                ${matSelectHTML}
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

    // Live totals and updates
    tbody.querySelectorAll('.mat-bags, .mat-gross, .mat-net').forEach(el => {
        el.addEventListener('input', updateTotals);
    });

    tbody.querySelectorAll('.mat-material-id').forEach(select => {
        select.addEventListener('change', () => {
            syncMatRowsFromDOM();
        });
    });

    // + Add row
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

    // Also update header summary inputs
    setVal('Bags', totalBags.toFixed(2));
    setVal('NetWeight', totalNet.toFixed(2));
}

// ─── Collect rows for API save ────────────────────────────────────────────────
function collectMatRows() {
    const tbody = getEl('matTableBody');
    if (!tbody) return [];
    const rows = [];
    tbody.querySelectorAll('tr').forEach(tr => {
        const idSelect = tr.querySelector('.mat-material-id');
        rows.push({
            MaterialID:  idSelect ? idSelect.value || null : null,
            Bags:        parseFloat(tr.querySelector('.mat-bags')?.value  || 0) || 0,
            GrossWeight: parseFloat(tr.querySelector('.mat-gross')?.value || 0) || 0,
            NetWeight:   parseFloat(tr.querySelector('.mat-net')?.value   || 0) || 0,
            Remarks:     tr.querySelector('.mat-remarks')?.value || '',
        });
    });
    return rows;
}

// ─── Multi-column Gate Pass dropdown ─────────────────────────────────────────
function initGatePassDropdown() {
    const gpDisplayInput  = getEl('GatePassNoDisplay');
    const gpHiddenInput   = getEl('GatePassNo');
    const gpDropdownPanel = getEl('gpDropdownPanel');
    const gpDropdownList  = getEl('gpDropdownList');
    const gpSearchInput   = getEl('gpSearchInput');
    if (!gpDisplayInput || !gpHiddenInput || !gpDropdownPanel || !gpDropdownList) return;

    // Detach panel to document.body
    if (gpDropdownPanel.parentNode !== document.body) {
        document.body.appendChild(gpDropdownPanel);
    }

    function openGpDropdown() {
        if (isView) return;
        const rect = gpDisplayInput.getBoundingClientRect();
        const winWidth = window.innerWidth;
        const winHeight = window.innerHeight;

        const panelWidth = Math.min(620, winWidth - 30);
        gpDropdownPanel.style.minWidth = '0px';
        gpDropdownPanel.style.width    = panelWidth + 'px';

        // Calculate left position so panel stays within viewport
        let left = rect.left;
        if (left + panelWidth > winWidth - 15) {
            left = Math.max(15, rect.right - panelWidth);
        }
        if (left + panelWidth > winWidth - 15) {
            left = Math.max(15, winWidth - panelWidth - 15);
        }

        // Calculate top position & max height so it never overflows viewport bottom
        const desiredMaxHeight = 340;
        let top = rect.bottom + 4;
        let spaceBelow = winHeight - top - 15;

        if (spaceBelow < 200 && rect.top > 200) {
            top = Math.max(15, rect.top - desiredMaxHeight - 4);
            spaceBelow = rect.top - top - 4;
        }

        const maxH = Math.max(160, Math.min(desiredMaxHeight, spaceBelow));
        gpDropdownPanel.style.maxHeight = maxH + 'px';

        gpDropdownPanel.style.display  = 'flex';
        gpDropdownPanel.style.top      = top + 'px';
        gpDropdownPanel.style.left     = left + 'px';
        gpDropdownPanel.style.position = 'fixed';
        gpDropdownPanel.style.zIndex   = '999999';

        const closeBtn = getEl('gpDropdownCloseBtn');
        if (closeBtn) closeBtn.onclick = closeGpDropdown;

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

        const countEl = getEl('gpDropdownCount');
        if (countEl) countEl.textContent = `${filtered.length} entries found`;

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

                // Auto-fill header fields from gate pass
                setVal('GatePassDate',   gp.GatePassdate ? gp.GatePassdate.split('T')[0] : '');
                setVal('VehicleNo',      gp.VehicleNo);
                setVal('DriverName',     gp.DriverName);
                setVal('WeighmentSlipNo', gp.WeighmentNo || '');
                setVal('WeighmentDate',  gp.WeighmentDate ? gp.WeighmentDate.split('T')[0] : '');
                setVal('Bags',           gp.Bags       || '');
                setVal('NetWeight',      gp.NetWeight   || '');
                // Auto-fill Supplier Name from Gate Entry linked to this Gate Pass
                if (gp.supplier_name) {
                    setVal('SupplierName', gp.supplier_name);
                }

                // Auto-populate Material rows from gate pass items
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

    gpDisplayInput.addEventListener('click', (e) => {
        e.stopPropagation();
        if (gpDropdownPanel.style.display === 'flex') {
            closeGpDropdown();
        } else {
            openGpDropdown();
        }
    });

    gpDisplayInput.addEventListener('focus', () => {
        if (gpDropdownPanel.style.display !== 'flex') {
            openGpDropdown();
        }
    });

    gpDisplayInput.addEventListener('input', () => {
        if (gpDropdownPanel.style.display !== 'flex') {
            openGpDropdown();
        }
        if (gpSearchInput) gpSearchInput.value = gpDisplayInput.value;
        gpHiddenInput.value = gpDisplayInput.value;
        renderGpDropdownRows(gpDisplayInput.value);
    });

    if (gpSearchInput) {
        gpSearchInput.addEventListener('input', () => {
            gpDisplayInput.value = gpSearchInput.value;
            gpHiddenInput.value = gpSearchInput.value;
            gpDisplayInput.closest('.form-group')?.classList.toggle('has-value', gpSearchInput.value !== '');
            renderGpDropdownRows(gpSearchInput.value);
        });
    }

    gpDropdownPanel.addEventListener('click', (e) => e.stopPropagation());

    document.addEventListener('click', (e) => {
        if (!e.target.closest('#gpDropdownGroup') && !e.target.closest('#gpDropdownPanel')) {
            closeGpDropdown();
        }
    });
}

// ─── PO No Smart Dropdown ─────────────────────────────────────────────────────
function initPODropdown() {
    const poDisplayInput  = getEl('PONODisplay');
    const poHiddenInput   = getEl('PONO');
    const poDropdownPanel = getEl('poDropdownPanel');
    const poDropdownList  = getEl('poDropdownList');
    const poSearchInput   = getEl('poSearchInput');

    if (!poDisplayInput || !poHiddenInput || !poDropdownPanel || !poDropdownList) return;

    if (poDropdownPanel.parentNode !== document.body) {
        document.body.appendChild(poDropdownPanel);
    }

    function openPoDropdown() {
        const rect = poDisplayInput.getBoundingClientRect();
        const panelWidth = Math.max(rect.width, 480);
        poDropdownPanel.style.minWidth = '0px';
        poDropdownPanel.style.width = panelWidth + 'px';
        const spaceBelow = window.innerHeight - rect.bottom - 10;
        const maxH = Math.max(spaceBelow, 200);
        poDropdownPanel.style.maxHeight = maxH + 'px';
        poDropdownPanel.style.display = 'flex';
        poDropdownPanel.style.top  = (rect.bottom + 2) + 'px';
        poDropdownPanel.style.left = rect.left + 'px';
        poDropdownPanel.style.position = 'fixed';
        poDropdownPanel.style.zIndex = '999999';
        const closeBtn = getEl('poDropdownCloseBtn');
        if (closeBtn) closeBtn.onclick = closePoDropdown;
        renderPoDropdownRows(poDisplayInput.value || '');
    }

    function closePoDropdown() {
        poDropdownPanel.style.display = 'none';
    }

    let poEntries = [];

    async function loadPOs() {
        try {
            const res = await fetch('/api/po-list-for-challan/');
            if (!res.ok) return [];
            return await res.json();
        } catch { return []; }
    }

    async function renderPoDropdownRows(query) {
        if (poEntries.length === 0) {
            poEntries = await loadPOs();
        }
        const q = (query || '').toLowerCase().trim();
        const filtered = poEntries.filter(po => {
            return !q ||
                (po.po_no || '').toLowerCase().includes(q) ||
                (po.supplier_name || '').toLowerCase().includes(q) ||
                (po.po_date || '').toLowerCase().includes(q);
        });

        const countEl = getEl('poDropdownCount');
        if (countEl) countEl.textContent = `${filtered.length} records found`;

        poDropdownList.innerHTML = '';
        if (filtered.length === 0) {
            poDropdownList.innerHTML = '<div style="padding:10px 12px; color:#6b7280; font-size:12px;">No records found</div>';
            return;
        }
        filtered.forEach(po => {
            const row = document.createElement('div');
            row.style.cssText = 'display:grid; grid-template-columns:140px 110px 1fr; padding:6px 10px; font-size:12px; cursor:pointer; border-bottom:1px solid #f1f5f9; color:#334155;';
            row.innerHTML = `
                <span style="font-weight:600; color:#2563eb;">${escHtml(po.po_no)}</span>
                <span>${escHtml(po.po_date || '—')}</span>
                <span>${escHtml(po.supplier_name || '—')}</span>
            `;
            row.addEventListener('mouseenter', () => row.style.backgroundColor = '#eff6ff');
            row.addEventListener('mouseleave', () => row.style.backgroundColor = '');
            row.addEventListener('click', () => {
                selectedPO = po;
                poHiddenInput.value    = po.po_no;
                poDisplayInput.value   = po.po_no;
                poDisplayInput.closest('.form-group')?.classList.add('has-value');
                setVal('PODate',        po.po_date || '');
                setVal('SupplierName',  po.supplier_name || '');
                closePoDropdown();
            });
            poDropdownList.appendChild(row);
        });
    }

    poDisplayInput.addEventListener('click', (e) => {
        e.stopPropagation();
        if (poDropdownPanel.style.display === 'flex') {
            closePoDropdown();
        } else {
            openPoDropdown();
        }
    });

    poDisplayInput.addEventListener('focus', () => {
        if (poDropdownPanel.style.display !== 'flex') {
            openPoDropdown();
        }
    });

    poDisplayInput.addEventListener('input', () => {
        if (poDropdownPanel.style.display !== 'flex') {
            openPoDropdown();
        }
        if (poSearchInput) poSearchInput.value = poDisplayInput.value;
        poHiddenInput.value = poDisplayInput.value;
        renderPoDropdownRows(poDisplayInput.value);
    });

    if (poSearchInput) {
        poSearchInput.addEventListener('input', () => {
            poDisplayInput.value = poSearchInput.value;
            poHiddenInput.value = poSearchInput.value;
            poDisplayInput.closest('.form-group')?.classList.toggle('has-value', poSearchInput.value !== '');
            renderPoDropdownRows(poSearchInput.value);
        });
    }

    poDropdownPanel.addEventListener('click', (e) => e.stopPropagation());

    document.addEventListener('click', (e) => {
        if (!e.target.closest('#poDropdownGroup') && !e.target.closest('#poDropdownPanel')) {
            closePoDropdown();
        }
    });
}

// ─── Populate form from API (Edit / View mode) ────────────────────────────────
function populateForm(data) {
    setVal('ChallanNo',       data.ChallanNo);
    setVal('ChallanDate',     data.ChallanDate ? data.ChallanDate.split('T')[0] : '');
    // PO No — restore both hidden and display inputs
    if (data.PONO) {
        setVal('PONO',         data.PONO);
        const poDisp = getEl('PONODisplay');
        if (poDisp) { poDisp.value = data.PONO; poDisp.closest('.form-group')?.classList.add('has-value'); }
    }
    setVal('PODate',          data.PODate  ? data.PODate.split('T')[0] : '');
    const statusVal = data.StatusId || 1;
    setVal('StatusId',        statusVal);
    updateStatusStepper(statusVal);
    setVal('Notes',           data.Notes);
    setVal('SupplierName',    data.SupplierName || '');

    // Gate Pass
    if (data.GPNo) {
        selectedGatePass = data.GPNo;
        setVal('GatePassNo', data.GPNo);
        setVal('GatePassNoDisplay', `GP-${10000 + parseInt(data.GPNo)}`);
        getEl('GatePassNoDisplay')?.closest('.form-group')?.classList.add('has-value');
    }

    // Auto-filled fields
    setVal('GatePassDate',    data.GatePassDate);
    setVal('VehicleNo',       data.VehicleNo);
    setVal('DriverName',      data.DriverName);
    setVal('WeighmentSlipNo', data.WeighmentSlipNo);
    setVal('WeighmentDate',   data.WeighmentDate);
    setVal('Bags',            data.Bags);
    setVal('NetWeight',       data.NetWeight);

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
    updateTotals();
}

// ─── Reset form to blank after new entry save ────────────────────────────────
function resetForm() {
    selectedGatePass = null;
    selectedPO = null;

    // Reset Challan No
    const cnInput = getEl('ChallanNo');
    if (cnInput) {
        cnInput.value = '';
        cnInput.placeholder = '(Auto-Generated)';
    }

    // Reset Challan Date to today
    const today = new Date().toISOString().split('T')[0];
    setVal('ChallanDate', today);
    if (challanDatePicker) {
        challanDatePicker.setDate(new Date());
    }

    // Reset Gate Pass fields
    setVal('GatePassNo', '');
    setVal('GatePassNoDisplay', '');
    setVal('GatePassDate', '');
    setVal('VehicleNo', '');
    setVal('DriverName', '');
    setVal('WeighmentSlipNo', '');
    setVal('WeighmentDate', '');

    // Reset PO & Supplier fields
    setVal('PONO', '');
    setVal('PONODisplay', '');
    setVal('PODate', '');
    if (poDatePicker) {
        poDatePicker.clear();
    }
    setVal('SupplierName', '');

    // Reset Status to Draft (1)
    setVal('StatusId', '1');
    updateStatusStepper(1);

    // Reset Notes
    setVal('Notes', '');

    // Reset material rows to 1 empty row
    matRows = [{
        MaterialID: '', materialName: '',
        Bags: 0, GrossWeight: 0, NetWeight: 0, Remarks: ''
    }];
    renderMatTable();
    updateTotals();

    // Refresh floating label classes
    document.querySelectorAll('.form-group input, .form-group select, .form-group textarea').forEach(el => {
        if (el.value !== '') {
            el.closest('.form-group')?.classList.add('has-value');
        } else {
            el.closest('.form-group')?.classList.remove('has-value');
        }
    });
    // Ensure ChallanNo, ChallanDate, and StatusId keep floating labels active
    getEl('ChallanNo')?.closest('.form-group')?.classList.add('has-value');
    getEl('ChallanDate')?.closest('.form-group')?.classList.add('has-value');
    getEl('StatusId')?.closest('.form-group')?.classList.add('has-value');
}

// ─── Supplier Modal Handler ──────────────────────────────────────────────────
function initSupplierModal() {
    const supplierSelect = getEl('SupplierName');
    const modalEl = getEl('createSupplierModal');
    if (!supplierSelect || !modalEl) return;

    const modal = (window.bootstrap && bootstrap.Modal) ? bootstrap.Modal.getOrCreateInstance(modalEl) : null;
    const form = getEl('createSupplierForm');
    const errorEl = getEl('supplierModalError');

    supplierSelect.addEventListener('change', () => {
        if (supplierSelect.value === 'add_new') {
            supplierSelect.value = '';
            if (errorEl) {
                errorEl.classList.add('d-none');
                errorEl.textContent = '';
            }
            if (form) form.reset();
            if (modal) modal.show();
        }
    });

    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            if (errorEl) {
                errorEl.classList.add('d-none');
                errorEl.textContent = '';
            }
            const nameInput = getEl('newSupplierName');
            const supplierName = nameInput ? nameInput.value.trim() : '';
            if (!supplierName) {
                if (errorEl) {
                    errorEl.textContent = 'Supplier Name is required.';
                    errorEl.classList.remove('d-none');
                }
                return;
            }

            const formData = new FormData(form);
            try {
                const res = await fetch('/api/supplier/create/', {
                    method: 'POST',
                    body: formData,
                    headers: { 'X-CSRFToken': formData.get('csrfmiddlewaretoken') }
                });
                const data = await res.json();
                if (data.success) {
                    notifications.success('Supplier created successfully!');
                    if (modal) modal.hide();
                    const sName = data.name || supplierName;
                    const newOpt = new Option(sName, sName, true, true);
                    supplierSelect.add(newOpt);
                    supplierSelect.value = sName;
                    supplierSelect.closest('.form-group')?.classList.add('has-value');
                } else {
                    const errStr = data.errors ? Object.values(data.errors).join(' ') : 'Failed to create supplier.';
                    if (errorEl) {
                        errorEl.textContent = errStr;
                        errorEl.classList.remove('d-none');
                    }
                }
            } catch (err) {
                if (errorEl) {
                    errorEl.textContent = 'Server error. Please try again.';
                    errorEl.classList.remove('d-none');
                }
            }
        });
    }
}

// ─── Save — routes through sp_manage_purchase_challan via API ─────────────────
async function saveChallan() {
    const rawMaterials = collectMatRows();
    const validMaterials = rawMaterials.filter(m => m.MaterialID && String(m.MaterialID).trim() !== '');

    if (validMaterials.length === 0) {
        notifications.error('Please select a Material for at least one row in the table.');
        return;
    }

    const headerData = {
        ChallanNo:    getVal('ChallanNo') ? getVal('ChallanNo') : '',
        ChallanDate:  getVal('ChallanDate') ? getVal('ChallanDate') : null,
        TranType:     'RMPCH',
        GPNo:         selectedGatePass ||
                      parseInt(getVal('GatePassNo')) ||
                      (parseInt(getVal('GatePassNoDisplay').replace(/[^0-9]/g, '')) - 10000) || null,
        StatusId:     parseInt(getVal('StatusId')) || 1,
        PONO:         getVal('PONO') ? getVal('PONO') : null,
        PODate:       getVal('PODate') ? getVal('PODate') : null,
        Notes:        getVal('Notes') ? getVal('Notes') : null,
        SupplierName: getVal('SupplierName') ? getVal('SupplierName') : null,
    };

    const payload = { ...headerData, materials: validMaterials };

    const saveBtns = document.querySelectorAll('.save-btn');
    saveBtns.forEach(btn => {
        btn.disabled = true;
        btn.innerHTML = '<span class="spinner-border spinner-border-sm me-1" role="status"></span> Saving...';
    });

    try {
        let response;
        if (isEdit) {
            response = await apiClient.patch(`/api/purchase-challan/${encodeURIComponent(challanNo)}/`, payload);
            notifications.success(`Challan ${challanNo} updated successfully.`);
            setTimeout(() => {
                window.location.href = '/purchase-challan/';
            }, 800);
        } else {
            response = await apiClient.post('/api/purchase-challan/', payload);
            const newChallan = response.ChallanNo || '';
            notifications.success(`Purchase Challan ${newChallan} created successfully.`);
            resetForm();
        }
    } catch (err) {
        let detail = '';
        if (err.responseData) {
            if (typeof err.responseData === 'string') {
                detail = err.responseData.substring(0, 150);
            } else if (err.responseData.detail) {
                detail = err.responseData.detail;
            } else if (err.responseData.error) {
                detail = err.responseData.error;
            } else if (typeof err.responseData === 'object') {
                detail = Object.entries(err.responseData)
                    .map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(', ') : v}`)
                    .join(' | ');
            }
        }
        if (!detail && err.message) {
            detail = err.message;
        }
        if (!detail) {
            detail = 'Server error. Please check required fields.';
        }
        notifications.error(`Save failed: ${detail}`);
    } finally {
        saveBtns.forEach(btn => {
            btn.disabled = false;
            btn.innerHTML = '<i class="bi bi-floppy me-1"></i>Save Record';
        });
    }
}

// ─── Init ─────────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', async () => {

    // Gate Pass dropdown (edit/create only)
    if (!isView) initGatePassDropdown();

    // PO No smart dropdown (edit/create only)
    if (!isView) initPODropdown();

    // Supplier modal & dropdown handler
    if (!isView) initSupplierModal();

    // Flatpickr for ChallanDate and PODate
    const challanDateEl = getEl('ChallanDate');
    if (window.flatpickr && challanDateEl) {
        challanDatePicker = window.flatpickr(challanDateEl, {
            dateFormat: 'Y-m-d',
            allowInput: !isView,
            clickOpens: !isView,
        });
        if (!isEdit && !isView) {
            challanDatePicker.setDate(new Date());
        }
    }

    const poDateEl = getEl('PODate');
    if (window.flatpickr && poDateEl) {
        poDatePicker = window.flatpickr(poDateEl, {
            dateFormat: 'Y-m-d',
            allowInput: !isView,
            clickOpens: !isView,
        });
    }

    // Status dropdown change listener
    const statusSelect = getEl('StatusId');
    if (statusSelect) {
        statusSelect.addEventListener('change', () => {
            updateStatusStepper(statusSelect.value);
        });
    }

    // Dynamic floating label toggle
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
        toggleClass();
    });

    // Load existing record (Edit / View mode)
    if (isEdit) {
        try {
            const data = await apiClient.get(`/api/purchase-challan/${encodeURIComponent(challanNo)}/`);
            populateForm(data);
        } catch (err) {
            notifications.error('Failed to load Purchase Challan record.');
            console.error(err);
        }
    } else {
        // New: one blank row, default values
        matRows = [{
            MaterialID: '', materialName: '',
            Bags: 0, GrossWeight: 0, NetWeight: 0, Remarks: ''
        }];
        renderMatTable();
        setVal('StatusId', '1');
        updateStatusStepper(1);

        // ChallanNo placeholder
        const cnInput = getEl('ChallanNo');
        if (cnInput) {
            cnInput.placeholder = '(Auto-Generated)';
            cnInput.value = '';
            cnInput.closest('.form-group')?.classList.add('has-value');
        }
    }

    // Save buttons
    document.querySelectorAll('.save-btn').forEach(btn => {
        btn.addEventListener('click', saveChallan);
    });
});
