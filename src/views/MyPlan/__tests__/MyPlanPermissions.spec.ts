import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { defineComponent, h } from "vue";
import { flushPromises, mount } from "@vue/test-utils";
import type { VueWrapper } from "@vue/test-utils";
import { createPinia, setActivePinia } from "pinia";
import { createVuetify } from "vuetify";
import * as components from "vuetify/components";
import * as directives from "vuetify/directives";
import MyPlan from "@/views/MyPlan/MyPlan.vue";
import { accepted, httpMock, rejected } from "@/stores/__tests__/catalogHttp";

vi.mock("vue-router", () => ({ useRouter: () => ({ push: vi.fn(), replace: vi.fn() }), useRoute: () => ({ query: {} }) }));
vi.mock("@/api/http", () => ({ default: vi.fn() }));
vi.mock("@/router", () => ({ default: { push: vi.fn() } }));
vi.mock("sweetalert2", () => ({ default: { fire: vi.fn().mockResolvedValue({ isConfirmed: false }), isVisible: vi.fn() } }));

globalThis.ResizeObserver ??= class {
  observe() {}
  unobserve() {}
  disconnect() {}
};

const pkg = (id: number, name: string, monthly: string) => ({
  id,
  name,
  tagline: null,
  monthly_price: monthly,
  annual_price: String(Number(monthly) * 10),
  user_limit: id,
  module_selection_limit: null,
  is_featured: false,
  is_active: true,
  trial_enabled: false,
  trial_interval: null,
  trial_frequency: null,
  modules: [],
  features: [],
});
const PACKAGES = [pkg(1, "START", "29.00"), pkg(2, "PRO", "79.00")];
const plan = (scheduled_change_action: string | null) => ({
  package_id: 1,
  package_name: "START",
  billing: "monthly",
  status: "active",
  next_billed_at: "2026-12-05T12:00:00Z",
  scheduled_change_action,
  scheduled_change_at: scheduled_change_action ? "2026-12-05T12:00:00Z" : null,
  canceled_at: null,
  user_limit: 1,
  user_count: 1,
  modules: [],
  features: [],
});
const ALL_ACTIONS = ["VER", "NUEVO", "MODIFICAR", "ELIMINAR", "COPIAR", "EXPORTAR"];
let wrapper: VueWrapper | undefined;

afterEach(() => {
  wrapper?.unmount();
  document.body.innerHTML = "";
});
beforeEach(() => vi.clearAllMocks());

const shownWith = async (companyPlan: unknown, actions: string[]) => {
  httpMock.mockImplementation(async (config) => {
    if (config.url === "branch_subscription") return { data: companyPlan ? accepted([companyPlan]) : rejected() };
    return { data: accepted(config.url === "public/subscription_packages" ? PACKAGES : []) };
  });
  sessionStorage.setItem("permissions", JSON.stringify({ screens: [{ route: "miPlan", actions }], controlled: ["miPlan"] }));
  const pinia = createPinia();
  setActivePinia(pinia);
  wrapper = mount(defineComponent({ render: () => h(components.VApp, () => h(MyPlan)) }), {
    global: { plugins: [createVuetify({ components, directives }), pinia] },
    attachTo: document.body,
  });
  await flushPromises();
};
const button = (text: string) => [...document.body.querySelectorAll("button")].some((candidate) => candidate.textContent?.includes(text));

describe.each([
  ["Mejorar plan", plan(null)],
  ["Cancelar plan", plan(null)],
  ["Mantener mi plan", plan("cancel")],
  ["Comprar", null],
])("%s on Mi plan", (text, companyPlan) => {
  test("is hidden without MODIFICAR", async () => {
    await shownWith(companyPlan, ALL_ACTIONS.filter((action) => action !== "MODIFICAR"));

    expect(button(text)).toBe(false);
  });

  test("shows with MODIFICAR", async () => {
    await shownWith(companyPlan, ["VER", "MODIFICAR"]);

    expect(button(text)).toBe(true);
  });
});
