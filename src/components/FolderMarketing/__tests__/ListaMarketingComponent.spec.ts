import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { defineComponent } from "vue";
import { flushPromises, mount } from "@vue/test-utils";
import type { VueWrapper } from "@vue/test-utils";
import { createPinia, setActivePinia } from "pinia";
import Swal from "sweetalert2";
import { createVuetify } from "vuetify";
import * as components from "vuetify/components";
import * as directives from "vuetify/directives";
import ListaMarketingComponent from "@/components/FolderMarketing/ListaMarketingComponent.vue";
import { useMarketingStore } from "@/stores/marketing";
import { accepted, httpMock } from "@/stores/__tests__/catalogHttp";

vi.mock("@/api/http", () => ({ default: vi.fn() }));
vi.mock("sweetalert2", () => ({ default: { fire: vi.fn() } }));

globalThis.ResizeObserver ??= class {
  observe() {}
  unobserve() {}
  disconnect() {}
};

const rows = [
  { id: 1, code: "01", name: "Digital", description: "", position: 1, status: 1 },
  { id: 2, code: "02", name: "Impreso", description: "", position: 2, status: "0" },
];
let wrapper: VueWrapper | undefined;

beforeEach(() => {
  vi.clearAllMocks();
  sessionStorage.setItem("dataUser", JSON.stringify([{ id_branch: 7 }]));
  sessionStorage.setItem("permissions", JSON.stringify({
    screens: [{ route: "listMarketing", actions: ["VER", "NUEVO", "MODIFICAR", "ELIMINAR", "EXPORTAR"] }],
    controlled: ["listMarketing"],
  }));
  httpMock.mockImplementation(async (config) => ({
    data: accepted(config.url.includes("listar_marketing") ? rows : config.url.includes("ver_marketing") ? [rows[0]] : []),
  }));
});

afterEach(() => {
  wrapper?.unmount();
  sessionStorage.removeItem("permissions");
  sessionStorage.removeItem("dataUser");
});

async function mountScreen() {
  const pinia = createPinia();
  setActivePinia(pinia);
  wrapper = mount(
    defineComponent({ components: { ListaMarketingComponent }, template: "<v-app><ListaMarketingComponent /></v-app>" }),
    { global: { plugins: [createVuetify({ components, directives }), pinia] }, attachTo: document.body },
  );
  await flushPromises();
  return useMarketingStore();
}

const buttonNamed = (name: string) =>
  [...document.querySelectorAll<HTMLElement>("button")].find((button) => button.textContent?.trim() === name)!;

test("muestra acciones a la izquierda, estados y paginación", async () => {
  await mountScreen();
  const headers = [...document.querySelectorAll("thead th")].map((header) => header.textContent?.trim());
  const displayedRows = [...document.querySelectorAll("tbody tr")];

  expect(headers[0]).toBe("Acciones");
  expect(displayedRows[0]?.querySelector('td:first-child button[aria-label="Ver marketing"]')).not.toBeNull();
  expect(displayedRows[0]?.textContent).toContain("Activo");
  expect(displayedRows[0]?.querySelector(".mdi-check-circle")).not.toBeNull();
  expect(displayedRows[1]?.textContent).toContain("Inactivo");
  expect(displayedRows[1]?.querySelector(".mdi-close-circle")).not.toBeNull();
  expect(displayedRows[1]?.querySelector('button[aria-label="Inactivar marketing"]')).toBeNull();
  expect(document.querySelector(".v-data-table-footer")).not.toBeNull();
});

test("conserva la búsqueda, los paneles y la exportación", async () => {
  const store = await mountScreen();
  const exportar = vi.spyOn(store, "ExportMarketing").mockResolvedValue();
  const search = document.querySelector<HTMLInputElement>(".marketing-list-search input")!;
  search.value = "Digital";
  search.dispatchEvent(new Event("input"));
  await flushPromises();
  expect(document.querySelectorAll("tbody tr")).toHaveLength(1);

  buttonNamed("Exportar").click();
  await flushPromises();
  expect(exportar).toHaveBeenCalledOnce();
  buttonNamed("Filtrar").click();
  await flushPromises();
  expect(document.querySelector(".v-navigation-drawer--active")?.textContent).toContain("Filtrar Registros");
});

test("cancelar la inactivación no guarda ni recarga", async () => {
  await mountScreen();
  vi.mocked(Swal.fire).mockResolvedValue({ isConfirmed: false } as never);
  httpMock.mockClear();
  document.querySelector<HTMLElement>('button[aria-label="Inactivar marketing"]')!.click();
  await flushPromises();
  expect(httpMock).not.toHaveBeenCalled();
  expect(document.querySelector("tbody tr")?.textContent).toContain("Activo");
});
