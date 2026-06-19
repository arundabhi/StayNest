import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  withCredentials: true,
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("accessToken");
    if (token && token !== "null" && token !== "undefined") {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      !originalRequest.url.includes("/auth/login") &&
      !originalRequest.url.includes("/auth/refresh-token")
    ) {
      originalRequest._retry = true;

      try {
        const res = await api.post("/auth/refresh-token");
        const newAccessToken = res.data.accessToken;

        if (newAccessToken) {
          localStorage.setItem("accessToken", newAccessToken);
          originalRequest.headers = {
            ...originalRequest.headers,
            Authorization: `Bearer ${newAccessToken}`,
          };
        } else {
          if (originalRequest.headers) {
            delete originalRequest.headers.Authorization;
          }
        }

        return api(originalRequest);
      } catch (err) {
        localStorage.removeItem("accessToken");

        const currentPath = window.location.pathname;

        if (currentPath !== "/auth") {
          window.location.href = `/auth?redirect=${encodeURIComponent(currentPath)}`;
        }

        return Promise.reject(err);
      }
    }

    return Promise.reject(error);
  },
);

export default api;
