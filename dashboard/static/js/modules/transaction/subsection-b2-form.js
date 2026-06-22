import { domUtils } from '../utils/dom.js?v=147';
import { notifications } from '../utils/notifications.js?v=147';
import { SubsectionB2Table } from './subsection-b2-table.js?v=147';
import { SubsectionB2API } from '../api/subsection-b2-api.js?v=147';
import { initializeSearchableDropdown, initializeAccountMasterModalHandler } from '../../common-dropdown.js?v=147';

// ─────────────────────────────────────────────────────────────────────────────
// SubsectionB2Form — Form controller class for Subsection B-2 transactions.
//
// This class manages the B-2 transaction creation and editing form screen.
// It uses:
//   - domUtils: Reusable DOM helper to find form inputs and buttons.
//   - notifications: Reusable helper to show warning, success, or error toast popups.
//   - SubsectionB2Table: Handles transaction detail rows grid rendering and math.
//   - SubsectionB2API: Reusable API helper to query details, fetch balances, or save.
//   - initializeSearchableDropdown: Reusable Select2 helper to load bank accounts.
// ─────────────────────────────────────────────────────────────────────────────

export class SubsectionB2Form {

    /**
     * @param {object} config
     * @param {string}  config.voucherNo   - Existing voucher ID (edit mode) or '' (create)
     * @param {boolean} config.isEditMode  - True = load existing data on init
     */
    constructor(config = {}) {
        this.config      = config;
        window.currentFormInstance = this; // Expose for seamless record navigation
        this.voucherNo   = config.voucherNo   || '';
        this.isEditMode  = config.isEditMode  || false;
        this.isViewMode  = !!config.isViewMode;

        // ── DOM References ──────────────────────────────────────────────────
        this.form          = domUtils.getElement('#transactionForm');
        this.alertBox      = domUtils.getElement('#validationAlert');
        this.submitBtn     = domUtils.getElement('#submitBtn');
        this._submitBtnHTML = this.submitBtn ? this.submitBtn.innerHTML : '';
        this.spinner       = domUtils.getElement('#submitSpinner');

        // ── State flags (baseline patterns) ────────────────────────────────
        this.isSaving      = false;   // Submission guard
        this._isHydrating  = false;   // Validation suppressor during data load
        this._isFormLocked = false;   // Posting lock status
        this.isDirty       = false;   // Unsaved changes tracker

        // ── Table/Grid engine ───────────────────────────────────────────────
        this.table = new SubsectionB2Table();

        this.init();
    }

    // ─── Bootstrap ────────────────────────────────────────────────────────────

    async init() {
        this.bindEvents();

        // Initialise bank account Select2 on header field
        const bankAccountEl = domUtils.getElement('#bankAccount');
        if (bankAccountEl) {
            initializeSearchableDropdown(bankAccountEl, '/api/accountmaster-search/', ' ', {
                dropdownParent: jQuery('body'),
                enableAddNew:   !this.isViewMode,
                addNewText:     '➕ Add New Bank Account',
                modalId:        'addAccountMasterModal'
            });
        }

        if (this.isViewMode && this.voucherNo) {
            await this.loadExistingData(this.voucherNo);
            this.lockViewMode();
        } else if (this.isEditMode && this.voucherNo) {
            await this.loadExistingData(this.voucherNo);
        } else {
            // Create mode: ensure at least one blank row is ready
            if (this.table.getData().length === 0) {
                this.table.rowManager.createRow();
                this.table.updateRowIndices();
            }
        }

        // Initialize dynamic AJAX modal save handler to prevent page reloads
        if (!this.isViewMode) {
            initializeAccountMasterModalHandler('addAccountMasterModal', notifications);
            this._bindUnsavedChangesGuard();
        }
    }

    // ─── Event Binding ────────────────────────────────────────────────────────

    bindEvents() {
        if (!this.form) return;

        // Submit handler
        this.form.addEventListener('submit', (e) => this.handleSubmit(e));

        // Prevent Enter key from submitting (except Textarea)
        this.form.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && e.target.tagName !== 'TEXTAREA') {
                e.preventDefault();
            }
        });

        // Prevent mouse wheel changing number inputs accidentally
        this.form.addEventListener('wheel', (e) => {
            if (document.activeElement.type === 'number') {
                document.activeElement.blur();
            }
        }, { passive: true });

        // Real-time validation — input, blur, change
        this.form.addEventListener('input',  (e) => this.validateField(e.target));
        this.form.addEventListener('blur',   (e) => this.validateField(e.target), true);
        this.form.addEventListener('change', (e) => this.validateField(e.target));

        // Select2 change events (fired on hidden select)
        jQuery(this.form).on('change', '.select2-hidden-accessible', (e) => {
            this.validateField(e.target);
        });

        // Dynamic account balance fetching
        jQuery('#bankAccount').on('change', () => this.handleBankAccountChange());
        jQuery('#date').on('change', () => this.handleBankAccountChange());
    }

    // ─── Unsaved Changes Guard ────────────────────────────────────────────────
    // Marks form dirty on any user input. Warns before navigating away.

    _bindUnsavedChangesGuard() {
        if (this.isViewMode) return;
        const WARN_MSG = 'Changes are not saved. Are you sure you want to leave?';

        // ── Mark dirty on any input/change in the form ────────────────────
        this.form.addEventListener('input', () => {
            if (!this._isHydrating) this.isDirty = true;
        });
        this.form.addEventListener('change', () => {
            if (!this._isHydrating) this.isDirty = true;
        });
        // Also catch Select2 and toggle button changes
        jQuery(this.form).on('change', () => {
            if (!this._isHydrating) this.isDirty = true;
        });
        // Catch add/remove row buttons (table changes) via document-level delegation
        this.form.addEventListener('click', (e) => {
            if (e.target.closest('.add-row-btn, .remove-row-btn')) {
                if (!this._isHydrating) this.isDirty = true;
            }
        });

        // ── Browser refresh / tab close ───────────────────────────────────
        this._beforeUnloadHandler = (e) => {
            if (!this.isDirty) return;
            e.preventDefault();
            e.returnValue = WARN_MSG;
            return WARN_MSG;
        };
        window.addEventListener('beforeunload', this._beforeUnloadHandler);

        // ── Back button (.erp-btn-back link) ─────────────────────────────
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
        // Intercept all sidebar anchor links that actually navigate (have real hrefs)
        document.querySelectorAll('.sidebar a[href]').forEach(link => {
            const href = link.getAttribute('href');
            // Skip collapse toggles (href="#something") and javascript: links
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
        // Push a state entry so we can intercept the back button
        history.pushState({ erpFormGuard: true }, '');
        this._popStateHandler = (e) => {
            if (this.isDirty) {
                // Re-push state to stay on page, then ask user
                history.pushState({ erpFormGuard: true }, '');
                if (confirm(WARN_MSG)) {
                    this.isDirty = false;
                    history.go(-2); // Go back past our injected state
                }
            }
        };
        window.addEventListener('popstate', this._popStateHandler);
    }

    // ─── Field Validation ─────────────────────────────────────────────────────

    validateField(field) {
        // Skip if hydrating or field not relevant
        if (this._isHydrating) return true;
        if (!field) return true;
        if (!field.matches) return true;
        if (!field.matches('.erp-input, .erp-table-control, select')) return true;
        if (field.type === 'checkbox' || field.type === 'radio') return true;
        if (!field.parentElement) return true;
        if (field.id === 'voucherNo') return true;

        // Remove any previous feedback
        const parent = field.parentElement;
        parent.querySelectorAll('.invalid-feedback-erp').forEach(el => el.remove());

        const val      = field.value ? field.value.trim() : '';
        let   isValid  = true;
        let   errorMsg = '';

        // ── Field-specific rules ─────────────────────────────────────────
        if (field.id === 'bankAccount') {
            if (!val) { isValid = false; errorMsg = 'Bank Account is required.'; }

        } else if (field.type === 'datetime-local' || field.type === 'date') {
            if (field.hasAttribute('required') && !val) {
                isValid = false; errorMsg = 'Date is required.';
            }

        } else if (field.id === 'narration') {
            if (val.length > 200) {
                isValid = false; errorMsg = 'Max 200 characters.';
            }

        } else if (field.id === 'refVoucherNo') {
            if (val.length > 50) {
                isValid = false; errorMsg = 'Max 50 characters.';
            }

        } else if (field.classList.contains('row-account-master')) {
            if (!val) { isValid = false; errorMsg = 'Account is required.'; }

        } else if (field.classList.contains('row-amount')) {
            const num = parseFloat(val);
            if (isNaN(num) || num <= 0) {
                isValid = false; errorMsg = 'Amount must be greater than 0.';
            }

        } else if (field.hasAttribute('required') && !val) {
            isValid = false; errorMsg = 'This field is required.';
        }

        // ── Determine target element (Select2 vs native input) ───────────
        const isSelect2Hidden = field.classList.contains('select2-hidden-accessible');
        let targetEl = field;
        if (isSelect2Hidden) {
            targetEl = parent.querySelector('.select2-container') || field;
        }

        // ── Apply visual state ────────────────────────────────────────────
        if (isValid) {
            targetEl.classList.remove('is-invalid', 'is-invalid-erp');
        } else {
            targetEl.classList.add('is-invalid');
            if (isSelect2Hidden) targetEl.classList.add('is-invalid-erp');

            const feedback = document.createElement('div');
            feedback.className   = 'invalid-feedback-erp';
            feedback.textContent = errorMsg;
            feedback.style.display = 'block';

            if (isSelect2Hidden) {
                targetEl.insertAdjacentElement('afterend', feedback);
            } else {
                field.insertAdjacentElement('afterend', feedback);
            }
        }

        return isValid;
    }

    // ─── Full-Form Validation ─────────────────────────────────────────────────

    validateForm() {
        if (this.alertBox) this.alertBox.classList.add('d-none');
        let isFormValid = true;

        // Validate all ERP inputs
        this.form.querySelectorAll('.erp-input, .erp-table-control, select').forEach(field => {
            if (!this.validateField(field)) {
                isFormValid = false;
            }
        });

        if (!isFormValid) {
            this._showAlert('Please fix the highlighted errors before saving.');
            return false;
        }

        // Ensure at least one valid row
        const rowData = this.table.getData();
        if (!rowData || rowData.length === 0) {
            this._showAlert('At least one valid transaction row with an account and amount is required.');
            return false;
        }

        return true;
    }

    // ─── Edit Mode Data Loading ───────────────────────────────────────────────

    async loadExistingData(voucherNo) {
        try {
            const data = await SubsectionB2API.getById(voucherNo);
            this.populateForm(data);
        } catch (err) {
            notifications.showError('Failed to load transaction data. Please refresh and try again.');
            console.error('SubsectionB2Form.loadExistingData:', err);
        }
    }

    populateForm(data) {
        this._isHydrating = true;  // ← Block all validation during hydration (also suppresses dirty tracking)

        try {
            // Header fields
            const voucherNoEl   = domUtils.getElement('#voucherNo');
            const dateEl        = domUtils.getElement('#date');
            const narrationEl   = domUtils.getElement('#narration');
            const statusEl      = domUtils.getElement('#status');
            const refVoucherEl  = domUtils.getElement('#refVoucherNo');

            const postingStatusEl = domUtils.getElement('#postingStatus');

            if (voucherNoEl && data.voucher_no) voucherNoEl.value = data.voucher_no;
            if (narrationEl && data.narration)  narrationEl.value = data.narration;
            if (statusEl    && data.status !== undefined) statusEl.value = data.status ? '1' : '0';
            if (refVoucherEl && data.ref_voucher_no) refVoucherEl.value = data.ref_voucher_no;
            if (postingStatusEl && data.posting_status) postingStatusEl.value = data.posting_status;

            // DateTime field — convert UTC ISO → local datetime-local format
            if (dateEl && data.date) {
                const d = new Date(data.date);
                const pad = n => String(n).padStart(2, '0');
                const localStr = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
                dateEl.value = localStr;
            }

            // tran_type (hidden input)
            const tranTypeEl = domUtils.getElement('#tranType');
            if (tranTypeEl && data.tran_type) tranTypeEl.value = data.tran_type;

            // rpid toggle buttons
            const rpidValue = data.rpid || 'I';
            const rpidEl = domUtils.getElement('#rpid');
            if (rpidEl) rpidEl.value = rpidValue;

            const issueBtn = document.querySelector('.issue-btn');
            const depositBtn = document.querySelector('.deposit-btn');
            if (issueBtn && depositBtn) {
                const isDeposit = rpidValue === 'D' || rpidValue === 'R';
                depositBtn.classList.toggle('active', isDeposit);
                issueBtn.classList.toggle('active', !isDeposit);
            }

            // Bank Account — pre-populate Select2 with display data
            const bankAccountEl = domUtils.getElement('#bankAccount');
            if (bankAccountEl && data.bank_account_display) {
                const opt = new Option(
                    data.bank_account_display.text,
                    data.bank_account_display.id,
                    true, true
                );
                jQuery(bankAccountEl).append(opt).trigger('change');
            }

            // Load detail rows into the table
            if (data.transactions && data.transactions.length > 0) {
                this.table.loadData(data.transactions);
            }

            // Check posting status for locked state
            if (data.posting_status === 'POSTED') {
                setTimeout(() => this.lockForm(), 100);
            }

        } finally {
            this._isHydrating = false;  // ← Always restore even if error
        }
    }

    // ─── Payload Assembly ─────────────────────────────────────────────────────

    getFormData() {
        const dateVal = domUtils.getElement('#date')?.value;
        const bankAccountEl = domUtils.getElement('#bankAccount');
        const bankAccountVal = bankAccountEl ? (bankAccountEl.value || null) : null;

        const statusEl = domUtils.getElement('#status');
        const statusVal = statusEl ? (statusEl.value === '1' || statusEl.value === 'true') : true;

        const rows  = this.table.getData();
        const total = rows.reduce((sum, r) => sum + parseFloat(r.amount || 0), 0);

        return {
            voucher_no:     domUtils.getElement('#voucherNo')?.value || undefined,
            date:           dateVal ? new Date(dateVal).toISOString() : '',
            tran_type:      domUtils.getElement('#tranType')?.value || 'BANK',
            rpid:           domUtils.getElement('#rpid')?.value || 'I',
            amount:         total,
            narration:      domUtils.getElement('#narration')?.value || '',
            bank_account:   bankAccountVal,
            posting_status: domUtils.getElement('#postingStatus')?.value || 'DRAFT',
            ref_voucher_no: domUtils.getElement('#refVoucherNo')?.value || '',
            status:         statusVal,
            transactions:   rows,
        };
    }

    // ─── Form Submission ──────────────────────────────────────────────────────

    async handleSubmit(e) {
        e.preventDefault();

        if (this.isViewMode) return;

        // Submission guard — prevent double POST on rapid clicks
        if (this.isSaving) return;

        if (!this.validateForm()) return;

        const payload = this.getFormData();

        // Lock UI
        this.isSaving = true;
        if (this.submitBtn) {
            this.submitBtn.disabled  = true;
            this.submitBtn.innerHTML = `
                <span class="spinner-border spinner-border-sm me-2" role="status"></span>
                Saving…`;
        }

        try {
            if (this.isEditMode && this.voucherNo) {
                await SubsectionB2API.update(this.voucherNo, payload);
                notifications.showSuccess('Transaction updated successfully.');
            } else {
                await SubsectionB2API.create(payload);
                notifications.showSuccess('Transaction created successfully.');
            }

            // ── Clear dirty flag on successful save ───────────────────────
            // This prevents the beforeunload warning during the redirect.
            this.isDirty = false;

            // Redirect to list after short delay (lets toast render)
            setTimeout(() => {
                window.location.href = '/subsection-b2/';
            }, 800);

        } catch (err) {
            // Parse DRF field-level error responses
            let errorMsg = 'An unexpected error occurred. Please try again.';
            try {
                const resData = typeof err.message === 'string' && err.message.startsWith('{')
                    ? JSON.parse(err.message)
                    : null;
                if (resData) {
                    const messages = [];
                    Object.entries(resData).forEach(([key, value]) => {
                        messages.push(`${key}: ${Array.isArray(value) ? value.join(', ') : value}`);
                    });
                    if (messages.length) errorMsg = messages.join(' | ');
                } else if (err.message) {
                    errorMsg = err.message;
                }
            } catch (_) {
                if (err.message) errorMsg = err.message;
            }

            notifications.showError(errorMsg);
            console.error('SubsectionB2Form.handleSubmit:', err);

            // Unlock UI
            this.isSaving = false;
            if (this.submitBtn) {
                this.submitBtn.disabled  = false;
                this.submitBtn.innerHTML = this._submitBtnHTML;
            }
        }
    }

    // ─── Private Helpers ──────────────────────────────────────────────────────

    _showAlert(message) {
        if (!this.alertBox) return;
        this.alertBox.innerHTML = `<i class="bi bi-exclamation-triangle-fill me-2"></i>${message}`;
        this.alertBox.classList.remove('d-none');
        this.alertBox.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }

    async handleBankAccountChange() {
        if (this._isFormLocked) return;

        const bankAccountEl = domUtils.getElement('#bankAccount');
        const balanceEl = domUtils.getElement('#currentBalance');
        if (!bankAccountEl || !balanceEl) return;

        const val = bankAccountEl.value;
        if (!val) {
            balanceEl.value = '0.00';
            balanceEl.classList.remove('text-success', 'text-danger');
            balanceEl.classList.add('text-success');
            return;
        }

        try {
            const dateVal = domUtils.getElement('#date')?.value;
            const upToDate = dateVal ? new Date(dateVal).toISOString() : null;

            const res = await SubsectionB2API.getBalance(val, upToDate);
            if (res && res.balance !== undefined) {
                const balNum = parseFloat(res.balance);
                balanceEl.value = balNum.toLocaleString('en-US', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2
                });
                
                balanceEl.classList.remove('text-success', 'text-danger');
                if (balNum >= 0) {
                    balanceEl.classList.add('text-success');
                } else {
                    balanceEl.classList.add('text-danger');
                }
            }
        } catch (err) {
            console.error('Error fetching bank account balance:', err);
            balanceEl.value = 'Error';
        }
    }

    lockForm() {
        this._isFormLocked = true;

        this.form.querySelectorAll('input, select, textarea').forEach(el => {
            el.disabled = true;
            el.classList.add('bg-light');
        });

        if (typeof jQuery !== 'undefined') {
            jQuery('#bankAccount').prop('disabled', true).trigger('change');
            jQuery(this.form).find('.row-account-master').prop('disabled', true).trigger('change');
        }

        this.form.querySelectorAll('.add-row-btn, .remove-row-btn').forEach(btn => {
            btn.style.pointerEvents = 'none';
            btn.style.opacity = '0.5';
            btn.disabled = true;
        });

        this.form.querySelectorAll('.erp-toggle-btn').forEach(btn => {
            btn.style.pointerEvents = 'none';
            btn.style.opacity = '0.7';
            btn.disabled = true;
        });

        if (this.submitBtn) {
            this.submitBtn.disabled = true;
            this.submitBtn.classList.remove('erp-btn-save');
            this.submitBtn.classList.add('btn-secondary');
            this.submitBtn.innerHTML = '<i class="bi bi-lock-fill me-1"></i> Locked (POSTED)';
        }

        this._showLockedAlert('This transaction has been POSTED and is now read-only.');
    }

    lockViewMode() {
        this._isFormLocked = true;

        this.form.querySelectorAll('input, select, textarea').forEach(el => {
            el.disabled = true;
            el.classList.add('bg-light');
        });

        if (typeof jQuery !== 'undefined') {
            jQuery('#bankAccount').prop('disabled', true).trigger('change');
            jQuery(this.form).find('.row-account-master').prop('disabled', true).trigger('change');
            jQuery(this.form).find('select').prop('disabled', true).trigger('change');
        }

        this.form.querySelectorAll('.add-row-btn, .remove-row-btn').forEach(btn => {
            btn.style.setProperty('display', 'none', 'important');
        });

        this.form.querySelectorAll('.erp-toggle-btn').forEach(btn => {
            btn.style.pointerEvents = 'none';
            btn.style.opacity = '0.7';
            btn.disabled = true;
        });

        if (this.submitBtn) {
            this.submitBtn.style.setProperty('display', 'none', 'important');
        }

        this._showLockedAlert('This transaction is in read-only view mode.');
        this.isSaving = true;
    }

    _showLockedAlert(message) {
        if (!this.alertBox) return;
        this.alertBox.innerHTML = `<i class="bi bi-lock-fill me-2"></i><strong>${message}</strong>`;
        this.alertBox.className = 'alert alert-warning shadow-sm border-0 d-block p-2 mb-2';
        this.alertBox.style.borderRadius = '6px';
        this.alertBox.style.fontSize = '13px';
        this.alertBox.style.backgroundColor = '#fffbeb';
        this.alertBox.style.color = '#b45309';
        this.alertBox.style.borderLeft = '4px solid #f59e0b';
    }
}
