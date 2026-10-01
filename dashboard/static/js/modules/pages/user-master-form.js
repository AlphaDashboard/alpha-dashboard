import { UserMasterAPI } from '../api/user-master-api.js?v=148';
import { domUtils } from '../utils/dom.js?v=148';
import { notifications } from '../utils/notifications.js?v=148';

export const SYSTEM_FORMS = [
    // Master
    { form_key: 'account_master', form_name: 'Account Master / Group', section: 'Master' },
    { form_key: 'accounts', form_name: 'Accounts', section: 'Master' },
    { form_key: 'sal_pur_group', form_name: 'Sales Purchase Group', section: 'Master' },
    { form_key: 'products_items', form_name: 'Products / Items', section: 'Master' },
    { form_key: 'user_master', form_name: 'User Master', section: 'Master' },

    // Transactions
    { form_key: 'cash_voucher', form_name: 'Cash Voucher', section: 'Transactions' },
    { form_key: 'bank_transaction', form_name: 'Bank Transaction', section: 'Transactions' },
    { form_key: 'journal_entry', form_name: 'Journal Entry', section: 'Transactions' },

    // Raw Materials
    { form_key: 'purchase_order', form_name: 'Purchase Order', section: 'Raw Materials' },
    { form_key: 'purchase_challan', form_name: 'Purchase Challan', section: 'Raw Materials' },
    { form_key: 'gate_entry', form_name: 'Gatepass Entry', section: 'Raw Materials' },
    { form_key: 'grn', form_name: 'GRN (Goods Receipt Note)', section: 'Raw Materials' },
    { form_key: 'weighment', form_name: 'Weighment', section: 'Raw Materials' },
    { form_key: 'purchase_bill', form_name: 'Purchase Bill', section: 'Raw Materials' },
    { form_key: 'purchase_return', form_name: 'Purchase Return', section: 'Raw Materials' },
    { form_key: 'sales_order', form_name: 'Sales Order', section: 'Raw Materials' },
    { form_key: 'sale_challan', form_name: 'Sale Challan', section: 'Raw Materials' },
    { form_key: 'sale_bill', form_name: 'Sale Bill', section: 'Raw Materials' },
    { form_key: 'sale_return', form_name: 'Sale Return', section: 'Raw Materials' },
    { form_key: 'consignment_sales', form_name: 'Consignment Sales', section: 'Raw Materials' },
    { form_key: 'stock_transfer', form_name: 'Stock Transfer', section: 'Raw Materials' },

    // Finished Goods
    { form_key: 'fg_purchase_order', form_name: 'Purchase Order', section: 'Finished Goods' },
    { form_key: 'fg_purchase_challan', form_name: 'Purchase Challan', section: 'Finished Goods' },
    { form_key: 'fg_gate_entry', form_name: 'Gatepass Entry', section: 'Finished Goods' },
    { form_key: 'fg_grn', form_name: 'GRN (Goods Receipt Note)', section: 'Finished Goods' },
    { form_key: 'fg_weighment', form_name: 'Weighment', section: 'Finished Goods' },
    { form_key: 'fg_purchase_bill', form_name: 'Purchase Bill', section: 'Finished Goods' },
    { form_key: 'fg_purchase_return', form_name: 'Purchase Return', section: 'Finished Goods' },
    { form_key: 'fg_sales_order', form_name: 'Sales Order', section: 'Finished Goods' },
    { form_key: 'fg_sale_challan', form_name: 'Sale Challan', section: 'Finished Goods' },
    { form_key: 'fg_sale_bill', form_name: 'Sale Bill', section: 'Finished Goods' },
    { form_key: 'fg_sale_return', form_name: 'Sale Return', section: 'Finished Goods' },
    { form_key: 'fg_consignment_sales', form_name: 'Consignment Sales', section: 'Finished Goods' },
    { form_key: 'fg_stock_transfer', form_name: 'Stock Transfer', section: 'Finished Goods' },
];

class UserMasterForm {
    constructor(config) {
        this.config = config;
        this.form = domUtils.getElement('#userMasterForm');
        this.alert = domUtils.getElement('#validationAlert');

        this.userIdInput = domUtils.getElement('#userId');
        this.userNameInput = domUtils.getElement('#userName');
        this.roleSelect = domUtils.getElement('#role');
        this.empidInput = domUtils.getElement('#empid');
        this.isActiveInput = domUtils.getElement('#isActive');
        this.saveBtn = domUtils.getElement('#saveUserBtn');

        this.tableBody = domUtils.getElement('#permissionsTableBody');
        this.selectAllRead = domUtils.getElement('#selectAllRead');
        this.selectAllWrite = domUtils.getElement('#selectAllWrite');
        this.selectAllDelete = domUtils.getElement('#selectAllDelete');

        this.init();
    }

    async init() {
        this.bindEvents();
        this.bindPermissionsHeaderEvents();
        this.bindPermissionsTableEvents();  // event delegation — bound once

        if (this.config.isEditMode && this.config.userId) {
            await this.loadData(this.config.userId);
        } else {
            this.renderPermissionsTable([]);
        }

        if (this.config.isViewMode) {
            this.enableViewMode();
        }
    }

    // ── Core form events ─────────────────────────────────────────────────────

    bindEvents() {
        if (this.form) {
            this.form.addEventListener('submit', async (e) => {
                e.preventDefault();
                await this.handleSubmit();
            });
        }

        // ESC key → back to list
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                window.location.href = '/settings/user-master/';
            }
        });

        // On create form, apply role defaults when role changes
        if (!this.config.isEditMode && this.roleSelect) {
            this.roleSelect.addEventListener('change', () => {
                this.applyRoleDefaults(this.roleSelect.value);
            });
        }
    }

    applyRoleDefaults(role) {
        if (role === 'Admin') {
            this.setAllPermissions(true, true, true);
        } else if (role === 'Maker') {
            this.setAllPermissions(true, true, false);
        } else if (role === 'Checker') {
            this.setAllPermissions(true, false, false);
        } else {
            this.setAllPermissions(true, false, false);
        }
    }

    setAllPermissions(read, write, del) {
        if (!this.tableBody) return;
        this.tableBody.querySelectorAll('tr.perm-row').forEach(tr => {
            const r = tr.querySelector('.perm-read');
            const w = tr.querySelector('.perm-write');
            const d = tr.querySelector('.perm-delete');
            if (r) r.checked = read;
            if (w) w.checked = write;
            if (d) d.checked = del;
        });
        this.updateHeaderCheckboxes();
    }

    // ── Permissions Table — Helpers ──────────────────────────────────────────

    /**
     * Build <option> HTML for the Section dropdown.
     * Derives unique sections in order from SYSTEM_FORMS.
     */
    buildSectionOptions(selected = '') {
        const sections = [...new Set(SYSTEM_FORMS.map(f => f.section))];
        let html = '<option value="">-- Select Section --</option>';
        sections.forEach(sec => {
            html += `<option value="${sec}" ${sec === selected ? 'selected' : ''}>${sec}</option>`;
        });
        return html;
    }

    /**
     * Build <option> HTML for the Form/Module dropdown,
     * filtered by the given section.
     */
    buildFormOptions(section = '', selectedKey = '') {
        if (!section) {
            return '<option value="">-- Select Section First --</option>';
        }
        const forms = SYSTEM_FORMS.filter(f => f.section === section);
        let html = '<option value="">-- Select Form --</option>';
        forms.forEach(f => {
            html += `<option value="${f.form_key}" ${f.form_key === selectedKey ? 'selected' : ''}>${f.form_name}</option>`;
        });
        return html;
    }

    /**
     * Build a single permissions table row HTML string.
     */
    buildPermRowHTML(rowNum, section = '', formKey = '', readChecked = false, writeChecked = false, deleteChecked = false) {
        return `
            <tr class="perm-row">
                <td class="text-center text-muted fw-semibold perm-row-num" style="font-size: 11px; padding: 3px 4px;">${rowNum}</td>
                <td style="padding: 2px 4px;">
                    <select class="form-select form-select-sm perm-section" style="font-size: 11px; min-width: 130px; height: 26px; padding: 1px 6px;">
                        ${this.buildSectionOptions(section)}
                    </select>
                </td>
                <td style="padding: 2px 4px;">
                    <select class="form-select form-select-sm perm-form" style="font-size: 11px; min-width: 185px; height: 26px; padding: 1px 6px;">
                        ${this.buildFormOptions(section, formKey)}
                    </select>
                </td>
                <td class="text-center" style="padding: 3px 4px;">
                    <input type="checkbox" class="perm-read perm-checkbox" ${readChecked ? 'checked' : ''}>
                </td>
                <td class="text-center" style="padding: 3px 4px;">
                    <input type="checkbox" class="perm-write perm-checkbox" ${writeChecked ? 'checked' : ''}>
                </td>
                <td class="text-center" style="padding: 3px 4px;">
                    <input type="checkbox" class="perm-delete perm-checkbox" ${deleteChecked ? 'checked' : ''}>
                </td>
                <td class="text-center" style="padding: 3px 4px; white-space: nowrap;">
                    <div class="d-flex align-items-center justify-content-center gap-1">
                        <button type="button" class="erp-action-btn erp-btn-add btn-perm-add" tabindex="-1" title="Add Row"
                            style="width:24px!important;height:24px!important;border-radius:5px!important;">
                            <i class="bi bi-plus-lg" style="font-size: 11px;"></i>
                        </button>
                        <button type="button" class="erp-action-btn erp-btn-delete btn-perm-delete" tabindex="-1" title="Delete Row"
                            style="width:24px!important;height:24px!important;border-radius:5px!important;">
                            <i class="bi bi-trash" style="font-size: 11px;"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }

    // ── Permissions Table — Rendering ────────────────────────────────────────

    /**
     * Render the permissions table.
     * - Empty array  → shows one blank row ready to fill
     * - With data    → one row per saved permission, dropdowns pre-selected
     */
    renderPermissionsTable(existingPermissions = []) {
        if (!this.tableBody) return;

        if (!existingPermissions || existingPermissions.length === 0) {
            // Start with one empty row
            this.tableBody.innerHTML = this.buildPermRowHTML(1);
        } else {
            let html = '';
            existingPermissions.forEach((perm, idx) => {
                html += this.buildPermRowHTML(
                    idx + 1,
                    perm.section || '',
                    perm.form_key || '',
                    perm.can_read || false,
                    perm.can_write || false,
                    perm.can_delete || false
                );
            });
            this.tableBody.innerHTML = html;
        }

        this.updateHeaderCheckboxes();

        if (this.config.isViewMode) {
            this.enableViewMode();
        }
    }

    // ── Permissions Table — Event Delegation (bound once in init) ────────────

    bindPermissionsTableEvents() {
        if (!this.tableBody) return;

        // Change events: section dropdown → refresh form dropdown;
        //                checkboxes      → sync header checkboxes
        this.tableBody.addEventListener('change', (e) => {
            const tr = e.target.closest('tr.perm-row');
            if (!tr) return;

            if (e.target.classList.contains('perm-section')) {
                const formSelect = tr.querySelector('.perm-form');
                if (formSelect) {
                    formSelect.innerHTML = this.buildFormOptions(e.target.value);
                }
            }

            if (e.target.classList.contains('perm-checkbox')) {
                this.updateHeaderCheckboxes();
            }
        });

        // Click events: + button → insert row after; 🗑 button → remove row
        this.tableBody.addEventListener('click', (e) => {
            const addBtn = e.target.closest('.btn-perm-add');
            const delBtn = e.target.closest('.btn-perm-delete');

            if (addBtn) {
                const tr = addBtn.closest('tr.perm-row');
                // Parse new row into a real <tr> element
                const tempDiv = document.createElement('div');
                tempDiv.innerHTML = `<table><tbody>${this.buildPermRowHTML(0)}</tbody></table>`;
                const newTr = tempDiv.querySelector('tr.perm-row');
                if (newTr) {
                    tr.insertAdjacentElement('afterend', newTr);
                    this.renumberRows();
                }
            }

            if (delBtn) {
                const allRows = this.tableBody.querySelectorAll('tr.perm-row');
                if (allRows.length <= 1) return;  // always keep at least 1 row
                const tr = delBtn.closest('tr.perm-row');
                if (tr) {
                    tr.remove();
                    this.renumberRows();
                    this.updateHeaderCheckboxes();
                }
            }
        });
    }

    /** Re-number the # column after add/delete */
    renumberRows() {
        this.tableBody.querySelectorAll('tr.perm-row').forEach((tr, idx) => {
            const numCell = tr.querySelector('.perm-row-num');
            if (numCell) numCell.textContent = idx + 1;
        });
    }

    // bindRowEvents kept as no-op for backward compatibility
    bindRowEvents() {}

    // ── Permissions Header "All" checkboxes ──────────────────────────────────

    bindPermissionsHeaderEvents() {
        if (this.selectAllRead) {
            this.selectAllRead.addEventListener('change', () => {
                const checked = this.selectAllRead.checked;
                this.tableBody.querySelectorAll('.perm-read').forEach(chk => {
                    chk.checked = checked;
                });
                this.updateHeaderCheckboxes();
            });
        }

        if (this.selectAllWrite) {
            this.selectAllWrite.addEventListener('change', () => {
                const checked = this.selectAllWrite.checked;
                this.tableBody.querySelectorAll('.perm-write').forEach(chk => {
                    chk.checked = checked;
                });
                this.updateHeaderCheckboxes();
            });
        }

        if (this.selectAllDelete) {
            this.selectAllDelete.addEventListener('change', () => {
                const checked = this.selectAllDelete.checked;
                this.tableBody.querySelectorAll('.perm-delete').forEach(chk => {
                    chk.checked = checked;
                });
                this.updateHeaderCheckboxes();
            });
        }
    }

    updateHeaderCheckboxes() {
        if (!this.tableBody) return;

        const readBoxes   = Array.from(this.tableBody.querySelectorAll('.perm-read'));
        const writeBoxes  = Array.from(this.tableBody.querySelectorAll('.perm-write'));
        const deleteBoxes = Array.from(this.tableBody.querySelectorAll('.perm-delete'));

        if (this.selectAllRead && readBoxes.length > 0) {
            this.selectAllRead.checked       = readBoxes.every(chk => chk.checked);
            this.selectAllRead.indeterminate = !this.selectAllRead.checked && readBoxes.some(chk => chk.checked);
        }

        if (this.selectAllWrite && writeBoxes.length > 0) {
            this.selectAllWrite.checked       = writeBoxes.every(chk => chk.checked);
            this.selectAllWrite.indeterminate = !this.selectAllWrite.checked && writeBoxes.some(chk => chk.checked);
        }

        if (this.selectAllDelete && deleteBoxes.length > 0) {
            this.selectAllDelete.checked       = deleteBoxes.every(chk => chk.checked);
            this.selectAllDelete.indeterminate = !this.selectAllDelete.checked && deleteBoxes.some(chk => chk.checked);
        }
    }

    // ── Collect permissions from dynamic rows ────────────────────────────────

    collectPermissions() {
        if (!this.tableBody) return [];

        const permissions = [];
        this.tableBody.querySelectorAll('tr.perm-row').forEach(tr => {
            const sectionEl = tr.querySelector('.perm-section');
            const formEl    = tr.querySelector('.perm-form');

            const section = sectionEl ? sectionEl.value : '';
            const formKey = formEl    ? formEl.value    : '';

            if (!section || !formKey) return;  // skip incomplete rows

            // Get form name from the selected <option>
            const selectedOption = formEl.querySelector(`option[value="${formKey}"]`);
            const formName = selectedOption ? selectedOption.textContent.trim() : formKey;

            const canRead   = tr.querySelector('.perm-read')?.checked   || false;
            const canWrite  = tr.querySelector('.perm-write')?.checked  || false;
            const canDelete = tr.querySelector('.perm-delete')?.checked || false;

            permissions.push({
                form_key: formKey,
                form_name: formName,
                section: section,
                can_read:   canRead,
                can_write:  canWrite,
                can_delete: canDelete
            });
        });

        return permissions;
    }

    // ── Load existing user data ──────────────────────────────────────────────

    async loadData(userId) {
        if (this.userIdInput) this.userIdInput.value = 'Loading...';

        try {
            const data = await UserMasterAPI.getById(userId);

            if (this.userIdInput)   this.userIdInput.value   = data.user_id;
            if (this.userNameInput) this.userNameInput.value = data.user_name;
            if (this.roleSelect)    this.roleSelect.value    = data.role || 'User';
            if (this.empidInput)    this.empidInput.value    = data.empid;
            if (this.isActiveInput) this.isActiveInput.checked = data.is_active;

            // Render permissions rows from saved data (dropdowns pre-selected)
            this.renderPermissionsTable(data.permissions || []);

            // Trigger floating label updates
            document.querySelectorAll('.form-group input, .form-group select').forEach(el => {
                el.dispatchEvent(new Event('change'));
            });
        } catch (err) {
            const errMsg = err.message || 'Failed to load user master data.';
            notifications.showError(errMsg);
            if (this.alert) {
                this.alert.innerHTML = `<i class="bi bi-exclamation-triangle-fill me-2"></i>Could not load user data. <small class="text-muted">${errMsg}</small>`;
                this.alert.classList.remove('d-none');
            }
            if (this.userIdInput) this.userIdInput.value = 'Error';
        }
    }

    // ── View mode — disable all inputs including permission dropdowns ─────────

    enableViewMode() {
        if (!this.form) return;
        this.form.querySelectorAll('input, select').forEach(el => el.disabled = true);
        // Also lock permission table dropdowns and action buttons
        if (this.tableBody) {
            this.tableBody.querySelectorAll('select, input, button').forEach(el => el.disabled = true);
        }
        if (this.saveBtn) this.saveBtn.style.display = 'none';
    }

    // ── Save / Submit ────────────────────────────────────────────────────────

    async handleSubmit() {
        if (this.alert) {
            this.alert.classList.add('d-none');
            this.alert.innerHTML = '';
        }

        const userId   = this.userIdInput.value.trim();
        const userName = this.userNameInput.value.trim();
        const role     = this.roleSelect.value;
        const empid    = this.empidInput.value.trim();
        const isActive = this.isActiveInput.checked;

        // Validation
        const errors = [];
        if (!userId)   errors.push('User ID is required.');
        if (!userName) errors.push('User Name is required.');
        if (!empid)    errors.push('Emp ID is required.');

        if (errors.length > 0) {
            this.showErrors(errors);
            return;
        }

        const permissions = this.collectPermissions();

        const payload = {
            user_id:     userId,
            user_name:   userName,
            role:        role,
            empid:       empid,
            is_active:   isActive,
            permissions: permissions
        };

        const originalBtnText = this.saveBtn ? this.saveBtn.innerHTML : '';
        if (this.saveBtn) {
            this.saveBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Saving...';
            this.saveBtn.disabled = true;
        }

        try {
            if (this.config.isEditMode) {
                await UserMasterAPI.update(this.config.userId, payload);
                notifications.showSuccess('User Master updated successfully');
            } else {
                await UserMasterAPI.create(payload);
                notifications.showSuccess('User Master created successfully');
            }

            window.location.href = '/settings/user-master/';
        } catch (err) {
            if (this.saveBtn) {
                this.saveBtn.innerHTML = originalBtnText;
                this.saveBtn.disabled = false;
            }
            let errMsg = err.message || 'An error occurred while saving.';
            if (err.responseData) {
                const responseErrors = [];
                for (const [key, value] of Object.entries(err.responseData)) {
                    const label = key === 'user_id'   ? 'User ID'   :
                                  key === 'user_name' ? 'User Name' :
                                  key === 'empid'     ? 'Emp ID'    : key;
                    responseErrors.push(`${label}: ${Array.isArray(value) ? value.join(' ') : value}`);
                }
                if (responseErrors.length > 0) {
                    errMsg = responseErrors.join('<br>');
                }
            }
            notifications.showError('Failed to save record');
            this.showErrors([errMsg]);
        }
    }

    showErrors(errorsList) {
        if (!this.alert) return;
        this.alert.innerHTML = errorsList.map(err =>
            `<div><i class="bi bi-exclamation-triangle-fill me-2"></i>${err}</div>`
        ).join('');
        this.alert.classList.remove('d-none');
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
}

function init() {
    const config = window.APP_CONFIG || { isEditMode: false, userId: null, isViewMode: false };
    new UserMasterForm(config);
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
