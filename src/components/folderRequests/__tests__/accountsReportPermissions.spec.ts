import { describe, expect, test, vi } from "vitest";
import DebstoPayComponent from "@/components/folderRequests/DebstoPayComponent.vue";
import AccountsReceivableComponent from "@/components/folderRequests/AccountsReceivableComponent.vue";
import { actionsOf, button, controlsFor, icon, setState, shownControls } from "@/composables/__tests__/screenControls";
import type { ControlledScreen } from "@/composables/__tests__/screenControls";

vi.mock("@/api/http", () => ({ default: vi.fn() }));
vi.mock("@/router", () => ({ default: { push: vi.fn(), go: vi.fn() } }));
vi.mock("vue-router", () => ({ useRouter: () => ({ push: vi.fn() }), useRoute: () => ({ params: {} }) }));
vi.mock("sweetalert2", () => ({ default: { fire: vi.fn().mockResolvedValue({ isConfirmed: false }) } }));

const unscheduled = { id: 1, programado: 0, symbol: "USD", llegada: 1, total_pagar: "10", monto: "10", total: "10", facturas: [] };
const supplier = { nameproveedor: "Proveedor Uno", nameconsigner: "Cliente Uno", details: [unscheduled] };
const branchWithCurrency = () => sessionStorage.setItem("dataBranch", JSON.stringify([{ id: 7, moneda: [{ acronym: "PEN" }] }]));
const openComments = (account: "dataCXP" | "dataCXC", origin: "esoperativo" | "esadministrativo") =>
  (wrapper: Parameters<typeof setState>[0]) => setState(wrapper, { [account]: { [origin]: true }, dialogComentarios: true });

const SCREENS: ControlledScreen[] = [
  {
    name: "Reporte de cuentas por pagar",
    route: "debstopay",
    component: DebstoPayComponent,
    before: branchWithCurrency,
    rows: { getReporteCXP: [supplier], getDebsToPayAdmin: [supplier] },
    prepare: (wrapper) => setState(wrapper, { expanded: [supplier.nameproveedor], expandeda: [] }),
    controls: [
      { name: "Excel", action: "EXPORTAR", shown: button("EXCEL") },
      { name: "PDF", action: "EXPORTAR", shown: button("PDF") },
      { name: "Programar pago", action: "NUEVO", shown: icon("mdi-clock-outline") },
    ],
  },
  {
    name: "Reporte de cuentas por pagar administrativas",
    route: "debstopay",
    component: DebstoPayComponent,
    before: branchWithCurrency,
    rows: { getDebsToPayAdmin: [supplier] },
    prepare: async (wrapper) => {
      const report = wrapper.findComponent({ name: "ScreenUnderTest" }).vm as unknown as { itemsCppa: unknown[] };
      await setState(wrapper, { expandeda: [...report.itemsCppa] });
    },
    controls: [{ name: "Programar pago", action: "NUEVO", shown: icon("mdi-clock-outline") }],
  },
  {
    name: "Comentarios de una cuenta por pagar operativa",
    route: "debstopay",
    component: DebstoPayComponent,
    before: branchWithCurrency,
    prepare: openComments("dataCXP", "esoperativo"),
    controls: [{ name: "Nuevo comentario", action: "NUEVO", shown: button("Nuevo Comentario") }],
  },
  {
    name: "Comentarios de una cuenta por pagar administrativa",
    route: "debstopay",
    component: DebstoPayComponent,
    before: branchWithCurrency,
    prepare: openComments("dataCXP", "esadministrativo"),
    controls: [{ name: "Nuevo comentario", action: "NUEVO", shown: button("Nuevo Comentario") }],
  },
  {
    name: "Reporte de cuentas por cobrar",
    route: "accountsreceivable",
    component: AccountsReceivableComponent,
    before: branchWithCurrency,
    controls: [
      { name: "Excel", action: "EXPORTAR", shown: button("EXCEL") },
      { name: "PDF", action: "EXPORTAR", shown: button("PDF") },
    ],
  },
  {
    name: "Comentarios de una cuenta por cobrar operativa",
    route: "accountsreceivable",
    component: AccountsReceivableComponent,
    before: branchWithCurrency,
    prepare: openComments("dataCXC", "esoperativo"),
    controls: [{ name: "Nuevo comentario", action: "NUEVO", shown: button("Nuevo Comentario") }],
  },
  {
    name: "Comentarios de una cuenta por cobrar administrativa",
    route: "accountsreceivable",
    component: AccountsReceivableComponent,
    before: branchWithCurrency,
    prepare: openComments("dataCXC", "esadministrativo"),
    controls: [{ name: "Nuevo comentario", action: "NUEVO", shown: button("Nuevo Comentario") }],
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
