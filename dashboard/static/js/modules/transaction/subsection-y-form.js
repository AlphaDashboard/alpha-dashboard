import { domUtils }   from '../utils/dom.js?v=147';
import { notifications } from '../utils/notifications.js?v=147';
import { SubsectionYTable } from './subsection-y-table.js?v=147';
import { SubsectionYAPI }   from '../api/subsection-y-api.js?v=147';
import { initializeAccountMasterModalHandler } from '../../common-dropdown.js?v=147';

export class SubsectionYForm {
    constructor(config) {
        this.config = config;
        window.currentFormInstance = this;

        this.form      = domUtils.getElement('#purchaseGroupForm');
        this.alertBox  = domUtils.getElement('#validationAlert');
        this.saveBtn   = domUtils.getElement('#pgSaveBtn');
        this.spinner   = domUtils.getElement('#pgSaveSpinner');

        this.isViewMode = !!(config && config.isViewMode);
        this.isSaving   = false;
        this.isDirty    = false;
        this._isHydrating = false;

        this.table = new SubsectionYTable(this.isViewMode);

        this.init();
    }

    // ─── Bootstrap ────────────────────────────────────────────────────────────

    async init() {
        // Set default date/time for create mode
        if (!this.config.isEditMode && !this.isViewMode) {
            const now    = new Date();
            const offset = now.getTimezoneOffset() * 60000;
            const local  = new Date(now - offset).toISOString().slice(0, 16);
            const dateEl = document.getElementById('voucherDate');
            if (dateEl) dateEl.value = local;
        }

        // Populate the Account Name dropdown from accountmaster-search API
        this._initGroupAccountDropdown();

        // Initialize Account Master creation modal handler
        if (!this.isViewMode) {
            initializeAccountMasterModalHandler('createAccountMasterModal', notifications);
        }

        // Bind all events
        this.bindEvents();

        // Load existing data (edit/view mode) or blank row (create mode)
        if ((this.isViewMode || this.config.isEditMode) && this.config.voucherNo) {
            await this.loadExistingData(this.config.voucherNo);
            if (this.isViewMode) this.lockViewMode();
        } else {
            this.table.rowManager.createRow();
        }

        // Guard unsaved changes
        if (!this.isViewMode) {
            this._bindUnsavedChangesGuard();
        }
    }

    // ─── Populate the Account Name dropdown from API ──────────────────────────

    async _initGroupAccountDropdown() {
        const dropdown = document.getElementById('groupAccountDropdown');
        if (!dropdown) return;

        try {
            const resp = await fetch('/api/accountmaster-search/?page_size=200');
            if (!resp.ok) return;
            const json = await resp.json();
            const items = json.results || json.data || json || [];
            items.forEach(item => {
                const opt = document.createElement('option');
                opt.value = item.id || item.pk;
                opt.textContent = item.Account_Name || item.text || item.display_name || String(item.id);
                dropdown.appendChild(opt);
            });
        } catch (err) {
            console.warn('Could not load account list for group dropdown:', err);
        }
    }

    // ─── Event Binding ────────────────────────────────────────────────────────

    bindEvents() {
        // Form submit
        if (this.form) {
            this.form.addEventListener('submit', e => this.handleSubmit(e));

            // Prevent enter key submitting form from inputs
            this.form.addEventListener('keydown', e => {
                if (e.key === 'Enter' && e.target.tagName !== 'TEXTAREA') {
                    e.preventDefault();
                }
            });

            // Real-time validation
            this.form.addEventListener('input', (e) => {
                if (!this._isHydrating) this.validateField(e.target);
            });
            this.form.addEventListener('blur', (e) => {
                if (!this._isHydrating) this.validateField(e.target);
            }, true);
            this.form.addEventListener('change', (e) => {
                if (!this._isHydrating) {
                    this.validateField(e.target);
                    // Re-validate rate when mode changes
                    if (e.target.matches('input[class*="row-mode"]')) {
                        const tr = e.target.closest('tr');
                        if (tr) {
                            const rateInput = tr.querySelector('.row-rate');
                            if (rateInput) this.validateField(rateInput);
                        }
                    }
                }
            });

            if (typeof jQuery !== 'undefined') {
                jQuery(this.form).on('change', '.select2-hidden-accessible', (e) => {
                    if (!this._isHydrating && !e.target.dataset.hydrating) {
                        this.validateField(e.target);
                    }
                });
            }
        }

        // Groupwise Accounting checkbox toggle
        const checkbox  = document.getElementById('groupwiseAccounting');
        const dropdown  = document.getElementById('groupAccountDropdown');
        if (checkbox && dropdown) {
            checkbox.addEventListener('change', () => {
                dropdown.disabled = !checkbox.checked;
                if (!checkbox.checked) {
                    dropdown.value = '';
                }
                dropdown.dispatchEvent(new Event('change'));
                if (!this._isHydrating) this.validateField(dropdown);
            });
        }
    }

    // ─── Unsaved Changes Guard ───────────────────────────────────────────────

    _bindUnsavedChangesGuard() {
        const WARN = 'Changes are not saved. Are you sure you want to leave?';

        this.form.addEventListener('input',  () => { if (!this._isHydrating) this.isDirty = true; });
        this.form.addEventListener('change', () => { if (!this._isHydrating) this.isDirty = true; });

        window.addEventListener('beforeunload', e => {
            if (!this.isDirty) return;
            e.preventDefault();
            e.returnValue = WARN;
        });

        const backBtn = document.querySelector('.erp-btn-back');
        if (backBtn) {
            backBtn.addEventListener('click', e => {
                if (this.isDirty) {
                    e.preventDefault();
                    if (confirm(WARN)) { this.isDirty = false; window.location.href = backBtn.href; }
                }
            });
        }

        document.querySelectorAll('.sidebar a[href]').forEach(link => {
            const href = link.getAttribute('href');
            if (!href || href.startsWith('#') || href.startsWith('javascript')) return;
            link.addEventListener('click', e => {
                if (this.isDirty) {
                    e.preventDefault();
                    if (confirm(WARN)) { this.isDirty = false; window.location.href = href; }
                }
            });
        });

        history.pushState({ erpFormGuard: true }, '');
        window.addEventListener('popstate', () => {
            if (this.isDirty) {
                history.pushState({ erpFormGuard: true }, '');
                if (confirm(WARN)) { this.isDirty = false; history.go(-2); }
            }
        });
    }

    // ─── Load Existing Data (edit/view) ──────────────────────────────────────

    async loadExistingData(id) {
        try {
            const data = await SubsectionYAPI.getById(id);
            this.populateForm(data);
            this.updateTotalAmount();
        } catch (err) {
            notifications.showError('Failed to load record data');
            console.error(err);
        }
    }

    // ─── Populate Form Fields ─────────────────────────────────────────────────

    populateForm(data) {
        this._isHydrating = true;
        try {
            // Purchase Group Name
            const pgNameEl = document.getElementById('purchaseGroupName');
            if (pgNameEl) {
                pgNameEl.value = data.SalPurGroupName || '';
                pgNameEl.dispatchEvent(new Event('change'));
            }

            // Groupwise Accounting & Account dropdown
            const checkbox = document.getElementById('groupwiseAccounting');
            const dropdown = document.getElementById('groupAccountDropdown');
            if (checkbox) {
                checkbox.checked = !!data.GroupwiseAccounting;
            }
            if (data.GroupwiseAccountID && dropdown) {
                dropdown.disabled = false;
                dropdown.value    = String(data.GroupwiseAccountID);

                // If the option doesn't exist yet, add it
                if (!dropdown.value && data.account_display) {
                    const opt = document.createElement('option');
                    opt.value = String(data.account_display.id);
                    opt.textContent = data.account_display.text;
                    dropdown.appendChild(opt);
                    dropdown.value = String(data.account_display.id);
                }
                dropdown.dispatchEvent(new Event('change'));
            }

            // Interstate flag
            if (data.Interstate_Y_WithinState_N) {
                const interstateY = document.getElementById('interstateY');
                if (interstateY) interstateY.checked = true;
            } else {
                const interstateN = document.getElementById('interstateN');
                if (interstateN) interstateN.checked = true;
            }

            // GST flag
            if (data.GST_Applicable_Y_N) {
                const gstY = document.getElementById('gstY');
                if (gstY) gstY.checked = true;
            } else {
                const gstN = document.getElementById('gstN');
                if (gstN) gstN.checked = true;
            }

            // Detail rows
            this.table.loadData(data.transactions || []);

        } finally {
            this._isHydrating = false;
        }
    }

    // ─── View Mode Lock ───────────────────────────────────────────────────────

    lockViewMode() {
        this.isSaving = true;  // Prevents submit

        if (this.form) {
            this.form.querySelectorAll('input, select, textarea').forEach(el => {
                el.disabled = true;
            });
        }

        // Hide save button
        if (this.saveBtn) this.saveBtn.style.setProperty('display', 'none', 'important');

        // Disable checkbox + dropdown
        const cb  = document.getElementById('groupwiseAccounting');
        const ddl = document.getElementById('groupAccountDropdown');
        if (cb)  cb.disabled  = true;
        if (ddl) ddl.disabled = true;

        // Disable Interstate flag
        const iY = document.getElementById('interstateY');
        const iN = document.getElementById('interstateN');
        if (iY) iY.disabled = true;
        if (iN) iN.disabled = true;

        // Disable GST flag
        const gY = document.getElementById('gstY');
        const gN = document.getElementById('gstN');
        if (gY) gY.disabled = true;
        if (gN) gN.disabled = true;
    }

    // ─── Build Submission Payload ─────────────────────────────────────────────

    getFormData() {
        const pgNameVal     = document.getElementById('purchaseGroupName')?.value || '';

        const checkbox      = document.getElementById('groupwiseAccounting');
        const isGroupwise   = checkbox ? checkbox.checked : false;

        const dropdown      = document.getElementById('groupAccountDropdown');
        const accountID     = (isGroupwise && dropdown?.value) ? dropdown.value : null;

        const interstateY   = document.getElementById('interstateY');
        const isInterstate  = interstateY ? interstateY.checked : false;

        const gstY          = document.getElementById('gstY');
        const isGst         = gstY ? gstY.checked : false;

        const rows          = this.table.getData();

        return {
            SalPurGroupName: pgNameVal,
            GroupwiseAccounting: isGroupwise,
            GroupwiseAccountID: accountID,
            Interstate_Y_WithinState_N: isInterstate,
            GST_Applicable_Y_N: isGst,
            transactions: rows
        };
    }

    // ─── Validation ───────────────────────────────────────────────────────────

    validateField(field) {
        if (!field) return true;
        if (!field.matches('.erp-input, .pg-table-control, select')) return true;
        if (field.type === 'checkbox' || field.type === 'radio') return true;

        let isValid = true;
        let errorMessage = '';

        // Remove existing feedback
        const parent = field.parentElement;
        if (!parent) return true;
        const existingFeedback = parent.querySelector('.invalid-feedback-erp');
        if (existingFeedback) existingFeedback.remove();

        const val = field.value.trim();

        // Purchase Group Name
        if (field.id === 'purchaseGroupName') {
            if (!val) {
                isValid = false;
                errorMessage = 'Purchase Group Name is required';
            } else if (val.length > 200) {
                isValid = false;
                errorMessage = 'Name too long (max 200 chars)';
            }
        }
        // Account Name dropdown (under Groupwise Accounting)
        else if (field.id === 'groupAccountDropdown') {
            const checkbox = document.getElementById('groupwiseAccounting');
            if (checkbox && checkbox.checked && !val) {
                isValid = false;
                errorMessage = 'Please select an Account';
            }
        }
        // Table Account
        else if (field.classList.contains('row-account-select')) {
            if (!val) {
                isValid = false;
                errorMessage = 'Account is required';
            }
        }
        // Table Rate
        else if (field.classList.contains('row-rate')) {
            const num = parseFloat(val);
            const tr = field.closest('tr');
            let isAuto = true;
            if (tr) {
                const manualRadio = tr.querySelector('.row-mode-manual, input[value="manual"]:checked');
                if (manualRadio && manualRadio.checked) {
                    isAuto = false;
                }
            }

            if (!val || isNaN(num)) {
                isValid = false;
                errorMessage = 'Valid amount is required';
            } else if (isAuto && num <= 0) {
                isValid = false;
                errorMessage = 'Amount must be > 0 for Auto mode';
            } else if (!isAuto && num < 0) {
                isValid = false;
                errorMessage = 'Amount cannot be negative';
            }
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
            targetEl.classList.add('is-invalid', 'is-invalid-erp');
            const feedback = document.createElement('div');
            feedback.className = 'invalid-feedback invalid-feedback-erp text-start fw-semibold mt-1';
            feedback.style.fontSize = '11px';
            feedback.innerText = errorMessage;
            parent.appendChild(feedback);
        }

        // Recalculate total amount when validation finishes
        this.updateTotalAmount();

        return isValid;
    }

    updateTotalAmount() {
        if (!this.table || !this.table.rowManager || !this.table.rowManager.tbody) return;
        const rows = this.table.rowManager.tbody.querySelectorAll('tr');
        let total = 0;
        rows.forEach(tr => {
            const rateInput = tr.querySelector('.row-rate');
            if (rateInput) {
                const num = parseFloat(rateInput.value);
                if (!isNaN(num) && num > 0) {
                    total += num;
                }
            }
        });
        const totalEl = document.getElementById('totalAmountDisplay');
        if (totalEl) {
            totalEl.value = total.toFixed(2);
        }
    }

    validateForm() {
        if (this.alertBox) this.alertBox.classList.add('d-none');

        let isFormValid = true;

        // Validate all specific fields
        const fields = this.form.querySelectorAll('.erp-input, .pg-table-control, select');
        fields.forEach(field => {
            if (!this.validateField(field)) {
                isFormValid = false;
            }
        });

        if (!isFormValid) {
            this.showError('Please fix the highlighted errors before saving.');
            return false;
        }

        // Validate table has at least one valid row
        const rows = this.table.getData();
        if (rows.length === 0) {
            this.showError('At least one valid transaction row with an amount is required.');
            return false;
        }

        return true;
    }

    showError(msg) {
        if (!this.alertBox) return;
        this.alertBox.innerHTML = `<i class="bi bi-exclamation-triangle-fill me-2"></i>${msg}`;
        this.alertBox.classList.remove('d-none');
        this.alertBox.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }

    // ─── Form Submit ─────────────────────────────────────────────────────────

    async handleSubmit(e) {
        e.preventDefault();
        if (this.isSaving) return;
        if (!this.validateForm()) return;

        const data = this.getFormData();

        this.isSaving = true;
        if (this.saveBtn) this.saveBtn.disabled = true;
        if (this.spinner) this.spinner.classList.remove('d-none');

        const originalHTML = this.saveBtn?.innerHTML;
        if (this.saveBtn) {
            this.saveBtn.innerHTML = `<span class="spinner-border spinner-border-sm me-2" role="status"></span> Saving...`;
            this.saveBtn.style.opacity = '0.8';
        }

        try {
            if (this.config.isEditMode) {
                await SubsectionYAPI.update(this.config.voucherNo, data);
                notifications.showSuccess('Record updated successfully');
            } else {
                await SubsectionYAPI.create(data);
                notifications.showSuccess('Record created successfully');
            }

            this.isDirty = false;
            setTimeout(() => { window.location.href = '/subsection-y/'; }, 1000);

        } catch (error) {
            this.isSaving = false;
            if (this.saveBtn) {
                this.saveBtn.disabled = false;
                this.saveBtn.style.opacity = '';
                this.saveBtn.innerHTML = originalHTML;
            }
            if (this.spinner) this.spinner.classList.add('d-none');

            let errorMsg = 'Failed to save record';
            if (error.response?.data) {
                const d = error.response.data;
                if (typeof d === 'object') {
                    errorMsg = Object.entries(d)
                        .map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(', ') : v}`)
                        .join(' | ');
                } else {
                    errorMsg = String(d);
                }
            } else if (error.message) {
                errorMsg = error.message;
            }

            this.showError(errorMsg);
            console.error('Submit Error:', error);
        }
    }
}
