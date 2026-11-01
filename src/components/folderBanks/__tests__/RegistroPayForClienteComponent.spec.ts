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
