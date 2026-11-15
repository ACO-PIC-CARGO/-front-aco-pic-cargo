import { describe, expect, test, vi } from "vitest";
import ListPayForProveedorComponent from "@/components/folderBanks/ListPayForProveedorComponent.vue";
import PagosPorProveedorDetalladoComponent from "@/components/folderBanks/PagosPorProveedorDetalladoComponent.vue";
import VerEditarPayForProveedorComponent from "@/components/folderBanks/VerEditarPayForProveedorComponent.vue";
import RegistroPayForProveedorComponent from "@/components/folderBanks/RegistroPayForProveedorComponent.vue";
import ListPayForClienteComponent from "@/components/folderBanks/ListPayForClienteComponent.vue";
import ListPayForClienteDetalles from "@/components/folderBanks/ListPayForClienteDetalles.vue";
import VerEditarPayForClienteComponent from "@/components/folderBanks/VerEditarPayForClienteComponent.vue";
import RegistroPayForClienteComponent from "@/components/folderBanks/RegistroPayForClienteComponent.vue";
import { actionsOf, button, controlsFor, icon, setState, shownControls } from "@/composables/__tests__/screenControls";
import type { ControlledScreen } from "@/composables/__tests__/screenControls";
import { flushPromises, httpMock } from "@/stores/__tests__/catalogHttp";
import { useAdminAuthorizationStore } from "@/stores/adminAuthorization";

vi.mock("@/api/http", () => ({ default: vi.fn() }));
vi.mock("@/router", () => ({ default: { push: vi.fn(), go: vi.fn() } }));
vi.mock("vue-router", () => ({
  useRouter: () => ({ push: vi.fn(), go: vi.fn(), back: vi.fn() }),
  useRoute: () => ({ params: { id: "5" } }),
}));
vi.mock("sweetalert2", () => ({ default: { fire: vi.fn().mockResolvedValue({ isConfirmed: false }) } }));

const payment = {
  id: 1, id_pago: 1, detalle: [], detalles: [], table_comisionbancaria: [], comisionbancaria: [],
  // banco del proveedor: obligatorio para guardar la salida
  id_banco_proveedor: 2, nrocuenta_proveedor: "191-0000000-0-00", id_coins_proveedor: 1,
};
const editState = (verflag: boolean) => ({ verflag });
const admin = { usuario: "admin", clave: "clave-admin" };
const authorizedByAdmin = () => void (useAdminAuthorizationStore().credentials = admin);

const authorizedOutgoingEdit: ControlledScreen = {
  name: "Editar salida que autorizó un administrador",
  route: "listBankCxP",
  component: VerEditarPayForProveedorComponent,
  props: editState(false),
  rows: { ver_registro_egresos: [payment] },
  before: authorizedByAdmin,
  controls: [
    { name: "Actualizar", action: "VER", shown: button("Actualizar Operación") },
    { name: "Eliminar", action: "VER", shown: button("Eliminar Operación") },
  ],
};

const authorizedIncomingEdit: ControlledScreen = {
  name: "Editar entrada que autorizó un administrador",
  route: "listBankCxC",
  component: VerEditarPayForClienteComponent,
  props: editState(false),
  rows: { ver_registro_ingresos: [payment] },
  before: authorizedByAdmin,
  controls: [
    { name: "Actualizar", action: "VER", shown: button("Actualizar Operación") },
    { name: "Eliminar", action: "VER", shown: button("Eliminar Operación") },
  ],
};

const SCREENS: ControlledScreen[] = [
  {
    name: "Listado de salidas",
    route: "listBankCxP",
    component: ListPayForProveedorComponent,
    rows: { listado_egresos: [payment] },
    controls: [
      { name: "Nuevo pago", action: "NUEVO", shown: button("NUEVO PAGO") },
      { name: "Excel", action: "EXPORTAR", shown: button("EXCEL") },
      { name: "Editar", action: "MODIFICAR", shown: icon("mdi-pencil") },
      { name: "Eliminar", action: "VER", shown: icon("mdi-delete") },
    ],
  },
  {
    name: "Listado de salidas detallado",
    route: "listBankCxP",
    component: PagosPorProveedorDetalladoComponent,
    rows: { listar_banco_gasto_detalles: [payment] },
    controls: [{ name: "Editar", action: "VER", shown: icon("mdi-pencil") }],
  },
  {
    name: "Ver salida",
    route: "listBankCxP",
    component: VerEditarPayForProveedorComponent,
    props: editState(true),
    rows: { ver_registro_egresos: [payment] },
    controls: [
      { name: "Ir a editar", action: "MODIFICAR", shown: button("Ir a Editar") },
      { name: "Imprimir", action: "EXPORTAR", shown: button("Imprimir") },
    ],
  },
  {
    name: "Editar salida",
    route: "listBankCxP",
    component: VerEditarPayForProveedorComponent,
    props: editState(false),
    rows: { ver_registro_egresos: [payment] },
    controls: [
      { name: "Actualizar", action: "MODIFICAR", shown: button("Actualizar Operación") },
      { name: "Eliminar", action: "VER", shown: button("Eliminar Operación") },
    ],
  },
  {
    name: "Nueva salida",
    route: "registroPayForProveedor",
    component: RegistroPayForProveedorComponent,
    prepare: (wrapper) => setState(wrapper, { proveedor: 3, pasos: 2 }),
    controls: [{ name: "Finalizar", action: "NUEVO", shown: button("Finalizar Operación") }],
  },
  {
    name: "Listado de entradas",
    route: "listBankCxC",
    component: ListPayForClienteComponent,
    rows: { listado_ingresos: [payment] },
    controls: [
      { name: "Nuevo ingreso", action: "NUEVO", shown: button("NUEVO INGRESO") },
      { name: "Excel", action: "EXPORTAR", shown: button("EXCEL") },
      { name: "Editar", action: "VER", shown: icon("mdi-pencil") },
      { name: "Eliminar", action: "VER", shown: icon("mdi-delete") },
    ],
  },
  {
    name: "Listado de entradas detallado",
    route: "listBankCxC",
    component: ListPayForClienteDetalles,
    rows: { getListarPayForCustomerDetalle: [payment] },
    controls: [{ name: "Editar", action: "VER", shown: icon("mdi-pencil") }],
  },
  {
    name: "Ver entrada",
    route: "listBankCxC",
    component: VerEditarPayForClienteComponent,
    props: editState(true),
    rows: { ver_registro_ingresos: [payment] },
    controls: [
      { name: "Ir a editar", action: "MODIFICAR", shown: button("Ir a Editar") },
      { name: "Imprimir", action: "EXPORTAR", shown: button("Imprimir") },
    ],
  },
  {
    name: "Editar entrada",
    route: "listBankCxC",
    component: VerEditarPayForClienteComponent,
    props: editState(false),
    rows: { ver_registro_ingresos: [payment] },
    controls: [
      { name: "Actualizar", action: "MODIFICAR", shown: button("Actualizar Operación") },
      { name: "Eliminar", action: "VER", shown: button("Eliminar Operación") },
    ],
  },
  {
    name: "Nuevo ingreso",
    route: "registroPayForCliente",
    component: RegistroPayForClienteComponent,
    prepare: (wrapper) => setState(wrapper, { cliente: 3, pasos: 2 }),
    controls: [{ name: "Finalizar", action: "NUEVO", shown: button("Finalizar Operación") }],
  },
  authorizedOutgoingEdit,
  authorizedIncomingEdit,
];

const shownWithAction = (screen: ControlledScreen, action: string) =>
  screen.controls.filter((control) => control.action === action || control.action === "VER").map((control) => control.name);

describe.each(SCREENS)("$name", (screen) => {
  test("a role that may only look sees only the controls an administrator authorizes", async () => {
    expect(await shownControls(screen, ["VER"])).toEqual(controlsFor(screen, "VER"));
  });

  test.each(actionsOf(screen))("with %s it shows the controls of that action and those an administrator authorizes", async (action) => {
    expect(await shownControls(screen, ["VER", action])).toEqual(shownWithAction(screen, action));
  });
});

describe.each([
  { screen: authorizedOutgoingEdit, path: "actualizar_egresos" },
  { screen: authorizedIncomingEdit, path: "actualizar_ingresos" },
])("$screen.name", ({ screen, path }) => {
  test(`saving sends the administrator's credentials to ${path} as autorizacion`, async () => {
    await shownControls(screen, ["VER"]);
    [...document.body.querySelectorAll("button")].find((candidate) => candidate.textContent?.includes("Actualizar Operación"))!.click();
    await flushPromises();

    const saved = httpMock.mock.calls.find(([config]) => config.url.endsWith(path));
    expect(saved?.[0].data).toMatchObject({ autorizacion: admin });
  });

  test("leaving the screen forgets the administrator's credentials", async () => {
    let authorization: ReturnType<typeof useAdminAuthorizationStore> | undefined;
    await shownControls({ ...screen, before: () => void ((authorization = useAdminAuthorizationStore()).credentials = admin) }, ["VER"]);
    await shownControls(SCREENS[0]!, ["VER"]);

    expect(authorization?.credentials).toBeNull();
  });
});
