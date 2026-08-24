import { apiClient } from '../api/client.js?v=147';
import { domUtils } from '../utils/dom.js?v=147';
import { formatter } from '../utils/formatter.js?v=147';
import { notifications } from '../utils/notifications.js?v=147';

const STATUS_LABELS = {
    1: 'Draft',
    2: 'Submitted for approval',
    3: 'Referred Back',
    4: 'Approved',
    5: 'Released',
};

const STATUS_BADGE = {
    1: 'secondary',
    2: 'warning',
    3: 'danger',
    4: 'success',
    5: 'primary',
};

class PurchaseChallanList {

    constructor() {
        this.tbody       = domUtils.getElement('#pcTableBody');
        this.filterForm  = domUtils.getElement('#filterForm');
        this.searchInput = domUtils.getElement('#searchInput');
        this.typeFilter  = domUtils.getElement('#typeFilter');
        this.clearBtn    = domUtils.getElement('#clearFiltersBtn');

        // State
        this.sortField   = '';
        this.sortOrder   = '';
        const savedPage  = sessionStorage.getItem('last_page_' + window.location.pathname);
        const parsedPage = savedPage ? parseInt(savedPage, 10) : 1;
        this.currentPage = isNaN(parsedPage) || parsedPage < 1 ? 1 : parsedPage;
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
                this.currentPage = 1;
                this.loadData();
            });
        }

        const actionsLabel      = domUtils.getElement('#actionsLabel');
        const statusFilterInput = domUtils.getElement('#statusFilter');

        if (this.clearBtn) {
            this.clearBtn.addEventListener('click', () => {
                this.searchInput.value = '';
                this.typeFilter.value  = '';
                if (statusFilterInput) statusFilterInput.value = '';
                if (actionsLabel) actionsLabel.textContent = 'Status';
                this.statusFilter = undefined;

                const fromDate = domUtils.getElement('#fromDate');
                const toDate   = domUtils.getElement('#toDate');
                if (fromDate && fromDate._flatpickr) fromDate._flatpickr.clear();
                if (toDate && toDate._flatpickr) toDate._flatpickr.clear();

                this.sortField   = '';
                this.sortOrder   = '';
                this.currentPage = 1;
                this.updateSortHeadersUI();
                this.loadData();
            });
        }

        // Status dropdown
        const actionsMenu = domUtils.getElement('#actionsMenu');
        if (actionsMenu && statusFilterInput) {
            actionsMenu.querySelectorAll('.dropdown-item').forEach(item => {
                item.addEventListener('click', (e) => {
                    e.preventDefault();
                    const val = item.dataset.value;
                    statusFilterInput.value = val;
                    if (actionsLabel) {
                        actionsLabel.textContent = val ? (STATUS_LABELS[val] || 'Status') : 'Status';
                    }
                    this.statusFilter = val || undefined;
                    this.currentPage = 1;
                    this.loadData();
                });
            });
        }

        // Sort headers
        document.querySelectorAll('.sortable-header').forEach(th => {
            th.addEventListener('click', () => {
                const field = th.dataset.sort;
                if (!field) return;
                if (this.sortField === field) {
                    this.sortOrder = this.sortOrder === 'asc' ? 'desc' : '';
                    if (!this.sortOrder) this.sortField = '';
                } else {
                    this.sortField = field;
                    this.sortOrder = 'asc';
                }
                this.currentPage = 1;
                this.updateSortHeadersUI();
                this.loadData();
            });
        });

        // Flatpickr date pickers
        const dateInputs = document.querySelectorAll('.flatpickr-date');
        if (window.flatpickr) {
            dateInputs.forEach(el => {
                window.flatpickr(el, {
                    dateFormat: 'Y-m-d',
                    allowInput: true,
                    onChange: () => { this.currentPage = 1; this.loadData(); }
                });
            });
        }

        // Detached dropdowns delegation
        domUtils.delegate('#pcTableBody', 'click', '.action-dropdown button', function(e, target) {
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
                        openDropdowns.forEach(m => { m.classList.remove('show'); });
                        e.stopPropagation();
                    }
                }
            }, true);
            window._erpDropdownEscListenerAdded = true;
        }
    }

    updateSortHeadersUI() {
        document.querySelectorAll('.sortable-header').forEach(th => {
            const icon = th.querySelector('.sort-icon');
            if (!icon) return;
            if (th.dataset.sort === this.sortField) {
                icon.textContent = this.sortOrder === 'asc' ? '↑' : '↓';
                icon.style.color = '#2563eb';
            } else {
                icon.textContent = '↕';
                icon.style.color = '';
            }
        });
    }

    buildParams() {
        const params = { page: this.currentPage };
        const rawSearch = this.searchInput ? this.searchInput.value.trim() : '';
        const field     = this.typeFilter  ? this.typeFilter.value  : '';

        if (rawSearch) {
            if (field) {
                params[field] = rawSearch;
            } else {
                params.search = rawSearch;
            }
        }

        const fromDate = domUtils.getElement('#fromDate');
        const toDate   = domUtils.getElement('#toDate');
        if (fromDate && fromDate.value) params.date_after  = fromDate.value;
        if (toDate   && toDate.value)   params.date_before = toDate.value;

        const statusFilterInput = domUtils.getElement('#statusFilter');
        if (statusFilterInput && statusFilterInput.value !== '') {
            params.status = statusFilterInput.value;
        }

        if (this.sortField) {
            params.ordering = this.sortOrder === 'desc' ? `-${this.sortField}` : this.sortField;
        }

        return params;
    }

    async loadData() {
        document.querySelectorAll('.erp-detached-dropdown').forEach(el => el.remove());
        if (this.tbody) {
            this.tbody.innerHTML = `
                <tr><td colspan="9" class="text-center py-5 text-muted" style="font-size:13px;">
                    <div class="spinner-border spinner-border-sm me-2" role="status"></div>Loading...
                </td></tr>`;
        }

        try {
            const params = this.buildParams();
            const response = await apiClient.get('/api/purchase-challan/', params);
            const data = response;

            const results    = data.results || [];
            const totalCount = data.count   || 0;
            const totalPages = data.total_pages || 1;

            this.renderTable(results);
            this.renderPagination(totalPages, totalCount);

            const totalDisplay = domUtils.getElement('#totalChallanDisplay');
            if (totalDisplay) totalDisplay.textContent = totalCount;

        } catch (err) {
            console.error('Purchase Challan list load error:', err);
            if (this.tbody) {
                this.tbody.innerHTML = `
                    <tr><td colspan="9" class="text-center py-5 text-danger fw-bold fs-6">
                        <i class="bi bi-exclamation-circle me-2"></i>Failed to load data. Please try again.
                    </td></tr>`;
            }
        }
    }

    renderTable(records) {
        if (!this.tbody) return;

        if (!records.length) {
            this.tbody.innerHTML = `
                <tr><td colspan="9" class="text-center py-5 text-muted" style="font-size:13px;">
                    <i class="bi bi-inbox me-2"></i>No Purchase Challan records found.
                </td></tr>`;
            return;
        }

        this.tbody.innerHTML = records.map(row => this.renderRow(row)).join('');
        this.bindRowActions();
    }

    renderRow(row) {
        const challanNo    = row.ChallanNo    || '—';
        const challanDate  = row.ChallanDate  ? formatter.formatDate(row.ChallanDate) : '—';
        const gpNo         = row.GPNo != null ? `GP-${10000 + parseInt(row.GPNo)}` : '—';
        const vehicleNo    = row.VehicleNo    || '—';
        const weighNo      = row.WeighmentSlipNo || '—';
        const netWt        = row.NetWeight != null ? parseFloat(row.NetWeight).toFixed(2) : '—';
        const poNo         = row.PONO         || '—';
        const statusCode   = row.StatusId;
        const statusText   = STATUS_LABELS[statusCode] || '—';
        const badgeColor   = STATUS_BADGE[statusCode]  || 'secondary';

        const editUrl = `/purchase-challan/${encodeURIComponent(challanNo)}/edit/`;
        const viewUrl = `${editUrl}?mode=view`;

        const showDelete = (statusCode === 1 || statusCode === 3);
        const deleteItemHtml = showDelete ? `
                        <li><a class="dropdown-item py-1 text-warning pc-delete-btn" href="#"
                            data-challan-no="${challanNo}">
                            <i class="bi bi-x-circle me-2 text-warning"></i>Mark Deleted
                        </a></li>` : '';

        return `
        <tr style="font-size: 12px; cursor: pointer;" data-row-id="${challanNo}">
            <td class="text-nowrap fw-semibold" style="color:#1d4ed8;">${challanNo}</td>
            <td class="text-nowrap">${challanDate}</td>
            <td>${gpNo}</td>
            <td>${vehicleNo}</td>
            <td>${weighNo}</td>
            <td class="text-end">${netWt}</td>
            <td>${poNo}</td>
            <td class="text-center">
                <span class="badge bg-${badgeColor}" style="font-size:10px; padding:3px 7px;">${statusText}</span>
            </td>
            <td class="text-center text-nowrap">
                <div class="dropdown action-dropdown d-inline-block text-center" style="position: static;">
                    <button class="btn btn-sm btn-light border d-flex align-items-center justify-content-center p-0" type="button" aria-expanded="false" style="width:26px; height:26px; padding:0; display:inline-flex; align-items:center; justify-content:center; border:1px solid #e5e7eb; background:#fff; color:#374151; border-radius:4px; margin:0 auto;">
                        <i class="bi bi-three-dots-vertical" style="font-size:14px;"></i>
                    </button>
                    <ul class="dropdown-menu dropdown-menu-end shadow border-0" style="font-size:12px; min-width:120px;">
                        <li><a class="dropdown-item py-1" href="${viewUrl}"><i class="bi bi-eye me-2" style="color: #64748b;"></i>View</a></li>
                        <li><a class="dropdown-item py-1" href="${editUrl}"><i class="bi bi-pencil-square me-2 text-primary"></i>Edit</a></li>
                        ${deleteItemHtml}
                    </ul>
                </div>
            </td>
        </tr>`;
    }

    bindRowActions() {
        document.querySelectorAll('.pc-delete-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                const challanNo = btn.dataset.challanNo;

                const modalEl = document.getElementById('deleteConfirmModal');
                if (modalEl) {
                    const modal = bootstrap.Modal.getOrCreateInstance(modalEl);
                    const challanSpan = document.getElementById('deleteModalChallanNo');
                    if (challanSpan) challanSpan.textContent = challanNo;

                    const confirmBtn = document.getElementById('deleteModalConfirmBtn');
                    const newConfirmBtn = confirmBtn.cloneNode(true);
                    confirmBtn.parentNode.replaceChild(newConfirmBtn, confirmBtn);

                    newConfirmBtn.addEventListener('click', async () => {
                        newConfirmBtn.disabled = true;
                        newConfirmBtn.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Processing...';
                        try {
                            await apiClient.delete(`/api/purchase-challan/${encodeURIComponent(challanNo)}/`);
                            notifications.success('Purchase Challan deleted successfully.');
                            modal.hide();
                            this.loadData();
                        } catch (err) {
                            const msg = err.responseData?.detail || 'Delete failed. Please try again.';
                            notifications.error(msg);
                        } finally {
                            newConfirmBtn.disabled = false;
                            newConfirmBtn.textContent = 'Confirm';
                        }
                    });

                    modal.show();
                }
            });
        });
    }

    renderPagination(totalPages, totalCount) {
        const startEl = domUtils.getElement('#paginationStart');
        const endEl   = domUtils.getElement('#paginationEnd');
        const totEl   = domUtils.getElement('#paginationTotal');
        const ctrlEl  = domUtils.getElement('#paginationControls');

        const pageSize   = 10;
        const startEntry = totalCount === 0 ? 0 : (this.currentPage - 1) * pageSize + 1;
        const endEntry   = Math.min(this.currentPage * pageSize, totalCount);

        if (startEl) startEl.textContent = startEntry;
        if (endEl)   endEl.textContent   = endEntry;
        if (totEl)   totEl.textContent   = totalCount;

        sessionStorage.setItem('last_page_' + window.location.pathname, this.currentPage);

        if (!ctrlEl) return;

        const makeBtn = (label, page, disabled = false, active = false) => {
            const cls = ['page-item', disabled ? 'disabled' : '', active ? 'active' : ''].filter(Boolean).join(' ');
            return `<li class="${cls}">
                <a class="page-link" href="#" data-page="${page}" style="font-size:12px; padding:4px 10px;">${label}</a>
            </li>`;
        };

        let html = makeBtn('«', 1, this.currentPage === 1);
        html    += makeBtn('‹', this.currentPage - 1, this.currentPage === 1);

        const start = Math.max(1, this.currentPage - 2);
        const end   = Math.min(totalPages, start + 4);
        for (let i = start; i <= end; i++) {
            html += makeBtn(i, i, false, i === this.currentPage);
        }

        html += makeBtn('›', this.currentPage + 1, this.currentPage === totalPages);
        html += makeBtn('»', totalPages, this.currentPage === totalPages);

        ctrlEl.innerHTML = html;

        ctrlEl.querySelectorAll('.page-link').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const page = parseInt(link.dataset.page, 10);
                if (page !== this.currentPage) {
                    this.currentPage = page;
                    this.loadData();
                }
            });
        });
    }
}

document.addEventListener('DOMContentLoaded', () => new PurchaseChallanList());
