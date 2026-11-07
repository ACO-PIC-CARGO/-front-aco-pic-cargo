import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { defineComponent } from "vue";
import { flushPromises, mount } from "@vue/test-utils";
import type { VueWrapper } from "@vue/test-utils";
import { createPinia, setActivePinia } from "pinia";
import { createVuetify } from "vuetify";
import * as components from "vuetify/components";
import * as directives from "vuetify/directives";
import ListUserCalcComponent from "@/components/Calculadora/ListUserCalcComponent.vue";
import { useCalculadorasStore } from "@/stores/calculadoras";
import { accepted, httpMock } from "@/stores/__tests__/catalogHttp";

vi.mock("@/api/http", () => ({ default: vi.fn() }));
vi.mock("@/router", () => ({ default: { push: vi.fn(), currentRoute: { value: { params: {} } } } }));
vi.mock("vue-router", () => ({ useRouter: () => ({ push: vi.fn(), resolve: vi.fn() }) }));
vi.mock("sweetalert2", () => ({ default: { fire: vi.fn().mockResolvedValue({ isConfirmed: false }) } }));

globalThis.ResizeObserver ??= class {
  observe() {}
  unobserve() {}
  disconnect() {}
};
Object.defineProperty(window, "visualViewport", {
  value: { width: 1024, height: 768, addEventListener() {}, removeEventListener() {} },
  configurable: true,
});

const row = { id: "1", nombre: "Ana", estado_cotizacion: "Pendiente", estadocotizacion: 1, detalle: [] };
let wrapper: VueWrapper | undefined;

beforeEach(() => {
  vi.clearAllMocks();
  sessionStorage.setItem("dataUser", JSON.stringify([{ id_branch: 1 }]));
  sessionStorage.setItem("dataBranch", JSON.stringify([{ id: 1, id_pais: 1, iso_pais: "PE", trade_name: "PIC" }]));
  sessionStorage.setItem("iso_pais", "9589");
  sessionStorage.setItem("permissions", JSON.stringify({
    screens: [{ route: "listUserCalc", actions: ["VER", "MODIFICAR", "EXPORTAR"] }],
    controlled: ["listUserCalc"],
  }));
  httpMock.mockImplementation(async (config) => ({
    data: accepted(config.url.includes("listar_usuarios_calculadora") ? [row] : []),
  }));
});
afterEach(() => {
  wrapper?.unmount();
  sessionStorage.removeItem("permissions");
  sessionStorage.removeItem("dataUser");
  sessionStorage.removeItem("dataBranch");
  sessionStorage.removeItem("iso_pais");
});

async function mountScreen() {
  const pinia = createPinia();
  setActivePinia(pinia);
  wrapper = mount(
    defineComponent({ components: { ListUserCalcComponent }, template: "<v-app><ListUserCalcComponent /></v-app>" }),
    { global: { plugins: [createVuetify({ components, directives }), pinia] }, attachTo: document.body },
  );
  await flushPromises();
  return useCalculadorasStore();
}

function button(name: string) {
  return [...document.querySelectorAll<HTMLElement>("button")].find((candidate) => candidate.textContent?.trim() === name)!;
}

function field(label: string) {
  return [...document.querySelectorAll<HTMLElement>(".calc-users-filter-drawer .v-text-field")]
    .find((element) => element.querySelector("label")?.textContent?.trim() === label)!
    .querySelector<HTMLInputElement>("input")!;
}

async function fill(label: string, value: string) {
  const input = field(label);
  input.value = value;
  input.dispatchEvent(new Event("input", { bubbles: true }));
  await flushPromises();
}

test("muestra acciones a la izquierda, estado, búsqueda y paginación", async () => {
  await mountScreen();
  expect(document.querySelector("thead th")?.textContent?.trim()).toBe("Acciones");
  expect(document.querySelector('tbody td:first-child button[aria-label="Registro Llamada"]')).not.toBeNull();
  expect(document.querySelector("tbody .v-chip")?.textContent).toContain("Pendiente");
  expect(document.querySelector(".v-data-table-footer")).not.toBeNull();
  expect(document.querySelector(".calc-users-search input")).not.toBeNull();
});

test("carga los catálogos en paralelo después del listado y no al abrir el filtro", async () => {
  let resolveList!: (response: { data: unknown }) => void;
  const pendingList = new Promise<{ data: unknown }>((resolve) => { resolveList = resolve; });
  let resolveCatalogs!: (response: { data: unknown }) => void;
  const pendingCatalogs = new Promise<{ data: unknown }>((resolve) => { resolveCatalogs = resolve; });
  httpMock.mockImplementation((config) =>
    config.url.endsWith("listar_usuarios_calculadora") ? pendingList : pendingCatalogs,
  );
  await mountScreen();
  expect(httpMock.mock.calls.map(([config]) => config.url)).toEqual([
    expect.stringContaining("listar_usuarios_calculadora"),
  ]);
  resolveList({ data: accepted([row]) });
  await flushPromises();
  const catalogPaths = ["CargarClientes", "getQuoteStatus", "getShipment", "getPortBegin", "getPortEnd"];
  for (const path of catalogPaths) {
    expect(httpMock.mock.calls.filter(([config]) => config.url.includes(path))).toHaveLength(1);
  }
  button("Filtrar").click();
  await flushPromises();
  expect(document.querySelector(".calc-users-filter-drawer .v-progress-linear")).not.toBeNull();
  expect(button("Aceptar").hasAttribute("disabled")).toBe(true);
  resolveCatalogs({ data: accepted([]) });
  await flushPromises();
  expect(button("Aceptar").hasAttribute("disabled")).toBe(false);
  button("Cerrar").click();
  await flushPromises();
  button("Filtrar").click();
  await flushPromises();
  for (const path of catalogPaths) {
    expect(httpMock.mock.calls.filter(([config]) => config.url.includes(path))).toHaveLength(1);
  }
});

test("aplica filtros y los conserva para exportar y limpiar", async () => {
  const store = await mountScreen();
  const exportar = vi.spyOn(store, "ExportarListUser").mockResolvedValue();
  button("Filtrar").click();
  await flushPromises();
  const drawer = document.querySelector(".calc-users-filter-drawer");
  expect(drawer?.classList.contains("v-navigation-drawer--active")).toBe(true);
  expect(drawer?.classList.contains("v-navigation-drawer--right")).toBe(true);
  expect(drawer?.textContent).toContain("Filtrar Registros");
  expect(httpMock.mock.calls.some(([config]) => config.url.includes("getQuoteStatus"))).toBe(true);
  expect(httpMock.mock.calls.some(([config]) => config.url.includes("getShipment"))).toBe(true);
  expect(httpMock.mock.calls.some(([config]) => config.url.includes("CargarClientes"))).toBe(true);
  expect(httpMock.mock.calls.some(([config]) => config.url.includes("getPortBegin"))).toBe(true);
  expect(httpMock.mock.calls.some(([config]) => config.url.includes("getPortEnd"))).toBe(true);
  await fill("Fecha registro desde", "2026-11-01");
  await fill("Fecha registro hasta", "2026-11-06");
  await fill("Correo", "ana@example.test");
  await fill("Teléfono", "123");
  const selects = wrapper!.findAllComponents(components.VAutocomplete);
  for (const [label, value] of [
    ["Estado de cotización", 2], ["Cliente", 3], ["Tipo de carga", 4], ["Puerto origen", 5], ["Puerto destino", 6],
  ] as const) {
    selects.find((select) => select.props("label") === label)!.vm.$emit("update:modelValue", value);
  }
  await flushPromises();
  button("Aceptar").click();
  await flushPromises();
  const expected = {
    fechainicio: "2026-11-01", fechafin: "2026-11-06", id_status: 2, id_cliente: 3, id_shipment: 4,
    id_port_begin: 5, id_port_end: 6, email: "ana@example.test", telefono: "123",
  };
  const listRequests = () => httpMock.mock.calls.map(([config]) => config).filter((config) => config.url.endsWith("listar_usuarios_calculadora"));
  expect(listRequests().at(-1)?.data).toEqual({ iso_pais: 9589, ...expected });
  button("Exportar").click();
  await flushPromises();
  expect(exportar).toHaveBeenCalledWith(expected);
  button("Filtrar").click();
  await flushPromises();
  button("Limpiar").click();
  await flushPromises();
  expect(listRequests().at(-1)?.data).toEqual({
    iso_pais: 9589, fechainicio: "", fechafin: "", id_status: null, id_cliente: null, id_shipment: null,
    id_port_begin: null, id_port_end: null, email: "", telefono: "",
  });
});

test("no aplica fechas incompletas ni invertidas", async () => {
  await mountScreen();
  button("Filtrar").click();
  await flushPromises();
  const listCount = () => httpMock.mock.calls.filter(([config]) => config.url.endsWith("listar_usuarios_calculadora")).length;
  const initialCount = listCount();
  await fill("Fecha registro desde", "2026-11-06");
  button("Aceptar").click();
  await flushPromises();
  expect(document.body.textContent).toContain("Selecciona ambas fechas");
  await fill("Fecha registro hasta", "2026-11-01");
  button("Aceptar").click();
  await flushPromises();
  expect(document.body.textContent).toContain("La fecha inicial no puede ser posterior");
  expect(listCount()).toBe(initialCount);
});

test("cerrar el panel descarta cambios sin aplicar ni recargar", async () => {
  const store = await mountScreen();
  const exportar = vi.spyOn(store, "ExportarListUser").mockResolvedValue();
  const listCount = () => httpMock.mock.calls.filter(([config]) => config.url.endsWith("listar_usuarios_calculadora")).length;
  button("Filtrar").click();
  await flushPromises();
  const initialCount = listCount();
  await fill("Correo", "sin-aplicar@example.test");
  button("Cerrar").click();
  await flushPromises();
  expect(document.querySelector(".calc-users-filter-drawer")?.classList.contains("v-navigation-drawer--active")).toBe(false);
  expect(listCount()).toBe(initialCount);
  button("Exportar").click();
  await flushPromises();
  expect(exportar).toHaveBeenCalledWith(expect.objectContaining({ email: "" }));
  button("Filtrar").click();
  await flushPromises();
  expect(field("Correo").value).toBe("");
});
