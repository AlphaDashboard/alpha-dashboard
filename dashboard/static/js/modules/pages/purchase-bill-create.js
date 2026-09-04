import { PurchaseBillAPI } from '../api/purchase-bill-api.js?v=150';
import { domUtils } from '../utils/dom.js?v=150';
import { formatter } from '../utils/formatter.js?v=150';
import { notifications } from '../utils/notifications.js?v=150';

class PurchaseBillForm {

    constructor(config) {
        this.config = config;
        this.form = domUtils.getElement('#purchaseBillForm');
        this.tbody = domUtils.getElement('#itemsTableBody');
        this.rowTemplate = domUtils.getElement('#rowTemplate');
        this.alert = domUtils.getElement('#validationAlert');

        this.totalBasicAmountDisplay = domUtils.getElement('#totalBasicAmountDisplay');
        this.grandTotalDisplay = domUtils.getElement('#grandTotalDisplay');
        this.tableTotalQtyDisplay = domUtils.getElement('#tableTotalQtyDisplay');
        this.tableTotalAmountDisplay = domUtils.getElement('#tableTotalAmountDisplay');
        this.footerTotalQty = domUtils.getElement('#footerTotalQty');
        this.footerTotalTax = domUtils.getElement('#footerTotalTax');

        // Charges Table DOM elements (Tax & Other Expenses Tab)
        this.chargesTable = domUtils.getElement('#chargesTable');
        this.chargesTableBody = domUtils.getElement('#chargesTableBody');
        this.tableTotalChargesDisplay = domUtils.getElement('#tableTotalChargesDisplay');
        this.footerTotalQtyTaxTab = domUtils.getElement('#footerTotalQtyTaxTab');
        this.totalBasicAmountDisplayTaxTab = domUtils.getElement('#totalBasicAmountDisplayTaxTab');
        this.footerTotalTaxTaxTab = domUtils.getElement('#footerTotalTaxTaxTab');
        this.grandTotalDisplayTaxTab = domUtils.getElement('#grandTotalDisplayTaxTab');
        this.generateBillBtnTaxTab = domUtils.getElement('#generateBillBtnTaxTab');
        this.salPurGroupSelect = domUtils.getElement('#salPurGroup');

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
        this.initFloatingLabels();

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
                billDateInput.closest('.form-group')?.classList.add('has-value');
            }
            this.addRow();
            this.updateProgress();
            if (this.salPurGroupSelect && this.salPurGroupSelect.value) {
                await this.onSalPurGroupChange(this.salPurGroupSelect.value);
            } else {
                this.clearChargesTable();
            }
        }

        if (this.config.isViewMode) {
            this.enableViewMode();
        }

        if (this.config.isEditMode && !this.config.isViewMode) {
            this._applyWorkflowLock(this.config.billStatus);
        }
    }

    initFloatingLabels() {
        document.querySelectorAll('.form-group input, .form-group select, .form-group textarea').forEach(el => {
            const toggle = () => {
                if (el.value && el.value.trim() !== '') {
                    el.closest('.form-group')?.classList.add('has-value');
                } else {
                    el.closest('.form-group')?.classList.remove('has-value');
                }
            };
            el.addEventListener('input', toggle);
            el.addEventListener('change', toggle);
            el.addEventListener('focus', () => el.closest('.form-group')?.classList.add('is-focused'));
            el.addEventListener('blur', () => {
                el.closest('.form-group')?.classList.remove('is-focused');
                toggle();
            });
            toggle();
        });
    }

    async onSupplierChange(supplierId, selectElement) {
        const contactInput = domUtils.getElement('#supplierContact');
        const addressInput = domUtils.getElement('#supplierAddress');
        const gstInput = domUtils.getElement('#gstNumber');

        let contact = '';
        let address = '';
        let gst = '';

        const selectedOpt = selectElement ? selectElement.options[selectElement.selectedIndex] : null;
        if (selectedOpt) {
            contact = selectedOpt.getAttribute('data-contact') || '';
            address = selectedOpt.getAttribute('data-address') || '';
            gst = selectedOpt.getAttribute('data-gst') || '';
        }

        if (!contact && !address && !gst && supplierId) {
            try {
                const res = await fetch(`/api/vendor-supplier/${supplierId}/`);
                if (res.ok) {
                    const data = await res.json();
                    if (data.success) {
                        contact = data.contact_no || '';
                        address = data.address || '';
                        gst = data.gst_no || '';
                    }
                }
            } catch (err) {
                console.warn('Failed to fetch supplier details:', err);
            }
        }

        if (contactInput) {
            contactInput.value = contact;
            contactInput.closest('.form-group')?.classList.toggle('has-value', !!contact);
        }
        if (addressInput) {
            addressInput.value = address;
            addressInput.closest('.form-group')?.classList.toggle('has-value', !!address);
        }
        if (gstInput) {
            gstInput.value = gst;
            gstInput.closest('.form-group')?.classList.toggle('has-value', !!gst);
        }

        if (contact || address || gst) {
            const collapseEl = domUtils.getElement('#moreBillDetailsCollapse');
            if (collapseEl && !collapseEl.classList.contains('show') && typeof bootstrap !== 'undefined') {
                const bsCollapse = bootstrap.Collapse.getOrCreateInstance(collapseEl, { toggle: false });
                bsCollapse.show();
            }
        }
    }

    bindEvents() {
        // Table actions
        if (this.tbody) {
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

        // Save button (Unified & Taxes Tab)
        if (this.generateBillBtn) {
            this.generateBillBtn.addEventListener('click', (e) => {
                e.preventDefault();
                const selectedStatus = domUtils.getElement('#billStatus')?.value || 'Draft';
                this.submitForm(selectedStatus);
            });
        }
        if (this.generateBillBtnTaxTab) {
            this.generateBillBtnTaxTab.addEventListener('click', (e) => {
                e.preventDefault();
                const selectedStatus = domUtils.getElement('#billStatus')?.value || 'Draft';
                this.submitForm(selectedStatus);
            });
        }
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

        // Modals
        if (this.createMaterialForm) {
            this.createMaterialForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                await this.createNewMaterial();
            });
        }

        const groupSelect = domUtils.getElement('#salPurGroup');
        if (groupSelect) {
            groupSelect.addEventListener('change', (e) => {
                if (e.target.value === 'add_new') {
                    e.target.value = '';
                    if (this.createSalPurGroupForm) this.createSalPurGroupForm.reset();
                    if (this.groupModalError) this.groupModalError.classList.add('d-none');
                    if (this.createSalPurGroupModal) this.createSalPurGroupModal.show();
                } else if (e.target.value) {
                    this.onSalPurGroupChange(e.target.value);
                } else {
                    this.clearChargesTable();
                }
            });
        }

        if (this.createSalPurGroupForm) {
            this.createSalPurGroupForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                await this.createNewGroup();
            });
        }

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

        const supplierSelect = domUtils.getElement('#supplier');
        if (supplierSelect) {
            supplierSelect.addEventListener('change', async (e) => {
                const val = e.target.value;
                if (val === 'add_new') {
                    e.target.value = '';
                    if (this.createSupplierForm) this.createSupplierForm.reset();
                    if (this.supplierModalError) this.supplierModalError.classList.add('d-none');
                    if (this.createSupplierModal) this.createSupplierModal.show();
                    return;
                }
                if (val) {
                    await this.onSupplierChange(val, e.target);
                }
            });
        }

        if (this.createSupplierForm) {
            this.createSupplierForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                await this.createNewSupplier();
            });
        }

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

        // Global Escape key to navigate Back (matching Subsection B)
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                const isSelect2Open = document.querySelectorAll('.select2-container--open, .select2-dropdown').length > 0;
                const isModalOpen = document.querySelector('.modal.show') !== null;
                const isFlatpickrOpen = document.querySelector('.flatpickr-calendar.open') !== null;
                const gpPanel = domUtils.getElement('#gpDropdownPanel');
                const isGpOpen = gpPanel && gpPanel.style.display !== 'none' && gpPanel.style.display !== '';
                const poPanel = domUtils.getElement('#poDropdownPanel');
                const isPoOpen = poPanel && poPanel.style.display !== 'none' && poPanel.style.display !== '';

                if (isSelect2Open || isModalOpen || isFlatpickrOpen || isGpOpen || isPoOpen) {
                    return;
                }

                const backBtn = document.querySelector('.erp-btn-back') || document.getElementById('backBtn');
                if (backBtn) {
                    e.preventDefault();
                    backBtn.click();
                } else {
                    window.location.href = '/purchase-bill/';
                }
            }
        });
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
                row.style.cssText = 'display:grid; grid-template-columns:90px 95px 110px 110px 1fr; padding:6px 8px; font-size:11.5px; cursor:pointer; border-bottom:1px solid #f1f5f9; color:#334155;';
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
                    gpDisplayInput.closest('.form-group')?.classList.add('has-value');
                    
                    const gpDateField = domUtils.getElement('#gatePassDate');
                    if (gpDateField) {
                        gpDateField.value = gp.GatePassdate ? gp.GatePassdate.split('T')[0] : '';
                        gpDateField.closest('.form-group')?.classList.add('has-value');
                    }

                    if (gp.supplier_name) {
                        const supSelect = domUtils.getElement('#supplier');
                        if (supSelect) {
                            const matchOpt = Array.from(supSelect.options).find(opt => opt.text.trim().toLowerCase() === gp.supplier_name.trim().toLowerCase());
                            if (matchOpt) {
                                supSelect.value = matchOpt.value;
                                supSelect.closest('.form-group')?.classList.add('has-value');
                            }
                        }
                    }

                    closeGpDropdown();
                });
                gpDropdownList.appendChild(row);
            });
        };

        gpDisplayInput.addEventListener('click', (e) => {
            e.stopPropagation();
            openGpDropdown();
        });

        gpDisplayInput.addEventListener('focus', () => {
            openGpDropdown();
        });

        gpDisplayInput.addEventListener('input', () => {
            openGpDropdown();
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

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
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
            renderPoDropdownRows(poDisplayInput.value || '');
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
                row.style.cssText = 'display:grid; grid-template-columns:130px 100px 1fr; padding:6px 8px; font-size:11.5px; cursor:pointer; border-bottom:1px solid #f1f5f9; color:#334155;';
                row.innerHTML = `
                    <span style="font-weight:600; color:#2563eb;">${escHtml(po.po_no)}</span>
                    <span>${escHtml(po.po_date || '—')}</span>
                    <span>${escHtml(po.supplier_name || '—')}</span>
                `;
                row.addEventListener('mouseenter', () => row.style.backgroundColor = '#eff6ff');
                row.addEventListener('mouseleave', () => row.style.backgroundColor = '');
                row.addEventListener('click', async () => {
                    poHiddenInput.value  = po.po_no;
                    poDisplayInput.value = po.po_no;
                    poDisplayInput.closest('.form-group')?.classList.add('has-value');
                    
                    const poDateField = domUtils.getElement('#poDate');
                    if (poDateField) {
                        poDateField.value = po.po_date || '';
                        poDateField.closest('.form-group')?.classList.add('has-value');
                    }

                    if (po.supplier_name) {
                        const supSelect = domUtils.getElement('#supplier');
                        if (supSelect) {
                            const matchOpt = Array.from(supSelect.options).find(opt => opt.text.trim().toLowerCase() === po.supplier_name.trim().toLowerCase());
                            if (matchOpt) {
                                supSelect.value = matchOpt.value;
                                supSelect.closest('.form-group')?.classList.add('has-value');
                            }
                        }
                    }

                    // Auto-fill additional fields from PO if available
                    try {
                        const poDetail = await apiClient.get(`/api/subsection-x/${encodeURIComponent(po.po_no)}/`);
                        if (poDetail) {
                            if (poDetail.broker) {
                                const brokerSelect = domUtils.getElement('#broker');
                                if (brokerSelect) {
                                    brokerSelect.value = String(poDetail.broker);
                                    brokerSelect.closest('.form-group')?.classList.add('has-value');
                                }
                            }
                            if (poDetail.zone_name) {
                                const zoneSelect = domUtils.getElement('#zoneName');
                                if (zoneSelect) {
                                    zoneSelect.value = poDetail.zone_name;
                                    zoneSelect.closest('.form-group')?.classList.add('has-value');
                                }
                            }
                            if (poDetail.sal_pur_group) {
                                const salPurGroupSelect = domUtils.getElement('#salPurGroup');
                                if (salPurGroupSelect) {
                                    salPurGroupSelect.value = String(poDetail.sal_pur_group);
                                    salPurGroupSelect.closest('.form-group')?.classList.add('has-value');
                                }
                            }
                            if (poDetail.supplier_contact) {
                                const supContact = domUtils.getElement('#supplierContact');
                                if (supContact) {
                                    supContact.value = poDetail.supplier_contact;
                                    supContact.closest('.form-group')?.classList.add('has-value');
                                }
                            }
                            if (poDetail.supplier_address) {
                                const supAddr = domUtils.getElement('#supplierAddress');
                                if (supAddr) {
                                    supAddr.value = poDetail.supplier_address;
                                    supAddr.closest('.form-group')?.classList.add('has-value');
                                }
                            }
                            if (poDetail.gst_number) {
                                const gstField = domUtils.getElement('#gstNumber');
                                if (gstField) {
                                    gstField.value = poDetail.gst_number;
                                    gstField.closest('.form-group')?.classList.add('has-value');
                                }
                            }
                            if (poDetail.delivery_location) {
                                const delLoc = domUtils.getElement('#deliveryLocation');
                                if (delLoc) {
                                    delLoc.value = poDetail.delivery_location;
                                    delLoc.closest('.form-group')?.classList.add('has-value');
                                }
                            }
                            if (poDetail.delivery_terms) {
                                const delTerms = domUtils.getElement('#deliveryTerms');
                                if (delTerms) {
                                    delTerms.value = poDetail.delivery_terms;
                                    delTerms.closest('.form-group')?.classList.add('has-value');
                                }
                            }
                            if (poDetail.payment_terms) {
                                const payTerms = domUtils.getElement('#paymentTerms');
                                if (payTerms) {
                                    payTerms.value = poDetail.payment_terms;
                                    payTerms.closest('.form-group')?.classList.add('has-value');
                                }
                            }
                            if (poDetail.freight_terms) {
                                const frtTerms = domUtils.getElement('#freightTerms');
                                if (frtTerms) {
                                    frtTerms.value = poDetail.freight_terms;
                                    frtTerms.closest('.form-group')?.classList.add('has-value');
                                }
                            }
                        }
                    } catch (err) {
                        console.warn('Could not load extra PO details:', err);
                    }

                    closePoDropdown();
                });
                poDropdownList.appendChild(row);
            });
        };

        poDisplayInput.addEventListener('click', (e) => {
            e.stopPropagation();
            openPoDropdown();
        });

        poDisplayInput.addEventListener('focus', () => {
            openPoDropdown();
        });

        poDisplayInput.addEventListener('input', () => {
            openPoDropdown();
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

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
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

    async onSalPurGroupChange(groupId) {
        if (!groupId || groupId === 'add_new') {
            this.clearChargesTable();
            return;
        }

        try {
            const response = await fetch(`/api/sal-pur-group/${groupId}/`);
            if (!response.ok) throw new Error('Failed to fetch group details');
            const data = await response.json();
            this.populateChargesTable(data.transactions || []);
        } catch (err) {
            console.error('Error fetching sales/purchase group charges:', err);
            this.clearChargesTable();
        }
    }

    clearChargesTable() {
        if (!this.chargesTableBody) return;
        this.chargesTableBody.innerHTML = `
            <tr id="noChargesRow">
                <td colspan="4" class="text-center text-muted py-4" style="font-size:12px;">
                    <i class="bi bi-info-circle me-1"></i> Please select a Sales/Purchase Group to load charges.
                </td>
            </tr>
        `;
        this.calculateTotals();
    }

    populateChargesTable(transactions = []) {
        if (!this.chargesTableBody) return;
        this.chargesTableBody.innerHTML = '';

        if (!transactions || transactions.length === 0) {
            this.chargesTableBody.innerHTML = `
                <tr id="noChargesRow">
                    <td colspan="4" class="text-center text-muted py-4" style="font-size:12px;">
                        <i class="bi bi-info-circle me-1"></i> No charges defined for this Sales/Purchase Group.
                    </td>
                </tr>
            `;
            this.calculateTotals();
            return;
        }

        const isViewMode = this.config.isViewMode;

        transactions.forEach((tx, idx) => {
            const row = document.createElement('tr');
            row.className = 'charge-row';
            row.dataset.chargeId = tx.ID || '';
            row.dataset.chargeName = tx.ChargesName || '';
            row.dataset.debitCredit = tx.Debit_D_Credit_C || 'D';
            row.dataset.autoManual = tx.Auto_Y_Manual_N ? '1' : '0';
            row.dataset.account = tx.ChargeAccountID || '';

            const rateVal = parseFloat(tx.Rate) || 0;
            const rateFormatted = rateVal.toFixed(2);

            const isCredit = (tx.Debit_D_Credit_C === 'C');
            const typeBadge = isCredit ? '<span class="badge bg-warning text-dark ms-1" style="font-size:9.5px; font-weight:600;">Discount (-)</span>' : '';

            row.innerHTML = `
                <td class="text-center text-muted" style="font-size:11.5px; font-weight:600;">${idx + 1}</td>
                <td>
                    <span class="fw-semibold text-dark" style="font-size:12px;">${tx.ChargesName || 'Charge'}</span>
                    ${typeBadge}
                </td>
                <td class="text-end">
                    <input type="number" step="0.01" class="form-control text-end charge-rate"
                           value="${rateFormatted}" placeholder="0.00"
                           ${isViewMode ? 'disabled' : ''}>
                </td>
                <td class="text-end">
                    <input type="number" step="0.01" class="form-control text-end charge-amount"
                           value="0.00" placeholder="0.00"
                           ${isViewMode ? 'disabled' : ''}>
                </td>
            `;

            // Event listeners for rate and amount changes
            const rateInput = row.querySelector('.charge-rate');
            const amountInput = row.querySelector('.charge-amount');

            if (rateInput) {
                rateInput.addEventListener('input', () => {
                    row.dataset.userEditedRate = '1';
                    delete row.dataset.userEditedAmount; // Recompute amount based on new rate
                    this.calculateTotals();
                });
                rateInput.addEventListener('change', () => this.calculateTotals());
            }

            if (amountInput) {
                amountInput.addEventListener('input', () => {
                    row.dataset.userEditedAmount = '1';
                    this.calculateTotals();
                });
                amountInput.addEventListener('change', () => this.calculateTotals());
            }

            this.chargesTableBody.appendChild(row);
        });

        this.calculateTotals();
    }

    calculateTotals() {
        let totalQty = 0;
        let totalBasic = 0;
        if (this.tbody) {
            this.tbody.querySelectorAll('.row-qty').forEach(input => {
                totalQty += parseFloat(input.value) || 0;
            });
            this.tbody.querySelectorAll('.row-amount').forEach(input => {
                totalBasic += parseFloat(input.value) || 0;
            });
        }

        // 1. Update Column-aligned Totals in Items Table and Footer Displays
        const qtyFormatted = totalQty.toFixed(2);
        const totalBasicFormatted = formatter.formatCurrency(totalBasic);

        if (this.tableTotalQtyDisplay) this.tableTotalQtyDisplay.textContent = qtyFormatted;
        if (this.tableTotalAmountDisplay) this.tableTotalAmountDisplay.textContent = totalBasicFormatted;
        if (this.footerTotalQty) this.footerTotalQty.textContent = qtyFormatted;
        if (this.footerTotalQtyTaxTab) this.footerTotalQtyTaxTab.textContent = qtyFormatted;
        if (this.totalBasicAmountDisplay) this.totalBasicAmountDisplay.textContent = totalBasicFormatted;
        if (this.totalBasicAmountDisplayTaxTab) this.totalBasicAmountDisplayTaxTab.textContent = totalBasicFormatted;

        // 2. Dynamic Charges Table Calculation
        let totalTaxesCharges = 0;
        if (this.chargesTableBody) {
            const chargeRows = this.chargesTableBody.querySelectorAll('.charge-row');
            chargeRows.forEach(row => {
                const rateInput = row.querySelector('.charge-rate');
                const amountInput = row.querySelector('.charge-amount');
                const isCredit = (row.dataset.debitCredit === 'C');
                const isAuto = (row.dataset.autoManual !== '0');
                const userEditedAmount = (row.dataset.userEditedAmount === '1');

                const rate = rateInput ? (parseFloat(rateInput.value) || 0) : 0;
                let amount = amountInput ? (parseFloat(amountInput.value) || 0) : 0;

                // Auto compute amount from rate if user hasn't typed a fixed amount
                if (!userEditedAmount && (rate > 0 || isAuto)) {
                    amount = (totalBasic * rate) / 100;
                    if (amountInput) amountInput.value = amount.toFixed(2);
                }

                if (isCredit) {
                    totalTaxesCharges -= amount; // Discount / deduction
                } else {
                    totalTaxesCharges += amount; // Tax / expense / addition
                }
            });
        }

        // 3. Grand Total Calculation
        const rawGrandTotal = totalBasic + totalTaxesCharges;
        const roundedGrandTotal = Math.round(rawGrandTotal);

        const totalTaxesChargesFormatted = formatter.formatCurrency(totalTaxesCharges);
        const grandTotalFormatted = formatter.formatCurrency(roundedGrandTotal);

        if (this.tableTotalChargesDisplay) this.tableTotalChargesDisplay.textContent = totalTaxesChargesFormatted;
        if (this.footerTotalTax) this.footerTotalTax.textContent = totalTaxesChargesFormatted;
        if (this.footerTotalTaxTaxTab) this.footerTotalTaxTaxTab.textContent = totalTaxesChargesFormatted;
        if (this.grandTotalDisplay) this.grandTotalDisplay.textContent = grandTotalFormatted;
        if (this.grandTotalDisplayTaxTab) this.grandTotalDisplayTaxTab.textContent = grandTotalFormatted;
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

        const fill = domUtils.getElement('#statusProgressFill');
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

            if (billNoEl) {
                billNoEl.value = data.bill_no || billNo;
                billNoEl.closest('.form-group')?.classList.add('has-value');
            }
            const billDateEl = domUtils.getElement('#billDate');
            if (billDateEl) {
                billDateEl.value = data.bill_date ? data.bill_date.split('T')[0] : '';
                if (billDateEl.value) billDateEl.closest('.form-group')?.classList.add('has-value');
            }
            const expDateEl = domUtils.getElement('#expectedDeliveryDate');
            if (expDateEl) {
                expDateEl.value = data.expected_delivery_date ? data.expected_delivery_date.split('T')[0] : '';
                if (expDateEl.value) expDateEl.closest('.form-group')?.classList.add('has-value');
            }
            const invoiceNoEl = domUtils.getElement('#invoiceNo');
            if (invoiceNoEl) {
                invoiceNoEl.value = data.invoice_no || '';
                if (invoiceNoEl.value) invoiceNoEl.closest('.form-group')?.classList.add('has-value');
            }
            if (this.billStatusSelect) {
                this.billStatusSelect.value = data.bill_status || 'Draft';
                this.billStatusSelect.closest('.form-group')?.classList.add('has-value');
            }

            // Gate Pass & PO No fields
            const gpNoEl = domUtils.getElement('#gatePassNo');
            const gpDispEl = domUtils.getElement('#gatePassNoDisplay');
            const gpDateEl = domUtils.getElement('#gatePassDate');
            if (gpNoEl) gpNoEl.value = data.gate_pass_no || '';
            if (gpDispEl) {
                gpDispEl.value = data.gate_pass_no || '';
                if (gpDispEl.value) gpDispEl.closest('.form-group')?.classList.add('has-value');
            }
            if (gpDateEl) {
                gpDateEl.value = data.gate_pass_date ? data.gate_pass_date.split('T')[0] : '';
                if (gpDateEl.value) gpDateEl.closest('.form-group')?.classList.add('has-value');
            }

            const poNoEl = domUtils.getElement('#poNo');
            const poDispEl = domUtils.getElement('#poNoDisplay');
            const poDateEl = domUtils.getElement('#poDate');
            if (poNoEl) poNoEl.value = data.po_no || '';
            if (poDispEl) {
                poDispEl.value = data.po_no || '';
                if (poDispEl.value) poDispEl.closest('.form-group')?.classList.add('has-value');
            }
            if (poDateEl) {
                poDateEl.value = data.po_date ? data.po_date.split('T')[0] : '';
                if (poDateEl.value) poDateEl.closest('.form-group')?.classList.add('has-value');
            }

            // Group, Broker, Supplier
            const groupSelect = domUtils.getElement('#salPurGroup');
            if (groupSelect) {
                const groupVal = (data.sal_pur_group !== null && data.sal_pur_group !== undefined) ? String(data.sal_pur_group) : '';
                if (groupVal !== '' && !groupSelect.querySelector(`option[value="${groupVal}"]`)) {
                    const text = data.sal_pur_group_display?.text || `Unknown Group (ID: ${groupVal})`;
                    const opt = new Option(text, groupVal, true, true);
                    groupSelect.add(opt);
                }
                groupSelect.value = groupVal;
                if (groupVal !== '') {
                    groupSelect.closest('.form-group')?.classList.add('has-value');
                    await this.onSalPurGroupChange(groupVal);
                }
            }

            const brokerSelect = domUtils.getElement('#broker');
            if (brokerSelect) {
                const brokerVal = (data.broker !== null && data.broker !== undefined) ? String(data.broker) : '';
                if (brokerVal !== '' && !brokerSelect.querySelector(`option[value="${brokerVal}"]`)) {
                    const text = data.broker_display?.text || `Unknown Broker (ID: ${brokerVal})`;
                    const opt = new Option(text, brokerVal, true, true);
                    brokerSelect.add(opt);
                }
                brokerSelect.value = brokerVal;
                if (brokerVal !== '') brokerSelect.closest('.form-group')?.classList.add('has-value');
            }

            const supplierSelect = domUtils.getElement('#supplier');
            if (supplierSelect) {
                const supplierVal = (data.supplier !== null && data.supplier !== undefined) ? String(data.supplier) : '';
                if (supplierVal !== '' && !supplierSelect.querySelector(`option[value="${supplierVal}"]`)) {
                    const text = data.supplier_display?.text || `Unknown Supplier (ID: ${supplierVal})`;
                    const opt = new Option(text, supplierVal, true, true);
                    supplierSelect.add(opt);
                }
                supplierSelect.value = supplierVal;
                if (supplierVal !== '') supplierSelect.closest('.form-group')?.classList.add('has-value');
            }

            const zoneNameEl = domUtils.getElement('#zoneName');
            if (zoneNameEl) {
                zoneNameEl.value = data.zone_name || '';
                if (zoneNameEl.value) zoneNameEl.closest('.form-group')?.classList.add('has-value');
            }

            const scEl = domUtils.getElement('#supplierContact');
            if (scEl) {
                scEl.value = data.supplier_contact || '';
                if (scEl.value) scEl.closest('.form-group')?.classList.add('has-value');
            }
            const saEl = domUtils.getElement('#supplierAddress');
            if (saEl) {
                saEl.value = data.supplier_address || '';
                if (saEl.value) saEl.closest('.form-group')?.classList.add('has-value');
            }
            const gstEl = domUtils.getElement('#gstNumber');
            if (gstEl) {
                gstEl.value = data.gst_number || '';
                if (gstEl.value) gstEl.closest('.form-group')?.classList.add('has-value');
            }

            // If contact, address, or GST are empty on the voucher header, auto-fill from selected supplier
            if (supplierSelect && supplierSelect.value !== '' && (!scEl?.value || !saEl?.value || !gstEl?.value)) {
                this.onSupplierChange(supplierSelect.value, supplierSelect);
            }

            // Delivery section
            const dlEl = domUtils.getElement('#deliveryLocation');
            if (dlEl) { dlEl.value = data.delivery_location || ''; if (dlEl.value) dlEl.closest('.form-group')?.classList.add('has-value'); }
            const dtEl = domUtils.getElement('#deliveryTerms');
            if (dtEl) { dtEl.value = data.delivery_terms || ''; if (dtEl.value) dtEl.closest('.form-group')?.classList.add('has-value'); }
            const ptEl = domUtils.getElement('#paymentTerms');
            if (ptEl) { ptEl.value = data.payment_terms || ''; if (ptEl.value) ptEl.closest('.form-group')?.classList.add('has-value'); }
            const ftEl = domUtils.getElement('#freightTerms');
            if (ftEl) { ftEl.value = data.freight_terms || ''; if (ftEl.value) ftEl.closest('.form-group')?.classList.add('has-value'); }
            const curEl = domUtils.getElement('#currency');
            if (curEl) { curEl.value = data.currency || 'INR'; if (curEl.value) curEl.closest('.form-group')?.classList.add('has-value'); }

            // Additional
            const pnEl = domUtils.getElement('#purchaserName');
            if (pnEl) { pnEl.value = data.purchaser_name || ''; if (pnEl.value) pnEl.closest('.form-group')?.classList.add('has-value'); }
            const depEl = domUtils.getElement('#department');
            if (depEl) { depEl.value = data.department || ''; if (depEl.value) depEl.closest('.form-group')?.classList.add('has-value'); }
            const ccEl = domUtils.getElement('#costCenter');
            if (ccEl) { ccEl.value = data.cost_center || ''; if (ccEl.value) ccEl.closest('.form-group')?.classList.add('has-value'); }
            const siEl = domUtils.getElement('#specialInstructions');
            if (siEl) { siEl.value = data.special_instructions || ''; if (siEl.value) siEl.closest('.form-group')?.classList.add('has-value'); }
            const inEl = domUtils.getElement('#internalNotes');
            if (inEl) { inEl.value = data.internal_notes || ''; if (inEl.value) inEl.closest('.form-group')?.classList.add('has-value'); }

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

        let isValid = true;
        const val = (field.value || '').trim();

        if (field.id === 'billDate' || field.id === 'salPurGroup' || field.id === 'broker' || field.id === 'zoneName' || field.id === 'supplier' || field.id === 'deliveryLocation') {
            if (!val) isValid = false;
        } else if (field.classList.contains('row-item')) {
            if (!val) isValid = false;
        } else if (field.classList.contains('row-qty') || field.classList.contains('row-rate')) {
            const n = parseFloat(val);
            if (!val || isNaN(n) || n <= 0) isValid = false;
        } else if (field.hasAttribute('required') && !val) {
            isValid = false;
        }

        if (isValid) {
            field.classList.remove('is-invalid');
        } else {
            field.classList.add('is-invalid');
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
                const section = firstInvalid.closest('#panel-items, #panel-terms, #panel-additional');
                if (section) {
                    const tabId = section.id;
                    let btnId = '';
                    if (tabId === 'panel-items') btnId = '#tab-items';
                    else if (tabId === 'panel-terms') btnId = '#tab-terms';
                    else if (tabId === 'panel-additional') btnId = '#tab-additional';
                    
                    const tabBtn = document.querySelector(btnId);
                    if (tabBtn) {
                        const tabInstance = bootstrap.Tab.getOrCreateInstance(tabBtn);
                        if (tabInstance) tabInstance.show();
                    }
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
            invoice_no:             domUtils.getElement('#invoiceNo')?.value?.trim() || null,
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

        let totalBasic = 0;
        payload.items.forEach(it => {
            totalBasic += (it.order_qty * it.unit_rate);
        });

        let totalTaxesCharges = 0;
        if (this.chargesTableBody) {
            this.chargesTableBody.querySelectorAll('.charge-row').forEach(row => {
                const amountInput = row.querySelector('.charge-amount');
                const isCredit = (row.dataset.debitCredit === 'C');
                const amount = amountInput ? (parseFloat(amountInput.value) || 0) : 0;
                if (isCredit) {
                    totalTaxesCharges -= amount;
                } else {
                    totalTaxesCharges += amount;
                }
            });
        }

        payload.total_basic_amount = parseFloat(totalBasic.toFixed(2));
        payload.taxes = parseFloat(totalTaxesCharges.toFixed(2));
        payload.grand_total = parseFloat((totalBasic + totalTaxesCharges).toFixed(2));

        try {
            if (this.config.isEditMode) {
                await PurchaseBillAPI.update(this.config.voucherNo, payload);
                notifications.showSuccess('Purchase Voucher updated successfully');
                setTimeout(() => { window.location.href = '/purchase-bill/'; }, 800);
            } else {
                await PurchaseBillAPI.create(payload);
                notifications.showSuccess('Purchase Voucher created successfully');
                this.resetForm();
            }
        } catch (err) {
            let errorMsg = 'An error occurred during submission.';
            if (err.response?.data) {
                if (typeof err.response.data === 'string') {
                    errorMsg = err.response.data.includes('<html') ? 'Server error occurred while saving voucher.' : err.response.data;
                } else if (typeof err.response.data === 'object') {
                    errorMsg = Object.entries(err.response.data)
                        .map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(', ') : v}`)
                        .join(' | ');
                }
            } else if (err.message) {
                errorMsg = err.message;
            }
            this.showErrors(`<i class="bi bi-exclamation-triangle-fill me-2"></i>${errorMsg}`);
            notifications.showError(errorMsg);
        }
    }

    resetForm() {
        if (this.form) {
            this.form.reset();
        }
        if (this.tbody) {
            this.tbody.innerHTML = '';
        }
        this.clearChargesTable();
        this.selectedGP = null;
        this.selectedPO = null;

        const billDateInput = domUtils.getElement('#billDate');
        if (billDateInput) {
            const today = new Date().toISOString().split('T')[0];
            billDateInput.value = today;
        }

        const invoiceNoInput = domUtils.getElement('#invoiceNo');
        if (invoiceNoInput) {
            invoiceNoInput.value = '';
        }

        if (this.billStatusSelect) {
            this.billStatusSelect.value = 'Draft';
        }

        this.addRow();
        this.calculateTotals();
        this.updateProgress();

        document.querySelectorAll('.form-group input, .form-group select, .form-group textarea').forEach(el => {
            if (el.value !== '') {
                el.closest('.form-group')?.classList.add('has-value');
            } else {
                el.closest('.form-group')?.classList.remove('has-value');
            }
        });
        domUtils.getElement('#billNo')?.closest('.form-group')?.classList.add('has-value');
        domUtils.getElement('#billDate')?.closest('.form-group')?.classList.add('has-value');
        domUtils.getElement('#billStatus')?.closest('.form-group')?.classList.add('has-value');
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
                    groupSelect.closest('.form-group')?.classList.add('has-value');
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
                    brokerSelect.closest('.form-group')?.classList.add('has-value');
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
                    supplierSelect.closest('.form-group')?.classList.add('has-value');
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
