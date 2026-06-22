import { SubsectionYAPI } from '../api/subsection-y-api.js?v=148';
import { apiClient } from '../api/client.js?v=148';
import { domUtils } from '../utils/dom.js?v=148';
import { formatter } from '../utils/formatter.js?v=148';
import { notifications } from '../utils/notifications.js?v=148';

class SubsectionYList {

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
                this.sortField    = '';
                this.sortOrder    = '';
                this.currentPage  = 1;
                this.updateSortHeadersUI();
                this.loadData();
            });
        }

        document.querySelectorAll('.sortable-header').forEach(th => {
            th.addEventListener('click', () => {
                const field = th.dataset.sort;
                if (this.sortField === field) {
                    if      (this.sortOrder === 'asc')  { this.sortOrder = 'desc'; }
                    else if (this.sortOrder === 'desc') { this.sortField = ''; this.sortOrder = ''; }
                    else                                { this.sortOrder = 'asc'; }
                } else {
                    this.sortField = field;
                    this.sortOrder = (field === 'VoucherDate' || field === 'OrderDate') ? 'desc' : 'asc';
                }
                this.updateSortHeadersUI();
                this.currentPage = 1;
                this.loadData();
            });
        });

        domUtils.delegate('#paginationControls', 'click', '.erp-page-btn', (e, target) => {
            const page = parseInt(target.dataset.page, 10);
            if (page && page !== this.currentPage) {
                this.currentPage = page;
                this.loadData();
            }
        });

        domUtils.delegate('body', 'click', '.delete-btn', async (e, target) => {
            e.preventDefault();
            e.stopPropagation();
            if (!confirm('Are you sure you want to PERMANENTLY delete this purchase record? This cannot be undone.')) return;
            const id = target.dataset.id;
            try {
                await SubsectionYAPI.delete(id);
                notifications.showSuccess('Purchase record permanently deleted');
                this.loadData();
            } catch (err) {
                notifications.showError('Failed to delete purchase record');
            }
        });

        // Detached dropdowns handler to prevent viewport clipping
        domUtils.delegate('#transactionTableBody', 'click', '.action-dropdown button', function(e, target) {
            e.preventDefault();
            e.stopPropagation();
            
            const btn = this;
            let menu;
            
            if (btn.dataset.menuId) {
                menu = document.getElementById(btn.dataset.menuId);
            } else {
                menu = btn.nextElementSibling;
                if (!menu || !menu.classList.contains('dropdown-menu')) return;
                
                const menuId = 'erp-dropdown-' + Math.random().toString(36).substr(2, 9);
                btn.dataset.menuId = menuId;
                menu.id = menuId;
                menu.classList.add('erp-detached-dropdown');
                document.body.appendChild(menu);
            }
            
            if (!menu) return;

            document.querySelectorAll('.erp-detached-dropdown.show').forEach(m => {
                if (m !== menu) m.classList.remove('show');
            });

            if (menu.classList.contains('show')) {
                menu.classList.remove('show');
                btn.setAttribute('aria-expanded', 'false');
            } else {
                menu.style.position = 'fixed';
                menu.style.visibility = 'hidden';
                menu.classList.add('show');
                const menuHeight = menu.offsetHeight;
                menu.style.visibility = '';
                
                const rect = btn.getBoundingClientRect();
                const viewportHeight = window.innerHeight || document.documentElement.clientHeight;
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
                    document.querySelectorAll('.erp-detached-dropdown.show').forEach(m => {
                        m.classList.remove('show');
                    });
                }
            });
            window._erpDropdownClickListenerAdded = true;
        }

        if (!window._erpDropdownEscListenerAdded) {
            document.addEventListener('keydown', function(e) {
                if (e.key === 'Escape') {
                    const openDropdowns = document.querySelectorAll('.erp-detached-dropdown.show');
                    if (openDropdowns.length > 0) {
                        openDropdowns.forEach(m => {
                            m.classList.remove('show');
                        });
                        e.stopPropagation();
                    }
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

            if (this.searchInput.value && this.typeFilter.value) {
                params[this.typeFilter.value] = this.searchInput.value;
            }

            const fromDate = domUtils.getElement('#fromDate')?.value;
            const toDate   = domUtils.getElement('#toDate')?.value;
            if (fromDate) params.date_after  = fromDate;
            if (toDate)   params.date_before = toDate;

            if (this.sortField) {
                params.ordering = (this.sortOrder === 'desc') ? `-${this.sortField}` : this.sortField;
            }

            params.page = this.currentPage;

            const response = await SubsectionYAPI.getAll(params);
            sessionStorage.setItem('last_page_' + window.location.pathname, this.currentPage);

            let transactions = [];
            if (Array.isArray(response)) {
                transactions = response;
                this.renderPagination(null);
            } else if (response && Array.isArray(response.results)) {
                transactions = response.results;
                this.renderPagination(response);
            } else {
                this.renderPagination(null);
            }

            this.renderTable(transactions);
            this.updatePaginationCounts(transactions, response);

        } catch (err) {
            if (this.currentPage > 1 && (err.status === 404 || err.message?.includes('404'))) {
                this.currentPage--;
                await this.loadData();
                return;
            }
            this.tbody.innerHTML = `
                <tr><td colspan="9" class="text-center py-5 text-danger fw-bold fs-6">
                    <i class="bi bi-exclamation-circle me-2"></i>Failed to load transactions. Please try again.
                </td></tr>`;
            notifications.showError('Failed to load transactions');
        }
    }

    renderLoading() {
        this.tbody.innerHTML = `
            <tr><td colspan="9" class="text-center py-5 bg-white">
                <div class="spinner-border spinner-border-sm text-primary" role="status">
                    <span class="visually-hidden">Loading...</span>
                </div>
                <span class="ms-2 text-muted fw-bold" style="font-size:0.85rem;">Loading transactions...</span>
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
            return;
        }

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

    updatePaginationCounts(transactions, data) {
        const pStart = domUtils.getElement('#paginationStart');
        const pEnd   = domUtils.getElement('#paginationEnd');
        const pTotal = domUtils.getElement('#paginationTotal');
        
        if (!transactions || transactions.length === 0) {
            if (pStart) pStart.textContent = '0';
            if (pEnd) pEnd.textContent = '0';
            if (pTotal) pTotal.textContent = '0';
            return;
        }

        if (data && data.count) {
            const current = data.current || 1;
            const pageSize = data.page_size || 10;
            const start = ((current - 1) * pageSize) + 1;
            const end = start + transactions.length - 1;
            if (pStart) pStart.textContent = start;
            if (pEnd) pEnd.textContent = end;
            if (pTotal) pTotal.textContent = data.count;
        } else {
            if (pStart) pStart.textContent = '1';
            if (pEnd) pEnd.textContent = transactions.length;
            if (pTotal) pTotal.textContent = transactions.length;
        }
    }

    renderTable(transactions) {
        const totalDisplay = domUtils.getElement('#totalAmountDisplay');
        let totalSum = 0;

        if (!transactions || transactions.length === 0) {
            if (totalDisplay) {
                totalDisplay.closest('.erp-list-footer-fixed').style.display = 'none';
            }
            this.tbody.innerHTML = `
                <tr>
                    <td colspan="9" class="text-center py-5 bg-white border-0">
                        <div class="empty-state py-5 fade-in-up" style="animation-delay: 0.2s;">
                            <div class="p-4 bg-light rounded-circle d-inline-block mb-4 shadow-sm">
                                <i class="bi bi-mailbox2 display-3 text-primary" style="opacity: 0.8;"></i>
                            </div>
                            <h3 class="fw-bold text-dark">No Purchase Records found</h3>
                            <a href="/subsection-y/create/" class="btn btn-primary btn-lg shadow-sm hover-lift px-5 rounded-pill">
                                <i class="bi bi-plus-lg me-2"></i>Create New
                            </a>
                        </div>
                    </td>
                </tr>`;
            return;
        }

        let rowsHtml = transactions.map(t => {
            // Calculate grand total from details sum
            const grandTotal = t.items ? t.items.reduce((sum, item) => sum + parseFloat(item.Total || 0), 0) : 0;
            totalSum += grandTotal;

            let actionItemsHtml = `
                    <li>
                        <a class="dropdown-item" href="/subsection-y/${t.OrderNo}/edit/?mode=view">
                            <i class="bi bi-eye me-2 text-secondary"></i> View
                        </a>
                    </li>
                    <li>
                        <a class="dropdown-item" href="/subsection-y/${t.OrderNo}/edit/">
                            <i class="bi bi-pencil-square me-2 text-primary"></i> Edit
                        </a>
                    </li>
                    <li><hr class="dropdown-divider"></li>
                    <li>
                        <button class="dropdown-item text-danger delete-btn"
                            data-id="${t.OrderNo}"
                            type="button">
                            <i class="bi bi-trash3 me-2"></i> Delete
                        </button>
                    </li>`;

            return `
                <tr class="align-middle" data-row-id="${t.OrderNo}">
                    <td class="ps-3 fw-bold text-primary" style="font-size:0.85rem;">${t.VoucherNo}</td>
                    <td style="font-size:0.85rem;">${formatter.formatDate(t.VoucherDate)}</td>
                    <td class="fw-semibold" style="font-size:0.85rem;">${t.OrderNo}</td>
                    <td style="font-size:0.85rem;">${formatter.formatDate(t.OrderDate)}</td>
                    <td>
                        <span class="text-truncate d-inline-block text-muted" style="max-width:100%; font-size:0.85rem;">
                            ${t.purchase_group_display ? t.purchase_group_display.text : '-'}
                        </span>
                    </td>
                    <td class="text-dark" style="font-size:0.85rem;">
                        ${t.party_display ? t.party_display.text : '-'}
                    </td>
                    <td class="text-muted" style="font-size:0.85rem;">
                        ${t.broker_display ? t.broker_display.text : '-'}
                    </td>
                    <td class="text-end fw-bold text-dark pe-3" style="font-size:0.85rem;">
                        ${formatter.formatCurrency(grandTotal)}
                    </td>
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

        if (totalDisplay) {
            totalDisplay.textContent = formatter.formatCurrency(totalSum);
            totalDisplay.closest('.erp-list-footer-fixed').style.display = 'block';
        }

        if (window.erpRowRestore) {
            window.erpRowRestore.restore();
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new SubsectionYList();
});
