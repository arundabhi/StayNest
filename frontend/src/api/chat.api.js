import axios from 'axios';

const API = axios.create({ baseURL: import.meta.env.VITE_API_URL });

// Add interceptor to attach token
API.interceptors.request.use((config) => {
  const token = localStorage.getItem("accessToken");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export const fetchMessages = (hotelId, page = 1) => 
  API.get(`/chats/${hotelId}?page=${page}`);

export const postMessage = (hotelId, messageData) => 
  API.post(`/chats/${hotelId}`, messageData);

export const markSeen = (hotelId) => 
  API.patch(`/chats/seen/${hotelId}`);