import { domUtils } from '../utils/dom.js?v=147';
import { formatter } from '../utils/formatter.js?v=147';
import { SectionCRow } from './section-c-row.js?v=147';

export class SectionCTable {
    constructor(isViewMode = false) {
        this.isViewMode = isViewMode;
        this.totalElement = domUtils.getElement('#totalAmountDisplay');
        this.addBtn = domUtils.getElement('#addRowBtn');
        
        this.rowManager = new SectionCRow(
            '#rowTemplate', 
            '#dynamicTableBody',
            () => this.calculateTotal(),
            () => this.updateRowIndices(),
            this.isViewMode
        );

        this.bindEvents();
    }

    bindEvents() {
        const tbody = domUtils.getElement('#dynamicTableBody');
        if (tbody) {
            tbody.addEventListener('click', (e) => {
                const addBtn = e.target.closest('.add-row-btn');
                if (addBtn) {
                    const tr = this.rowManager.createRow();
                    this.updateRowIndices();
                    setTimeout(() => {
                        const alphaSelect = tr.querySelector('.row-account-master');
                        if (alphaSelect && typeof jQuery !== 'undefined') {
                            jQuery(alphaSelect).select2('open');
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
        console.log("SectionCTable calculateTotal() called");
        let total = 0;
        const rows = document.querySelectorAll('#dynamicTableBody tr');
        console.log("SectionCTable found rows:", rows.length);
        rows.forEach((tr, index) => {
            const amountInput = tr.querySelector('.row-amount');
            if (amountInput) {
                const val = parseFloat(amountInput.value);
                console.log(`SectionCTable Row ${index + 1} amount value:`, amountInput.value, "parsed:", val);
                if (!isNaN(val) && val > 0) total += val;
            }
        });
        console.log("SectionCTable calculated total sum:", total);
        
        if (this.totalElement) {
            this.totalElement.value = formatter.formatCurrency(total);
            console.log("SectionCTable updated totalElement value to:", this.totalElement.value);
        } else {
            console.warn("SectionCTable totalElement not found!");
        }
        
        return total;
    }

    loadData(transactions) {
        this.rowManager.clearAll();
        domUtils.getElement('#dynamicTableBody').innerHTML = '';
        
        if (transactions && transactions.length > 0) {
            transactions.forEach(t => this.rowManager.createRow(t));
        } else {
            this.rowManager.createRow();
        }
        this.updateRowIndices();
        this.calculateTotal();
    }

    getData() {
        return this.rowManager.getAllRowData();
    }
}
