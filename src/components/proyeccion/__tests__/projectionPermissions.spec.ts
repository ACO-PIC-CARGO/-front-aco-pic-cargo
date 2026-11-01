import { describe, expect, test, vi } from "vitest";
import Swal from "sweetalert2";
import ProyeccionCxPComponent from "@/components/proyeccion/ProyeccionCxPComponent.vue";
import NuevaProyeccionCXPComponent from "@/components/proyeccion/NuevaProyeccionCXPComponent.vue";
import EditarProyeccionComponent from "@/components/proyeccion/EditarProyeccionComponent.vue";
import VerProyeccionComponent from "@/components/proyeccion/VerProyeccionComponent.vue";
import { actionsOf, button, controlsFor, icon, setState, shownControls } from "@/composables/__tests__/screenControls";
import type { ControlledScreen } from "@/composables/__tests__/screenControls";

vi.mock("@/api/http", () => ({ default: vi.fn() }));
vi.mock("@/router", () => ({ default: { push: vi.fn(), go: vi.fn() } }));
vi.mock("vue-router", () => ({
  useRouter: () => ({ push: vi.fn(), go: vi.fn() }),
  useRoute: () => ({ params: { id: "5" } }),
}));
vi.mock("sweetalert2", () => ({ default: { fire: vi.fn().mockResolvedValue({ isConfirmed: false }) } }));

const branchWithCurrency = () => sessionStorage.setItem("dataBranch", JSON.stringify([{ id: 7, moneda: [{ symbol: "S/" }] }]));
const pendingProjection = { id: 5, aprobadoflag: false, details: [] };
const dollar = { id: 2, symbol: "USD" };
const listed = { proyeccion_id: 5, proyeccion_aprobadoflag: false, proyeccion_estado: true };

const SCREENS: ControlledScreen[] = [
  {
    name: "Proyección de gastos",
    route: "lstProyeccionCXP",
    component: ProyeccionCxPComponent,
    rows: { list_proyeccion: [listed] },
    prepare: (wrapper) => setState(wrapper, { generarflag: true }),
    controls: [
      { name: "Generar", action: "NUEVO", shown: button("GENERAR") },
      { name: "Nueva", action: "NUEVO", shown: button("NUEVA") },
      { name: "Editar", action: "MODIFICAR", shown: icon("mdi-pencil") },
      { name: "Copiar", action: "COPIAR", shown: icon("mdi-content-copy") },
      { name: "Eliminar", action: "ELIMINAR", shown: icon("mdi-trash-can") },
    ],
  },
  {
    name: "Nueva proyección",
    route: "lstProyeccionCXP",
    component: NuevaProyeccionCXPComponent,
    before: branchWithCurrency,
    controls: [{ name: "Registrar", action: "NUEVO", shown: button("Registrar") }],
  },
  {
    name: "Editar proyección",
    route: "lstProyeccionCXP",
    component: EditarProyeccionComponent,
    before: branchWithCurrency,
    rows: { ver_proyeccion: [pendingProjection], getCoinsList: [dollar] },
    controls: [
      { name: "Guardar", action: "MODIFICAR", shown: button("Guardar") },
      { name: "Aprobar", action: "MODIFICAR", shown: button("APROBAR") },
    ],
  },
  {
    name: "Ver proyección",
    route: "lstProyeccionCXP",
    component: VerProyeccionComponent,
    before: branchWithCurrency,
    rows: { ver_proyeccion: [pendingProjection], getCoinsList: [dollar] },
    controls: [
      { name: "Ir a editar", action: "MODIFICAR", shown: button("Ir a Editar") },
      { name: "Aprobar", action: "MODIFICAR", shown: button("APROBAR") },
      { name: "Exportar", action: "EXPORTAR", shown: button("Exportar Detalles") },
    ],
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

test.each([
  [["VER", "MODIFICAR"], false],
  [["VER", "MODIFICAR", "COPIAR"], true],
])("saving an edited projection with %j offers to create a new one: %s", async (actions, offered) => {
  await shownControls(
    { name: "Editar proyección", route: "lstProyeccionCXP", component: EditarProyeccionComponent, before: branchWithCurrency, rows: { ver_proyeccion: [pendingProjection], getCoinsList: [dollar] }, controls: [] },
    actions,
  );
  vi.mocked(Swal.fire).mockClear();

  [...document.body.querySelectorAll("button")].find((candidate) => candidate.textContent?.trim() === "Guardar")!.click();

  expect(vi.mocked(Swal.fire).mock.calls[0]![0]).toMatchObject({ showDenyButton: offered });
});
