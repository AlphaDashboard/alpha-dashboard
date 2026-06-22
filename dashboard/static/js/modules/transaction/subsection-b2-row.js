import { domUtils } from '../utils/dom.js?v=147';
import { initializeSearchableDropdown } from '../../common-dropdown.js?v=147';

// ─────────────────────────────────────────────────────────────────────────────
// SubsectionB2Row — Row builder for Sub Section B-2 transaction table.
//
// Cloned from transaction-row.js and adapted for B-2 column set:
//   [#] [Account (Select2)] [Amount] [Remarks] [Cost Center] [Delete]
//
// Key differences from Bank Transaction row:
//   - No chq_no, chq_date, payee_bank columns
//   - Adds cost_center text input
//   - getAllRowData() returns cost_center instead of chq fields
//
// Design rules (identical to baseline):
//   - DOM append MUST happen BEFORE Select2 initialisation
//   - Hydration lock (dataset.hydrating) suppresses validation during edit-mode load
//   - Only one row can remain when deleting the last row (clear, don't remove)
// ─────────────────────────────────────────────────────────────────────────────

export class SubsectionB2Row {

    /**
     * @param {string}   templateSelector - CSS selector for <template id="rowTemplate">
     * @param {string}   tbodySelector    - CSS selector for the <tbody>
     * @param {Function} onAmountChange   - Callback fired when any row amount changes
     * @param {Function} onRowRemoved     - Callback fired after a row is removed
     */
    constructor(templateSelector, tbodySelector, onAmountChange, onRowRemoved) {
        this.template       = domUtils.getElement(templateSelector);
        this.tbody          = domUtils.getElement(tbodySelector);
        this.onAmountChange = onAmountChange || (() => {});
        this.onRowRemoved   = onRowRemoved   || (() => {});
    }

    // ─── Public API ───────────────────────────────────────────────────────────

    /**
     * Clone the row template, populate it with data, append to tbody,
     * then initialise Select2. Order matters: DOM first, Select2 second.
     *
     * @param {object} data - Optional pre-fill data (edit mode)
     */
    createRow(data = {}) {
        if (!this.template) {
            console.error('SubsectionB2Row: #rowTemplate not found');
            return;
        }

        const clone = document.importNode(this.template.content, true);
        const tr    = clone.querySelector('tr');
        if (!tr) return;

        // ── Populate inputs from data (edit mode) ──────────────────────────
        const remarksInput   = tr.querySelector('.row-remarks');
        const chqNoInput     = tr.querySelector('.row-chq-no');
        const chqDateInput   = tr.querySelector('.row-chq-date');
        const payeeBankInput = tr.querySelector('.row-payee-bank');
        const amountInput    = tr.querySelector('.row-amount');
        const alphaSelect    = tr.querySelector('.row-account-master');

        if (remarksInput   && data.remarks)    remarksInput.value    = data.remarks;
        if (chqNoInput     && data.chq_no)     chqNoInput.value      = data.chq_no;
        if (chqDateInput   && data.chq_date)   chqDateInput.value    = String(data.chq_date).slice(0, 10);
        if (payeeBankInput && data.payee_bank) payeeBankInput.value  = data.payee_bank;
        if (amountInput    && data.amount)     amountInput.value     = data.amount;

        // ── Bind amount input ──────────────────────────────────────────────
        if (amountInput) {
            amountInput.addEventListener('input', () => this.onAmountChange());
        }

        // ── Bind delete button ─────────────────────────────────────────────
        const deleteBtn = tr.querySelector('.remove-row-btn');
        if (deleteBtn) {
            deleteBtn.addEventListener('click', () => {
                const allRows = this.tbody.querySelectorAll('tr');
                if (allRows.length <= 1) {
                    // Last row — clear inputs, reset Select2 instead of removing
                    if (remarksInput)   remarksInput.value    = '';
                    if (chqNoInput)     chqNoInput.value      = '';
                    if (chqDateInput)   chqDateInput.value    = '';
                    if (payeeBankInput) payeeBankInput.value  = '';
                    if (amountInput)    amountInput.value     = '';
                    if (alphaSelect) {
                        jQuery(alphaSelect).val(null).trigger('change');
                    }
                    this.onAmountChange();
                } else {
                    // Destroy Select2 before removing from DOM (prevents memory leak)
                    if (alphaSelect && jQuery(alphaSelect).data('select2')) {
                        jQuery(alphaSelect).select2('destroy');
                    }
                    tr.remove();
                    this.onRowRemoved();
                    this.onAmountChange();
                }
            });
        }

        // ── Append to DOM BEFORE Select2 init (critical order) ────────────
        this.tbody.appendChild(tr);

        // ── Initialise Select2 on account_master column ───────────────────────
        if (alphaSelect) {
            // Hydration lock: pre-select option without triggering validation
            if (data.account_master_display) {
                alphaSelect.dataset.hydrating = '1';
                const opt = new Option(
                    data.account_master_display.text,
                    data.account_master_display.id,
                    true,
                    true
                );
                jQuery(alphaSelect).append(opt).trigger('change');
                delete alphaSelect.dataset.hydrating;
            }

            initializeSearchableDropdown(alphaSelect, '/api/accountmaster-search/', 'Search Account...', {
                dropdownParent: jQuery('body'),
                enableAddNew:   true,
                modalId:        'addAccountMasterModal',
            });
        }

        return tr;
    }

    /**
     * Collect data from all rows in the tbody.
     * Skips rows where amount is empty or zero AND no account_master group selected.
     *
     * @returns {Array<object>} Array of row data objects
     */
    getAllRowData() {
        const rows = this.tbody ? this.tbody.querySelectorAll('tr') : [];
        const result = [];

        rows.forEach(row => {
            const alphaSelect     = row.querySelector('.row-account-master');
            const amountInput     = row.querySelector('.row-amount');
            const remarksInput    = row.querySelector('.row-remarks');
            const chqNoInput      = row.querySelector('.row-chq-no');
            const chqDateInput    = row.querySelector('.row-chq-date');
            const payeeBankInput  = row.querySelector('.row-payee-bank');

            const alphaVal  = alphaSelect  ? alphaSelect.value               : '';
            const amountVal = amountInput  ? parseFloat(amountInput.value)   : 0;
            const remarks   = remarksInput ? remarksInput.value.trim()       : '';
            const chqNo     = chqNoInput   ? chqNoInput.value.trim()         : '';
            const chqDate   = chqDateInput ? chqDateInput.value              : '';
            const payeeBank = payeeBankInput ? payeeBankInput.value.trim()   : '';

            // Only include rows that have both an account and a non-zero amount
            if (alphaVal && !isNaN(amountVal) && amountVal > 0) {
                result.push({
                    account_master:  alphaVal,
                    amount:       amountVal,
                    remarks:      remarks     || null,
                    chq_no:       chqNo       || null,
                    chq_date:     chqDate     || null,
                    payee_bank:   payeeBank   || null,
                    cost_center:  null,
                });
            }
        });

        return result;
    }

    /**
     * Remove all rows from the tbody. Used before loading edit-mode data.
     */
    clearAll() {
        if (!this.tbody) return;
        // Destroy all Select2 instances before clearing (prevents memory leaks)
        this.tbody.querySelectorAll('.row-account-master').forEach(sel => {
            if (jQuery(sel).data('select2')) {
                jQuery(sel).select2('destroy');
            }
        });
        this.tbody.innerHTML = '';
    }
}
