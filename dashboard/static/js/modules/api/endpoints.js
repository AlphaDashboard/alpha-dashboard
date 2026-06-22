export const ENDPOINTS = {
    BANK_TRANSACTIONS:         '/api/bank-transactions/',
    BANK_TRANSACTION_DETAIL:   (id) => `/api/bank-transactions/${id}/`,
    ALPHA_SEARCH:              '/api/accountmaster-search/',
    SECTION_C:                 '/api/section-c/',
    SECTION_C_DETAIL:          (id) => `/api/section-c/${id}/`,
    // ─── Sub Section B-2 (appended — do not modify existing entries above) ───
    SUBSECTION_B2:             '/api/subsection-b2/',
    SUBSECTION_B2_DETAIL:      (id) => `/api/subsection-b2/${id}/`,
    // ─── Sub Section X (Purchase Order) ───
    SUBSECTION_X:              '/api/subsection-x/',
    SUBSECTION_X_DETAIL:       (id) => `/api/subsection-x/${id}/`,
    // ─── Sub Section Y ───
    SUBSECTION_Y:              '/api/subsection-y/',
    SUBSECTION_Y_DETAIL:       (id) => `/api/subsection-y/${id}/`,
    // ─── Sales/Purchase Group ───
    SAL_PUR_GROUP:             '/api/sal-pur-group/',
    SAL_PUR_GROUP_DETAIL:      (id) => `/api/sal-pur-group/${id}/`,
};
