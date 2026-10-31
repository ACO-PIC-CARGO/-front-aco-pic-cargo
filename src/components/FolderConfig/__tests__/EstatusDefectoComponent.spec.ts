import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { defineComponent } from "vue";
import { flushPromises, mount } from "@vue/test-utils";
import type { VueWrapper } from "@vue/test-utils";
import Swal from "sweetalert2";
import { createVuetify } from "vuetify";
import * as components from "vuetify/components";
import * as directives from "vuetify/directives";
import EstatusDefectoComponent from "@/components/FolderConfig/EstatusDefectoComponent.vue";
import { URL_MAIN, accepted, httpMock, rejected, respond } from "@/stores/__tests__/catalogHttp";

vi.mock("@/api/http", () => ({ default: vi.fn() }));
vi.mock("sweetalert2", () => ({ default: { fire: vi.fn() } }));

globalThis.ResizeObserver ??= class {
  observe() {}
  unobserve() {}
  disconnect() {}
};

const STATUSES = [
  { id: 3, name: "Pendiente", defaultstatus: "0" },
  { id: 4, name: "Cotizado", defaultstatus: "1" },
];
const NOT_ACTIVE = "Ese estatus no está activo en tu empresa. Elige otro de la lista.";
let wrapper: VueWrapper | undefined;

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(Swal.fire).mockResolvedValue({ isConfirmed: true } as never);
  respond({ getQuoteStatus: accepted(STATUSES), configurar_estatus_defecto: rejected(NOT_ACTIVE) });
});

afterEach(() => wrapper?.unmount());

const mountScreen = async () => {
  wrapper = mount(
    defineComponent({ components: { EstatusDefectoComponent }, template: "<v-app><EstatusDefectoComponent /></v-app>" }),
    { global: { plugins: [createVuetify({ components, directives })] }, attachTo: document.body },
  );
  await flushPromises();
};

test("the company's statuses are asked through the session client and the default one is shown", { timeout: 15_000 }, async () => {
  await mountScreen();

  expect(httpMock).toHaveBeenCalledWith(expect.objectContaining({ method: "post", url: URL_MAIN + "getQuoteStatus" }));
  expect(document.body.textContent).toContain("Cotizado");
});

test("a refused save shows the reason the server gives", { timeout: 15_000 }, async () => {
  await mountScreen();

  [...document.body.querySelectorAll<HTMLElement>("button")]
    .find((element) => element.textContent?.includes("Guardar Configuración"))!
    .click();
  await flushPromises();

  expect(httpMock).toHaveBeenCalledWith(
    expect.objectContaining({ method: "put", url: URL_MAIN + "configurar_estatus_defecto", data: { id_estatus_defecto: 4 } }),
  );
  expect(Swal.fire).toHaveBeenCalledWith(expect.objectContaining({ icon: "error", text: NOT_ACTIVE }));
});
