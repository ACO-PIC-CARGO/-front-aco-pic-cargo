import axios from "axios";
import type { AxiosError, AxiosResponse, InternalAxiosRequestConfig } from "axios";
import router from "@/router";

interface SessionUserEntry {
  id_branch?: number | string;
  users?: number | string;
}

const readSessionUser = (): [SessionUserEntry, ...SessionUserEntry[]] | null =>
  JSON.parse(sessionStorage.getItem("dataUser") as string);

const http = axios.create({
  baseURL: import.meta.env.VITE_URL_MAIN,
  headers: {
    "Content-Type": "application/json",
  },
});

http.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const userData = readSessionUser();
  const branch = readSessionUser();
  const token = sessionStorage.getItem("auth-token");

  if (branch && branch[0].id_branch) {
    config.headers["X-Branch-ID"] = branch[0].id_branch;
  }

  if (userData && userData[0].users) {
    config.headers["X-User-ID"] = userData[0].users;
  }

  if (token) {
    config.headers["auth-token"] = token;
  }

  // axios 1 serialises FormData to JSON under a JSON content type; let the browser set the multipart boundary.
  if (config.data instanceof FormData) {
    config.headers.delete("Content-Type");
  }

  return config;
});

http.interceptors.response.use(
  (response: AxiosResponse) => {
    const token = response?.data?.token;
    if (token) sessionStorage.setItem("auth-token", token);
    return response;
  },
  (error: AxiosError) => {
    if (error?.response?.status === 401) {
      sessionStorage.clear();
      if (router.currentRoute.value.name !== "Login") {
        router.replace({ name: "Login" });
      }
    }
    return Promise.reject(error);
  },
);

export default http;
