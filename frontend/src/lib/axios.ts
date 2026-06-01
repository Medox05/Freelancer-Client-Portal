import axios from "axios";
import { getToken } from "./auth";

const getBaseURL = () => {
  if (import.meta.env.VITE_API_URL) return import.meta.env.VITE_API_URL;
  
  // Fallback for different environments
  const hostname = window.location.hostname;
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    // Prioritize localhost:8000 (standard for php artisan serve)
    return 'http://localhost:8000/api'; 
  }
  
  return `http://${hostname}:8000/api`; // Secondary local fallback
};

const api = axios.create({
  baseURL: getBaseURL(),
});

api.interceptors.request.use((config) => {
  const token = getToken();

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

export default api;