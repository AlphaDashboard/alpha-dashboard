/**
 * Custom Multi-Column Combo Dropdown Component
 * Replaces traditional Select2 elements with an input-driven dynamic HTML table.
 */
export class CustomMultiColumnCombo {
    constructor(selectElement, ajaxUrl, placeholder, options = {}) {
        this.$select = jQuery(selectElement);
        if (!this.$select.length) return;

        // Prevent double initialization
        if (this.$select.data('customCombo')) {
            return this.$select.data('customCombo');
        }

        this.ajaxUrl = ajaxUrl;
        this.placeholder = placeholder || '';
        this.options = options;

        this.results = [];
        this.highlightedIndex = -1; // -1 means none, -2 means the "+ Add New" button
        this.searchTimeout = null;
        this.isOpen = false;
        this.lastSelectedText = '';

        this.init();
        this.$select.data('customCombo', this);
    }

    init() {
        // Hide original select element
        this.$select.hide().addClass('custom-combo-hidden');

        // Create container wrapper
        this.$container = jQuery('<div class="custom-combo-container"></div>');
        this.$select.after(this.$container);

        // Fetch starting selected text if any
        const selectedOpt = this.$select.find('option:selected');
        if (selectedOpt.length && selectedOpt.val()) {
            this.lastSelectedText = selectedOpt.text();
        }

        // Create text input
        this.$input = jQuery(`<input type="text" class="form-control custom-combo-input" placeholder="${this.placeholder}" autocomplete="off">`);
        if (this.$select.hasClass('erp-table-control')) {
            this.$input.addClass('erp-table-control');
        }
        if (this.$select.hasClass('erp-input')) {
            this.$input.addClass('erp-input');
        }
        if (this.$select.hasClass('erp-floating-input')) {
            this.$input.addClass('erp-floating-input');
        }
        this.$input.val(this.lastSelectedText);
        
        // Handle disabled state
        if (this.$select.prop('disabled')) {
            this.$input.prop('disabled', true);
        }

        this.$container.append(this.$input);

        // Build dropdown menu popup (unattached initially)
        const isBankAccount = this.options.isBankAccount !== undefined ? this.options.isBankAccount : (this.$select.attr('id') === 'bankAccount');
        const col1Header = isBankAccount ? 'Bank Name' : 'Account Name';
        const col2Header = isBankAccount ? 'Bank Account Number' : 'Display Name';

        this.$dropdown = jQuery(`
            <div class="custom-combo-dropdown ${isBankAccount ? 'bank-account-dropdown' : ''}">
                ${this.options.enableAddNew ? `
                    <div class="custom-combo-add-new" id="custom-combo-add-new-btn">
                        <i class="bi bi-plus-lg"></i>
                        <span>${this.options.addNewText || 'Add New Account'}</span>
                    </div>
                ` : ''}
                <div class="custom-combo-header">
                    <div style="width: 6%; min-width: 50px;">Code</div>
                    <div style="width: 49%;">${col1Header}</div>
                    <div style="width: 30%;">${col2Header}</div>
                    <div style="width: 15%;" class="text-end">Current Balance</div>
                </div>
                <div class="custom-combo-results"></div>
                <div class="custom-combo-footer" style="padding: 4px 10px; font-size: 9px; font-weight: 500; color: #94a3b8; background: #f8fafc; border-top: 1px solid #e2e8f0; text-align: center; box-sizing: border-box; letter-spacing: 0.02em;">
                    <span class="custom-combo-match-count">0 records found</span> • Use arrow keys <span style="font-weight: 700;">↑↓</span> to navigate
                </div>
            </div>
        `);

        this.$resultsContainer = this.$dropdown.find('.custom-combo-results');
        this.$addNewBtn = this.$dropdown.find('.custom-combo-add-new');

        this.bindEvents();
    }

    bindEvents() {
        // Click/focus to open
        this.$input.on('focus click', (e) => {
            e.stopPropagation();
            this.open();
            this.$input.select();
        });

        // Search on input change
        this.$input.on('input', () => {
            const val = this.$input.val().trim();
            if (val === '') {
                this.lastSelectedText = '';
                if (this.$select.val() !== '') {
                    this.$select.val('').trigger('change');
                }
            }
            this.highlightedIndex = -1;
            
            if (!this.isOpen) {
                this.open(true);
            }

            clearTimeout(this.searchTimeout);
            this.searchTimeout = setTimeout(() => {
                this.search(val);
            }, 150);
        });

        // Prevent blur closing before selection click completes
        this.$dropdown.on('mousedown', (e) => {
            e.preventDefault();
        });

        // Click on results
        this.$resultsContainer.on('click', '.custom-combo-item', (e) => {
            const index = parseInt(jQuery(e.currentTarget).data('index'));
            this.selectItem(index);
        });

        // Click "+ Add New"
        if (this.$addNewBtn.length) {
            this.$addNewBtn.on('click', () => {
                this.triggerAddNew();
            });
        }

        // Close when clicking outside
        jQuery(document).on('click.customCombo_' + this.$select.attr('id'), (e) => {
            if (!this.$container.has(e.target).length && !this.$dropdown.has(e.target).length) {
                this.close();
            }
        });

        // Keydown keyboard controls
        this.$input.on('keydown', (e) => this.handleKeyDown(e));

        // Sync changes from original select (e.g. dynamic reset, modal additions)
        this.$select.on('change.customCombo', () => {
            const opt = this.$select.find('option:selected');
            if (opt.length && opt.val()) {
                this.lastSelectedText = opt.text();
                this.$input.val(this.lastSelectedText);
            } else {
                this.lastSelectedText = '';
                this.$input.val('');
            }
        });
    }

    open(skipSearch = false) {
        if (this.isOpen) return;
        
        // Close all other open custom combos first
        jQuery('.custom-combo-dropdown.show').removeClass('show');
        
        this.isOpen = true;
        this.highlightedIndex = -1;

        // Append dropdown to body on open to prevent clipping by scrollable parents
        if (this.$dropdown.parent()[0] !== document.body) {
            jQuery('body').append(this.$dropdown);
        }

        this.reposition();
        this.$dropdown.addClass('show');
        
        if (!skipSearch) {
            const query = this.$input.val().trim();
            const searchQuery = (query === this.lastSelectedText) ? '' : query;
            this.search(searchQuery);
        }

        // Recalculate position on scroll or window resize
        jQuery(window).on('scroll.customCombo_' + this.$select.attr('id') + ' resize.customCombo_' + this.$select.attr('id'), () => {
            this.reposition();
        });
    }

    reposition() {
        if (!this.isOpen) return;

        const offset = this.$input.offset();
        const height = this.$input.outerHeight();
        let width = this.$input.outerWidth();

        // If this is inside a table row cell, extend width to cover the target cell (e.g. Amount or Amount A)
        const $td = this.$input.closest('td');
        if ($td.length) {
            const $tr = $td.closest('tr');
            let $targetTd = null;
            if ($tr.length) {
                const $rowAmount = $tr.find('.row-amount');
                if ($rowAmount.length) {
                    $targetTd = $rowAmount.closest('td');
                } else {
                    const $amountA = $tr.find('.amount-a-input');
                    if ($amountA.length) {
                        $targetTd = $amountA.closest('td');
                    }
                }
            }

            if ($targetTd && $targetTd.length) {
                const rightEdge = $targetTd.offset().left + $targetTd.outerWidth();
                width = rightEdge - offset.left;
            } else if ($td.next().length) {
                const $nextTd = $td.next();
                const rightEdge = $nextTd.offset().left + $nextTd.outerWidth();
                width = rightEdge - offset.left;
            }
            // Allow the dropdown to extend up to the ending of the amount box as requested
            // (No Math.min cap)
        } else if (this.$select.attr('id') === 'bankAccount') {
            // Header level bank account dropdown (Subsection B & B-2)
            const $rowAmount = jQuery('.row-amount').first();
            if ($rowAmount.length) {
                const rightEdge = $rowAmount.offset().left + $rowAmount.outerWidth();
                width = rightEdge - offset.left;
            }
        }

        this.$dropdown.css({
            position: 'absolute',
            top: (offset.top + height) + 'px',
            left: offset.left + 'px',
            width: width + 'px'
        });
    }

    close() {
        if (!this.isOpen) return;
        this.isOpen = false;
        this.$dropdown.removeClass('show');

        // Unbind scroll/resize listeners
        jQuery(window).off('.customCombo_' + this.$select.attr('id'));

        // Reset text value to last selected text if user left dirty query
        const opt = this.$select.find('option:selected');
        if (opt.length && opt.val()) {
            this.$input.val(this.lastSelectedText);
        } else {
            this.$input.val('');
        }
    }

    search(query) {
        this.$resultsContainer.html('<div class="custom-combo-message"><span class="spinner-border spinner-border-sm me-2"></span>Searching...</div>');
        
        fetch(`${this.ajaxUrl}?q=${encodeURIComponent(query)}`)
            .then(res => res.json())
            .then(data => {
                this.results = data.results || [];
                this.renderResults();
            })
            .catch(err => {
                console.error("AJAX Search Failed:", err);
                this.$resultsContainer.html('<div class="custom-combo-message text-danger">Error loading data</div>');
            });
    }

    renderResults() {
        this.$resultsContainer.empty();
        if (this.results.length === 0) {
            this.$resultsContainer.html('<div class="custom-combo-message">No matches found</div>');
            const matchCountEl = this.$dropdown.find('.custom-combo-match-count');
            if (matchCountEl.length) {
                matchCountEl.text('0 records found');
            }
            return;
        }

        const matchCountEl = this.$dropdown.find('.custom-combo-match-count');
        if (matchCountEl.length) {
            matchCountEl.text(`${this.results.length} record${this.results.length === 1 ? '' : 's'} found`);
        }

        this.results.forEach((item, index) => {
            let balVal = '0.00';
            if (item.cl_bal !== undefined && item.cl_bal !== null) {
                const num = parseFloat(item.cl_bal);
                balVal = isNaN(num) ? item.cl_bal : num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
            }

            const codeText = item.code || item.groupID || '';
            const nameText = item.Account_Name || item.account_name || '';
            const dispText = item.display_name || '';
            const row = jQuery(`
                <div class="custom-combo-item" data-id="${item.id}" data-index="${index}">
                    <div style="width: 6%; min-width: 50px; color: #374151; font-weight: 600; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; padding-right: 8px;">${codeText}</div>
                    <div style="width: 49%; color: #4b5563; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; padding-right: 8px;">${nameText}</div>
                    <div style="width: 30%; color: #64748b; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; padding-right: 8px;">${dispText}</div>
                    <div style="width: 15%; text-align: right; font-weight: 600; color: #0f766e; font-variant-numeric: tabular-nums; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${balVal}</div>
                </div>
            `);
            this.$resultsContainer.append(row);
        });

        this.updateHighlightState();
    }

    selectItem(index) {
        const item = this.results[index];
        if (!item) return;

        let balVal = '0.00';
        if (item.cl_bal !== undefined && item.cl_bal !== null) {
            const num = parseFloat(item.cl_bal);
            balVal = isNaN(num) ? item.cl_bal : num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        }

        const nameText = item.Account_Name || item.account_name || '';
        let displayText;
        if (this.options.showBalanceInTextbox === true) {
            displayText = `${nameText}` + (item.display_name ? ` [${item.display_name}]` : '') + ` [Bal: ${balVal}]`;
        } else {
            displayText = `${nameText}` + (item.display_name ? ` [${item.display_name}]` : '');
        }

        // Add or update option in original select
        const existingOpt = this.$select.find(`option[value="${item.id}"]`);
        if (existingOpt.length === 0) {
            const option = new Option(displayText, item.id, true, true);
            this.$select.append(option);
        } else {
            existingOpt.text(displayText);
        }

        this.lastSelectedText = displayText;
        this.$select.val(item.id).trigger('change');
        this.close();

        // Custom onSelect callback trigger
        if (typeof this.options.onSelect === 'function') {
            this.options.onSelect(item);
        }
    }

    triggerAddNew() {
        const term = this.$input.val().trim();
        this.close();
        
        window._currentAccountMasterSelect = this.$select[0];

        const modalEl = document.getElementById(this.options.modalId || 'createAccountMasterModal');
        if (modalEl) {
            const form = modalEl.querySelector('form');
            if (form) form.reset();

            const nameInput = modalEl.querySelector('input[name="Account_Name"]') || modalEl.querySelector('input[name="account_name"]');
            if (nameInput) nameInput.value = term;

            if (typeof this.options.onModalOpen === 'function') {
                this.options.onModalOpen(modalEl, term);
            }

            const modal = new bootstrap.Modal(modalEl);
            modal.show();

            modalEl.addEventListener('shown.bs.modal', () => {
                const codeInput = modalEl.querySelector('input[name="groupID"]') || modalEl.querySelector('input[name="code"]');
                if (codeInput) codeInput.focus();
            }, { once: true });
        }
    }

    handleKeyDown(e) {
        if (!this.isOpen) {
            if (e.key === 'ArrowDown' || e.key === 'ArrowUp' || e.key === 'Enter') {
                this.open();
                e.preventDefault();
            }
            return;
        }

        const itemsCount = this.results.length;

        if (e.key === 'ArrowDown') {
            e.preventDefault();
            if (this.highlightedIndex === -1 && this.options.enableAddNew) {
                this.highlightedIndex = -2; // Highlight the Add New button first
            } else if (this.highlightedIndex === -2) {
                this.highlightedIndex = 0; // Go to first result
            } else {
                this.highlightedIndex = (this.highlightedIndex + 1) % itemsCount;
            }
            this.updateHighlightState();
        } 
        else if (e.key === 'ArrowUp') {
            e.preventDefault();
            if (this.highlightedIndex === 0) {
                this.highlightedIndex = this.options.enableAddNew ? -2 : itemsCount - 1;
            } else if (this.highlightedIndex === -2) {
                this.highlightedIndex = -1;
            } else if (this.highlightedIndex === -1) {
                this.highlightedIndex = itemsCount - 1;
            } else {
                this.highlightedIndex = (this.highlightedIndex - 1 + itemsCount) % itemsCount;
            }
            this.updateHighlightState();
        } 
        else if (e.key === 'Enter') {
            e.preventDefault();
            if (this.highlightedIndex === -2) {
                this.triggerAddNew();
            } else if (this.highlightedIndex >= 0 && this.highlightedIndex < itemsCount) {
                this.selectItem(this.highlightedIndex);
            } else if (this.results.length > 0) {
                // Default: select the first option if Enter is hit without navigation
                this.selectItem(0);
            }
        } 
        else if (e.key === 'Escape') {
            e.preventDefault();
            this.close();
            this.$input.blur();
        } 
        else if (e.key === 'Tab') {
            if (this.isOpen) {
                const itemsCount = this.results.length;
                if (this.highlightedIndex === -2) {
                    e.preventDefault();
                    this.triggerAddNew();
                } else if (this.highlightedIndex >= 0 && this.highlightedIndex < itemsCount) {
                    this.selectItem(this.highlightedIndex);
                } else if (this.results.length > 0) {
                    this.selectItem(0);
                } else {
                    this.close();
                }
            }
        }
    }

    updateHighlightState() {
        // Clear all highlights
        this.$resultsContainer.find('.custom-combo-item').removeClass('highlighted');
        if (this.$addNewBtn.length) {
            this.$addNewBtn.removeClass('highlighted');
        }

        if (this.highlightedIndex === -2 && this.$addNewBtn.length) {
            this.$addNewBtn.addClass('highlighted');
        } 
        else if (this.highlightedIndex >= 0) {
            const element = this.$resultsContainer.find(`.custom-combo-item[data-index="${this.highlightedIndex}"]`);
            if (element.length) {
                element.addClass('highlighted');
                
                // Adjust scroll position dynamically if highlighted item overflows container view
                const container = this.$resultsContainer[0];
                const el = element[0];
                
                const containerTop = container.scrollTop;
                const containerBottom = containerTop + container.clientHeight;
                const elemTop = el.offsetTop;
                const elemBottom = elemTop + el.clientHeight;

                if (elemBottom > containerBottom) {
                    container.scrollTop = elemBottom - container.clientHeight;
                } else if (elemTop < containerTop) {
                    container.scrollTop = elemTop;
                }
            }
        }
    }

    // Helper method to destroy the combo and restore original select element
    destroy() {
        this.$select.off('.customCombo');
        this.$container.remove();
        this.$dropdown.remove();
        this.$select.removeClass('custom-combo-hidden').show();
    }
}

// Attach globally for standard (non-module) scripts
if (typeof window !== 'undefined') {
    window.CustomMultiColumnCombo = CustomMultiColumnCombo;
}
