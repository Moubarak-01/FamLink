import axios, { AxiosInstance, InternalAxiosRequestConfig } from 'axios';

/**
 * Centralized Axios Client for FamLink
 * 
 * Automatically attaches the 'x-lang' header to every request
 * based on the user's current language preference stored in localStorage.
 */

const API_BASE_URL = (import.meta as any).env?.VITE_API_URL || 'http://localhost:3001';

const axiosClient: AxiosInstance = axios.create({
    baseURL: API_BASE_URL,
    timeout: 30000,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request Interceptor: Attach x-lang header
axiosClient.interceptors.request.use(
    (config: InternalAxiosRequestConfig) => {
        // Read current language from localStorage
        const currentLanguage = localStorage.getItem('language') || 'en';

        // Attach to headers (both x-lang and Accept-Language for full compatibility)
        config.headers.set('x-lang', currentLanguage);
        config.headers.set('Accept-Language', currentLanguage);

        // Attach Auth Token
        const token = localStorage.getItem('authToken');
        if (token) {
            config.headers.set('Authorization', `Bearer ${token}`);
        }

        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response Interceptor: Handle common errors
axiosClient.interceptors.response.use(
    (response) => response,
    (error) => {
        // Log error for debugging
        console.error('[AxiosClient] Request failed:', error.message);

        // Handle specific error codes if needed
        if (error.response?.status === 401) {
            // Could trigger logout or token refresh here
            console.warn('[AxiosClient] Unauthorized - consider refreshing token');
        }

        return Promise.reject(error);
    }
);

export default axiosClient;
