import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { flushPromises, mount } from "@vue/test-utils";
import type { VueWrapper } from "@vue/test-utils";
import { createPinia, setActivePinia } from "pinia";
import { createVuetify } from "vuetify";
import * as components from "vuetify/components";
import * as directives from "vuetify/directives";
import { VSelect } from "vuetify/components";
import Swal from "sweetalert2";
import HouseArrivalNoticeDialog from "@/components/HouseFile/HouseArrivalNoticeDialog.vue";
import { accepted, httpMock, rejected, respond } from "@/stores/__tests__/catalogHttp";

vi.mock("@/api/http", () => ({ default: vi.fn() }));
vi.mock("sweetalert2", () => ({ default: { fire: vi.fn() } }));
globalThis.ResizeObserver ??= class {
  observe() {}
  unobserve() {}
  disconnect() {}
};
Object.defineProperty(window, "visualViewport", {
  value: { width: 1024, height: 768, addEventListener() {}, removeEventListener() {} },
  configurable: true,
});

const SMTP_MISSING = "El envío de correos no está configurado. Pide a tu administrador que configure el servidor de correo e intenta de nuevo.";
const PREVIEW = {
  html: "<p>Hola CLIENTE, su carga llegó</p>",
  email: "cliente@example.com",
  asunto: "PIC LOGISTICA SAC – Aviso de Llegada",
  remitente: "PIC LOGISTICA SAC",
  responder_a: "director@pic-cargo.com",
};
const ACCOUNTS = [
  { id: 4, label: "USD-BCP", cuenta: "123", cci: "0021", symbol: "USD", esavisollegada: true },
  { id: 9, label: "PEN-BBVA", cuenta: "456", cci: "0099", symbol: "PEN", esavisollegada: true },
  { id: 12, label: "USD-CAJA EFECTIVO", cuenta: "EFECTIVO (USD)", cci: null, symbol: "USD", esavisollegada: false },
];
let wrapper: VueWrapper | undefined;

beforeEach(() => {
  vi.clearAllMocks();
  sessionStorage.setItem("dataUser", JSON.stringify([{ id_branch: 22 }]));
});
afterEach(() => wrapper?.unmount());

async function openDialog(sendAnswer: unknown, props: Record<string, unknown> = {}, previewAnswer: unknown = accepted([PREVIEW])) {
  respond({ getListBanksDetailsCargar: accepted(ACCOUNTS), previewNotificacionHouse: previewAnswer, sendNotificacionHouse: sendAnswer });
  const pinia = createPinia();
  setActivePinia(pinia);
  wrapper = mount(HouseArrivalNoticeDialog, {
    props: { modelValue: true, houseId: 31, modality: "Importación", ...props },
    global: { plugins: [createVuetify({ components, directives }), pinia] },
    attachTo: document.body,
  });
  await flushPromises();
}

const chooseNotice = async (title: string) => {
  wrapper!.findComponent(VSelect).vm.$emit("update:modelValue", title);
  await flushPromises();
};

const tickAccount = async (label: string) => {
  const box = [...document.body.querySelectorAll<HTMLInputElement>("input[type=checkbox]")].find((input) =>
    input.closest(".notice-row")?.textContent?.includes(label),
  )!;
  box.click();
  await flushPromises();
};

const clickButton = async (text: string) => {
  [...document.body.querySelectorAll<HTMLButtonElement>("button")].find((button) => button.textContent?.includes(text))!.click();
  await flushPromises();
};
const showPreview = () => clickButton("Vista previa");
// Sending is only offered from the preview.
const send = async () => {
  await showPreview();
  await clickButton("Enviar Aviso");
};

const requestsTo = (endpoint: string) =>
  httpMock.mock.calls.map(([config]) => config).filter((config) => String(config.url).endsWith(endpoint));

const sentRequests = () =>
  httpMock.mock.calls.map(([config]) => config).filter((config) => String(config.url).endsWith("sendNotificacionHouse"));

test("sends the chosen notice with the chosen accounts and confirms what the server sent", async () => {
  await openDialog({ ...accepted([]), mensaje: "Enviamos el aviso a cliente@example.com." });
  await chooseNotice("Aviso de Llegada");
  await tickAccount("PEN-BBVA");
  await send();

  expect(sentRequests()[0]).toMatchObject({
    data: { id: 31, notificacion: { id: null, title: "Aviso de Llegada" }, cuentasBancarias: [9], fecha: null },
  });
  expect(vi.mocked(Swal.fire).mock.calls[0]![0]).toMatchObject({ icon: "success", titleText: "Enviamos el aviso a cliente@example.com." });
  expect(wrapper!.emitted("update:modelValue")).toEqual([[false]]);
});

test("stays open and shows why when the notice was not sent", async () => {
  await openDialog({ ...rejected(SMTP_MISSING), tipomensaje: "TMSGADV" });
  await chooseNotice("Aviso de Llegada");
  await tickAccount("USD-BCP");
  await send();

  expect(document.body.textContent).toContain(SMTP_MISSING);
  expect(Swal.fire).not.toHaveBeenCalled();
  expect(wrapper!.emitted("update:modelValue")).toBeUndefined();
});

test("shows the email the client will receive before sending it", async () => {
  await openDialog(accepted([]));
  await chooseNotice("Aviso de Llegada");
  await tickAccount("PEN-BBVA");
  await showPreview();

  expect(requestsTo("previewNotificacionHouse")[0]).toMatchObject({
    data: { id: 31, notificacion: { id: null, title: "Aviso de Llegada" }, cuentasBancarias: [9] },
  });
  expect(document.body.textContent).toContain("PIC LOGISTICA SAC – Aviso de Llegada");
  expect(document.body.textContent).toContain("director@pic-cargo.com");
  expect(document.body.querySelector("iframe")!.getAttribute("srcdoc")).toBe(PREVIEW.html);
  expect(sentRequests()).toHaveLength(0);
});

test("goes back to the accounts from the preview without sending", async () => {
  await openDialog(accepted([]), { notice: { id: 21, title: "Aviso de Salida" } });
  await tickAccount("USD-BCP");
  await showPreview();
  await clickButton("Volver");

  expect(document.body.querySelector("iframe")).toBeNull();
  expect(document.body.textContent).toContain("1 cuenta seleccionada");
  expect(sentRequests()).toHaveLength(0);
});

test("explains why the preview could not be built", async () => {
  await openDialog(accepted([]), { notice: { id: 21, title: "Aviso de Salida" } }, rejected("El cliente de este house no tiene correo."));
  await tickAccount("USD-BCP");
  await showPreview();

  expect(document.body.textContent).toContain("El cliente de este house no tiene correo.");
  expect(document.body.querySelector("iframe")).toBeNull();
});

test("asks for a notice and an account before the preview", async () => {
  await openDialog(accepted([]));
  await showPreview();
  expect(document.body.textContent).toContain("Elige el aviso y al menos una cuenta bancaria.");
  expect(requestsTo("previewNotificacionHouse")).toHaveLength(0);
});

test("sends the notice picked in the house notice list with its date and tells the screen it went out", async () => {
  const fecha = "2026-11-05T15:30:00.000Z";
  await openDialog(accepted([]), { notice: { id: 21, title: "Aviso de Salida" }, fecha });
  await tickAccount("USD-BCP");
  await send();

  expect(sentRequests()[0]).toMatchObject({
    data: { id: 31, notificacion: { id: 21, title: "Aviso de Salida" }, cuentasBancarias: [4], fecha },
  });
  expect(wrapper!.emitted("sent")).toHaveLength(1);
});

test("offers only the accounts flagged for arrival notices and narrows them with the search", async () => {
  await openDialog(accepted([]), { notice: { id: 21, title: "Aviso de Salida" } });
  const rows = () => [...document.body.querySelectorAll(".notice-row")].map((row) => row.textContent);

  expect(rows()).toHaveLength(2);
  expect(document.body.textContent).not.toContain("CAJA EFECTIVO");

  const searchBox = document.body.querySelector<HTMLInputElement>("input[placeholder='Buscar cuenta, banco o moneda...']")!;
  searchBox.value = "bbva";
  searchBox.dispatchEvent(new Event("input"));
  await flushPromises();
  expect(rows()).toHaveLength(1);
  expect(rows()[0]).toContain("PEN-BBVA");
});

test("selects every listed account at once", async () => {
  await openDialog(accepted([]), { notice: { id: 21, title: "Aviso de Salida" } });
  document.body.querySelector<HTMLInputElement>("input[aria-label='Seleccionar todas']")!.click();
  await flushPromises();
  expect(document.body.textContent).toContain("2 cuentas seleccionadas");
  await send();

  expect(sentRequests()[0]).toMatchObject({ data: { cuentasBancarias: [4, 9] } });
});
