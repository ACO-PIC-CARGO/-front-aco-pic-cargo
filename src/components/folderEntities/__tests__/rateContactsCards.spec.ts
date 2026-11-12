import { afterEach, expect, test, vi } from "vitest";
import { flushPromises, mount } from "@vue/test-utils";
import type { VueWrapper } from "@vue/test-utils";
import { createPinia, setActivePinia } from "pinia";
import { createVuetify } from "vuetify";
import * as components from "vuetify/components";
import * as directives from "vuetify/directives";
import SeccionEmailTarifaComponent from "@/components/folderEntities/Proveedor/SeccionEmailTarifaComponent.vue";
import { useEntitiesStore } from "@/stores/entities";

vi.mock("@/api/http", () => ({ default: vi.fn().mockResolvedValue({ data: { data: [] } }) }));
vi.mock("@/router", () => ({ default: { push: vi.fn(), currentRoute: { value: { params: {} } } } }));
vi.mock("vue-router", () => ({ useRoute: () => ({ name: "verProveedor", params: {} }) }));
vi.mock("sweetalert2", () => ({ default: { fire: vi.fn(), showLoading: vi.fn() } }));
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
afterEach(() => wrapper?.unmount());

async function mountTab(readonly: boolean) {
  const pinia = createPinia();
  setActivePinia(pinia);
  const entities = useEntitiesStore();
  entities.isReadonly = readonly;
  wrapper = mount(SeccionEmailTarifaComponent, {
    props: { guardarFlag: false },
    global: { plugins: [createVuetify({ components, directives }), pinia] },
    attachTo: document.body,
  });
  await flushPromises();
  // No provider id in the route: the section starts empty, so the contacts are set after it loads.
  entities.itemsImportacion = [
    { id: 1, code: "I", contacto: "Li Sheng", email: "lisheng@kylinindustry.com", telefono: "+86 138 6423 9876", estado: true },
  ];
  entities.itemsExportacion = [
    { id: 2, code: "E", contacto: "Wang Chen", email: "wchen@kylinindustry.com", telefono: "", estado: false },
  ];
  await flushPromises();
  return entities;
}

test("reading shows each list's contacts with their state, without inputs or actions", async () => {
  await mountTab(true);
  const text = wrapper!.text();

  expect(text).toContain("Contactos de Importación");
  expect(text).toContain("Contactos de Exportación");
  expect(text).toContain("Li Sheng");
  expect(text).toContain("lisheng@kylinindustry.com");
  expect(text).toContain("Activo");
  expect(text).toContain("Inactivo");
  expect(wrapper!.find(".prov-avatar").text()).toBe("LS");
  expect(wrapper!.find('input:not([type="checkbox"])').exists()).toBe(false);
  expect(text).not.toContain("Agregar Contacto");
});

test("while editing, Agregar Contacto adds a new contact to its own list through the dialog", async () => {
  const entities = await mountTab(false);

  const agregar = wrapper!.findAll("button").filter((button) => button.text() === "Agregar Contacto");
  expect(agregar).toHaveLength(2);
  await agregar[1]!.trigger("click");
  await flushPromises();

  const vm = wrapper!.vm as unknown as { draft: { contacto: string; email: string }; saveDialog: () => Promise<void> };
  vm.draft.contacto = " Ana Ruiz ";
  vm.draft.email = "correo-invalido";
  await vm.saveDialog();
  expect(entities.itemsExportacion).toHaveLength(1);

  vm.draft.email = "ana@kylinindustry.com";
  await vm.saveDialog();
  expect(entities.itemsExportacion[1]).toMatchObject({ id: 0, code: "E", contacto: "Ana Ruiz", email: "ana@kylinindustry.com", estado: true });
  expect(entities.itemsImportacion).toHaveLength(1);
});
