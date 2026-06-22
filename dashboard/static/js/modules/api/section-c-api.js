import { apiClient } from './client.js?v=147';
import { ENDPOINTS } from './endpoints.js?v=147';

export const SectionCAPI = {
    getAll(params = {}) {
        return apiClient.get(ENDPOINTS.SECTION_C, params);
    },

    getById(id) {
        return apiClient.get(ENDPOINTS.SECTION_C_DETAIL(id));
    },

    create(data) {
        return apiClient.post(ENDPOINTS.SECTION_C, data);
    },

    update(id, data) {
        return apiClient.put(ENDPOINTS.SECTION_C_DETAIL(id), data);
    },

    delete(id) {
        return apiClient.delete(ENDPOINTS.SECTION_C_DETAIL(id));
    }
};
