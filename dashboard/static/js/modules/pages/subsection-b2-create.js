import { SubsectionB2Form } from '../transaction/subsection-b2-form.js?v=147';

function init() {
    // APP_CONFIG is defined in the Django template script tag
    const config = window.APP_CONFIG || { isEditMode: false, voucherNo: null };

    // Set default date if create mode
    if (!config.isEditMode) {
        const now = new Date();
        const offset = now.getTimezoneOffset() * 60000;
        const localISOTime = (new Date(now - offset)).toISOString().slice(0, 16);
        const dateInput = document.getElementById('date');
        if (dateInput) {
            dateInput.value = localISOTime;
        }
    }

    new SubsectionB2Form(config);
}

// Initialize safely handling module deferred execution
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
