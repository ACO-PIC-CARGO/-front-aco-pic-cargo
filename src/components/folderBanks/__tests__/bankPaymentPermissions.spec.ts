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

vi.mock("@/api/http", () => ({ default: vi.fn() }));
vi.mock("@/router", () => ({ default: { push: vi.fn(), go: vi.fn() } }));
vi.mock("vue-router", () => ({
  useRouter: () => ({ push: vi.fn(), go: vi.fn(), back: vi.fn() }),
  useRoute: () => ({ params: { id: "5" } }),
}));
vi.mock("sweetalert2", () => ({ default: { fire: vi.fn().mockResolvedValue({ isConfirmed: false }) } }));

const payment = { id: 1, id_pago: 1, detalle: [], detalles: [], table_comisionbancaria: [], comisionbancaria: [] };
const editState = (verflag: boolean) => ({ verflag });

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
      { name: "Eliminar", action: "ELIMINAR", shown: icon("mdi-delete") },
    ],
  },
  {
    name: "Listado de salidas detallado",
    route: "listBankCxP",
    component: PagosPorProveedorDetalladoComponent,
    rows: { listar_banco_gasto_detalles: [payment] },
    controls: [{ name: "Editar", action: "MODIFICAR", shown: icon("mdi-pencil") }],
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
      { name: "Eliminar", action: "ELIMINAR", shown: button("Eliminar Operación") },
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
      { name: "Editar", action: "MODIFICAR", shown: icon("mdi-pencil") },
      { name: "Eliminar", action: "ELIMINAR", shown: icon("mdi-delete") },
    ],
  },
  {
    name: "Listado de entradas detallado",
    route: "listBankCxC",
    component: ListPayForClienteDetalles,
    rows: { getListarPayForCustomerDetalle: [payment] },
    controls: [{ name: "Editar", action: "MODIFICAR", shown: icon("mdi-pencil") }],
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
      { name: "Eliminar", action: "ELIMINAR", shown: button("Eliminar Operación") },
    ],
  },
  {
    name: "Nuevo ingreso",
    route: "registroPayForCliente",
    component: RegistroPayForClienteComponent,
    prepare: (wrapper) => setState(wrapper, { cliente: 3, pasos: 2 }),
    controls: [{ name: "Finalizar", action: "NUEVO", shown: button("Finalizar Operación") }],
  },
];

describe.each(SCREENS)("$name", (screen) => {
  test("a role that may only look sees none of its action controls", async () => {
    expect(await shownControls(screen, ["VER"])).toEqual([]);
  });

  test.each(actionsOf(screen))("with %s it shows exactly the controls of that action", async (action) => {
    expect(await shownControls(screen, ["VER", action])).toEqual(controlsFor(screen, action));
  });
});
