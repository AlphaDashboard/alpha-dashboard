/**
 * Shared Searchable Dropdown Initializer
 * @param {string|HTMLElement} selector - Target element
 * @param {string} ajaxUrl - Endpoint to search options
 * @param {string} placeholder - Displayed placeholder text
 * @param {object} options - Customizations like modal triggers and callbacks
 */
export function initializeSearchableDropdown(selector, ajaxUrl, placeholder, options = {}) {
    const $element = jQuery(selector);
    if (!$element.length) return;

    const config = {
        theme: 'bootstrap-5',
        placeholder: placeholder || 'Search...',
        allowClear: true,
        dropdownParent: options.dropdownParent || jQuery('body'),
        dropdownCssClass: (selector === '#bankAccount' || (typeof selector === 'string' && selector.includes('bankAccount'))) ? 'bank-account-dropdown' : '',
        ajax: {
            url: ajaxUrl,
            dataType: 'json',
            delay: 250,
            data: function (params) {
                return { q: params.term };
            },
            processResults: function (data, params) {
                console.log("[common-dropdown] processResults called. Term:", params.term, "Data results length:", data.results ? data.results.length : 0);
                var rawResults = Array.isArray(data) ? data : (data.results || []);
                var results = rawResults.map(gp => {
                    if (gp.GatePassNo !== undefined && gp.id === undefined) {
                        return {
                            ...gp,
                            id: gp.GatePassNo,
                            text: `GP-${gp.GatePassNo + 10000}`
                        };
                    }
                    return gp;
                });
                var term = params.term || '';

                if (options.enableAddNew) {
                    var addNewLabel = options.addNewText || 'Add New AccountMaster Group';
                    var addNewOption = {
                        id: 'create_new_alpha',
                        text: term ? 'Add new "' + term + '"' : addNewLabel,
                        isNewAction: true,
                        searchTerm: term
                    };
                    if (options.position === 'bottom') {
                        results.push(addNewOption);
                        console.log("[common-dropdown] Appended Add New option to bottom:", addNewOption);
                    } else {
                        results.unshift(addNewOption);
                        console.log("[common-dropdown] Prepended Add New option to top:", addNewOption);
                    }
                }

                return { results: results };
            }
        },
        templateResult: function (result) {
            if (result.isNewAction) {
                var defaultLabel = options.addNewText || 'Add New AccountMaster Group';
                var cleanLabel = defaultLabel.replace('➕', '').trim();
                var displayText = result.searchTerm ? 'Add new "' + result.searchTerm + '"' : cleanLabel;
                if (!displayText.startsWith('+')) {
                    displayText = '+ ' + displayText;
                }
                var textOnly = displayText.substring(2);
                return jQuery(
                    '<div class="create-new-account_master-option text-center py-2 fw-bold w-100 border-bottom" style="color: #6366f1; background: #ffffff; cursor: pointer; font-size: 13px; font-family: \'Inter\', sans-serif;">' +
                    '<span style="color: #6366f1; font-weight: 800; font-size: 15px; margin-right: 4px;">+</span>' +
                    '<span>' + textOnly + '</span>' +
                    '</div>'
                );
            }
            
            // Render gate pass option in dynamic 4-column layout
            if (result.GatePassNo !== undefined) {
                const gpNo = `GP-${parseInt(result.GatePassNo) + 10000}`;
                const gpDate = result.GatePassdate || '';
                const vehicle = result.VehicleNo || '';
                const driver = result.DriverName || '';
                return jQuery(
                    '<div class="select2-table-row d-flex align-items-center w-100 py-2" style="font-size: 12px; font-family: \'Inter\', sans-serif; padding: 0 16px; box-sizing: border-box;">' +
                    '  <div style="width: 25%; text-align: left; font-weight: 600; color: #374151; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">' + gpNo + '</div>' +
                    '  <div style="width: 25%; text-align: left; color: #4b5563; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; padding-right: 8px;">' + gpDate + '</div>' +
                    '  <div style="width: 25%; text-align: left; color: #64748b; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; padding-right: 8px;">' + vehicle + '</div>' +
                    '  <div style="width: 25%; text-align: left; color: #4b5563; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">' + driver + '</div>' +
                    '</div>'
                );
            }
            
            // If it is a structured database option, render it in a clean 4-column table row format
            if (result.account_name !== undefined) {
                let balStr = '0.00';
                if (result.cl_bal !== undefined && result.cl_bal !== null) {
                    const balNum = parseFloat(result.cl_bal);
                    if (!isNaN(balNum)) {
                        balStr = balNum.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
                    } else {
                        balStr = result.cl_bal;
                    }
                }
                const codeText = result.code || result.groupID || '';
                const nameText = result.Account_Name || result.account_name || '';
                const dispText = result.display_name || '';
                return jQuery(
                    '<div class="select2-table-row d-flex align-items-center w-100 py-2" style="font-size: 12px; font-family: \'Inter\', sans-serif; padding: 0 16px; box-sizing: border-box;">' +
                    '  <div style="width: 6%; min-width: 50px; text-align: left; font-weight: 600; color: #374151; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">' + codeText + '</div>' +
                    '  <div style="width: 49%; text-align: left; font-weight: 600; color: #4b5563; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; padding-right: 8px;">' + nameText + '</div>' +
                    '  <div style="width: 30%; text-align: left; color: #64748b; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; padding-right: 8px;">' + dispText + '</div>' +
                    '  <div style="width: 15%; text-align: right; font-variant-numeric: tabular-nums; color: #0f766e; font-weight: 600; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">' + balStr + '</div>' +
                    '</div>'
                );
            }
            
            return result.text;
        },
        templateSelection: function (selection) {
            if (selection && selection.GatePassNo !== undefined) {
                return `GP-${parseInt(selection.GatePassNo) + 10000}`;
            }
            if (selection && selection.text) {
                const balIndex = selection.text.indexOf(' [Bal:');
                if (balIndex !== -1) {
                    return selection.text.substring(0, balIndex);
                }
            }
            return selection ? selection.text : '';
        }
    };

    const select2Instance = $element.select2(config);

    select2Instance.on('select2:open', function (e) {
        console.log("[common-dropdown] select2:open triggered for", selector);
        
        // Dynamically prepend the table headers and append the footer to the results list
        setTimeout(() => {
            const dropdown = jQuery('.select2-dropdown');
            if (dropdown.length && !dropdown.find('.select2-table-header').length) {
                let headerHtml = '';
                if (selector === '#GatepassNo' || (typeof selector === 'string' && selector.includes('GatepassNo'))) {
                    headerHtml = `
                        <div class="select2-table-header d-flex text-muted fw-bold border-bottom py-1" style="font-size: 11px; background: #f8fafc; font-family: 'Inter', sans-serif; letter-spacing: 0.05em; padding: 0 22px 0 16px; height: 28px; align-items: center; box-sizing: border-box;">
                            <div style="width: 25%; text-align: left;">Gate Pass No</div>
                            <div style="width: 25%; text-align: left;">Gate Pass Date</div>
                            <div style="width: 25%; text-align: left;">Vehicle</div>
                            <div style="width: 25%; text-align: left;">Driver</div>
                        </div>
                    `;
                } else {
                    headerHtml = `
                        <div class="select2-table-header d-flex text-muted fw-bold border-bottom py-1" style="font-size: 11px; background: #f8fafc; font-family: 'Inter', sans-serif; letter-spacing: 0.05em; padding: 0 22px 0 16px; height: 28px; align-items: center; box-sizing: border-box;">
                            <div style="width: 6%; min-width: 50px; text-align: left;">Code</div>
                            <div style="width: 49%; text-align: left;">Account Name</div>
                            <div style="width: 30%; text-align: left;">Display Name</div>
                            <div style="width: 15%; text-align: right;">Current Balance</div>
                        </div>
                    `;
                }
                dropdown.find('.select2-results').prepend(headerHtml);
            }

            if (dropdown.length && !dropdown.find('.select2-table-footer').length) {
                const footerHtml = `
                    <div class="select2-table-footer text-muted border-top py-1 text-center" style="font-size: 9px; background: #f8fafc; font-family: 'Inter', sans-serif; letter-spacing: 0.02em; padding: 4px 10px; box-sizing: border-box;">
                        Use arrow keys <span style="font-weight: 700;">↑↓</span> to navigate • <span style="font-weight: 700;">Enter</span> to select
                    </div>
                `;
                dropdown.append(footerHtml);
            }

            // Set placeholder for search input box
            const searchField = dropdown.find('.select2-search__field');
            if (searchField.length) {
                searchField.attr('placeholder', 'Type to filter or add...');
            }

            // Dynamically set dropdown width for #bankAccount to span to the right of #currentBalance
            if (selector === '#bankAccount' || (typeof selector === 'string' && selector.includes('bankAccount'))) {
                const bankAccountEl = jQuery('#bankAccount');
                const balanceEl = jQuery('#currentBalance');
                if (bankAccountEl.length && balanceEl.length) {
                    const select2Container = bankAccountEl.next('.select2-container');
                    if (select2Container.length) {
                        const offset = select2Container.offset();
                        if (offset) {
                            const rightEdge = balanceEl.offset().left + balanceEl.outerWidth();
                            const dynamicWidth = rightEdge - offset.left;
                            dropdown.css({
                                'width': dynamicWidth + 'px',
                                'max-width': 'none'
                            });
                        }
                    }
                }
            }
        }, 50);
    });

    if (options.enableAddNew) {
        select2Instance.on('select2:selecting', function (e) {
            console.log("[common-dropdown] select2:selecting triggered. Selected ID:", e.params.args.data.id);
            if (e.params.args.data && e.params.args.data.id === 'create_new_alpha') {
                e.preventDefault();
                var term = e.params.args.data.searchTerm || '';
                jQuery(this).select2('close');

                window._currentAccountMasterSelect = this;

                const modalEl = document.getElementById(options.modalId || 'createAccountMasterModal');
                if (modalEl) {
                    const form = modalEl.querySelector('form');
                    if (form) form.reset();

                    const nameInput = modalEl.querySelector('input[name="account_name"]');
                    if (nameInput) nameInput.value = term;

                    if (typeof options.onModalOpen === 'function') {
                        options.onModalOpen(modalEl, term);
                    }

                    const modal = new bootstrap.Modal(modalEl);
                    modal.show();

                    modalEl.addEventListener('shown.bs.modal', () => {
                        const codeInput = modalEl.querySelector('input[name="groupID"]') || modalEl.querySelector('input[name="code"]');
                        if (codeInput) codeInput.focus();
                    }, { once: true });
                }
            }
        });
    }

    return select2Instance;
}

/**
 * Shared Dynamic Form AJAX Modal Submit Handler
 * @param {string} modalId - ID of bootstrap modal
 * @param {object} notifications - Notifications helper
 */
export function initializeAccountMasterModalHandler(modalId = 'createAccountMasterModal', notifications = null) {
    const createAccountMasterModalEl = document.getElementById(modalId);
    if (!createAccountMasterModalEl) return;

    const alphaForm = createAccountMasterModalEl.querySelector('form');
    if (!alphaForm) return;

    // Clean any prior listener registrations safely by cloning
    const newForm = alphaForm.cloneNode(true);
    alphaForm.parentNode.replaceChild(newForm, alphaForm);

    newForm.addEventListener('submit', (e) => {
        e.preventDefault();

        // 1. Auto-generate Group ID (bigint) if left empty/optional
        const groupIDInput = newForm.querySelector('input[name="groupID"]') || newForm.querySelector('input[name="code"]');
        if (groupIDInput && !groupIDInput.value.trim()) {
            groupIDInput.value = String(Math.floor(100000 + Math.random() * 900000));
        }

        // 2. Auto-fill Display Name if empty
        const nameInput = newForm.querySelector('input[name="Account_Name"]') || newForm.querySelector('input[name="account_name"]');
        const displayInput = newForm.querySelector('input[name="display_name"]');
        if (nameInput && displayInput && !displayInput.value.trim()) {
            displayInput.value = nameInput.value;
        }

        // 3. Auto-select category if unselected to prevent db failure
        const catSelect = newForm.querySelector('select[name="category"]');
        if (catSelect && !catSelect.value) {
            const firstOption = Array.from(catSelect.options).find(opt => opt.value);
            if (firstOption) {
                catSelect.value = firstOption.value;
            }
        }

        const btn = newForm.querySelector('button[type="submit"]');
        const originalText = btn.innerHTML;
        btn.disabled = true;
        btn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Saving...';

        fetch(newForm.action, {
            method: 'POST',
            body: new FormData(newForm),
            headers: {
                'X-Requested-With': 'XMLHttpRequest',
                // Explicitly send CSRF token if available in DOM
                'X-CSRFToken': document.querySelector('[name=csrfmiddlewaretoken]') ? document.querySelector('[name=csrfmiddlewaretoken]').value : ''
            }
        })
        .then(async response => {
            if (!response.ok && response.status !== 400) {
                const text = await response.text();
                console.error("Server Error HTML:", text);
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            return response.json();
        })
        .then(data => {
            btn.disabled = false;
            btn.innerHTML = originalText;

            if (data.success) {
                const modalInstance = bootstrap.Modal.getInstance(createAccountMasterModalEl);
                if (modalInstance) modalInstance.hide();

                const newOption = new Option(data.text, data.id, true, true);
                if (window._currentAccountMasterSelect) {
                    jQuery(window._currentAccountMasterSelect).append(newOption).trigger('change');
                    window._currentAccountMasterSelect = null;
                }
                if (notifications && typeof notifications.showSuccess === 'function') {
                    notifications.showSuccess("Account created successfully");
                } else if (typeof showToast === 'function') {
                    showToast("Account created successfully", "success");
                } else {
                    alert("Account created successfully");
                }
            } else {
                let errorMsg = 'Error creating account:\n';
                if (data.errors) {
                    for (let field in data.errors) {
                        errorMsg += `- ${field}: ${data.errors[field]}\n`;
                    }
                } else if (data.message) {
                    errorMsg = data.message;
                }
                alert(errorMsg);
            }
        })
        .catch(err => {
            btn.disabled = false;
            btn.innerHTML = originalText;
            console.error("Fetch error:", err);
            alert("Fetch failed: " + err.message);
        });
    });
}

// Expose globally for classic (non-module) scripts
if (typeof window !== 'undefined') {
    window.initializeSearchableDropdown = initializeSearchableDropdown;
    window.initializeAccountMasterModalHandler = initializeAccountMasterModalHandler;
}
