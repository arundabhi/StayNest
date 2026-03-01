import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  withCredentials: true, // 🔥 REQUIRED for refreshToken cookie
});

/* Attach access token */
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("accessToken");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

/* Refresh token logic */
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // ⛔ Don't refresh on login/register
    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      !originalRequest.url.includes("/auth/login")
    ) {
      originalRequest._retry = true;

      try {
        const res = await api.post("/auth/refresh");

        localStorage.setItem("accessToken", res.data.accessToken);

        originalRequest.headers.Authorization =
          `Bearer ${res.data.accessToken}`;

        return api(originalRequest);
      } catch (err) {
        localStorage.removeItem("accessToken");

        const currentPath = window.location.pathname;

        if (currentPath !== "/auth") {
          window.location.href =
            `/auth?redirect=${encodeURIComponent(currentPath)}`;
        }

        return Promise.reject(err);
      }
    }

    return Promise.reject(error);
  }
);


export default api;
