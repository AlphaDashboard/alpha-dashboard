import { domUtils } from '../utils/dom.js?v=147';
import { SubsectionYRow } from './subsection-y-row.js?v=147';
import { notifications } from '../utils/notifications.js?v=147';

export class SubsectionYTable {
    constructor(isViewMode = false) {
        this.isViewMode = isViewMode;

        this.rowManager = new SubsectionYRow(
            '#pgRowTemplate',
            '#pgTableBody',
            this.isViewMode
        );

        this.bindEvents();
    }

    // ─── Event Binding ───────────────────────────────────────────────────────

    bindEvents() {
        if (this.isViewMode) return;  // No interaction in view mode

        // The add button is inline per-row, so we don't need a global add button event.
        // However, keep a body-level delegation in case needed.
        const tbody = domUtils.getElement('#pgTableBody');
        if (!tbody) return;
    }

    // ─── Load data from API response into the table ──────────────────────────

    loadData(transactions) {
        this.rowManager.clearAll();
        const tbody = domUtils.getElement('#pgTableBody');
        if (tbody) tbody.innerHTML = '';

        if (transactions && transactions.length > 0) {
            transactions.forEach(t => this.rowManager.createRow(t));
        } else if (!this.isViewMode) {
            // Start with one blank row in create/edit mode
            this.rowManager.createRow();
        }
    }

    // ─── Retrieve all row data for submission ────────────────────────────────

    getData() {
        return this.rowManager.getAllRowData();
    }

    // ─── Clear all rows ──────────────────────────────────────────────────────

    clearAll() {
        this.rowManager.clearAll();
    }
}
