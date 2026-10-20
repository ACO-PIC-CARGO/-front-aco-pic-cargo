import { AxiosError } from "axios";
import type { AxiosAdapter } from "axios";
import { afterEach, describe, expect, it, vi } from "vitest";
import http from "@/plugins/axios";

vi.mock("@/router", () => ({
  default: { replace: vi.fn(), currentRoute: { value: { name: "x" } } },
}));

const respondWith = (status: number, data: unknown = {}): AxiosAdapter => (config) => {
  const response = { data, status, statusText: "", headers: {}, config };
  return status >= 400
    ? Promise.reject(new AxiosError("failed", "ERR_BAD_REQUEST", config, null, response))
    : Promise.resolve(response);
};

describe("axios plugin client", () => {
  afterEach(() => {
    sessionStorage.clear();
    localStorage.clear();
  });

  it("stores the returned token in sessionStorage and localStorage", async () => {
    http.defaults.adapter = respondWith(200, { token: "fresh" });

    await http.get("/login");

    expect(sessionStorage.getItem("auth-token")).toBe("fresh");
    expect(localStorage.getItem("auth-token")).toBe("fresh");
  });

  it("removes the token from both storages on 401", async () => {
    sessionStorage.setItem("auth-token", "stale");
    localStorage.setItem("auth-token", "stale");
    http.defaults.adapter = respondWith(401);

    await expect(http.get("/secure")).rejects.toBeInstanceOf(AxiosError);

    expect(sessionStorage.getItem("auth-token")).toBeNull();
    expect(localStorage.getItem("auth-token")).toBeNull();
  });
});
