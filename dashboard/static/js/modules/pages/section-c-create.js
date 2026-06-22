import { TransactionForm } from '../transaction/section-c-form.js?v=147';

function init() {
    // APP_CONFIG is defined in the Django template script tag
    const config = window.APP_CONFIG || { isEditMode: false, voucherNo: null, isViewMode: false };

    // Set default date if create mode (skip in edit/view mode — data is loaded from API)
    if (!config.isEditMode && !config.isViewMode) {
        const now = new Date();
        const offset = now.getTimezoneOffset() * 60000;
        const localISOTime = (new Date(now - offset)).toISOString().slice(0, 16);
        document.getElementById('date').value = localISOTime;
    }

    new TransactionForm(config);
}

// Initialize safely handling module deferred execution
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
