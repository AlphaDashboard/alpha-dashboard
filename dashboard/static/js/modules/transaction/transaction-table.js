import { domUtils } from '../utils/dom.js?v=147';
import { formatter } from '../utils/formatter.js?v=147';
import { TransactionRow } from './transaction-row.js?v=147';
import { notifications } from '../utils/notifications.js?v=147';

export class TransactionTable {
    constructor(isViewMode = false) {
        this.isViewMode = isViewMode;
        this.totalElement = domUtils.getElement('#totalAmountDisplay');
        this.addBtn = domUtils.getElement('#addRowBtn');

        this.rowManager = new TransactionRow(
            '#rowTemplate',
            '#dynamicTableBody',
            () => this.calculateTotal(),
            () => this.updateRowIndices(),
            this.isViewMode
        );

        this.bindEvents();
    }

    bindEvents() {
        // Hide the global add button in view mode
        if (this.isViewMode && this.addBtn) {
            this.addBtn.style.setProperty('display', 'none', 'important');
        }

        const tbody = domUtils.getElement('#dynamicTableBody');
        if (tbody) {
            tbody.addEventListener('click', (e) => {
                // Block ALL row additions in view mode
                if (this.isViewMode) return;

                const addBtn = e.target.closest('.add-row-btn');
                if (addBtn) {
                    // In case of new creation or edit, if account name is empty, next row should not be inserted
                    const currentRow = addBtn.closest('tr');
                    const alphaSelect = currentRow ? currentRow.querySelector('.row-account-master') : null;
                    if (alphaSelect && (!alphaSelect.value || alphaSelect.value.trim() === '')) {
                        notifications.showError('Please select an Account Name before adding a new row.');
                        
                        // Highlight Select2 dropdown container visually
                        const select2Container = currentRow.querySelector('.select2-container');
                        if (select2Container) {
                            const selection = select2Container.querySelector('.select2-selection');
                            if (selection) {
                                selection.classList.add('is-invalid-erp');
                                setTimeout(() => selection.classList.remove('is-invalid-erp'), 3000);
                            }
                        }
                        return;
                    }

                    const tr = this.rowManager.createRow();
                    this.updateRowIndices();
                    setTimeout(() => {
                        const nextSelect = tr.querySelector('.row-account-master');
                        if (nextSelect && typeof jQuery !== 'undefined') {
                            jQuery(nextSelect).select2('open');
                        }
                    }, 50);
                }
            });
        }
    }

    updateRowIndices() {
        const rows = document.querySelectorAll('#dynamicTableBody tr');
        rows.forEach((tr, index) => {
            const indexTd = tr.querySelector('.row-index');
            if (indexTd) {
                indexTd.innerText = index + 1;
            }
        });
    }

    calculateTotal() {
        console.log("TransactionTable calculateTotal() called");
        let total = 0;
        const rows = document.querySelectorAll('#dynamicTableBody tr');
        console.log("Found rows in calculateTotal:", rows.length);
        rows.forEach((tr, index) => {
            const amountInput = tr.querySelector('.row-amount');
            if (amountInput) {
                const val = parseFloat(amountInput.value);
                console.log(`Row ${index + 1} amount value:`, amountInput.value, "parsed:", val);
                if (!isNaN(val) && val > 0) total += val;
            }
        });

        console.log("Calculated total sum:", total);
        if (this.totalElement) {
            this.totalElement.value = formatter.formatCurrency(total);
            console.log("Updated totalElement value to:", this.totalElement.value);
        } else {
            console.warn("totalElement not found!");
        }

        return total;
    }

    loadData(transactions) {
        this.rowManager.clearAll();
        domUtils.getElement('#dynamicTableBody').innerHTML = '';

        if (transactions && transactions.length > 0) {
            transactions.forEach(t => this.rowManager.createRow(t));
        } else if (!this.isViewMode) {
            // Only create a blank default row in create/edit mode
            this.rowManager.createRow();
        }
        this.updateRowIndices();
        this.calculateTotal();
    }

    getData() {
        return this.rowManager.getAllRowData();
    }
}
