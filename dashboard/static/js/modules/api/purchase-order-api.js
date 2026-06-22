import { apiClient } from './client.js?v=147';
import { ENDPOINTS } from './endpoints.js?v=147';

export const PurchaseOrderAPI = {
    getAll(params = {}) {
        return apiClient.get(ENDPOINTS.SUBSECTION_X, params);
    },

    getById(id) {
        return apiClient.get(ENDPOINTS.SUBSECTION_X_DETAIL(id));
    },

    create(data) {
        return apiClient.post(ENDPOINTS.SUBSECTION_X, data);
    },

    update(id, data) {
        return apiClient.put(ENDPOINTS.SUBSECTION_X_DETAIL(id), data);
    },

    delete(id) {
        return apiClient.delete(ENDPOINTS.SUBSECTION_X_DETAIL(id));
    }
};
