import { beforeEach, expect, test, vi } from "vitest";
import { flushPromises, mount } from "@vue/test-utils";
import { createPinia } from "pinia";
import { createVuetify } from "vuetify";
import * as components from "vuetify/components";
import * as directives from "vuetify/directives";
import GeneratedQuoteDialog from "../GeneratedQuoteDialog.vue";
import { listPendingCotizacionAvisos, markCotizacionAvisoVisto } from "../quoteNotificationApi";
import type { CotizacionAvisoPendiente } from "../quoteNotificationApi";

vi.mock("../quoteNotificationApi", () => ({ listPendingCotizacionAvisos: vi.fn(), markCotizacionAvisoVisto: vi.fn() }));
vi.mock("vue-router", async (importOriginal) => ({
  ...(await importOriginal<typeof import("vue-router")>()),
  useRoute: () => ({ name: "home" }),
  useRouter: () => ({ resolve: () => ({ href: "/verQuote/7" }) }),
}));

const aviso = (codigo: string, extra: Partial<CotizacionAvisoPendiente> = {}): CotizacionAvisoPendiente => ({
  codigo, fuente: "bot", id_branch: 1, id_cotizacion: 7, nro_cotizacion: `${codigo.slice(3)}-P`, cliente: "Cliente",
  telefono: "999", puerto_origen: null, tipo: "LCL", contenedor: null, cantidad_contenedor: null, volumen: "0.54",
  peso: "550", valor_mercancia: "3100", tieneindividualflag: true, tienegrupalflag: false,
  fecha_registro: "2026-11-17 12:07:00", ...extra,
});

beforeEach(() => {
  sessionStorage.setItem("dataUser", JSON.stringify([{ id: 4, id_branch: 1, position_code: ["08"] }]));
  vi.mocked(markCotizacionAvisoVisto).mockReset().mockResolvedValue();
  vi.spyOn(window, "open").mockReturnValue(null);
});

async function render() {
  const socket = { on: vi.fn(), off: vi.fn() };
  const w = mount(GeneratedQuoteDialog, {
    props: { socket },
    global: { plugins: [createVuetify({ components, directives }), createPinia()] },
    attachTo: document.body,
  });
  await flushPromises();
  return w;
}

test("FCL shows the container and quantity instead of weight and volume, with the date beside the number", async () => {
  vi.mocked(listPendingCotizacionAvisos).mockResolvedValue([
    aviso("CA-015682", { tipo: "FCL", contenedor: "40S", cantidad_contenedor: 1, peso: "0", volumen: "0" }),
    aviso("CA-015683"),
  ]);
  const w = await render();
  const [fcl, lcl] = [...document.querySelectorAll<HTMLElement>(".generated-quote__item")];

  expect(fcl!.textContent).toContain("40S x 1");
  expect(fcl!.textContent).not.toContain("kg");
  // fecha y hora a la derecha del número, centrada y en dos líneas
  const hora = fcl!.querySelector(".generated-quote__cell--main > .generated-quote__time .generated-quote__timetext")!;
  expect([...hora.children].map((linea) => linea.textContent)).toEqual(["17/NOV/2026", "12:07"]);
  expect(lcl!.textContent).toContain("550 kg");
  w.unmount();
});

test("VER keeps the quote in the list, disabled, and saves it as seen", async () => {
  vi.mocked(listPendingCotizacionAvisos).mockResolvedValue([aviso("CA-015690"), aviso("CA-015691")]);
  const w = await render();
  const fila = () => document.querySelectorAll<HTMLElement>(".generated-quote__item")[0]!;

  fila().querySelector<HTMLButtonElement>(".generated-quote__primary")!.click();
  await flushPromises();

  expect(document.querySelectorAll(".generated-quote__item")).toHaveLength(2);
  expect(fila().classList).toContain("generated-quote__item--visto");
  expect(fila().querySelector<HTMLButtonElement>(".generated-quote__primary")!.disabled).toBe(true);
  expect(markCotizacionAvisoVisto).toHaveBeenCalledWith("CA-015690");
  expect(document.querySelector(".generated-quote__count")!.textContent!.trim()).toBe("1");
  w.unmount();
});

test("calculator: tipo FCL hides weight and volume even without a container; Aéreo keeps them", async () => {
  vi.mocked(listPendingCotizacionAvisos).mockResolvedValue([
    aviso("CA-000100", { fuente: "calculadora", tipo: "FCL", peso: "550", volumen: "0.54" }),
    aviso("CA-000101", { fuente: "calculadora", tipo: "Aéreo", peso: "80", volumen: "0.2" }),
  ]);
  const w = await render();
  const [fcl, aereo] = [...document.querySelectorAll<HTMLElement>(".generated-quote__item")];

  expect(fcl!.textContent).toContain("FCL");
  expect(fcl!.textContent).not.toContain("kg");
  expect(fcl!.textContent).not.toContain("m³");
  expect(aereo!.textContent).toContain("80 kg");
  expect(aereo!.querySelector(".generated-quote__type--aereo")).not.toBeNull();
  w.unmount();
});
