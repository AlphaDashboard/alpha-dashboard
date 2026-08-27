import { PurchaseOrderAPI } from '../api/purchase-order-api.js?v=147';
import { domUtils } from '../utils/dom.js?v=147';
import { formatter } from '../utils/formatter.js?v=147';
import { notifications } from '../utils/notifications.js?v=147';

class PurchaseOrderForm {

    constructor(config) {
        this.config = config;
        this.form = domUtils.getElement('#purchaseOrderForm');
        this.tbody = domUtils.getElement('#itemsTableBody');
        this.rowTemplate = domUtils.getElement('#rowTemplate');
        this.alert = domUtils.getElement('#validationAlert');

        this.totalBasicAmountDisplay = domUtils.getElement('#totalBasicAmountDisplay');
        this.taxesDisplay = domUtils.getElement('#taxesDisplay');
        this.grandTotalDisplay = domUtils.getElement('#grandTotalDisplay');

        this.saveDraftBtn = domUtils.getElement('#saveDraftBtn');
        this.submitApprovalBtn = domUtils.getElement('#submitApprovalBtn');
        this.generatePOBtn = domUtils.getElement('#generatePOBtn');
        this.poStatusSelect = domUtils.getElement('#poStatus');

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

        if (this.config.isEditMode && this.config.voucherNo) {
            await this.loadData(this.config.voucherNo);
        } else {
            if (this.poStatusSelect) {
                this.poStatusSelect.value = 'Draft';
            }
            const poDateInput = domUtils.getElement('#poDate');
            if (poDateInput) {
                const today = new Date().toISOString().split('T')[0];
                poDateInput.value = today;
                poDateInput.dispatchEvent(new Event('change'));
            }
            this.addRow();
            this.updateProgress();
        }

        if (this.config.isViewMode) {
            this.enableViewMode();
        }

        // Auto-lock form if PO is in a locked state (edit mode, not view mode)
        if (this.config.isEditMode && !this.config.isViewMode) {
            this._applyWorkflowLock(this.config.poStatus);
        }
    }

    bindEvents() {
        // Add item row
        if (this.addItemBtn) {
            this.addItemBtn.addEventListener('click', () => this.addRow());
        }

        // Table actions (delegated)
        if (this.tbody) {

            // Inline + button: insert new row AFTER the clicked row
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

            // Delete button — confirm before removing
            domUtils.delegate('#itemsTableBody', 'click', '.remove-row-btn', (e, target) => {
                const row = target.closest('.item-row');
                if (!row) return;
                if (!confirm('Are you sure you want to delete this row?')) return;
                row.remove();
                
                // Ensure at least one row remains
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
                    target.value = ''; // Reset so it doesn't stay stuck
                    this.activeItemDropdown = target;
                    if (this.createMaterialForm) this.createMaterialForm.reset();
                    if (this.materialModalError) this.materialModalError.classList.add('d-none');
                    if (this.createMaterialModal) this.createMaterialModal.show();
                }
            });
        }

        // PO Status → progress bar
        if (this.poStatusSelect) {
            this.poStatusSelect.addEventListener('change', () => this.updateProgress());
        }

        // Save buttons
        if (this.saveDraftBtn) {
            this.saveDraftBtn.addEventListener('click', () => this.submitForm('Draft'));
        }
        if (this.submitApprovalBtn) {
            // Submit for Approval → sets po_status = 'Submitted'
            this.submitApprovalBtn.addEventListener('click', () => this.submitForm('Submitted'));
        }
        if (this.form) {
            this.form.addEventListener('submit', (e) => {
                e.preventDefault();
                // Generate PO → saves with whatever status is currently selected in the dropdown
                const selectedStatus = domUtils.getElement('#poStatus')?.value || 'Draft';
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
                    e.target.value = ''; // Reset select
                    if (this.createSalPurGroupForm) this.createSalPurGroupForm.reset();
                    if (this.groupModalError) this.groupModalError.classList.add('d-none');
                    if (this.createSalPurGroupModal) this.createSalPurGroupModal.show();
                }
            });
        }

        // Handle Group creation submission
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
                    e.target.value = ''; // Reset select
                    if (this.createBrokerForm) this.createBrokerForm.reset();
                    if (this.brokerModalError) this.brokerModalError.classList.add('d-none');
                    if (this.createBrokerModal) this.createBrokerModal.show();
                }
            });
        }

        // Handle Broker creation submission
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
                    e.target.value = ''; // Reset select
                    if (this.createSupplierForm) this.createSupplierForm.reset();
                    if (this.supplierModalError) this.supplierModalError.classList.add('d-none');
                    if (this.createSupplierModal) this.createSupplierModal.show();
                }
            });
        }

        // Handle Supplier creation submission
        if (this.createSupplierForm) {
            this.createSupplierForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                await this.createNewSupplier();
            });
        }

        // Handle Optional Fields Chevron rotation
        const collapseEl = domUtils.getElement('#morePODetailsCollapse');
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

    // Remove old addItemBtn event — now handled by inline + buttons
    // (kept empty to avoid breaking old references)

    isRowEmpty(row) {
        const itemVal    = row.querySelector('.row-item')?.value || '';
        const qtyVal     = row.querySelector('.row-qty')?.value || '';
        const rateVal    = row.querySelector('.row-rate')?.value || '';
        const remarksVal = row.querySelector('.row-remarks')?.value || '';
        return !itemVal && !qtyVal && !rateVal && !remarksVal;
    }

    // Clone a row from the template
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
        
        // Auto-scroll scrollable table wrapper to bottom on row addition
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
            // Update row number
            const numCell = row.querySelector('.row-num');
            if (numCell) numCell.textContent = idx + 1;

            const addBtn = row.querySelector('.add-row-btn');
            const delBtn = row.querySelector('.remove-row-btn');

            // Row 1 (idx=0): show + only, hide delete
            // All other rows: show both + and delete
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
        amountInput.value = (qty * rate).toFixed(2);
    }

    calculateTotals() {
        if (!this.tbody) return;
        let basicTotal = 0;
        this.tbody.querySelectorAll('.item-row').forEach(row => {
            const amountInput = row.querySelector('.row-amount');
            if (amountInput) basicTotal += parseFloat(amountInput.value) || 0;
        });

        const taxes     = 0;
        const grandTotal = basicTotal;

        if (this.totalBasicAmountDisplay)
            this.totalBasicAmountDisplay.textContent = formatter.formatCurrency(basicTotal);
            
        const tableTotalBasicAmountDisplay = domUtils.getElement('#tableTotalBasicAmountDisplay');
        if (tableTotalBasicAmountDisplay)
            tableTotalBasicAmountDisplay.value = formatter.formatCurrency(basicTotal);
            
        if (this.taxesDisplay)
            this.taxesDisplay.textContent = formatter.formatCurrency(taxes);
        if (this.grandTotalDisplay)
            this.grandTotalDisplay.textContent = formatter.formatCurrency(grandTotal);
    }

    updateProgress() {
        if (!this.poStatusSelect) return;
        const status = this.poStatusSelect.value;

        // New 4-step workflow: Draft(0) → Submitted(1) → RefBack(2) → Approved(3)
        const steps = ['Draft', 'Submitted', 'RefBack', 'Approved'];
        let activeIndex = 0;
        if      (status === 'Submitted') activeIndex = 1;
        else if (status === 'RefBack')   activeIndex = 2;
        else if (status === 'Approved')  activeIndex = 3;

        document.querySelectorAll('.progress-step').forEach((el, idx) => {
            el.classList.toggle('active', idx <= activeIndex);
        });

        const fill = document.getElementById('progressLineFill');
        if (fill) fill.style.width = ((activeIndex / (steps.length - 1)) * 100) + '%';
    }

    async loadData(id) {
        // Show a loading state so the form doesn't appear blank while fetching
        const poNoEl = domUtils.getElement('#poNo');
        if (poNoEl) poNoEl.value = 'Loading...';

        try {
            const data = await PurchaseOrderAPI.getById(id);

            domUtils.getElement('#poNo').value = data.po_no;
            if (data.po_date) {
                domUtils.getElement('#poDate').value = data.po_date.split('T')[0];
            }
            if (data.expected_delivery_date) {
                domUtils.getElement('#expectedDeliveryDate').value = data.expected_delivery_date;
            }
            if (this.poStatusSelect) this.poStatusSelect.value = data.po_status || 'Draft';

            // Sales/Purchase Group
            const groupSelect = domUtils.getElement('#salPurGroup');
            if (groupSelect) {
                const groupVal = data.sal_pur_group || '';
                if (groupVal && !groupSelect.querySelector(`option[value="${groupVal}"]`)) {
                    const text = data.sal_pur_group_display?.text || `Unknown Group (ID: ${groupVal})`;
                    const opt = new Option(text, groupVal, true, true);
                    groupSelect.add(opt);
                }
                groupSelect.value = groupVal;
                groupSelect.dispatchEvent(new Event('change'));
            }

            // Auto-expand optional fields if any of them are populated
            if (data.supplier_contact || data.supplier_address || data.gst_number) {
                const collapseEl = domUtils.getElement('#morePODetailsCollapse');
                if (collapseEl) {
                    const collapseInst = bootstrap.Collapse.getOrCreateInstance(collapseEl, { toggle: false });
                    collapseInst.show();
                }
            }

            // Supplier section
            const brokerSelect = domUtils.getElement('#broker');
            if (brokerSelect) {
                const brokerVal = (data.broker !== null && data.broker !== undefined) ? String(data.broker) : '';
                if (brokerVal !== '' && !brokerSelect.querySelector(`option[value="${brokerVal}"]`)) {
                    const text = data.broker_display?.text || `Unknown Broker (ID: ${brokerVal})`;
                    const opt = new Option(text, brokerVal, true, true);
                    brokerSelect.add(opt);
                }
                brokerSelect.value = brokerVal;
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
            // If no items are saved, add one empty row for editing
            if (itemsCount === 0) {
                this.addRow();
            }

            this.updateProgress();
            this.calculateTotals();

            // Dispatch change events to trigger floating labels
            this.form.querySelectorAll('.erp-floating-input').forEach(input => {
                input.dispatchEvent(new Event('change'));
            });

            // Apply workflow lock based on the actual loaded PO status (not template context)
            if (this.config.isEditMode && !this.config.isViewMode) {
                this._applyWorkflowLock(data.po_status || 'Draft');
            }

        } catch (err) {
            // Show a clear error in the form instead of leaving it blank
            const errMsg = err.message || 'Failed to load purchase order data.';
            notifications.showError(errMsg);
            if (this.alert) {
                this.alert.innerHTML = `<i class="bi bi-exclamation-triangle-fill me-2"></i>
                    Could not load purchase order data. Please go back and try again.<br>
                    <small class="text-muted">${errMsg}</small>`;
                this.alert.classList.remove('d-none');
            }
            // Clear the "Loading..." placeholder so the user knows something went wrong
            if (poNoEl) poNoEl.value = 'Error loading record';
        }
    }

    enableViewMode() {
        if (!this.form) return;
        this.form.querySelectorAll('input, select, textarea').forEach(el => el.disabled = true);

        if (this.addItemBtn) this.addItemBtn.style.display = 'none';



        if (this.tbody) {
            this.tbody.querySelectorAll('.remove-row-btn').forEach(btn => {
                btn.style.display = 'none';
            });
        }

        const actionBtnContainer = domUtils.getElement('#actionButtonsContainer');
        if (actionBtnContainer) {
            actionBtnContainer.style.setProperty('display', 'none', 'important');
        }
    }

    /**
     * Apply workflow-based locking rules on the edit form.
     *
     * - Submitted: fully locked (no edit, no save, show amber banner)
     * - Approved:  fully locked (no edit, no save, show green banner)
     * - RefBack / Draft: unlocked (normal edit)
     *
     * @param {string} poStatus - The current po_status value from the server
     */
    _applyWorkflowLock(poStatus) {
        const LOCKED_STATUSES = ['Submitted', 'Approved'];
        if (!LOCKED_STATUSES.includes(poStatus)) return; // Draft / RefBack — editable

        const userRole = window.APP_CONFIG?.userRole;
        const isApprover = (userRole === 'Checker' || userRole === 'Admin');

        if (!isApprover) {
            // Disable all form inputs and action buttons for normal users
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

        // Show the banner (with adapted text for Checker/Admin)
        const banner     = domUtils.getElement('#poLockedBanner');
        const bannerText = domUtils.getElement('#poLockedBannerText');
        if (banner) {
            banner.classList.remove('d-none');
            if (poStatus === 'Submitted') {
                banner.style.borderLeftColor = '#f59e0b';
                banner.style.background      = '#fffbeb';
                banner.style.color           = '#92400e';
                if (bannerText) {
                    if (isApprover) {
                        bannerText.textContent = `This Purchase Order is Submitted for Approval. As ${userRole}, you can edit and change its status.`;
                    } else {
                        bannerText.textContent =
                            'This Purchase Order has been Submitted for Approval. Editing is locked until it is Ref. Back or rejected.';
                    }
                }
            } else if (poStatus === 'Approved') {
                banner.style.borderLeftColor = '#10b981';
                banner.style.background      = '#d1fae5';
                banner.style.color           = '#065f46';
                if (bannerText) {
                    if (isApprover) {
                        bannerText.textContent = `This Purchase Order is Approved. As ${userRole}, you can edit and change its status.`;
                    } else {
                        bannerText.textContent =
                            'This Purchase Order is Approved. Editing and deletion are locked.';
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
            // Clear any error highlight on this field if the whole row is empty
            field.classList.remove('is-invalid');
            return true;
        }

        let isValid = true, errorMessage = '';
        const parent = field.parentElement;
        if (!parent) return true;

        // Clear previous error message for this field
        parent.querySelector('.invalid-feedback-erp')?.remove();

        const val = (field.value || '').trim();

        // ── Header field rules ─────────────────────────────────────────
        if      (field.id === 'poDate')           { if (!val) { isValid = false; errorMessage = 'PO Date is required'; } }
        else if (field.id === 'salPurGroup')      { if (!val) { isValid = false; errorMessage = 'Sales/Purchase Group is required'; } }
        else if (field.id === 'broker')           { if (!val) { isValid = false; errorMessage = 'Broker is required'; } }
        else if (field.id === 'zoneName')         { if (!val) { isValid = false; errorMessage = 'Zone is required'; } }
        else if (field.id === 'supplier')         { if (!val) { isValid = false; errorMessage = 'Supplier is required'; } }
        else if (field.id === 'deliveryLocation') { if (!val) { isValid = false; errorMessage = 'Delivery Location is required'; } }
        // ── Table row field rules ──────────────────────────────────────
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

        // ── Apply visual state ─────────────────────────────────────────
        if (isValid) {
            field.classList.remove('is-invalid');
        } else {
            field.classList.add('is-invalid');
            // Show inline error below the field (not inside table cells — too cramped)
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

        // Validate all header / card fields
        this.form.querySelectorAll('input:not([readonly]), select, textarea').forEach(field => {
            if (!this.validateField(field)) {
                isFormValid = false;
                if (!firstInvalid) firstInvalid = field;
            }
        });

        // Validate every item row
        if (this.tbody) {
            let filledRowsCount = 0;
            this.tbody.querySelectorAll('.item-row').forEach(row => {
                if (this.isRowEmpty(row)) {
                    // Remove error classes from fields in empty row
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
                this.showErrors('<i class="bi bi-exclamation-triangle-fill me-2"></i>At least one purchase order item is required.');
                return false;
            }
        }

        if (!isFormValid) {
            this.showErrors('<i class="bi bi-exclamation-triangle-fill me-2"></i>Please fill in all required fields highlighted in red.');
            // Scroll to the first invalid field
            if (firstInvalid) {
                // Auto-switch to the correct tab if the field is inside a tab section
                const section = firstInvalid.closest('#section-items, #section-totals, #section-additional');
                if (section) {
                    const tabId = section.id;
                    let btnId = '';
                    if (tabId === 'section-items') btnId = '#btn-tab-items';
                    else if (tabId === 'section-totals') btnId = '#btn-tab-totals';
                    else if (tabId === 'section-additional') btnId = '#btn-tab-additional';
                    
                    const tabBtn = document.querySelector(btnId);
                    if (tabBtn) {
                        tabBtn.click();
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

        // Safe FK parser: returns the integer ID, or null only if truly empty/missing.
        // Fixes the `parseInt(x) || null` bug where a valid ID of 0 or a parse
        // failure would silently become null and cause backend "may not be null" errors.
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
            po_date:               domUtils.getElement('#poDate').value,
            expected_delivery_date: domUtils.getElement('#expectedDeliveryDate').value || null,
            po_status:             targetStatus,
            sal_pur_group:         _parseInt(salPurGroupEl),
            broker:                _parseInt(brokerEl),
            zone_name:             domUtils.getElement('#zoneName')?.value || '',
            supplier:              _parseInt(supplierEl),
            supplier_contact:      domUtils.getElement('#supplierContact')?.value    || null,
            supplier_address:      domUtils.getElement('#supplierAddress')?.value    || null,
            gst_number:            domUtils.getElement('#gstNumber')?.value          || null,
            delivery_location:     domUtils.getElement('#deliveryLocation')?.value   || '',
            delivery_terms:        domUtils.getElement('#deliveryTerms')?.value      || '',
            payment_terms:         domUtils.getElement('#paymentTerms')?.value       || '',
            freight_terms:         domUtils.getElement('#freightTerms')?.value      || '',
            currency:              domUtils.getElement('#currency')?.value          || 'INR',
            purchaser_name:        domUtils.getElement('#purchaserName').value        || null,
            department:            domUtils.getElement('#department').value           || null,
            cost_center:           domUtils.getElement('#costCenter').value           || null,
            special_instructions:  domUtils.getElement('#specialInstructions').value  || null,
            internal_notes:        domUtils.getElement('#internalNotes').value        || null,
            items: []
        };

        if (this.config.isEditMode) {
            payload.po_no = domUtils.getElement('#poNo').value;
        }

        let itemValidationError = false;
        let filledRowsCount = 0;
        this.tbody.querySelectorAll('.item-row').forEach(row => {
            if (this.isRowEmpty(row)) return; // Ignore completely empty rows

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
                await PurchaseOrderAPI.update(this.config.voucherNo, payload);
                notifications.showSuccess('Purchase Order updated successfully');
            } else {
                await PurchaseOrderAPI.create(payload);
                notifications.showSuccess('Purchase Order created successfully');
            }
            setTimeout(() => { window.location.href = '/subsection-x/'; }, 1000);
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

        const saveBtn = this.createMaterialForm.querySelector('#saveMaterialBtn');
        const originalText = saveBtn.innerHTML;
        saveBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Saving...';
        saveBtn.disabled = true;

        try {
            const formData = new FormData(this.createMaterialForm);
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
                // Add the new option to ALL item dropdowns
                const newOptionHTML = `<option value="${result.id}" data-name="${result.text}">${result.text}</option>`;
                
                // Add to template
                if (this.rowTemplate) {
                    const tplSelect = this.rowTemplate.content.querySelector('.row-item');
                    if (tplSelect) tplSelect.insertAdjacentHTML('beforeend', newOptionHTML);
                }

                // Add to existing rows
                const allSelects = document.querySelectorAll('.row-item');
                allSelects.forEach(select => {
                    select.insertAdjacentHTML('beforeend', newOptionHTML);
                });

                // Select in active dropdown
                if (this.activeItemDropdown) {
                    this.activeItemDropdown.value = result.id;
                    this.activeItemDropdown.dispatchEvent(new Event('change'));
                }

                if (this.createMaterialModal) this.createMaterialModal.hide();
                notifications.showSuccess('Item added successfully');
            } else {
                let errorText = 'Failed to create item.';
                if (result.errors) {
                    errorText = Object.values(result.errors).join('<br>');
                }
                this.materialModalError.innerHTML = errorText;
                this.materialModalError.classList.remove('d-none');
            }
        } catch (error) {
            this.materialModalError.textContent = 'An error occurred while creating the item.';
            this.materialModalError.classList.remove('d-none');
        } finally {
            saveBtn.innerHTML = originalText;
            saveBtn.disabled = false;
        }
    }

    async createNewGroup() {
        if (!this.createSalPurGroupForm || !this.groupModalError) return;
        this.groupModalError.classList.add('d-none');
        this.groupModalError.textContent = '';

        const saveBtn = this.createSalPurGroupForm.querySelector('#saveGroupBtn');
        const originalText = saveBtn.innerHTML;
        saveBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Saving...';
        saveBtn.disabled = true;

        try {
            const name = document.getElementById('newGroupName').value.trim();
            const gstApplicable = document.getElementById('newGroupGST').checked;
            const interstate = document.querySelector('input[name="Interstate_Y_WithinState_N"]:checked').value === 'true';

            const payload = {
                SalPurGroupName: name,
                GST_Applicable_Y_N: gstApplicable,
                IsGSTApplicableY1N0: gstApplicable,
                Interstate_Y_WithinState_N: interstate,
                is_active: true
            };

            const csrfToken = document.querySelector('[name=csrfmiddlewaretoken]')?.value || '';

            const response = await fetch('/api/sal-pur-group/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': csrfToken
                },
                body: JSON.stringify(payload)
            });

            const result = await response.json();
            if (response.ok && result.SalPurGroupID) {
                // Add the new option to the dropdown and select it
                const groupSelect = domUtils.getElement('#salPurGroup');
                if (groupSelect) {
                    const opt = new Option(result.SalPurGroupName, result.SalPurGroupID, true, true);
                    groupSelect.add(opt);
                    groupSelect.value = result.SalPurGroupID;
                    groupSelect.dispatchEvent(new Event('change'));
                }

                if (this.createSalPurGroupModal) this.createSalPurGroupModal.hide();
                notifications.showSuccess('Sales/Purchase Group added successfully');
            } else {
                let errorText = 'Failed to create group.';
                if (result) {
                    errorText = Object.entries(result).map(([k, v]) => `${k}: ${v}`).join('<br>');
                }
                this.groupModalError.innerHTML = errorText;
                this.groupModalError.classList.remove('d-none');
            }
        } catch (error) {
            this.groupModalError.textContent = 'An error occurred while creating the group.';
            this.groupModalError.classList.remove('d-none');
        } finally {
            saveBtn.innerHTML = originalText;
            saveBtn.disabled = false;
        }
    }

    async createNewBroker() {
        if (!this.createBrokerForm || !this.brokerModalError) return;
        this.brokerModalError.classList.add('d-none');
        this.brokerModalError.textContent = '';

        const saveBtn = this.createBrokerForm.querySelector('#saveBrokerBtn');
        const originalText = saveBtn.innerHTML;
        saveBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Saving...';
        saveBtn.disabled = true;

        try {
            const name = document.getElementById('newBrokerName').value.trim();
            const formData = new FormData();
            formData.append('broker_name', name);

            const csrfToken = document.querySelector('[name=csrfmiddlewaretoken]')?.value || '';

            const response = await fetch('/api/broker-create/', {
                method: 'POST',
                headers: {
                    'X-CSRFToken': csrfToken
                },
                body: formData
            });

            const result = await response.json();
            if (response.ok && result.success) {
                // Add the new option to the dropdown and select it
                const brokerSelect = domUtils.getElement('#broker');
                if (brokerSelect) {
                    const opt = new Option(result.text, result.id, true, true);
                    brokerSelect.add(opt);
                    brokerSelect.value = result.id;
                    brokerSelect.dispatchEvent(new Event('change'));
                }

                if (this.createBrokerModal) this.createBrokerModal.hide();
                notifications.showSuccess('Broker added successfully');
            } else {
                let errorText = 'Failed to create broker.';
                if (result.errors) {
                    errorText = Object.values(result.errors).join('<br>');
                }
                this.brokerModalError.innerHTML = errorText;
                this.brokerModalError.classList.remove('d-none');
            }
        } catch (error) {
            this.brokerModalError.textContent = 'An error occurred while creating the broker.';
            this.brokerModalError.classList.remove('d-none');
        } finally {
            saveBtn.innerHTML = originalText;
            saveBtn.disabled = false;
        }
    }

    async createNewSupplier() {
        if (!this.createSupplierForm || !this.supplierModalError) return;
        this.supplierModalError.classList.add('d-none');
        this.supplierModalError.textContent = '';

        const saveBtn = this.createSupplierForm.querySelector('#saveSupplierBtn');
        const originalText = saveBtn.innerHTML;
        saveBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Saving...';
        saveBtn.disabled = true;

        try {
            const name = document.getElementById('newSupplierName').value.trim();
            const formData = new FormData();
            formData.append('supplier_name', name);

            const csrfToken = document.querySelector('[name=csrfmiddlewaretoken]')?.value || '';

            const response = await fetch('/api/supplier-create/', {
                method: 'POST',
                headers: {
                    'X-CSRFToken': csrfToken
                },
                body: formData
            });

            const result = await response.json();
            if (response.ok && result.success) {
                // Add the new option to the dropdown and select it
                const supplierSelect = domUtils.getElement('#supplier');
                if (supplierSelect) {
                    const opt = new Option(result.text, result.id, true, true);
                    supplierSelect.add(opt);
                    supplierSelect.value = result.id;
                    supplierSelect.dispatchEvent(new Event('change'));
                }

                if (this.createSupplierModal) this.createSupplierModal.hide();
                notifications.showSuccess('Supplier added successfully');
            } else {
                let errorText = 'Failed to create supplier.';
                if (result.errors) {
                    errorText = Object.values(result.errors).join('<br>');
                }
                this.supplierModalError.innerHTML = errorText;
                this.supplierModalError.classList.remove('d-none');
            }
        } catch (error) {
            this.supplierModalError.textContent = 'An error occurred while creating the supplier.';
            this.supplierModalError.classList.remove('d-none');
        } finally {
            saveBtn.innerHTML = originalText;
            saveBtn.disabled = false;
        }
    }
}

function init() {
    const config = window.APP_CONFIG || { isEditMode: false, voucherNo: null, isViewMode: false };
    new PurchaseOrderForm(config);
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
