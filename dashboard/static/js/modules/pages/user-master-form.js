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

        if (this.config.isEditMode && this.config.userId) {
            await this.loadData(this.config.userId);
        } else {
            this.renderPermissionsTable([]);
        }

        if (this.config.isViewMode) {
            this.enableViewMode();
        }
    }

    bindEvents() {
        if (this.form) {
            this.form.addEventListener('submit', async (e) => {
                e.preventDefault();
                await this.handleSubmit();
            });
        }

        // Global ESC key listener to cancel and return to listing page
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                window.location.href = '/settings/user-master/';
            }
        });

        // If user changes role on create form, auto-suggest permissions
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
        this.tableBody.querySelectorAll('tr[data-form-key]').forEach(tr => {
            const r = tr.querySelector('.perm-read');
            const w = tr.querySelector('.perm-write');
            const d = tr.querySelector('.perm-delete');

            if (r) r.checked = read;
            if (w) w.checked = write;
            if (d) d.checked = del;
        });
        this.updateHeaderCheckboxes();
    }

    renderPermissionsTable(existingPermissions = []) {
        if (!this.tableBody) return;

        const permMap = {};
        if (Array.isArray(existingPermissions)) {
            existingPermissions.forEach(p => {
                permMap[p.form_key] = p;
            });
        }

        let html = '';
        SYSTEM_FORMS.forEach((form, idx) => {
            const perm = permMap[form.form_key] || {
                can_read: false,
                can_write: false,
                can_delete: false
            };

            const sectionBadgeClass = form.section === 'Master' ? 'bg-primary-subtle text-primary border border-primary-subtle' :
                (form.section === 'Transactions' ? 'bg-success-subtle text-success border border-success-subtle' :
                'bg-info-subtle text-info border border-info-subtle');

            html += `
                <tr data-form-key="${form.form_key}" data-form-name="${form.form_name}" data-section="${form.section}">
                    <td class="text-center text-muted fw-semibold" style="font-size: 11px;">${idx + 1}</td>
                    <td>
                        <span class="badge ${sectionBadgeClass}" style="font-size: 10px; font-weight: 600;">
                            ${form.section}
                        </span>
                    </td>
                    <td class="fw-semibold text-dark">${form.form_name}</td>
                    <td class="text-center">
                        <input type="checkbox" class="perm-read perm-checkbox" ${perm.can_read ? 'checked' : ''} title="Read">
                    </td>
                    <td class="text-center">
                        <input type="checkbox" class="perm-write perm-checkbox" ${perm.can_write ? 'checked' : ''} title="Write">
                    </td>
                    <td class="text-center">
                        <input type="checkbox" class="perm-delete perm-checkbox" ${perm.can_delete ? 'checked' : ''} title="Delete">
                    </td>
                </tr>
            `;
        });

        this.tableBody.innerHTML = html;
        this.bindRowEvents();
        this.updateHeaderCheckboxes();

        if (this.config.isViewMode) {
            this.enableViewMode();
        }
    }

    bindRowEvents() {
        if (!this.tableBody) return;

        this.tableBody.querySelectorAll('tr[data-form-key]').forEach(tr => {
            const r = tr.querySelector('.perm-read');
            const w = tr.querySelector('.perm-write');
            const d = tr.querySelector('.perm-delete');

            // Individual checkboxes update column headers
            [r, w, d].forEach(chk => {
                if (chk) {
                    chk.addEventListener('change', () => {
                        this.updateHeaderCheckboxes();
                    });
                }
            });
        });
    }

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

        const readBoxes = Array.from(this.tableBody.querySelectorAll('.perm-read'));
        const writeBoxes = Array.from(this.tableBody.querySelectorAll('.perm-write'));
        const deleteBoxes = Array.from(this.tableBody.querySelectorAll('.perm-delete'));

        if (this.selectAllRead && readBoxes.length > 0) {
            this.selectAllRead.checked = readBoxes.every(chk => chk.checked);
            this.selectAllRead.indeterminate = !this.selectAllRead.checked && readBoxes.some(chk => chk.checked);
        }

        if (this.selectAllWrite && writeBoxes.length > 0) {
            this.selectAllWrite.checked = writeBoxes.every(chk => chk.checked);
            this.selectAllWrite.indeterminate = !this.selectAllWrite.checked && writeBoxes.some(chk => chk.checked);
        }

        if (this.selectAllDelete && deleteBoxes.length > 0) {
            this.selectAllDelete.checked = deleteBoxes.every(chk => chk.checked);
            this.selectAllDelete.indeterminate = !this.selectAllDelete.checked && deleteBoxes.some(chk => chk.checked);
        }
    }

    collectPermissions() {
        if (!this.tableBody) return [];

        const permissions = [];
        this.tableBody.querySelectorAll('tr[data-form-key]').forEach(tr => {
            const formKey = tr.getAttribute('data-form-key');
            const formName = tr.getAttribute('data-form-name');
            const section = tr.getAttribute('data-section');
            const canRead = tr.querySelector('.perm-read')?.checked || false;
            const canWrite = tr.querySelector('.perm-write')?.checked || false;
            const canDelete = tr.querySelector('.perm-delete')?.checked || false;

            permissions.push({
                form_key: formKey,
                form_name: formName,
                section: section,
                can_read: canRead,
                can_write: canWrite,
                can_delete: canDelete
            });
        });

        return permissions;
    }

    async loadData(userId) {
        if (this.userIdInput) this.userIdInput.value = 'Loading...';

        try {
            const data = await UserMasterAPI.getById(userId);

            if (this.userIdInput) this.userIdInput.value = data.user_id;
            if (this.userNameInput) this.userNameInput.value = data.user_name;
            if (this.roleSelect) this.roleSelect.value = data.role || 'User';
            if (this.empidInput) this.empidInput.value = data.empid;
            if (this.isActiveInput) this.isActiveInput.checked = data.is_active;

            // Render Permissions Table with user permissions
            this.renderPermissionsTable(data.permissions || []);

            // Trigger floating labels updates
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

    enableViewMode() {
        if (!this.form) return;
        this.form.querySelectorAll('input, select').forEach(el => el.disabled = true);
        if (this.saveBtn) this.saveBtn.style.display = 'none';
    }

    async handleSubmit() {
        if (this.alert) {
            this.alert.classList.add('d-none');
            this.alert.innerHTML = '';
        }

        const userId = this.userIdInput.value.trim();
        const userName = this.userNameInput.value.trim();
        const role = this.roleSelect.value;
        const empid = this.empidInput.value.trim();
        const isActive = this.isActiveInput.checked;

        // Simple validation
        const errors = [];
        if (!userId) errors.push('User ID is required.');
        if (!userName) errors.push('User Name is required.');
        if (!empid) errors.push('Emp ID is required.');

        if (errors.length > 0) {
            this.showErrors(errors);
            return;
        }

        const permissions = this.collectPermissions();

        const payload = {
            user_id: userId,
            user_name: userName,
            role: role,
            empid: empid,
            is_active: isActive,
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

            // Redirect back to list
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
                    const label = key === 'user_id' ? 'User ID' : (key === 'user_name' ? 'User Name' : (key === 'empid' ? 'Emp ID' : key));
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
        this.alert.innerHTML = errorsList.map(err => `<div><i class="bi bi-exclamation-triangle-fill me-2"></i>${err}</div>`).join('');
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
