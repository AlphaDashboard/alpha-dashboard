// Reusable HTTP Client

function getCookie(name) {
    let cookieValue = null;
    if (document.cookie && document.cookie !== '') {
        const cookies = document.cookie.split(';');
        for (let i = 0; i < cookies.length; i++) {
            const cookie = cookies[i].trim();
            if (cookie.substring(0, name.length + 1) === (name + '=')) {
                cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                break;
            }
        }
    }
    return cookieValue;
}

export const apiClient = {
    async request(url, options = {}) {
        if (!url || typeof url !== 'string' || url.includes('undefined')) {
            throw new Error(`Invalid API endpoint URL: "${url}". This is usually caused by an outdated browser cache. Please hard-refresh the page (Ctrl+Shift+R or Ctrl+F5).`);
        }
        const headers = {
            'Content-Type': 'application/json',
            'X-CSRFToken': getCookie('csrftoken'),
            ...options.headers,
        };

        const config = {
            ...options,
            headers,
        };

        try {
            const response = await fetch(url, config);
            
            // Handle 204 No Content
            if (response.status === 204) return null;
            
            let data = null;
            const contentType = response.headers.get('content-type');
            if (contentType && contentType.includes('application/json')) {
                data = await response.json();
            } else {
                const text = await response.text();
                // Truncate text if it is extremely long HTML to avoid breaking layout
                const cleanText = text.length > 500 ? text.substring(0, 500) + '...' : text;
                data = { detail: cleanText || `HTTP Error ${response.status}` };
            }
            
            if (!response.ok) {
                let errorMessage = data.detail;
                if (!errorMessage && typeof data === 'object' && data !== null) {
                    // Extract field validation errors (e.g., from Django Rest Framework)
                    const errors = [];
                    for (const [key, value] of Object.entries(data)) {
                        if (Array.isArray(value)) {
                            errors.push(`${key}: ${value.join(' ')}`);
                        } else if (typeof value === 'string') {
                            errors.push(`${key}: ${value}`);
                        }
                    }
                    if (errors.length > 0) {
                        errorMessage = errors.join('\\n');
                    }
                }
                
                const err = new Error(errorMessage || 'API Request Failed');
                err.status = response.status;
                err.responseData = data;
                throw err;
            }
            
            return data;
        } catch (error) {
            console.error('API Client Error:', error);
            throw error;
        }
    },

    get(url, params = {}) {
        const queryString = new URLSearchParams(params).toString();
        const fullUrl = queryString ? `${url}?${queryString}` : url;
        return this.request(fullUrl, { method: 'GET' });
    },

    post(url, data) {
        return this.request(url, {
            method: 'POST',
            body: JSON.stringify(data),
        });
    },

    put(url, data) {
        return this.request(url, {
            method: 'PUT',
            body: JSON.stringify(data),
        });
    },

    delete(url) {
        return this.request(url, { method: 'DELETE' });
    }
};
