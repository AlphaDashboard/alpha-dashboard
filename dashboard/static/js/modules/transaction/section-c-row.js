import { domUtils } from '../utils/dom.js?v=147';
import { CustomMultiColumnCombo } from '../../custom-combo.js?v=147';

export class SectionCRow {
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

        // Populate fields if data exists
        if (data.remarks && tr.querySelector('.row-remarks')) tr.querySelector('.row-remarks').value = data.remarks;
        if (data.amount && tr.querySelector('.row-amount')) tr.querySelector('.row-amount').value = data.amount;

        const alphaSelect = tr.querySelector('.row-account-master');

        // Bind events
        const amountInput = tr.querySelector('.row-amount');
        if (amountInput) {
            amountInput.addEventListener('input', () => this.onAmountChange());
        }

        const removeBtn = tr.querySelector('.remove-row-btn');
        if (removeBtn) {
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
        }

        // Append to DOM FIRST before initializing Select2
        this.tbody.appendChild(tr);

        // Initialize Custom Combo on the account dropdown (must happen after appending to DOM)
        if (alphaSelect && typeof jQuery !== 'undefined') {
            new CustomMultiColumnCombo(alphaSelect, '/api/accountmaster-search/', 'Search Account...', {
                enableAddNew: !this.isViewMode,
                modalId: 'createAccountMasterModal',
                secondColumnHeader: 'Account Name',
                showBalanceInTextbox: false
            });

            if (this.isViewMode) {
                jQuery(alphaSelect).prop('disabled', true).trigger('change');
            }

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
            const amountInput = tr.querySelector('.row-amount');
            const amount = amountInput ? parseFloat(amountInput.value) : NaN;
            const alphaSelect = tr.querySelector('.row-account-master');
            const alphaGroup = alphaSelect ? alphaSelect.value : null;

            if (!isNaN(amount) && amount > 0 && alphaGroup) {
                const remarksEl = tr.querySelector('.row-remarks');
                data.push({
                    account_master: alphaGroup,
                    remarks: remarksEl ? remarksEl.value : '',
                    amount: amount
                });
            }
        });
        return data;
    }

    clearAll() {
        this.tbody.innerHTML = '';
        this.createRow();
    }
}
