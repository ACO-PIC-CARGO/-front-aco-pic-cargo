import { describe, expect, test, vi } from "vitest";
import EditarPagoPorProveedor from "@/views/FolderBanks/EditarPagoPorProveedor.vue";
import EditarCobroCliente from "@/views/FolderBanks/EditarCobroCliente.vue";
import { useBankStore } from "@/stores/bank";
import { actionsOf, button, controlsFor, icon, setState, shownControls } from "@/composables/__tests__/screenControls";
import type { ControlledScreen } from "@/composables/__tests__/screenControls";

vi.mock("@/api/http", () => ({ default: vi.fn() }));
vi.mock("@/router", () => ({ default: { push: vi.fn(), go: vi.fn() } }));
vi.mock("vue-router", () => ({
  useRouter: () => ({ push: vi.fn(), go: vi.fn() }),
  useRoute: () => ({ params: { nro_operacion: "OP-1" } }),
}));
vi.mock("sweetalert2", () => ({ default: { fire: vi.fn().mockResolvedValue({ isConfirmed: false }) } }));

const operation = { id: 1, detalle: [{ id: 1 }], details: [{ id: 1 }] };

const SCREENS: ControlledScreen[] = [
  {
    name: "Editar salida por número de operación, detalle",
    route: "listBankCxP",
    component: EditarPagoPorProveedor,
    rows: { ver_pago: [operation] },
    prepare: (wrapper) => setState(wrapper, { tab: "ref1" }),
    controls: [{ name: "Anular", action: "ELIMINAR", shown: icon("mdi-circle-off-outline") }],
  },
  {
    name: "Editar salida por número de operación, datos",
    route: "listBankCxP",
    component: EditarPagoPorProveedor,
    rows: { ver_pago: [operation] },
    prepare: (wrapper) => setState(wrapper, { tab: "ref2" }),
    controls: [{ name: "Actualizar", action: "MODIFICAR", shown: button("Actualizar") }],
  },
  {
    name: "Editar cobro por número de operación, detalle",
    route: "listBankCxC",
    component: EditarCobroCliente,
    rows: { ver_cobro: [operation] },
    before: () => void (useBankStore().record = operation),
    prepare: (wrapper) => setState(wrapper, { tab: "ref1" }),
    controls: [{ name: "Anular", action: "ELIMINAR", shown: icon("mdi-circle-off-outline") }],
  },
  {
    name: "Editar cobro por número de operación, datos",
    route: "listBankCxC",
    component: EditarCobroCliente,
    rows: { ver_cobro: [operation] },
    before: () => void (useBankStore().record = operation),
    prepare: (wrapper) => setState(wrapper, { tab: "ref2" }),
    controls: [{ name: "Actualizar", action: "MODIFICAR", shown: button("Actualizar") }],
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
