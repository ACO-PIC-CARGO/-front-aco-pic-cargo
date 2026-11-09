import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { createPinia, setActivePinia } from "pinia";
import { usePricingStore } from "@/stores/pricing";

vi.mock("@/router", () => ({ default: { push: vi.fn(), currentRoute: { value: { params: {} } } } }));


beforeEach(() => {
  setActivePinia(createPinia());
  vi.clearAllMocks();
  sessionStorage.setItem("dataUser", JSON.stringify([{ id: 4, id_branch: 1 }]));
});
afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

test("clearing the calls filters goes back to this month up to today", () => {
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(new Date(2026, 9, 30, 12));
  const pricing = usePricingStore();
  pricing.filtroCalls = { fechainicio: "2026-01-01", fechafin: "2026-10-31", tipopdf: 2, id_status: 3, fechaemisiondesde: "2026-02-01", estado: true };

  pricing.resetCallFilter();

  expect(pricing.filtroCalls).toEqual({ fechainicio: "2026-10-01", fechafin: "2026-10-30", tipopdf: 1 });
});
