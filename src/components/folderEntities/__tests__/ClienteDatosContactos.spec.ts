import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { flushPromises, mount } from "@vue/test-utils";
import type { VueWrapper } from "@vue/test-utils";
import { createPinia, setActivePinia } from "pinia";
import { createVuetify } from "vuetify";
import * as components from "vuetify/components";
import * as directives from "vuetify/directives";
import ClienteDatosContactos from "@/components/folderEntities/Cliente/ClienteDatosContactos.vue";
import { useAppStore } from "@/stores/app";
import { useEntitiesStore } from "@/stores/entities";
import { useMasterusuariosStore } from "@/stores/masterusuarios";

vi.mock("@/api/http", () => ({ default: vi.fn().mockResolvedValue({ data: { data: [] } }) }));
vi.mock("@/router", () => ({ default: { push: vi.fn(), currentRoute: { value: { params: { id: "656" }, meta: {} } } } }));
vi.mock("vue-router", () => ({ useRoute: () => ({ params: { id: "656" } }), useRouter: () => ({ push: vi.fn() }) }));
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

let wrapper: VueWrapper | undefined;

function mountTab(readonly: boolean) {
  const pinia = createPinia();
  setActivePinia(pinia);
  const app = useAppStore();
  const entities = useEntitiesStore();
  const master = useMasterusuariosStore();
  app.itemsPais = [{ id: 139, name: "Perú", phoneprefix: "+51", codigo_iso: "PE" }];
  app.itemsDocumentsPais = [{ id: 1, name: "DNI", description: "DOCUMENTO NACIONAL DE IDENTIDAD" }];
  app.itemsState = [{ id: 15, name: "Lima" }] as never;
  master.lstTipoPersona = [{ id: 7, descripcion: "Persona Natural" }] as never;
  master.lstTipoTransaccion = [{ id: 3, descripcion: "Nacional" }] as never;
  master.lstTipoTelefono = [
    { id: 1, descripcion: "Oficina (Fijo)" },
    { id: 2, descripcion: "WhatsApp" },
  ] as never;
  Object.assign(entities.cliente, {
    id: 656,
    id_tipopersona: 7,
    id_tipotransaccion: 3,
    nombrecompleto: "ALDAIR",
    id_tipodocumento: 1,
    nro_documento: "12345678",
    id_pais: 139,
    id_ciudad: 15,
    direccion: "Av. Los Inkas 123, Surco",
  });
  entities.lstTelefonos = [{ id_tipotelefono: "1", telefono: "(01) 456-7890" }];
  entities.lstEmails = [
    { id: 1, description: "", email: "contacto@empresa.com", estado: true },
    { id: 2, description: "", email: "baja@empresa.com", estado: false },
  ];
  entities.lstContactos = [
    { nombre: "María Alejandra", cargo: "Gerente de Compras", email: "maria@empresa.com", id_tipotelefono: "2", telefono: "987654321" },
  ];
  entities.isReadonly = readonly;
  wrapper = mount(ClienteDatosContactos, {
    global: { plugins: [createVuetify({ components, directives }), pinia] },
    attachTo: document.body,
  });
  return { entities };
}

beforeEach(() => {
  sessionStorage.setItem("dataUser", JSON.stringify([{ id_branch: 7, id_pais: 139 }]));
});

afterEach(() => wrapper?.unmount());

test("reading shows the client's data, phones, active e-mails and contacts as text", async () => {
  mountTab(true);
  await flushPromises();
  const text = wrapper!.text();

  for (const value of ["Persona Natural", "Nacional", "ALDAIR", "DNI", "12345678", "Perú", "Lima", "Av. Los Inkas 123, Surco"]) {
    expect(text).toContain(value);
  }
  expect(text).toContain("Oficina (Fijo)");
  expect(text).toContain("contacto@empresa.com");
  expect(text).not.toContain("baja@empresa.com");
  expect(text).toContain("María Alejandra");
  expect(text).toContain("Gerente de Compras");
  expect(text).toContain("maria@empresa.com");
  expect(wrapper!.find(".cli-avatar").text()).toBe("MA");
  expect(wrapper!.find("input").exists()).toBe(false);
  expect(text).not.toContain("Agregar");
});

const dialogButton = (name: string) =>
  [...document.body.querySelectorAll<HTMLElement>(".cli-contact-dialog button")].find((b) => b.textContent?.trim() === name)!;
const dialogInput = (label: string) =>
  [...document.body.querySelectorAll(".cli-contact-dialog .v-input")]
    .find((field) => field.querySelector("label")?.textContent === label)!
    .querySelector("input")!;
async function type(label: string, value: string) {
  const input = dialogInput(label);
  input.value = value;
  input.dispatchEvent(new Event("input"));
  await flushPromises();
}

test("while editing, contacts keep their look and Agregar Contacto opens a dialog for the new contact", async () => {
  const { entities } = mountTab(false);
  await flushPromises();
  const contactos = wrapper!.findAll(".cli-card").find((card) => card.text().includes("Nombre y Cargo"))!;
  expect(contactos.find('input[aria-label="Cargo del contacto"]').exists()).toBe(false);
  expect(contactos.find(".cli-avatar").text()).toBe("MA");
  expect(contactos.text()).toContain("Gerente de Compras");

  await wrapper!.findAll("button").find((button) => button.text() === "Agregar Contacto")!.trigger("click");
  await flushPromises();
  expect(entities.lstContactos).toHaveLength(1);

  dialogButton("Agregar").click();
  await flushPromises();
  expect(entities.lstContactos).toHaveLength(1);

  await type("Nombre *", " José Vargas ");
  await type("Cargo", "Operaciones");
  await type("Correo Electrónico", "jvargas@empresa.com");
  await type("Número *", "456-7891");
  (wrapper!.vm as unknown as { draftContacto: { id_tipotelefono: string } }).draftContacto.id_tipotelefono = "1";
  dialogButton("Agregar").click();
  await flushPromises();
  await flushPromises();

  expect(entities.lstContactos[1]).toEqual({
    nombre: "José Vargas",
    cargo: "Operaciones",
    email: "jvargas@empresa.com",
    id_tipotelefono: "1",
    telefono: "456-7891",
  });
  expect((wrapper!.vm as unknown as { dialogOpen: boolean }).dialogOpen).toBe(false);
});

test("the pencil edits a contact in the same dialog, keeping the row's object", async () => {
  const { entities } = mountTab(false);
  await flushPromises();
  const principal = entities.lstContactos[0];

  await wrapper!.find('button[aria-label="Editar contacto María Alejandra"]').trigger("click");
  await flushPromises();
  expect(dialogInput("Nombre *").value).toBe("María Alejandra");

  await type("Cargo", "Jefa de Compras");
  dialogButton("Guardar").click();
  await flushPromises();
  await flushPromises();

  expect(entities.lstContactos).toHaveLength(1);
  expect(entities.lstContactos[0]).toBe(principal);
  expect(entities.lstContactos[0]!.cargo).toBe("Jefa de Compras");
});
