import { BankTransactionAPI } from '../api/bank-transaction-api.js?v=147';
import { apiClient } from '../api/client.js?v=147';
import { domUtils } from '../utils/dom.js?v=147';
import { formatter } from '../utils/formatter.js?v=147';
import { notifications } from '../utils/notifications.js?v=147';

// ─────────────────────────────────────────────────────────────────────────────
// BankTransactionList — Architecture mirrors Voucher module exactly.
//
// EVENT RULES (same as Voucher):
//   • NO onclick on <tr> rows — rows do nothing when clicked
//   • NO inline onclick anywhere in rendered HTML
//   • ALL row actions (View, Edit, Delete, Restore) live inside the Actions dropdown
//   • ALL action listeners are delegated on the static #transactionTableBody
//   • Delegated listeners survive every AJAX re-render automatically
// ─────────────────────────────────────────────────────────────────────────────

class BankTransactionList {

    constructor() {
        this.tbody        = domUtils.getElement('#transactionTableBody');
        this.filterForm   = domUtils.getElement('#filterForm');
        this.searchInput  = domUtils.getElement('#searchInput');
        this.typeFilter   = domUtils.getElement('#typeFilter');
        this.clearBtn     = domUtils.getElement('#clearFiltersBtn');

        // ── State ─────────────────────────────────────────────────────────────
        this.sortField    = '';
        this.sortOrder    = '';
        const savedPage = sessionStorage.getItem('last_page_' + window.location.pathname);
        const parsedPage = savedPage ? parseInt(savedPage, 10) : 1;
        this.currentPage  = isNaN(parsedPage) || parsedPage < 1 ? 1 : parsedPage;
        this.statusFilter = undefined;  // undefined = no filter

        this.init();
    }

    // ─── Bootstrap ────────────────────────────────────────────────────────────

    async init() {
        this.bindEvents();
        await this.loadData();
    }

    // ─── Event Binding ────────────────────────────────────────────────────────
    // Bound once on DOMContentLoaded. Delegated listeners handle all dynamically
    // rendered rows automatically — no re-binding needed after AJAX reloads.

    bindEvents() {

        // ── Filter form submit ──────────────────────────────────────────────
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

        // ── Status filter dropdown (Active / Inactive / All) ────────────────
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
                        if (actionsLabel) actionsLabel.textContent = 'Actions';
                    }
                    this.currentPage = 1;
                    this.loadData();
                });
            });
        }

        // ── Clear filters ────────────────────────────────────────────────────
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
                if (actionsLabel) actionsLabel.textContent = 'Actions';
                this.statusFilter = undefined;
                this.sortField    = '';
                this.sortOrder    = '';
                this.currentPage  = 1;
                this.updateSortHeadersUI();
                this.loadData();
            });
        }

        // ── Sortable column headers ──────────────────────────────────────────
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

        // ── Pagination ───────────────────────────────────────────────────────
        // Delegated on the static pagination container — survives re-renders.
        domUtils.delegate('#paginationControls', 'click', '.erp-page-btn', (e, target) => {
            const page = parseInt(target.dataset.page, 10);
            if (page && page !== this.currentPage) {
                this.currentPage = page;
                this.loadData();
            }
        });

        // ── Row-level action: Delete ─────────────────────────────────────────
        // Delegated on body — required because dropdowns are now detached to body
        domUtils.delegate('body', 'click', '.delete-btn', async (e, target) => {
            e.preventDefault();
            e.stopPropagation();
            if (!confirm('Are you sure you want to PERMANENTLY delete this transaction? This cannot be undone.')) return;
            const id = target.dataset.id;
            try {
                await BankTransactionAPI.delete(id);
                notifications.showSuccess('Transaction permanently deleted');
                this.loadData();
            } catch (err) {
                notifications.showError('Failed to delete transaction');
            }
        });

        // ── Row-level action: Toggle Status (Mark Deleted / Restore) ─────────
        // Delegated on body — required because dropdowns are now detached to body
        domUtils.delegate('body', 'click', '.toggle-status-btn', async (e, target) => {
            e.preventDefault();
            e.stopPropagation();
            const id       = target.dataset.id;
            const isActive = target.dataset.status === 'true';
            const promptMsg = isActive ? 'Are you sure you want to mark this transaction deleted?' : 'Are you sure you want to restore this transaction?';
            const toastMsg  = isActive ? 'Transaction soft-deleted successfully' : 'Transaction restored successfully';
            if (!confirm(promptMsg)) return;
            try {
                await apiClient.post(`/api/bank-transactions/${id}/toggle_status/`);
                notifications.showSuccess(toastMsg);
                this.loadData();
            } catch (err) {
                notifications.showError(err.message || 'Error updating status');
            }
        });

        // ── Detached Dropdown Toggler (Escapes Table Overflow Clipping) ────────
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

            // Close all other detached dropdowns
            document.querySelectorAll('.erp-detached-dropdown.show').forEach(m => {
                if (m !== menu) m.classList.remove('show');
            });

            // Toggle current
            if (menu.classList.contains('show')) {
                menu.classList.remove('show');
                btn.setAttribute('aria-expanded', 'false');
            } else {
                // Calculate position relative to viewport
                // Temporarily show with hidden visibility to measure its height
                menu.style.position = 'fixed';
                menu.style.visibility = 'hidden';
                menu.classList.add('show');
                const menuHeight = menu.offsetHeight;
                menu.style.visibility = '';
                
                // Calculate position relative to viewport
                const rect = btn.getBoundingClientRect();
                const viewportHeight = window.innerHeight || document.documentElement.clientHeight;
                
                // Check if it fits below the button
                const fitsBelow = (rect.bottom + 4 + menuHeight) <= viewportHeight;
                
                if (fitsBelow) {
                    menu.style.top = (rect.bottom + 4) + 'px';
                    menu.style.bottom = 'auto';
                } else {
                    menu.style.top = 'auto';
                    menu.style.bottom = (viewportHeight - rect.top + 4) + 'px';
                }
                
                // Align to right edge of button
                menu.style.left = 'auto';
                menu.style.right = (document.documentElement.clientWidth - rect.right) + 'px';
                menu.style.zIndex = '9999';
                
                btn.setAttribute('aria-expanded', 'true');
            }
        });

        // Close detached dropdowns on outside click
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

    // ─── Data Loading ─────────────────────────────────────────────────────────

    async loadData() {
        // Clean up detached dropdowns to prevent memory leaks during AJAX re-render
        document.querySelectorAll('.erp-detached-dropdown').forEach(el => el.remove());

        this.renderLoading();
        try {
            const params = {};

            // Search field mapping
            if (this.searchInput.value) {
                if (this.typeFilter.value) {
                    params[this.typeFilter.value] = this.searchInput.value;
                }
            }

            // Date range
            const fromDate = domUtils.getElement('#fromDate')?.value;
            const toDate   = domUtils.getElement('#toDate')?.value;
            if (fromDate) params.date_after  = fromDate;
            if (toDate)   params.date_before = toDate;

            // Status filter
            if (this.statusFilter !== undefined) {
                params.status = this.statusFilter;
            }

            // Ordering
            if (this.sortField) {
                params.ordering = (this.sortOrder === 'desc') ? `-${this.sortField}` : this.sortField;
            }

            // Pagination
            params.page = this.currentPage;

            const response = await BankTransactionAPI.getAll(params);
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
            if (this.currentPage > 1 && (err.status === 404 || err.message?.includes('404') || err.response?.status === 404)) {
                this.currentPage--;
                await this.loadData();
                return;
            }
            this.tbody.innerHTML = `
                <tr><td colspan="8" class="text-center py-5 text-danger fw-bold fs-6">
                    <i class="bi bi-exclamation-circle me-2"></i>Failed to load transactions. Please try again.
                </td></tr>`;
            notifications.showError('Failed to load transactions');
        }
    }

    // ─── Render: Loading Spinner ──────────────────────────────────────────────

    renderLoading() {
        this.tbody.innerHTML = `
            <tr><td colspan="8" class="text-center py-5 bg-white">
                <div class="spinner-border spinner-border-sm text-primary" role="status">
                    <span class="visually-hidden">Loading...</span>
                </div>
                <span class="ms-2 text-muted fw-bold" style="font-size:0.85rem;">Loading transactions...</span>
            </td></tr>`;
    }

    // ─── Render: Sort Header Icons ────────────────────────────────────────────

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

    // ─── Render: Pagination ───────────────────────────────────────────────────

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

        // Previous Button
        if (current > 1) {
            html += `
                <li class="page-item">
                    <a class="page-link shadow-sm mt-1 mb-1 me-1 erp-page-btn" href="javascript:void(0);" data-page="${current - 1}">
                        <i class="bi bi-chevron-left"></i> Previous
                    </a>
                </li>`;
        }

        // Active indicator
        html += `
            <li class="page-item active">
                <span class="page-link shadow-sm mt-1 mb-1">${current} of ${totalPages}</span>
            </li>`;

        // Next Button
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

    // ─── Render: Pagination Counts ────────────────────────────────────────────

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

    // ─── Render: Table Rows ───────────────────────────────────────────────────
    // IMPORTANT: Zero inline onclick handlers in the rendered HTML.
    // The dropdown uses Bootstrap's native data-bs-toggle — no JS wiring needed.
    // Actions are caught by the delegated listeners registered in bindEvents().

    renderTable(transactions) {
        const totalDisplay = domUtils.getElement('#totalAmountDisplay');

        if (!transactions || transactions.length === 0) {
            this.tbody.innerHTML = `
                <tr>
                    <td colspan="8" class="text-center py-5 bg-white border-0">
                        <div class="empty-state py-5 fade-in-up" style="animation-delay: 0.2s;">
                            <div class="p-4 bg-light rounded-circle d-inline-block mb-4 shadow-sm">
                                <i class="bi bi-mailbox2 display-3 text-primary" style="opacity: 0.8;"></i>
                            </div>
                            <h3 class="fw-bold text-dark">No transactions found</h3>
                            <p class="text-muted mb-4 fs-5">You have not created any bank transactions yet, or none match your search criteria.</p>
                            <a href="/bank-transaction/create/" class="btn btn-primary btn-lg shadow-sm hover-lift px-5 rounded-pill">
                                <i class="bi bi-plus-lg me-2"></i>Create New Transaction
                            </a>
                        </div>
                    </td>
                </tr>`;
            if (totalDisplay) totalDisplay.textContent = formatter.formatCurrency(0);
            return;
        }

        const total = transactions.reduce((sum, t) => sum + parseFloat(t.amount || 0), 0);
        if (totalDisplay) totalDisplay.textContent = formatter.formatCurrency(total);

        let rowsHtml = transactions.map(t => {
            const isActive    = !!t.status;
            const rowClass    = isActive ? '' : 'table-danger text-muted';
            const statusBadge = isActive
                ? `<span class="badge bg-success bg-opacity-10 text-success border border-success border-opacity-25 rounded-pill px-3">Active</span>`
                : `<span class="badge bg-danger bg-opacity-10 text-danger border border-danger border-opacity-25 rounded-pill px-3">Inactive</span>`;

            // ── Build action items — View always first ──────────────────────
            let actionItemsHtml = `
                    <li>
                        <a class="dropdown-item" href="/bank-transaction/${t.voucher_no}/edit/?mode=view">
                            <i class="bi bi-eye me-2 text-secondary"></i> View
                        </a>
                    </li>`;

            if (isActive) {
                actionItemsHtml += `
                    <li>
                        <a class="dropdown-item" href="/bank-transaction/${t.voucher_no}/edit/">
                            <i class="bi bi-pencil-square me-2 text-primary"></i> Edit
                        </a>
                    </li>
                    <li>
                        <button class="dropdown-item text-warning toggle-status-btn"
                            data-id="${t.voucher_no}"
                            data-status="true"
                            type="button">
                            <i class="bi bi-x-circle me-2"></i> Mark Deleted
                        </button>
                    </li>`;
            } else {
                actionItemsHtml += `
                    <li>
                        <button class="dropdown-item text-warning toggle-status-btn"
                            data-id="${t.voucher_no}"
                            data-status="false"
                            type="button">
                            <i class="bi bi-arrow-counterclockwise me-2"></i> Restore
                        </button>
                    </li>
                    <li><hr class="dropdown-divider"></li>
                    <li>
                        <button class="dropdown-item text-danger delete-btn"
                            data-id="${t.voucher_no}"
                            type="button">
                            <i class="bi bi-trash3 me-2"></i> Delete
                        </button>
                    </li>`;
            }

            return `
                <tr class="align-middle ${rowClass}" data-row-id="${t.voucher_no}">
                    <td class="ps-3 fw-bold text-primary" style="font-size:0.85rem;">${t.voucher_no}</td>
                    <td style="font-size:0.85rem;">${formatter.formatDate(t.date)}</td>
                    <td>
                        <span class="badge bg-secondary bg-opacity-10 text-secondary" style="font-size:0.75rem;">
                            ${t.tran_type} - ${t.rpid}
                        </span>
                    </td>
                    <td>
                        <span class="text-truncate d-inline-block text-muted" style="max-width:100%; font-size:0.85rem;">
                            ${t.narration || '-'}
                        </span>
                    </td>
                    <td class="text-dark" style="font-size:0.85rem;">
                        ${t.bank_account_display ? t.bank_account_display.text : '-'}
                    </td>
                    <td class="fw-semibold text-end text-dark pe-3" style="font-size:0.85rem;">
                        ${formatter.formatCurrency(t.amount)}
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

// ─── Bootstrap ────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
    new BankTransactionList();
});
