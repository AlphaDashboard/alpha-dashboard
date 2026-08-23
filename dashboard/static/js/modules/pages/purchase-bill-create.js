import { PurchaseBillAPI } from '../api/purchase-bill-api.js?v=149';
import { domUtils } from '../utils/dom.js?v=149';
import { formatter } from '../utils/formatter.js?v=149';
import { notifications } from '../utils/notifications.js?v=149';

class PurchaseBillForm {

    constructor(config) {
        this.config = config;
        this.form = domUtils.getElement('#purchaseBillForm');
        this.tbody = domUtils.getElement('#itemsTableBody');
        this.rowTemplate = domUtils.getElement('#rowTemplate');
        this.alert = domUtils.getElement('#validationAlert');

        this.totalBasicAmountDisplay = domUtils.getElement('#totalBasicAmountDisplay');
        this.taxesDisplay = domUtils.getElement('#taxesDisplay');
        this.grandTotalDisplay = domUtils.getElement('#grandTotalDisplay');

        this.saveDraftBtn = domUtils.getElement('#saveDraftBtn');
        this.submitApprovalBtn = domUtils.getElement('#submitApprovalBtn');
        this.generateBillBtn = domUtils.getElement('#generateBillBtn');
        this.billStatusSelect = domUtils.getElement('#billStatus');

        // Material modal
        this.createMaterialModalEl = domUtils.getElement('#createMaterialModal');
        this.createMaterialModal = this.createMaterialModalEl ? new bootstrap.Modal(this.createMaterialModalEl) : null;
        this.createMaterialForm = domUtils.getElement('#createMaterialForm');
        this.materialModalError = domUtils.getElement('#materialModalError');
        this.activeItemDropdown = null;

        // Group modal
        this.createSalPurGroupModalEl = domUtils.getElement('#createSalPurGroupModal');
        this.createSalPurGroupModal = this.createSalPurGroupModalEl ? new bootstrap.Modal(this.createSalPurGroupModalEl) : null;
        this.createSalPurGroupForm = domUtils.getElement('#createSalPurGroupForm');
        this.groupModalError = domUtils.getElement('#groupModalError');

        // Broker modal
        this.createBrokerModalEl = domUtils.getElement('#createBrokerModal');
        this.createBrokerModal = this.createBrokerModalEl ? new bootstrap.Modal(this.createBrokerModalEl) : null;
        this.createBrokerForm = domUtils.getElement('#createBrokerForm');
        this.brokerModalError = domUtils.getElement('#brokerModalError');

        // Supplier modal
        this.createSupplierModalEl = domUtils.getElement('#createSupplierModal');
        this.createSupplierModal = this.createSupplierModalEl ? new bootstrap.Modal(this.createSupplierModalEl) : null;
        this.createSupplierForm = domUtils.getElement('#createSupplierForm');
        this.supplierModalError = domUtils.getElement('#supplierModalError');

        this.init();
    }

    async init() {
        this.bindEvents();
        this.initGatePassDropdown();
        this.initPODropdown();

        if (this.config.isEditMode && this.config.voucherNo) {
            await this.loadData(this.config.voucherNo);
        } else {
            if (this.billStatusSelect) {
                this.billStatusSelect.value = 'Draft';
            }
            const billDateInput = domUtils.getElement('#billDate');
            if (billDateInput) {
                const today = new Date().toISOString().split('T')[0];
                billDateInput.value = today;
                billDateInput.dispatchEvent(new Event('change'));
            }
            this.addRow();
            this.updateProgress();
        }

        if (this.config.isViewMode) {
            this.enableViewMode();
        }

        if (this.config.isEditMode && !this.config.isViewMode) {
            this._applyWorkflowLock(this.config.billStatus);
        }
    }

    bindEvents() {
        // Table actions (delegated)
        if (this.tbody) {
            // Inline + button
            domUtils.delegate('#itemsTableBody', 'click', '.add-row-btn', (e, target) => {
                const currentRow = target.closest('.item-row');
                const newRow = this._cloneRow(null);
                if (currentRow && currentRow.nextSibling) {
                    this.tbody.insertBefore(newRow, currentRow.nextSibling);
                } else {
                    this.tbody.appendChild(newRow);
                }
                this.renumberRows();
                this.calculateTotals();
            });

            // Delete button
            domUtils.delegate('#itemsTableBody', 'click', '.remove-row-btn', (e, target) => {
                const row = target.closest('.item-row');
                if (!row) return;
                if (!confirm('Are you sure you want to delete this row?')) return;
                row.remove();
                
                const currentRowsCount = this.tbody.querySelectorAll('.item-row').length;
                if (currentRowsCount === 0) {
                    this.addRow();
                }

                this.renumberRows();
                this.calculateTotals();
            });

            this.tbody.addEventListener('input', (e) => {
                if (e.target.classList.contains('row-qty') || e.target.classList.contains('row-rate')) {
                    const row = e.target.closest('.item-row');
                    if (row) {
                        this.calculateRowAmount(row);
                        this.calculateTotals();
                    }
                }
            });

            // Handle "Add New Item" selection
            domUtils.delegate('#itemsTableBody', 'change', '.row-item', (e, target) => {
                if (target.value === 'add_new') {
                    target.value = '';
                    this.activeItemDropdown = target;
                    if (this.createMaterialForm) this.createMaterialForm.reset();
                    if (this.materialModalError) this.materialModalError.classList.add('d-none');
                    if (this.createMaterialModal) this.createMaterialModal.show();
                }
            });
        }

        // Bill Status → progress bar
        if (this.billStatusSelect) {
            this.billStatusSelect.addEventListener('change', () => this.updateProgress());
        }

        // Save buttons
        if (this.saveDraftBtn) {
            this.saveDraftBtn.addEventListener('click', () => this.submitForm('Draft'));
        }
        if (this.submitApprovalBtn) {
            this.submitApprovalBtn.addEventListener('click', () => this.submitForm('Submitted'));
        }
        if (this.form) {
            this.form.addEventListener('submit', (e) => {
                e.preventDefault();
                const selectedStatus = domUtils.getElement('#billStatus')?.value || 'Draft';
                this.submitForm(selectedStatus);
            });
        }

        // Real-time validation
        if (this.form) {
            this.form.addEventListener('input',  (e) => this.validateField(e.target));
            this.form.addEventListener('change', (e) => this.validateField(e.target));
            this.form.addEventListener('blur',   (e) => this.validateField(e.target), true);
        }

        // Handle Material creation
        if (this.createMaterialForm) {
            this.createMaterialForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                await this.createNewMaterial();
            });
        }

        // Handle "Add New Group" selection
        const groupSelect = domUtils.getElement('#salPurGroup');
        if (groupSelect) {
            groupSelect.addEventListener('change', (e) => {
                if (e.target.value === 'add_new') {
                    e.target.value = '';
                    if (this.createSalPurGroupForm) this.createSalPurGroupForm.reset();
                    if (this.groupModalError) this.groupModalError.classList.add('d-none');
                    if (this.createSalPurGroupModal) this.createSalPurGroupModal.show();
                }
            });
        }

        if (this.createSalPurGroupForm) {
            this.createSalPurGroupForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                await this.createNewGroup();
            });
        }

        // Handle "Add New Broker" selection
        const brokerSelect = domUtils.getElement('#broker');
        if (brokerSelect) {
            brokerSelect.addEventListener('change', (e) => {
                if (e.target.value === 'add_new') {
                    e.target.value = '';
                    if (this.createBrokerForm) this.createBrokerForm.reset();
                    if (this.brokerModalError) this.brokerModalError.classList.add('d-none');
                    if (this.createBrokerModal) this.createBrokerModal.show();
                }
            });
        }

        if (this.createBrokerForm) {
            this.createBrokerForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                await this.createNewBroker();
            });
        }

        // Handle "Add New Supplier" selection
        const supplierSelect = domUtils.getElement('#supplier');
        if (supplierSelect) {
            supplierSelect.addEventListener('change', (e) => {
                if (e.target.value === 'add_new') {
                    e.target.value = '';
                    if (this.createSupplierForm) this.createSupplierForm.reset();
                    if (this.supplierModalError) this.supplierModalError.classList.add('d-none');
                    if (this.createSupplierModal) this.createSupplierModal.show();
                }
            });
        }

        if (this.createSupplierForm) {
            this.createSupplierForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                await this.createNewSupplier();
            });
        }

        // Optional Fields Chevron rotation
        const collapseEl = domUtils.getElement('#moreBillDetailsCollapse');
        const chevron = domUtils.getElement('#toggleChevron');
        if (collapseEl && chevron) {
            collapseEl.addEventListener('show.bs.collapse', () => {
                chevron.style.transform = 'rotate(90deg)';
            });
            collapseEl.addEventListener('hide.bs.collapse', () => {
                chevron.style.transform = 'rotate(0deg)';
            });
        }
    }

    // ─── Gate Pass Smart Dropdown ─────────────────────────────────────────────
    initGatePassDropdown() {
        const gpDisplayInput  = domUtils.getElement('#gatePassNoDisplay');
        const gpHiddenInput   = domUtils.getElement('#gatePassNo');
        const gpDropdownPanel = domUtils.getElement('#gpDropdownPanel');
        const gpDropdownList  = domUtils.getElement('#gpDropdownList');
        const gpSearchInput   = domUtils.getElement('#gpSearchInput');

        if (!gpDisplayInput || !gpHiddenInput || !gpDropdownPanel || !gpDropdownList) return;

        if (gpDropdownPanel.parentNode !== document.body) {
            document.body.appendChild(gpDropdownPanel);
        }

        const openGpDropdown = () => {
            const rect = gpDisplayInput.getBoundingClientRect();
            const panelWidth = Math.max(rect.width, 540);
            gpDropdownPanel.style.minWidth = '0px';
            gpDropdownPanel.style.width = panelWidth + 'px';
            const spaceBelow = window.innerHeight - rect.bottom - 10;
            const maxH = Math.max(spaceBelow, 200);
            gpDropdownPanel.style.maxHeight = maxH + 'px';
            gpDropdownPanel.style.display = 'flex';
            gpDropdownPanel.style.top  = (rect.bottom + 2) + 'px';
            gpDropdownPanel.style.left = rect.left + 'px';
            gpDropdownPanel.style.position = 'fixed';
            gpDropdownPanel.style.zIndex = '999999';
            const closeBtn = domUtils.getElement('#gpDropdownCloseBtn');
            if (closeBtn) closeBtn.onclick = closeGpDropdown;
            renderGpDropdownRows('');
        };

        const closeGpDropdown = () => {
            gpDropdownPanel.style.display = 'none';
        };

        let gpEntries = [];

        async function loadGatePasses() {
            try {
                const res = await fetch('/api/gate-pass/');
                if (!res.ok) return [];
                return await res.json();
            } catch { return []; }
        }

        const escHtml = (str) => {
            if (!str) return '';
            return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
        };

        const renderGpDropdownRows = async (query) => {
            if (gpEntries.length === 0) {
                gpEntries = await loadGatePasses();
            }
            const q = (query || '').toLowerCase().trim();
            const filtered = gpEntries.filter(gp => {
                const formattedGP = `gp-${gp.GatePassNo + 10000}`.toLowerCase();
                const rawGP = String(gp.GatePassNo).toLowerCase();
                const veh = (gp.VehicleNo || '').toLowerCase();
                const drv = (gp.DriverName || '').toLowerCase();
                const sup = (gp.supplier_name || '').toLowerCase();
                return !q || formattedGP.includes(q) || rawGP.includes(q) || veh.includes(q) || drv.includes(q) || sup.includes(q);
            });

            const countEl = domUtils.getElement('#gpDropdownCount');
            if (countEl) countEl.textContent = `${filtered.length} records found`;

            gpDropdownList.innerHTML = '';
            if (filtered.length === 0) {
                gpDropdownList.innerHTML = '<div style="padding:10px 12px; color:#6b7280; font-size:12px;">No records found</div>';
                return;
            }
            filtered.forEach(gp => {
                const row = document.createElement('div');
                row.style.cssText = 'display:grid; grid-template-columns:90px 100px 120px 130px 1fr; padding:6px 10px; font-size:12px; cursor:pointer; border-bottom:1px solid #f1f5f9; color:#334155;';
                const gpDateStr = gp.GatePassdate ? gp.GatePassdate.split('T')[0] : '—';
                row.innerHTML = `
                    <span style="font-weight:600; color:#2563eb;">GP-${gp.GatePassNo + 10000}</span>
                    <span>${escHtml(gpDateStr)}</span>
                    <span>${escHtml(gp.DriverName || '—')}</span>
                    <span>${escHtml(gp.VehicleNo || '—')}</span>
                    <span>${escHtml(gp.supplier_name || '—')}</span>
                `;
                row.addEventListener('mouseenter', () => row.style.backgroundColor = '#eff6ff');
                row.addEventListener('mouseleave', () => row.style.backgroundColor = '');
                row.addEventListener('click', () => {
                    gpHiddenInput.value = `GP-${gp.GatePassNo + 10000}`;
                    gpDisplayInput.value = `GP-${gp.GatePassNo + 10000}`;
                    gpDisplayInput.closest('.erp-field')?.classList.add('is-filled');
                    
                    const gpDateField = domUtils.getElement('#gatePassDate');
                    if (gpDateField) {
                        gpDateField.value = gp.GatePassdate ? gp.GatePassdate.split('T')[0] : '';
                        gpDateField.closest('.erp-field')?.classList.add('is-filled');
                    }

                    closeGpDropdown();
                });
                gpDropdownList.appendChild(row);
            });
        };

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

        gpDropdownPanel.addEventListener('click', (e) => e.stopPropagation());

        document.addEventListener('click', (e) => {
            if (!e.target.closest('#gpDropdownGroup') && !e.target.closest('#gpDropdownPanel')) {
                closeGpDropdown();
            }
        });
    }

    // ─── PO No Smart Dropdown ─────────────────────────────────────────────────
    initPODropdown() {
        const poDisplayInput  = domUtils.getElement('#poNoDisplay');
        const poHiddenInput   = domUtils.getElement('#poNo');
        const poDropdownPanel = domUtils.getElement('#poDropdownPanel');
        const poDropdownList  = domUtils.getElement('#poDropdownList');
        const poSearchInput   = domUtils.getElement('#poSearchInput');

        if (!poDisplayInput || !poHiddenInput || !poDropdownPanel || !poDropdownList) return;

        if (poDropdownPanel.parentNode !== document.body) {
            document.body.appendChild(poDropdownPanel);
        }

        const openPoDropdown = () => {
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
            const closeBtn = domUtils.getElement('#poDropdownCloseBtn');
            if (closeBtn) closeBtn.onclick = closePoDropdown;
            renderPoDropdownRows('');
        };

        const closePoDropdown = () => {
            poDropdownPanel.style.display = 'none';
        };

        let poEntries = [];

        async function loadPOs() {
            try {
                const res = await fetch('/api/po-list-for-challan/');
                if (!res.ok) return [];
                return await res.json();
            } catch { return []; }
        }

        const escHtml = (str) => {
            if (!str) return '';
            return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
        };

        const renderPoDropdownRows = async (query) => {
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

            const countEl = domUtils.getElement('#poDropdownCount');
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
                    poHiddenInput.value  = po.po_no;
                    poDisplayInput.value = po.po_no;
                    poDisplayInput.closest('.erp-field')?.classList.add('is-filled');
                    
                    const poDateField = domUtils.getElement('#poDate');
                    if (poDateField) {
                        poDateField.value = po.po_date || '';
                        poDateField.closest('.erp-field')?.classList.add('is-filled');
                    }

                    closePoDropdown();
                });
                poDropdownList.appendChild(row);
            });
        };

        poDisplayInput.addEventListener('click', (e) => {
            e.stopPropagation();
            if (poDropdownPanel.style.display === 'flex') {
                closePoDropdown();
            } else {
                openPoDropdown();
            }
        });

        if (poSearchInput) {
            poSearchInput.addEventListener('input', () => {
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

    isRowEmpty(row) {
        const itemVal    = row.querySelector('.row-item')?.value || '';
        const qtyVal     = row.querySelector('.row-qty')?.value || '';
        const rateVal    = row.querySelector('.row-rate')?.value || '';
        const remarksVal = row.querySelector('.row-remarks')?.value || '';
        return !itemVal && !qtyVal && !rateVal && !remarksVal;
    }

    _cloneRow(data) {
        if (!this.rowTemplate) return null;
        const clone = this.rowTemplate.content.cloneNode(true);
        const row   = clone.querySelector('.item-row');
        if (data && row) {
            const itemSelect   = row.querySelector('.row-item');
            const qtyInput     = row.querySelector('.row-qty');
            const uomSelect    = row.querySelector('.row-uom');
            const rateInput    = row.querySelector('.row-rate');
            const remarksInput = row.querySelector('.row-remarks');
            if (itemSelect) {
                const itemVal = data.item || data.item_id || '';
                if (itemVal && !itemSelect.querySelector(`option[value="${itemVal}"]`)) {
                    const text = data.item_display?.text || `Unknown Item (ID: ${itemVal})`;
                    const opt = new Option(text, itemVal, true, true);
                    itemSelect.add(opt);
                }
                itemSelect.value = itemVal;
            }
            if (qtyInput)     qtyInput.value     = data.order_qty  || '';
            if (uomSelect)    uomSelect.value    = data.uom        || 'MT';
            if (rateInput)    rateInput.value    = data.unit_rate  || '';
            if (remarksInput) remarksInput.value = data.remarks    || '';
            this.calculateRowAmount(row);
        }
        return row;
    }

    addRow(data = null) {
        if (!this.rowTemplate || !this.tbody) return;
        const row = this._cloneRow(data);
        if (!row) return;
        this.tbody.appendChild(row);
        this.renumberRows();
        this.calculateTotals();
        
        if (!this.config.isViewMode) {
            const wrapper = this.tbody.closest('.table-responsive');
            if (wrapper) {
                setTimeout(() => {
                    wrapper.scrollTop = wrapper.scrollHeight;
                }, 50);
            }
        }

        if (this.config.isViewMode) {
            row.querySelectorAll('input, select, textarea, button').forEach(el => {
                el.disabled = true;
            });
        }
    }

    renumberRows() {
        if (!this.tbody) return;
        const rows = this.tbody.querySelectorAll('.item-row');
        rows.forEach((row, idx) => {
            const numCell = row.querySelector('.row-num');
            if (numCell) numCell.textContent = idx + 1;

            const addBtn = row.querySelector('.add-row-btn');
            const delBtn = row.querySelector('.remove-row-btn');

            if (idx === 0) {
                if (addBtn) addBtn.style.setProperty('display', 'inline-flex', 'important');
                if (delBtn) delBtn.style.setProperty('display', 'none',        'important');
            } else {
                if (addBtn) addBtn.style.setProperty('display', 'inline-flex', 'important');
                if (delBtn) delBtn.style.setProperty('display', 'inline-flex', 'important');
            }
        });
    }

    calculateRowAmount(row) {
        const qtyInput   = row.querySelector('.row-qty');
        const rateInput  = row.querySelector('.row-rate');
        const amountInput = row.querySelector('.row-amount');
        if (!qtyInput || !rateInput || !amountInput) return;

        const qty    = parseFloat(qtyInput.value)  || 0;
        const rate   = parseFloat(rateInput.value) || 0;
        const amount = qty * rate;

        amountInput.value = amount.toFixed(2);
    }

    calculateTotals() {
        let totalBasic = 0;
        if (this.tbody) {
            this.tbody.querySelectorAll('.row-amount').forEach(input => {
                totalBasic += parseFloat(input.value) || 0;
            });
        }

        const totalFormatted = formatter.formatCurrency(totalBasic);
        if (this.totalBasicAmountDisplay) this.totalBasicAmountDisplay.textContent = totalFormatted;
        
        const tableFooterTotal = domUtils.getElement('#tableTotalBasicAmountDisplay');
        if (tableFooterTotal) tableFooterTotal.value = totalFormatted;

        if (this.grandTotalDisplay) this.grandTotalDisplay.textContent = totalFormatted;
    }

    updateProgress() {
        const steps = ['Draft', 'Submitted', 'RefBack', 'Approved'];
        const currentStatus = this.billStatusSelect ? this.billStatusSelect.value : 'Draft';
        const currentIndex = steps.indexOf(currentStatus);

        steps.forEach((step, idx) => {
            const el = domUtils.getElement(`#step-${step}`);
            if (el) {
                if (idx <= currentIndex) el.classList.add('active');
                else el.classList.remove('active');
            }
        });

        const fill = domUtils.getElement('#progressLineFill');
        if (fill) {
            const pct = currentIndex >= 0 ? (currentIndex / (steps.length - 1)) * 100 : 0;
            fill.style.width = `${pct}%`;
        }
    }

    async loadData(billNo) {
        const billNoEl = domUtils.getElement('#billNo');
        if (billNoEl) billNoEl.value = 'Loading...';

        try {
            const data = await PurchaseBillAPI.getById(billNo);

            if (billNoEl) billNoEl.value = data.bill_no || billNo;
            const billDateEl = domUtils.getElement('#billDate');
            if (billDateEl) {
                billDateEl.value = data.bill_date ? data.bill_date.split('T')[0] : '';
            }
            const expDateEl = domUtils.getElement('#expectedDeliveryDate');
            if (expDateEl) {
                expDateEl.value = data.expected_delivery_date ? data.expected_delivery_date.split('T')[0] : '';
            }
            if (this.billStatusSelect) {
                this.billStatusSelect.value = data.bill_status || 'Draft';
            }

            // Gate Pass & PO No fields
            const gpNoEl = domUtils.getElement('#gatePassNo');
            const gpDispEl = domUtils.getElement('#gatePassNoDisplay');
            const gpDateEl = domUtils.getElement('#gatePassDate');
            if (gpNoEl) gpNoEl.value = data.gate_pass_no || '';
            if (gpDispEl) gpDispEl.value = data.gate_pass_no || '';
            if (gpDateEl) gpDateEl.value = data.gate_pass_date ? data.gate_pass_date.split('T')[0] : '';

            const poNoEl = domUtils.getElement('#poNo');
            const poDispEl = domUtils.getElement('#poNoDisplay');
            const poDateEl = domUtils.getElement('#poDate');
            if (poNoEl) poNoEl.value = data.po_no || '';
            if (poDispEl) poDispEl.value = data.po_no || '';
            if (poDateEl) poDateEl.value = data.po_date ? data.po_date.split('T')[0] : '';

            // Group, Broker, Supplier
            const groupSelect = domUtils.getElement('#salPurGroup');
            if (groupSelect) {
                const groupVal = data.sal_pur_group || '';
                if (groupVal && !groupSelect.querySelector(`option[value="${groupVal}"]`)) {
                    const text = data.sal_pur_group_display?.text || `Unknown Group (ID: ${groupVal})`;
                    const opt = new Option(text, groupVal, true, true);
                    groupSelect.add(opt);
                }
                groupSelect.value = groupVal;
            }

            const brokerSelect = domUtils.getElement('#broker');
            if (brokerSelect) {
                const brokerVal = data.broker || '';
                if (brokerVal && !brokerSelect.querySelector(`option[value="${brokerVal}"]`)) {
                    const text = data.broker_display?.text || `Unknown Broker (ID: ${brokerVal})`;
                    const opt = new Option(text, brokerVal, true, true);
                    brokerSelect.add(opt);
                }
                brokerSelect.value = brokerVal;
            }

            const supplierSelect = domUtils.getElement('#supplier');
            if (supplierSelect) {
                const supplierVal = data.supplier || '';
                if (supplierVal && !supplierSelect.querySelector(`option[value="${supplierVal}"]`)) {
                    const text = data.supplier_display?.text || `Unknown Supplier (ID: ${supplierVal})`;
                    const opt = new Option(text, supplierVal, true, true);
                    supplierSelect.add(opt);
                }
                supplierSelect.value = supplierVal;
            }

            domUtils.getElement('#zoneName').value = data.zone_name || '';
            domUtils.getElement('#supplierContact').value = data.supplier_contact || '';
            domUtils.getElement('#supplierAddress').value = data.supplier_address || '';
            domUtils.getElement('#gstNumber').value       = data.gst_number       || '';

            // Delivery section
            domUtils.getElement('#deliveryLocation').value  = data.delivery_location || '';
            domUtils.getElement('#deliveryTerms').value     = data.delivery_terms    || '';
            domUtils.getElement('#paymentTerms').value      = data.payment_terms     || '';
            domUtils.getElement('#freightTerms').value      = data.freight_terms     || '';
            domUtils.getElement('#currency').value          = data.currency          || 'INR';

            // Additional
            domUtils.getElement('#purchaserName').value       = data.purchaser_name       || '';
            domUtils.getElement('#department').value          = data.department           || '';
            domUtils.getElement('#costCenter').value          = data.cost_center          || '';
            domUtils.getElement('#specialInstructions').value = data.special_instructions || '';
            domUtils.getElement('#internalNotes').value       = data.internal_notes       || '';

            // Items
            if (this.tbody) this.tbody.innerHTML = '';
            const itemsCount = (data.items && Array.isArray(data.items)) ? data.items.length : 0;
            if (itemsCount > 0) {
                data.items.forEach(item => this.addRow(item));
            }
            if (itemsCount === 0) {
                this.addRow();
            }

            this.updateProgress();
            this.calculateTotals();

            this.form.querySelectorAll('.erp-floating-input').forEach(input => {
                input.dispatchEvent(new Event('change'));
            });

            if (this.config.isEditMode && !this.config.isViewMode) {
                this._applyWorkflowLock(data.bill_status || 'Draft');
            }

        } catch (err) {
            const errMsg = err.message || 'Failed to load purchase bill data.';
            notifications.showError(errMsg);
            if (this.alert) {
                this.alert.innerHTML = `<i class="bi bi-exclamation-triangle-fill me-2"></i>
                    Could not load purchase bill data. Please go back and try again.<br>
                    <small class="text-muted">${errMsg}</small>`;
                this.alert.classList.remove('d-none');
            }
            if (billNoEl) billNoEl.value = 'Error loading record';
        }
    }

    enableViewMode() {
        if (!this.form) return;
        this.form.querySelectorAll('input, select, textarea').forEach(el => el.disabled = true);

        if (this.tbody) {
            this.tbody.querySelectorAll('.remove-row-btn, .add-row-btn').forEach(btn => {
                btn.style.display = 'none';
            });
        }

        const actionBtnContainer = domUtils.getElement('#actionButtonsContainer');
        if (actionBtnContainer) {
            actionBtnContainer.style.setProperty('display', 'none', 'important');
        }
    }

    _applyWorkflowLock(billStatus) {
        const LOCKED_STATUSES = ['Submitted', 'Approved'];
        if (!LOCKED_STATUSES.includes(billStatus)) return;

        const userRole = window.APP_CONFIG?.userRole;
        const isApprover = (userRole === 'Checker' || userRole === 'Admin');

        if (!isApprover) {
            if (this.form) {
                this.form.querySelectorAll('input, select, textarea').forEach(el => {
                    el.disabled = true;
                });
            }
            if (this.tbody) {
                this.tbody.querySelectorAll('input, select, textarea, button').forEach(el => {
                    el.disabled = true;
                });
            }
            const actionBtnContainer = domUtils.getElement('#actionButtonsContainer');
            if (actionBtnContainer) {
                actionBtnContainer.style.setProperty('display', 'none', 'important');
            }
        }

        const banner     = domUtils.getElement('#billLockedBanner');
        const bannerText = domUtils.getElement('#billLockedBannerText');
        if (banner) {
            banner.classList.remove('d-none');
            if (billStatus === 'Submitted') {
                banner.style.borderLeftColor = '#f59e0b';
                banner.style.background      = '#fffbeb';
                banner.style.color           = '#92400e';
                if (bannerText) {
                    if (isApprover) {
                        bannerText.textContent = `This Purchase Bill is Submitted for Approval. As ${userRole}, you can edit and change its status.`;
                    } else {
                        bannerText.textContent =
                            'This Purchase Bill has been Submitted for Approval. Editing is locked until it is Ref. Back or rejected.';
                    }
                }
            } else if (billStatus === 'Approved') {
                banner.style.borderLeftColor = '#10b981';
                banner.style.background      = '#d1fae5';
                banner.style.color           = '#065f46';
                if (bannerText) {
                    if (isApprover) {
                        bannerText.textContent = `This Purchase Bill is Approved. As ${userRole}, you can edit and change its status.`;
                    } else {
                        bannerText.textContent =
                            'This Purchase Bill is Approved. Editing and deletion are locked.';
                    }
                }
            }
        }
    }

    showErrors(msg) {
        if (this.alert) {
            this.alert.innerHTML = msg;
            this.alert.classList.remove('d-none');
            this.alert.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
    }

    hideErrors() {
        if (this.alert) this.alert.classList.add('d-none');
    }

    validateField(field) {
        if (!field) return true;
        if (!field.matches('input, select, textarea')) return true;
        if (field.readOnly || field.disabled) return true;
        if (field.type === 'checkbox' || field.type === 'radio') return true;

        const row = field.closest('.item-row');
        if (row && this.isRowEmpty(row)) {
            field.classList.remove('is-invalid');
            return true;
        }

        let isValid = true, errorMessage = '';
        const parent = field.parentElement;
        if (!parent) return true;

        parent.querySelector('.invalid-feedback-erp')?.remove();

        const val = (field.value || '').trim();

        if      (field.id === 'billDate')         { if (!val) { isValid = false; errorMessage = 'Bill Date is required'; } }
        else if (field.id === 'salPurGroup')      { if (!val) { isValid = false; errorMessage = 'Sales/Purchase Group is required'; } }
        else if (field.id === 'broker')           { if (!val) { isValid = false; errorMessage = 'Broker is required'; } }
        else if (field.id === 'zoneName')         { if (!val) { isValid = false; errorMessage = 'Zone is required'; } }
        else if (field.id === 'supplier')         { if (!val) { isValid = false; errorMessage = 'Supplier is required'; } }
        else if (field.id === 'deliveryLocation') { if (!val) { isValid = false; errorMessage = 'Delivery Location is required'; } }
        else if (field.classList.contains('row-item')) {
            if (!val) { isValid = false; errorMessage = 'Item is required'; }
        }
        else if (field.classList.contains('row-qty')) {
            const n = parseFloat(val);
            if (!val || isNaN(n)) { isValid = false; errorMessage = 'Qty required'; }
            else if (n <= 0)      { isValid = false; errorMessage = 'Qty must be > 0'; }
        }
        else if (field.classList.contains('row-rate')) {
            const n = parseFloat(val);
            if (!val || isNaN(n)) { isValid = false; errorMessage = 'Rate required'; }
            else if (n <= 0)      { isValid = false; errorMessage = 'Rate must be > 0'; }
        }
        else if (field.hasAttribute('required') && !val) {
            isValid = false; errorMessage = 'This field is required';
        }

        if (isValid) {
            field.classList.remove('is-invalid');
        } else {
            field.classList.add('is-invalid');
            if (!field.closest('#itemsTable')) {
                const feedback = document.createElement('div');
                feedback.className = 'invalid-feedback-erp';
                feedback.textContent = errorMessage;
                field.insertAdjacentElement('afterend', feedback);
            }
        }
        return isValid;
    }

    validateForm() {
        this.hideErrors();
        let isFormValid = true;
        let firstInvalid = null;

        this.form.querySelectorAll('input:not([readonly]), select, textarea').forEach(field => {
            if (!this.validateField(field)) {
                isFormValid = false;
                if (!firstInvalid) firstInvalid = field;
            }
        });

        if (this.tbody) {
            let filledRowsCount = 0;
            this.tbody.querySelectorAll('.item-row').forEach(row => {
                if (this.isRowEmpty(row)) {
                    row.querySelectorAll('.row-item, .row-qty, .row-rate').forEach(el => el.classList.remove('is-invalid'));
                    return;
                }
                filledRowsCount++;
                ['row-item','row-qty','row-rate'].forEach(cls => {
                    const f = row.querySelector('.' + cls);
                    if (f && !this.validateField(f)) {
                        isFormValid = false;
                        if (!firstInvalid) firstInvalid = f;
                    }
                });
            });

            if (filledRowsCount === 0) {
                this.showErrors('<i class="bi bi-exclamation-triangle-fill me-2"></i>At least one purchase bill item is required.');
                return false;
            }
        }

        if (!isFormValid) {
            this.showErrors('<i class="bi bi-exclamation-triangle-fill me-2"></i>Please fill in all required fields highlighted in red.');
            if (firstInvalid) {
                const section = firstInvalid.closest('#section-items, #section-totals, #section-additional');
                if (section) {
                    const tabId = section.id;
                    let btnId = '';
                    if (tabId === 'section-items') btnId = '#btn-tab-items';
                    else if (tabId === 'section-totals') btnId = '#btn-tab-totals';
                    else if (tabId === 'section-additional') btnId = '#btn-tab-additional';
                    
                    const tabBtn = document.querySelector(btnId);
                    if (tabBtn) tabBtn.click();
                }

                setTimeout(() => {
                    firstInvalid.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    firstInvalid.focus({ preventScroll: true });
                }, 150);
            }
        }
        return isFormValid;
    }

    async submitForm(targetStatus) {
        this.hideErrors();
        if (this.config.isViewMode) return;
        if (!this.validateForm()) return;

        const _parseInt = (el) => {
            if (!el) return null;
            const v = (el.value || '').trim();
            if (!v) return null;
            const n = parseInt(v, 10);
            return isNaN(n) ? null : n;
        };

        const salPurGroupEl  = domUtils.getElement('#salPurGroup');
        const brokerEl       = domUtils.getElement('#broker');
        const supplierEl     = domUtils.getElement('#supplier');

        const payload = {
            bill_date:              domUtils.getElement('#billDate').value,
            expected_delivery_date: domUtils.getElement('#expectedDeliveryDate').value || null,
            bill_status:            targetStatus,
            gate_pass_no:           domUtils.getElement('#gatePassNo')?.value   || null,
            gate_pass_date:         domUtils.getElement('#gatePassDate')?.value || null,
            po_no:                  domUtils.getElement('#poNo')?.value         || null,
            po_date:                domUtils.getElement('#poDate')?.value       || null,
            sal_pur_group:          _parseInt(salPurGroupEl),
            broker:                 _parseInt(brokerEl),
            zone_name:              domUtils.getElement('#zoneName')?.value || '',
            supplier:               _parseInt(supplierEl),
            supplier_contact:       domUtils.getElement('#supplierContact')?.value    || null,
            supplier_address:       domUtils.getElement('#supplierAddress')?.value    || null,
            gst_number:             domUtils.getElement('#gstNumber')?.value          || null,
            delivery_location:      domUtils.getElement('#deliveryLocation')?.value   || '',
            delivery_terms:         domUtils.getElement('#deliveryTerms')?.value      || '',
            payment_terms:          domUtils.getElement('#paymentTerms')?.value       || '',
            freight_terms:          domUtils.getElement('#freightTerms')?.value      || '',
            currency:               domUtils.getElement('#currency')?.value          || 'INR',
            purchaser_name:         domUtils.getElement('#purchaserName').value        || null,
            department:             domUtils.getElement('#department').value           || null,
            cost_center:            domUtils.getElement('#costCenter').value           || null,
            special_instructions:   domUtils.getElement('#specialInstructions').value  || null,
            internal_notes:         domUtils.getElement('#internalNotes').value        || null,
            items: []
        };

        if (this.config.isEditMode) {
            payload.bill_no = domUtils.getElement('#billNo').value;
        }

        let itemValidationError = false;
        let filledRowsCount = 0;
        this.tbody.querySelectorAll('.item-row').forEach(row => {
            if (this.isRowEmpty(row)) return;

            const itemVal    = row.querySelector('.row-item').value;
            const qtyVal     = parseFloat(row.querySelector('.row-qty').value);
            const uomVal     = row.querySelector('.row-uom').value;
            const rateVal    = parseFloat(row.querySelector('.row-rate').value);
            const remarksVal = row.querySelector('.row-remarks').value;

            if (!itemVal || isNaN(qtyVal) || !uomVal || isNaN(rateVal)) {
                itemValidationError = true;
                return;
            }
            filledRowsCount++;
            payload.items.push({
                item:      parseInt(itemVal),
                order_qty: qtyVal,
                uom:       uomVal,
                unit_rate: rateVal,
                remarks:   remarksVal || null
            });
        });

        if (itemValidationError) {
            this.showErrors('Please complete all fields for each item row in the items table.');
            return;
        }

        if (filledRowsCount === 0) {
            this.showErrors('At least one item is required.');
            return;
        }

        try {
            if (this.config.isEditMode) {
                await PurchaseBillAPI.update(this.config.voucherNo, payload);
                notifications.showSuccess('Purchase Bill updated successfully');
            } else {
                await PurchaseBillAPI.create(payload);
                notifications.showSuccess('Purchase Bill created successfully');
            }
            setTimeout(() => { window.location.href = '/purchase-bill/'; }, 1000);
        } catch (err) {
            const errorMsg = err.message ||
                (err.response?.data && typeof err.response.data === 'object'
                    ? JSON.stringify(err.response.data)
                    : 'An error occurred during submission.');
            this.showErrors(errorMsg);
            notifications.showError('Form submission failed');
        }
    }

    async createNewMaterial() {
        if (!this.createMaterialForm || !this.materialModalError) return;
        this.materialModalError.classList.add('d-none');
        this.materialModalError.textContent = '';

        const formData = new FormData(this.createMaterialForm);
        try {
            const response = await fetch('/api/material/create/', {
                method: 'POST',
                body: formData,
                headers: { 'X-CSRFToken': formData.get('csrfmiddlewaretoken') }
            });
            const data = await response.json();

            if (data.success) {
                notifications.showSuccess('Item created successfully!');
                if (this.createMaterialModal) this.createMaterialModal.hide();

                const newOption = new Option(`${data.code} - ${data.text}`, data.id, true, true);
                if (this.activeItemDropdown) {
                    this.activeItemDropdown.add(newOption);
                    this.activeItemDropdown.value = data.id;
                    this.activeItemDropdown.dispatchEvent(new Event('change', { bubbles: true }));
                }

                document.querySelectorAll('.row-item').forEach(select => {
                    if (select !== this.activeItemDropdown) {
                        select.add(new Option(`${data.code} - ${data.text}`, data.id));
                    }
                });
            } else {
                const errorMsg = data.errors ? Object.values(data.errors).join(' ') : 'Failed to create item.';
                this.materialModalError.textContent = errorMsg;
                this.materialModalError.classList.remove('d-none');
            }
        } catch (err) {
            this.materialModalError.textContent = 'Server error. Please try again.';
            this.materialModalError.classList.remove('d-none');
        }
    }

    async createNewGroup() {
        if (!this.createSalPurGroupForm || !this.groupModalError) return;
        this.groupModalError.classList.add('d-none');
        this.groupModalError.textContent = '';

        const groupNameInput = domUtils.getElement('#newGroupName');
        const gstCheckbox = domUtils.getElement('#newGroupGST');
        const interstateRadio = domUtils.getElement('#newGroupInterstateY');
        const csrfToken = domUtils.getElement('[name=csrfmiddlewaretoken]')?.value;

        const payload = {
            SalPurGroupName: groupNameInput.value.trim(),
            GST_Applicable_Y_N: gstCheckbox.checked,
            Interstate_Y_WithinState_N: interstateRadio.checked,
            is_active: true
        };

        if (!payload.SalPurGroupName) {
            this.groupModalError.textContent = 'Group Name is required.';
            this.groupModalError.classList.remove('d-none');
            return;
        }

        try {
            const response = await fetch('/api/sal-pur-group/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': csrfToken
                },
                body: JSON.stringify(payload)
            });

            if (response.ok) {
                const data = await response.json();
                notifications.showSuccess('Group created successfully!');
                if (this.createSalPurGroupModal) this.createSalPurGroupModal.hide();

                const groupSelect = domUtils.getElement('#salPurGroup');
                if (groupSelect) {
                    const newOption = new Option(data.SalPurGroupName, data.SalPurGroupID, true, true);
                    groupSelect.add(newOption);
                    groupSelect.value = data.SalPurGroupID;
                    groupSelect.dispatchEvent(new Event('change'));
                }
            } else {
                const errData = await response.json();
                this.groupModalError.textContent = typeof errData === 'object' ? JSON.stringify(errData) : 'Failed to create group.';
                this.groupModalError.classList.remove('d-none');
            }
        } catch (err) {
            this.groupModalError.textContent = 'Server error. Please try again.';
            this.groupModalError.classList.remove('d-none');
        }
    }

    async createNewBroker() {
        if (!this.createBrokerForm || !this.brokerModalError) return;
        this.brokerModalError.classList.add('d-none');
        this.brokerModalError.textContent = '';

        const formData = new FormData(this.createBrokerForm);
        try {
            const response = await fetch('/api/broker/create/', {
                method: 'POST',
                body: formData,
                headers: { 'X-CSRFToken': formData.get('csrfmiddlewaretoken') }
            });
            const data = await response.json();

            if (data.success) {
                notifications.showSuccess('Broker created successfully!');
                if (this.createBrokerModal) this.createBrokerModal.hide();

                const brokerSelect = domUtils.getElement('#broker');
                if (brokerSelect) {
                    const newOption = new Option(data.name || formData.get('broker_name'), data.id, true, true);
                    brokerSelect.add(newOption);
                    brokerSelect.value = data.id;
                    brokerSelect.dispatchEvent(new Event('change'));
                }
            } else {
                const errorMsg = data.errors ? Object.values(data.errors).join(' ') : 'Failed to create broker.';
                this.brokerModalError.textContent = errorMsg;
                this.brokerModalError.classList.remove('d-none');
            }
        } catch (err) {
            this.brokerModalError.textContent = 'Server error. Please try again.';
            this.brokerModalError.classList.remove('d-none');
        }
    }

    async createNewSupplier() {
        if (!this.createSupplierForm || !this.supplierModalError) return;
        this.supplierModalError.classList.add('d-none');
        this.supplierModalError.textContent = '';

        const formData = new FormData(this.createSupplierForm);
        try {
            const response = await fetch('/api/supplier/create/', {
                method: 'POST',
                body: formData,
                headers: { 'X-CSRFToken': formData.get('csrfmiddlewaretoken') }
            });
            const data = await response.json();

            if (data.success) {
                notifications.showSuccess('Supplier created successfully!');
                if (this.createSupplierModal) this.createSupplierModal.hide();

                const supplierSelect = domUtils.getElement('#supplier');
                if (supplierSelect) {
                    const newOption = new Option(data.name || formData.get('supplier_name'), data.id, true, true);
                    supplierSelect.add(newOption);
                    supplierSelect.value = data.id;
                    supplierSelect.dispatchEvent(new Event('change'));
                }
            } else {
                const errorMsg = data.errors ? Object.values(data.errors).join(' ') : 'Failed to create supplier.';
                this.supplierModalError.textContent = errorMsg;
                this.supplierModalError.classList.remove('d-none');
            }
        } catch (err) {
            this.supplierModalError.textContent = 'Server error. Please try again.';
            this.supplierModalError.classList.remove('d-none');
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.currentFormInstance = new PurchaseBillForm(window.APP_CONFIG || {});
});
