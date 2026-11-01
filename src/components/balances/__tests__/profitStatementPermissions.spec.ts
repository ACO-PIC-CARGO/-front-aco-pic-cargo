import { describe, expect, test, vi } from "vitest";
import BalanceGananciaComponent from "@/components/balances/BalanceGananciaComponent.vue";
import { actionsOf, button, controlsFor, icon, setState, shownControls } from "@/composables/__tests__/screenControls";
import type { ControlledScreen } from "@/composables/__tests__/screenControls";

vi.mock("@/api/http", () => ({ default: vi.fn() }));
vi.mock("@/router", () => ({ default: { push: vi.fn(), go: vi.fn(), resolve: vi.fn(() => ({ href: "" })) } }));
vi.mock("vue-router", () => ({ useRouter: () => ({ push: vi.fn(), resolve: vi.fn(() => ({ href: "" })) }), useRoute: () => ({ params: {} }) }));
vi.mock("sweetalert2", () => ({ default: { fire: vi.fn().mockResolvedValue({ isConfirmed: false }) } }));

const approvedProjection = { proyeccion_aprobada: [{ proyeccion_mes_anio: "10-2026" }] };
const editColumn = [{ title: "Editar", key: "editar" }];
const operativeIncome = { id: 1, isoperativo: true, editarflag: false };
const editableExpense = { id: 2, isoperativo: false, editarflag: true };
const filtered = (state: Record<string, unknown>) => (wrapper: Parameters<typeof setState>[0]) =>
  setState(wrapper, { headersDetailsGananciaFiltro: editColumn, headersDetailsGastosFiltro: editColumn, ...state, tab: "filtro" });
const incomeFilter = filtered({ tipofiltro: 1, itemsGananciaFiltro: [operativeIncome] });

const SCREENS: ControlledScreen[] = [
  {
    name: "Estado de ganancias",
    route: "lstEstadoGanancias",
    component: BalanceGananciaComponent,
    rows: approvedProjection,
    controls: [{ name: "Exportar", action: "EXPORTAR", shown: button("Exportar") }],
  },
  {
    name: "Estado de ganancias filtrado por ingresos",
    route: "lstEstadoGanancias",
    component: BalanceGananciaComponent,
    rows: approvedProjection,
    prepare: incomeFilter,
    controls: [{ name: "Editar ingreso", action: "MODIFICAR", shown: icon("mdi-pencil") }],
  },
  {
    name: "Estado de ganancias filtrado por gastos",
    route: "lstEstadoGanancias",
    component: BalanceGananciaComponent,
    rows: approvedProjection,
    prepare: filtered({ tipofiltro: 2, itemsGastosFiltro: [editableExpense] }),
    controls: [{ name: "Editar gasto", action: "MODIFICAR", shown: icon("mdi-pencil") }],
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

test("an operative income keeps a link to open it when the role may not edit", async () => {
  const opens = { name: "Ver", action: "VER", shown: icon("mdi-eye") };

  const shown = await shownControls(
    { name: "Ingresos", route: "lstEstadoGanancias", component: BalanceGananciaComponent, rows: approvedProjection, prepare: incomeFilter, controls: [opens] },
    ["VER"],
  );

  expect(shown).toEqual(["Ver"]);
});
