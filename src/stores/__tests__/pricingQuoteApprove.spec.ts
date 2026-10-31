import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { createPinia, setActivePinia } from "pinia";
import Swal from "sweetalert2";
import { useControlGastosStore } from "@/stores/controlGastos";
import { useHousesStore } from "@/stores/houses";
import { usePricingStore } from "@/stores/pricing";
import { APPROVE_FAILED_MESSAGE } from "@/utils/quoteApproval";
import { accepted, httpMock, respond } from "./catalogHttp";

vi.mock("@/api/http", () => ({ default: Object.assign(vi.fn(), { post: vi.fn() }) }));
vi.mock("@/router", () => ({ default: { push: vi.fn(), currentRoute: { value: { params: {} } } } }));
vi.mock("sweetalert2", () => ({ default: { fire: vi.fn(), showLoading: vi.fn(), close: vi.fn() } }));

let guardarCarpetaHouse: ReturnType<typeof vi.spyOn>;
beforeEach(() => {
  setActivePinia(createPinia());
  vi.clearAllMocks();
  sessionStorage.clear();
  sessionStorage.setItem("dataUser", JSON.stringify([{ id: 4, id_branch: 1 }]));
  vi.mocked(Swal.fire).mockResolvedValue({ isConfirmed: false } as never);
  guardarCarpetaHouse = vi.spyOn(useHousesStore(), "guardarCarpetaHouse").mockResolvedValue(undefined);
  vi.spyOn(useControlGastosStore(), "imprimirGuardarControlDetallado").mockResolvedValue(undefined);
});
afterEach(() => vi.restoreAllMocks());

test("an approval the server refuses replaces the waiting dialog with its reason and reports it failed", async () => {
  respond({ aprobar_cotizacion: { estadoflag: false, mensaje: "La cotización ya está aprobada.", tipomensaje: "TMSGINF", data: [] } });

  expect(await usePricingStore().aprobarCotizacion({ IdempotencyKey: "k1", nuevoexpediente: true })).toBe(false);

  expect(Swal.fire).toHaveBeenCalledWith(expect.objectContaining({ icon: "error", text: "La cotización ya está aprobada." }));
  expect(guardarCarpetaHouse).not.toHaveBeenCalled();
});

test("an approval that never reaches the server says what to do", async () => {
  httpMock.mockRejectedValue(new Error("Network Error"));

  expect(await usePricingStore().aprobarCotizacion({ IdempotencyKey: "k2", nuevoexpediente: true })).toBe(false);

  expect(Swal.fire).toHaveBeenCalledWith(expect.objectContaining({ icon: "error", text: APPROVE_FAILED_MESSAGE }));
});

test("an approval the server accepts reports it succeeded", async () => {
  respond({ aprobar_cotizacion: accepted([{ id_master: 900, code_master: "M-900" }]) });
  usePricingStore().datosPrincipales = { nombre: "ZEVALLOS" };

  expect(await usePricingStore().aprobarCotizacion({ IdempotencyKey: "k3", nuevoexpediente: true })).toBe(true);
});

test("the instructivo PDF names its quote so the server files it in the quote's folder", async () => {
  vi.spyOn(window, "open").mockImplementation(() => null);
  sessionStorage.setItem("dataBranch", JSON.stringify([{ id: 1, trade_name: "PIC LOGISTICA SAC" }]));
  const post = vi.mocked((await import("@/api/http")).default.post as unknown as (...args: unknown[]) => Promise<unknown>);
  post.mockResolvedValue({ data: { estadoflag: true, path: "files/x/instructivo.pdf" } });
  const pricing = usePricingStore();
  pricing.id = 77;
  pricing.aprobadoflag = true;
  pricing.listInstructivo = [{ notas: [] }];
  pricing.listIngresosInstructivo = [{ nro_propuesta: 1, opcion: [] }];
  pricing.listCostosInstructivo = [{ nro_propuesta: 1, opcion: [] }];
  pricing.listImpuestosInstructivo = [{ nro_propuesta: 1, opcion: [] }];

  await pricing.imprimirInstructivoQuote({ nro_propuesta: 1 });

  expect(post.mock.calls[0]![1]).toMatchObject({ id_quote: 77 });
});

test("the manual instructivo PDF names its quote so the server files it in the quote's folder", async () => {
  respond({ quote_preview_instructivo_manual: { estadoflag: true, path: "files/x/manual.pdf" } });
  const pricing = usePricingStore();
  pricing.id = 77;

  await pricing.quotePreviewInstructivoManual({ guardarFlag: true });

  expect(httpMock.mock.calls[0]![0].data).toMatchObject({ id_quote: 77, guardarFlag: true });
});
