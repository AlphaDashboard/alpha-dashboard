import { apiClient } from './client.js?v=149';
import { ENDPOINTS } from './endpoints.js?v=149';

export const PurchaseBillAPI = {
    getAll(params = {}) {
        return apiClient.get(ENDPOINTS.PURCHASE_BILL, params);
    },

    getById(id) {
        return apiClient.get(ENDPOINTS.PURCHASE_BILL_DETAIL(id));
    },

    create(data) {
        return apiClient.post(ENDPOINTS.PURCHASE_BILL, data);
    },

    update(id, data) {
        return apiClient.put(ENDPOINTS.PURCHASE_BILL_DETAIL(id), data);
    },

    patch(id, data) {
        return apiClient.patch(ENDPOINTS.PURCHASE_BILL_DETAIL(id), data);
    },

    delete(id) {
        return apiClient.delete(ENDPOINTS.PURCHASE_BILL_DETAIL(id));
    }
};
