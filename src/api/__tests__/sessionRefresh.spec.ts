import axios, { AxiosError } from "axios";
import type { AxiosAdapter, InternalAxiosRequestConfig } from "axios";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import {
  installSessionRefresh,
  isPersistentToken,
  readTokenPayload,
  refreshClient,
  tokenExpiresSoon,
} from "@/api/sessionRefresh";

const b64 = (value: object) => btoa(JSON.stringify(value)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
const jwt = (payload: object) => `h.${b64(payload)}.s`;
const inSeconds = (seconds: number) => Math.floor(Date.now() / 1000) + seconds;

// La renovación usa su propia instancia de axios; se reemplaza su adapter.
const refreshCall = vi.fn();
refreshClient.defaults.adapter = (async (config) => {
  const data = await refreshCall(config.url);
  return { data, status: 200, statusText: "", headers: {}, config };
}) as AxiosAdapter;

describe("access token helpers", () => {
  test("reads the session code even from tokens the backend renewed (nested payload)", () => {
    const renewed = jwt({ userId: { data: { id: 1 }, sid: "SES00000007" }, exp: inSeconds(900) });
    expect(readTokenPayload(renewed)?.sid).toBe("SES00000007");
    expect(isPersistentToken(renewed)).toBe(true);
    expect(isPersistentToken(jwt({ data: { id: 1 }, exp: inSeconds(900) }))).toBe(false);
  });

  test("a token is renewed a minute before it expires", () => {
    expect(tokenExpiresSoon(jwt({ sid: "S", exp: inSeconds(30) }))).toBe(true);
    expect(tokenExpiresSoon(jwt({ sid: "S", exp: inSeconds(600) }))).toBe(false);
    expect(tokenExpiresSoon("not-a-jwt")).toBe(true);
  });
});

describe("automatic renewal", () => {
  let sent: InternalAxiosRequestConfig[] = [];
  const client = axios.create();
  installSessionRefresh(client);

  const respond = (status: (config: InternalAxiosRequestConfig) => number): AxiosAdapter => (config) => {
    sent.push(config);
    const code = status(config);
    const response = { data: {}, status: code, statusText: "", headers: {}, config };
    return code < 400 ? Promise.resolve(response) : Promise.reject(new AxiosError("x", "E", config, null, response));
  };

  beforeEach(() => {
    sent = [];
    sessionStorage.clear();
    localStorage.clear();
    refreshCall.mockReset();
  });
  afterEach(() => {
    sessionStorage.clear();
    localStorage.clear();
  });

  test("an expiring persistent token is renewed before the request goes out", async () => {
    const fresh = jwt({ sid: "S1", exp: inSeconds(900) });
    refreshCall.mockResolvedValue({ estadoflag: true, token: fresh });
    sessionStorage.setItem("auth-token", jwt({ sid: "S1", exp: inSeconds(10) }));
    client.defaults.adapter = respond(() => 200);

    await client.get("/ping");

    expect(refreshCall).toHaveBeenCalledTimes(1);
    expect(sent[0]!.headers["auth-token"]).toBe(fresh);
    expect(localStorage.getItem("auth-token")).toBe(fresh);
  });

  test("several requests at once share a single renewal", async () => {
    const fresh = jwt({ sid: "S1", exp: inSeconds(900) });
    refreshCall.mockResolvedValue({ estadoflag: true, token: fresh });
    sessionStorage.setItem("auth-token", jwt({ sid: "S1", exp: inSeconds(10) }));
    client.defaults.adapter = respond(() => 200);

    await Promise.all([client.get("/a"), client.get("/b"), client.get("/c")]);

    expect(refreshCall).toHaveBeenCalledTimes(1);
  });

  test("a 401 is retried once with a renewed token", async () => {
    const fresh = jwt({ sid: "S1", exp: inSeconds(900) });
    refreshCall.mockResolvedValue({ estadoflag: true, token: fresh });
    client.defaults.adapter = respond((config) => (config.headers["auth-token"] === fresh ? 200 : 401));

    const response = await client.get("/ping", { headers: { "auth-token": "legacy" } });

    expect(response.status).toBe(200);
    expect(sent).toHaveLength(2);
  });

  test("when the session cannot be renewed the 401 reaches the screen", async () => {
    refreshCall.mockRejectedValue(new Error("401"));
    client.defaults.adapter = respond(() => 401);

    await expect(client.get("/ping", { headers: { "auth-token": "legacy" } })).rejects.toBeInstanceOf(AxiosError);
    expect(sent).toHaveLength(1);
  });
});
