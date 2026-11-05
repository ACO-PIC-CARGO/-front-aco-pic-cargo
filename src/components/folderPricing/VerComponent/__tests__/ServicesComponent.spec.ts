import { beforeEach, expect, test, vi } from "vitest";
import { flushPromises, shallowMount } from "@vue/test-utils";
import { createPinia, setActivePinia } from "pinia";
import ServicesComponent from "@/components/folderPricing/VerComponent/ServicesComponent.vue";
import { usePricingStore } from "@/stores/pricing";
import { useTownStore } from "@/stores/town";

vi.mock("vue-router", () => ({ useRouter: () => ({ push: vi.fn() }), useRoute: () => ({ params: {} }) }));
vi.mock("@/router", () => ({ default: { push: vi.fn(), currentRoute: { value: { params: {} } } } }));
vi.mock("@/api/http", () => ({ default: Object.assign(vi.fn().mockResolvedValue({ data: { estadoflag: true, data: [] } }), { post: vi.fn(), get: vi.fn() }) }));
vi.mock("sweetalert2", () => ({ default: { fire: vi.fn().mockResolvedValue({}) } }));

beforeEach(() => {
  vi.clearAllMocks();
  localStorage.removeItem("dataBranch");
});

test("a viewed quote with destination transport shows its district for any company with districts", async () => {
  const pinia = createPinia();
  setActivePinia(pinia);
  const pricing = usePricingStore();
  pricing.listServices = [{ id: 1, codebegend: "DE", code_service: 14, status: 1, service: "TRANSPORTE EN DESTINO" }] as never;
  pricing.datosPrincipales.id_town = 7;
  useTownStore().lstTownPricing = [{ id: 7, nombrecompleto: "LIMA - MIRAFLORES" }] as never;

  const wrapper = shallowMount(ServicesComponent, { global: { plugins: [pinia], renderStubDefaultSlot: true } });
  await flushPromises();

  const district = wrapper.findAllComponents({ name: "VAutocomplete" }).find((field) => field.props("label") === "Distrito");
  expect(district?.props("modelValue")).toBe(7);
});
