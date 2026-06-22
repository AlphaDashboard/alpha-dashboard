import { apiClient } from './client.js?v=147';
import { ENDPOINTS } from './endpoints.js?v=147';

export const SubsectionYAPI = {
    getAll(params = {}) {
        return apiClient.get(ENDPOINTS.SUBSECTION_Y, params);
    },

    getById(id) {
        return apiClient.get(ENDPOINTS.SUBSECTION_Y_DETAIL(id));
    },

    create(data) {
        return apiClient.post(ENDPOINTS.SUBSECTION_Y, data);
    },

    update(id, data) {
        return apiClient.put(ENDPOINTS.SUBSECTION_Y_DETAIL(id), data);
    },

    delete(id) {
        return apiClient.delete(ENDPOINTS.SUBSECTION_Y_DETAIL(id));
    }
};
