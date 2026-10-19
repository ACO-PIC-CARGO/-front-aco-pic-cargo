import { beforeEach, describe, expect, test, vi } from "vitest";
import type { RouteLocationNormalized } from "vue-router";
import resetSessionOnLogin from "@/router/resetSessionOnLogin";

const subscriptionsStore = { resetSession: vi.fn() };
const legalPagesStore = { resetSession: vi.fn() };

vi.mock("@/stores/subscriptions", () => ({ useSubscriptionsStore: () => subscriptionsStore }));
vi.mock("@/stores/legalPages", () => ({ useLegalPagesStore: () => legalPagesStore }));

const route = (name: string) => ({ name }) as RouteLocationNormalized;

describe("resetSessionOnLogin", () => {
  beforeEach(() => vi.clearAllMocks());

  test("resets the subscriptions and legal pages sessions when entering Login", () => {
    resetSessionOnLogin(route("Login"));
    expect(subscriptionsStore.resetSession).toHaveBeenCalledTimes(1);
    expect(legalPagesStore.resetSession).toHaveBeenCalledTimes(1);
  });

  test("does nothing for any other route", () => {
    resetSessionOnLogin(route("Home"));
    expect(subscriptionsStore.resetSession).not.toHaveBeenCalled();
    expect(legalPagesStore.resetSession).not.toHaveBeenCalled();
  });
});
