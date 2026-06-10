import axios from "axios";
import router from "@/router";
const userData = JSON.parse(sessionStorage.getItem("dataUser"));
const token = sessionStorage.getItem("auth-token");

const http = axios.create({
  baseURL: process.env.VUE_APP_URL_MAIN,
  headers: {
    "Content-Type": "application/json",
    "X-User-ID": userData[0].users,
    "auth-token": token,
  },
});


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
  },
);

export default http;
