import { beforeEach, describe, expect, test, vi } from "vitest";
import type { RouteLocationNormalized } from "vue-router";
import store from "@/store";
import resetSessionOnLogin from "@/router/resetSessionOnLogin";

const subscriptionsStore = { resetSession: vi.fn() };

vi.mock("@/store", () => ({ default: { dispatch: vi.fn() } }));
vi.mock("@/stores/subscriptions", () => ({ useSubscriptionsStore: () => subscriptionsStore }));

const route = (name: string) => ({ name }) as RouteLocationNormalized;

describe("resetSessionOnLogin", () => {
  beforeEach(() => vi.clearAllMocks());

  test("resets the subscriptions and legal pages sessions when entering Login", () => {
    resetSessionOnLogin(route("Login"));
    expect(subscriptionsStore.resetSession).toHaveBeenCalledTimes(1);
    expect(store.dispatch).toHaveBeenCalledWith("legalPages/resetSession");
  });

  test("does nothing for any other route", () => {
    resetSessionOnLogin(route("Home"));
    expect(subscriptionsStore.resetSession).not.toHaveBeenCalled();
    expect(store.dispatch).not.toHaveBeenCalled();
  });
});
