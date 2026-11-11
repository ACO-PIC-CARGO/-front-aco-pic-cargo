import { beforeEach, expect, test, vi } from "vitest";
import { defineComponent } from "vue";
import { mount } from "@vue/test-utils";
import {
  GENERATED_QUOTE_ROLES,
  availableModalities,
  formatQuoteValue,
  formatQuoteVolume,
  formatQuoteWeight,
  generatedQuoteLocation,
  useGeneratedQuoteNotices,
} from "../useGeneratedQuoteNotices";
import type { GeneratedQuotePayload } from "../useGeneratedQuoteNotices";

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

beforeEach(() => loginWith(["08"]));

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
