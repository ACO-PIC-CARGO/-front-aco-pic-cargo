import { afterEach, beforeEach, expect, test, vi } from "vitest";
import type { Mock } from "vitest";
import { flushPromises, mount } from "@vue/test-utils";
import type { VueWrapper } from "@vue/test-utils";
import { createPinia, setActivePinia } from "pinia";
import { createVuetify } from "vuetify";
import * as components from "vuetify/components";
import * as directives from "vuetify/directives";
import { VAutocomplete } from "vuetify/components";
import http from "@/api/http";
import HouseQuoteAssociation from "@/components/HouseFile/HouseQuoteAssociation.vue";
import { useHousesStore } from "@/stores/houses";
import { useHouseEditStore } from "@/stores/houseEdit";
import { usePricingStore } from "@/stores/pricing";
import { editFormFromHouse } from "@/components/HouseFile/houseEditForm";
import type { HouseDetalle } from "@/types/operaciones";

vi.mock("@/api/http", () => ({ default: vi.fn() }));
vi.mock("@/router", () => ({ default: { push: vi.fn() } }));
vi.mock("sweetalert2", () => ({ default: { fire: vi.fn() } }));
globalThis.ResizeObserver ??= class {
  observe() {}
  unobserve() {}
  disconnect() {}
};
Object.defineProperty(window, "visualViewport", {
  value: { width: 1024, height: 768, addEventListener() {}, removeEventListener() {} },
  configurable: true,
});

const httpMock = http as unknown as Mock<(config: Record<string, unknown>) => Promise<{ data: unknown }>>;
const house = { id: 2856, id_master: 77, id_cot: null, id_quoteaduana: null } as unknown as HouseDetalle;
let wrapper: VueWrapper | undefined;

beforeEach(() => {
  vi.clearAllMocks();
  sessionStorage.setItem("dataUser", JSON.stringify([{ id_branch: 22 }]));
  httpMock.mockResolvedValue({ data: { data: [] } });
});
afterEach(() => wrapper?.unmount());

async function mountAndPickQuote() {
  const pinia = createPinia();
  setActivePinia(pinia);
  useHousesStore().house = house as never;
  useHouseEditStore().form = editFormFromHouse(house);
  wrapper = mount(HouseQuoteAssociation, {
    global: { plugins: [createVuetify({ components, directives }), pinia] },
    attachTo: document.body,
  });
  await flushPromises();
  usePricingStore().listQuotes = [
    { id: 5, code: "Q-5", listIngresosInstructivo: [{ descripcion: "TOTAL", valor: 10, igv: 1 }], listCostosInstructivo: [] },
  ] as never;
  const quote = wrapper.findAllComponents(VAutocomplete)[0]!;
  quote.vm.$emit("update:modelValue", 5);
  useHouseEditStore().form.id_cot = 5;
  await flushPromises();
}

const dialogButton = (name: string) =>
  [...document.body.querySelectorAll<HTMLButtonElement>("button")].find((button) => button.textContent?.includes(name))!;

test("cancelling the cost options leaves the house without a quote", async () => {
  await mountAndPickQuote();
  dialogButton("Cancelar").click();
  await flushPromises();
  expect(useHouseEditStore().form.id_cot).toBeNull();
});

test("a failed association explains it and leaves the house without a quote", async () => {
  await mountAndPickQuote();
  const option = wrapper!.findAllComponents(VAutocomplete).find((field) => field.props("label") === "Qué hacer con los costos")!;
  option.vm.$emit("update:modelValue", "2");
  await flushPromises();
  httpMock.mockRejectedValueOnce(new Error("network"));
  dialogButton("Asociar cotización").click();
  await flushPromises();
  expect(document.body.textContent).toContain("No pudimos asociar la cotización. Intenta de nuevo.");
  expect(useHouseEditStore().form.id_cot).toBeNull();
});
