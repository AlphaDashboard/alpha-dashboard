import { domUtils } from '../utils/dom.js?v=147';
import { initializeSearchableDropdown } from '../../common-dropdown.js?v=147';
import { CustomMultiColumnCombo } from '../../custom-combo.js?v=147';

export class TransactionRow {
    constructor(templateId, tbodyId, onAmountChange, onRowRemoved, isViewMode = false) {
        this.template = domUtils.getElement(templateId);
        this.tbody = domUtils.getElement(tbodyId);
        this.onAmountChange = onAmountChange;
        this.onRowRemoved = onRowRemoved;
        this.isViewMode = isViewMode;
    }

    createRow(data = {}) {
        const clone = this.template.content.cloneNode(true);
        const tr = clone.querySelector('tr');

        // Populate simple text/number fields where data exists
        if (data.remarks)    tr.querySelector('.row-remarks').value    = data.remarks;
        if (data.chq_no)     tr.querySelector('.row-chq-no').value     = data.chq_no;
        if (data.chq_date)   tr.querySelector('.row-chq-date').value   = String(data.chq_date).slice(0, 10);
        if (data.payee_bank) tr.querySelector('.row-payee-bank').value = data.payee_bank;
        if (data.amount)     tr.querySelector('.row-amount').value     = data.amount;

        const alphaSelect = tr.querySelector('.row-account-master');

        // Bind amount change event
        const amountInput = tr.querySelector('.row-amount');
        amountInput.addEventListener('input', () => this.onAmountChange());

        // Bind remove row button
        const removeBtn = tr.querySelector('.remove-row-btn');
        removeBtn.addEventListener('click', () => {
            if (this.tbody.querySelectorAll('tr').length > 1) {
                if (typeof jQuery !== 'undefined' && alphaSelect) {
                    const combo = jQuery(alphaSelect).data('customCombo');
                    if (combo) {
                        combo.destroy();
                    } else if (jQuery(alphaSelect).data('select2')) {
                        jQuery(alphaSelect).select2('destroy');
                    }
                }
                tr.remove();
                this.onAmountChange();
                if (this.onRowRemoved) this.onRowRemoved();
            } else {
                tr.querySelectorAll('input').forEach(input => input.value = '');
                if (typeof jQuery !== 'undefined' && alphaSelect) {
                    jQuery(alphaSelect).val(null).trigger('change');
                }
                this.onAmountChange();
            }
        });

        // Append to DOM before initializing Select2 (Select2 requires element to be in DOM)
        this.tbody.appendChild(tr);

        // View mode locking for dynamic rows
        if (this.isViewMode) {
            tr.querySelectorAll('input, select, textarea').forEach(el => {
                el.disabled = true;
                el.classList.add('bg-light');
            });
            tr.querySelectorAll('.add-row-btn, .remove-row-btn').forEach(btn => {
                btn.style.setProperty('display', 'none', 'important');
            });
        }

        // Initialize Custom Combo on the account dropdown
        if (typeof jQuery !== 'undefined') {
            new CustomMultiColumnCombo(alphaSelect, '/api/accountmaster-search/', 'Search Account...', {
                enableAddNew: !this.isViewMode,
                modalId: 'createAccountMasterModal',
                secondColumnHeader: 'Account Name',
                showBalanceInTextbox: false
            });

            if (this.isViewMode) {
                jQuery(alphaSelect).prop('disabled', true).trigger('change');
            }

            // Pre-select account_master using display data returned by the API.
            // We mark the element with data-hydrating so the form's 'change'
            // listener can skip validation during this programmatic assignment.
            if (data.account_master_display && data.account_master_display.id) {
                const display = data.account_master_display;
                alphaSelect.dataset.hydrating = '1';
                const preselect = new Option(display.text, String(display.id), true, true);
                jQuery(alphaSelect).append(preselect).trigger('change');
                delete alphaSelect.dataset.hydrating;
            }
        }

        return tr;
    }

    getAllRowData() {
        const rows = this.tbody.querySelectorAll('tr');
        const data = [];
        rows.forEach(tr => {
            const amount = parseFloat(tr.querySelector('.row-amount').value);
            const alphaSelect = tr.querySelector('.row-account-master');
            const alphaGroup = alphaSelect ? alphaSelect.value : null;

            if (!isNaN(amount) && amount > 0 && alphaGroup) {
                data.push({
                    account_master: alphaGroup,
                    remarks: tr.querySelector('.row-remarks').value || '',
                    chq_no: tr.querySelector('.row-chq-no').value || null,
                    chq_date: tr.querySelector('.row-chq-date').value || null,
                    payee_bank: tr.querySelector('.row-payee-bank').value || null,
                    amount: amount
                });
            }
        });
        return data;
    }

    clearAll() {
        // Only clear rows; loadData will create fresh rows after
        this.tbody.innerHTML = '';
    }
}
