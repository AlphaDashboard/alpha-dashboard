import { UserMasterAPI } from '../api/user-master-api.js?v=148';
import { domUtils } from '../utils/dom.js?v=148';
import { notifications } from '../utils/notifications.js?v=148';

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

        this.init();
    }

    async init() {
        this.bindEvents();

        if (this.config.isEditMode && this.config.userId) {
            await this.loadData(this.config.userId);
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

        const payload = {
            user_id: userId,
            user_name: userName,
            role: role,
            empid: empid,
            is_active: isActive
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
