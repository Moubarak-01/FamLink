
import axios from 'axios';

// Default to localhost for development, can be configured via env vars
const API_URL = 'http://localhost:3001';

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000, // Increased timeout to 10 seconds
});

// Helper to recursively transform _id to id
const transformId = (data: any): any => {
  if (Array.isArray(data)) {
    return data.map(transformId);
  } else if (data !== null && typeof data === 'object') {
    // If object has _id and no id, map it.
    if (data._id && !data.id) {
      data.id = data._id;
    }
    // Recursively transform keys
    Object.keys(data).forEach(key => {
      data[key] = transformId(data[key]);
    });
    return data;
  }
  return data;
};

// Request interceptor for adding the bearer token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor to handle errors globally and transform data
api.interceptors.response.use(
    (response) => {
        if (response.data) {
            // Automatically transform _id to id for all responses
            response.data = transformId(response.data);
        }
        return response;
    },
    (error) => {
        console.error("API Error:", error);

        // Network Error (Backend Down)
        if (error.code === 'ERR_NETWORK' || error.message === 'Network Error') {
            console.warn("⚠️ Backend not reachable.");
             // Reject with a custom message format that App.tsx expects
            return Promise.reject({ 
                response: { 
                    data: { 
                        message: "Cannot connect to server. Please ensure the backend is running on port 3001 and MongoDB is active." 
                    } 
                } 
            });
        }

        // Session Expired
        if (error.response && error.response.status === 401) {
            console.warn("Session expired or unauthorized, logging out...");
            localStorage.removeItem('authToken');
            // Allow the UI to handle the redirect/state change
        }

        // Pass through the actual server error message if available
        if (error.response && error.response.data && error.response.data.message) {
             // Sometimes NestJS returns message as an array of strings (validation errors)
             if (Array.isArray(error.response.data.message)) {
                 error.response.data.message = error.response.data.message.join(', ');
             }
             return Promise.reject(error);
        }

        return Promise.reject(error);
    }
);