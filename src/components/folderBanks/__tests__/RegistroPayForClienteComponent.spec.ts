import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { defineComponent } from "vue";
import { flushPromises, mount } from "@vue/test-utils";
import type { VueWrapper } from "@vue/test-utils";
import { createPinia, setActivePinia } from "pinia";
import { createVuetify } from "vuetify";
import * as components from "vuetify/components";
import * as directives from "vuetify/directives";
import { VAutocomplete } from "vuetify/components";
import RegistroPayForClienteComponent from "@/components/folderBanks/RegistroPayForClienteComponent.vue";
import { accepted, httpMock } from "@/stores/__tests__/catalogHttp";

vi.mock("@/api/http", () => ({ default: vi.fn() }));
vi.mock("@/router", () => ({ default: { push: vi.fn() } }));
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

const account = { id: 9, label: "BCP - 191-0000000", id_coins: 1, banco: "BCP", moneda: "SOLES" };
let wrapper: VueWrapper | undefined;

beforeEach(() => {
  vi.clearAllMocks();
  sessionStorage.setItem("dataUser", JSON.stringify([{ id_branch: 7 }]));
});

afterEach(() => wrapper?.unmount());

const accountFieldForClient = async (accounts: object[]) => {
  httpMock.mockImplementation(async (config) => {
    if (config.url.includes("CargarClientes")) return { data: accepted([{ id: 3, namelong: "Cliente Uno" }]) };
    if (config.url.includes("getListBanksDetailsCargar")) return { data: accepted(accounts) };
    return { data: accepted([]) };
  });
  const pinia = createPinia();
  setActivePinia(pinia);
  wrapper = mount(
    defineComponent({ components: { RegistroPayForClienteComponent }, template: "<v-app><RegistroPayForClienteComponent /></v-app>" }),
    { global: { plugins: [createVuetify({ components, directives }), pinia] }, attachTo: document.body },
  );
  await flushPromises();
  await wrapper.findComponent(VAutocomplete).setValue(3);
  await flushPromises();
  return wrapper.findAllComponents(VAutocomplete).find((field) => field.props("label") === "Cuenta y Banco Ingreso de Banco")!;
};

test("the bank account field stays empty when there are no accounts to choose from", async () => {
  const accountField = await accountFieldForClient([]);

  expect(accountField.exists()).toBe(true);
  expect(accountField.text()).not.toContain("[object Object]");
});

test("choosing a bank account shows it in the field", async () => {
  const accountField = await accountFieldForClient([account]);

  await accountField.setValue(account);
  await flushPromises();

  expect(accountField.text()).toContain(account.label);
});

test("from a partial client payment (token) the correlativo is preloaded as Abono Parcial for that amount", async () => {
  const sol = {
    codigo: "SC-000001", id_master: 1, expediente: "2026MBL01744", id_house: 50, id_cliente: 3, cliente: "Cliente Uno",
    id_correlativo: 1, correlativo: "0001", monto: "1000.00", moneda: "USD", id_coins: 1, id_cuentabancaria: 9,
    fechadeposito: "2026-11-18", numerooperacion: "OP-1", id_path_voucher: 5, voucher_path: null, voucher_nombre: null,
    comentario: null, id_banco_origen: 2, banco_origen: "BCP",
  };
  httpMock.mockImplementation(async (config) => {
    if (config.url.includes("CargarClientes")) return { data: accepted([{ id: 3, namelong: "Cliente Uno" }]) };
    if (config.url.includes("getListBanksDetailsCargar")) return { data: accepted([{ ...account, symbol: "USD" }]) };
    if (config.url.includes("solicitud_cobro_por_token")) return { data: accepted([sol]) };
    if (config.url.includes("deuda_de_cliente_por_sucursal")) {
      return { data: accepted([{ registro_id: 50, id_correlativo: 1, tipo: "O", symbol: "USD", coin_id: 1, total_mon_local: "1465.68", referencia: "2026MBL01744-0001" }]) };
    }
    return { data: accepted([]) };
  });
  const pinia = createPinia();
  setActivePinia(pinia);
  wrapper = mount(
    defineComponent({
      components: { RegistroPayForClienteComponent },
      template: '<v-app><RegistroPayForClienteComponent token="7d3c2b4e-1111-4222-8333-944455556666" /></v-app>',
    }),
    { global: { plugins: [createVuetify({ components, directives }), pinia] }, attachTo: document.body },
  );
  await flushPromises();
  await flushPromises();

  const fila = wrapper.findAll("tbody tr")[0]!;
  // detalle: abono parcial por el monto del pago del cliente, no por toda la deuda
  expect(fila.findComponent({ name: "VSelect" }).props("modelValue")).toBe(true);
  expect(fila.text()).toContain("Abono Parcial");
  expect(fila.findAllComponents({ name: "VTextField" }).map((c) => c.props("modelValue"))).toContain("1000.00");

  // la fila va fija: ni el check ni el monto se cambian
  expect(fila.findComponent({ name: "VCheckboxBtn" }).props("disabled")).toBe(true);
  expect(wrapper.find("thead").findComponent({ name: "VCheckboxBtn" }).props("disabled")).toBe(true);
  expect(fila.findAllComponents({ name: "VTextField" }).find((c) => c.props("modelValue") === "1000.00")!.props("readonly")).toBe(true);

  // lo llenado en la solicitud no se cambia: monto depositado y cliente quedan bloqueados
  const montoDepositado = wrapper.findAllComponents({ name: "VTextField" }).find((c) => c.props("label") === "Monto Depositado en Banco")!;
  expect(montoDepositado.props("readonly")).toBe(true);
  expect(wrapper.findAllComponents(VAutocomplete).find((c) => c.props("label") === "Cliente")!.props("readonly")).toBe(true);
});
