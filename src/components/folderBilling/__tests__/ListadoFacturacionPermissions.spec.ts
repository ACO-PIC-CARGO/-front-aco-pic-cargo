import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { flushPromises, mount } from "@vue/test-utils";
import type { VueWrapper } from "@vue/test-utils";
import { createPinia, setActivePinia } from "pinia";
import { createVuetify } from "vuetify";
import * as components from "vuetify/components";
import * as directives from "vuetify/directives";
import ListadoFacturacion from "@/components/folderBilling/ListadoFacturacion.vue";
import { URL_MAIN, accepted, httpMock } from "@/stores/__tests__/catalogHttp";

vi.mock("@/api/http", () => ({ default: vi.fn() }));
vi.mock("@/router", () => ({ default: { push: vi.fn() } }));
vi.mock("sweetalert2", () => ({ default: { fire: vi.fn().mockResolvedValue({}) } }));
globalThis.ResizeObserver ??= class {
  observe() {}
  unobserve() {}
  disconnect() {}
};

const INVOICE = { id: 1, nro_factura: "F-1", estatus: 1, url: "https://example.com/f-1.pdf" };
let wrapper: VueWrapper | undefined;

beforeEach(() => {
  vi.clearAllMocks();
  sessionStorage.setItem("dataUser", JSON.stringify([{ id_branch: 7 }]));
  httpMock.mockImplementation(async (config) => ({
    data: accepted(config.url.startsWith(URL_MAIN + "listar_Factura") ? [INVOICE] : []),
  }));
});
afterEach(() => wrapper?.unmount());

async function offers(actions: string[]) {
  sessionStorage.setItem("permissions", JSON.stringify({ screens: [{ route: "lstFacturacion", actions }], controlled: ["lstFacturacion"] }));
  const pinia = createPinia();
  setActivePinia(pinia);
  wrapper?.unmount();
  wrapper = mount(ListadoFacturacion, { global: { plugins: [createVuetify({ components, directives }), pinia] } });
  await flushPromises();
  return { ver: wrapper.find(".mdi-file-pdf-box").exists(), anular: wrapper.find(".mdi-cancel").exists() };
}

test("an issued invoice is annulled only with Eliminar, and anyone who sees the list can open it", async () => {
  expect(await offers(["VER", "NUEVO", "MODIFICAR"])).toEqual({ ver: true, anular: false });
  expect(await offers(["VER", "ELIMINAR"])).toEqual({ ver: true, anular: true });
});
