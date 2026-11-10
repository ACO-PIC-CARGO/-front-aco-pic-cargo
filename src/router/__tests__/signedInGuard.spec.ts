import { beforeEach, describe, expect, test } from "vitest";
import type { RouteLocationNormalized } from "vue-router";
import signedInGuard from "@/router/signedInGuard";

const screen = (requiresAuth: boolean) => ({ matched: [{ meta: { requiresAuth } }] }) as unknown as RouteLocationNormalized;

describe("signedInGuard", () => {
  beforeEach(() => sessionStorage.clear());

  test("opens a screen for a tab with its token and its user", () => {
    sessionStorage.setItem("auth-token", "token");
    sessionStorage.setItem("dataUser", JSON.stringify([{ id: 4, id_branch: 1 }]));

    expect(signedInGuard(screen(true))).toBeUndefined();
  });

  test("sends a tab with no token to Login", () => {
    sessionStorage.setItem("dataUser", JSON.stringify([{ id: 4, id_branch: 1 }]));

    expect(signedInGuard(screen(true))).toEqual({ name: "Login" });
  });

  test("sends a tab that kept a token but lost its user to Login, as when another tab signed out", () => {
    sessionStorage.setItem("auth-token", "token");

    expect(signedInGuard(screen(true))).toEqual({ name: "Login" });
  });

  test("lets anyone open a screen that needs no session", () => {
    expect(signedInGuard(screen(false))).toBeUndefined();
  });
});
