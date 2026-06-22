import { domUtils } from '../utils/dom.js?v=147';
import { CustomMultiColumnCombo } from '../../custom-combo.js?v=147';

// ── Global row counter for unique radio group names ──────────────────────────
let _pgRowCounter = 0;

export class SubsectionYRow {
    constructor(templateId, tbodyId, isViewMode = false) {
        this.template   = domUtils.getElement(templateId);
        this.tbody      = domUtils.getElement(tbodyId);
        this.isViewMode = isViewMode;
    }

    // ─── Create a new table row, optionally pre-filled with data ─────────────

    createRow(data = {}) {
        if (!this.template) return null;
        _pgRowCounter++;
        const rowIdx = _pgRowCounter;

        const clone = this.template.content.cloneNode(true);
        const tr    = clone.querySelector('tr');

        // ── Assign unique radio group names ─────────────────────────────────
        tr.querySelectorAll('input[name="mode_ROWINDEX"]').forEach(r => {
            r.name = `mode_${rowIdx}`;
        });
        tr.querySelectorAll('input[name="dc_ROWINDEX"]').forEach(r => {
            r.name = `dc_${rowIdx}`;
        });

        // ── Populate textbox ─────────────────────────────────────────────────
        const textbox = tr.querySelector('.row-textbox');
        if (textbox && data.ChargesName) textbox.value = data.ChargesName;

        // ── Populate rate ────────────────────────────────────────────────────
        const rateInput = tr.querySelector('.row-rate');
        if (rateInput && data.Rate != null) rateInput.value = data.Rate;

        // ── Populate Auto/Manual radio ────────────────────────────────────
        const modeVal = data.Auto_Y_Manual_N === true ? 'auto' : (data.Auto_Y_Manual_N === false ? 'manual' : 'auto');
        tr.querySelectorAll(`input[name="mode_${rowIdx}"]`).forEach(r => {
            r.checked = (r.value === modeVal);
        });

        // ── Populate Debit/Credit radio ───────────────────────────────────
        const dcVal = data.Debit_D_Credit_C || 'D';
        tr.querySelectorAll(`input[name="dc_${rowIdx}"]`).forEach(r => {
            r.checked = (r.value === dcVal);
        });

        // ── Bind Add Row button ──────────────────────────────────────────────
        tr.querySelector('.add-pg-row').addEventListener('click', () => {
            if (this.isViewMode) return;
            const newTr = this.createRow();
            if (this.tbody) this.tbody.dispatchEvent(new Event('input', { bubbles: true }));
            if (newTr) {
                // Focus account select of new row
                setTimeout(() => {
                    const nextSelect = newTr.querySelector('.row-account-select');
                    if (nextSelect && typeof jQuery !== 'undefined') {
                        jQuery(nextSelect).select2('open');
                    }
                }, 60);
            }
        });

        // ── Bind Remove Row button ───────────────────────────────────────────
        tr.querySelector('.remove-pg-row').addEventListener('click', () => {
            if (this.isViewMode) return;
            const rows = this.tbody.querySelectorAll('tr');
            if (rows.length > 1) {
                // Destroy select2 on account select before removing
                const sel = tr.querySelector('.row-account-select');
                if (sel && typeof jQuery !== 'undefined') {
                    if (jQuery(sel).data('select2')) jQuery(sel).select2('destroy');
                    const combo = jQuery(sel).data('customCombo');
                    if (combo && combo.destroy) combo.destroy();
                }
                tr.remove();
            } else {
                // Clear the last row instead of removing it
                if (textbox) textbox.value = '';
                if (rateInput) rateInput.value = '';
                const sel = tr.querySelector('.row-account-select');
                if (sel && typeof jQuery !== 'undefined') {
                    jQuery(sel).val(null).trigger('change');
                }
                tr.querySelectorAll(`input[name="mode_${rowIdx}"]`).forEach(r => {
                    r.checked = (r.value === 'auto');
                });
                tr.querySelectorAll(`input[name="dc_${rowIdx}"]`).forEach(r => {
                    r.checked = (r.value === 'D');
                });
            }
            if (this.tbody) this.tbody.dispatchEvent(new Event('input', { bubbles: true }));
        });

        // ── Append to DOM first (Select2 requires element to be in DOM) ──────
        this.tbody.appendChild(tr);

        // ── View mode: disable everything ────────────────────────────────────
        if (this.isViewMode) {
            tr.querySelectorAll('input, select').forEach(el => {
                el.disabled = true;
                el.style.background = '#f3f4f6';
                el.style.color = '#6b7280';
            });
            tr.querySelectorAll('.add-pg-row, .remove-pg-row').forEach(btn => {
                btn.style.setProperty('display', 'none', 'important');
            });
        }

        // ── Initialize Select2 on the Account Name dropdown ──────────────────
        const accountSelect = tr.querySelector('.row-account-select');
        if (accountSelect && typeof jQuery !== 'undefined') {
            jQuery(accountSelect).select2({
                theme: 'bootstrap-5',
                placeholder: '-- Select Account --',
                allowClear: true,
                ajax: {
                    url: '/api/accountmaster-search/',
                    dataType: 'json',
                    delay: 250,
                    data: function (params) {
                        return { q: params.term || '', page: params.page || 1 };
                    },
                    processResults: function (data) {
                        const items = (data.results || data.data || data || []).map(item => ({
                            id:   item.id || item.pk,
                            text: item.text || item.Account_Name || item.display_name || item.name || String(item.id)
                        }));
                        
                        // Add the "Add New" option at the top
                        items.unshift({
                            id: 'ADD_NEW',
                            text: 'Add New Account',
                            isNew: true
                        });

                        return { results: items };
                    },
                    cache: true
                },
                templateResult: function(item) {
                    if (item.isNew) {
                        return jQuery('<span class="fw-bold d-flex align-items-center gap-2" style="font-size: 13px; padding: 2px 0; color: inherit;"><i class="bi bi-plus-circle-fill text-success"></i> ' + item.text + '</span>');
                    }
                    return item.text;
                },
                width: '100%',
                dropdownParent: document.body
            });

            // Handle "Add New" selection robustly
            jQuery(accountSelect).on('change', function () {
                if (this.value === 'ADD_NEW') {
                    // Close the Select2 dropdown explicitly to prevent glitching
                    jQuery(this).select2('close');
                    
                    // Clear the selection so 'ADD_NEW' isn't left selected
                    jQuery(this).val(null).trigger('change.select2');
                    
                    // Set the global reference for the modal save handler
                    window._currentAccountMasterSelect = this;
                    
                    // Open the modal
                    const modalEl = document.getElementById('createAccountMasterModal');
                    if (modalEl) {
                        try {
                            let modalInstance = bootstrap.Modal.getInstance(modalEl);
                            if (!modalInstance) {
                                modalInstance = new bootstrap.Modal(modalEl);
                            }
                            modalInstance.show();
                        } catch (err) {
                            console.error('Error opening modal:', err);
                        }
                    } else {
                        console.error('createAccountMasterModal not found in DOM');
                    }
                }
            });

            // Force Select2 to always open downwards
            jQuery(accountSelect).on('select2:open', function() {
                setTimeout(function() {
                    const $select = jQuery(accountSelect).next('.select2-container');
                    const $dropdown = jQuery('.select2-container--open').not($select);
                    
                    if ($dropdown.length && $dropdown.hasClass('select2-container--above')) {
                        const offset = $select.offset();
                        const height = $select.outerHeight();
                        
                        $dropdown.removeClass('select2-container--above').addClass('select2-container--below');
                        $dropdown.find('.select2-dropdown--above').removeClass('select2-dropdown--above').addClass('select2-dropdown--below');
                        
                        $dropdown.css({
                            top: (offset.top + height) + 'px',
                            bottom: 'auto'
                        });
                    }
                }, 0);
            });

            if (this.isViewMode) {
                jQuery(accountSelect).prop('disabled', true);
            }

            // Pre-select if data available
            if (data.account_display && data.account_display.id) {
                const d = data.account_display;
                const opt = new Option(d.text, String(d.id), true, true);
                jQuery(accountSelect).append(opt).trigger('change');
            } else if (data.ChargeAccountID) {
                // Fallback: just set by ID
                const opt = new Option(String(data.ChargeAccountID), String(data.ChargeAccountID), true, true);
                jQuery(accountSelect).append(opt).trigger('change');
            }
        }

        return tr;
    }

    // ─── Collect all row data for submission ──────────────────────────────────

    getAllRowData() {
        const rows = this.tbody.querySelectorAll('tr');
        const data = [];
        rows.forEach(tr => {
            const textbox     = tr.querySelector('.row-textbox');
            const rateInput   = tr.querySelector('.row-rate');
            const accountSel  = tr.querySelector('.row-account-select');

            const rate        = parseFloat(rateInput ? rateInput.value : '');
            const accountVal  = accountSel ? accountSel.value : '';

            // Determine auto/manual selection
            const modeChecked = tr.querySelector('input[class*="row-mode"]:checked');
            const modeVal     = modeChecked ? modeChecked.value : 'auto';

            // Determine D/C selection
            const dcChecked   = tr.querySelector('input[class*="row-dc"]:checked');
            const dcVal       = dcChecked ? dcChecked.value : 'D';

            // Check if rate is valid based on mode
            const isValidRate = modeVal === 'auto' ? (!isNaN(rate) && rate > 0) : (!isNaN(rate) && rate >= 0);

            // Only include rows that have at least an account or a valid rate
            if (accountVal || isValidRate) {
                data.push({
                    ChargeAccountID: accountVal || null,
                    ChargesName:     textbox ? (textbox.value || '') : '',
                    Auto_Y_Manual_N: modeVal === 'auto',
                    Debit_D_Credit_C: dcVal,
                    Rate:            isNaN(rate) ? 0 : rate
                });
            }
        });
        return data;
    }

    // ─── Clear the table body ────────────────────────────────────────────────

    clearAll() {
        // Destroy all Select2 instances first
        if (typeof jQuery !== 'undefined') {
            this.tbody.querySelectorAll('.row-account-select').forEach(sel => {
                if (jQuery(sel).data('select2')) jQuery(sel).select2('destroy');
            });
        }
        this.tbody.innerHTML = '';
    }
}
