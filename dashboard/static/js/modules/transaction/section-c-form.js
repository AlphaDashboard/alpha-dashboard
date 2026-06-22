import { domUtils } from '../utils/dom.js?v=147';
import { notifications } from '../utils/notifications.js?v=147';
import { SectionCTable } from './section-c-table.js?v=147';
import { SectionCAPI } from '../api/section-c-api.js?v=147';
import { initializeSearchableDropdown, initializeAccountMasterModalHandler } from '../../common-dropdown.js?v=147';
import { CustomMultiColumnCombo } from '../../custom-combo.js?v=147';

export class TransactionForm {
    constructor(config) {
        this.config = config;
        window.currentFormInstance = this; // Expose for seamless record navigation
        this.form = domUtils.getElement('#transactionForm');
        this.alertBox = domUtils.getElement('#validationAlert');
        this.submitBtn = domUtils.getElement('#submitBtn');
        this.spinner = domUtils.getElement('#submitSpinner');

        // View-only mode flag (never becomes dirty, never saves)
        this.isViewMode = !!(config && config.isViewMode);

        this.table = new SectionCTable(this.isViewMode);

        // Submission lock state
        this.isSaving = false;

        this.headerBankBalance = '0.00';
        this.headerBankBalanceClass = 'text-success';

        // Hydration flag — suppresses validation during programmatic field population
        this._isHydrating = false;

        // Unsaved changes tracker
        this.isDirty = false;

        this.init();
    }

    async init() {
        this.bindEvents();

        // Initialize Cash Account Custom Combo FIRST (before data load)
        if (typeof jQuery !== 'undefined') {
            const comboInst = new CustomMultiColumnCombo('#bankAccount', '/api/accountmaster-search/', ' ', {
                enableAddNew: !this.isViewMode,
                addNewText: 'Add New Cash Account',
                modalId: 'createAccountMasterModal',
                secondColumnHeader: 'Cash Account Name',
                showBalanceInTextbox: false,
                isBankAccount: false,
                onModalOpen: function(modalEl, term) {
                    const title = modalEl.querySelector('.modal-title');
                    if (title) title.textContent = 'Create New Cash Account';
                },
                onSelect: function(data) {
                    const balanceEl = document.getElementById('currentBalance');
                    if (balanceEl && data && data.cl_bal !== undefined) {
                        const balNum = parseFloat(data.cl_bal);
                        const balText = balNum.toLocaleString('en-US', {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2
                        });
                        const colorClass = balNum >= 0 ? 'text-success' : 'text-danger';
                        
                        if (window.currentFormInstance) {
                            window.currentFormInstance.headerBankBalance = balText;
                            window.currentFormInstance.headerBankBalanceClass = colorClass;
                        }
                        
                        balanceEl.value = balText;
                        balanceEl.classList.remove('text-success', 'text-danger');
                        balanceEl.classList.add(colorClass);
                    }
                }
            });

            jQuery('#bankAccount').on('change', async function () {
                const balanceEl = document.getElementById('currentBalance');
                if (!balanceEl) return;
                if (!this.value) {
                    if (window.currentFormInstance) {
                        window.currentFormInstance.headerBankBalance = '0.00';
                        window.currentFormInstance.headerBankBalanceClass = 'text-success';
                    }
                    balanceEl.value = '0.00';
                    balanceEl.classList.remove('text-success', 'text-danger');
                    balanceEl.classList.add('text-success');
                    return;
                }
                try {
                    const response = await fetch(`/api/account_master/${this.value}/`);
                    if (response.ok) {
                        const data = await response.json();
                        if (data && data.cl_bal !== undefined) {
                            const balNum = parseFloat(data.cl_bal);
                            const balText = balNum.toLocaleString('en-US', {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2
                            });
                            const colorClass = balNum >= 0 ? 'text-success' : 'text-danger';
                            
                            if (window.currentFormInstance) {
                                window.currentFormInstance.headerBankBalance = balText;
                                window.currentFormInstance.headerBankBalanceClass = colorClass;
                            }
                            
                            balanceEl.value = balText;
                            balanceEl.classList.remove('text-success', 'text-danger');
                            balanceEl.classList.add(colorClass);
                        }
                    }
                } catch (err) {
                    console.error('Failed to fetch Cash Account balance:', err);
                }
            });
        }



        // Load data or create initial blank row
        if (this.isViewMode && this.config.voucherNo) {
            // View mode: load data then lock everything
            await this.loadExistingData(this.config.voucherNo);
            this.lockViewMode();
        } else if (this.config.isEditMode && this.config.voucherNo) {
            await this.loadExistingData(this.config.voucherNo);
        } else {
            // Initialize with one empty row
            this.table.rowManager.createRow();
            this.table.updateRowIndices();
        }

        // Initialize modal handler last (skip in view mode — no saving possible)
        if (!this.isViewMode) {
            initializeAccountMasterModalHandler('createAccountMasterModal', notifications);

            // Unsaved changes guard
            this._bindUnsavedChangesGuard();
        }

        // Initialize Flatpickr for datetime input
        if (typeof flatpickr !== 'undefined') {
            flatpickr('#date', {
                enableTime: true,
                dateFormat: "Y-m-d\\TH:i",
                allowInput: true,
                disableMobile: true,
                time_24hr: false
            });
        }
    }

    bindEvents() {
        this.form.addEventListener('submit', (e) => this.handleSubmit(e));

        // Prevent default form submission and number input arrow changes
        this.form.addEventListener('keydown', (e) => {
            if (e.target.type === 'number' && (e.key === 'ArrowUp' || e.key === 'ArrowDown')) {
                e.preventDefault();
            }
            if (e.key === 'Enter' && e.target.tagName !== 'TEXTAREA') {
                e.preventDefault();
            }
        });

        // Prevent number input value change on scroll
        this.form.addEventListener('wheel', (e) => {
            if (document.activeElement.type === 'number') {
                document.activeElement.blur();
            }
        });

        // Real-time validation — skip during hydration
        this.form.addEventListener('input', (e) => {
            if (!this._isHydrating) this.validateField(e.target);
        });
        this.form.addEventListener('blur', (e) => {
            if (!this._isHydrating) this.validateField(e.target);
        }, true);
        this.form.addEventListener('change', (e) => {
            if (!this._isHydrating) this.validateField(e.target);
        });

        if (typeof jQuery !== 'undefined') {
            jQuery(this.form).on('change', '.select2-hidden-accessible', (e) => {
                if (!this._isHydrating && !e.target.dataset.hydrating) {
                    this.validateField(e.target);
                }
            });
        }


    }

    // ─── Unsaved Changes Guard ────────────────────────────────────────────────

    _bindUnsavedChangesGuard() {
        const WARN_MSG = 'Changes are not saved. Are you sure you want to leave?';

        this.form.addEventListener('input', () => {
            if (!this._isHydrating) this.isDirty = true;
        });
        this.form.addEventListener('change', () => {
            if (!this._isHydrating) this.isDirty = true;
        });
        if (typeof jQuery !== 'undefined') {
            jQuery(this.form).on('change', () => {
                if (!this._isHydrating) this.isDirty = true;
            });
        }
        this.form.addEventListener('click', (e) => {
            if (e.target.closest('.add-row-btn, .remove-row-btn')) {
                if (!this._isHydrating) this.isDirty = true;
            }
        });

        window.addEventListener('beforeunload', (e) => {
            if (!this.isDirty) return;
            e.preventDefault();
            e.returnValue = WARN_MSG;
            return WARN_MSG;
        });

        const backBtn = document.querySelector('.erp-btn-back');
        if (backBtn) {
            backBtn.addEventListener('click', (e) => {
                if (this.isDirty) {
                    e.preventDefault();
                    if (confirm(WARN_MSG)) {
                        this.isDirty = false;
                        window.location.href = backBtn.href;
                    }
                }
            });
        }

        document.querySelectorAll('.sidebar a[href]').forEach(link => {
            const href = link.getAttribute('href');
            if (!href || href.startsWith('#') || href.startsWith('javascript')) return;
            link.addEventListener('click', (e) => {
                if (this.isDirty) {
                    e.preventDefault();
                    if (confirm(WARN_MSG)) {
                        this.isDirty = false;
                        window.location.href = href;
                    }
                }
            });
        });

        history.pushState({ erpFormGuard: true }, '');
        window.addEventListener('popstate', (e) => {
            if (this.isDirty) {
                history.pushState({ erpFormGuard: true }, '');
                if (confirm(WARN_MSG)) {
                    this.isDirty = false;
                    history.go(-2);
                }
            }
        });
    }

    // ─── Validation ───────────────────────────────────────────────────────────

    validateField(field) {
        if (!field) return true;
        if (!field.matches('.erp-input, .erp-table-control, select')) return true;
        if (field.type === 'checkbox' || field.type === 'radio') return true;

        let isValid = true;
        let errorMessage = '';

        // Remove existing feedback
        const parent = field.parentElement;
        if (!parent) return true;
        const existingFeedback = parent.querySelector('.invalid-feedback-erp');
        if (existingFeedback) existingFeedback.remove();

        const val = field.value.trim();

        // Voucher No
        if (field.id === 'voucherNo') {
            if (!val) { isValid = false; errorMessage = 'Voucher No is required'; }
        }
        // Date
        else if (field.type === 'date' || field.type === 'datetime-local') {
            if (field.hasAttribute('required') && !val) { isValid = false; errorMessage = 'Date is required'; }
        }
        // Cash Account
        else if (field.id === 'bankAccount') {
            if (!val) { isValid = false; errorMessage = 'Please select a Cash Account'; }
        }
        // Narration
        else if (field.id === 'narration') {
            if (val.length > 200) { isValid = false; errorMessage = 'Narration too long (max 200 chars)'; }
        }
        // Table Account
        else if (field.classList.contains('row-account-master')) {
            if (!val) { isValid = false; errorMessage = 'Account is required'; }
        }
        // Table Amount
        else if (field.classList.contains('row-amount')) {
            const num = parseFloat(val);
            if (!val || isNaN(num)) {
                isValid = false; errorMessage = 'Valid amount is required';
            } else if (num <= 0) {
                isValid = false; errorMessage = 'Amount must be greater than zero';
            }
        }
        // General required fields
        else if (field.hasAttribute('required') && !val) {
            isValid = false; errorMessage = 'This field is required';
        }

        // Apply visual states
        let targetEl = field;
        const isSelect2 = field.classList.contains('select2-hidden-accessible');
        if (isSelect2) {
            targetEl = parent.querySelector('.select2-container') || field;
        }

        if (isValid) {
            targetEl.classList.remove('is-invalid', 'is-invalid-erp', 'is-valid');
        } else {
            targetEl.classList.remove('is-valid');
            targetEl.classList.add('is-invalid');
            if (isSelect2) {
                targetEl.classList.add('is-invalid-erp');
            }

            const feedback = document.createElement('div');
            feedback.className = 'invalid-feedback-erp';
            feedback.textContent = errorMessage;

            if (isSelect2) {
                targetEl.after(feedback);
            } else {
                field.after(feedback);
            }
        }

        return isValid;
    }

    // ─── Data Loading ─────────────────────────────────────────────────────────

    async loadExistingData(id) {
        try {
            this._isHydrating = true;
            const data = await SectionCAPI.getById(id);
            this.populateForm(data);
        } catch (error) {
            notifications.showError('Failed to load transaction data');
            console.error(error);
        } finally {
            this._isHydrating = false;
        }
    }

    // ─── Form Population ──────────────────────────────────────────────────────

    populateForm(data) {
        this._isHydrating = true;

        try {
            domUtils.getElement('#voucherNo').value = data.voucher_no || '';
            domUtils.getElement('#narration').value = data.narration || '';
            domUtils.getElement('#tranType').value = data.tran_type || 'CASH';

            const rpidValue = data.rpid || 'P';
            if (domUtils.getElement('#rpid')) {
                domUtils.getElement('#rpid').value = rpidValue;
            }
            const paymentBtn = domUtils.getElement('.erp-mode-toggle .issue-btn');
            const receiptBtn = domUtils.getElement('.erp-mode-toggle .deposit-btn');
            if (paymentBtn && receiptBtn) {
                if (rpidValue === 'P') {
                    paymentBtn.classList.add('active');
                    receiptBtn.classList.remove('active');
                } else {
                    receiptBtn.classList.add('active');
                    paymentBtn.classList.remove('active');
                }
            }

            if (data.date) {
                const d = new Date(data.date);
                const pad = n => String(n).padStart(2, '0');
                const localStr =
                    `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}` +
                    `T${pad(d.getHours())}:${pad(d.getMinutes())}`;
                domUtils.getElement('#date').value = localStr;
            }

            const statusInput = domUtils.getElement('#status');
            if (statusInput) statusInput.value = data.status ? '1' : '0';

            if (data.bank_account && data.bank_account_display) {
                const bankSelect = domUtils.getElement('#bankAccount');
                if (bankSelect && typeof jQuery !== 'undefined') {
                    const opt = new Option(
                        data.bank_account_display.text,
                        String(data.bank_account_display.id),
                        true, true
                    );
                    jQuery(bankSelect).append(opt).trigger('change');
                }
            }

            this.table.loadData(data.transactions || []);
        } finally {
            this._isHydrating = false;
        }
    }

    // ─── View Mode Lock ────────────────────────────────────────────────────────
    // Called after data hydration in view mode.
    // Disables every interactive element and hides action buttons.

    lockViewMode() {
        // Disable all native inputs, selects, textareas
        this.form.querySelectorAll('input, select, textarea').forEach(el => {
            el.disabled = true;
            el.classList.add('bg-light');
        });

        // Disable Select2 / Custom Combo dropdowns
        if (typeof jQuery !== 'undefined') {
            jQuery('#bankAccount').prop('disabled', true).trigger('change');
            jQuery(this.form).find('.row-account-master').prop('disabled', true).trigger('change');
            jQuery(this.form).find('select').prop('disabled', true).trigger('change');

            // Explicitly disable any custom combo inputs
            this.form.querySelectorAll('.custom-combo-input').forEach(input => {
                input.disabled = true;
                input.classList.add('bg-light');
            });
        }

        // Block PAYMENT/RECEIPT toggle buttons
        this.form.querySelectorAll('.erp-toggle-btn').forEach(btn => {
            btn.disabled = true;
            btn.style.pointerEvents = 'none';
            btn.style.opacity = '0.7';
        });

        // Hide Add Row and Delete Row buttons from all rows
        this.form.querySelectorAll('.add-row-btn, .remove-row-btn').forEach(btn => {
            btn.style.setProperty('display', 'none', 'important');
        });

        // Hide the Save button
        if (this.submitBtn) {
            this.submitBtn.style.setProperty('display', 'none', 'important');
        }

        // Show view-mode info banner
        if (this.alertBox) {
            this.alertBox.innerHTML = '<i class="bi bi-eye me-2"></i><strong>View Mode</strong> — This transaction is read-only. No changes can be made.';
            this.alertBox.className = 'alert shadow-sm border-0 d-block p-2 mb-2';
            this.alertBox.style.borderRadius = '6px';
            this.alertBox.style.fontSize = '13px';
            this.alertBox.style.backgroundColor = '#eff6ff';
            this.alertBox.style.color = '#1d4ed8';
            this.alertBox.style.borderLeft = '4px solid #3b82f6';
        }

        // Block form submission entirely (last-resort guard)
        this.isSaving = true;
    }

    // ─── Form Validation ──────────────────────────────────────────────────────

    validateForm() {
        this.alertBox.classList.add('d-none');

        let isFormValid = true;

        // Validate all specific fields
        const fields = this.form.querySelectorAll('.erp-input, .erp-table-control, select');
        fields.forEach(field => {
            if (!this.validateField(field)) {
                isFormValid = false;
            }
        });

        if (!isFormValid) {
            this.showError('Please fix the highlighted errors before saving.');
            return false;
        }

        const rows = this.table.getData();
        if (rows.length === 0) {
            this.showError('At least one valid transaction row with an amount is required.');
            return false;
        }

        return true;
    }

    showError(message) {
        this.alertBox.innerHTML = `<i class="bi bi-exclamation-triangle-fill me-2"></i>${message}`;
        this.alertBox.classList.remove('d-none');
        this.alertBox.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }

    // ─── Build Save Payload ───────────────────────────────────────────────────

    getFormData() {
        const bankAccountEl = domUtils.getElement('#bankAccount');
        const bankAccountVal = bankAccountEl ? (bankAccountEl.value || null) : null;

        const statusEl = domUtils.getElement('#status');
        const statusVal = statusEl ? statusEl.value === '1' : true;

        return {
            voucher_no: domUtils.getElement('#voucherNo').value,
            date: domUtils.getElement('#date').value,
            tran_type: domUtils.getElement('#tranType').value,
            rpid: domUtils.getElement('#rpid').value,
            narration: domUtils.getElement('#narration').value,
            bank_account: bankAccountVal,
            status: statusVal,
            amount: this.table.calculateTotal(),
            transactions: this.table.getData()
        };
    }

    // ─── Submit ───────────────────────────────────────────────────────────────

    async handleSubmit(e) {
        e.preventDefault();

        // 1. Prevent overlapping submit calls (also blocks view mode saves)
        if (this.isSaving) return;

        if (!this.validateForm()) return;

        const data = this.getFormData();

        // 2. Turn on submission lock and loading state
        this.isSaving = true;
        this.submitBtn.disabled = true;
        this.spinner.classList.remove('d-none');

        // Cache original button text & structure
        const originalBtnHTML = this.submitBtn.innerHTML;
        this.submitBtn.innerHTML = `<span class="spinner-border spinner-border-sm me-2" role="status"></span> Saving...`;
        this.submitBtn.style.opacity = '0.8';

        try {
            if (this.config.isEditMode) {
                await SectionCAPI.update(this.config.voucherNo, data);
                notifications.showSuccess('Transaction updated successfully');
            } else {
                await SectionCAPI.create(data);
                notifications.showSuccess('Transaction created successfully');
            }

            // Dynamically update current balance on successful save
            if (data.bank_account) {
                try {
                    const response = await fetch(`/api/account_master/${data.bank_account}/`);
                    if (response.ok) {
                        const resData = await response.json();
                        if (resData && resData.cl_bal !== undefined) {
                            const balNum = parseFloat(resData.cl_bal);
                            const balText = balNum.toLocaleString('en-US', {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2
                            });
                            const colorClass = balNum >= 0 ? 'text-success' : 'text-danger';
                            const balanceEl = document.getElementById('currentBalance');
                            if (balanceEl) {
                                balanceEl.value = balText;
                                balanceEl.classList.remove('text-success', 'text-danger');
                                balanceEl.classList.add(colorClass);
                            }
                            this.headerBankBalance = balText;
                            this.headerBankBalanceClass = colorClass;
                        }
                    }
                } catch (err) {
                    console.error('Failed to update balance after save:', err);
                }
            }

            // Clear dirty flag before redirect
            this.isDirty = false;

            // Redirect after short delay
            setTimeout(() => {
                window.location.href = '/section-c/';
            }, 1000);

        } catch (error) {
            // Restore original button and unlock submitting
            this.isSaving = false;
            this.submitBtn.disabled = false;
            this.submitBtn.style.opacity = '';
            this.submitBtn.innerHTML = originalBtnHTML;
            this.spinner.classList.add('d-none');

            // Format nice friendly validation errors if they come from the API (DRF style)
            let errorMsg = 'Failed to save transaction';
            if (error.response && error.response.data) {
                const resData = error.response.data;
                if (typeof resData === 'object') {
                    const messages = [];
                    for (const [key, value] of Object.entries(resData)) {
                        messages.push(`${key}: ${Array.isArray(value) ? value.join(', ') : value}`);
                    }
                    errorMsg = messages.join(' | ');
                } else if (typeof resData === 'string') {
                    errorMsg = resData;
                }
            } else if (error.message) {
                errorMsg = error.message;
            }

            this.showError(errorMsg);
            console.error('Submit Error:', error);
        }
    }
}
