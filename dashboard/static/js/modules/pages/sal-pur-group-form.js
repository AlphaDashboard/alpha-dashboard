import { initializeAccountMasterModalHandler } from '../../common-dropdown.js';
import { CustomMultiColumnCombo } from '../../custom-combo.js';

/**
 * Sales/Purchase Group Form Logic
 */

document.addEventListener('DOMContentLoaded', () => {
    const groupId = window.APP_CONFIG.groupId;
    const isEditMode = !!groupId;
    let isViewMode = window.APP_CONFIG.isViewMode;
    const accountsData = window.APP_CONFIG.accountsData;
    const transactionTypes = window.APP_CONFIG.transactionTypes || [];

    console.log("DOMContentLoaded: sal-pur-group-form.js loaded. groupId:", groupId, "isEditMode:", isEditMode, "isViewMode:", isViewMode);

    const form = document.getElementById('salPurGroupForm');
    const btnSave = document.getElementById('btnSave');
    const btnCancel = document.getElementById('btnCancel');
    const addChargeBtn = document.getElementById('addChargeBtn');
    const chargesTableBody = document.getElementById('chargesTableBody');

    let isFormDirty = false;
    let isInitializing = true;
    let prevTxnTypeValue = '';

    window.currentFormInstance = {
        loadExistingData: function(id) {
            return new Promise((resolve, reject) => {
                isInitializing = true;
                console.log("currentFormInstance.loadExistingData: Fetching from API for ID:", id);
                fetch(`/api/sal-pur-group/${id}/`)
                    .then(res => res.json())
                    .then(data => {
                        console.log("currentFormInstance.loadExistingData: Successfully received data:", data);
                        populateForm(data);
                        resolve();
                    })
                    .catch(err => {
                        console.error("Failed to load group:", err);
                        alert("Failed to load group data.");
                        isInitializing = false;
                        reject(err);
                    });
            });
        },
        lockViewMode: function() {
            isViewMode = true;
            document.getElementById('pageTitle').textContent = "View Sales/Purchase Group";
            form.querySelectorAll('input, select, textarea, button').forEach(el => {
                if (el.id !== 'btnCancel') el.disabled = true;
            });
            if (btnSave) btnSave.style.display = 'none';
            if (addChargeBtn) addChargeBtn.style.display = 'none';
            document.querySelectorAll('.btn-row-add, .btn-row-delete, .btn-footer-save').forEach(btn => {
                btn.style.display = 'none';
            });
            // (Transaction Type Add New button is now an option inside the dropdown, no separate button to hide)
            form.querySelectorAll('.erp-toggle-btn').forEach(btn => {
                btn.classList.add('disabled');
            });
        }
    };

    // Generate Account Dropdown Options
    const accountOptionsHtml = accountsData.map(acc => `<option value="${acc.id}">${acc.name}</option>`).join('');

    // Initialize custom multi-column combo dropdown for main Group Account
    new CustomMultiColumnCombo(
        document.getElementById('GroupwiseAccountID'),
        '/api/accountmaster-search/',
        'Search Account...',
        {
            enableAddNew: !isViewMode,
            addNewText: '➕ Add New Account Master',
            modalId: 'createAccountMasterModal',
            onModalOpen: (modalEl, term) => {
                const nameInput = modalEl.querySelector('input[name="Account_Name"]') || modalEl.querySelector('input[name="account_name"]');
                if (nameInput) nameInput.value = term;
            }
        }
    );

    // Initialize Account Master modal submission handler
    initializeAccountMasterModalHandler('createAccountMasterModal', null);



    // Toggle has-value class on form-group wrapper based on select value
    $('#GroupwiseAccountID').on('change', function() {
        const formGroup = $(this).closest('.form-group');
        if ($(this).val()) {
            formGroup.addClass('has-value');
        } else {
            formGroup.removeClass('has-value');
        }
    });

    // Toggle is-focused class on form-group wrapper based on custom combo input focus
    $(document).on('focus', '.custom-combo-input', function() {
        $(this).closest('.form-group').addClass('is-focused');
    }).on('blur', '.custom-combo-input', function() {
        $(this).closest('.form-group').removeClass('is-focused');
    });

    // Trigger change to set correct initial state
    $('#GroupwiseAccountID').trigger('change');

    const groupwiseCheckbox = document.getElementById('GroupwiseAccounting');
    const groupwiseAccountSelect = $('#GroupwiseAccountID');

    function toggleGroupwiseAccount() {
        const combo = groupwiseAccountSelect.data('customCombo');
        if (groupwiseCheckbox.checked) {
            groupwiseAccountSelect.prop('disabled', isViewMode).trigger('change');
            if (combo && combo.$input) {
                combo.$input.prop('disabled', isViewMode);
            }
        } else {
            groupwiseAccountSelect.prop('disabled', true).val(null).trigger('change');
            if (combo && combo.$input) {
                combo.$input.prop('disabled', true);
            }
        }
    }

    groupwiseCheckbox.addEventListener('change', toggleGroupwiseAccount);

    // Calculate sum of rates and update footer
    function calculateTotalAmount() {
        let total = 0;
        chargesTableBody.querySelectorAll('tr').forEach(tr => {
            const rateInput = tr.querySelector('.charge-rate');
            if (rateInput) {
                const val = parseFloat(rateInput.value);
                if (!isNaN(val)) {
                    total += val;
                }
            }
        });
        const totalRateAmountEl = document.getElementById('totalRateAmount');
        if (totalRateAmountEl) {
            totalRateAmountEl.textContent = total.toFixed(2);
        }
    }

    // Update delete buttons visibility (hide for the first row)
    function updateDeleteButtons() {
        const rows = chargesTableBody.querySelectorAll('tr');
        rows.forEach((row, idx) => {
            const deleteBtn = row.querySelector('.btn-row-delete');
            if (deleteBtn) {
                if (idx === 0 || isViewMode) {
                    deleteBtn.style.setProperty('display', 'none', 'important');
                } else {
                    deleteBtn.style.setProperty('display', 'inline-flex', 'important');
                }
            }
        });
    }


    if (isEditMode) {
        document.getElementById('pageTitle').textContent = isViewMode ? "View Sales/Purchase Group" : "Edit Sales/Purchase Group";
        console.log("Initializing in Edit Mode. Group ID:", groupId);
        fetchGroupData(groupId);
    } else {
        console.log("Initializing in Create Mode.");
        // Add one empty row by default
        addChargeRow();
        toggleGroupwiseAccount();
        calculateTotalAmount();
        isInitializing = false;
    }

    if (isViewMode) {
        // Disable all inputs
        form.querySelectorAll('input, select, textarea, button').forEach(el => {
            if (el.id !== 'btnCancel') el.disabled = true;
        });
        if (btnSave) btnSave.style.display = 'none';
        if (addChargeBtn) addChargeBtn.style.display = 'none';
        
        // Hide add/delete row buttons in view mode
        document.querySelectorAll('.btn-row-add, .btn-row-delete, .btn-footer-save').forEach(btn => {
            btn.style.display = 'none';
        });
        // (Transaction Type Add New button is now an option inside the dropdown, no separate button to hide)

        // Disable all segmented toggle button labels
        form.querySelectorAll('.erp-toggle-btn').forEach(btn => {
            btn.classList.add('disabled');
        });
    }

    // ── Transaction Type: Add New modal handler ──────────────────────────────
    const txnTypeModal = new bootstrap.Modal(document.getElementById('createTransactionTypeModal'));
    const btnSaveTxnType = document.getElementById('btnSaveTxnType');
    const txnTypeModalError = document.getElementById('txnTypeModalError');

    const txnSelect = document.getElementById('TransactionTypeID');
    if (txnSelect) {
        prevTxnTypeValue = txnSelect.value;
        txnSelect.addEventListener('change', (e) => {
            if (e.target.value === 'add_new') {
                // Restore previous selection immediately
                e.target.value = prevTxnTypeValue;
                
                // Clear modal fields
                document.getElementById('newTxnTypeName').value = '';
                document.getElementById('newTxnTypeCode').value = '';
                if (txnTypeModalError) { txnTypeModalError.style.display = 'none'; txnTypeModalError.textContent = ''; }
                txnTypeModal.show();
            } else {
                prevTxnTypeValue = e.target.value;
            }
        });
    }

    if (btnSaveTxnType) {
        btnSaveTxnType.addEventListener('click', () => {
            const name = document.getElementById('newTxnTypeName').value.trim();
            const code = document.getElementById('newTxnTypeCode').value.trim().toUpperCase();

            // Client-side validation
            if (!name) {
                txnTypeModalError.textContent = 'Transaction Type Name is required.';
                txnTypeModalError.style.display = 'block';
                return;
            }
            if (!code || code.length > 4) {
                txnTypeModalError.textContent = 'Transaction Type Code is required and must be max 4 characters.';
                txnTypeModalError.style.display = 'block';
                return;
            }

            // Disable save button while saving
            btnSaveTxnType.disabled = true;
            btnSaveTxnType.innerHTML = '<span class="spinner-border spinner-border-sm"></span> Saving...';
            if (txnTypeModalError) { txnTypeModalError.style.display = 'none'; txnTypeModalError.textContent = ''; }

            fetch('/api/transaction-type/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': getCookie('csrftoken')
                },
                body: JSON.stringify({
                    TransactionTypeName: name,
                    TransactionType: code,
                    UserCreated: 'system'
                })
            })
            .then(async res => {
                if (!res.ok) {
                    const err = await res.json();
                    throw new Error(JSON.stringify(err));
                }
                return res.json();
            })
            .then(newType => {
                const txnSelect = document.getElementById('TransactionTypeID');
                if (txnSelect) {
                    const opt = new Option(
                        `${newType.TransactionTypeName}`,
                        newType.TransactionTypeID,
                        true, true
                    );
                    opt.dataset.code = newType.TransactionType;
                    txnSelect.add(opt);
                    txnSelect.value = String(newType.TransactionTypeID);
                    prevTxnTypeValue = String(newType.TransactionTypeID);
                }
                txnTypeModal.hide();
                // Mark form dirty
                if (!isInitializing && !isViewMode) isFormDirty = true;
            })
            .catch(err => {
                console.error('Failed to save Transaction Type:', err);
                txnTypeModalError.textContent = 'Failed to save. Please check for duplicate code or try again.';
                txnTypeModalError.style.display = 'block';
            })
            .finally(() => {
                btnSaveTxnType.disabled = false;
                btnSaveTxnType.innerHTML = '<i class="bi bi-check-lg me-2"></i> Save';
            });
        });
    }

    function fetchGroupData(id) {
        console.log("fetchGroupData: Fetching from API for ID:", id);
        fetch(`/api/sal-pur-group/${id}/`)
            .then(res => res.json())
            .then(data => {
                console.log("fetchGroupData: Successfully received data:", data);
                populateForm(data);
            })
            .catch(err => {
                console.error("Failed to load group:", err);
                alert("Failed to load group data.");
                isInitializing = false;
            });
    }

    function populateForm(data) {
        document.getElementById('SalPurGroupName').value = data.SalPurGroupName || '';
        document.getElementById('GroupwiseAccounting').checked = data.GroupwiseAccounting || false;
        toggleGroupwiseAccount();
        
        document.getElementById('GSTApplicable').checked = (data.GST_Applicable_Y_N === true || data.IsGSTApplicableY1N0 === true);

        if (data.Interstate_Y_WithinState_N === true) {
            document.getElementById('StateInterstate').checked = true;
            $('label[for="StateInterstate"]').addClass('active');
            $('label[for="StateWithinState"]').removeClass('active');
        } else if (data.Interstate_Y_WithinState_N === false) {
            document.getElementById('StateWithinState').checked = true;
            $('label[for="StateWithinState"]').addClass('active');
            $('label[for="StateInterstate"]').removeClass('active');
        } else {
            document.getElementById('StateInterstate').checked = true; // default
            $('label[for="StateInterstate"]').addClass('active');
            $('label[for="StateWithinState"]').removeClass('active');
        }

        if (data.GroupwiseAccountID) {
            const selectEl = document.getElementById('GroupwiseAccountID');
            if (selectEl && !selectEl.querySelector(`option[value="${data.GroupwiseAccountID}"]`)) {
                const optText = data.account_display ? data.account_display.text : `Account Master (ID: ${data.GroupwiseAccountID})`;
                const opt = new Option(optText, data.GroupwiseAccountID, true, true);
                $(selectEl).append(opt);
            }
            $('#GroupwiseAccountID').val(data.GroupwiseAccountID).trigger('change');
        } else {
            $('#GroupwiseAccountID').val(null).trigger('change');
        }

        // Restore Transaction Type selection
        const txnTypeSelect = document.getElementById('TransactionTypeID');
        if (txnTypeSelect) {
            if (data.TransactionTypeID) {
                txnTypeSelect.value = String(data.TransactionTypeID);
            } else {
                txnTypeSelect.value = '';
            }
            prevTxnTypeValue = txnTypeSelect.value;
        }

        // Add transaction rows
        chargesTableBody.innerHTML = '';
        if (data.transactions && data.transactions.length > 0) {
            data.transactions.forEach(tx => addChargeRow(tx));
        } else {
            addChargeRow(); // at least one empty row
        }
        calculateTotalAmount();
        isInitializing = false;
    }

    function addChargeRow(tx = {}) {
        const tr = document.createElement('tr');
        const uniqueId = Date.now() + Math.floor(Math.random() * 1000);
        
        const autoChecked = (tx.Auto_Y_Manual_N === true || tx.Auto_Y_Manual_N === undefined) ? 'checked' : '';
        const manualChecked = tx.Auto_Y_Manual_N === false ? 'checked' : '';
        const debitChecked = (tx.Debit_D_Credit_C === 'D' || tx.Debit_D_Credit_C === undefined) ? 'checked' : '';
        const creditChecked = tx.Debit_D_Credit_C === 'C' ? 'checked' : '';

        tr.innerHTML = `
            <td>
                <input type="text" class="form-control charge-name" placeholder="Enter charge name" value="${tx.ChargesName || ''}" required ${isViewMode ? 'disabled' : ''}>
            </td>
            <td>
                <select class="form-select charge-account select2-row" style="width:100%" ${isViewMode ? 'disabled' : ''}>
                    <option value=""></option>
                    ${accountOptionsHtml}
                </select>
            </td>
            <td class="text-center align-middle">
                <div class="erp-toggle-group">
                    <input type="radio" id="auto_${uniqueId}" name="auto_manual_${uniqueId}" class="charge-auto-radio" value="Y" style="display: none;" ${autoChecked}>
                    <label for="auto_${uniqueId}" class="erp-toggle-btn ${autoChecked ? 'active' : ''} ${isViewMode ? 'disabled' : ''}">Auto</label>
                    
                    <input type="radio" id="manual_${uniqueId}" name="auto_manual_${uniqueId}" class="charge-manual-radio" value="N" style="display: none;" ${manualChecked}>
                    <label for="manual_${uniqueId}" class="erp-toggle-btn ${manualChecked ? 'active' : ''} ${isViewMode ? 'disabled' : ''}">Manual</label>
                </div>
            </td>
            <td>
                <input type="number" step="0.01" class="form-control charge-rate text-center" placeholder="0.00" value="${tx.Rate !== undefined && tx.Rate !== null ? tx.Rate : '0.00'}" ${isViewMode ? 'disabled' : ''}>
            </td>
            <td class="text-center align-middle">
                <div class="erp-toggle-group">
                    <input type="radio" id="debit_${uniqueId}" name="debit_credit_${uniqueId}" class="charge-debit-radio" value="D" style="display: none;" ${debitChecked}>
                    <label for="debit_${uniqueId}" class="erp-toggle-btn ${debitChecked ? 'active' : ''} ${isViewMode ? 'disabled' : ''}">Debit</label>
                    
                    <input type="radio" id="credit_${uniqueId}" name="debit_credit_${uniqueId}" class="charge-credit-radio" value="C" style="display: none;" ${creditChecked}>
                    <label for="credit_${uniqueId}" class="erp-toggle-btn ${creditChecked ? 'active' : ''} ${isViewMode ? 'disabled' : ''}">Credit</label>
                </div>
            </td>
            <td class="text-center">
                <div class="d-flex justify-content-center gap-1">
                    <button type="button" class="btn-row-action btn-row-add" title="Add Row" ${isViewMode ? 'disabled' : ''}>
                        <i class="bi bi-plus"></i>
                    </button>
                    <button type="button" class="btn-row-action btn-row-delete" title="Delete Row" ${isViewMode ? 'disabled' : ''}>
                        <i class="bi bi-trash"></i>
                    </button>
                </div>
            </td>
        `;

        chargesTableBody.appendChild(tr);

        // Auto-scroll scrollable table wrapper to bottom on row addition
        if (!isViewMode) {
            const wrapper = chargesTableBody.closest('.erp-charges-table-wrapper');
            if (wrapper) {
                setTimeout(() => {
                    wrapper.scrollTop = wrapper.scrollHeight;
                }, 50);
            }
        }

        // Initialize Custom Combo for this row's account selection
        const alphaSelect = tr.querySelector('.charge-account');
        new CustomMultiColumnCombo(alphaSelect, '/api/accountmaster-search/', 'Search Account...', {
            enableAddNew: !isViewMode,
            modalId: 'createAccountMasterModal',
            showBalanceInTextbox: false
        });

        if (tx.ChargeAccountID) {
            const selectEl = tr.querySelector('.charge-account');
            if (selectEl && !selectEl.querySelector(`option[value="${tx.ChargeAccountID}"]`)) {
                const optText = tx.account_display ? tx.account_display.text : `Account Master (ID: ${tx.ChargeAccountID})`;
                const opt = new Option(optText, tx.ChargeAccountID, true, true);
                $(selectEl).append(opt);
            }
            $(alphaSelect).val(tx.ChargeAccountID).trigger('change');
        }

        // Attach event listeners for rate input change to update total amount
        const rateInput = tr.querySelector('.charge-rate');
        rateInput.addEventListener('input', calculateTotalAmount);
        rateInput.addEventListener('change', calculateTotalAmount);

        // Attach add row event
        tr.querySelector('.btn-row-add').addEventListener('click', () => {
            addChargeRow();
        });

        // Attach remove event
        tr.querySelector('.btn-row-delete').addEventListener('click', () => {
            const combo = $(alphaSelect).data('customCombo');
            if (combo) {
                combo.destroy();
            }
            tr.remove();
            calculateTotalAmount();
            updateDeleteButtons();
            if (!isInitializing && !isViewMode) {
                isFormDirty = true;
            }
        });

        if (isViewMode) {
            tr.querySelectorAll('.btn-row-add, .btn-row-delete').forEach(btn => {
                btn.style.setProperty('display', 'none', 'important');
            });
        }

        if (!isInitializing && !isViewMode) {
            isFormDirty = true;
        }

        updateDeleteButtons();
    }

    if (addChargeBtn) {
        addChargeBtn.addEventListener('click', () => {
            addChargeRow();
        });
    }

    if (btnCancel) {
        btnCancel.addEventListener('click', () => {
            window.location.href = '/sal-pur-group/';
        });
    }

    form.addEventListener('submit', (e) => {
        e.preventDefault();
        
        if (!form.checkValidity()) {
            form.reportValidity();
            return;
        }

        if (btnSave) {
            btnSave.disabled = true;
            btnSave.innerHTML = `<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Saving...`;
        }

        // Gather Header Data
        const headerData = {
            SalPurGroupName: document.getElementById('SalPurGroupName').value.trim(),
            GroupwiseAccounting: document.getElementById('GroupwiseAccounting').checked,
            GroupwiseAccountID: document.getElementById('GroupwiseAccountID').value || null,
            TransactionTypeID: document.getElementById('TransactionTypeID')?.value || null,
            Interstate_Y_WithinState_N: document.getElementById('StateInterstate').checked,
            GST_Applicable_Y_N: document.getElementById('GSTApplicable').checked,
            IsGSTApplicableY1N0: document.getElementById('GSTApplicable').checked
        };

        // Gather Transactions Data
        const transactions = [];
        chargesTableBody.querySelectorAll('tr').forEach(tr => {
            const name = tr.querySelector('.charge-name').value.trim();
            if (name) {
                const autoRadio = tr.querySelector('.charge-auto-radio');
                const debitRadio = tr.querySelector('.charge-debit-radio');
                transactions.push({
                    ChargesName: name,
                    ChargeAccountID: tr.querySelector('.charge-account').value || null,
                    Auto_Y_Manual_N: autoRadio ? autoRadio.checked : true,
                    Rate: tr.querySelector('.charge-rate').value || null,
                    Debit_D_Credit_C: debitRadio && debitRadio.checked ? 'D' : 'C'
                });
            }
        });

        headerData.transactions = transactions;

        const url = isEditMode ? `/api/sal-pur-group/${groupId}/` : `/api/sal-pur-group/`;
        const method = isEditMode ? 'PUT' : 'POST';

        fetch(url, {
            method: method,
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': getCookie('csrftoken')
            },
            body: JSON.stringify(headerData)
        })
        .then(async res => {
            if (!res.ok) {
                let errMsg = 'Failed to save group';
                try {
                    const contentType = res.headers.get('content-type');
                    if (contentType && contentType.includes('application/json')) {
                        const errorData = await res.json();
                        if (errorData) {
                            if (typeof errorData === 'object') {
                                errMsg = Object.entries(errorData)
                                    .map(([key, val]) => `${key}: ${Array.isArray(val) ? val.join(', ') : JSON.stringify(val)}`)
                                    .join('\n');
                            } else {
                                errMsg = String(errorData);
                            }
                        }
                    } else {
                        const htmlText = await res.text();
                        const match = htmlText.match(/<title>([\s\S]*?)<\/title>/i) || htmlText.match(/<h1>([\s\S]*?)<\/h1>/i);
                        if (match && match[1]) {
                            errMsg = match[1].trim().replace(/&nbsp;/g, ' ').replace(/&lt;/g, '<').replace(/&gt;/g, '>');
                        } else {
                            errMsg = `Server error (Status ${res.status})`;
                        }
                    }
                } catch (e) {
                    errMsg = `Server error (Status ${res.status})`;
                }
                throw new Error(errMsg);
            }
            return res.json();
        })
        .then(data => {
            isFormDirty = false;
            alert('Sales/Purchase Group saved successfully!');
            window.location.href = '/sal-pur-group/';
        })
        .catch(err => {
            console.error(err);
            alert(`Error saving group:\n${err.message}`);
            if (btnSave) {
                btnSave.disabled = false;
                btnSave.innerHTML = `<i class="bi bi-floppy"></i> Save Group`;
            }
        });
    });

    function getCookie(name) {
        let cookieValue = null;
        if (document.cookie && document.cookie !== '') {
            const cookies = document.cookie.split(';');
            for (let i = 0; i < cookies.length; i++) {
                const cookie = cookies[i].trim();
                if (cookie.substring(0, name.length + 1) === (name + '=')) {
                    cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                    break;
                }
            }
        }
        return cookieValue;
    }

    // Segmented Toggle Button click behavior
    document.addEventListener('click', function(e) {
        const toggleBtn = e.target.closest('.erp-toggle-btn');
        if (!toggleBtn) return;
        
        console.log("ERP Toggle clicked. Target element:", toggleBtn);
        e.preventDefault();
        
        const hasDisabled = toggleBtn.classList.contains('disabled');
        console.log("Toggle check - hasDisabled class:", hasDisabled, "isViewMode:", isViewMode);
        
        if (hasDisabled || isViewMode) {
            console.log("Toggle interaction blocked: read-only or disabled.");
            return;
        }
        
        const targetRadioId = toggleBtn.getAttribute('for');
        console.log("Target radio button ID:", targetRadioId);
        
        const radio = document.getElementById(targetRadioId);
        if (radio) {
            console.log("Radio element found. Current checked state:", radio.checked);
            radio.checked = true;
            console.log("Set radio checked to true. Triggering change event...");
            if (typeof jQuery !== 'undefined') {
                jQuery(radio).trigger('change');
            } else {
                radio.dispatchEvent(new Event('change', { bubbles: true }));
            }
        } else {
            console.warn("Could not find radio element with ID:", targetRadioId);
        }
        
        // Toggle active style
        toggleBtn.classList.add('active');
        const parent = toggleBtn.parentElement;
        if (parent) {
            parent.querySelectorAll('.erp-toggle-btn').forEach(btn => {
                if (btn !== toggleBtn) {
                    btn.classList.remove('active');
                }
            });
        }
        console.log("Styling updated: active class applied.");
    });

    // Track form changes via jQuery (captures standard inputs, selects, select2 and radios)
    $(form).on('change input', 'input, select, textarea', function() {
        if (!isInitializing && !isViewMode) {
            isFormDirty = true;
        }
    });

    // Also specifically track GroupwiseAccountID Select2 change event
    $('#GroupwiseAccountID').on('change', function() {
        if (!isInitializing && !isViewMode) {
            isFormDirty = true;
        }
    });

    // Warn on browser back/reload/close
    window.addEventListener('beforeunload', (e) => {
        if (isFormDirty && !isViewMode) {
            e.preventDefault();
            e.returnValue = ''; // Trigger browser's standard confirmation dialog
        }
    });

    // Intercept Back to List navigation (both click and Esc keyboard navigation trigger this button)
    const backBtn = document.querySelector('.erp-btn-back');
    if (backBtn) {
        backBtn.addEventListener('click', (e) => {
            if (isFormDirty && !isViewMode) {
                if (!confirm('You have unsaved changes. Are you sure you want to leave?')) {
                    e.preventDefault();
                }
            }
        });
    }

    // Intercept Record Navigation buttons (previous/next)
    document.querySelectorAll('.erp-btn-prev, .erp-btn-next').forEach(btn => {
        btn.addEventListener('click', (e) => {
            if (isFormDirty && !isViewMode) {
                if (!confirm('You have unsaved changes. Are you sure you want to leave?')) {
                    e.preventDefault();
                }
            }
        });
    });
});
