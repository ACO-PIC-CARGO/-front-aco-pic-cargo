import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { defineComponent, h } from "vue";
import { flushPromises, mount } from "@vue/test-utils";
import type { VueWrapper } from "@vue/test-utils";
import { createPinia, setActivePinia } from "pinia";
import { createVuetify } from "vuetify";
import * as components from "vuetify/components";
import * as directives from "vuetify/directives";
import LegalPagesAdmin from "@/views/Legal/LegalPagesAdmin.vue";
import { accepted, httpMock } from "@/stores/__tests__/catalogHttp";

vi.mock("vue-router", () => ({ onBeforeRouteLeave: vi.fn() }));
vi.mock("@/api/http", () => ({ default: vi.fn() }));
vi.mock("@/router", () => ({ default: { push: vi.fn() } }));
vi.mock("sweetalert2", () => ({ default: { fire: vi.fn().mockResolvedValue({ isConfirmed: false }), isVisible: vi.fn() } }));

globalThis.ResizeObserver ??= class {
  observe() {}
  unobserve() {}
  disconnect() {}
};

const TERMS = { slug: "terminos", title: "Términos", sections: [{ heading: "Alcance", paragraphs: ["Texto."] }], updated_at: null };
const ALL_ACTIONS = ["VER", "NUEVO", "MODIFICAR", "ELIMINAR", "COPIAR", "EXPORTAR"];
let wrapper: VueWrapper | undefined;

beforeEach(() => {
  vi.clearAllMocks();
  httpMock.mockResolvedValue({ data: accepted([TERMS]) });
});
afterEach(() => {
  wrapper?.unmount();
  document.body.innerHTML = "";
});

const shownWith = async (actions: string[]) => {
  sessionStorage.setItem("permissions", JSON.stringify({ screens: [{ route: "legalPagesAdmin", actions }], controlled: ["legalPagesAdmin"] }));
  const pinia = createPinia();
  setActivePinia(pinia);
  wrapper = mount(defineComponent({ render: () => h(components.VApp, () => h(LegalPagesAdmin)) }), {
    global: { plugins: [createVuetify({ components, directives }), pinia], stubs: { RouterLink: true } },
    attachTo: document.body,
  });
  await flushPromises();
};
const saveButton = () => [...document.body.querySelectorAll("button")].some((button) => button.textContent?.includes("Guardar cambios"));

describe("Guardar cambios on the legal pages screen", () => {
  test("is hidden without MODIFICAR", async () => {
    await shownWith(ALL_ACTIONS.filter((action) => action !== "MODIFICAR"));

    expect(saveButton()).toBe(false);
  });

  test("shows with MODIFICAR", async () => {
    await shownWith(["VER", "MODIFICAR"]);

    expect(saveButton()).toBe(true);
  });
});
