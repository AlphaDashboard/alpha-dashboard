import { PurchaseBillAPI } from '../api/purchase-bill-api.js?v=149';
import { apiClient } from '../api/client.js?v=149';
import { domUtils } from '../utils/dom.js?v=149';
import { formatter } from '../utils/formatter.js?v=149';
import { notifications } from '../utils/notifications.js?v=149';

class PurchaseBillList {

    constructor() {
        this.tbody        = domUtils.getElement('#transactionTableBody');
        this.filterForm   = domUtils.getElement('#filterForm');
        this.searchInput  = domUtils.getElement('#searchInput');
        this.typeFilter   = domUtils.getElement('#typeFilter');
        this.clearBtn     = domUtils.getElement('#clearFiltersBtn');

        this.sortField    = '';
        this.sortOrder    = '';
        const savedPage = sessionStorage.getItem('last_page_' + window.location.pathname);
        const parsedPage = savedPage ? parseInt(savedPage, 10) : 1;
        this.currentPage  = isNaN(parsedPage) || parsedPage < 1 ? 1 : parsedPage;
        this.statusFilter = undefined;

        this.init();
    }

    async init() {
        this.bindEvents();
        await this.loadData();
    }

    bindEvents() {
        // Filter form submit
        if (this.filterForm) {
            this.filterForm.addEventListener('submit', (e) => {
                e.preventDefault();
                if (this.searchInput.value.trim() && !this.typeFilter.value) {
                    notifications.showError("Please select search field");
                    return;
                }
                this.currentPage = 1;
                this.loadData();
            });
        }

        // Status filter dropdown (Active / Inactive / All)
        const actionsMenu       = domUtils.getElement('#actionsMenu');
        const actionsLabel      = domUtils.getElement('#actionsLabel');
        const statusFilterInput = domUtils.getElement('#statusFilter');

        if (actionsMenu && statusFilterInput) {
            actionsMenu.querySelectorAll('.dropdown-item').forEach(item => {
                item.addEventListener('click', (e) => {
                    e.preventDefault();
                    const val = item.dataset.value;
                    if (val === 'active') {
                        this.statusFilter = true;
                        statusFilterInput.value = 'true';
                        if (actionsLabel) actionsLabel.textContent = 'Active';
                    } else if (val === 'inactive') {
                        this.statusFilter = false;
                        statusFilterInput.value = 'false';
                        if (actionsLabel) actionsLabel.textContent = 'Inactive';
                    } else {
                        this.statusFilter = undefined;
                        statusFilterInput.value = '';
                        if (actionsLabel) actionsLabel.textContent = 'Status';
                    }
                    this.currentPage = 1;
                    this.loadData();
                });
            });
        }

        // Clear filters
        if (this.clearBtn) {
            this.clearBtn.addEventListener('click', () => {
                this.searchInput.value = '';
                this.typeFilter.value  = '';
                const fromDate = domUtils.getElement('#fromDate');
                const toDate   = domUtils.getElement('#toDate');
                if (fromDate && fromDate._flatpickr) fromDate._flatpickr.clear();
                else if (fromDate) fromDate.value = '';
                if (toDate && toDate._flatpickr) toDate._flatpickr.clear();
                else if (toDate) toDate.value = '';
                if (statusFilterInput) statusFilterInput.value = '';
                if (actionsLabel) actionsLabel.textContent = 'Status';
                this.statusFilter = undefined;
                this.sortField    = '';
                this.sortOrder    = '';
                this.currentPage  = 1;
                this.updateSortHeadersUI();
                this.loadData();
            });
        }

        // Sortable column headers
        document.querySelectorAll('.sortable-header').forEach(th => {
            th.addEventListener('click', () => {
                const field = th.dataset.sort;
                if (this.sortField === field) {
                    if      (this.sortOrder === 'asc')  { this.sortOrder = 'desc'; }
                    else if (this.sortOrder === 'desc') { this.sortField = ''; this.sortOrder = ''; }
                    else                                { this.sortOrder = 'asc'; }
                } else {
                    this.sortField = field;
                    this.sortOrder = (field === 'date') ? 'desc' : 'asc';
                }
                this.updateSortHeadersUI();
                this.currentPage = 1;
                this.loadData();
            });
        });

        // Pagination
        domUtils.delegate('#paginationControls', 'click', '.erp-page-btn', (e, target) => {
            const page = parseInt(target.dataset.page, 10);
            if (page && page !== this.currentPage) {
                this.currentPage = page;
                this.loadData();
            }
        });

        // Delete permanently
        domUtils.delegate('body', 'click', '.delete-btn', async (e, target) => {
            e.preventDefault();
            e.stopPropagation();
            if (!confirm('Are you sure you want to PERMANENTLY delete this purchase bill? This cannot be undone.')) return;
            const id = target.dataset.id;
            try {
                await PurchaseBillAPI.delete(id);
                notifications.showSuccess('Purchase Bill permanently deleted');
                this.loadData();
            } catch (err) {
                notifications.showError('Failed to delete purchase bill');
            }
        });

        // Toggle Status (Mark Deleted / Restore)
        domUtils.delegate('body', 'click', '.toggle-status-btn', async (e, target) => {
            e.preventDefault();
            e.stopPropagation();
            const id       = target.dataset.id;
            const isActive = target.dataset.status === 'true';
            const promptMsg = isActive ? 'Are you sure you want to mark this purchase bill inactive?' : 'Are you sure you want to restore this purchase bill?';
            if (!confirm(promptMsg)) return;
            try {
                await apiClient.post(`/api/purchase-bill/${id}/toggle_status/`);
                notifications.showSuccess(isActive ? 'Purchase Bill soft-deleted successfully' : 'Purchase Bill restored successfully');
                this.loadData();
            } catch (err) {
                notifications.showError('Failed to update status');
            }
        });

        // Detached dropdown positioning
        domUtils.delegate('body', 'click', '.action-dropdown button', (e, btn) => {
            e.stopPropagation();
            const parentDropdown = btn.closest('.action-dropdown');
            const menu = parentDropdown ? parentDropdown.querySelector('.dropdown-menu') : null;
            if (!menu) return;

            const isShown = menu.classList.contains('show');
            document.querySelectorAll('.erp-detached-dropdown.show').forEach(m => m.classList.remove('show'));

            if (!isShown) {
                if (!menu.classList.contains('erp-detached-dropdown')) {
                    menu.classList.add('erp-detached-dropdown');
                    document.body.appendChild(menu);
                }

                menu.classList.add('show');
                menu.style.position = 'fixed';
                menu.style.display = 'block';

                const rect = btn.getBoundingClientRect();
                const menuHeight = menu.offsetHeight || 120;
                const viewportHeight = window.innerHeight;

                const fitsBelow = (rect.bottom + 4 + menuHeight) <= viewportHeight;
                if (fitsBelow) {
                    menu.style.top = (rect.bottom + 4) + 'px';
                    menu.style.bottom = 'auto';
                } else {
                    menu.style.top = 'auto';
                    menu.style.bottom = (viewportHeight - rect.top + 4) + 'px';
                }

                menu.style.left = 'auto';
                menu.style.right = (document.documentElement.clientWidth - rect.right) + 'px';
                menu.style.zIndex = '9999';
                btn.setAttribute('aria-expanded', 'true');
            }
        });

        if (!window._erpDropdownClickListenerAdded) {
            document.addEventListener('click', function(e) {
                if (!e.target.closest('.action-dropdown') && !e.target.closest('.erp-detached-dropdown')) {
                    document.querySelectorAll('.erp-detached-dropdown.show').forEach(m => m.classList.remove('show'));
                }
            });
            window._erpDropdownClickListenerAdded = true;
        }

        if (!window._erpDropdownEscListenerAdded) {
            document.addEventListener('keydown', function(e) {
                if (e.key === 'Escape') {
                    document.querySelectorAll('.erp-detached-dropdown.show').forEach(m => m.classList.remove('show'));
                    e.stopPropagation();
                }
            }, true);
            window._erpDropdownEscListenerAdded = true;
        }
    }

    async loadData() {
        document.querySelectorAll('.erp-detached-dropdown').forEach(el => el.remove());
        this.renderLoading();
        try {
            const params = {};

            if (this.searchInput.value) {
                if (this.typeFilter.value) {
                    params[this.typeFilter.value] = this.searchInput.value;
                }
            }

            const fromDate = domUtils.getElement('#fromDate')?.value;
            const toDate   = domUtils.getElement('#toDate')?.value;
            if (fromDate) params.date_after  = fromDate;
            if (toDate)   params.date_before = toDate;

            if (this.statusFilter !== undefined) {
                params.status = this.statusFilter;
            }

            if (this.sortField) {
                params.ordering = (this.sortOrder === 'desc') ? `-${this.sortField}` : this.sortField;
            }

            params.page = this.currentPage;

            const response = await PurchaseBillAPI.getAll(params);
            sessionStorage.setItem('last_page_' + window.location.pathname, this.currentPage);

            let purchaseBills = [];
            if (Array.isArray(response)) {
                purchaseBills = response;
                this.renderPagination(null);
            } else if (response && Array.isArray(response.results)) {
                purchaseBills = response.results;
                this.renderPagination(response);
            } else {
                this.renderPagination(null);
            }

            this.renderTable(purchaseBills);
            this.updatePaginationCounts(purchaseBills, response);

        } catch (err) {
            if (this.currentPage > 1 && (err.status === 404 || err.message?.includes('404') || err.response?.status === 404)) {
                this.currentPage--;
                await this.loadData();
                return;
            }
            console.error('Error loading Purchase Bill data:', err);
            const errStr = JSON.stringify(err, Object.getOwnPropertyNames(err));
            this.tbody.innerHTML = `
                <tr><td colspan="12" class="text-center py-5 text-danger fw-bold fs-6">
                    <i class="bi bi-exclamation-circle me-2"></i>Failed to load purchase bills: ${errStr}. Please try again.
                </td></tr>`;
            notifications.showError(`Failed to load purchase bills: ${errStr}`);
        }
    }

    renderLoading() {
        this.tbody.innerHTML = `
            <tr><td colspan="12" class="text-center py-5 bg-white">
                <div class="spinner-border spinner-border-sm text-primary" role="status">
                    <span class="visually-hidden">Loading...</span>
                </div>
                <span class="ms-2 text-muted fw-bold" style="font-size:0.85rem;">Loading purchase bills...</span>
            </td></tr>`;
    }

    updateSortHeadersUI() {
        document.querySelectorAll('.sortable-header').forEach(th => {
            const field    = th.dataset.sort;
            const iconSpan = th.querySelector('.sort-icon');
            if (this.sortField === field) {
                if (iconSpan) {
                    iconSpan.innerHTML   = (this.sortOrder === 'asc') ? ' ↑' : ' ↓';
                    iconSpan.className   = 'sort-icon text-primary fw-bold ms-1';
                }
            } else {
                if (iconSpan) {
                    iconSpan.innerHTML = ' ↕';
                    iconSpan.className = 'sort-icon text-muted ms-1';
                }
            }
        });
    }

    renderPagination(data) {
        const controls  = domUtils.getElement('#paginationControls');

        if (!data || !controls || data.total_pages <= 1) {
            if (controls) controls.innerHTML = '';
            const footer = domUtils.getElement('.list-footer');
            if (footer) footer.style.setProperty('display', 'none', 'important');
            return;
        }

        const footer = domUtils.getElement('.list-footer');
        if (footer) footer.style.setProperty('display', 'block', 'important');

        const current    = data.current     || 1;
        const totalPages = data.total_pages || 1;

        let html = '';

        if (current > 1) {
            html += `
                <li class="page-item">
                    <a class="page-link shadow-sm mt-1 mb-1 me-1 erp-page-btn" href="javascript:void(0);" data-page="${current - 1}">
                        <i class="bi bi-chevron-left"></i> Previous
                    </a>
                </li>`;
        }

        html += `
            <li class="page-item active">
                <span class="page-link shadow-sm mt-1 mb-1">${current} of ${totalPages}</span>
            </li>`;

        if (current < totalPages) {
            html += `
                <li class="page-item">
                    <a class="page-link shadow-sm mt-1 mb-1 ms-1 erp-page-btn" href="javascript:void(0);" data-page="${current + 1}">
                        Next <i class="bi bi-chevron-right"></i>
                    </a>
                </li>`;
        }

        controls.innerHTML = html;
    }

    updatePaginationCounts(purchaseBills, data) {
        const pStart = domUtils.getElement('#paginationStart');
        const pEnd   = domUtils.getElement('#paginationEnd');
        const pTotal = domUtils.getElement('#paginationTotal');
        
        if (!purchaseBills || purchaseBills.length === 0) {
            if (pStart) pStart.textContent = '0';
            if (pEnd) pEnd.textContent = '0';
            if (pTotal) pTotal.textContent = '0';
            return;
        }

        if (data && data.count) {
            const current = data.current || 1;
            const pageSize = data.page_size || 10;
            const start = ((current - 1) * pageSize) + 1;
            const end = start + purchaseBills.length - 1;
            if (pStart) pStart.textContent = start;
            if (pEnd) pEnd.textContent = end;
            if (pTotal) pTotal.textContent = data.count;
        } else {
            if (pStart) pStart.textContent = '1';
            if (pEnd) pEnd.textContent = purchaseBills.length;
            if (pTotal) pTotal.textContent = purchaseBills.length;
        }
    }

    renderTable(purchaseBills) {
        const totalDisplay = domUtils.getElement('#totalAmountDisplay');

        if (!purchaseBills || purchaseBills.length === 0) {
            this.tbody.innerHTML = `
                <tr>
                    <td colspan="12" class="text-center py-5 bg-white border-0">
                        <div class="empty-state py-5 fade-in-up" style="animation-delay: 0.2s;">
                            <div class="p-4 bg-light rounded-circle d-inline-block mb-4 shadow-sm">
                                <i class="bi bi-receipt display-3 text-primary" style="opacity: 0.8;"></i>
                            </div>
                            <h3 class="fw-bold text-dark">No purchase bills found</h3>
                            <p class="text-muted mb-4 fs-5">You have not created any purchase bills yet, or none match your search criteria.</p>
                            <a href="/purchase-bill/create/" class="btn btn-primary btn-lg shadow-sm hover-lift px-5 rounded-pill">
                                <i class="bi bi-plus-lg me-2"></i>Create New Purchase Bill
                            </a>
                        </div>
                    </td>
                </tr>`;
            if (totalDisplay) totalDisplay.textContent = '₹ ' + formatter.formatCurrency(0);
            return;
        }

        const total = purchaseBills.reduce((sum, t) => sum + parseFloat(t.grand_total || 0), 0);
        if (totalDisplay) totalDisplay.textContent = '₹ ' + formatter.formatCurrency(total);

        const BILL_STATUS_BADGE = {
            'Draft':     '<span class="badge" style="font-size:0.72rem;background-color:#f3f4f6;color:#374151;border:1px solid #d1d5db;border-radius:4px;padding:3px 8px;">Draft</span>',
            'Submitted': '<span class="badge" style="font-size:0.72rem;background-color:#eff6ff;color:#1d4ed8;border:1px solid #bfdbfe;border-radius:4px;padding:3px 8px;">Submitted</span>',
            'RefBack':   '<span class="badge" style="font-size:0.72rem;background-color:#fff7ed;color:#c2410c;border:1px solid #fed7aa;border-radius:4px;padding:3px 8px;">Ref. Back</span>',
            'Approved':  '<span class="badge" style="font-size:0.72rem;background-color:#f0fdf4;color:#15803d;border:1px solid #bbf7d0;border-radius:4px;padding:3px 8px;">Approved</span>',
        };

        const EDIT_LOCKED   = ['Submitted', 'Approved'];
        const DELETE_LOCKED = ['Submitted', 'Approved'];

        let rowsHtml = purchaseBills.map(t => {
            const isActive    = !!t.status;
            const billStatus  = t.bill_status || 'Draft';
            const rowClass    = isActive ? '' : 'table-danger text-muted';
            const statusBadge = isActive
                ? `<span class="badge bg-success bg-opacity-10 text-success border border-success border-opacity-25 rounded-pill px-3">Active</span>`
                : `<span class="badge bg-danger bg-opacity-10 text-danger border border-danger border-opacity-25 rounded-pill px-3">Inactive</span>`;

            const billStatusBadge = BILL_STATUS_BADGE[billStatus] ||
                `<span class="badge" style="font-size:0.72rem;background:#f3f4f6;color:#374151;border:1px solid #d1d5db;border-radius:4px;padding:3px 8px;">${billStatus}</span>`;

            const userRole = window.APP_CONFIG?.userRole;
            const isApprover = (userRole === 'Checker' || userRole === 'Admin');
            const editLocked   = EDIT_LOCKED.includes(billStatus) && !isApprover;
            const deleteLocked = DELETE_LOCKED.includes(billStatus);

            let actionItemsHtml = `
                    <li>
                        <a class="dropdown-item" href="/purchase-bill/${t.bill_no}/edit/?mode=view">
                            <i class="bi bi-eye me-2 text-secondary"></i> View
                        </a>
                    </li>`;

            if (isActive) {
                if (!editLocked) {
                    actionItemsHtml += `
                    <li>
                        <a class="dropdown-item" href="/purchase-bill/${t.bill_no}/edit/">
                            <i class="bi bi-pencil-square me-2 text-primary"></i> Edit
                        </a>
                    </li>`;
                }

                if (!deleteLocked) {
                    actionItemsHtml += `
                    <li>
                        <button class="dropdown-item text-warning toggle-status-btn"
                            data-id="${t.bill_no}"
                            data-status="true"
                            type="button">
                            <i class="bi bi-x-circle me-2"></i> Mark Deleted
                        </button>
                    </li>`;
                } else {
                    const lockReason = billStatus === 'Approved' ? 'Bill is Approved' : 'Bill is Submitted for Approval';
                    actionItemsHtml += `
                    <li>
                        <span class="dropdown-item text-muted" style="cursor:not-allowed;opacity:0.55;" title="Cannot delete: ${lockReason}">
                            <i class="bi bi-lock me-2"></i> Mark Deleted (Locked)
                        </span>
                    </li>`;
                }
            } else {
                actionItemsHtml += `
                    <li>
                        <button class="dropdown-item text-warning toggle-status-btn"
                            data-id="${t.bill_no}"
                            data-status="false"
                            type="button">
                            <i class="bi bi-arrow-counterclockwise me-2"></i> Restore
                        </button>
                    </li>`;

                if (!deleteLocked) {
                    actionItemsHtml += `
                    <li><hr class="dropdown-divider"></li>
                    <li>
                        <button class="dropdown-item text-danger delete-btn"
                            data-id="${t.bill_no}"
                            type="button">
                            <i class="bi bi-trash3 me-2"></i> Delete
                        </button>
                    </li>`;
                } else {
                    const lockReason = billStatus === 'Approved' ? 'Bill is Approved' : 'Bill is Submitted for Approval';
                    actionItemsHtml += `
                    <li><hr class="dropdown-divider"></li>
                    <li>
                        <span class="dropdown-item text-muted" style="cursor:not-allowed;opacity:0.55;" title="Cannot delete: ${lockReason}">
                            <i class="bi bi-lock me-2"></i> Delete (Locked)
                        </span>
                    </li>`;
                }
            }

            return `
                <tr class="align-middle ${rowClass}" data-row-id="${t.bill_no}">
                    <td class="ps-3 fw-bold text-primary" style="font-size:0.85rem;">${t.bill_no}</td>
                    <td style="font-size:0.85rem;">${formatter.formatDate(t.bill_date)}</td>
                    <td style="font-size:0.85rem;">${t.po_no || '-'}</td>
                    <td style="font-size:0.85rem;">${t.gate_pass_no || '-'}</td>
                    <td class="text-center">${billStatusBadge}</td>
                    <td class="text-dark" style="font-size:0.85rem;">
                        ${t.supplier_display ? t.supplier_display.text : '-'}
                    </td>
                    <td style="font-size:0.85rem;">${t.zone_name || '-'}</td>
                    <td style="font-size:0.85rem;">${t.broker_display ? t.broker_display.text : '-'}</td>
                    <td style="font-size:0.85rem;">${t.supplier_contact || '-'}</td>
                    <td class="fw-semibold text-end text-dark pe-3" style="font-size:0.85rem;">
                        ${formatter.formatCurrency(t.grand_total)}
                    </td>
                    <td class="text-center">${statusBadge}</td>
                    <td class="text-center">
                        <div class="dropdown action-dropdown">
                            <button
                                class="btn btn-light btn-sm hide-caret"
                                type="button" aria-expanded="false"
                                style="width:26px; height:26px; padding:0; display:inline-flex; align-items:center; justify-content:center; border:1px solid #e5e7eb; background:#fff; color:#374151; border-radius:4px;">
                                <i class="bi bi-three-dots-vertical" style="font-size:14px; transform: translateX(2px);"></i>
                            </button>
                            <ul class="dropdown-menu dropdown-menu-end shadow-sm" style="font-size:13px; min-width: 160px; z-index: 1050; margin-top:2px;">
                                ${actionItemsHtml}
                            </ul>
                        </div>
                    </td>
                </tr>`;
        }).join('');

        this.tbody.innerHTML = rowsHtml;
        if (window.erpRowRestore) {
            window.erpRowRestore.restore();
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new PurchaseBillList();
});
