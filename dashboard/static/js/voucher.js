function initVoucher() {
    const config = window.APP_CONFIG || { isEditMode: false, isViewMode: false };
    const isViewMode = !!config.isViewMode;
    let isDirty = false;
    let _isHydrating = true;

    const totalFormsInput = document.getElementById('id_facts-TOTAL_FORMS');
    console.log("[Vouchers Debug] DOMContentLoaded wrapper executing. config:", config);
    const formsetContainer = document.getElementById('formsetContainer');
    const emptyRowTemplate = document.getElementById('emptyRowTemplate').innerHTML;

    function showValidationToast(message) {
        let container = document.querySelector('.toast-container');
        if (!container) {
            container = document.createElement('div');
            container.className = 'toast-container position-fixed bottom-0 end-0 p-3';
            container.style.zIndex = '1060';
            document.body.appendChild(container);
        }
        
        const toastId = 'toast-' + Date.now();
        const toastHTML = `
            <div id="${toastId}" class="toast align-items-center text-white bg-danger border-0 mb-2 shadow-lg" role="alert" aria-live="assertive" aria-atomic="true">
                <div class="d-flex">
                    <div class="toast-body fw-bold d-flex align-items-center">
                        <i class="bi bi-x-circle-fill me-2 fs-5"></i>
                        ${message}
                    </div>
                    <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>
                </div>
            </div>
        `;
        container.insertAdjacentHTML('beforeend', toastHTML);
        const toastEl = document.getElementById(toastId);
        const bsToast = new bootstrap.Toast(toastEl, { delay: 3000 });
        bsToast.show();
        
        toastEl.addEventListener('hidden.bs.toast', function () {
            toastEl.remove();
        });
    }

    function triggerRowShake(rowEl) {
        rowEl.classList.remove('row-shake');
        void rowEl.offsetWidth; // trigger reflow
        rowEl.classList.add('row-shake');
    }

    window.validateTransactionRow = function(currentRow) {
        if (!currentRow) return true;

        // Validation strictly checks for empty TYPE
        const typeSelect = currentRow.querySelector('.row-type-select');
        currentRow.classList.remove('row-shake');
        
        if (typeSelect) {
            typeSelect.classList.remove('is-invalid-erp');
            if (!typeSelect.value || typeSelect.value.trim() === '' || typeSelect.value.includes('---')) {
                typeSelect.classList.add('is-invalid-erp');
                showValidationToast('Please select a Type before adding a new row.');
                triggerRowShake(currentRow);
                typeSelect.focus();
                return false;
            }
        }

        // Validation strictly checks for empty ACCOUNT_MASTER GROUP
        const alphaSelect = currentRow.querySelector('.account_master-select');
        if (alphaSelect) {
            const isSelect2 = alphaSelect.classList.contains('select2-hidden-accessible');
            const customComboInput = alphaSelect.parentElement ? alphaSelect.parentElement.querySelector('.custom-combo-input') : null;
            let targetEl = alphaSelect;
            if (isSelect2 && typeof jQuery !== 'undefined') {
                const parent = alphaSelect.parentElement;
                if (parent) {
                    const select2Container = parent.querySelector('.select2-container');
                    if (select2Container) {
                        targetEl = select2Container.querySelector('.select2-selection');
                    }
                }
            } else if (customComboInput) {
                targetEl = customComboInput;
            }
            targetEl.classList.remove('is-invalid-erp');

            if (!alphaSelect.value || alphaSelect.value.trim() === '') {
                targetEl.classList.add('is-invalid-erp');
                showValidationToast('Please select an AccountMaster Group Name before adding a new row.');
                triggerRowShake(currentRow);
                if (alphaSelect.classList.contains('select2-hidden-accessible') && typeof jQuery !== 'undefined') {
                    jQuery(alphaSelect).select2('open');
                } else if (customComboInput) {
                    customComboInput.focus();
                } else {
                    alphaSelect.focus();
                }
                return false;
            }
        }
        return true;
    };

    // Initialize existing rows
    function initRow(row) {
        if (!row) return;
        const typeSelect = row.querySelector('.row-type-select');
        const inputA = row.querySelector('.amount-a-input');
        const inputB = row.querySelector('.amount-b-input');
        const hiddenAmount = row.querySelector('.amount-input');
        const nativeDeleteCb = row.querySelector('.native-delete-cb');
        const removeBtn = row.querySelector('.remove-row-btn');
        const addBtn = row.querySelector('.add-row-btn');
        const alphaSelect = row.querySelector('.account_master-select');

        // Initialize Custom Combo on the account dropdown using the shared utility
        if (alphaSelect && typeof window.CustomMultiColumnCombo === 'function') {
            const comboInst = new window.CustomMultiColumnCombo(alphaSelect, '/api/accountmaster-search/', 'Search Account...', {
                enableAddNew: !isViewMode,
                modalId: 'createAccountMasterModal',
                secondColumnHeader: 'Account Name',
                onSelect: function(data) {
                    const balanceEl = document.getElementById('currentBalance');
                    if (balanceEl && data && data.cl_bal !== undefined) {
                        const balNum = parseFloat(data.cl_bal);
                        balanceEl.value = balNum.toLocaleString('en-US', {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2
                        });
                        balanceEl.classList.remove('text-success', 'text-danger');
                        if (balNum >= 0) balanceEl.classList.add('text-success');
                        else balanceEl.classList.add('text-danger');
                    }
                }
            });

            jQuery(alphaSelect).on('change', function() {
                if (!alphaSelect.value) {
                    const balanceEl = document.getElementById('currentBalance');
                    if (balanceEl) {
                        balanceEl.value = '0.00';
                        balanceEl.classList.remove('text-success', 'text-danger');
                        balanceEl.classList.add('text-success');
                    }
                }
            });
        }

        if (!typeSelect || !inputA || !inputB || !hiddenAmount) return;

        // Ensure first row delete option is safely hidden if native checkbox exists
        if (row.id === 'row-0') {
            if (nativeDeleteCb && nativeDeleteCb.parentElement) {
                nativeDeleteCb.parentElement.style.display = 'none';
            }
        }

        // Sync initial values
        if (hiddenAmount.value && typeSelect.value) {
            if (typeSelect.value === 'A') inputA.value = hiddenAmount.value;
            if (typeSelect.value === 'B') inputB.value = hiddenAmount.value;
        }

        function updateState() {
            const val = typeSelect.value;
            if (val === 'A') {
                if (!isViewMode) {
                    inputA.removeAttribute('readonly');
                }
                inputA.classList.remove('bg-disabled');

                if (!isViewMode) {
                    inputB.setAttribute('readonly', true);
                    inputB.value = ''; // clear inactive
                }
                inputB.classList.add('bg-disabled');
            } else if (val === 'B') {
                if (!isViewMode) {
                    inputB.removeAttribute('readonly');
                }
                inputB.classList.remove('bg-disabled');

                if (!isViewMode) {
                    inputA.setAttribute('readonly', true);
                    inputA.value = ''; // clear inactive
                }
                inputA.classList.add('bg-disabled');
            } else {
                // Not selected
                if (!isViewMode) {
                    inputA.setAttribute('readonly', true);
                    inputB.setAttribute('readonly', true);
                }
                inputA.classList.remove('bg-disabled');
                inputB.classList.remove('bg-disabled');
            }
            if (!isViewMode) {
                syncToHidden();
                calculateTotals();
            }
        }

        function syncToHidden() {
            const val = typeSelect.value;
            if (val === 'A') {
                hiddenAmount.value = inputA.value;
            } else if (val === 'B') {
                hiddenAmount.value = inputB.value;
            } else {
                hiddenAmount.value = '';
            }
        }

        // Event listeners
        typeSelect.addEventListener('change', updateState);

        inputA.addEventListener('input', function () {
            syncToHidden();
            calculateTotals();
        });

        inputB.addEventListener('input', function () {
            syncToHidden();
            calculateTotals();
        });

        if (removeBtn) {
            removeBtn.addEventListener('click', function () {
                if (row.id === 'row-0') return; // Cannot delete first row
                if (!confirm('Are you sure you want to remove this row?')) return; // Confirmation added

                // If it has a native delete checkbox (existing object), check it and hide row
                if (nativeDeleteCb) {
                    nativeDeleteCb.checked = true;
                    row.style.display = 'none';
                    row.classList.remove('formset-row'); // remove from total calc scope
                    calculateTotals();
                } else {
                    // It's a newly added row, completely remove from DOM
                    row.remove();
                    row.style.display = 'none';
                    row.classList.remove('formset-row');
                    inputA.value = ''; inputB.value = '';
                    hiddenAmount.value = '';
                    calculateTotals();
                }

                // Keep the input focused after deletion (UX perk)
                if (document.activeElement) {
                    document.activeElement.blur();
                }
                updateAddButtons();
            });
        }

        const insertBtn = row.querySelector('.insert-row-btn');

        function createAndInsertRow(triggerBtn) {
            const currentFormCount = parseInt(totalFormsInput.value);
            const newRowHtml = emptyRowTemplate.replace(/__prefix__/g, currentFormCount);

            // Create wrapper
            const tempTbody = document.createElement('tbody');
            tempTbody.innerHTML = newRowHtml.trim();
            const newRow = tempTbody.firstElementChild;

            // --- FORCE NEW ROW TO BE COMPLETELY EMPTY ---
            const newTypeSelect = newRow.querySelector('.row-type-select');
            if (newTypeSelect) {
                newTypeSelect.innerHTML = '<option value="" selected disabled hidden>-------</option><option value="A">A</option><option value="B">B</option>';
                newTypeSelect.value = "";
            }
            // --- END EMPTY ENFORCEMENT ---

            // Add the new row immediately after the clicked row
            row.after(newRow);
            initRow(newRow);

            totalFormsInput.value = currentFormCount + 1;
            updateAddButtons();

            // Professional Auto-Scroll & Focus Logic
            setTimeout(() => {
                if (newRow) {
                    newRow.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
                
                // Only auto-focus the row type if user manually clicked the button
                if (document.activeElement === triggerBtn) {
                    const typeSelect = newRow.querySelector('.row-type-select');
                    if (typeSelect) typeSelect.focus();
                }
            }, 60);
        }

        if (addBtn) {
            if (isViewMode) {
                addBtn.style.setProperty('display', 'none', 'important');
            } else {
                addBtn.addEventListener('click', function (e) {
                    if (window._bypassValidation) {
                        createAndInsertRow(addBtn);
                        return;
                    }
                    const currentRow = this.closest('tr');
                    if (!window.validateTransactionRow(currentRow)) return;
                    
                    createAndInsertRow(addBtn);
                });
            }
        }
        
        if (insertBtn) {
            if (isViewMode) {
                insertBtn.style.setProperty('display', 'none', 'important');
            } else {
                insertBtn.addEventListener('click', function (e) {
                    if (window._bypassValidation) {
                        createAndInsertRow(insertBtn);
                        return;
                    }
                    const currentRow = this.closest('tr');
                    if (!window.validateTransactionRow(currentRow)) return;
                    
                    createAndInsertRow(insertBtn);
                });
            }
        }

        // Handle standard dropdown duplicate check and auto-focus natively
        if (alphaSelect) {
            alphaSelect.addEventListener('change', function () {
                const selectedId = alphaSelect.value;
                if (!selectedId) return;

                let isDuplicate = false;
                document.querySelectorAll('.account_master-select').forEach(sel => {
                    if (sel !== alphaSelect && sel.value === selectedId) {
                        isDuplicate = true;
                    }
                });

                if (isDuplicate) {
                    alert('This AccountMaster Group is already selected in this voucher.');
                    alphaSelect.value = '';
                } else {
                    // Auto-focus next input
                    if (typeSelect.value === 'A') inputA.focus();
                    else if (typeSelect.value === 'B') inputB.focus();
                }
            });
        }

        // Enter-key handling
        function handleEnterKey(e, currentInput) {
            if (e.key === 'Enter') {
                e.preventDefault();
                if (!currentInput.value) return; // incomplete row

                const allRows = document.querySelectorAll('#formsetContainer .formset-row:not([style*="display: none"])');
                const isLastRow = row === allRows[allRows.length - 1];

                if (isLastRow) {
                    if (addBtn) addBtn.click();

                    setTimeout(() => {
                        const newRows = document.querySelectorAll('#formsetContainer .formset-row:not([style*="display: none"])');
                        const addedRow = newRows[newRows.length - 1];

                        // Focus new standard dropdown
                        const sel = addedRow.querySelector('.account_master-select');
                        if (sel) sel.focus();
                    }, 50);
                }
            }
        }

        inputA.addEventListener('keydown', e => handleEnterKey(e, inputA));
        inputB.addEventListener('keydown', e => handleEnterKey(e, inputB));

        // Initial state application
        updateState();

        if (isViewMode) {
            row.querySelectorAll('input, select, textarea').forEach(el => {
                el.setAttribute('readonly', 'true');
                el.setAttribute('tabindex', '-1');
                el.addEventListener('mousedown', e => e.preventDefault());
                el.addEventListener('keydown', e => e.preventDefault());
            });
            row.querySelectorAll('.add-row-btn, .remove-row-btn, .insert-row-btn').forEach(btn => {
                btn.style.setProperty('display', 'none', 'important');
            });
            if (typeof jQuery !== 'undefined' && alphaSelect) {
                jQuery(alphaSelect).on('select2:opening', e => e.preventDefault());
                setTimeout(() => {
                    const container = jQuery(alphaSelect).data('select2')?.$container;
                    if (container) {
                        container.find('*').attr('tabindex', '-1');
                    }
                }, 100);
            }
        }
    }

    // Global Add Row Visiblity specific function
    window.updateAddButtons = function () {
        // In view mode, never show any add/insert buttons
        if (isViewMode) {
            document.querySelectorAll('#formsetContainer .add-row-btn, #formsetContainer .insert-row-btn, #formsetContainer .remove-row-btn').forEach(btn => {
                btn.style.setProperty('display', 'none', 'important');
            });
            return;
        }

        const rows = document.querySelectorAll('#formsetContainer .formset-row');
        let lastVisibleRow = null;

        // Find the last visible row
        for (let i = rows.length - 1; i >= 0; i--) {
            if (rows[i].style.display !== 'none') {
                lastVisibleRow = rows[i];
                break;
            }
        }

        // Hide add functionality on previous rows, show insert functionality
        rows.forEach(r => {
            const addBtn = r.querySelector('.add-row-btn');
            const insertBtn = r.querySelector('.insert-row-btn');
            if (addBtn) addBtn.classList.add('d-none');
            if (insertBtn) insertBtn.classList.remove('d-none');
        });

        // Show add precisely on the active last row, and hide the insert button to prevent duplicates
        if (lastVisibleRow) {
            const addBtn = lastVisibleRow.querySelector('.add-row-btn');
            const insertBtn = lastVisibleRow.querySelector('.insert-row-btn');
            if (addBtn) addBtn.classList.remove('d-none');
            if (insertBtn) insertBtn.classList.add('d-none');
        }
    };

    // Init existing DOM
    document.querySelectorAll('#formsetContainer .formset-row').forEach(initRow);

    // Initial pass to handle visibility dynamically
    updateAddButtons();

    // Start with the default single-row state representing a clean new voucher creation

    // Calculate Totals Calculation
    function calculateTotals() {
        let totalA = 0.0;
        let totalB = 0.0;

        document.querySelectorAll('#formsetContainer .formset-row').forEach(row => {
            const typeSelect = row.querySelector('.row-type-select');
            const hiddenAmount = row.querySelector('.amount-input');
            const deleteCb = row.querySelector('.native-delete-cb');

            // Skip if row is marked for deletion or hidden
            if (row.style.display === 'none') return;
            if (deleteCb && deleteCb.checked) return;

            if (typeSelect && hiddenAmount && hiddenAmount.value) {
                const amount = parseFloat(hiddenAmount.value);
                if (!isNaN(amount)) {
                    if (typeSelect.value === 'A') totalA += amount;
                    if (typeSelect.value === 'B') totalB += amount;
                }
            }
        });

        const totalAElem = document.getElementById('totalA');
        const totalBElem = document.getElementById('totalB');
        const diffElem = document.getElementById('differenceIndicator');
        const submitBtn = document.getElementById('submitBtn');

        totalAElem.innerText = totalA.toFixed(2);
        totalBElem.innerText = totalB.toFixed(2);

        // Calculate difference
        const diff = Math.abs(totalA - totalB);
        const baseClasses = 'fw-semibold text-center m-0 w-100 ';
        if (totalA === 0 && totalB === 0) {
            diffElem.innerHTML = '';
            diffElem.className = baseClasses + 'text-muted';
            submitBtn.disabled = false;
        } else if (diff > 0.001) {
            diffElem.innerHTML = `Difference: ₹${diff.toFixed(2)} remaining`;
            diffElem.className = baseClasses + 'text-danger';
            submitBtn.disabled = true;
        } else {
            diffElem.innerHTML = '<i class="bi bi-check-circle-fill me-1"></i>Balanced';
            diffElem.className = baseClasses + 'text-success';
            submitBtn.disabled = false;
        }

        return { a: totalA, b: totalB };
    }

    // Initial calculation
    calculateTotals();

    // Form Submission Intercept
    const voucherForm = document.getElementById('voucherForm');
    voucherForm.addEventListener('submit', function (e) {

        // Check for empty rows and force sync amounts to hidden fields
        let activeRows = 0;
        document.querySelectorAll('#formsetContainer .formset-row').forEach(row => {
            const deleteCb = row.querySelector('.native-delete-cb');
            // Allow processing if row is visible and not marked for deletion
            if (row.style.display !== 'none' && (!deleteCb || !deleteCb.checked)) {
                activeRows++;

                // FORCE SYNC: Ensure visual amounts are copied to the hidden fields before POST
                const typeSelect = row.querySelector('.row-type-select');
                const inputA = row.querySelector('.amount-a-input');
                const inputB = row.querySelector('.amount-b-input');
                const hiddenAmount = row.querySelector('.amount-input');

                if (typeSelect && hiddenAmount) {
                    if (typeSelect.value === 'A' && inputA) hiddenAmount.value = inputA.value;
                    else if (typeSelect.value === 'B' && inputB) hiddenAmount.value = inputB.value;
                }
            }
        });

        const alert = document.getElementById('validationAlert');

        if (activeRows === 0) {
            e.preventDefault();
            alert.innerHTML = '<i class="bi bi-exclamation-triangle-fill me-2"></i>At least one active transaction row is required.';
            alert.classList.remove('d-none');
            alert.scrollIntoView({ behavior: 'smooth', block: 'center' });
            return;
        }

        const totals = calculateTotals();

        // Use a small epsilon for float comparison
        if (Math.abs(totals.a - totals.b) > 0.001) {
            e.preventDefault();
            alert.innerHTML = '<i class="bi bi-exclamation-triangle-fill me-2"></i>Total A and Total B must be equal.';
            alert.classList.remove('d-none');
            // Scroll to the error
            alert.scrollIntoView({ behavior: 'smooth', block: 'center' });
        } else {
            alert.classList.add('d-none');
            isDirty = false;

            // Let default submission proceed without breaking the DOM instantly
            const submitSpinner = document.getElementById('submitSpinner');
            const submitBtn = document.getElementById('submitBtn');
            submitSpinner.classList.remove('d-none');
            // Add a slight delay before disabling to ensure form submission event completes
            setTimeout(() => {
                submitBtn.style.pointerEvents = 'none';
                submitBtn.style.opacity = '0.7';
            }, 10);
        }
    });

    // Prevent submitting on enter in general across form
    voucherForm.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' && e.target.tagName === 'INPUT' && e.target.type !== 'submit') {
            e.preventDefault();
            return false;
        }
    });
// ==========================================
// FORM STATE PERSISTENCE (Strict Logic)
// ==========================================
function saveVoucherState(rowIndex) {
    let rows = [];
    document.querySelectorAll('#formsetContainer .formset-row').forEach((row, index) => {
        const deleteCb = row.querySelector('.native-delete-cb');
        // Safely skip hidden templates or soft-deleted rows
        if (row.id.includes('__prefix__') || row.style.display === 'none' || (deleteCb && deleteCb.checked)) return;

        // Grab elements using correct class selectors
        let typeSelect = row.querySelector('.row-type-select');
        let alphaSelect = row.querySelector('.account_master-select');
        let aInput = row.querySelector('.amount-a-input');
        let bInput = row.querySelector('.amount-b-input');
        let hiddenAmount = row.querySelector('.amount-input');

        let alphaId = alphaSelect ? alphaSelect.value : '';
        let alphaText = alphaSelect && alphaSelect.selectedIndex >= 0 ? alphaSelect.options[alphaSelect.selectedIndex].text : '';

        let rowData = {
            type: typeSelect ? typeSelect.value : '',
            account_master: alphaId,
            alphaText: alphaText,
            amountHidden: hiddenAmount ? hiddenAmount.value : '',
            a: aInput ? aInput.value : '',
            b: bInput ? bInput.value : '',
            index: index
        };
        rows.push(rowData);
    });

    let vNo = document.getElementById('id_voucher_number');
    let vDate = document.getElementById('id_voucher_date');
    let remarks = document.getElementById('id_remarks');
    let isActive = document.getElementById('id_is_active');

    let data = {
        voucher_no: vNo ? vNo.value : '',
        voucher_date: vDate ? vDate.value : '',
        remarks: remarks ? remarks.value : '',
        is_active: isActive ? isActive.checked : true,
        rows: rows,
        trigger_row: rowIndex
    };

    sessionStorage.setItem('voucher_form_data', JSON.stringify(data));
}
function runStateRestore() {
    console.log("[Vouchers Debug] runStateRestore executing. readyState:", document.readyState, "isViewMode:", isViewMode);
    // Never restore session state in view mode – it would re-enable inputs and add rows
    if (isViewMode) {
        sessionStorage.removeItem('voucher_form_data');
        console.log("[Vouchers Debug] View mode active – skipping state restore and clearing stale session data.");
        return;
    }
    let saved = sessionStorage.getItem('voucher_form_data');
    if (saved) {
        try {
            let data = JSON.parse(saved);

            let vNo = document.getElementById('id_voucher_number');
            let vDate = document.getElementById('id_voucher_date');
            let remarks = document.getElementById('id_remarks');
            let isActive = document.getElementById('id_is_active');

            if (vNo && data.voucher_no) vNo.value = data.voucher_no;
            if (vDate && data.voucher_date) vDate.value = data.voucher_date;
            if (remarks && data.remarks) remarks.value = data.remarks;
            if (isActive && typeof data.is_active === 'boolean') isActive.checked = data.is_active;

            let currentRows = document.querySelectorAll('#formsetContainer .formset-row:not([id*="__prefix__"])');

            // Ensure enough empty rows exist based strictly on row counts
            while (data.rows.length > currentRows.length) {
                let addBtns = document.querySelectorAll('.add-row-btn');
                // Filter out template button
                let validBtns = Array.from(addBtns).filter(btn => !btn.closest('#row-__prefix__'));
                if (validBtns.length > 0) {
                    window._bypassValidation = true;
                    validBtns[validBtns.length - 1].click();
                    window._bypassValidation = false;
                    currentRows = document.querySelectorAll('#formsetContainer .formset-row:not([id*="__prefix__"])');
                } else {
                    break;
                }
            }

            // Restore dynamic rows
            data.rows.forEach((row, i) => {
                if (i >= currentRows.length) return;
                let rowEl = currentRows[i];

                let typeSelect = rowEl.querySelector('.row-type-select');
                let aInput = rowEl.querySelector('.amount-a-input');
                let bInput = rowEl.querySelector('.amount-b-input');
                let hiddenAmount = rowEl.querySelector('.amount-input');
                let selectEl = rowEl.querySelector('.account_master-select');

                if (typeSelect && row.type) {
                    typeSelect.value = row.type;
                    typeSelect.dispatchEvent(new Event('change'));
                }

                if (hiddenAmount && row.amountHidden) hiddenAmount.value = row.amountHidden;

                if (aInput && row.a) {
                    aInput.value = row.a;
                    aInput.removeAttribute('readonly');
                    aInput.classList.remove('bg-disabled');
                }

                if (bInput && row.b) {
                    bInput.value = row.b;
                    bInput.removeAttribute('readonly');
                    bInput.classList.remove('bg-disabled');
                }

                if (row.account_master && row.alphaText && selectEl) {
                    let urlParams = new URLSearchParams(window.location.search);
                    if (data.trigger_row === row.index && urlParams.has('created_accountmaster_id')) {
                        // Let the target select script handle it below
                    } else {
                        let optionExists = Array.from(selectEl.options).some(opt => opt.value === row.account_master);
                        if (!optionExists) {
                            let newOption = new Option(row.alphaText, row.account_master, true, true);
                            selectEl.appendChild(newOption);
                        }
                        selectEl.value = row.account_master;
                        selectEl.dispatchEvent(new Event('change'));
                    }
                }

                // Force hidden inputs to sync and calculate Totals visually
                if (aInput) aInput.dispatchEvent(new Event('input', { bubbles: true }));
                if (bInput) bInput.dispatchEvent(new Event('input', { bubbles: true }));
            });

            // 4. AUTO-SELECT NEW ACCOUNT_MASTER GROUP
            let urlParams = new URLSearchParams(window.location.search);
            let createdId = urlParams.get('created_accountmaster_id');
            let createdText = urlParams.get('created_accountmaster_text');

            if (createdId && createdText) {
                let targetSelect = null;
                let triggerIndex = data.trigger_row !== undefined ? data.trigger_row : -1;

                if (triggerIndex >= 0 && triggerIndex < currentRows.length) {
                    targetSelect = currentRows[triggerIndex].querySelector('.account_master-select');
                }

                // Fallbacks if strictly indexed target fails
                if (!targetSelect) {
                    let rowsList = Array.from(currentRows);
                    let emptyRow = rowsList.find(r => {
                        let s = r.querySelector('.account_master-select');
                        return s && (!s.value || s.value === '');
                    });

                    if (emptyRow) {
                        targetSelect = emptyRow.querySelector('.account_master-select');
                    } else if (rowsList.length > 0) {
                        targetSelect = rowsList[rowsList.length - 1].querySelector('.account_master-select');
                    }
                }

                if (targetSelect) {
                    let newOption = new Option(createdText, createdId, true, true);
                    targetSelect.appendChild(newOption);
                    targetSelect.value = createdId;
                    targetSelect.dispatchEvent(new Event('change'));
                }

                if (typeof showToast === 'function') {
                    showToast("AccountMaster Group created successfully", "success");
                } else {
                    console.log("AccountMaster Group created successfully");
                }

                if (window.history.replaceState) {
                    let url = new URL(window.location.href);
                    url.searchParams.delete('created_accountmaster_id');
                    url.searchParams.delete('created_accountmaster_text');
                    window.history.replaceState({ path: url.href }, '', url.href);
                }
            }
            console.log("State restored successfully.");
        } catch (e) {
            console.error("Error restoring voucher form state", e);
        } finally {
            // IMPORTANT: clear after restore
            sessionStorage.removeItem('voucher_form_data');
        }
    }

    // Release the hydration lock ONLY after the page is fully loaded and any state restoration is complete
    setTimeout(function() {
        _isHydrating = false;
        console.log("[Vouchers Debug] Hydration lock released. Unsaved changes tracking is active. _isHydrating:", _isHydrating);
    }, 100);
}

if (document.readyState === 'complete') {
    runStateRestore();
} else {
    window.addEventListener('load', runStateRestore);
}

    // Centralized Modal Form AJAX Submission Handler
    if (window.initializeAccountMasterModalHandler) {
        window.initializeAccountMasterModalHandler('createAccountMasterModal');
    }

    // ── Accidental Modal Close Protection inside Voucher form ──
    let isModalDirty = false;
    const modalEl = document.getElementById('createAccountMasterModal');
    if (modalEl) {
        modalEl.addEventListener('shown.bs.modal', function() {
            isModalDirty = false;
            modalEl.querySelectorAll('.form-control, .form-select, input').forEach(input => {
                input.addEventListener('input', () => { isModalDirty = true; });
                input.addEventListener('change', () => { isModalDirty = true; });
            });
        });

        modalEl.addEventListener('hidden.bs.modal', function() {
            isModalDirty = false;
        });

        modalEl.addEventListener('hide.bs.modal', function(e) {
            const WARN_MSG = 'Changes are not saved. Are you sure you want to leave?';
            if (isModalDirty) {
                if (!confirm(WARN_MSG)) {
                    e.preventDefault();
                } else {
                    isModalDirty = false;
                }
            }
        });

        const modalForm = modalEl.querySelector('form');
        if (modalForm) {
            modalForm.addEventListener('submit', function() {
                isModalDirty = false;
            });
        }
    }

    // ── View-Only Mode Locking Logic ──
    function lockViewMode() {
        const form = document.getElementById('voucherForm');
        if (!form) return;

        form.querySelectorAll('input, select, textarea').forEach(el => {
            el.setAttribute('readonly', 'true');
            el.setAttribute('tabindex', '-1');
            el.addEventListener('mousedown', e => e.preventDefault());
            el.addEventListener('keydown', e => e.preventDefault());
        });

        // Lock Select2 dropdowns from opening without using disabled properties
        if (typeof jQuery !== 'undefined') {
            jQuery(form).find('.account_master-select, select').on('select2:opening', e => e.preventDefault());
            
            // Set tabindex of all select2 components' inner focusable elements to -1
            setTimeout(() => {
                jQuery(form).find('.account_master-select, select').each(function() {
                    const container = jQuery(this).data('select2')?.$container;
                    if (container) {
                        container.find('*').attr('tabindex', '-1');
                    }
                });
            }, 100);
        }

        // Standard locking already handled by native form inputs disabling loop

        form.querySelectorAll('.add-row-btn, .remove-row-btn, .insert-row-btn').forEach(btn => {
            btn.style.setProperty('display', 'none', 'important');
        });

        const submitBtn = document.getElementById('submitBtn');
        if (submitBtn) {
            submitBtn.style.setProperty('display', 'none', 'important');
        }

        // Disable status toggle switches visually and prevent hover/click states
        form.querySelectorAll('.erp-toggle-container').forEach(container => {
            container.style.setProperty('pointer-events', 'none', 'important');
            container.style.setProperty('opacity', '0.7', 'important');
        });

        const alertBox = document.getElementById('validationAlert');
        if (alertBox) {
            alertBox.innerHTML = '<i class="bi bi-eye me-2"></i><strong>View Mode</strong> — This voucher is read-only. No changes can be made.';
            alertBox.className = 'alert shadow-sm border-0 d-block p-2 mb-2 mx-3 mt-2';
            alertBox.style.borderRadius = '6px';
            alertBox.style.fontSize = '13px';
            alertBox.style.backgroundColor = '#eff6ff';
            alertBox.style.color = '#1d4ed8';
            alertBox.style.borderLeft = '4px solid #3b82f6';
        }
    }

    // ── Real-Time Field-Level Validation UX ──
    function validateField(field) {
        if (!field || _isHydrating || isViewMode) return true;
        if (!field.matches('input, select, textarea')) return true;

        const parent = field.parentElement;
        if (!parent) return true;

        const existingFeedback = parent.querySelector('.invalid-feedback-erp');
        if (existingFeedback) existingFeedback.remove();

        const val = field.value.trim();
        let isValid = true;
        let errorMessage = '';

        if (field.id === 'id_voucher_number') {
            if (!val) { isValid = false; errorMessage = 'Voucher number is required'; }
        }
        else if (field.id === 'id_voucher_date') {
            if (!val) { isValid = false; errorMessage = 'Voucher date is required'; }
        }
        else if (field.classList.contains('row-type-select')) {
            if (!val || val === '' || val.includes('---')) { isValid = false; errorMessage = 'Type is required'; }
        }
        else if (field.classList.contains('account_master-select')) {
            if (!val) { isValid = false; errorMessage = 'AccountMaster Group is required'; }
        }
        else if (field.classList.contains('amount-a-input') && !field.hasAttribute('readonly')) {
            const num = parseFloat(val);
            if (!val || isNaN(num)) {
                isValid = false; errorMessage = 'Amount is required';
            } else if (num <= 0) {
                isValid = false; errorMessage = 'Amount must be positive';
            }
        }
        else if (field.classList.contains('amount-b-input') && !field.hasAttribute('readonly')) {
            const num = parseFloat(val);
            if (!val || isNaN(num)) {
                isValid = false; errorMessage = 'Amount is required';
            } else if (num <= 0) {
                isValid = false; errorMessage = 'Amount must be positive';
            }
        }

        let targetEl = field;
        const isSelect2 = field.classList.contains('select2-hidden-accessible');
        const customComboInput = parent ? parent.querySelector('.custom-combo-input') : null;
        
        if (isSelect2 && typeof jQuery !== 'undefined') {
            const select2Container = parent.querySelector('.select2-container');
            if (select2Container) {
                targetEl = select2Container.querySelector('.select2-selection');
            }
        } else if (customComboInput) {
            targetEl = customComboInput;
        }

        if (isValid) {
            targetEl.classList.remove('is-invalid', 'is-invalid-erp');
        } else {
            targetEl.classList.add('is-invalid');
            if (isSelect2 || customComboInput) {
                targetEl.classList.add('is-invalid-erp');
            }

            const feedback = document.createElement('div');
            feedback.className = 'invalid-feedback-erp';
            feedback.style.color = '#dc3545';
            feedback.style.fontSize = '11px';
            feedback.style.marginTop = '2px';
            feedback.style.fontWeight = '500';
            feedback.textContent = errorMessage;

            if (isSelect2) {
                parent.appendChild(feedback);
            } else {
                field.after(feedback);
            }
        }

        return isValid;
    }

    // ── Initialize Features ──
    if (isViewMode) {
        lockViewMode();
    } else {
        const formEl = document.getElementById('voucherForm');
        if (formEl) {
            formEl.addEventListener('input', function(e) {
                console.log("[Vouchers Debug] Native input fired on:", e.target, "val:", e.target.value, "_isHydrating:", _isHydrating);
                if (!_isHydrating) {
                    isDirty = true;
                    console.log("[Vouchers Debug] isDirty set to true via native input.");
                }
            });
            formEl.addEventListener('change', function(e) {
                console.log("[Vouchers Debug] Native change fired on:", e.target, "val:", e.target.value, "_isHydrating:", _isHydrating);
                if (!_isHydrating) {
                    isDirty = true;
                    console.log("[Vouchers Debug] isDirty set to true via native change.");
                }
            });
            formEl.addEventListener('click', function(e) {
                console.log("[Vouchers Debug] Native click fired on target:", e.target, "_isHydrating:", _isHydrating);
                if (e.target.closest('.add-row-btn, .remove-row-btn, .insert-row-btn')) {
                    if (!_isHydrating) {
                        isDirty = true;
                        console.log("[Vouchers Debug] isDirty set to true via row button click.");
                    }
                }
            });

            if (typeof jQuery !== 'undefined') {
                jQuery(formEl).on('input change', function(e) {
                    console.log("[Vouchers Debug] jQuery input/change fired on:", e.target, "val:", e.target.value, "_isHydrating:", _isHydrating);
                    if (!_isHydrating) {
                        isDirty = true;
                        console.log("[Vouchers Debug] isDirty set to true via jQuery input/change.");
                    }
                });
            }
        }

        const WARN_MSG = 'Changes are not saved. Are you sure you want to leave?';
        window.addEventListener('beforeunload', function (e) {
            console.log("[Vouchers Debug] beforeunload fired. isDirty:", isDirty);
            if (!isDirty) return;
            e.preventDefault();
            e.returnValue = WARN_MSG;
            return WARN_MSG;
        });

        // Bulletproof Event Delegation for ALL navigation links (Back button, Sidebar links, etc.)
        document.addEventListener('click', function (e) {
            const anchor = e.target.closest('a');
            if (!anchor) return;

            const href = anchor.getAttribute('href');
            console.log("[Vouchers Debug] Delegated click on anchor:", anchor, "href:", href, "isDirty:", isDirty);
            if (!href || href.startsWith('#') || href.startsWith('javascript:')) return;

            const isBackBtn = anchor.textContent.includes('Back to List') || anchor.textContent.includes('Back') || anchor.classList.contains('btn-outline-secondary') || anchor.classList.contains('erp-btn-back');
            const isSidebarLink = anchor.closest('.sidebar') !== null;
            console.log("[Vouchers Debug] isBackBtn:", isBackBtn, "isSidebarLink:", isSidebarLink);

            if (isBackBtn || isSidebarLink) {
                if (isDirty) {
                    e.preventDefault();
                    console.log("[Vouchers Debug] Click intercepted, showing confirm popup.");
                    if (confirm(WARN_MSG)) {
                        isDirty = false;
                        console.log("[Vouchers Debug] User confirmed discard, navigating to:", href);
                        window.location.href = href;
                    }
                } else {
                    console.log("[Vouchers Debug] Form not dirty, allowing normal navigation.");
                }
            }
        });

        history.pushState({ erpFormGuard: true }, '');
        window.addEventListener('popstate', function (e) {
            console.log("[Vouchers Debug] popstate fired. isDirty:", isDirty);
            if (isDirty) {
                history.pushState({ erpFormGuard: true }, '');
                if (confirm(WARN_MSG)) {
                    isDirty = false;
                    history.go(-2);
                }
            }
        });
    }

    const formEl = document.getElementById('voucherForm');
    if (formEl) {
        formEl.addEventListener('keydown', function(e) {
            if (e.target.type === 'number' && (e.key === 'ArrowUp' || e.key === 'ArrowDown')) {
                e.preventDefault();
            }
        });
        formEl.addEventListener('wheel', function(e) {
            if (document.activeElement && document.activeElement.type === 'number') {
                document.activeElement.blur();
            }
        });

        formEl.addEventListener('input', function (e) {
            validateField(e.target);
        });
        formEl.addEventListener('blur', function (e) {
            validateField(e.target);
        }, true);
        formEl.addEventListener('change', function (e) {
            validateField(e.target);
        });

        if (typeof jQuery !== 'undefined') {
            jQuery(formEl).on('change', '.select2-hidden-accessible, .account_master-select', function (e) {
                validateField(e.target);
            });
        }
    }

    // Add table row focus/click delegation to update current balance
    if (typeof formsetContainer !== 'undefined' && formsetContainer) {
        const updateBalance = async (row) => {
            const alphaSelect = row.querySelector('.account_master-select');
            const balanceEl = document.getElementById('currentBalance');
            if (!balanceEl) return;
            if (!alphaSelect || !alphaSelect.value) {
                balanceEl.value = '0.00';
                balanceEl.classList.remove('text-success', 'text-danger');
                balanceEl.classList.add('text-success');
                return;
            }
            try {
                const response = await fetch(`/api/account_master/${alphaSelect.value}/`);
                if (response.ok) {
                    const data = await response.json();
                    if (data && data.cl_bal !== undefined) {
                        const balNum = parseFloat(data.cl_bal);
                        balanceEl.value = balNum.toLocaleString('en-US', {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2
                        });
                        balanceEl.classList.remove('text-success', 'text-danger');
                        if (balNum >= 0) balanceEl.classList.add('text-success');
                        else balanceEl.classList.add('text-danger');
                    }
                }
            } catch (err) {
                console.error('Failed to fetch AccountMaster balance:', err);
            }
        };

        formsetContainer.addEventListener('focusin', function (e) {
            const row = e.target.closest('.formset-row');
            if (row) {
                updateBalance(row);
            }
        });
        formsetContainer.addEventListener('click', function (e) {
            const row = e.target.closest('.formset-row');
            if (row) {
                updateBalance(row);
            }
        });

        // Also trigger initial balance update for the first row or selected row on load
        setTimeout(() => {
            const activeRow = formsetContainer.querySelector('.formset-row.active-row') || formsetContainer.querySelector('.formset-row');
            if (activeRow) {
                updateBalance(activeRow);
            }
        }, 300);
    }

    // Dispatch ready event for AJAX navigation
    const voucherFormEl = document.getElementById('voucherForm');
    if (voucherFormEl) {
        voucherFormEl.dispatchEvent(new CustomEvent('erp-form-ready', { bubbles: true }));
    }
}
document.addEventListener('DOMContentLoaded', initVoucher);
window.reinitVoucher = initVoucher;

function showToast(message, type) {
    let container = document.querySelector('.toast-container');
    if (!container) {
        container = document.createElement('div');
        container.className = 'toast-container position-fixed bottom-0 end-0 p-3';
        container.style.zIndex = '1060';
        document.body.appendChild(container);
    }

    const toastId = 'toast-' + Date.now();
    const bgClass = type === 'success' ? 'bg-success' : 'bg-danger';
    const iconClass = type === 'success' ? 'bi-check-circle-fill' : 'bi-x-circle-fill';

    const toastHTML = `
        <div id="${toastId}" class="toast align-items-center text-white ${bgClass} border-0 mb-2 shadow-lg" role="alert" aria-live="assertive" aria-atomic="true">
            <div class="d-flex">
                <div class="toast-body fw-bold d-flex align-items-center">
                    <i class="bi ${iconClass} me-2 fs-5"></i>
                    ${message}
                </div>
                <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>
            </div>
        </div>
    `;

    container.insertAdjacentHTML('beforeend', toastHTML);
    const toastEl = document.getElementById(toastId);
    if (typeof bootstrap !== 'undefined') {
        const toast = new bootstrap.Toast(toastEl, { autohide: true, delay: 5000 });
        toast.show();
        toastEl.addEventListener('hidden.bs.toast', () => { toastEl.remove(); });
    }
}