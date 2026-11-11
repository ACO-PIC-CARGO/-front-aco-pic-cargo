import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { flushPromises, mount } from "@vue/test-utils";
import type { VueWrapper } from "@vue/test-utils";
import { createPinia, setActivePinia } from "pinia";
import { createVuetify } from "vuetify";
import * as components from "vuetify/components";
import * as directives from "vuetify/directives";
import Swal from "sweetalert2";
import ProveedorDatosContactos from "@/components/folderEntities/Proveedor/ProveedorDatosContactos.vue";
import { useAppStore } from "@/stores/app";
import { useEntitiesStore } from "@/stores/entities";
import { useMasterusuariosStore } from "@/stores/masterusuarios";

vi.mock("@/api/http", () => ({ default: vi.fn().mockResolvedValue({ data: { data: [] } }) }));
vi.mock("@/router", () => ({ default: { push: vi.fn(), currentRoute: { value: { params: { id: "9224" }, meta: {} } } } }));
vi.mock("vue-router", () => ({ useRoute: () => ({ params: { id: "9224" } }), useRouter: () => ({ push: vi.fn() }) }));
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

function mountTab(readonly: boolean, { nuevo = false, tipo = 4 } = {}) {
  const pinia = createPinia();
  setActivePinia(pinia);
  const app = useAppStore();
  const entities = useEntitiesStore();
  const master = useMasterusuariosStore();
  app.itemsPais = [{ id: 45, name: "China", phoneprefix: "+86", codigo_iso: "CN" }];
  app.itemsDocumentsPais = [{ id: 1, name: "RUC", description: "Registro Único de Contribuyente" }];
  app.itemsState = [{ id: 15, name: "Shandong" }] as never;
  app.itemsDataRoleList = [
    { id: 4, name: "01 - PROVEEDOR" },
    { id: 5, name: "02 - SHIPPER" },
    { id: 6, name: "03 - NAVIERA" },
  ] as never;
  master.lstTipoTransaccion = [{ id: 57, descripcion: "Extranjero", codigo: "02" }] as never;
  master.lstTipoTelefono = [
    { id: 1, descripcion: "Oficina (Fijo)" },
    { id: 2, descripcion: "WhatsApp" },
  ] as never;
  Object.assign(entities.proveedor, {
    correlativo: "0009224",
    nombrecompleto: "QINGDAO KYLIN INDUSTRY AND TRADE CO., LTD",
    id_tipoproveedor: tipo,
    id_tipotransaccion: 57,
    id_tipodocumento: 1,
    nro_documento: "12345678901",
    id_pais: 45,
    id_ciudad: 15,
    direccion: "No. 168, Huangdao District, Qingdao",
    producto: "Máquinas vending, repuestos y accesorios.",
    dias_sobreestadia: 14,
    notas: "Proveedor principal para máquinas TCN.",
  });
  entities.lstTelefonos = nuevo ? [] : [{ id_tipotelefono: "1", telefono: "865328765432" }];
  entities.lstEmails = [
    { id: 1, description: "", email: "sales@kylinindustry.com", estado: true },
    { id: 2, description: "", email: "baja@kylinindustry.com", estado: false },
  ];
  entities.lstContactos = nuevo
    ? []
    : [{ nombre: "Li Sheng", cargo: "Gerente Comercial", email: "lisheng@kylinindustry.com", id_tipotelefono: "2", telefono: "8613864239876" }];
  entities.isReadonly = readonly;
  wrapper = mount(ProveedorDatosContactos, {
    props: { nuevo },
    global: { plugins: [createVuetify({ components, directives }), pinia] },
    attachTo: document.body,
  });
  return { entities };
}

beforeEach(() => {
  sessionStorage.setItem("dataUser", JSON.stringify([{ id_branch: 7, id_pais: 139 }]));
  vi.mocked(Swal.fire).mockClear();
});

afterEach(() => wrapper?.unmount());

test("reading shows the provider's data, phones, active e-mails, contacts, product and notes as text", async () => {
  mountTab(true);
  await flushPromises();
  const text = wrapper!.text();

  for (const value of [
    "QINGDAO KYLIN INDUSTRY AND TRADE CO., LTD",
    "01 - PROVEEDOR",
    "Registro Único de Contribuyente",
    "12345678901",
    "China",
    "Shandong",
    "Extranjero",
    "No. 168, Huangdao District, Qingdao",
    "Oficina (Fijo)",
    "+865328765432",
    "sales@kylinindustry.com",
    "Li Sheng",
    "Gerente Comercial",
    "Máquinas vending, repuestos y accesorios.",
    "Proveedor principal para máquinas TCN.",
  ]) {
    expect(text).toContain(value);
  }
  expect(text).not.toContain("baja@kylinindustry.com");
  expect(wrapper!.find(".prov-avatar").text()).toBe("LS");
  expect(wrapper!.find("input").exists()).toBe(false);
  expect(wrapper!.find("textarea").exists()).toBe(false);
  expect(text).not.toContain("Agregar");
});

test("a shipper must say which product it sells", async () => {
  mountTab(false, { tipo: 5 });
  await flushPromises();
  useEntitiesStore().proveedor.producto = "";
  await flushPromises();

  const { valid } = await (wrapper!.vm as unknown as { validarPaso: () => Promise<boolean> }).validarPaso().then((ok) => ({ valid: ok }));
  expect(valid).toBe(false);
  expect(wrapper!.text()).toContain("Dato Requerido");
});

test("a naviera shows its free demurrage days under the service conditions", async () => {
  mountTab(true, { tipo: 6 });
  await flushPromises();
  expect(wrapper!.text()).toContain("Días Libres de Sobreestadía");
  expect(wrapper!.text()).toContain("14");
});

test("a new provider cannot continue without a phone and a contact", async () => {
  mountTab(false, { nuevo: true });
  await flushPromises();

  const ok = await (wrapper!.vm as unknown as { validarPaso: () => Promise<boolean> }).validarPaso();
  expect(ok).toBe(false);
  expect(Swal.fire).toHaveBeenCalledWith(
    expect.objectContaining({ text: "Para continuar, es necesario agregar al menos un teléfono y un contacto" }),
  );
});

const dialogButton = (name: string) =>
  [...document.body.querySelectorAll<HTMLElement>(".prov-dialog button")].find((b) => b.textContent?.trim() === name)!;
const dialogInput = (label: string) =>
  [...document.body.querySelectorAll(".prov-dialog .v-input")]
    .find((field) => field.querySelector("label")?.textContent === label)!
    .querySelector("input")!;
async function type(label: string, value: string) {
  const input = dialogInput(label);
  input.value = value;
  input.dispatchEvent(new Event("input"));
  await flushPromises();
}

test("a contact's phone keeps the digits-only rule and is saved without its plus sign", async () => {
  const { entities } = mountTab(false);
  await flushPromises();

  await wrapper!.findAll("button").find((button) => button.text() === "Agregar Contacto")!.trigger("click");
  await flushPromises();
  await type("Nombre *", " Xiao Zhang ");
  await type("Cargo", "Ventas Internacionales");
  await type("Número *", "150 9876");
  (wrapper!.vm as unknown as { draftContacto: { id_tipotelefono: string } }).draftContacto.id_tipotelefono = "1";
  dialogButton("Agregar").click();
  await flushPromises();
  expect(entities.lstContactos).toHaveLength(1);

  await type("Número *", "+8615098765432");
  dialogButton("Agregar").click();
  await flushPromises();
  await flushPromises();

  expect(entities.lstContactos[1]).toMatchObject({
    nombre: "Xiao Zhang",
    cargo: "Ventas Internacionales",
    id_tipotelefono: "1",
    telefono: "8615098765432",
  });
});
