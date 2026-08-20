export const notifications = {
    showToast(message, type = 'success') {
        let container = document.querySelector('.toast-container');
        if (!container) {
            container = document.createElement('div');
            container.className = 'toast-container position-fixed bottom-0 end-0 p-3';
            container.style.zIndex = '1060';
            document.body.appendChild(container);
        }
        
        const isError = type === 'error' || type === 'danger';
        const bgClass = isError ? 'bg-danger' : 'bg-success';
        const iconClass = isError ? 'bi-x-circle-fill' : 'bi-check-circle-fill';
        
        const toastId = 'toast-' + Date.now();
        const toastHTML = `
            <div id="${toastId}" class="toast align-items-center text-white ${bgClass} border-0 mb-2 shadow-lg" role="alert" aria-live="assertive" aria-atomic="true">
                <div class="d-flex">
                    <div class="toast-body fw-bold d-flex align-items-center">
                        <i class="bi ${iconClass} me-2 fs-5"></i>
                        ${message}
                    </div>
                    <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>
                </div>
            </div>
        `;
        container.insertAdjacentHTML('beforeend', toastHTML);
        const toastEl = document.getElementById(toastId);
        
        if (typeof bootstrap !== 'undefined') {
            const bsToast = new bootstrap.Toast(toastEl, { delay: 3000 });
            bsToast.show();
            
            toastEl.addEventListener('hidden.bs.toast', function () {
                toastEl.remove();
            });
        }
    },
    
    showError(message) {
        this.showToast(message, 'error');
    },
    
    showSuccess(message) {
        this.showToast(message, 'success');
    },

    error(message) {
        this.showError(message);
    },

    success(message) {
        this.showSuccess(message);
    }
};
