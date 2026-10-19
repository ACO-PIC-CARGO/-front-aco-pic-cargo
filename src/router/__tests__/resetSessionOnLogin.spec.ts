import { beforeEach, describe, expect, test, vi } from "vitest";
import type { RouteLocationNormalized } from "vue-router";
import store from "@/store";
import resetSessionOnLogin from "@/router/resetSessionOnLogin";

vi.mock("@/store", () => ({ default: { dispatch: vi.fn() } }));

const route = (name: string) => ({ name }) as RouteLocationNormalized;

describe("resetSessionOnLogin", () => {
  beforeEach(() => vi.clearAllMocks());

  test("resets the subscriptions and legal pages sessions when entering Login", () => {
    resetSessionOnLogin(route("Login"));
    expect(store.dispatch).toHaveBeenCalledWith("subscriptions/resetSession");
    expect(store.dispatch).toHaveBeenCalledWith("legalPages/resetSession");
  });

  test("does nothing for any other route", () => {
    resetSessionOnLogin(route("Home"));
    expect(store.dispatch).not.toHaveBeenCalled();
  });
});
