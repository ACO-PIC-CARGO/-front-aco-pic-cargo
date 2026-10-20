import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";

vi.mock("@/api/http", () => ({ default: vi.fn() }));
vi.mock("@/router", () => ({ default: { push: vi.fn() } }));
vi.mock("sweetalert2", () => ({ default: { fire: vi.fn() } }));

async function activateFreshPinia() {
  const { createPinia, setActivePinia } = await import("pinia");
  setActivePinia(createPinia());
}

describe("root state read when the app loads", () => {
  beforeEach(() => {
    vi.resetModules();
    sessionStorage.clear();
  });
  afterEach(() => vi.useRealTimers());

  test("the master and log dates keep the day the app loaded, past midnight", async () => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date(2026, 9, 31, 23, 59));
    const { useMastersStore } = await import("@/stores/masters");
    const { useHousesStore } = await import("@/stores/houses");
    vi.setSystemTime(new Date(2026, 10, 1, 0, 1));

    await activateFreshPinia();
    const masters = useMastersStore();
    const houses = useHousesStore();

    expect([masters.master_fecha_eta, masters.master_fecha_etd, masters.master_fecha_disponibilidad]).toEqual([
      "2026-10-31",
      "2026-10-31",
      "2026-10-31",
    ]);
    expect(houses.bitacora_fecha).toBe("2026-10-31");
  });

  test("dataBranch is the session branch when the app loaded, not a later one", async () => {
    sessionStorage.setItem("dataBranch", JSON.stringify([{ id: 3 }]));
    const { useAppStore } = await import("@/stores/app");
    sessionStorage.setItem("dataBranch", JSON.stringify([{ id: 5 }]));

    await activateFreshPinia();

    expect(useAppStore().dataBranch).toEqual([{ id: 3 }]);
  });

  test("dataBranch is null when the app loaded without a session branch", async () => {
    const { useAppStore } = await import("@/stores/app");
    sessionStorage.setItem("dataBranch", JSON.stringify([{ id: 5 }]));

    await activateFreshPinia();

    expect(useAppStore().dataBranch).toBeNull();
  });
});
