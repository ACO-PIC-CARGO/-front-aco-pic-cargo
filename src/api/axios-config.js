import axios from "axios";
import router from "@/router";
import CryptoJS from "crypto-js";

const http = axios.create({
  baseURL: process.env.VUE_APP_URL_MAIN,
  headers: {
    "Content-Type": "application/json",
  },
});

// Interceptor de petición para inyectar headers dinámicamente
http.interceptors.request.use((config) => {
  const userData = JSON.parse(sessionStorage.getItem("dataUser"));
  const token = sessionStorage.getItem("auth-token");

  if (userData && userData[0].users) {
    config.headers["X-User-ID"] = userData[0].users;
  }

  if (token) {
    config.headers["auth-token"] = token;
  }

  return config;
});

// Interceptor de respuesta (igual al que tenías)
http.interceptors.response.use(
  (response) => {
    const token = response?.data?.token;
    if (token) sessionStorage.setItem("auth-token", token);
    return response;
  },
  (error) => {
    if (error?.response?.status === 401) {
      sessionStorage.clear(); // Limpieza más segura
      if (router.currentRoute.name !== "Login") {
        router.replace({ name: "Login" });
      }
    }
    return Promise.reject(error);
  },
);

export default http;
