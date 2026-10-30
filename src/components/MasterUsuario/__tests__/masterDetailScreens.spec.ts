import { afterEach, beforeEach, expect, test, vi } from "vitest";
import type { Component } from "vue";
import { flushPromises, mount } from "@vue/test-utils";
import type { VueWrapper } from "@vue/test-utils";
import { createPinia, setActivePinia } from "pinia";
import type { Pinia } from "pinia";
import Swal from "sweetalert2";
import { createVuetify } from "vuetify";
import * as components from "vuetify/components";
import * as directives from "vuetify/directives";
import FilterTipoTelefono from "@/components/filtros/FilterTipoTelefono.vue";
import ListImpuestoComponent from "@/components/MasterUsuario/ListImpuestoComponent.vue";
import ListNotaCotizacionComponent from "@/components/MasterUsuario/ListNotaCotizacionComponent.vue";
import ListTipoTelefonoComponet from "@/components/MasterUsuario/ListTipoTelefonoComponet.vue";
import { useMasterusuariosStore } from "@/stores/masterusuarios";
import { accepted, httpMock, rejected, respond } from "@/stores/__tests__/catalogHttp";

vi.mock("@/api/http", () => ({ default: vi.fn() }));
vi.mock("@/router", () => ({ default: { push: vi.fn() } }));
vi.mock("sweetalert2", () => ({ default: { fire: vi.fn() } }));

globalThis.ResizeObserver ??= class {
  observe() {}
  unobserve() {}
  disconnect() {}
};

let wrapper: VueWrapper | undefined;
let pinia: Pinia;

beforeEach(() => {
  vi.clearAllMocks();
  sessionStorage.setItem("dataUser", JSON.stringify([{ id_branch: 7 }]));
  localStorage.setItem("dataBranch", JSON.stringify([{ id: 7 }]));
  vi.mocked(Swal.fire).mockResolvedValue({ isConfirmed: true } as never);
  pinia = createPinia();
  setActivePinia(pinia);
});

afterEach(() => wrapper?.unmount());

const mountWithStore = async (component: Component) => {
  wrapper = mount(component, {
    global: { plugins: [createVuetify({ components, directives }), pinia] },
    attachTo: document.body,
  });
  await flushPromises();
};

const statusSent = () => {
  const [config] = httpMock.mock.calls[0]!;
  return String(config.params ? config.params.status : /[?&]status=([^&]*)/.exec(config.url)![1]);
};

test.each([
  ["Tipo de teléfono", ListTipoTelefonoComponet, "listar_master_detalle_tipotelefono"],
  ["Impuestos", ListImpuestoComponent, "listar_master_detalle_impuesto"],
  ["Notas de cotización", ListNotaCotizacionComponent, "listar_master_detalle_notas_cotizacion"],
] as const)("%s opens listing active rows, whatever filter another screen left", async (_, component, path) => {
  respond({ [path]: accepted([]) });
  const store = useMasterusuariosStore();
  store.filtros = { ...store.filtros, valorcodigo: "IGV", status: false };

  await mountWithStore(component);

  expect(statusSent()).toBe("true");
  expect(store.filtros.valorcodigo).toBe("");
});

const savePhoneType = async (tipo: "nuevo" | "editar", answer: unknown) => {
  respond({
    insertar_master_detalle_tipotelefono: answer,
    actualizar_master_detalle: answer,
    listar_master_detalle_tipotelefono: accepted([]),
  });
  const store = useMasterusuariosStore();
  store.tipo = tipo;
  store.drawer = true;
  store.model = { id: 4, valorcodigo: "CEL", description: "Celular", status: true };
  await mountWithStore(FilterTipoTelefono);

  [...document.body.querySelectorAll<HTMLElement>("button")].find((button) => button.textContent?.trim() === "Aceptar")!.click();
  await flushPromises();
  return store;
};

test.each(["nuevo", "editar"] as const)("a saved phone type (%s) closes the drawer", async (tipo) => {
  expect((await savePhoneType(tipo, accepted([]))).drawer).toBe(false);
});

test.each(["nuevo", "editar"] as const)("a refused phone type (%s) keeps the drawer open to fix it", async (tipo) => {
  expect((await savePhoneType(tipo, rejected("Ya existe un registro con el código CEL."))).drawer).toBe(true);
});
