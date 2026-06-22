import { apiClient } from './client.js?v=147';
import { ENDPOINTS } from './endpoints.js?v=147';

export const SubsectionB2API = {
    getAll(params = {}) {
        return apiClient.get(ENDPOINTS.SUBSECTION_B2, params);
    },

    getById(id) {
        return apiClient.get(ENDPOINTS.SUBSECTION_B2_DETAIL(id));
    },

    create(data) {
        return apiClient.post(ENDPOINTS.SUBSECTION_B2, data);
    },

    update(id, data) {
        return apiClient.put(ENDPOINTS.SUBSECTION_B2_DETAIL(id), data);
    },

    delete(id) {
        return apiClient.delete(ENDPOINTS.SUBSECTION_B2_DETAIL(id));
    },

    getBalance(bankAccountId, upToDate = null) {
        const params = { bank_account_id: bankAccountId };
        if (upToDate) params.up_to_date = upToDate;
        return apiClient.get(`${ENDPOINTS.SUBSECTION_B2}balance/`, params);
    },

    getDashboard(params = {}) {
        return apiClient.get(`${ENDPOINTS.SUBSECTION_B2}dashboard/`, params);
    }
};

