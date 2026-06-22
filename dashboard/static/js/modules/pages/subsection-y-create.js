import { SubsectionYAPI } from '../api/subsection-y-api.js?v=148';
import { notifications } from '../utils/notifications.js?v=148';

class SubsectionYForm {
    constructor(config) {
        this.config = config;
        this.materials = config.materials || [];
        this.isEditMode = config.isEditMode;
        this.isViewMode = config.isViewMode;
        
        this.form = document.getElementById('voucherForm');
        this.gridBody = document.getElementById('itemGridBody');
        this.saveBtn = document.getElementById('saveVoucherBtn');
        this.validationAlert = document.getElementById('validationAlert');
        this.validationMessage = document.getElementById('validationAlertMessage');
        
        this.isDirty = false;
        
        this.init();
    }

    init() {
        this.initializePlugins();
        this.bindEvents();
        
        if (this.isEditMode || this.isViewMode) {
            this.loadExistingData(this.config.voucherNo);
        } else {
            // Add initial empty row
            this.addRow();
        }

        if (!this.isViewMode) {
            this.setupUnsavedChangesGuard();
        }

        this.setupFloatingLabels();
    }

    initializePlugins() {
        // Flatpickr Dates
        if (typeof flatpickr !== 'undefined') {
            flatpickr(".flatpickr-date", {
                dateFormat: "Y-m-d",
                allowInput: true,
                defaultDate: (!this.isEditMode && !this.isViewMode) ? new Date() : null
            });
        }

        // Initialize Select2 on existing select2 elements
        if (typeof jQuery !== 'undefined' && jQuery().select2) {
            jQuery('.select2-init').each((idx, el) => {
                jQuery(el).select2({
                    theme: 'bootstrap-5',
                    placeholder: el.dataset.placeholder || '',
                    allowClear: true,
                    width: '100%'
                });
            });
        }
    }

    bindEvents() {
        // Save voucher
        if (this.saveBtn) {
            this.saveBtn.addEventListener('click', (e) => this.submitForm(e));
        }

        // Header changes that trigger recalculation (e.g. Purchase Group change affects GST)
        if (typeof jQuery !== 'undefined') {
            jQuery('#purchaseGroup').on('change', () => {
                this.recalculateAllRows();
            });

            // Payment Terms change affects Credit Days
            jQuery('#paymentTerms').on('change', (e) => {
                const selectedOpt = e.target.options[e.target.selectedIndex];
                if (selectedOpt && selectedOpt.value) {
                    const days = selectedOpt.dataset.days ? parseInt(selectedOpt.dataset.days) : 0;
                    document.getElementById('creditDays').value = days;
                } else {
                    document.getElementById('creditDays').value = 0;
                }
                const creditDaysInput = document.getElementById('creditDays');
                if (creditDaysInput) {
                    creditDaysInput.dispatchEvent(new Event('input', { bubbles: true }));
                    creditDaysInput.dispatchEvent(new Event('change', { bubbles: true }));
                }
            });
        }

        // Freight changes recalculate grand total
        const freightInput = document.getElementById('freightExpense');
        if (freightInput) {
            freightInput.addEventListener('input', () => this.calculateTotals());
        }

        // Grid calculation triggers (delegated events)
        this.gridBody.addEventListener('input', (e) => {
            const target = e.target;
            const tr = target.closest('tr');
            if (!tr) return;

            if (target.classList.contains('row-bags') || target.classList.contains('row-unit-weight')) {
                this.calculateRowWeight(tr);
            }
            if (target.classList.contains('row-weight') || target.classList.contains('row-rate')) {
                this.calculateRowAmount(tr);
            }
            this.calculateTotals();
        });

        // Grid action button triggers (delegated events)
        this.gridBody.addEventListener('click', (e) => {
            const addBtn = e.target.closest('.add-row-btn');
            if (addBtn) {
                const tr = addBtn.closest('tr');
                this.addRow(null, tr);
                return;
            }

            const deleteBtn = e.target.closest('.delete-row-btn');
            if (deleteBtn) {
                const tr = deleteBtn.closest('tr');
                if (tr) {
                    if (this.gridBody.querySelectorAll('tr').length <= 1) {
                        notifications.showWarning('At least one item line is required.');
                        return;
                    }
                    tr.remove();
                    this.renumberRows();
                    this.calculateTotals();
                }
                return;
            }
        });
    }

    addRow(data = null, afterElement = null) {
        const tr = document.createElement('tr');
        tr.className = 'align-middle';
        tr.innerHTML = `
            <td class="text-center row-number font-monospace" style="font-size: 11px; font-weight: 600; color: #64748b;"></td>
            <td>
                <select class="form-select row-item-select select2-grid" required ${this.isViewMode ? 'disabled' : ''}>
                    <option value=""></option>
                    ${this.materials.map(m => `
                        <option value="${m.id}" 
                                data-weight="${m.unit_weight}" 
                                data-gst="${m.PurchaseGST}" 
                                data-incl-gst="${m.IsRateInclGSTY1N0 ? '1' : '0'}">
                            ${m.text}
                        </option>
                    `).join('')}
                </select>
            </td>
            <td>
                <input type="number" class="form-control text-end row-bags" placeholder="0" min="0" value="${data ? (data.Bag || '') : ''}" ${this.isViewMode ? 'disabled' : ''}>
            </td>
            <td>
                <input type="number" class="form-control text-end row-weight" placeholder="0.000" step="0.001" min="0" value="${data ? (data.Weight || '') : ''}" ${this.isViewMode ? 'disabled' : ''} required>
            </td>
            <td>
                <input type="number" class="form-control text-end row-unit-weight" placeholder="0.000" step="0.001" min="0" value="${data ? (data.unit_weight || '') : ''}" ${this.isViewMode ? 'disabled' : ''}>
            </td>
            <td>
                <input type="number" class="form-control text-end row-rate" placeholder="0.00" step="0.01" min="0" value="${data ? (data.Unit_rate || '') : ''}" ${this.isViewMode ? 'disabled' : ''} required>
            </td>
            <td class="text-end fw-bold text-dark pe-3 row-amount" style="font-size: 12px;">
                ${data ? parseFloat(data.Amount || 0).toFixed(2) : '0.00'}
            </td>
            <td class="text-center p-0 align-middle">
                <div class="d-flex w-100 h-100 align-items-center justify-content-center gap-2">
                    <button type="button" class="grid-action-btn add-row-btn" tabindex="-1" title="Add Row" ${this.isViewMode ? 'disabled style="display:none;"' : ''}>
                        <i class="bi bi-plus-lg"></i>
                    </button>
                    <button type="button" class="grid-action-btn delete-row-btn" tabindex="-1" title="Delete Row" ${this.isViewMode ? 'disabled style="display:none;"' : ''}>
                        <i class="bi bi-trash"></i>
                    </button>
                </div>
            </td>
        `;

        if (afterElement && afterElement.nextSibling) {
            this.gridBody.insertBefore(tr, afterElement.nextSibling);
        } else {
            this.gridBody.appendChild(tr);
        }

        // Initialize Select2 in Grid
        if (typeof jQuery !== 'undefined' && jQuery().select2) {
            const $select = jQuery(tr).find('.row-item-select');
            $select.select2({
                theme: 'bootstrap-5',
                placeholder: 'Select Item',
                dropdownParent: jQuery('#items-pane'),
                width: '100%'
            });

            // Grid select2 item change handler
            $select.on('change', (e) => {
                const opt = e.target.options[e.target.selectedIndex];
                if (opt && opt.value) {
                    const unitWeight = opt.dataset.weight || '0';
                    tr.querySelector('.row-unit-weight').value = parseFloat(unitWeight).toFixed(3);
                    this.calculateRowWeight(tr);
                }
            });
        }

        if (data) {
            // Set values and trigger calculations
            jQuery(tr).find('.row-item-select').val(data.Item_ID).trigger('change');
            tr.querySelector('.row-bags').value = data.Bag || '';
            tr.querySelector('.row-weight').value = data.Weight || '';
            tr.querySelector('.row-unit-weight').value = data.unit_weight || '';
            tr.querySelector('.row-rate').value = data.Unit_rate || '';
            this.calculateRowAmount(tr);
        }

        this.renumberRows();
        this.calculateTotals();
    }

    renumberRows() {
        const rows = this.gridBody.querySelectorAll('tr');
        rows.forEach((tr, idx) => {
            tr.querySelector('.row-number').textContent = idx + 1;
            
            // First row should not have delete option
            const deleteBtn = tr.querySelector('.delete-row-btn');
            if (deleteBtn) {
                if (this.isViewMode) {
                    deleteBtn.style.setProperty('display', 'none', 'important');
                } else {
                    if (idx === 0) {
                        deleteBtn.style.setProperty('display', 'none', 'important');
                    } else {
                        deleteBtn.style.setProperty('display', 'inline-flex', 'important');
                    }
                }
            }
        });
    }

    calculateRowWeight(tr) {
        const bags = parseFloat(tr.querySelector('.row-bags').value) || 0;
        const unitWeight = parseFloat(tr.querySelector('.row-unit-weight').value) || 0;
        const weightInput = tr.querySelector('.row-weight');
        
        if (bags > 0 && unitWeight > 0) {
            weightInput.value = (bags * unitWeight).toFixed(3);
        }
        this.calculateRowAmount(tr);
    }

    calculateRowAmount(tr) {
        const weight = parseFloat(tr.querySelector('.row-weight').value) || 0;
        const rate = parseFloat(tr.querySelector('.row-rate').value) || 0;
        const amountSpan = tr.querySelector('.row-amount');
        
        const amount = weight * rate;
        amountSpan.textContent = amount.toFixed(2);
    }

    recalculateAllRows() {
        this.gridBody.querySelectorAll('tr').forEach((tr) => {
            this.calculateRowAmount(tr);
        });
        this.calculateTotals();
    }

    calculateTotals() {
        let grossTotal = 0;
        let cgstTotal = 0;
        let sgstTotal = 0;
        let igstTotal = 0;
        let totalBags = 0;
        let totalWeight = 0;

        // Fetch purchase group tax behavior
        const pgSelect = document.getElementById('purchaseGroup');
        let isGstApplicable = false;
        let isIgst = false;
        if (pgSelect && pgSelect.selectedIndex > 0) {
            const opt = pgSelect.options[pgSelect.selectedIndex];
            isGstApplicable = opt.dataset.gst === '1';
            isIgst = opt.dataset.igst === '1';
        }

        this.gridBody.querySelectorAll('tr').forEach((tr) => {
            const bags = parseFloat(tr.querySelector('.row-bags').value) || 0;
            const weight = parseFloat(tr.querySelector('.row-weight').value) || 0;
            const rate = parseFloat(tr.querySelector('.row-rate').value) || 0;
            const selectEl = tr.querySelector('.row-item-select');
            
            totalBags += bags;
            totalWeight += weight;

            let gstRate = 0;
            let isRateInclGst = false;
            if (selectEl && selectEl.selectedIndex > 0) {
                const opt = selectEl.options[selectEl.selectedIndex];
                gstRate = parseFloat(opt.dataset.gst) || 0;
                isRateInclGst = opt.dataset.inclGst === '1';
            }

            const rawAmount = weight * rate;
            let basicAmount = rawAmount;
            let cgst = 0, sgst = 0, igst = 0;

            if (isGstApplicable && gstRate > 0) {
                if (isRateInclGst) {
                    // Back out GST
                    basicAmount = rawAmount / (1 + (gstRate / 100));
                    const totalTax = rawAmount - basicAmount;
                    if (isIgst) {
                        igst = totalTax;
                    } else {
                        cgst = totalTax / 2;
                        sgst = totalTax / 2;
                    }
                } else {
                    // GST is exclusive
                    basicAmount = rawAmount;
                    if (isIgst) {
                        igst = basicAmount * (gstRate / 100);
                    } else {
                        cgst = basicAmount * ((gstRate / 2) / 100);
                        sgst = basicAmount * ((gstRate / 2) / 100);
                    }
                }
            }

            grossTotal += basicAmount;
            cgstTotal += cgst;
            sgstTotal += sgst;
            igstTotal += igst;
        });

        const freight = parseFloat(document.getElementById('freightExpense').value) || 0;
        const grandTotal = grossTotal + cgstTotal + sgstTotal + igstTotal + freight;

        // Display totals in Summary Tab and Bottom Fixed bar
        document.getElementById('summaryGross').textContent = grossTotal.toFixed(2);
        document.getElementById('summaryCGST').textContent = cgstTotal.toFixed(2);
        document.getElementById('summarySGST').textContent = sgstTotal.toFixed(2);
        document.getElementById('summaryIGST').textContent = igstTotal.toFixed(2);
        document.getElementById('summaryGrandTotal').textContent = grandTotal.toFixed(2);
        
        const bottomGrandTotalEl = document.getElementById('bottomGrandTotal');
        if (bottomGrandTotalEl) {
            bottomGrandTotalEl.textContent = grandTotal.toFixed(2);
        }

        // Set Grid table footer total elements
        const gridTotalBagsEl = document.getElementById('gridTotalBags');
        if (gridTotalBagsEl) {
            if ('value' in gridTotalBagsEl) {
                gridTotalBagsEl.value = totalBags;
            } else {
                gridTotalBagsEl.textContent = totalBags;
            }
        }
        const gridTotalWeightEl = document.getElementById('gridTotalWeight');
        if (gridTotalWeightEl) {
            if ('value' in gridTotalWeightEl) {
                gridTotalWeightEl.value = totalWeight.toFixed(3);
            } else {
                gridTotalWeightEl.textContent = totalWeight.toFixed(3);
            }
        }
        const gridTotalAmountEl = document.getElementById('gridTotalAmount');
        if (gridTotalAmountEl) {
            if ('value' in gridTotalAmountEl) {
                gridTotalAmountEl.value = grossTotal.toFixed(2);
            } else {
                gridTotalAmountEl.textContent = grossTotal.toFixed(2);
            }
        }
    }

    async loadExistingData(id) {
        try {
            const data = await SubsectionYAPI.getById(id);
            this.populateForm(data);
            if (this.isViewMode) {
                this.lockViewMode();
            }
        } catch (err) {
            notifications.showError('Failed to load purchase data');
            console.error(err);
        }
    }

    populateForm(data) {
        // Set basic header fields
        document.getElementById('voucherNo').value = data.VoucherNo || '';
        document.getElementById('voucherDate').value = data.VoucherDate || '';
        document.getElementById('orderNo').value = data.OrderNo || '';
        document.getElementById('orderDate').value = data.OrderDate || '';
        document.getElementById('deliveryLocation').value = data.DeliveryLocation || '';
        document.getElementById('specialInstructions').value = data.SpecialInstructions || '';
        document.getElementById('internalNotes').value = data.InternalNotes || '';
        document.getElementById('creditDays').value = data.CreditDays !== undefined && data.CreditDays !== null ? data.CreditDays : '0';
        document.getElementById('freightExpense').value = data.FreightExpense || '0.00';

        // Select2 fields
        if (typeof jQuery !== 'undefined') {
            jQuery('#purchaseGroup').val(data.PurSalGroupID).trigger('change');
            jQuery('#supplier').val(data.PartyID).trigger('change');
            jQuery('#broker').val(data.BrokerID).trigger('change');
            jQuery('#zone').val(data.ZoneID).trigger('change');
            jQuery('#delTerms').val(data.DelTermsID || '').trigger('change');
            jQuery('#paymentTerms').val(data.PaymentTermsID || '').trigger('change');
            jQuery('#freightTerm').val(data.FreightTermID || '').trigger('change');
            jQuery('#incoterm').val(data.IncotermID || '').trigger('change');
        }

        // Add item rows
        this.gridBody.innerHTML = '';
        if (data.items && data.items.length > 0) {
            data.items.forEach(item => this.addRow(item));
        } else {
            this.addRow();
        }

        this.calculateTotals();
        this.updateFloatingLabels();
    }

    lockViewMode() {
        if (this.form) {
            this.form.querySelectorAll('input, select, textarea').forEach(el => {
                el.disabled = true;
            });
        }
        if (this.saveBtn) {
            this.saveBtn.style.setProperty('display', 'none', 'important');
        }
        if (this.addRowBtn) {
            this.addRowBtn.style.setProperty('display', 'none', 'important');
        }
        this.gridBody.querySelectorAll('.delete-row-btn').forEach(btn => {
            btn.disabled = true;
        });
    }

    setupUnsavedChangesGuard() {
        const warning = 'Changes are not saved. Are you sure you want to leave?';
        
        this.form.addEventListener('input', () => { this.isDirty = true; });
        this.form.addEventListener('change', () => { this.isDirty = true; });

        window.addEventListener('beforeunload', (e) => {
            if (this.isDirty) {
                e.preventDefault();
                e.returnValue = warning;
            }
        });

        const backBtn = document.querySelector('.erp-btn-back');
        if (backBtn) {
            backBtn.addEventListener('click', (e) => {
                if (this.isDirty) {
                    e.preventDefault();
                    if (confirm(warning)) {
                        this.isDirty = false;
                        window.location.href = backBtn.href;
                    }
                }
            });
        }
    }

    validateForm() {
        this.validationAlert.classList.add('d-none');
        
        let isValid = true;
        const requiredInputs = this.form.querySelectorAll('[required]');
        
        requiredInputs.forEach(input => {
            // Check native select or input value
            let val = input.value;
            let displayElement = input;
            
            if (input.classList.contains('select2-hidden-accessible')) {
                displayElement = input.parentElement.querySelector('.select2-container');
            }

            if (!val || val.trim() === '') {
                isValid = false;
                displayElement.classList.add('is-invalid');
            } else {
                displayElement.classList.remove('is-invalid');
            }
        });

        // Validate that grid has at least 1 row and all select elements in grid are filled
        const rows = this.gridBody.querySelectorAll('tr');
        if (rows.length === 0) {
            isValid = false;
            this.validationMessage.textContent = 'At least one line item is required.';
            this.validationAlert.classList.remove('d-none');
            return false;
        }

        rows.forEach(tr => {
            const selectEl = tr.querySelector('.row-item-select');
            const weightVal = tr.querySelector('.row-weight').value;
            const rateVal = tr.querySelector('.row-rate').value;

            let selectContainer = selectEl;
            if (selectEl.classList.contains('select2-hidden-accessible')) {
                selectContainer = selectEl.parentElement.querySelector('.select2-container');
            }

            if (!selectEl.value) {
                isValid = false;
                selectContainer.classList.add('is-invalid');
            } else {
                selectContainer.classList.remove('is-invalid');
            }

            if (!weightVal || parseFloat(weightVal) <= 0) {
                isValid = false;
                tr.querySelector('.row-weight').classList.add('is-invalid');
            } else {
                tr.querySelector('.row-weight').classList.remove('is-invalid');
            }

            if (!rateVal || parseFloat(rateVal) < 0) {
                isValid = false;
                tr.querySelector('.row-rate').classList.add('is-invalid');
            } else {
                tr.querySelector('.row-rate').classList.remove('is-invalid');
            }
        });

        if (!isValid) {
            this.validationMessage.textContent = 'Please correct the errors marked in red below.';
            this.validationAlert.classList.remove('d-none');
            this.validationAlert.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }

        return isValid;
    }

    async submitForm(e) {
        e.preventDefault();
        if (!this.validateForm()) return;

        // Prepare child transactions list
        const items = [];
        // Fetch purchase group tax behavior
        const pgSelect = document.getElementById('purchaseGroup');
        let isGstApplicable = false;
        let isIgst = false;
        if (pgSelect && pgSelect.selectedIndex > 0) {
            const opt = pgSelect.options[pgSelect.selectedIndex];
            isGstApplicable = opt.dataset.gst === '1';
            isIgst = opt.dataset.igst === '1';
        }

        this.gridBody.querySelectorAll('tr').forEach((tr) => {
            const itemSelect = tr.querySelector('.row-item-select');
            const bags = parseInt(tr.querySelector('.row-bags').value) || null;
            const weight = parseFloat(tr.querySelector('.row-weight').value) || 0;
            const unitWeight = parseFloat(tr.querySelector('.row-unit-weight').value) || null;
            const rate = parseFloat(tr.querySelector('.row-rate').value) || 0;
            
            let gstRate = 0;
            let isRateInclGst = false;
            if (itemSelect && itemSelect.selectedIndex > 0) {
                const opt = itemSelect.options[itemSelect.selectedIndex];
                gstRate = parseFloat(opt.dataset.gst) || 0;
                isRateInclGst = opt.dataset.inclGst === '1';
            }

            const rawAmount = weight * rate;
            let basicAmount = rawAmount;
            let cgst = 0, sgst = 0, igst = 0;

            if (isGstApplicable && gstRate > 0) {
                if (isRateInclGst) {
                    basicAmount = rawAmount / (1 + (gstRate / 100));
                    const totalTax = rawAmount - basicAmount;
                    if (isIgst) {
                        igst = totalTax;
                    } else {
                        cgst = totalTax / 2;
                        sgst = totalTax / 2;
                    }
                } else {
                    basicAmount = rawAmount;
                    if (isIgst) {
                        igst = basicAmount * (gstRate / 100);
                    } else {
                        cgst = basicAmount * ((gstRate / 2) / 100);
                        sgst = basicAmount * ((gstRate / 2) / 100);
                    }
                }
            }

            const total = basicAmount + igst + cgst + sgst;

            items.push({
                Item_ID: itemSelect.value,
                Bag: bags,
                Weight: weight,
                unit_weight: unitWeight,
                Unit_rate: rate,
                Amount: basicAmount,
                gst_rate: gstRate,
                IGST: igst,
                CGST: cgst,
                SGST: sgst,
                Total: total,
                IsRateIncludingGST: isRateInclGst
            });
        });

        // Prepare header object
        const payload = {
            VoucherNo: document.getElementById('voucherNo').value || null,
            VoucherDate: document.getElementById('voucherDate').value,
            TranType: 'PUR',
            OrderNo: document.getElementById('orderNo').value,
            OrderDate: document.getElementById('orderDate').value,
            PurSalGroupID: document.getElementById('purchaseGroup').value,
            PartyID: document.getElementById('supplier').value,
            BrokerID: document.getElementById('broker').value || null,
            ZoneID: document.getElementById('zone').value || null,
            DeliveryLocation: document.getElementById('deliveryLocation').value || null,
            DelTermsID: document.getElementById('delTerms').value ? parseInt(document.getElementById('delTerms').value) : null,
            PaymentTermsID: document.getElementById('paymentTerms').value ? parseInt(document.getElementById('paymentTerms').value) : null,
            CreditDays: document.getElementById('creditDays').value ? parseInt(document.getElementById('creditDays').value) : 0,
            FreightTermID: document.getElementById('freightTerm').value ? parseInt(document.getElementById('freightTerm').value) : null,
            IncotermID: document.getElementById('incoterm').value ? parseInt(document.getElementById('incoterm').value) : null,
            SpecialInstructions: document.getElementById('specialInstructions').value || null,
            InternalNotes: document.getElementById('internalNotes').value || null,
            IGST0_SGST1: isIgst ? 0 : 1,
            items: items
        };

        const originalBtnText = this.saveBtn.innerHTML;
        this.saveBtn.disabled = true;
        this.saveBtn.innerHTML = `<span class="spinner-border spinner-border-sm me-2" role="status"></span> Saving...`;

        try {
            if (this.isEditMode) {
                await SubsectionYAPI.update(this.config.voucherNo, payload);
                notifications.showSuccess('Purchase entry updated successfully.');
            } else {
                await SubsectionYAPI.create(payload);
                notifications.showSuccess('Purchase entry created successfully.');
            }
            this.isDirty = false;
            setTimeout(() => {
                window.location.href = '/subsection-y/';
            }, 1000);
        } catch (err) {
            console.error('Save Error:', err);
            this.saveBtn.disabled = false;
            this.saveBtn.innerHTML = originalBtnText;
            
            let message = 'An error occurred while saving the voucher.';
            if (err.response && err.response.data) {
                const data = err.response.data;
                if (typeof data === 'object') {
                    message = Object.entries(data)
                        .map(([key, val]) => `${key}: ${Array.isArray(val) ? val.join(', ') : val}`)
                        .join('\n');
                } else {
                    message = data;
                }
            }
            
            this.validationMessage.textContent = message;
            this.validationAlert.classList.remove('d-none');
            this.validationAlert.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    }

    setupFloatingLabels() {
        const updateAll = () => this.updateFloatingLabels();

        // Bind standard input events
        document.querySelectorAll('.erp-form-group input, .erp-form-group select, .erp-form-group textarea').forEach(input => {
            input.addEventListener('focus', updateAll);
            input.addEventListener('blur', updateAll);
            input.addEventListener('input', updateAll);
            input.addEventListener('change', updateAll);
        });

        // Bind Select2 specific events
        if (typeof jQuery !== 'undefined') {
            jQuery('.select2-init').on('select2:open select2:close change select2:select select2:unselect', updateAll);
        }

        // Run once
        updateAll();
        // Run again with minor delays to handle automatic population/render times
        setTimeout(updateAll, 100);
        setTimeout(updateAll, 500);
        setTimeout(updateAll, 1500);
    }

    updateFloatingLabels() {
        document.querySelectorAll('.erp-form-group').forEach(group => {
            const input = group.querySelector('input, select, textarea');
            if (!input) return;

            const hasValue = input.value && input.value.trim() !== '';
            const isFocused = document.activeElement === input;
            
            let isSelect2HasValue = false;
            let isSelect2Focused = false;
            
            if (input.classList.contains('select2-hidden-accessible')) {
                const $sel = jQuery(input);
                isSelect2HasValue = $sel.val() && $sel.val().trim() !== '';
                
                const select2Container = group.querySelector('.select2-container');
                if (select2Container) {
                    isSelect2Focused = select2Container.classList.contains('select2-container--focus') || 
                                       select2Container.classList.contains('select2-container--open');
                }
            }
            
            if (hasValue || isFocused || isSelect2HasValue || isSelect2Focused) {
                group.classList.add('floating');
            } else {
                group.classList.remove('floating');
            }
        });
    }
}

// Instantiate on DOM load
document.addEventListener('DOMContentLoaded', () => {
    const config = window.APP_CONFIG || { isEditMode: false, voucherNo: null, isViewMode: false };
    new SubsectionYForm(config);
});
