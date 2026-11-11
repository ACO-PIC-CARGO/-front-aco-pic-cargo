import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { defineComponent } from "vue";
import { flushPromises, mount } from "@vue/test-utils";
import type { VueWrapper } from "@vue/test-utils";
import { createPinia } from "pinia";
import { createMemoryHistory, createRouter } from "vue-router";
import type { Router } from "vue-router";
import { createVuetify } from "vuetify";
import * as components from "vuetify/components";
import * as directives from "vuetify/directives";
import ListMenu from "@/components/ListMenu.vue";
import { usePricingStore } from "@/stores/pricing";

vi.mock("@/api/http", () => ({ default: vi.fn().mockResolvedValue({ data: { estadoflag: true, data: [] } }) }));
vi.mock("@/router", () => ({ default: { push: vi.fn(), currentRoute: { value: {} } } }));
vi.mock("sweetalert2", () => ({ default: { fire: vi.fn(), isVisible: vi.fn() } }));
globalThis.ResizeObserver ??= class {
  observe() {}
  unobserve() {}
  disconnect() {}
};
Element.prototype.scrollIntoView ??= () => {};

const MENU = [
  {
    id: 1,
    name: "FICHEROS",
    children: [
      { id: 2, name: "CLIENTES", route: "listClientes" },
      { id: 3, name: "PROVEEDORES", route: "listProveedor" },
    ],
  },
];

const MenuHost = defineComponent({ components: { ListMenu }, template: "<v-app><ListMenu /></v-app>" });

let router: Router;
let wrapper: VueWrapper;

const menuRow = (name: string) =>
  wrapper.findAll(".v-treeview-item").find((row) => row.find(".v-list-item-title").text().trim() === name)!;

const settle = async () => {
  await new Promise((resolve) => setTimeout(resolve, 50));
  await flushPromises();
};

const openMenuItem = async (name: string) => {
  await menuRow(name).trigger("click");
  await settle();
};

beforeEach(async () => {
  sessionStorage.setItem("menu", JSON.stringify(MENU));
  sessionStorage.setItem("dataBranch", JSON.stringify([{ id: 7, trade_name: "PIC", porcentaje_config: 100 }]));
  sessionStorage.setItem("dataUser", JSON.stringify([{ id_branch: 7, nombrecompleto: "Usuario" }]));
  router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: "/", name: "Main", component: { template: "<div />" } },
      { path: "/clientes", name: "listClientes", component: { template: "<div />" } },
      { path: "/proveedores", name: "listProveedor", component: { template: "<div />" } },
      { path: "/cotizacion/:id", name: "editQuote", component: { template: "<div />" } },
      { path: "/cotizacion/nueva", name: "newQuote", component: { template: "<div />" } },
      { path: "/calculadora/ver_cotizacion", name: "VerCotizacionCalculadora", component: { template: "<div />" } },
    ],
  });
  await router.push("/");
  wrapper = mount(MenuHost, {
    global: { plugins: [createVuetify({ components, directives }), createPinia(), router] },
    attachTo: document.body,
  });
  await new Promise((resolve) => setTimeout(resolve, 30));
  await flushPromises();
  await openMenuItem("FICHEROS");
});

afterEach(() => wrapper.unmount());

test("opening a group closes the other groups of its own level and keeps the rest", async () => {
  wrapper.unmount();
  sessionStorage.setItem(
    "menu",
    JSON.stringify([
      { id: 1, name: "A", children: [{ id: 1, name: "A1", children: [{ id: 5, name: "A1x", route: "listClientes" }] }, { id: 2, name: "A2", children: [{ id: 6, name: "A2x", route: "listClientes" }] }] },
      { id: 2, name: "B", children: [{ id: 3, name: "B1", children: [{ id: 7, name: "B1x", route: "listClientes" }] }] },
    ]),
  );
  wrapper = mount(MenuHost, {
    global: { plugins: [createVuetify({ components, directives }), createPinia(), router] },
    attachTo: document.body,
  });
  await settle();
  const visible = (name: string) => {
    const row = wrapper.findAll(".v-treeview-item").find((item) => item.find(".v-list-item-title").text().trim() === name);
    return Boolean(row?.element.closest(".v-list-group")?.classList.contains("v-list-group--open"));
  };

  await openMenuItem("A");
  await openMenuItem("A1");
  expect(visible("A1")).toBe(true);
  await openMenuItem("A2");
  expect(visible("A2")).toBe(true);
  expect(visible("A1")).toBe(false);
  expect(visible("A")).toBe(true);

  await openMenuItem("B");
  expect(visible("B")).toBe(true);
  expect(visible("A")).toBe(false);
  expect(visible("A2")).toBe(false);
});

test("a group closed by opening another one opens again with a single click, on every level", async () => {
  wrapper.unmount();
  sessionStorage.setItem(
    "menu",
    JSON.stringify([
      { id: 1, name: "A", children: [{ id: 1, name: "A1", children: [{ id: 5, name: "A1x", route: "listClientes" }] }, { id: 2, name: "A2", children: [{ id: 6, name: "A2x", route: "listClientes" }] }] },
      { id: 2, name: "B", children: [{ id: 3, name: "B1", children: [{ id: 7, name: "B1x", route: "listClientes" }] }] },
    ]),
  );
  wrapper = mount(MenuHost, {
    global: { plugins: [createVuetify({ components, directives }), createPinia(), router] },
    attachTo: document.body,
  });
  await settle();
  const visible = (name: string) => {
    const row = wrapper.findAll(".v-treeview-item").find((item) => item.find(".v-list-item-title").text().trim() === name);
    return Boolean(row?.element.closest(".v-list-group")?.classList.contains("v-list-group--open"));
  };

  await openMenuItem("A");
  await openMenuItem("A1");
  await openMenuItem("A2");
  await openMenuItem("A1");
  expect(visible("A1")).toBe(true);
  expect(visible("A2")).toBe(false);

  await openMenuItem("B");
  await openMenuItem("A");
  expect(visible("A")).toBe(true);
  expect(visible("B")).toBe(false);

  await openMenuItem("A");
  expect(visible("A")).toBe(false);
});

test("a menu item opens its screen with one click on its row", async () => {
  await openMenuItem("CLIENTES");

  expect(router.currentRoute.value.name).toBe("listClientes");
});

test("a menu item opened before leaving its screen another way still opens it with one click", async () => {
  await openMenuItem("CLIENTES");
  await router.push("/proveedores");
  await settle();

  await openMenuItem("CLIENTES");

  expect(router.currentRoute.value.name).toBe("listClientes");
});

test("the menu does not break when the session lost its menu, as after an expired session", async () => {
  wrapper.unmount();
  sessionStorage.removeItem("menu");
  const errors: unknown[] = [];

  wrapper = mount(MenuHost, {
    global: {
      plugins: [createVuetify({ components, directives }), createPinia(), router],
      config: { errorHandler: (error) => errors.push(error) },
    },
    attachTo: document.body,
  });
  await settle();

  expect(errors).toEqual([]);
});

test("the quote summary does not flag the ports as missing when a new quote clears them", async () => {
  const pricing = usePricingStore();
  Object.assign(pricing.datosPrincipales, { idorigen: 346, iddestino: 207 });
  await router.push({ name: "editQuote", params: { id: 1 } });
  await settle();

  await router.push({ name: "newQuote" });
  Object.assign(pricing.datosPrincipales, { idorigen: "", iddestino: "" });
  await settle();

  expect(wrapper.findAll(".v-input--error").map((field) => field.find("label").text())).toEqual([]);
});

test("the quote summary shows nothing, not raw ids, for data whose options are not loaded", async () => {
  Object.assign(usePricingStore().datosPrincipales, { idsentido: 0, idtipocarga: 0, idincoterms: 0, idorigen: 0, iddestino: 0 });
  await router.push({ name: "VerCotizacionCalculadora" });
  await settle();

  const shown = [...document.querySelectorAll(".datosPricing .v-select__selection, .datosPricing .v-autocomplete__selection")].map((el) => el.textContent?.trim());
  expect(shown.filter(Boolean)).toEqual([]);
});
