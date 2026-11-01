import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { flushPromises, mount } from "@vue/test-utils";
import type { VueWrapper } from "@vue/test-utils";
import { createPinia, setActivePinia } from "pinia";
import { createVuetify } from "vuetify";
import * as components from "vuetify/components";
import * as directives from "vuetify/directives";
import ConfiguracionAvisoLlegada from "@/views/folderHouse/ConfiguracionAvisoLlegada.vue";
import { accepted, httpMock } from "@/stores/__tests__/catalogHttp";

vi.mock("@/api/http", () => ({ default: vi.fn() }));
vi.mock("@/router", () => ({ default: { push: vi.fn() } }));
vi.mock("sweetalert2", () => ({ default: { fire: vi.fn().mockResolvedValue({}) } }));
globalThis.ResizeObserver ??= class {
  observe() {}
  unobserve() {}
  disconnect() {}
};

let wrapper: VueWrapper | undefined;

beforeEach(() => {
  vi.clearAllMocks();
  sessionStorage.setItem("dataUser", JSON.stringify([{ id_branch: 7, id: 4 }]));
  httpMock.mockImplementation(async () => ({ data: accepted([{ aviso_llegada: "<p>Hola</p>", aviso_llegada_original: "<p>Hola</p>" }]) }));
});
afterEach(() => wrapper?.unmount());

async function offersEditing(actions: string[]) {
  sessionStorage.setItem("permissions", JSON.stringify({ screens: [{ route: "confAvisoLlegada", actions }], controlled: ["confAvisoLlegada"] }));
  const pinia = createPinia();
  setActivePinia(pinia);
  wrapper?.unmount();
  wrapper = mount(ConfiguracionAvisoLlegada, {
    global: { plugins: [createVuetify({ components, directives }), pinia], stubs: { Editor: true } },
  });
  await flushPromises();
  const buttons = wrapper.findAll("button").map((button) => button.text().trim());
  return { guardar: buttons.includes("Guardar contenido"), resetear: buttons.includes("Resetear al Original") };
}

test("the arrival notice template is saved or reset only with Modificar", async () => {
  expect(await offersEditing(["VER", "NUEVO", "ELIMINAR"])).toEqual({ guardar: false, resetear: false });
  expect(await offersEditing(["VER", "MODIFICAR"])).toEqual({ guardar: true, resetear: true });
});
