import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";

vi.mock("@/api/http", () => ({ default: Object.assign(vi.fn(), { post: vi.fn() }) }));
vi.mock("@/router", () => ({ default: { push: vi.fn() } }));
vi.mock("sweetalert2", () => ({ default: { fire: vi.fn() } }));

const login = (id: number) => sessionStorage.setItem("dataUser", JSON.stringify([{ id, id_branch: 1 }]));

async function freshStores() {
  const { createPinia, setActivePinia } = await import("pinia");
  setActivePinia(createPinia());
  const { useAduanaStore } = await import("@/stores/aduana");
  const { usePricingStore } = await import("@/stores/pricing");
  return { aduana: useAduanaStore(), pricing: usePricingStore() };
}

describe("values read when the app loads", () => {
  beforeEach(() => {
    vi.resetModules();
    sessionStorage.clear();
  });
  afterEach(() => vi.useRealTimers());

  test("the session user is the one present when the module loads, not a later login", async () => {
    login(4);
    const { userIdAtAppLoad } = await import("@/utils/appLoad");
    login(9);

    expect(userIdAtAppLoad).toBe(4);
  });

  test("without a session when the module loads, the user stays empty after a login", async () => {
    const { userIdAtAppLoad } = await import("@/utils/appLoad");
    login(9);

    expect(userIdAtAppLoad).toBe("");
  });

  test("the customs new quote starts with no seller or pricing user when the app loaded on the login page", async () => {
    await import("@/utils/appLoad");
    login(9);

    const { aduana } = await freshStores();

    expect([aduana.datosPrincipales.id_vendedor, aduana.datosPrincipales.id_pricing]).toEqual(["", ""]);
  });

  test("the customs new quote starts with the user the app loaded with", async () => {
    login(4);
    await import("@/utils/appLoad");
    login(9);

    const { aduana } = await freshStores();

    expect([aduana.datosPrincipales.id_vendedor, aduana.datosPrincipales.id_pricing]).toEqual([4, 4]);
  });

  test("the quote and calls lists start from the dates of the day the app loaded", async () => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date(2026, 9, 31, 23, 59));
    await import("@/utils/appLoad");
    vi.setSystemTime(new Date(2026, 10, 1, 0, 1));

    const { pricing } = await freshStores();

    expect([pricing.filtro, pricing.filtroCalls]).toEqual([
      { fechainicio: "2026-01-01", fechafin: "2026-10-31", tipopdf: 1 },
      { fechainicio: "2026-01-01", fechafin: "2026-10-31", tipopdf: 1 },
    ]);
    expect(pricing.filtro).not.toBe(pricing.filtroCalls);
  });
});
