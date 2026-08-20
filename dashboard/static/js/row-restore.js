/**
 * ERP Row Restore & Focus Preservation Utility
 * Automatically stores the last clicked/selected row in sessionStorage and restores
 * visual highlighting, scrolls the row into view, and refocuses it upon returning to the page.
 *
 * SCROLL FIX (v2): Replaced scrollIntoView() with scrollRowIntoView() which manually
 * finds the real scrollable container (tbody or .erp-table-scroll div) and adjusts
 * scrollTop. This fixes the issue where native scrollIntoView() scrolled the window
 * instead of the inner table scroll container.
 */
(function() {
    const keyPrefix = 'last_selected_row_';

    function getStorageKey() {
        return keyPrefix + window.location.pathname;
    }

    // Check if the page was manually reloaded/refreshed. If so, clear stored focus.
    const isReload = (performance.getEntriesByType && performance.getEntriesByType('navigation')[0] &&
                      performance.getEntriesByType('navigation')[0].type === 'reload') ||
                     (performance.navigation && performance.navigation.type === 1);

    const currentPath = window.location.pathname;
    const referrer = document.referrer;
    let fromSameModule = false;
    if (referrer) {
        try {
            const refUrl = new URL(referrer);
            const refPath = refUrl.pathname;
            // Find if the referrer is from the same listing module prefix
            const listPaths = ['/account_master/', '/voucher/', '/bank-transaction/', '/section-c/', '/subsection-b2/', '/subsection-y/', '/grn/'];
            const currentListPath = listPaths.find(lp => currentPath.startsWith(lp));
            if (currentListPath && refPath.startsWith(currentListPath)) {
                fromSameModule = true;
            }

        } catch (e) {}
    }

    if (isReload || (!fromSameModule && referrer)) {
        // Clear saved listing state when refreshing or arriving from an entirely different page
        sessionStorage.removeItem(getStorageKey());
        sessionStorage.removeItem(getStorageKey() + '_next');
        sessionStorage.removeItem(getStorageKey() + '_prev');
        sessionStorage.removeItem(getStorageKey() + '_index');
        sessionStorage.removeItem(getStorageKey() + '_scroll');
        sessionStorage.removeItem('last_page_' + currentPath);
        sessionStorage.removeItem('last_list_url_' + currentPath);
    }

    // Automatically update the saved row focus of the parent list screen and handle back navigation url rewriting
    (function() {
        const path = window.location.pathname;
        const listPaths = ['/account_master/', '/voucher/', '/bank-transaction/', '/section-c/', '/subsection-b2/', '/subsection-y/', '/grn/'];
        
        const matchingListPath = listPaths.find(lp => path.startsWith(lp));
        
        if (matchingListPath) {
            if (path !== matchingListPath) {

                // We are on a detail/edit/create page of a module
                const match = path.match(/^\/(.*?)\/([^/]+)\/edit\/?$/);
                if (match) {
                    let pk = match[2];
                    
                    const idVoucherNumEl = document.getElementById('id_voucher_number');
                    const voucherNoEl = document.getElementById('voucherNo');
                    
                    if (idVoucherNumEl && idVoucherNumEl.value) {
                        pk = idVoucherNumEl.value.trim();
                    } else if (voucherNoEl && voucherNoEl.value) {
                        pk = voucherNoEl.value.trim();
                    }
                    
                    sessionStorage.setItem(keyPrefix + matchingListPath, pk);
                }

                // Rewrite back button href to point to the last saved page list URL
                const savedListUrl = sessionStorage.getItem('last_list_url_' + matchingListPath);
                if (savedListUrl) {
                    document.querySelectorAll('.erp-btn-back').forEach(btn => {
                        btn.href = savedListUrl;
                    });
                }
            } else {
                // We are on the listing page. Save current URL (with pagination / filter query params)
                sessionStorage.setItem('last_list_url_' + path, window.location.pathname + window.location.search);
                
                // If this is a server-rendered list, store the page number from url query param
                const params = new URLSearchParams(window.location.search);
                const page = params.get('page');
                if (page) {
                    sessionStorage.setItem('last_page_' + path, page);
                }
            }
        }
    })();

    // Passive scroll event listener to capture scroll positions on the listing pages
    document.addEventListener('scroll', function(e) {
        const target = e.target;
        const currentPath = window.location.pathname;
        const listPaths = ['/account_master/', '/voucher/', '/bank-transaction/', '/section-c/', '/subsection-b2/', '/subsection-y/', '/grn/'];
        if (!listPaths.includes(currentPath)) return;

        if (target === document || target === document.body || target === window) {

            sessionStorage.setItem(keyPrefix + currentPath + '_scroll', window.scrollY);
        } else if (target.matches && (target.matches('tbody') || target.classList.contains('erp-table-scroll'))) {
            sessionStorage.setItem(keyPrefix + currentPath + '_scroll', target.scrollTop);
        }
    }, { capture: true, passive: true });

    // ─────────────────────────────────────────────────────────────────────────
    // SMART SCROLL-INTO-VIEW
    // Works correctly for two architectures used across this project:
    //   1. AccountMaster List: tbody { display:block; overflow-y:scroll }
    //      → scrollIntoView() targets window, not tbody. Manual scrollTop needed.
    //   2. Other lists: <div class="erp-table-scroll" style="overflow-y:auto">
    //      → Same manual scrollTop fix works here too.
    // ─────────────────────────────────────────────────────────────────────────
    function findScrollContainer(element) {
        // Walk up the DOM to find the nearest element that actually scrolls
        let el = element.parentElement;
        while (el && el !== document.body) {
            const style = window.getComputedStyle(el);
            const overflowY = style.overflowY;
            // An element scrolls if its overflow is scroll/auto AND it has scrollable content
            if ((overflowY === 'scroll' || overflowY === 'auto') && el.scrollHeight > el.clientHeight) {
                return el;
            }
            el = el.parentElement;
        }
        return null;
    }

    function scrollRowIntoView(row) {
        if (!row) return;

        const container = findScrollContainer(row);

        const PADDING = 4; // px of breathing room above/below

        if (!container) {
            // No custom inner scroll container found — window/body is the scroll container!
            const rowRect = row.getBoundingClientRect();
            const viewportHeight = window.innerHeight || document.documentElement.clientHeight;
            
            // Check for fixed list footer height
            const footer = document.querySelector('.erp-list-footer-fixed');
            const footerHeight = footer ? footer.offsetHeight : 0;
            
            // Check for top sticky/fixed navbar/headers (e.g. navbar is 72px)
            const navbarHeight = 76; 
            
            const rowTop = rowRect.top;
            const rowBottom = rowRect.bottom;
            
            if (rowTop < navbarHeight + PADDING) {
                // Scroll window up
                window.scrollBy({
                    top: rowTop - navbarHeight - PADDING,
                    behavior: 'auto'
                });
            } else if (rowBottom > viewportHeight - footerHeight - PADDING) {
                // Scroll window down
                window.scrollBy({
                    top: rowBottom - (viewportHeight - footerHeight) + PADDING,
                    behavior: 'auto'
                });
            }
            return;
        }

        // Use getBoundingClientRect for accurate position relative to viewport
        const rowRect    = row.getBoundingClientRect();
        const contRect   = container.getBoundingClientRect();

        // Calculate sticky header height dynamically to avoid rows getting hidden under it
        const thead      = container.querySelector('thead');
        const headerHeight = thead ? thead.offsetHeight : 0;

        const rowTop    = rowRect.top    - contRect.top;    // row top relative to container visible area
        const rowBottom = rowRect.bottom - contRect.top;    // row bottom relative to container visible area
        const contHeight = container.clientHeight;

        const topBoundary = headerHeight + PADDING;
        const bottomBoundary = contHeight - PADDING;

        if (rowTop < topBoundary) {
            // Row is hidden behind or approaching the sticky header — scroll up to make it visible below the header
            container.scrollTo({
                top: container.scrollTop + rowTop - topBoundary,
                behavior: 'auto'
            });
        } else if (rowBottom > bottomBoundary) {
            // Row is below the visible area — scroll down to make it visible
            container.scrollTo({
                top: container.scrollTop + (rowBottom - bottomBoundary),
                behavior: 'auto'
            });
        }
        // If already fully visible, do nothing (no jitter)
    }

    // ─────────────────────────────────────────────────────────────────────────

    function updateNextPrevKeys(row) {
        if (!row) return;
        const tbody = row.closest('tbody') || row.parentElement;
        if (!tbody) return;
        const rows = Array.from(tbody.querySelectorAll('tr[data-row-id]')).filter(r => {
            return r.style.display !== 'none' && !r.classList.contains('d-none') && r.offsetHeight !== 0;
        });
        const index = rows.indexOf(row);
        if (index !== -1) {
            const nextRow = index < rows.length - 1 ? rows[index + 1] : null;
            const prevRow = index > 0 ? rows[index - 1] : null;

            const nextId = nextRow ? nextRow.getAttribute('data-row-id') : '';
            const prevId = prevRow ? prevRow.getAttribute('data-row-id') : '';

            sessionStorage.setItem(getStorageKey() + '_next', nextId);
            sessionStorage.setItem(getStorageKey() + '_prev', prevId);
        }
    }

    function saveRowId(rowId) {
        if (!rowId) return;
        sessionStorage.setItem(getStorageKey(), rowId);
        const row = document.querySelector(`tr[data-row-id="${CSS.escape(rowId)}"]`);
        if (row) {
            updateNextPrevKeys(row);

            // Store selected row index
            const tbody = row.closest('tbody') || row.parentElement;
            if (tbody) {
                const rows = Array.from(tbody.querySelectorAll('tr[data-row-id]')).filter(r => {
                    return r.style.display !== 'none' && !r.classList.contains('d-none') && r.offsetHeight !== 0;
                });
                const index = rows.indexOf(row);
                if (index !== -1) {
                    sessionStorage.setItem(getStorageKey() + '_index', index);
                }
            }

            // Store scroll position
            const container = findScrollContainer(row);
            if (container) {
                sessionStorage.setItem(getStorageKey() + '_scroll', container.scrollTop);
            } else {
                sessionStorage.setItem(getStorageKey() + '_scroll', window.scrollY);
            }
        }
    }

    function getSavedRowId() {
        return sessionStorage.getItem(getStorageKey());
    }

    function initializeRows() {
        document.querySelectorAll('tr[data-row-id]').forEach(row => {
            if (!row.hasAttribute('tabindex')) {
                row.setAttribute('tabindex', '-1');
            }
        });
    }

    function restore() {
        let lastSelectedId = getSavedRowId();
        if (!lastSelectedId) {
            // No row was previously selected/focused in this session/page lifecycle. Do not auto-focus anything.
            return;
        }
        let row = document.querySelector(`tr[data-row-id="${CSS.escape(lastSelectedId)}"]`);

        // If not found, try next sibling fallback
        if (!row) {
            const nextId = sessionStorage.getItem(getStorageKey() + '_next');
            if (nextId) {
                row = document.querySelector(`tr[data-row-id="${CSS.escape(nextId)}"]`);
                if (row) {
                    lastSelectedId = nextId;
                    sessionStorage.setItem(getStorageKey(), lastSelectedId);
                }
            }
        }

        // If still not found, try prev sibling fallback
        if (!row) {
            const prevId = sessionStorage.getItem(getStorageKey() + '_prev');
            if (prevId) {
                row = document.querySelector(`tr[data-row-id="${CSS.escape(prevId)}"]`);
                if (row) {
                    lastSelectedId = prevId;
                    sessionStorage.setItem(getStorageKey(), lastSelectedId);
                }
            }
        }

        // If still not found, fallback to first visible row
        if (!row) {
            const visibleRows = Array.from(document.querySelectorAll('tr[data-row-id]')).filter(r => {
                return r.style.display !== 'none' && !r.classList.contains('d-none') && r.offsetHeight !== 0;
            });
            if (visibleRows.length > 0) {
                row = visibleRows[0];
                lastSelectedId = row.getAttribute('data-row-id');
                sessionStorage.setItem(getStorageKey(), lastSelectedId);
            }
        }

        if (!row) return;

        // Update next/prev keys for future fallbacks
        updateNextPrevKeys(row);

        // Make sure all rows are initialized with tabindex
        initializeRows();

        // Clear focused-row and active-row classes from all other rows
        document.querySelectorAll('tr.focused-row, tr.active-row').forEach(r => {
            r.classList.remove('focused-row', 'active-row');
        });

        // Add classes to target row
        row.classList.add('focused-row', 'active-row');

        // Restore same scroll position
        const savedScroll = sessionStorage.getItem(getStorageKey() + '_scroll');
        const container = findScrollContainer(row);
        if (savedScroll !== null) {
            const scrollVal = parseInt(savedScroll, 10);
            if (container) {
                container.scrollTop = scrollVal;
            } else {
                window.scrollTo({ top: scrollVal, behavior: 'auto' });
            }
        } else {
            // Smart scroll fallback — keeps the target row visible inside its scroll container
            scrollRowIntoView(row);
        }

        // Set focus to the row programmatically
        row.setAttribute('tabindex', '-1');
        row.focus({ preventScroll: true });

        // Backup retry focus/scroll for slower renders/page transitions
        setTimeout(() => {
            const currentSaved = getSavedRowId();
            if (currentSaved === lastSelectedId) {
                const checkRow = document.querySelector(`tr[data-row-id="${CSS.escape(lastSelectedId)}"]`);
                if (checkRow) {
                    checkRow.setAttribute('tabindex', '-1');
                    checkRow.focus({ preventScroll: true });
                    const savedScrollRetry = sessionStorage.getItem(getStorageKey() + '_scroll');
                    const contRetry = findScrollContainer(checkRow);
                    if (savedScrollRetry !== null) {
                        const scrollVal = parseInt(savedScrollRetry, 10);
                        if (contRetry) {
                            // If the user already scrolled manually more than 5px, do not reset it
                            if (Math.abs(contRetry.scrollTop - scrollVal) <= 5) {
                                contRetry.scrollTop = scrollVal;
                            }
                        } else {
                            if (Math.abs(window.scrollY - scrollVal) <= 5) {
                                window.scrollTo({ top: scrollVal, behavior: 'auto' });
                            }
                        }
                    } else {
                        scrollRowIntoView(checkRow);
                    }
                }
            }
        }, 50);
    }

    // Synchronously save row and sibling state before any form submission (Delete / Mark Inactive / etc.)
    document.addEventListener('submit', function(e) {
        const form = e.target;
        let row = form.closest('tr[data-row-id]');
        if (!row) {
            const menu = form.closest('.erp-detached-dropdown, .dropdown-menu');
            if (menu && menu.id) {
                const btn = document.querySelector(`[data-menu-id="${menu.id}"]`);
                if (btn) {
                    row = btn.closest('tr[data-row-id]');
                }
            }
        }
        if (row) {
            const rowId = row.getAttribute('data-row-id');
            if (rowId) {
                saveRowId(rowId);
            }
        }
    });

    // Attach delegated click listener to save row ID on any click
    document.addEventListener('click', function(e) {
        let row = e.target.closest('tr[data-row-id]');
        if (!row) {
            // Check if we clicked inside a detached dropdown
            const menu = e.target.closest('.erp-detached-dropdown, .dropdown-menu');
            if (menu && menu.id) {
                const btn = document.querySelector(`[data-menu-id="${menu.id}"]`);
                if (btn) {
                    row = btn.closest('tr[data-row-id]');
                }
            }
        }

        if (row) {
            const rowId = row.getAttribute('data-row-id');
            if (rowId) {
                saveRowId(rowId);
            }

            // Clear focused-row and active-row classes from all other rows
            document.querySelectorAll('tr.focused-row, tr.active-row').forEach(r => {
                if (r !== row) {
                    r.classList.remove('focused-row', 'active-row');
                }
            });

            // Add classes to clicked row
            row.classList.add('focused-row', 'active-row');

            // Apply focus to the row only if they did not click an interactive input element
            const interactive = e.target.closest('input, select, textarea, button, a, .dropdown-menu, [role="button"]');
            if (!interactive) {
                row.setAttribute('tabindex', '-1');
                row.focus({ preventScroll: true });
            }
        }
    }, { capture: true });

    // Helper to trigger primary action (Edit / View) on Enter
    function triggerRowPrimaryAction(row) {
        // Trigger row click for modal lists (like accountmaster_list.html)
        row.click();

        // For list tables that use actions dropdown instead of row click (like voucher_list.html)
        const btn = row.querySelector('.action-dropdown button');
        if (btn) {
            let menu = null;
            if (btn.dataset.menuId) {
                menu = document.getElementById(btn.dataset.menuId);
            } else {
                menu = btn.nextElementSibling;
            }
            if (menu) {
                // Prioritize Edit, fallback to View
                const editLink = Array.from(menu.querySelectorAll('a, button')).find(el => {
                    const text = el.textContent.toLowerCase();
                    return text.includes('edit') && !text.includes('status') && !text.includes('delete');
                });
                const viewLink = Array.from(menu.querySelectorAll('a, button')).find(el => {
                    const text = el.textContent.toLowerCase();
                    return text.includes('view') || text.includes('detail');
                });
                const primaryLink = editLink || viewLink || menu.querySelector('a');
                if (primaryLink) {
                    primaryLink.click();
                }
            }
        }
    }

    // Attach global keydown listener for arrow key and Enter navigation on rows
    document.addEventListener('keydown', function(e) {
        const currentRow = document.activeElement;
        if (!currentRow || !currentRow.matches('tr[data-row-id]')) return;

        // Skip keyboard navigation if the user is typing in a nested interactive input inside the row
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT' || e.target.tagName === 'TEXTAREA') return;

        if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
            e.preventDefault(); // Prevent scrolling window

            const tbody = currentRow.closest('tbody') || currentRow.parentElement;
            if (!tbody) return;

            // Find all visible rows with data-row-id (optimized visibility check to prevent layout thrashing)
            const rows = Array.from(tbody.querySelectorAll('tr[data-row-id]')).filter(r => {
                return r.style.display !== 'none' && !r.classList.contains('d-none') && r.offsetHeight !== 0;
            });

            const currentIndex = rows.indexOf(currentRow);
            if (currentIndex === -1) return;

            let targetRow = null;
            if (e.key === 'ArrowDown' && currentIndex < rows.length - 1) {
                targetRow = rows[currentIndex + 1];
            } else if (e.key === 'ArrowUp' && currentIndex > 0) {
                targetRow = rows[currentIndex - 1];
            }

            if (targetRow) {
                // Clear active classes from previously selected rows only (more efficient than looping all rows)
                tbody.querySelectorAll('tr.focused-row, tr.active-row').forEach(r => {
                    r.classList.remove('focused-row', 'active-row');
                });

                // Focus and highlight target row
                targetRow.classList.add('focused-row', 'active-row');
                targetRow.setAttribute('tabindex', '-1');
                targetRow.focus({ preventScroll: true });

                // Smart scroll — keeps the target row visible inside its scroll container
                scrollRowIntoView(targetRow);

                // Save row ID
                const rowId = targetRow.getAttribute('data-row-id');
                if (rowId) {
                    saveRowId(rowId);
                }
            }
        } else if (e.key === 'Enter') {
            e.preventDefault();
            triggerRowPrimaryAction(currentRow);
        }
    });

    // --- Dynamic focus tracking for input/form grids ---
    document.addEventListener('focusin', function(e) {
        const target = e.target;
        const row = target.closest('tr');
        if (!row) return;

        // Skip if this is a listing row handled by normal click/selection (unless it has inputs)
        const cell = target.closest('td');
        if (!cell) return;

        const tbody = row.closest('tbody') || row.parentElement;
        if (tbody) {
            tbody.querySelectorAll('tr.focused-row, tr.active-row').forEach(r => {
                if (r !== row) {
                    r.classList.remove('focused-row', 'active-row');
                }
            });
        }
        row.classList.add('focused-row', 'active-row');
    });

    // --- Dynamic ArrowUp/ArrowDown column-wise navigation for inputs inside tables ---
    document.addEventListener('keydown', function(e) {
        if (e.key !== 'ArrowUp' && e.key !== 'ArrowDown') return;

        const target = e.target;

        // Skip if typing in an input but a Select2 dropdown is actively open (user is navigating search results)
        if (document.querySelector('.select2-container--open')) return;

        const cell = target.closest('td');
        const row = target.closest('tr');
        if (!cell || !row) return;

        // Verify the target is indeed an input control or Select2 selection box
        const isInput = target.matches('input, select, textarea, .select2-selection');
        if (!isInput) return;

        const cells = Array.from(row.cells);
        const colIndex = cells.indexOf(cell);
        if (colIndex === -1) return;

        const tbody = row.closest('tbody') || row.parentElement;
        if (!tbody) return;

        const rows = Array.from(tbody.querySelectorAll('tr')).filter(r => {
            return window.getComputedStyle(r).display !== 'none';
        });

        const rowIndex = rows.indexOf(row);
        if (rowIndex === -1) return;

        let targetRow = null;
        if (e.key === 'ArrowUp' && rowIndex > 0) {
            targetRow = rows[rowIndex - 1];
        } else if (e.key === 'ArrowDown' && rowIndex < rows.length - 1) {
            targetRow = rows[rowIndex + 1];
        }

        if (targetRow) {
            const targetCell = targetRow.cells[colIndex];
            if (targetCell) {
                // Find input/select inside target cell
                let control = targetCell.querySelector('input:not([disabled]), select:not([disabled]), textarea:not([disabled]), .select2-selection, [tabindex="0"]');
                if (control) {
                    // Handle Select2 hidden select redirection
                    if (control.tagName === 'SELECT' && control.classList.contains('select2-hidden-accessible')) {
                        const parent = control.parentElement;
                        const select2Selection = parent ? parent.querySelector('.select2-selection') : null;
                        if (select2Selection) {
                            control = select2Selection;
                        }
                    }
                    e.preventDefault(); // Stop default browser action
                    control.focus();
                }
            }
        }
    });

    // Expose utility globally
    window.erpRowRestore = {
        restore: restore,
        save: saveRowId,
        getSavedId: getSavedRowId,
        initializeRows: initializeRows,
        scrollRowIntoView: scrollRowIntoView   // exposed for external use if needed
    };

    // Auto-restore on DOMContentLoaded (covers server-rendered pages)
    document.addEventListener('DOMContentLoaded', () => {
        initializeRows();
        setTimeout(restore, 100);
    });
})();
