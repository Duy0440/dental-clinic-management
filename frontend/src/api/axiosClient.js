import axios from "axios";

import { API_BASE_URL } from "./urlHelpers";

// axios client (cau hinh url backend)
const axiosClient = axios.create({
  baseURL: API_BASE_URL,
});

// attach token (gan jwt vao moi request neu da dang nhap)
axiosClient.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

// handle auth error (het phien thi ve trang dang nhap)
axiosClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");

      if (window.location.pathname !== "/login") {
        window.location.href = "/login";
      }
    }

    return Promise.reject(error);
  },
);

export default axiosClient;
