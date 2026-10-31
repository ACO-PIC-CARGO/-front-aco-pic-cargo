import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { createPinia, setActivePinia } from "pinia";
import Swal from "sweetalert2";
import http from "@/api/http";
import { usePricingStore } from "@/stores/pricing";
import { CONNECTION_ERROR_MESSAGE } from "@/utils/request";

vi.mock("@/api/http", () => ({ default: Object.assign(vi.fn(), { post: vi.fn() }) }));
vi.mock("@/router", () => ({ default: { push: vi.fn(), currentRoute: { value: { params: {} } } } }));
vi.mock("sweetalert2", () => ({
  default: { fire: vi.fn(), showLoading: vi.fn(), close: vi.fn(), getConfirmButton: vi.fn() },
}));


beforeEach(() => {
  setActivePinia(createPinia());
  vi.clearAllMocks();
  sessionStorage.setItem("dataUser", JSON.stringify([{ id: 4, id_branch: 1 }]));
  vi.mocked(Swal.fire).mockResolvedValue({ isConfirmed: true } as never);
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

test("a calls report the server refuses shows its reason instead of saving it", async () => {
  vi.mocked(http).mockResolvedValue({
    data: new Blob([JSON.stringify({ estadoflag: false, mensaje: "El rango de fechas no puede superar 366 días.", tipomensaje: "TMSGADV" })], {
      type: "application/json",
    }),
  });

  await usePricingStore().imprimiReporteListadoCalls({});

  const calls = vi.mocked(Swal.fire).mock.calls;
  expect(calls[calls.length - 1]![0]).toMatchObject({ icon: "info", text: "El rango de fechas no puede superar 366 días." });
});

test("a calls report that never reaches the server replaces the waiting notice with what to do", async () => {
  vi.mocked(http).mockRejectedValue(new Error("Network Error"));

  await usePricingStore().imprimiReporteListadoCalls({});

  const calls = vi.mocked(Swal.fire).mock.calls;
  expect(calls[calls.length - 1]![0]).toMatchObject({ icon: "error", text: CONNECTION_ERROR_MESSAGE });
});
