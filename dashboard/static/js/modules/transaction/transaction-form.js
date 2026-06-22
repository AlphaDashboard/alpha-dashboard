import { domUtils } from '../utils/dom.js?v=147';
import { notifications } from '../utils/notifications.js?v=147';
import { TransactionTable } from './transaction-table.js?v=147';
import { BankTransactionAPI } from '../api/bank-transaction-api.js?v=147';
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

        this.table = new TransactionTable(this.isViewMode);

        this.headerBankBalance = '0.00';
        this.headerBankBalanceClass = 'text-success';

        // Submission lock
        this.isSaving = false;

        // Flatpickr instance (set during init)
        this.fp = null;

        // Hydration flag — suppresses validation during programmatic field population
        this._isHydrating = false;

        // Unsaved changes tracker
        this.isDirty = false;

        this.init();
    }

    // ─── Bootstrap ────────────────────────────────────────────────────────────

    async init() {
        this.bindEvents();

        // 1. Initialize Bank Account Select2 FIRST (before data load)
        //    In view mode: still initialize Select2 so loaded data displays correctly,
        //    but disable it afterwards in lockViewMode().
        // Initialize Custom Combo on Bank Account FIRST (before data load)
        if (typeof jQuery !== 'undefined') {
            const comboInst = new CustomMultiColumnCombo('#bankAccount', '/api/accountmaster-search/', ' ', {
                enableAddNew: !this.isViewMode,
                addNewText: 'Add New Bank Account',
                modalId: 'createAccountMasterModal',
                secondColumnHeader: 'Bank Name',
                isBankAccount: true,
                showBalanceInTextbox: false,
                onModalOpen: function (modalEl, term) {
                    const title = modalEl.querySelector('.modal-title');
                    if (title) title.textContent = 'Create New Bank Account';

                    const codeLabel = modalEl.querySelector('input[name="code"]').previousElementSibling;
                    if (codeLabel) codeLabel.innerHTML = 'Account Number <span class="text-secondary">(optional)</span>';

                    const codeInput = modalEl.querySelector('input[name="code"]');
                    if (codeInput) {
                        codeInput.placeholder = 'Enter Account Number (Auto-generated if empty)';
                        codeInput.required = false;
                    }

                    const nameLabel = modalEl.querySelector('input[name="account_name"]').previousElementSibling;
                    if (nameLabel) nameLabel.innerHTML = 'Bank Account Name <span class="text-danger">*</span>';

                    const displayLabel = modalEl.querySelector('input[name="display_name"]').previousElementSibling;
                    if (displayLabel) displayLabel.innerHTML = 'Display Name <span class="text-secondary">(optional)</span>';

                    const displayInput = modalEl.querySelector('input[name="display_name"]');
                    if (displayInput) {
                        displayInput.placeholder = 'Enter Display Name';
                        displayInput.required = false;
                    }
                },
                onSelect: function (data) {
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
                    console.error('Failed to fetch Bank Account balance:', err);
                }
            });
        }



        // NOTE: We do NOT use Flatpickr on #date because type="datetime-local" already
        // provides a native browser date+time picker. Flatpickr conflicts with native
        // browser validation and causes the field to show red in edit mode.
        // The native input expects YYYY-MM-DDTHH:MM which is what we write directly.
        this.fp = null;

        // 3. Load data or create initial blank row
        if (this.isViewMode && this.config.voucherNo) {
            // View mode: load data then lock everything
            await this.loadExistingData(this.config.voucherNo);
            this.lockViewMode();
        } else if (this.config.isEditMode && this.config.voucherNo) {
            await this.loadExistingData(this.config.voucherNo);
        } else {
            this.table.rowManager.createRow();
            this.table.updateRowIndices();
        }

        // 4. Initialize modal handler last (skip in view mode — no saving possible)
        if (!this.isViewMode) {
            initializeAccountMasterModalHandler('createAccountMasterModal', notifications);

            // ── Accidental Modal Close Protection inside Transaction form ──
            let isModalDirty = false;
            const modalEl = document.getElementById('createAccountMasterModal');
            if (modalEl) {
                modalEl.addEventListener('shown.bs.modal', function() {
                    isModalDirty = false;
                    modalEl.querySelectorAll('.form-control, .form-select, input').forEach(input => {
                        input.addEventListener('input', () => { isModalDirty = true; });
                        input.addEventListener('change', () => { isModalDirty = true; });
                    });
                });

                modalEl.addEventListener('hidden.bs.modal', function() {
                    isModalDirty = false;
                });

                modalEl.addEventListener('hide.bs.modal', function(e) {
                    const WARN_MSG = 'Changes are not saved. Are you sure you want to leave?';
                    if (isModalDirty) {
                        if (!confirm(WARN_MSG)) {
                            e.preventDefault();
                        } else {
                            isModalDirty = false;
                        }
                    }
                });

                const modalForm = modalEl.querySelector('form');
                if (modalForm) {
                    modalForm.addEventListener('submit', function() {
                        isModalDirty = false;
                    });
                }
            }
        }

        // Dispatch ready event for AJAX navigation
        if (this.form) {
            this.form.dispatchEvent(new CustomEvent('erp-form-ready', { bubbles: true }));
        }
    }

    // ─── Event Binding ────────────────────────────────────────────────────────

    bindEvents() {
        this.form.addEventListener('submit', (e) => this.handleSubmit(e));

        this.form.addEventListener('keydown', (e) => {
            if (e.target.type === 'number' && (e.key === 'ArrowUp' || e.key === 'ArrowDown')) {
                e.preventDefault();
            }
            if (e.key === 'Enter' && e.target.tagName !== 'TEXTAREA') {
                e.preventDefault();
            }
        });

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
                // Skip validation during hydration OR when element is marked as hydrating
                if (!this._isHydrating && !e.target.dataset.hydrating) {
                    this.validateField(e.target);
                }
            });
        }



        // ── Unsaved Changes Guard ─────────────────────────────────────────
        // Skip in view mode — there are no editable fields, no dirty state, no warning needed.
        if (!this.isViewMode) {
            this._bindUnsavedChangesGuard();
        }
    }

    // ─── Unsaved Changes Guard ───────────────────────────────────────────────────
    // Sets isDirty=true on any user interaction. Warns before any navigation
    // if the form has unsaved changes. Safe during hydration (no false positives).

    _bindUnsavedChangesGuard() {
        const WARN_MSG = 'Changes are not saved. Are you sure you want to leave?';

        // ── Mark dirty on any user input/change (skip during hydration) ─────────
        this.form.addEventListener('input', () => {
            if (!this._isHydrating) this.isDirty = true;
        });
        this.form.addEventListener('change', () => {
            if (!this._isHydrating) this.isDirty = true;
        });
        // Catch Select2 changes (fired on hidden select)
        if (typeof jQuery !== 'undefined') {
            jQuery(this.form).on('change', () => {
                if (!this._isHydrating) this.isDirty = true;
            });
        }
        // Catch add/remove row button clicks (table row changes)
        this.form.addEventListener('click', (e) => {
            if (e.target.closest('.add-row-btn, .remove-row-btn')) {
                if (!this._isHydrating) this.isDirty = true;
            }
        });

        // ── Browser refresh / tab close ────────────────────────────────────
        window.addEventListener('beforeunload', (e) => {
            if (!this.isDirty) return;
            e.preventDefault();
            e.returnValue = WARN_MSG;
            return WARN_MSG;
        });

        // ── Back button (.erp-btn-back anchor link) ─────────────────────────
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

        // ── Sidebar navigation links ──────────────────────────────────────
        // Intercept all sidebar links that cause full-page navigation
        document.querySelectorAll('.sidebar a[href]').forEach(link => {
            const href = link.getAttribute('href');
            // Skip collapse toggles (#anchor) and javascript: pseudo-links
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

        // ── Browser Back button (popstate) ────────────────────────────────
        // Push a guard state so we can detect and intercept the browser back button
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

        const parent = field.parentElement;
        if (!parent) return true;
        const existingFeedback = parent.querySelector('.invalid-feedback-erp');
        if (existingFeedback) existingFeedback.remove();

        const val = field.value.trim();

        if (field.id === 'voucherNo') {
            if (!val) { isValid = false; errorMessage = 'Voucher No is required'; }
        }
        else if (field.type === 'date' || field.type === 'datetime-local') {
            if (field.hasAttribute('required') && !val) { isValid = false; errorMessage = 'Date is required'; }
        }
        else if (field.id === 'bankAccount') {
            if (!val) { isValid = false; errorMessage = 'Bank Account is required'; }
        }
        else if (field.id === 'narration') {
            if (val.length > 200) { isValid = false; errorMessage = 'Narration too long (max 200 chars)'; }
        }
        else if (field.classList.contains('row-account-master')) {
            if (!val) { isValid = false; errorMessage = 'Account is required'; }
        }
        else if (field.classList.contains('row-amount')) {
            const num = parseFloat(val);
            if (!val || isNaN(num)) {
                isValid = false; errorMessage = 'Valid amount is required';
            } else if (num <= 0) {
                isValid = false; errorMessage = 'Amount must be greater than zero';
            }
        }
        else if (field.hasAttribute('required') && !val) {
            isValid = false; errorMessage = 'This field is required';
        }

        let targetEl = field;
        const isSelect2 = field.classList.contains('select2-hidden-accessible');
        const customComboInput = parent ? parent.querySelector('.custom-combo-input') : null;
        if (isSelect2) {
            targetEl = parent.querySelector('.select2-container') || field;
        } else if (customComboInput) {
            targetEl = customComboInput;
        }

        if (isValid) {
            targetEl.classList.remove('is-invalid', 'is-invalid-erp', 'is-valid');
        } else {
            targetEl.classList.remove('is-valid');
            targetEl.classList.add('is-invalid');
            if (isSelect2 || customComboInput) {
                targetEl.classList.add('is-invalid-erp');
            }

            const feedback = document.createElement('div');
            feedback.className = 'invalid-feedback-erp';
            feedback.textContent = errorMessage;

            if (isSelect2 || customComboInput) {
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
            const data = await BankTransactionAPI.getById(id);
            this.populateForm(data);
        } catch (error) {
            notifications.showError('Failed to load transaction data');
            console.error(error);
        }
    }

    // ─── Form Population (Edit Mode) ──────────────────────────────────────────

    populateForm(data) {
        // Engage hydration lock — suppresses validation AND dirty tracking during pre-fill
        this._isHydrating = true;

        try {
            // --- Simple text fields ---
            domUtils.getElement('#voucherNo').value = data.voucher_no || '';
            domUtils.getElement('#narration').value = data.narration || '';
            domUtils.getElement('#tranType').value  = data.tran_type || 'BANK';

            // --- RPID toggle ---
            const rpidValue  = data.rpid || 'I';
            const rpidInput  = domUtils.getElement('#rpid');
            if (rpidInput) rpidInput.value = rpidValue;

            const issueBtn   = document.querySelector('.issue-btn');
            const depositBtn = document.querySelector('.deposit-btn');
            if (issueBtn && depositBtn) {
                const isDeposit = rpidValue === 'D' || rpidValue === 'R';
                depositBtn.classList.toggle('active', isDeposit);
                issueBtn.classList.toggle('active', !isDeposit);
            }

            if (domUtils.getElement('#rpidToggle')) {
                domUtils.getElement('#rpidToggle').checked = (rpidValue === 'D' || rpidValue === 'R');
            }

            // --- Date: convert UTC ISO → local time → write as YYYY-MM-DDTHH:MM
            // The native datetime-local input requires exactly this format.
            if (data.date) {
                const d = new Date(data.date);
                const pad = n => String(n).padStart(2, '0');
                const localStr =
                    `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}` +
                    `T${pad(d.getHours())}:${pad(d.getMinutes())}`;
                domUtils.getElement('#date').value = localStr;
            }

            // --- Status (hidden input, value='1' or '0') ---
            const statusInput = domUtils.getElement('#status');
            if (statusInput) statusInput.value = data.status ? '1' : '0';

            // --- Bank Account Select2 (nullable — only populate when present) ---
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

            // --- Transaction rows ---
            this.table.loadData(data.transactions || []);

        } finally {
            // Always release the hydration lock, even if something threw
            this._isHydrating = false;
        }
    }

    // ─── Validation (full form) ───────────────────────────────────────────────

    validateForm() {
        this.alertBox.classList.add('d-none');
        let isFormValid = true;

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

    // ─── View Mode Lock ─────────────────────────────────────────────────────────
    // Called after data hydration in view mode.
    // Disables every interactive element and hides action buttons.
    // isDirty stays false — no unsaved-changes popup ever fires.

    lockViewMode() {
        // ── Disable all native inputs, selects, textareas ──────────────────────
        this.form.querySelectorAll('input, select, textarea').forEach(el => {
            el.disabled = true;
            el.classList.add('bg-light');
        });

        // ── Disable Select2 / Custom Combo dropdowns ────────────────────────
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

        // ── Block ISSUE/DEPOSIT toggle buttons ─────────────────────────────
        this.form.querySelectorAll('.erp-toggle-btn').forEach(btn => {
            btn.disabled = true;
            btn.style.pointerEvents = 'none';
            btn.style.opacity = '0.7';
        });

        // ── Hide Add Row and Delete Row buttons from all rows ─────────────────
        this.form.querySelectorAll('.add-row-btn, .remove-row-btn').forEach(btn => {
            btn.style.setProperty('display', 'none', 'important');
        });

        // ── Hide the Save button (entire tfoot cell area) ────────────────────
        if (this.submitBtn) {
            this.submitBtn.style.setProperty('display', 'none', 'important');
        }

        // ── Show view-mode info banner ────────────────────────────────────
        if (this.alertBox) {
            this.alertBox.innerHTML = '<i class="bi bi-eye me-2"></i><strong>View Mode</strong> — This transaction is read-only. No changes can be made.';
            this.alertBox.className = 'alert shadow-sm border-0 d-block p-2 mb-2';
            this.alertBox.style.borderRadius = '6px';
            this.alertBox.style.fontSize = '13px';
            this.alertBox.style.backgroundColor = '#eff6ff';
            this.alertBox.style.color = '#1d4ed8';
            this.alertBox.style.borderLeft = '4px solid #3b82f6';
        }

        // ── Block form submission entirely (last-resort guard) ──────────────
        this.isSaving = true;  // isSaving=true means handleSubmit() is a no-op
    }

    // ─── Build Save Payload ───────────────────────────────────────────────────

    getFormData() {
        // Get date value directly from the datetime-local input (YYYY-MM-DDTHH:MM)
        const dateVal = domUtils.getElement('#date').value;

        const bankAccountEl = domUtils.getElement('#bankAccount');
        const bankAccountVal = bankAccountEl ? (bankAccountEl.value || null) : null;

        const statusEl = domUtils.getElement('#status');
        const statusVal = statusEl ? statusEl.value === '1' : true;

        return {
            voucher_no:   domUtils.getElement('#voucherNo').value,
            date:         dateVal,
            tran_type:    domUtils.getElement('#tranType').value,
            rpid:         domUtils.getElement('#rpid').value,
            narration:    domUtils.getElement('#narration').value,
            bank_account: bankAccountVal,
            status:       statusVal,
            amount:       this.table.calculateTotal(),
            transactions: this.table.getData()
        };
    }

    // ─── Submit ───────────────────────────────────────────────────────────────

    async handleSubmit(e) {
        e.preventDefault();

        if (this.isSaving) return;
        if (!this.validateForm()) return;

        const data = this.getFormData();

        this.isSaving = true;
        this.submitBtn.disabled = true;
        this.spinner.classList.remove('d-none');

        const originalBtnHTML = this.submitBtn.innerHTML;
        this.submitBtn.innerHTML = `<span class="spinner-border spinner-border-sm me-2" role="status"></span> Saving...`;
        this.submitBtn.style.opacity = '0.8';

        try {
            if (this.config.isEditMode) {
                await BankTransactionAPI.update(this.config.voucherNo, data);
                notifications.showSuccess('Transaction updated successfully');
            } else {
                await BankTransactionAPI.create(data);
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

            // Clear dirty flag before redirect — prevents false beforeunload warning
            this.isDirty = false;

            setTimeout(() => {
                window.location.href = '/bank-transaction/';
            }, 1000);

        } catch (error) {
            this.isSaving = false;
            this.submitBtn.disabled = false;
            this.submitBtn.style.opacity = '';
            this.submitBtn.innerHTML = originalBtnHTML;
            this.spinner.classList.add('d-none');

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
