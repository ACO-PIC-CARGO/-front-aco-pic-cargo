import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { flushPromises, mount } from "@vue/test-utils";
import type { VueWrapper } from "@vue/test-utils";
import { createPinia, setActivePinia } from "pinia";
import type { Component } from "vue";
import { createVuetify } from "vuetify";
import * as components from "vuetify/components";
import * as directives from "vuetify/directives";
import ReportFileComponent from "@/components/Reports/ReportFileComponent.vue";
import ReportFileDetailsComponent from "@/components/Reports/ReportFileDetailsComponent.vue";
import ReporteGananciaComponent from "@/components/Reports/ReporteGananciaComponent.vue";
import ReporteGananciaDetalladoComponent from "@/components/Reports/ReporteGananciaDetalladoComponent.vue";
import { accepted, httpMock } from "@/stores/__tests__/catalogHttp";

vi.mock("@/api/http", () => ({ default: vi.fn() }));
vi.mock("@/router", () => ({ default: { push: vi.fn() } }));
vi.mock("vue-router", () => ({ useRouter: () => ({ push: vi.fn() }), useRoute: () => ({ name: "reports", params: {}, query: {} }) }));
vi.mock("sweetalert2", () => ({ default: { fire: vi.fn().mockResolvedValue({}) } }));
globalThis.ResizeObserver ??= class {
  observe() {}
  unobserve() {}
  disconnect() {}
};
Object.defineProperty(window, "visualViewport", {
  value: { width: 1024, height: 768, addEventListener() {}, removeEventListener() {} },
  configurable: true,
});

let wrapper: VueWrapper | undefined;

beforeEach(() => {
  vi.clearAllMocks();
  document.body.innerHTML = "";
  sessionStorage.setItem("dataUser", JSON.stringify([{ id_branch: 7, id: 4 }]));
  httpMock.mockImplementation(async () => ({ data: accepted([]) }));
});
afterEach(() => wrapper?.unmount());

async function offersExport(route: string, component: Component, label: string, actions: string[]) {
  sessionStorage.setItem("permissions", JSON.stringify({ screens: [{ route, actions }], controlled: [route] }));
  const pinia = createPinia();
  setActivePinia(pinia);
  wrapper?.unmount();
  wrapper = mount(component, { global: { plugins: [createVuetify({ components, directives }), pinia] }, attachTo: document.body });
  await flushPromises();
  return [...document.body.querySelectorAll("button")].some((button) => (button.textContent ?? "").trim() === label);
}

test.each([
  ["reportsControlFile", ReportFileComponent, "GENERAR PDF"],
  ["reportsControlFileDetails", ReportFileDetailsComponent, "EXPORTAR PDF"],
  ["ReporteGanancia", ReporteGananciaComponent, "Imprimir PDF"],
  ["ReporteGananciaDetallado", ReporteGananciaDetalladoComponent, "Imprimir PDF"],
] as const)("%s offers its PDF only with Exportar", async (route, component, label) => {
  expect(await offersExport(route, component, label, ["VER"])).toBe(false);
  expect(await offersExport(route, component, label, ["VER", "EXPORTAR"])).toBe(true);
});
