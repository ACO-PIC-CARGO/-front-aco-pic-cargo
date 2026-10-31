import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { flushPromises, shallowMount } from "@vue/test-utils";
import { createPinia, setActivePinia } from "pinia";
import Swal from "sweetalert2";
import ListCallComponent from "@/components/folderPricing/ListCallComponent.vue";
import { useAppStore } from "@/stores/app";
import { usePricingStore } from "@/stores/pricing";

vi.mock("@/api/http", () => ({ default: Object.assign(vi.fn(), { post: vi.fn() }) }));
vi.mock("@/router", () => ({ default: { push: vi.fn(), currentRoute: { value: { params: {} } } } }));
vi.mock("sweetalert2", () => ({ default: { fire: vi.fn() } }));

interface CallsScreen {
  loading4: boolean;
  limpiar(): Promise<void>;
  imprimierCalls(): Promise<void>;
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(Swal.fire).mockResolvedValue({ isConfirmed: true } as never);
});
afterEach(() => vi.restoreAllMocks());

async function mountCalls() {
  const pinia = createPinia();
  setActivePinia(pinia);
  const wrapper = shallowMount(ListCallComponent, { global: { plugins: [pinia] } });
  await flushPromises();
  return { pricing: usePricingStore(), app: useAppStore(), screen: wrapper.vm as unknown as CallsScreen };
}

test("clearing the calls filters unblocks the screen even when the list fails", async () => {
  const { pricing, app, screen } = await mountCalls();
  vi.spyOn(pricing, "getQuoteCall").mockRejectedValue(new Error("Network Error"));

  await screen.limpiar().catch(() => {});

  expect(app.spiner).toBe(false);
});

test("the calls report unblocks its button even when it fails", async () => {
  const { pricing, screen } = await mountCalls();
  pricing.filtroCalls = { fechainicio: "2026-10-01", fechafin: "2026-10-30", tipopdf: 1 };
  vi.spyOn(pricing, "imprimiReporteListadoCalls").mockRejectedValue(new Error("Network Error"));

  await screen.imprimierCalls().catch(() => {});

  expect(screen.loading4).toBe(false);
});

test("the calls report accepts a range of up to a year", async () => {
  const { pricing, screen } = await mountCalls();
  pricing.filtroCalls = { fechainicio: "2026-01-01", fechafin: "2026-10-30", tipopdf: 1 };
  const report = vi.spyOn(pricing, "imprimiReporteListadoCalls").mockResolvedValue(undefined);

  await screen.imprimierCalls();

  expect(report).toHaveBeenCalled();
});
