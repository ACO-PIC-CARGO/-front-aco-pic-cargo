import { describe, expect, test, vi } from "vitest";
import ModuleAccountPaysComponent from "@/components/folderModulesPays/ModuleAccountPaysComponent.vue";
import ControlAccountPaysComponent from "@/components/folderModulesPays/ControlAccountPaysComponent.vue";
import ModuleAccountReceivableComponent from "@/components/folderModulesPays/ModuleAccountReceivableComponent.vue";
import ControlAccountReceivableComponent from "@/components/folderModulesPays/ControlAccountReceivableComponent.vue";
import { useAdminAuthorizationStore } from "@/stores/adminAuthorization";
import { actionsOf, button, controlsFor, icon, shownControls } from "@/composables/__tests__/screenControls";
import type { ControlledScreen, ScreenControl } from "@/composables/__tests__/screenControls";

vi.mock("@/api/http", () => ({ default: vi.fn() }));
vi.mock("@/router", () => ({ default: { push: vi.fn(), go: vi.fn() } }));
vi.mock("vue-router", () => ({
  useRouter: () => ({ push: vi.fn(), go: vi.fn(), back: vi.fn() }),
  useRoute: () => ({ params: { id: "5" } }),
}));
vi.mock("sweetalert2", () => ({ default: { fire: vi.fn().mockResolvedValue({ isConfirmed: false }) } }));

const open = { id: 1, status: 1, paymentname: "Contado" };
const paid = { id: 2, status: 2, paymentname: "Contado" };
const account = { id: 5, fecha: "2026-10-01", details: [{ id: 1, concepto: "Flete", monto: 10, status: true }] };

const SCREENS: ControlledScreen[] = [
  {
    name: "Cuentas por pagar",
    route: "controlAccountPays",
    component: ModuleAccountPaysComponent,
    rows: { getInvoiceAdmin: [open] },
    controls: [
      { name: "Nueva factura", action: "NUEVO", shown: button("NUEVA FACTURA") },
      { name: "Editar", action: "MODIFICAR", shown: icon("mdi-pencil") },
    ],
  },
  {
    name: "Nueva cuenta por pagar",
    route: "controlAccountPays",
    component: ControlAccountPaysComponent,
    props: { tipo: "nuevo" },
    controls: [{ name: "Guardar", action: "NUEVO", shown: button("GUARDAR CUENTA POR PAGAR") }],
  },
  {
    name: "Editar cuenta por pagar",
    route: "controlAccountPays",
    component: ControlAccountPaysComponent,
    props: { tipo: "editar" },
    rows: { getVerInvoiceAdmin: [account] },
    controls: [{ name: "Guardar cambios", action: "MODIFICAR", shown: button("GUARDAR CAMBIOS") }],
  },
  {
    name: "Cuentas por cobrar",
    route: "moduleAccountReceivable",
    component: ModuleAccountReceivableComponent,
    rows: { getInvoiceAdminCxC: [open] },
    controls: [
      { name: "Nuevo cobro", action: "NUEVO", shown: button("NUEVO COBRO") },
      { name: "Editar", action: "MODIFICAR", shown: icon("mdi-pencil") },
    ],
  },
  {
    name: "Nueva cuenta por cobrar",
    route: "moduleAccountReceivable",
    component: ControlAccountReceivableComponent,
    props: { tipo: "nuevo" },
    controls: [{ name: "Guardar", action: "NUEVO", shown: button("GUARDAR CUENTA POR COBRAR") }],
  },
  {
    name: "Editar cuenta por cobrar",
    route: "moduleAccountReceivable",
    component: ControlAccountReceivableComponent,
    props: { tipo: "editar" },
    rows: { getVerInvoiceAdminCxC: [account] },
    controls: [{ name: "Guardar cambios", action: "MODIFICAR", shown: button("GUARDAR CUENTA POR COBRAR") }],
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

const ADMIN_AUTHORIZED: ScreenControl[] = [
  { name: "Eliminar", action: "VER", shown: icon("mdi-delete") },
  { name: "Editar pagada", action: "VER", shown: icon("mdi-pencil") },
];

describe.each<Omit<ControlledScreen, "controls">>([
  { name: "Cuentas por pagar", route: "controlAccountPays", component: ModuleAccountPaysComponent, rows: { getInvoiceAdmin: [open, paid] } },
  { name: "Cuentas por cobrar", route: "moduleAccountReceivable", component: ModuleAccountReceivableComponent, rows: { getInvoiceAdminCxC: [open, paid] } },
])("$name", (list) => {
  test("Eliminar and Editar on a paid account show to anyone who can open the list, since an administrator authorizes them", async () => {
    expect(await shownControls({ ...list, controls: ADMIN_AUTHORIZED }, ["VER"])).toEqual(["Eliminar", "Editar pagada"]);
  });
});

describe.each(SCREENS.filter((screen) => screen.props?.tipo === "editar"))("$name", (screen) => {
  test("saving shows without Modificar while an administrator's authorization is open", async () => {
    const authorized = {
      ...screen,
      before: () => {
        useAdminAuthorizationStore().credentials = { usuario: "jefa@empresa.com", clave: "Clave-1" };
      },
    };

    expect(await shownControls(authorized, ["VER"])).toEqual(controlsFor(screen, "MODIFICAR"));
  });
});
