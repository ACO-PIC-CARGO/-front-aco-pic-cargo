import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { defineComponent, h } from "vue";
import { flushPromises, mount } from "@vue/test-utils";
import type { VueWrapper } from "@vue/test-utils";
import { createPinia, setActivePinia } from "pinia";
import { createVuetify } from "vuetify";
import * as components from "vuetify/components";
import * as directives from "vuetify/directives";
import ListadoBranch from "@/views/Branch/ListadoBranch.vue";
import { accepted, httpMock } from "@/stores/__tests__/catalogHttp";

vi.mock("@/api/http", () => ({ default: vi.fn() }));
vi.mock("sweetalert2", () => ({ default: { fire: vi.fn().mockResolvedValue({ isConfirmed: false }) } }));

globalThis.ResizeObserver ??= class {
  observe() {}
  unobserve() {}
  disconnect() {}
};

const COMPANIES = [
  { id: 8, trade_name: "ACTIVA SAC", status: 1 },
  { id: 9, trade_name: "INACTIVA SAC", status: 0 },
];
const ALL_ACTIONS = ["VER", "NUEVO", "MODIFICAR", "ELIMINAR", "COPIAR", "EXPORTAR"];
let wrapper: VueWrapper | undefined;

beforeEach(() => {
  vi.clearAllMocks();
  httpMock.mockResolvedValue({ data: accepted(COMPANIES) });
});
afterEach(() => {
  wrapper?.unmount();
  document.body.innerHTML = "";
});

const shownWith = async (actions: string[]) => {
  sessionStorage.setItem(
    "permissions",
    JSON.stringify({ screens: [{ route: "lstEnterpriseRegister", actions }], controlled: ["lstEnterpriseRegister"] }),
  );
  const pinia = createPinia();
  setActivePinia(pinia);
  wrapper = mount(defineComponent({ render: () => h(components.VApp, () => h(ListadoBranch)) }), {
    global: { plugins: [createVuetify({ components, directives }), pinia] },
    attachTo: document.body,
  });
  await flushPromises();
};
const labelled = (label: string) => document.body.querySelector(`button[aria-label="${label}"]`) !== null;

describe.each([
  ["Inactivar empresa", "ELIMINAR"],
  ["Reactivar empresa", "MODIFICAR"],
])("%s on the registered companies list", (label, action) => {
  test(`is hidden without ${action}`, async () => {
    await shownWith(ALL_ACTIONS.filter((granted) => granted !== action));

    expect(labelled(label)).toBe(false);
  });

  test(`shows with ${action}`, async () => {
    await shownWith(["VER", action]);

    expect(labelled(label)).toBe(true);
  });
});

test("Eliminar empresa shows to anyone who can open the list, since an administrator authorizes it", async () => {
  await shownWith(["VER"]);

  expect(labelled("Eliminar empresa")).toBe(true);
});
