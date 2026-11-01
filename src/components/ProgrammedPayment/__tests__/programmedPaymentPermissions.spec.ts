import { describe, expect, test, vi } from "vitest";
import ListProgrammedPaymentComponent from "@/components/ProgrammedPayment/ListProgrammedPaymentComponent.vue";
import { useProgramacionesStore } from "@/stores/programaciones";
import { actionsOf, controlsFor, icon, setState, shownControls } from "@/composables/__tests__/screenControls";
import type { ControlledScreen } from "@/composables/__tests__/screenControls";

vi.mock("@/api/http", () => ({ default: vi.fn() }));
vi.mock("@/router", () => ({ default: { push: vi.fn(), go: vi.fn() } }));
vi.mock("vue-router", () => ({ useRouter: () => ({ push: vi.fn() }), useRoute: () => ({ params: {} }) }));
vi.mock("sweetalert2", () => ({ default: { fire: vi.fn().mockResolvedValue({ isConfirmed: false }) } }));

const branchWithCurrency = () => sessionStorage.setItem("dataBranch", JSON.stringify([{ id: 7, moneda: [{ symbol: "S/" }] }]));
const pendingSupplier = { id: 1, id_proveedor: 3, id_details: 9, status: false, proveedor: "Proveedor Uno", symbol: "USD", monto: 5, monto_original: 5 };
const schedule = { id: 1, correlativo: 1, total_dolar: 5, total_soles: 0, details: [pendingSupplier] };
const scheduledLine = { id: 7, nro_master: "EXP-1", monto_mon_ex: 5, acronym: "USD" };

const SCREENS: ControlledScreen[] = [
  {
    name: "Pagos programados",
    route: "listProgrammedPayment",
    component: ListProgrammedPaymentComponent,
    before: branchWithCurrency,
    rows: { ListProgrammedPayment: [schedule] },
    prepare: (wrapper) => setState(wrapper, { expanded: [schedule.id] }),
    controls: [
      { name: "Pagar", action: "NUEVO", shown: icon("mdi-hand-coin") },
      { name: "Quitar de la programación", action: "ELIMINAR", shown: icon("mdi-delete") },
    ],
  },
  {
    name: "Pagar a un proveedor programado",
    route: "listProgrammedPayment",
    component: ListProgrammedPaymentComponent,
    before: branchWithCurrency,
    prepare: async (wrapper) => {
      useProgramacionesStore().listProgramacionxProveedor = [scheduledLine] as never;
      await setState(wrapper, { dialog: true });
    },
    controls: [{ name: "Quitar expediente", action: "ELIMINAR", shown: icon("mdi-delete") }],
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
