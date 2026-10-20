import type { AxiosError, AxiosResponse, InternalAxiosRequestConfig } from "axios";
import axios from '@/api/http';
import router from "@/router";

const http = axios.create({
  baseURL: import.meta.env.VITE_URL_MAIN,
  headers: {
    "Content-Type": "application/json",
  },
});

http.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = sessionStorage.getItem("auth-token");
    if (token) {
      config.headers["auth-token"] = token;
    }
    return config;
  },
  (error: unknown) => Promise.reject(error)
);

http.interceptors.response.use(
  (response: AxiosResponse) => {
    try {
      const token = response?.data?.token;
      if (token) sessionStorage.setItem("auth-token", token);
    } catch {}
    return response;
  },
  (error: AxiosError) => {
    const status = error?.response?.status;
    if (status === 401) {
      try {
        sessionStorage.removeItem("auth-token");
        sessionStorage.removeItem("security");
      } catch {}
      if (router.currentRoute.value.name !== "Login") {
        router.replace({ name: "Login" });
      }
    }
    return Promise.reject(error);
  }
);

export default http;

