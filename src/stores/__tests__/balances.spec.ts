import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { createPinia, setActivePinia } from "pinia";
import Swal from "sweetalert2";
import { useBalancesStore } from "@/stores/balances";
import { JSON_HEADERS, URL_MAIN, httpMock } from "./catalogHttp";

vi.mock("@/api/http", () => ({ default: vi.fn() }));
vi.mock("sweetalert2", () => ({ default: { fire: vi.fn() } }));

type Balances = ReturnType<typeof useBalancesStore>;
type Loader = (store: Balances) => Promise<void>;

const mesAnio = { year: 2026, month: 3 };
const ganancia = { ...mesAnio, tipoingreso: 1, tiposubingreso: 2, nro_expediente: "E-1", monto: 50 };
const gastos = { ...mesAnio, tipogastos: 4, tiposubgastos: 5, proveedor: 6, monto: 70 };

const loaders: [string, keyof Balances, string, Loader][] = [
  ["getCargarTipoIngreso", "tipoingreso", "cargar_tipo_ingreso?id_branch=7", (s) => s.getCargarTipoIngreso()],
  ["getCargarTipoSubIngreso", "tiposubingreso", "cargar_tipo_subingreso?id_branch=7", (s) => s.getCargarTipoSubIngreso()],
  ["getCargarTipoGastos", "tipogastos", "cargar_tipo_gastos?id_branch=7", (s) => s.getCargarTipoGastos()],
  ["getCargarTipoSubGastos", "tiposubgastos", "cargar_tipo_subgastos?id_branch=7", (s) => s.getCargarTipoSubGastos()],
  ["getArbolGastos", "arbolGastos", "arbol_gastos?id_branch=7", (s) => s.getArbolGastos()],
  ["getArbolIngresos", "arbolIngreso", "arbol_ingresos?id_branch=7", (s) => s.getArbolIngresos()],
  ["getComparativo", "comparativo", "generar_comparativo?id_branch=7&month=3&year=2026", (s) => s.getComparativo(mesAnio)],
  [
    "getListBalanaceGanancia",
    "listaGanancia",
    "detalle_ganancia?year=2026&month=3&tipoingreso=1&tiposubingreso=2&nro_expediente=E-1&monto=50",
    (s) => s.getListBalanaceGanancia(ganancia),
  ],
  [
    "getListBalanaceGananciaFiltro",
    "listaGananciaFiltro",
    "detalle_ganancia?year=2026&month=3&tipoingreso=1&tiposubingreso=2&nro_expediente=E-1&monto=50",
    (s) => s.getListBalanaceGananciaFiltro(ganancia),
  ],
  ["getResumenBalanaceGanancia", "resumenGanancia", "resumen_ganancia?year=2026&month=3", (s) => s.getResumenBalanaceGanancia(mesAnio)],
  [
    "getListBalanaceGastos",
    "listaGastos",
    "detalle_gastos?year=2026&month=3&tipogastos=4&tiposubgastos=5&proveedor=6&monto=70",
    (s) => s.getListBalanaceGastos(gastos),
  ],
  [
    "getListBalanaceGastosFiltro",
    "listaGastosFiltro",
    "detalle_gastos?year=2026&month=3&tipogastos=4&tiposubgastos=5&proveedor=6&monto=70",
    (s) => s.getListBalanaceGastosFiltro(gastos),
  ],
  ["getResumenBalanaceGastos", "resumenGastos", "resumen_gastos?year=2026&month=3", (s) => s.getResumenBalanaceGastos(mesAnio)],
  [
    "getResumenGastosxTipoGasto",
    "resumenTipoGasto",
    "resumen_gastos_tipogasto?year=2026&month=3",
    (s) => s.getResumenGastosxTipoGasto(mesAnio),
  ],
  [
    "resumenIngresoTipoIngreso",
    "resumenTipoIngreso",
    "resumen_ingreso_tipo?year=2026&month=3",
    (s) => s.resumenIngresoTipoIngreso(mesAnio),
  ],
  [
    "getFlujoPrePostMes",
    "flujoprepostmes",
    "flujo_gasto_pre_post_mes?id_branch=7&month=3&year=2026&ingresosflag=1&gastoflag=&anteriorflag=&posterioflag=&mes=&anio=&expediente=E-2&id_persona=&monto=",
    (s) => s.getFlujoPrePostMes({ ...mesAnio, ingresosflag: 1, expediente: "E-2" }),
  ],
  [
    "getListFlujoOperacionMes",
    "lstFlujoOperacionesMes",
    "flujo_dinero_por_mes?id_branch=7&cantidadmes=6&id_proveedor=&id_cliente=9&nro_expediente=",
    (s) => s.getListFlujoOperacionMes({ cantidadmes: 6, id_cliente: 9 }),
  ],
];

const answer = (estado: boolean, data: unknown) => ({ estado, mensaje: "Sin datos", data });

describe("balances store", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();
    sessionStorage.setItem("dataUser", JSON.stringify([{ id: 4, id_branch: 7 }]));
    vi.spyOn(console, "error").mockImplementation(() => {});
  });
  afterEach(() => vi.restoreAllMocks());

  test.each(loaders)("%s asks for the exact URL and keeps the rows the backend accepts", async (_, state, path, load) => {
    httpMock.mockResolvedValue({ data: answer(true, [{ id: 1 }]) });
    const store = useBalancesStore();

    await load(store);

    expect(httpMock).toHaveBeenCalledWith({
      method: "get",
      url: URL_MAIN + path,
      headers: JSON_HEADERS,
    });
    expect(store[state]).toEqual([{ id: 1 }]);
    expect(Swal.fire).not.toHaveBeenCalled();
  });

  test.each(loaders)("%s empties the list and shows the message when the backend rejects", async (_, state, __, load) => {
    httpMock.mockResolvedValue({ data: answer(false, []) });
    const store = useBalancesStore();
    (store[state] as unknown[]) = [{ id: 9 }];

    await load(store);

    expect(store[state]).toEqual([]);
    expect(Swal.fire).toHaveBeenCalledWith({ icon: "error", text: "Sin datos" });
  });

  test.each(loaders)("%s keeps the list when the request fails", async (_, state, __, load) => {
    httpMock.mockRejectedValue(new Error("network"));
    const store = useBalancesStore();
    (store[state] as unknown[]) = [{ id: 9 }];

    await load(store);

    expect(store[state]).toEqual([{ id: 9 }]);
    expect(Swal.fire).not.toHaveBeenCalled();
  });

  test("exportarBalanceGanancia downloads the blob as an xlsx file", async () => {
    httpMock.mockResolvedValue({ data: "bytes" });
    const createObjectURL = vi.fn(() => "blob:x");
    Object.assign(window.URL, { createObjectURL });
    const click = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});
    const store = useBalancesStore();

    await store.exportarBalanceGanancia(mesAnio);

    expect(httpMock).toHaveBeenCalledWith({
      method: "get",
      url: URL_MAIN + "excel_reporte?year=2026&month=3",
      responseType: "blob",
      headers: JSON_HEADERS,
    });
    expect(click).toHaveBeenCalled();
    const link = document.body.lastElementChild as HTMLAnchorElement;
    expect(link.getAttribute("download")).toMatch(/^\d+\.xlsx$/);
  });
});
