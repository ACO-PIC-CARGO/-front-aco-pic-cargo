import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import type { Component } from "vue";
import { flushPromises, mount } from "@vue/test-utils";
import type { VueWrapper } from "@vue/test-utils";
import { createPinia, setActivePinia } from "pinia";
import { createVuetify } from "vuetify";
import * as components from "vuetify/components";
import * as directives from "vuetify/directives";
import SeccionCliente from "@/components/folderEntities/Cliente/SeccionCliente.vue";
import ClientPhones from "@/components/folderEntities/Cliente/SeccionTelefonos.vue";
import ClientAgreements from "@/components/folderEntities/Cliente/SeccionConvenios.vue";
import ClientBankAccounts from "@/components/folderEntities/Cliente/SeccionInformacionBancaria.vue";
import ClientShippers from "@/components/folderEntities/Cliente/SeccionShippers.vue";
import ClientDelivery from "@/components/folderEntities/Cliente/SeccionInformacionEntrega.vue";
import SeccionProveedor from "@/components/folderEntities/Proveedor/SeccionProveedor.vue";
import ProviderPhones from "@/components/folderEntities/Proveedor/SeccionTelefonos.vue";
import ProviderAgreements from "@/components/folderEntities/Proveedor/SeccionConvenios.vue";
import ProviderBankAccounts from "@/components/folderEntities/Proveedor/SeccionInformacionBancaria.vue";
import ProviderRateContacts from "@/components/folderEntities/Proveedor/SeccionEmailTarifaComponent.vue";
import { useEntitiesStore } from "@/stores/entities";
import { accepted, httpMock } from "@/stores/__tests__/catalogHttp";

const currentRoute = vi.hoisted(() => ({ value: { params: { id: "656" }, meta: {} as Record<string, unknown> } }));
vi.mock("@/api/http", () => ({ default: vi.fn() }));
vi.mock("@/router", () => ({ default: { push: vi.fn(), currentRoute } }));
vi.mock("vue-router", () => ({ useRoute: () => currentRoute.value, useRouter: () => ({ push: vi.fn() }) }));
vi.mock("sweetalert2", () => ({ default: { fire: vi.fn().mockResolvedValue({ isConfirmed: false }) } }));

globalThis.ResizeObserver ??= class {
  observe() {}
  unobserve() {}
  disconnect() {}
};

interface Section {
  name: string;
  screen: string;
  component: Component;
  readonly: boolean;
  control: string;
}

const viewSection = (name: string, screen: string, component: Component, control: string): Section => ({
  name,
  screen,
  component,
  readonly: true,
  control,
});

const sections: Section[] = [
  viewSection("client data", "listClientes", SeccionCliente, "EDITAR CLIENTE"),
  viewSection("client phones", "listClientes", ClientPhones, "EDITAR CLIENTE"),
  viewSection("client agreements", "listClientes", ClientAgreements, "EDITAR CLIENTE"),
  viewSection("client bank accounts", "listClientes", ClientBankAccounts, "EDITAR CLIENTE"),
  viewSection("client shippers", "listClientes", ClientShippers, "EDITAR CLIENTE"),
  viewSection("client delivery", "listClientes", ClientDelivery, "EDITAR CLIENTE"),
  viewSection("provider data", "listProveedor", SeccionProveedor, "EDITAR PROVEEDOR"),
  viewSection("provider phones", "listProveedor", ProviderPhones, "EDITAR PROVEEDOR"),
  viewSection("provider agreements", "listProveedor", ProviderAgreements, "EDITAR PROVEEDOR"),
  viewSection("provider bank accounts", "listProveedor", ProviderBankAccounts, "EDITAR PROVEEDOR"),
  { name: "provider rate contacts", screen: "listProveedor", component: ProviderRateContacts, readonly: false, control: "GUARDAR" },
];

let wrapper: VueWrapper | undefined;

beforeEach(() => {
  vi.clearAllMocks();
  sessionStorage.setItem("dataUser", JSON.stringify([{ id_branch: 7, id_pais: 139 }]));
  httpMock.mockImplementation(async () => ({ data: accepted([]) }));
});

afterEach(() => {
  wrapper?.unmount();
  sessionStorage.removeItem("permissions");
});

const mountOnItsScreen = async ({ screen, component, readonly }: Section, actions: string[]) => {
  currentRoute.value = { params: { id: "656" }, meta: { menuRoute: screen } };
  sessionStorage.setItem("permissions", JSON.stringify({ screens: [{ route: screen, actions }], controlled: [screen] }));
  const pinia = createPinia();
  setActivePinia(pinia);
  Object.assign(useEntitiesStore(), { isReadonly: readonly, isEdit: !readonly });
  wrapper = mount(component as never, { global: { plugins: [createVuetify({ components, directives }), pinia] } });
  await flushPromises();
};

const showsControl = ({ control }: Section) =>
  wrapper!.findAll("button").some((button) => button.text().trim().toUpperCase() === control);

describe.each(sections)("$name", (section) => {
  test("a user who may only look at it cannot unlock or save it", async () => {
    await mountOnItsScreen(section, ["VER"]);

    expect(showsControl(section)).toBe(false);
  });

  test("Modificar shows its edit control", async () => {
    await mountOnItsScreen(section, ["VER", "MODIFICAR"]);

    expect(showsControl(section)).toBe(true);
  });
});
