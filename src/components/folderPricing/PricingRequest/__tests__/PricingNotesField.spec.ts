import { beforeEach, expect, test, vi } from "vitest";
import { flushPromises, mount } from "@vue/test-utils";
import { createPinia, setActivePinia } from "pinia";
import { createVuetify } from "vuetify";
import * as components from "vuetify/components";
import * as directives from "vuetify/directives";
import PricingNotesField from "../PricingNotesField.vue";
import { getPricingRequestInfo } from "../pricingRequestApi";
import { usePricingStore } from "@/stores/pricing";

vi.mock("../pricingRequestApi", () => ({ getPricingRequestInfo: vi.fn() }));
vi.mock("@/api/http", () => ({ default: vi.fn() }));
vi.mock("@/router", () => ({ default: { push: vi.fn(), currentRoute: { value: { params: {} } } } }));
vi.mock("sweetalert2", () => ({ default: { fire: vi.fn() } }));

globalThis.ResizeObserver ??= class { observe() {} unobserve() {} disconnect() {} };

const vuetify = createVuetify({ components, directives });
const saved = { estadoflag: true, mensaje: "", tipomensaje: "", data: [{ pricing_notes: "Guardadas", quote_code: "1-P", pricing_name: null, pending_since: null, can_request: true, blocked_reason: null }] };

beforeEach(() => {
  setActivePinia(createPinia());
  vi.mocked(getPricingRequestInfo).mockReset().mockResolvedValue(saved);
});

test("the saved notes load only once the quote itself is loaded, so getQuote cannot overwrite them", async () => {
  const pricing = usePricingStore();
  mount(PricingNotesField, { props: { quoteId: 15 }, global: { plugins: [vuetify] } });
  await flushPromises();
  expect(getPricingRequestInfo).not.toHaveBeenCalled();

  pricing.id = 15;
  pricing.datosPrincipales = { ...pricing.datosPrincipales };
  await flushPromises();

  expect(getPricingRequestInfo).toHaveBeenCalledWith(15);
  expect(pricing.datosPrincipales.pricing_notes).toBe("Guardadas");
});

test("a new quote loads nothing and keeps what the user types", async () => {
  const pricing = usePricingStore();
  const wrapper = mount(PricingNotesField, { global: { plugins: [vuetify] } });

  await wrapper.find("textarea").setValue("Cliente apurado");

  expect(getPricingRequestInfo).not.toHaveBeenCalled();
  expect(pricing.datosPrincipales.pricing_notes).toBe("Cliente apurado");
});
