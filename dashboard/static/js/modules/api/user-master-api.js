import { apiClient } from './client.js?v=148';

export const UserMasterAPI = {
    getAll(params = {}) {
        return apiClient.get('/api/user-master/', params);
    },

    getById(userId) {
        return apiClient.get(`/api/user-master/${userId}/`);
    },

    create(data) {
        return apiClient.post('/api/user-master/', data);
    },

    update(userId, data) {
        return apiClient.put(`/api/user-master/${userId}/`, data);
    },

    delete(userId) {
        return apiClient.request(`/api/user-master/${userId}/`, { method: 'DELETE' });
    },

    toggleStatus(userId) {
        return apiClient.post(`/api/user-master/${userId}/toggle_status/`);
    }
};
