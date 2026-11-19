import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import type { RouteLocationNormalized } from "vue-router";
import resumeSessionGuard, { RESUME_TIMEOUT_MS } from "@/router/resumeSessionGuard";

const retomarSesion = vi.fn<() => Promise<boolean>>();
vi.mock("@/stores/securitys", () => ({ useSecuritysStore: () => ({ retomarSesion }) }));

const jwt = (payload: object) => `h.${btoa(JSON.stringify(payload))}.s`;
const inSeconds = (seconds: number) => Math.floor(Date.now() / 1000) + seconds;

const login = (redirect?: string) =>
  ({ name: "Login", query: redirect ? { redirect } : {} }) as unknown as RouteLocationNormalized;

const rememberUser = () => sessionStorage.setItem("dataUser", JSON.stringify([{ id: 4, id_user: 9, id_branch: 1 }]));

describe("resumeSessionGuard", () => {
  beforeEach(() => {
    sessionStorage.clear();
    localStorage.clear();
    retomarSesion.mockReset();
  });
  afterEach(() => vi.useRealTimers());

  test("shows the sign-in form when this device never signed in, without asking the server", async () => {
    expect(await resumeSessionGuard(login())).toBeUndefined();
    expect(retomarSesion).not.toHaveBeenCalled();
  });

  test("goes straight to Main when the remembered session is still open", async () => {
    rememberUser();
    sessionStorage.setItem("auth-token", jwt({ sid: "S1", exp: inSeconds(900) }));
    retomarSesion.mockResolvedValue(true);

    expect(await resumeSessionGuard(login())).toEqual({ name: "Main" });
  });

  test("opens the screen the shortcut or link pointed to", async () => {
    rememberUser();
    retomarSesion.mockResolvedValue(true);

    expect(await resumeSessionGuard(login("/home/FolderBanks/ingresosPendientesConfirmar"))).toBe(
      "/home/FolderBanks/ingresosPendientesConfirmar",
    );
  });

  test("never redirects to another site", async () => {
    rememberUser();
    retomarSesion.mockResolvedValue(true);

    expect(await resumeSessionGuard(login("//evil.example"))).toEqual({ name: "Main" });
  });

  test("shows the sign-in form when the session was closed", async () => {
    rememberUser();
    retomarSesion.mockResolvedValue(false);

    expect(await resumeSessionGuard(login())).toBeUndefined();
  });

  test("enters with a classic sign-in that is still valid, without asking the server", async () => {
    rememberUser();
    sessionStorage.setItem("auth-token", jwt({ data: { id: 9 }, exp: inSeconds(3600) }));
    sessionStorage.setItem("dataBranch", JSON.stringify([{ id: 1, esnuevoflag: false }]));
    sessionStorage.setItem("menu", "[]");

    expect(await resumeSessionGuard(login())).toEqual({ name: "Main" });
    expect(retomarSesion).not.toHaveBeenCalled();
  });

  test("does not ask for a refresh cookie that a classic sign-in never had", async () => {
    rememberUser();
    sessionStorage.setItem("auth-token", jwt({ data: { id: 9 }, exp: inSeconds(-60) }));

    expect(await resumeSessionGuard(login())).toBeUndefined();
    expect(retomarSesion).not.toHaveBeenCalled();
  });

  test("shows the sign-in form if the server takes too long", async () => {
    vi.useFakeTimers();
    rememberUser();
    retomarSesion.mockReturnValue(new Promise(() => {}));

    const result = resumeSessionGuard(login());
    await vi.advanceTimersByTimeAsync(RESUME_TIMEOUT_MS);

    expect(await result).toBeUndefined();
  });

  test("leaves other screens alone", async () => {
    rememberUser();
    expect(await resumeSessionGuard({ name: "Main", query: {} } as unknown as RouteLocationNormalized)).toBeUndefined();
  });
});
