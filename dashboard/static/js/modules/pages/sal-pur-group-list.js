import { apiClient } from '../api/client.js?v=147';
import { domUtils } from '../utils/dom.js?v=147';
import { formatter } from '../utils/formatter.js?v=147';
import { notifications } from '../utils/notifications.js?v=147';

class SalPurGroupList {

    constructor() {
        this.tbody        = domUtils.getElement('#groupTableBody');
        this.filterForm   = domUtils.getElement('#filterForm');
        this.searchInput  = domUtils.getElement('#searchInput');
        this.typeFilter   = domUtils.getElement('#typeFilter');
        this.clearBtn     = domUtils.getElement('#clearFiltersBtn');

        // New hidden filter inputs
        this.gstFilterInput       = domUtils.getElement('#gstFilter');
        this.groupwiseFilterInput = domUtils.getElement('#groupwiseFilter');
        this.taxFilterInput       = domUtils.getElement('#taxFilter');

        // State
        this.sortField    = '';
        this.sortOrder    = '';
        const savedPage = sessionStorage.getItem('last_page_' + window.location.pathname);
        const parsedPage = savedPage ? parseInt(savedPage, 10) : 1;
        this.currentPage  = isNaN(parsedPage) || parsedPage < 1 ? 1 : parsedPage;
        this.statusFilter = undefined; // default to show all

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
                this.currentPage = 1;
                this.loadData();
            });
        }

        // Clear filters
        const actionsLabel      = domUtils.getElement('#actionsLabel');
        const statusFilterInput = domUtils.getElement('#statusFilter');
        const optionsLabel      = domUtils.getElement('#optionsLabel');
        const taxLabel          = domUtils.getElement('#taxLabel');

        if (this.clearBtn) {
            document.getElementById('clearFiltersBtn').addEventListener('click', () => {
                this.searchInput.value = '';
                this.typeFilter.value  = '';
                if (statusFilterInput) statusFilterInput.value = '';
                if (actionsLabel) actionsLabel.textContent = 'Status';
                this.statusFilter = undefined;
                
                // Clear Options
                if (optionsLabel) optionsLabel.textContent = 'Options';
                if (this.gstFilterInput) this.gstFilterInput.value = '';
                if (this.groupwiseFilterInput) this.groupwiseFilterInput.value = '';

                // Clear tax filter
                if (this.taxFilterInput) this.taxFilterInput.value = '';
                if (taxLabel) taxLabel.textContent = 'Tax Type';

                this.sortField    = '';
                this.sortOrder    = '';
                this.currentPage  = 1;
                this.updateSortHeadersUI();
                this.loadData();
            });
        }

        // Status filter dropdown (Active / Inactive / All)
        const actionsMenu       = domUtils.getElement('#actionsMenu');

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

        // Options filter dropdown
        const optionsMenu = domUtils.getElement('#optionsMenu');
        if (optionsMenu) {
            optionsMenu.querySelectorAll('.dropdown-item').forEach(item => {
                item.addEventListener('click', (e) => {
                    e.preventDefault();
                    const val = item.dataset.value;
                    if (val === 'gst_applicable') {
                        if (this.gstFilterInput) this.gstFilterInput.value = 'true';
                        if (this.groupwiseFilterInput) this.groupwiseFilterInput.value = '';
                        if (optionsLabel) optionsLabel.textContent = 'GST App.';
                    } else if (val === 'groupwise_accounting') {
                        if (this.gstFilterInput) this.gstFilterInput.value = '';
                        if (this.groupwiseFilterInput) this.groupwiseFilterInput.value = 'true';
                        if (optionsLabel) optionsLabel.textContent = 'Groupwise';
                    } else {
                        if (this.gstFilterInput) this.gstFilterInput.value = '';
                        if (this.groupwiseFilterInput) this.groupwiseFilterInput.value = '';
                        if (optionsLabel) optionsLabel.textContent = 'Options';
                    }
                    this.currentPage = 1;
                    this.loadData();
                });
            });
        }

        // Tax Type filter dropdown
        const taxMenu = domUtils.getElement('#taxMenu');
        if (taxMenu && this.taxFilterInput) {
            taxMenu.querySelectorAll('.dropdown-item').forEach(item => {
                item.addEventListener('click', (e) => {
                    e.preventDefault();
                    const val = item.dataset.value;
                    if (val === 'interstate') {
                        this.taxFilterInput.value = 'true';
                        if (taxLabel) taxLabel.textContent = 'Interstate';
                    } else if (val === 'within_state') {
                        this.taxFilterInput.value = 'false';
                        if (taxLabel) taxLabel.textContent = 'Within State';
                    } else {
                        this.taxFilterInput.value = '';
                        if (taxLabel) taxLabel.textContent = 'Tax Type';
                    }
                    this.currentPage = 1;
                    this.loadData();
                });
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
                    this.sortOrder = 'asc';
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

        // Row-level action: Delete
        domUtils.delegate('body', 'click', '.delete-btn', async (e, target) => {
            e.preventDefault();
            e.stopPropagation();
            if (!confirm('Are you sure you want to PERMANENTLY delete this group? This cannot be undone.')) return;
            const id = target.dataset.id;
            try {
                await apiClient.delete(`/api/sal-pur-group/${id}/`);
                notifications.showSuccess('Group permanently deleted');
                this.loadData();
            } catch (err) {
                notifications.showError('Failed to delete group');
            }
        });

        // Row-level action: Toggle Status (Mark Inactive / Restore)
        domUtils.delegate('body', 'click', '.toggle-status-btn', async (e, target) => {
            e.preventDefault();
            e.stopPropagation();
            const id = target.dataset.id;
            const isActive = target.dataset.status === 'true';
            const promptMsg = isActive ? 'Are you sure you want to mark this group inactive?' : 'Are you sure you want to restore this group?';
            const toastMsg  = isActive ? 'Group marked inactive successfully' : 'Group restored successfully';
            if (!confirm(promptMsg)) return;
            try {
                await apiClient.post(`/api/sal-pur-group/${id}/toggle_status/`);
                notifications.showSuccess(toastMsg);
                this.loadData();
            } catch (err) {
                notifications.showError(err.message || 'Error updating status');
            }
        });

        // Detached Dropdown Toggler
        domUtils.delegate('#groupTableBody', 'click', '.action-dropdown button', function(e, target) {
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

            // Search
            if (this.searchInput.value) {
                if (this.typeFilter.value) {
                    params[this.typeFilter.value] = this.searchInput.value;
                } else {
                    params.search = this.searchInput.value;
                }
            }

            // Options filters (GST / Groupwise Accounting)
            if (this.gstFilterInput && this.gstFilterInput.value) {
                params.gst_applicable = this.gstFilterInput.value;
            }
            if (this.groupwiseFilterInput && this.groupwiseFilterInput.value) {
                params.groupwise_accounting = this.groupwiseFilterInput.value;
            }

            // Tax Type filter (Interstate / Within State)
            if (this.taxFilterInput && this.taxFilterInput.value !== '') {
                params.interstate = this.taxFilterInput.value;
            }



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
            params.page_size = 10;

            const response = await apiClient.get('/api/sal-pur-group/', params);
            sessionStorage.setItem('last_page_' + window.location.pathname, this.currentPage);

            let groups = [];
            if (Array.isArray(response)) {
                groups = response;
                this.renderPagination(null);
            } else if (response && Array.isArray(response.results)) {
                groups = response.results;
                this.renderPagination(response);
            } else {
                this.renderPagination(null);
            }

            this.renderTable(groups);
            this.updatePaginationCounts(groups, response);

        } catch (err) {
            if (this.currentPage > 1 && (err.status === 404 || err.message?.includes('404') || err.response?.status === 404)) {
                this.currentPage--;
                await this.loadData();
                return;
            }
            this.tbody.innerHTML = `
                <tr><td colspan="9" class="text-center py-5 text-danger fw-bold fs-6">
                    <i class="bi bi-exclamation-circle me-2"></i>Failed to load groups. Please try again.
                </td></tr>`;
            notifications.showError('Failed to load groups');
        }
    }

    renderLoading() {
        this.tbody.innerHTML = `
            <tr><td colspan="9" class="text-center py-5 bg-white">
                <div class="spinner-border spinner-border-sm text-primary" role="status">
                    <span class="visually-hidden">Loading...</span>
                </div>
                <span class="ms-2 text-muted fw-bold" style="font-size:0.85rem;">Loading groups...</span>
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

    updatePaginationCounts(groups, data) {
        const pStart = domUtils.getElement('#paginationStart');
        const pEnd   = domUtils.getElement('#paginationEnd');
        const pTotal = domUtils.getElement('#paginationTotal');
        const totalGroupsDisplay = domUtils.getElement('#totalGroupsDisplay');
        
        let totalCount = 0;
        if (!groups || groups.length === 0) {
            if (pStart) pStart.textContent = '0';
            if (pEnd) pEnd.textContent = '0';
            if (pTotal) pTotal.textContent = '0';
            if (totalGroupsDisplay) totalGroupsDisplay.textContent = '0';
            return;
        }

        if (data && data.count) {
            const current = data.current || 1;
            const pageSize = data.page_size || 10;
            const start = ((current - 1) * pageSize) + 1;
            const end = start + groups.length - 1;
            if (pStart) pStart.textContent = start;
            if (pEnd) pEnd.textContent = end;
            if (pTotal) pTotal.textContent = data.count;
            totalCount = data.count;
        } else {
            if (pStart) pStart.textContent = '1';
            if (pEnd) pEnd.textContent = groups.length;
            if (pTotal) pTotal.textContent = groups.length;
            totalCount = groups.length;
        }
        if (totalGroupsDisplay) {
            totalGroupsDisplay.textContent = totalCount;
        }
    }

    renderTable(groups) {
        if (!groups || groups.length === 0) {
            this.tbody.innerHTML = `
                <tr>
                    <td colspan="9" class="text-center py-5 bg-white border-0">
                        <div class="empty-state py-5 fade-in-up" style="animation-delay: 0.2s;">
                            <div class="p-4 bg-light rounded-circle d-inline-block mb-4 shadow-sm">
                                <i class="bi bi-mailbox2 display-3 text-primary" style="opacity: 0.8;"></i>
                            </div>
                            <h3 class="fw-bold text-dark">No groups found</h3>
                            <p class="text-muted mb-4 fs-5">You have not created any Purchase Sale Groups yet, or none match your search criteria.</p>
                            <a href="/sal-pur-group/create/" class="btn btn-primary btn-lg shadow-sm hover-lift px-5 rounded-pill">
                                <i class="bi bi-plus-lg me-2"></i>Create New Group
                            </a>
                        </div>
                    </td>
                </tr>`;
            return;
        }

        let rowsHtml = groups.map(g => {
            const gwAccounting = g.GroupwiseAccounting
                ? `<span class="badge bg-success bg-opacity-10 text-success border border-success border-opacity-25 rounded-pill px-3">Yes</span>`
                : `<span class="badge bg-danger bg-opacity-10 text-danger border border-danger border-opacity-25 rounded-pill px-3">No</span>`;

            const taxTypeBadge = g.Interstate_Y_WithinState_N
                ? `<span class="badge bg-primary bg-opacity-10 text-primary border border-primary border-opacity-25 rounded-pill px-2">Interstate</span>`
                : `<span class="badge bg-secondary bg-opacity-10 text-secondary border border-secondary border-opacity-25 rounded-pill px-2">Within State</span>`;

            const gstApplicableBadge = (g.GST_Applicable_Y_N || g.IsGSTApplicableY1N0)
                ? `<span class="badge bg-success bg-opacity-10 text-success border border-success border-opacity-25 rounded-pill px-3">Yes</span>`
                : `<span class="badge bg-danger bg-opacity-10 text-danger border border-danger border-opacity-25 rounded-pill px-3">No</span>`;

            const createdDate = g.DateCreated ? new Date(g.DateCreated).toLocaleDateString('en-GB') : '-';
            const userCreated = g.UserCreated || 'System';
            const accountName = g.account_display ? g.account_display.text : '-';
            const transactionTypeName = g.transaction_type_display ? g.transaction_type_display.name : '-';
            const statusBadge = g.is_active
                ? `<span class="badge bg-success bg-opacity-10 text-success border border-success border-opacity-25 rounded-pill px-3">Active</span>`
                : `<span class="badge bg-danger bg-opacity-10 text-danger border border-danger border-opacity-25 rounded-pill px-3">Inactive</span>`;

            let actionItemsHtml = `
                <li>
                    <a class="dropdown-item" href="/sal-pur-group/${g.SalPurGroupID}/edit/?mode=view">
                        <i class="bi bi-eye me-2 text-secondary"></i> View
                    </a>
                </li>
                <li>
                    <a class="dropdown-item" href="/sal-pur-group/${g.SalPurGroupID}/edit/">
                        <i class="bi bi-pencil-square me-2 text-primary"></i> Edit
                    </a>
                </li>
                <li>
                    <button class="dropdown-item toggle-status-btn"
                        data-id="${g.SalPurGroupID}"
                        data-status="${g.is_active}"
                        type="button">
                        <i class="bi ${g.is_active ? 'bi-x-circle text-warning' : 'bi-check-circle text-success'} me-2"></i>
                        ${g.is_active ? 'Mark Inactive' : 'Restore'}
                    </button>
                </li>`;

            if (!g.is_active) {
                actionItemsHtml += `
                <li><hr class="dropdown-divider"></li>
                <li>
                    <button class="dropdown-item text-danger delete-btn"
                        data-id="${g.SalPurGroupID}"
                        type="button">
                        <i class="bi bi-trash3 me-2 text-danger"></i> Delete
                    </button>
                </li>`;
            }

            return `
                <tr class="align-middle" data-row-id="${g.SalPurGroupID}">
                    <td class="ps-3 fw-bold text-primary" style="font-size:0.85rem;">#${g.SalPurGroupID}</td>
                    <td class="fw-bold text-dark" style="font-size:0.85rem;">${g.SalPurGroupName || '-'}</td>
                    <td class="text-dark" style="font-size:0.85rem;">${transactionTypeName}</td>
                    <td class="text-center">
                        ${gwAccounting}
                    </td>
                    <td class="text-dark" style="font-size:0.85rem;">
                        ${accountName}
                    </td>
                    <td class="text-center" style="font-size:0.85rem;">
                        ${taxTypeBadge}
                    </td>
                    <td class="text-center">
                        ${gstApplicableBadge}
                    </td>
                    <td class="text-center">
                        ${statusBadge}
                    </td>
                    <td class="text-center">
                        <div class="dropdown action-dropdown">
                            <button
                                class="btn btn-light btn-sm hide-caret"
                                type="button" aria-expanded="false"
                                style="width:26px; height:26px; padding:0; display:inline-flex; align-items:center; justify-content:center; border:1px solid #e5e7eb; background:#fff; color:#374151; border-radius:4px;">
                                <i class="bi bi-three-dots-vertical" style="font-size:14px; transform: translateX(2px);"></i>
                            </button>
                            <ul class="dropdown-menu dropdown-menu-end shadow-sm" style="font-size:13px; min-width: 150px; z-index: 1050; margin-top:2px;">
                                ${actionItemsHtml}
                            </ul>
                        </div>
                    </td>
                </tr>`;
        }).join('');

        this.tbody.innerHTML = rowsHtml;
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new SalPurGroupList();
});
