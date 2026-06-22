import { UserMasterAPI } from '../api/user-master-api.js?v=148';
import { domUtils } from '../utils/dom.js?v=148';
import { notifications } from '../utils/notifications.js?v=148';

class UserMasterList {
    constructor() {
        this.tbody        = domUtils.getElement('#userTableBody');
        this.filterForm   = domUtils.getElement('#filterForm');
        this.searchInput  = domUtils.getElement('#searchInput');
        this.roleFilter   = domUtils.getElement('#roleFilter');
        this.clearBtn     = domUtils.getElement('#clearFiltersBtn');
        this.statusFilterInput = domUtils.getElement('#statusFilter');

        // State
        this.sortField    = '';
        this.sortOrder    = '';
        const savedPage   = sessionStorage.getItem('last_page_' + window.location.pathname);
        const parsedPage  = savedPage ? parseInt(savedPage, 10) : 1;
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
        if (this.clearBtn) {
            this.clearBtn.addEventListener('click', () => {
                this.searchInput.value = '';
                this.roleFilter.value  = '';
                if (this.statusFilterInput) this.statusFilterInput.value = '';
                const actionsLabel = domUtils.getElement('#actionsLabel');
                if (actionsLabel) actionsLabel.textContent = 'Status';
                this.statusFilter = undefined;
                
                this.sortField    = '';
                this.sortOrder    = '';
                this.currentPage  = 1;
                this.updateSortHeadersUI();
                this.loadData();
            });
        }

        // Status filter dropdown (Active / Inactive / All)
        const actionsMenu  = domUtils.getElement('#actionsMenu');
        const actionsLabel = domUtils.getElement('#actionsLabel');
        if (actionsMenu && this.statusFilterInput) {
            actionsMenu.querySelectorAll('.dropdown-item').forEach(item => {
                item.addEventListener('click', (e) => {
                    e.preventDefault();
                    const val = item.dataset.value;
                    if (val === 'active') {
                        this.statusFilter = true;
                        this.statusFilterInput.value = 'true';
                        if (actionsLabel) actionsLabel.textContent = 'Active';
                    } else if (val === 'inactive') {
                        this.statusFilter = false;
                        this.statusFilterInput.value = 'false';
                        if (actionsLabel) actionsLabel.textContent = 'Inactive';
                    } else {
                        this.statusFilter = undefined;
                        this.statusFilterInput.value = '';
                        if (actionsLabel) actionsLabel.textContent = 'Status';
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

        // Pagination controls
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
            if (!confirm('Are you sure you want to PERMANENTLY delete this user? This cannot be undone.')) return;
            const id = target.dataset.id;
            try {
                await UserMasterAPI.delete(id);
                notifications.showSuccess('User permanently deleted');
                this.loadData();
            } catch (err) {
                notifications.showError(err.message || 'Failed to delete user');
            }
        });

        // Row-level action: Toggle Status Modal (Mark Inactive / Restore)
        domUtils.delegate('body', 'click', '.toggle-status-modal-btn', (e, target) => {
            e.preventDefault();
            e.stopPropagation();
            const id = target.dataset.id;
            const isActive = target.dataset.status === 'true';
            this.showStatusToggleModal(id, isActive);
        });


        // ⚡ Detached Dropdown Toggler (Escapes Table Overflow Clipping) ⚡
        domUtils.delegate('#userTableBody', 'click', '.action-dropdown button', function(e, target) {
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
                    } else {
                        // Close statusToggleModal if it is open
                        const modalEl = document.getElementById('statusToggleModal');
                        if (modalEl && modalEl.classList.contains('show')) {
                            const modal = bootstrap.Modal.getInstance(modalEl);
                            if (modal) {
                                modal.hide();
                            }
                        }
                    }
                }
            }, true);
            window._erpDropdownEscListenerAdded = true;
        }
    }

    showStatusToggleModal(id, isActive) {
        // Dismiss any open detached dropdowns immediately
        document.querySelectorAll('.erp-detached-dropdown.show').forEach(m => {
            m.classList.remove('show');
        });

        const modalEl = document.getElementById('statusToggleModal');
        if (!modalEl) return;

        const modal = bootstrap.Modal.getOrCreateInstance(modalEl);
        const title = document.getElementById('statusModalTitle');
        const actionText = document.getElementById('statusModalActionText');
        const suffix = document.getElementById('statusModalSuffix');
        const confirmBtn = document.getElementById('statusModalConfirmBtn');

        if (isActive) {
            title.textContent = 'Mark Inactive';
            actionText.textContent = 'mark';
            suffix.textContent = ' inactive';
            confirmBtn.className = 'btn btn-sm btn-danger w-100 bg-gradient text-white fw-bold';
        } else {
            title.textContent = 'Activate';
            actionText.textContent = 'activate';
            suffix.textContent = '';
            confirmBtn.className = 'btn btn-sm btn-success w-100 bg-gradient text-white fw-bold';
        }

        // Clean up previous event listeners by cloning
        const newConfirmBtn = confirmBtn.cloneNode(true);
        confirmBtn.parentNode.replaceChild(newConfirmBtn, confirmBtn);
        
        newConfirmBtn.addEventListener('click', async () => {
            newConfirmBtn.disabled = true;
            newConfirmBtn.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Processing...';
            try {
                await UserMasterAPI.toggleStatus(id);
                notifications.showSuccess('Status updated successfully');
                this.loadData();
                modal.hide();
            } catch (error) {
                notifications.showError(error.message || 'Error updating status');
            } finally {
                newConfirmBtn.disabled = false;
                newConfirmBtn.textContent = 'Confirm';
            }
        });

        modal.show();
    }

    updateSortHeadersUI() {
        document.querySelectorAll('.sortable-header').forEach(th => {
            const icon = th.querySelector('.sort-icon');
            if (!icon) return;
            if (th.dataset.sort === this.sortField) {
                if (this.sortOrder === 'asc')       { icon.textContent = '▲'; icon.classList.remove('text-muted'); icon.classList.add('text-primary'); }
                else if (this.sortOrder === 'desc')  { icon.textContent = '▼'; icon.classList.remove('text-muted'); icon.classList.add('text-primary'); }
                else                                { icon.textContent = '↕'; icon.classList.remove('text-primary'); icon.classList.add('text-muted'); }
            } else {
                icon.textContent = '↕';
                icon.classList.remove('text-primary');
                icon.classList.add('text-muted');
            }
        });
    }

    async loadData() {
        if (!this.tbody) return;
        sessionStorage.setItem('last_page_' + window.location.pathname, this.currentPage);
        
        // Clean up detached dropdowns to prevent memory leaks during AJAX re-render
        document.querySelectorAll('.erp-detached-dropdown').forEach(el => el.remove());

        // Show loading state
        this.tbody.innerHTML = `<tr><td colspan="6" class="text-center py-3 text-muted"><span class="spinner-border spinner-border-sm me-2"></span>Loading users...</td></tr>`;

        try {
            const params = {
                page: this.currentPage,
            };

            const searchVal = this.searchInput.value.trim();
            if (searchVal) params.search = searchVal;

            const roleVal = this.roleFilter.value;
            if (roleVal) params.role = roleVal;

            if (this.statusFilter !== undefined) {
                params.status = this.statusFilter;
            }

            if (this.sortField) {
                params.ordering = (this.sortOrder === 'desc' ? '-' : '') + this.sortField;
            }

            const response = await UserMasterAPI.getAll(params);
            this.renderTable(response);
        } catch (err) {
            notifications.showError('Failed to load user master records');
            this.tbody.innerHTML = `<tr><td colspan="6" class="text-center text-danger py-3"><i class="bi bi-exclamation-triangle-fill me-2"></i>Failed to load user data.</td></tr>`;
        }
    }

    renderTable(data) {
        if (!this.tbody) return;
        this.tbody.innerHTML = '';

        const results = data.results || [];
        const count = data.count || 0;

        // Total display update
        const totalDisplay = domUtils.getElement('#totalUsersDisplay');
        if (totalDisplay) totalDisplay.textContent = count;

        if (results.length === 0) {
            this.tbody.innerHTML = `<tr><td colspan="6" class="text-center py-3 text-muted">No records found matching criteria.</td></tr>`;
            this.updatePaginationUI(data);
            return;
        }

        results.forEach(row => {
            const tr = document.createElement('tr');
            
            // Role badge style
            let roleClass = 'bg-secondary-subtle text-secondary';
            if (row.role === 'Maker')   roleClass = 'bg-primary-subtle text-primary';
            else if (row.role === 'Checker') roleClass = 'bg-warning-subtle text-warning-emphasis';
            else if (row.role === 'Admin')   roleClass = 'bg-info-subtle text-info-emphasis';

            // Status badge style
            const statusBadge = row.is_active 
                ? '<span class="badge bg-success-subtle text-success border border-success-subtle" style="font-size: 11px;">Active</span>' 
                : '<span class="badge bg-danger-subtle text-danger border border-danger-subtle" style="font-size: 11px;">Inactive</span>';

            // Action dropdown items
            let actionItemsHtml = '';
            if (row.is_active) {
                actionItemsHtml = `
                    <li>
                        <a class="dropdown-item py-1" href="/settings/user-master/${row.user_id}/edit/?mode=view">
                            <i class="bi bi-eye me-2 text-primary"></i> View
                        </a>
                    </li>
                    <li>
                        <a class="dropdown-item py-1" href="/settings/user-master/${row.user_id}/edit/">
                            <i class="bi bi-pencil-square me-2 text-primary"></i> Edit
                        </a>
                    </li>
                    <li>
                        <button class="dropdown-item py-1 text-warning toggle-status-modal-btn" data-id="${row.user_id}" data-status="true" type="button">
                            <i class="bi bi-x-circle me-2"></i> Mark Inactive
                        </button>
                    </li>
                    <li><hr class="dropdown-divider my-1"></li>
                    <li>
                        <button class="dropdown-item py-1 text-muted" onclick="alert('Cannot delete an active user. Please mark inactive first.'); return false;" type="button">
                            <i class="bi bi-trash3 me-2"></i> Delete
                        </button>
                    </li>
                `;
            } else {
                actionItemsHtml = `
                    <li>
                        <a class="dropdown-item py-1" href="/settings/user-master/${row.user_id}/edit/?mode=view">
                            <i class="bi bi-eye me-2 text-primary"></i> View
                        </a>
                    </li>
                    <li>
                        <a class="dropdown-item py-1" href="/settings/user-master/${row.user_id}/edit/">
                            <i class="bi bi-pencil-square me-2 text-primary"></i> Edit
                        </a>
                    </li>
                    <li>
                        <button class="dropdown-item py-1 text-success toggle-status-modal-btn" data-id="${row.user_id}" data-status="false" type="button">
                            <i class="bi bi-arrow-counterclockwise me-2"></i> Restore
                        </button>
                    </li>
                    <li><hr class="dropdown-divider my-1"></li>
                    <li>
                        <button class="dropdown-item py-1 text-danger delete-btn" data-id="${row.user_id}" type="button">
                            <i class="bi bi-trash3 me-2"></i> Delete
                        </button>
                    </li>
                `;
            }

            tr.innerHTML = `
                <td class="align-middle fw-medium">${row.user_id}</td>
                <td class="align-middle fw-semibold text-dark">${row.user_name}</td>
                <td class="align-middle text-center"><span class="badge ${roleClass} border" style="font-size:11px;">${row.role}</span></td>
                <td class="align-middle">${row.empid}</td>
                <td class="align-middle text-center">${statusBadge}</td>
                <td class="align-middle text-center position-relative">
                    <div class="dropdown action-dropdown">
                        <button class="btn btn-light btn-sm hide-caret" type="button" aria-expanded="false" style="width:26px; height:26px; padding:0; display:inline-flex; align-items:center; justify-content:center; border:1px solid #e5e7eb; background:#fff; color:#374151; border-radius:4px;">
                            <i class="bi bi-three-dots-vertical" style="font-size:14px; transform: translateX(2px);"></i>
                        </button>
                        <ul class="dropdown-menu dropdown-menu-end shadow-sm" style="font-size: 13px; min-width: 150px; z-index: 1060; margin-top: 2px;">
                            ${actionItemsHtml}
                        </ul>
                    </div>
                </td>
            `;
            this.tbody.appendChild(tr);
        });

        this.updatePaginationUI(data);
    }

    updatePaginationUI(data) {
        const controls = domUtils.getElement('#paginationControls');
        const start = domUtils.getElement('#paginationStart');
        const end = domUtils.getElement('#paginationEnd');
        const total = domUtils.getElement('#paginationTotal');

        if (!controls || !start || !end || !total) return;

        const count = data.count || 0;
        total.textContent = count;

        if (count === 0) {
            start.textContent = '0';
            end.textContent = '0';
            controls.innerHTML = '';
            return;
        }

        const pageSize = 10;
        const totalPages = data.total_pages || Math.ceil(count / pageSize);
        const current = this.currentPage;

        const startIdx = (current - 1) * pageSize + 1;
        const endIdx = Math.min(current * pageSize, count);
        start.textContent = startIdx;
        end.textContent = endIdx;

        let html = '';

        // Pages
        for (let i = 1; i <= totalPages; i++) {
            if (i === current) {
                html += `<li><button type="button" class="btn btn-sm btn-primary active fw-semibold" style="pointer-events: none;">${i}</button></li>`;
            } else {
                html += `<li><button type="button" class="btn btn-sm btn-outline-secondary erp-page-btn" data-page="${i}">${i}</button></li>`;
            }
        }

        controls.innerHTML = html;
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new UserMasterList();
});
