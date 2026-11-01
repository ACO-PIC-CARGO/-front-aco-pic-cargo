import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { defineComponent, h } from "vue";
import { flushPromises, mount } from "@vue/test-utils";
import type { VueWrapper } from "@vue/test-utils";
import { createPinia, setActivePinia } from "pinia";
import { createVuetify } from "vuetify";
import * as components from "vuetify/components";
import * as directives from "vuetify/directives";
import BillingHistory from "@/views/BillingHistory/BillingHistory.vue";
import { accepted, httpMock } from "@/stores/__tests__/catalogHttp";

vi.mock("@/api/http", () => ({ default: vi.fn() }));
vi.mock("@/router", () => ({ default: { push: vi.fn() } }));
vi.mock("sweetalert2", () => ({ default: { fire: vi.fn().mockResolvedValue({ isConfirmed: false }), isVisible: vi.fn() } }));

globalThis.ResizeObserver ??= class {
  observe() {}
  unobserve() {}
  disconnect() {}
};

const HISTORY = {
  transactions: [
    {
      id: "txn_01",
      billed_at: "2026-10-05T12:00:00Z",
      origin: "subscription_recurring",
      product_name: "ACO PRO",
      billing: "monthly",
      status: "completed",
      currency_code: "USD",
      total: "79.00",
      adjusted_total: "79.00",
      has_invoice: true,
    },
  ],
  payment_method: null,
  can_update_payment_method: true,
};
const ALL_ACTIONS = ["VER", "NUEVO", "MODIFICAR", "ELIMINAR", "COPIAR", "EXPORTAR"];
let wrapper: VueWrapper | undefined;

beforeEach(() => {
  vi.clearAllMocks();
  httpMock.mockImplementation(async (config) => ({
    data: accepted(config.url === "branch_subscription/billing_history" ? [HISTORY] : []),
  }));
});
afterEach(() => {
  wrapper?.unmount();
  document.body.innerHTML = "";
});

const shownWith = async (actions: string[]) => {
  sessionStorage.setItem("permissions", JSON.stringify({ screens: [{ route: "billingHistory", actions }], controlled: ["billingHistory"] }));
  const pinia = createPinia();
  setActivePinia(pinia);
  wrapper = mount(defineComponent({ render: () => h(components.VApp, () => h(BillingHistory)) }), {
    global: { plugins: [createVuetify({ components, directives }), pinia] },
    attachTo: document.body,
  });
  await flushPromises();
};
const button = (text: string) => [...document.body.querySelectorAll("button")].some((candidate) => candidate.textContent?.includes(text));

describe.each([
  ["Cambiar método de pago", "MODIFICAR"],
  ["Descargar", "EXPORTAR"],
])("%s on the billing history", (text, action) => {
  test(`is hidden without ${action}`, async () => {
    await shownWith(ALL_ACTIONS.filter((granted) => granted !== action));

    expect(button(text)).toBe(false);
  });

  test(`shows with ${action}`, async () => {
    await shownWith(["VER", action]);

    expect(button(text)).toBe(true);
  });
});
