import { AxiosError } from "axios";
import type { AxiosAdapter, InternalAxiosRequestConfig } from "axios";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import router from "@/router";
import http from "@/api/http";

vi.mock("@/router", () => ({
  default: { replace: vi.fn(), currentRoute: { value: { name: "x" } } },
}));

let sentConfig: InternalAxiosRequestConfig | undefined;

const respondWith = (status: number, data: unknown = {}): AxiosAdapter => (config) => {
  sentConfig = config;
  const response = { data, status, statusText: "", headers: {}, config };
  return status >= 400
    ? Promise.reject(new AxiosError("failed", "ERR_BAD_REQUEST", config, null, response))
    : Promise.resolve(response);
};

describe("http client", () => {
  beforeEach(() => {
    sentConfig = undefined;
    sessionStorage.clear();
    localStorage.clear();
    vi.mocked(router.replace).mockClear();
    http.defaults.adapter = respondWith(200);
  });

  afterEach(() => {
    sessionStorage.clear();
    localStorage.clear();
  });

  it("sends branch, user and token headers from sessionStorage", async () => {
    sessionStorage.setItem("dataUser", JSON.stringify([{ id_branch: 7, users: 42 }]));
    sessionStorage.setItem("auth-token", "abc");

    await http.get("/ping");

    expect(sentConfig?.headers.get("X-Branch-ID")).toBe("7");
    expect(sentConfig?.headers.get("X-User-ID")).toBe("42");
    expect(sentConfig?.headers.get("auth-token")).toBe("abc");
  });

  it("sends no identity headers without a session", async () => {
    await http.get("/ping");

    expect(sentConfig?.headers.has("X-Branch-ID")).toBe(false);
    expect(sentConfig?.headers.has("X-User-ID")).toBe(false);
    expect(sentConfig?.headers.has("auth-token")).toBe(false);
  });

  it("keeps the JSON content type for plain payloads", async () => {
    await http.post("/save", { a: 1 });

    expect(sentConfig?.headers.get("Content-Type")).toBe("application/json");
  });

  it("drops the content type for FormData so the browser sets the boundary", async () => {
    await http.post("/upload", new FormData());

    expect(sentConfig?.headers.get("Content-Type")).not.toBe("application/json");
  });

  it("stores the token returned by a response", async () => {
    http.defaults.adapter = respondWith(200, { token: "fresh" });

    await http.get("/login");

    expect(sessionStorage.getItem("auth-token")).toBe("fresh");
    expect(localStorage.getItem("auth-token")).toBe("fresh");
  });

  it("clears the session and redirects to Login on 401", async () => {
    sessionStorage.setItem("auth-token", "stale");
    http.defaults.adapter = respondWith(401);

    await expect(http.get("/secure")).rejects.toBeInstanceOf(AxiosError);

    expect(sessionStorage.getItem("auth-token")).toBeNull();
    expect(router.replace).toHaveBeenCalledWith({ name: "Login" });
  });

  it("removes only the token from localStorage on 401", async () => {
    localStorage.setItem("auth-token", "stale");
    localStorage.setItem("dataUser", "kept");
    http.defaults.adapter = respondWith(401);

    await expect(http.get("/secure")).rejects.toBeInstanceOf(AxiosError);

    expect(localStorage.getItem("auth-token")).toBeNull();
    expect(localStorage.getItem("dataUser")).toBe("kept");
  });

  it("does not redirect again when already on Login", async () => {
    router.currentRoute.value.name = "Login";
    http.defaults.adapter = respondWith(401);

    await expect(http.get("/secure")).rejects.toBeInstanceOf(AxiosError);

    expect(router.replace).not.toHaveBeenCalled();
    router.currentRoute.value.name = "x";
  });

  it("leaves other errors alone", async () => {
    sessionStorage.setItem("auth-token", "keep");
    http.defaults.adapter = respondWith(500);

    await expect(http.get("/boom")).rejects.toBeInstanceOf(AxiosError);

    expect(sessionStorage.getItem("auth-token")).toBe("keep");
    expect(router.replace).not.toHaveBeenCalled();
  });
});

