import { domUtils } from '../utils/dom.js?v=147';
import { formatter } from '../utils/formatter.js?v=147';
import { SubsectionB2Row } from './subsection-b2-row.js?v=147';

// ─────────────────────────────────────────────────────────────────────────────
// SubsectionB2Table — Grid manager for Sub Section B-2 transaction table.
//
// Cloned from transaction-table.js and adapted for B-2.
// Manages the Add Row button, running total calculation,
// row index numbering, data load (edit mode), and data extraction.
// ─────────────────────────────────────────────────────────────────────────────

export class SubsectionB2Table {

    constructor() {
        this.totalDisplay  = domUtils.getElement('#totalAmountDisplay');
        this.addRowBtn     = domUtils.getElement('#addRowBtn');

        // Instantiate the row builder
        this.rowManager = new SubsectionB2Row(
            '#rowTemplate',
            '#dynamicTableBody',
            () => this.calculateTotal(),
            () => this.updateRowIndices()
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

    // ─── Total Calculation ────────────────────────────────────────────────────

    calculateTotal() {
        const rows   = domUtils.getAllElements('#dynamicTableBody tr');
        let   total  = 0;

        rows.forEach(row => {
            const amountInput = row.querySelector('.row-amount');
            if (amountInput) {
                const val = parseFloat(amountInput.value);
                if (!isNaN(val) && val > 0) total += val;
            }
        });

        if (this.totalDisplay) {
            this.totalDisplay.value = formatter.formatCurrency(total);
        }

        return total;
    }

    // ─── Row Index Renumbering ─────────────────────────────────────────────────

    updateRowIndices() {
        const rows = domUtils.getAllElements('#dynamicTableBody tr');
        rows.forEach((row, i) => {
            const indexCell = row.querySelector('.row-index');
            if (indexCell) indexCell.textContent = i + 1;
        });
    }

    // ─── Edit Mode Data Load ──────────────────────────────────────────────────

    /**
     * Load an array of transaction rows into the table (edit mode).
     * Clears existing rows first, then creates one row per record.
     *
     * @param {Array} transactions - Detail rows from the API GET response
     */
    loadData(transactions = []) {
        this.rowManager.clearAll();

        if (!transactions || transactions.length === 0) {
            this.rowManager.createRow();
            this.updateRowIndices();
            this.calculateTotal();
            return;
        }

        transactions.forEach(tran => {
            this.rowManager.createRow(tran);
        });

        this.updateRowIndices();
        this.calculateTotal();
    }

    // ─── Data Extraction ──────────────────────────────────────────────────────

    /**
     * Collect validated row data from all table rows.
     * @returns {Array} Array of row data objects ready for API submission
     */
    getData() {
        return this.rowManager.getAllRowData();
    }
}
