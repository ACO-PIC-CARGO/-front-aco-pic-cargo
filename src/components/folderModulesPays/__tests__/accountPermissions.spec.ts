import { describe, expect, test, vi } from "vitest";
import ModuleAccountPaysComponent from "@/components/folderModulesPays/ModuleAccountPaysComponent.vue";
import ControlAccountPaysComponent from "@/components/folderModulesPays/ControlAccountPaysComponent.vue";
import ModuleAccountReceivableComponent from "@/components/folderModulesPays/ModuleAccountReceivableComponent.vue";
import ControlAccountReceivableComponent from "@/components/folderModulesPays/ControlAccountReceivableComponent.vue";
import { actionsOf, button, controlsFor, icon, shownControls } from "@/composables/__tests__/screenControls";
import type { ControlledScreen } from "@/composables/__tests__/screenControls";

vi.mock("@/api/http", () => ({ default: vi.fn() }));
vi.mock("@/router", () => ({ default: { push: vi.fn(), go: vi.fn() } }));
vi.mock("vue-router", () => ({
  useRouter: () => ({ push: vi.fn(), go: vi.fn(), back: vi.fn() }),
  useRoute: () => ({ params: { id: "5" } }),
}));
vi.mock("sweetalert2", () => ({ default: { fire: vi.fn().mockResolvedValue({ isConfirmed: false }) } }));

const openAndClosed = [
  { id: 1, status: 1, paymentname: "Contado" },
  { id: 2, status: 2, paymentname: "Contado" },
];
const account = { id: 5, fecha: "2026-10-01", details: [{ id: 1, concepto: "Flete", monto: 10, status: true }] };

const SCREENS: ControlledScreen[] = [
  {
    name: "Cuentas por pagar",
    route: "controlAccountPays",
    component: ModuleAccountPaysComponent,
    rows: { getInvoiceAdmin: openAndClosed },
    controls: [
      { name: "Nueva factura", action: "NUEVO", shown: button("NUEVA FACTURA") },
      { name: "Editar", action: "MODIFICAR", shown: icon("mdi-pencil") },
      { name: "Eliminar", action: "ELIMINAR", shown: icon("mdi-delete") },
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
    rows: { getInvoiceAdminCxC: openAndClosed },
    controls: [
      { name: "Nuevo cobro", action: "NUEVO", shown: button("NUEVO COBRO") },
      { name: "Editar", action: "MODIFICAR", shown: icon("mdi-pencil") },
      { name: "Eliminar", action: "ELIMINAR", shown: icon("mdi-delete") },
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
