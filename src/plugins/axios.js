import axios from '@/api/axios-config';
import router from "@/router";

const http = axios.create({
  baseURL: process.env.VUE_APP_URL_MAIN,
  headers: {
    "Content-Type": "application/json",
  },
});

http.interceptors.request.use(
  (config) => {
    const token = sessionStorage.getItem("auth-token");
    if (token) {
      config.headers["auth-token"] = token;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

http.interceptors.response.use(
  (response) => {
    try {
      const token = response?.data?.token;
      if (token) sessionStorage.setItem("auth-token", token);
    } catch (_) {}
    return response;
  },
  (error) => {
    const status = error?.response?.status;
    if (status === 401) {
      try {
        sessionStorage.removeItem("auth-token");
        sessionStorage.removeItem("security");
      } catch (_) {}
      if (router.currentRoute.name !== "Login") {
        router.replace({ name: "Login" });
      }
    }
    return Promise.reject(error);
  }
);

export default http;

