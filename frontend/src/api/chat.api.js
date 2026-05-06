import api from "./axios.config";

export const fetchMessages = (hotelId, page = 1) =>
  api.get(`/chats/${hotelId}?page=${page}`);

export const postMessage = (hotelId, messageData) =>
  api.post(`/chats/${hotelId}`, messageData);

export const markSeen = (hotelId) => api.patch(`/chats/seen/${hotelId}`);
