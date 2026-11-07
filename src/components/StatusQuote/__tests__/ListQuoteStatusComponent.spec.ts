import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { defineComponent } from "vue";
import { flushPromises, mount } from "@vue/test-utils";
import type { VueWrapper } from "@vue/test-utils";
import { createPinia, setActivePinia } from "pinia";
import Swal from "sweetalert2";
import { createVuetify } from "vuetify";
import * as components from "vuetify/components";
import * as directives from "vuetify/directives";
import ListQuoteStatusComponent from "@/components/StatusQuote/ListQuoteStatusComponent.vue";
import { useMasterusuariosStore } from "@/stores/masterusuarios";
import { useQuoteStatusStore } from "@/stores/QuoteStatus";

vi.mock("sweetalert2", () => ({ default: { fire: vi.fn() } }));

globalThis.ResizeObserver ??= class {
  observe() {}
  unobserve() {}
  disconnect() {}
};

let wrapper: VueWrapper | undefined;

beforeEach(() => {
  vi.clearAllMocks();
  sessionStorage.setItem("dataUser", JSON.stringify([{ id_branch: 7 }]));
  sessionStorage.setItem("permissions", JSON.stringify({
    screens: [{ route: "listQuoteStatus", actions: ["VER", "NUEVO", "MODIFICAR", "ELIMINAR"] }],
    controlled: ["listQuoteStatus"],
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
  const store = useQuoteStatusStore();
  store.statusQuoteList = [
    { id: 1, code: "01", name: "Pendiente", status: 1 },
    { id: 2, code: "02", name: "Cerrado", status: "0" },
  ];
  vi.spyOn(store, "GetListQuoteStatus").mockResolvedValue();
  vi.spyOn(useMasterusuariosStore(), "cargarTemperaturaLeds").mockImplementation(() => {});
  wrapper = mount(
    defineComponent({ components: { ListQuoteStatusComponent }, template: "<v-app><ListQuoteStatusComponent /></v-app>" }),
    { global: { plugins: [createVuetify({ components, directives }), pinia] }, attachTo: document.body },
  );
  await flushPromises();
  return store;
}

test("muestra acciones a la izquierda, estados y paginación", async () => {
  await mountScreen();
  const headers = [...document.querySelectorAll("thead th")].map((header) => header.textContent?.trim());
  const rows = [...document.querySelectorAll("tbody tr")];

  expect(headers[0]).toBe("Acciones");
  expect(rows[0]?.querySelector("td:first-child")?.querySelector('button[aria-label="Ver estado"]')).not.toBeNull();
  expect(rows[0]?.textContent).toContain("Activo");
  expect(rows[0]?.querySelector(".mdi-check-circle")).not.toBeNull();
  expect(rows[1]?.textContent).toContain("Inactivo");
  expect(rows[1]?.querySelector(".mdi-close-circle")).not.toBeNull();
  expect(rows[1]?.querySelector('button[aria-label="Eliminar estado"]')).toBeNull();
  expect(document.querySelector(".v-data-table-footer")).not.toBeNull();
});

test("mantiene la búsqueda y las acciones del listado", async () => {
  const store = await mountScreen();
  const search = document.querySelector<HTMLInputElement>(".quote-status-search input")!;
  search.value = "Pendiente";
  search.dispatchEvent(new Event("input"));
  await flushPromises();
  expect(document.querySelectorAll("tbody tr")).toHaveLength(1);

  document.querySelector<HTMLElement>('button[aria-label="Editar estado"]')!.click();
  await flushPromises();
  expect(store.tipo).toBe("editar");
  expect(store.StatusModel.name).toBe("Pendiente");
  expect(store.drawer).toBe(true);

  store.drawer = false;
  document.querySelector<HTMLElement>('button[aria-label="Ver estado"]')!.click();
  await flushPromises();
  expect(store.tipo).toBe("ver");
  expect(store.StatusModel.name).toBe("Pendiente");

  store.drawer = false;
  const filter = [...document.querySelectorAll<HTMLElement>("button")].find((button) => button.textContent?.trim() === "Filtrar")!;
  filter.click();
  await flushPromises();
  expect(store.tipo).toBe("filter");
  expect(store.drawer).toBe(true);

  store.drawer = false;
  const nuevo = [...document.querySelectorAll<HTMLElement>("button")].find((button) => button.textContent?.trim() === "Nuevo Estado")!;
  nuevo.click();
  await flushPromises();
  expect(store.tipo).toBe("nuevo");
  expect(store.StatusModel.status).toBe(1);
});

test("cancelar la eliminación no modifica el estado", async () => {
  const store = await mountScreen();
  vi.mocked(Swal.fire).mockResolvedValue({ isConfirmed: false } as never);
  const update = vi.spyOn(store, "actualizarQuoteStatus").mockResolvedValue();
  document.querySelector<HTMLElement>('button[aria-label="Eliminar estado"]')!.click();
  await flushPromises();
  expect(update).not.toHaveBeenCalled();
  expect(store.statusQuoteList[0]?.status).toBe(1);
});
