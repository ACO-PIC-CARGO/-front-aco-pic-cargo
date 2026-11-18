import { beforeEach, expect, test, vi } from "vitest";
import { defineComponent } from "vue";
import { flushPromises, mount } from "@vue/test-utils";
import { listPendingCotizacionAvisos, markCotizacionAvisoVisto } from "../quoteNotificationApi";
import type { CotizacionAvisoPendiente } from "../quoteNotificationApi";
import {
  GENERATED_QUOTE_ROLES,
  ATTENDED_EVENT,
  RECONNECT_EVENT,
  availableModalities,
  formatQuoteContainer,
  formatQuoteDate,
  quoteDateParts,
  formatQuoteValue,
  formatQuoteVolume,
  formatQuoteWeight,
  generatedQuoteLocation,
  useGeneratedQuoteNotices,
} from "../useGeneratedQuoteNotices";
import type { GeneratedQuotePayload } from "../useGeneratedQuoteNotices";

// avisos guardados en BD (los que llegaron sin sesión o con la pestaña cerrada)
vi.mock("../quoteNotificationApi", () => ({
  listPendingCotizacionAvisos: vi.fn(),
  markCotizacionAvisoVisto: vi.fn(),
}));
const pendientes = vi.mocked(listPendingCotizacionAvisos);
const marcarVisto = vi.mocked(markCotizacionAvisoVisto);
const guardado = (codigo: string, extra: Partial<CotizacionAvisoPendiente> = {}): CotizacionAvisoPendiente => ({
  codigo, fuente: "bot", id_branch: 1, id_cotizacion: 7, nro_cotizacion: `${codigo}-P`, cliente: "Cliente", telefono: null,
  puerto_origen: null, tipo: "LCL", contenedor: null, cantidad_contenedor: null, volumen: null, peso: null,
  valor_mercancia: null, tieneindividualflag: true, tienegrupalflag: false, fecha_registro: "2026-11-17 11:21:00", ...extra,
});

type Listener = (payload: GeneratedQuotePayload) => void;

function setup() {
  const handlers: Record<string, Listener> = {};
  const socket = { on: vi.fn((event: string, listener: Listener) => { handlers[event] = listener; }), off: vi.fn() };
  let inbox!: ReturnType<typeof useGeneratedQuoteNotices>;
  mount(defineComponent({ setup() { inbox = useGeneratedQuoteNotices(socket); return () => null; } }));
  return { handlers, inbox };
}

function loginWith(positions: string[]) {
  sessionStorage.setItem("dataUser", JSON.stringify([{ id: 4, id_branch: 1, position_code: positions }]));
}

beforeEach(() => {
  loginWith(["08"]);
  pendientes.mockReset().mockResolvedValue([]);
  marcarVisto.mockReset().mockResolvedValue();
});

test.each(GENERATED_QUOTE_ROLES)("el cargo %s recibe los avisos del bot y de la calculadora", (code) => {
  loginWith([code]);
  const { handlers, inbox } = setup();

  handlers["cotizacion-bot"]!({ id_branch: "1", nro_cotizacion: "15560-P" });
  expect(inbox.current.value).toMatchObject({ source: "bot", nro_cotizacion: "15560-P" });
  inbox.dismiss();

  handlers["cotizacion-calculadora"]!({ id_branch: 1, nro_cotizacion: "15561-P" });
  expect(inbox.current.value).toMatchObject({ source: "calculadora", nro_cotizacion: "15561-P" });
});

test.each([1, 22])("el usuario %s recibe el aviso aunque su cargo no sea 08 ni 10", (idUser) => {
  sessionStorage.setItem("dataUser", JSON.stringify([{ id: 4, id_user: idUser, id_branch: 1, position_code: ["01"] }]));
  const { handlers, inbox } = setup();
  handlers["cotizacion-bot"]!({ id_branch: 1, nro_cotizacion: "U" });
  expect(inbox.current.value).toMatchObject({ nro_cotizacion: "U" });
});

test("otros cargos o sucursales no reciben el aviso", () => {
  loginWith(["01"]);
  const { handlers, inbox } = setup();
  handlers["cotizacion-bot"]!({ id_branch: 1, nro_cotizacion: "A" });
  expect(inbox.current.value).toBeNull();

  loginWith(["10"]);
  handlers["cotizacion-bot"]!({ id_branch: 2, nro_cotizacion: "B" });
  expect(inbox.current.value).toBeNull();
});

test("los avisos se muestran de uno en uno", () => {
  const { handlers, inbox } = setup();
  handlers["cotizacion-bot"]!({ id_branch: 1, nro_cotizacion: "A" });
  handlers["cotizacion-bot"]!({ id_branch: 1, nro_cotizacion: "B" });

  expect(inbox.current.value?.nro_cotizacion).toBe("A");
  inbox.dismiss();
  expect(inbox.current.value?.nro_cotizacion).toBe("B");
});

const calc = { source: "calculadora", id_branch: 1, nro_cotizacion: "A" } as const;
const bot = { source: "bot", id_branch: 1, nro_cotizacion: "A" } as const;

test("sin banderas una cotización de calculadora deja elegir individual o grupal", () => {
  expect(availableModalities(calc)).toEqual(["individual", "grupal"]);
});

test.each([
  [{ tieneindividualflag: true, tienegrupalflag: true }, ["individual", "grupal"]],
  [{ tieneindividualflag: 1, tienegrupalflag: 0 }, ["individual"]],
  [{ tieneindividualflag: false, tienegrupalflag: "1" }, ["grupal"]],
])("las modalidades de la calculadora siguen las banderas %j", (flags, expected) => {
  expect(availableModalities({ ...calc, ...flags })).toEqual(expected);
});

test("el bot no ofrece elegir modalidad aunque traiga banderas", () => {
  expect(availableModalities({ ...bot, tieneindividualflag: true, tienegrupalflag: true })).toEqual(["individual"]);
});

test("el bot lleva directo al verQuote", () => {
  expect(generatedQuoteLocation({ ...bot, id_cotizacion: 7 }, "individual")).toEqual({
    name: "verQuote",
    params: { id: 7 },
  });
});

test.each([
  ["individual", { individualflag: 1, esgrupalflag: 0 }],
  ["grupal", { individualflag: 0, esgrupalflag: 1 }],
] as const)("la calculadora abre el ver de calculadora en modalidad %s", (modality, flags) => {
  expect(generatedQuoteLocation({ ...calc, id_cotizacion: 9 }, modality)).toEqual({
    name: "VerCotizacionCalculadora",
    query: { id: 9, ...flags },
  });
});

test("sin id de cotización no hay a dónde ir", () => {
  expect(generatedQuoteLocation({ ...bot }, "individual")).toBeNull();
});

test("el aviso conserva volumen, peso y valor de mercancía del socket", () => {
  const { handlers, inbox } = setup();
  handlers["cotizacion-calculadora"]!({ id_branch: 1, nro_cotizacion: "A", volumen: "4.4", peso: 610, valor_mercancia: "4350" });
  expect(inbox.current.value).toMatchObject({ volumen: "4.4", peso: 610, valor_mercancia: "4350" });
});

test("valor, peso y volumen se muestran con su unidad", () => {
  expect(formatQuoteValue("4350")).toBe("USD 4,350");
  expect(formatQuoteValue(1234.5)).toBe("USD 1,234.5");
  expect(formatQuoteWeight(610)).toBe("610 kg");
  expect(formatQuoteVolume("4.4")).toBe("4.40 m³");
});

test.each([undefined, null, "", "  "])("sin dato (%j) no se muestra la fila", (value) => {
  expect(formatQuoteValue(value)).toBeNull();
  expect(formatQuoteWeight(value)).toBeNull();
  expect(formatQuoteVolume(value)).toBeNull();
});

test("los avisos de bot y calculadora se juntan en una sola lista y cada uno se quita por separado", () => {
  const { handlers, inbox } = setup();
  handlers["cotizacion-bot"]!({ id_branch: 1, nro_cotizacion: "A" });
  handlers["cotizacion-calculadora"]!({ id_branch: 1, nro_cotizacion: "B" });
  handlers["cotizacion-bot"]!({ id_branch: 1, nro_cotizacion: "C" });
  expect(inbox.notices.value.map((n) => `${n.source}:${n.nro_cotizacion}`)).toEqual(["bot:A", "calculadora:B", "bot:C"]);

  inbox.dismiss(inbox.notices.value[1]);
  expect(inbox.notices.value.map((n) => n.nro_cotizacion)).toEqual(["A", "C"]);

  inbox.dismissAll((n) => n.source === "bot");
  expect(inbox.current.value).toBeNull();
});

test("cancelar descarta todos los avisos pendientes", () => {
  const { handlers, inbox } = setup();
  handlers["cotizacion-bot"]!({ id_branch: 1, nro_cotizacion: "A" });
  handlers["cotizacion-calculadora"]!({ id_branch: 1, nro_cotizacion: "B" });
  inbox.dismissAll();
  expect(inbox.notices.value).toEqual([]);
});

test("al abrir carga los avisos que el usuario no vio, solo de su sucursal", async () => {
  pendientes.mockResolvedValue([guardado("CA-000001"), guardado("CA-000002", { id_branch: 2 })]);
  const { inbox } = setup();
  await flushPromises();
  expect(inbox.notices.value.map((n) => n.codigo)).toEqual(["CA-000001"]);
  expect(inbox.current.value).toMatchObject({ source: "bot", fecha_registro: "2026-11-17 11:21:00" });
});

test("un cargo que no ve avisos ni siquiera los pide", async () => {
  loginWith(["01"]);
  setup();
  await flushPromises();
  expect(pendientes).not.toHaveBeenCalled();
});

test("al reconectarse vuelve a pedirlos sin duplicar los que ya llegaron por socket", async () => {
  const { handlers, inbox } = setup();
  await flushPromises();
  handlers["cotizacion-bot"]!({ id_branch: 1, nro_cotizacion: "CA-000003-P", codigo: "CA-000003" });
  pendientes.mockResolvedValue([guardado("CA-000003"), guardado("CA-000004")]);

  (handlers[RECONNECT_EVENT] as unknown as () => void)();
  await flushPromises();
  expect(inbox.notices.value.map((n) => n.codigo)).toEqual(["CA-000003", "CA-000004"]);
});

test("VER deja el aviso visto: sigue en la lista, deshabilitado, y se guarda por su código", async () => {
  pendientes.mockResolvedValue([guardado("CA-000005"), guardado("CA-000006")]);
  const { inbox } = setup();
  await flushPromises();
  const [primero] = inbox.notices.value;

  inbox.markSeen(primero!);
  inbox.markSeen(primero!);

  expect(inbox.notices.value).toHaveLength(2);
  expect(inbox.isSeen(primero!)).toBe(true);
  expect(inbox.pendingCount.value).toBe(1);
  expect(marcarVisto).toHaveBeenCalledTimes(1);
  expect(marcarVisto).toHaveBeenCalledWith("CA-000005");
});

test("FCL muestra contenedor y cantidad (1 si no viene)", () => {
  expect(formatQuoteContainer({ contenedor: "40s", cantidad_contenedor: 2 })).toBe("40S x 2");
  expect(formatQuoteContainer({ contenedor: "20S", cantidad_contenedor: null })).toBe("20S x 1");
  expect(formatQuoteContainer({ contenedor: null, cantidad_contenedor: 3 })).toBeNull();
});

test("la fecha y hora del aviso usan el formato de FormatFecha", () => {
  expect(formatQuoteDate("2026-11-17 11:21:00")).toBe("17/NOV/2026 11:21 a. m.");
  expect(formatQuoteDate("2026-11-17 00:05:00")).toBe("17/NOV/2026 12:05 a. m.");
  expect(formatQuoteDate("2026-11-17 12:07:00")).toBe("17/NOV/2026 12:07 p. m.");
  expect(formatQuoteDate(null)).toBeNull();
});

test("en la lista la fecha y la hora van en dos líneas", () => {
  expect(quoteDateParts("2026-11-11 09:25:00")).toEqual({ fecha: "11/NOV/2026", hora: "09:25" });
  expect(quoteDateParts("2026-11-11")).toEqual({ fecha: "11/NOV/2026", hora: null });
  expect(quoteDateParts(null)).toBeNull();
});

test("si otro usuario actualiza la cotización o la envía a pricing, el aviso sale de la lista", async () => {
  pendientes.mockResolvedValue([guardado("CA-000007"), guardado("CA-000008")]);
  const { handlers, inbox } = setup();
  await flushPromises();

  handlers[ATTENDED_EVENT]!({ id_branch: 1, nro_cotizacion: "", codigo: "CA-000007" });
  expect(inbox.notices.value.map((n) => n.codigo)).toEqual(["CA-000008"]);

  handlers[ATTENDED_EVENT]!({ id_branch: 1, nro_cotizacion: "", codigo: "CA-000008" });
  expect(inbox.current.value).toBeNull();
});
