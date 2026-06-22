import { apiClient } from './client.js?v=147';
import { ENDPOINTS } from './endpoints.js?v=147';

export const BankTransactionAPI = {
    getAll(params = {}) {
        return apiClient.get(ENDPOINTS.BANK_TRANSACTIONS, params);
    },

    getById(id) {
        return apiClient.get(ENDPOINTS.BANK_TRANSACTION_DETAIL(id));
    },

    create(data) {
        return apiClient.post(ENDPOINTS.BANK_TRANSACTIONS, data);
    },

    update(id, data) {
        return apiClient.put(ENDPOINTS.BANK_TRANSACTION_DETAIL(id), data);
    },

    delete(id) {
        return apiClient.delete(ENDPOINTS.BANK_TRANSACTION_DETAIL(id));
    }
};
