import { beforeEach, expect, test, vi } from "vitest";
import { flushPromises, mount } from "@vue/test-utils";
import Swal from "sweetalert2";
import { createVuetify } from "vuetify";
import * as components from "vuetify/components";
import * as directives from "vuetify/directives";
import PricingRequestButton from "../PricingRequestButton.vue";
import { createPricingRequest, getPricingRequestInfo } from "../pricingRequestApi";

vi.mock("../pricingRequestApi", () => ({ getPricingRequestInfo: vi.fn(), createPricingRequest: vi.fn() }));
vi.mock("../../InternalCommunication/internalCommunicationApi", () => ({
  getInternalMessages: vi.fn().mockResolvedValue({ estadoflag: true, mensaje: "", tipomensaje: "TMSGINF", data: [] }),
  sendInternalMessage: vi.fn(),
}));
vi.mock("sweetalert2", () => ({ default: { fire: vi.fn() } }));
globalThis.ResizeObserver ??= class { observe() {} unobserve() {} disconnect() {} };
Object.defineProperty(window, "visualViewport", {
  value: { width: 1024, height: 768, addEventListener() {}, removeEventListener() {} },
  configurable: true,
});

const vuetify = createVuetify({ components, directives });
const info = (fields = {}) => ({
  estadoflag: true, mensaje: "", tipomensaje: "", data: [{
    quote_code: "15479-P", pricing_name: "ANA PRICING", pricing_notes: "Revisar flete", pending_since: null, can_request: true, blocked_reason: null, ...fields,
  }],
});

async function openDialog() {
  const wrapper = mount(PricingRequestButton, { props: { quoteId: 15 }, global: { plugins: [vuetify] }, attachTo: document.body });
  await wrapper.find("button[aria-label='Solicitar a pricing']").trigger("click");
  await flushPromises();
  const send = () => [...document.querySelectorAll("button")].find((b) => b.textContent?.trim() === "Solicitar") as HTMLButtonElement;
  return { wrapper, send, text: () => document.body.textContent ?? "" };
}

beforeEach(() => {
  document.body.innerHTML = "";
  vi.mocked(getPricingRequestInfo).mockReset();
  vi.mocked(createPricingRequest).mockReset();
  vi.mocked(Swal.fire).mockReset();
});

test("a blocked request explains why and cannot be sent", async () => {
  vi.mocked(getPricingRequestInfo).mockResolvedValue(info({ can_request: false, blocked_reason: "Ya hay una solicitud pendiente desde el 09/11/2026 10:00. Espera a que ANA PRICING la revise." }));
  const { send, text } = await openDialog();

  expect(text()).toContain("Ya hay una solicitud pendiente desde el 09/11/2026 10:00.");
  expect(send().disabled).toBe(true);
});

test("confirming sends the request and shows the server message", async () => {
  vi.mocked(getPricingRequestInfo).mockResolvedValue(info());
  vi.mocked(createPricingRequest).mockResolvedValue({ estadoflag: true, mensaje: "Le avisamos a ANA PRICING que revise la cotización 15479-P.", tipomensaje: "TMSGSUC", data: [] });
  const { send } = await openDialog();

  send().click();
  await flushPromises();

  expect(createPricingRequest).toHaveBeenCalledWith(15, null);
  expect(Swal.fire).toHaveBeenCalledWith(expect.objectContaining({ icon: "success", text: "Le avisamos a ANA PRICING que revise la cotización 15479-P." }));
});

test("a typed note travels trimmed with the request", async () => {
  vi.mocked(getPricingRequestInfo).mockResolvedValue(info());
  vi.mocked(createPricingRequest).mockResolvedValue({ estadoflag: true, mensaje: "ok", tipomensaje: "TMSGSUC", data: [] });
  const { send } = await openDialog();
  const field = document.querySelector("textarea") as HTMLTextAreaElement;
  field.value = "  Urge el flete  ";
  field.dispatchEvent(new Event("input"));
  await flushPromises();

  send().click();
  await flushPromises();

  expect(createPricingRequest).toHaveBeenCalledWith(15, "Urge el flete");
});

test("a blank note is not sent", async () => {
  vi.mocked(getPricingRequestInfo).mockResolvedValue(info());
  vi.mocked(createPricingRequest).mockResolvedValue({ estadoflag: true, mensaje: "ok", tipomensaje: "TMSGSUC", data: [] });
  const { send } = await openDialog();
  const field = document.querySelector("textarea") as HTMLTextAreaElement;
  field.value = "   ";
  field.dispatchEvent(new Event("input"));
  await flushPromises();

  send().click();
  await flushPromises();

  expect(createPricingRequest).toHaveBeenCalledWith(15, null);
});

test("a connection failure shows friendly copy instead of the error", async () => {
  vi.mocked(getPricingRequestInfo).mockRejectedValue(new Error("Network Error"));
  const { send, text } = await openDialog();

  expect(text()).toContain("No pudimos cargar los datos de la solicitud. Revisa tu conexión e inténtalo de nuevo.");
  expect(text()).not.toContain("Network Error");
  expect(send().disabled).toBe(true);
});

const typeNote = async (value: string) => {
  const field = document.querySelector("textarea") as HTMLTextAreaElement;
  field.value = value;
  field.dispatchEvent(new Event("input"));
  await flushPromises();
};

test("the dialog offers exactly one note field", async () => {
  vi.mocked(getPricingRequestInfo).mockResolvedValue(info());
  await openDialog();
  expect(document.querySelectorAll("textarea:not(.v-textarea__sizer)")).toHaveLength(1);
});

test("a blocked request offers no note field", async () => {
  vi.mocked(getPricingRequestInfo).mockResolvedValue(info({ can_request: false, blocked_reason: "Ya hay una solicitud pendiente." }));
  await openDialog();
  expect(document.querySelectorAll("textarea:not(.v-textarea__sizer)")).toHaveLength(0);
});

test("a refused request keeps the typed note", async () => {
  vi.mocked(getPricingRequestInfo).mockResolvedValue(info());
  vi.mocked(createPricingRequest).mockResolvedValue({ estadoflag: false, mensaje: "No se pudo.", tipomensaje: "TMSGERR", data: [] });
  const { send } = await openDialog();
  await typeNote("Urge");
  send().click();
  await flushPromises();
  expect((document.querySelector("textarea") as HTMLTextAreaElement).value).toBe("Urge");
});

test("reopening the dialog starts with an empty note", async () => {
  vi.mocked(getPricingRequestInfo).mockResolvedValue(info());
  const { wrapper } = await openDialog();
  await typeNote("Urge");
  await wrapper.find("button[aria-label='Solicitar a pricing']").trigger("click");
  await flushPromises();
  expect((document.querySelector("textarea") as HTMLTextAreaElement).value).toBe("");
});

test("a successful request with a note reports it so the list can show it", async () => {
  vi.mocked(getPricingRequestInfo).mockResolvedValue(info());
  vi.mocked(createPricingRequest).mockResolvedValue({ estadoflag: true, mensaje: "ok", tipomensaje: "TMSGSUC", data: [] });
  const { wrapper, send } = await openDialog();
  await typeNote("  Urge  ");
  send().click();
  await flushPromises();
  expect(wrapper.emitted("requested")).toEqual([["Urge"]]);
});

test("a successful request without a note reports none", async () => {
  vi.mocked(getPricingRequestInfo).mockResolvedValue(info());
  vi.mocked(createPricingRequest).mockResolvedValue({ estadoflag: true, mensaje: "ok", tipomensaje: "TMSGSUC", data: [] });
  const { wrapper, send } = await openDialog();
  send().click();
  await flushPromises();
  expect(wrapper.emitted("requested")).toEqual([[null]]);
});

test("a blocked row cannot open the request dialog", async () => {
  const wrapper = mount(PricingRequestButton, { props: { quoteId: 15, blocked: true }, global: { plugins: [vuetify] }, attachTo: document.body });
  const button = wrapper.find("button[aria-label='Ya fue solicitado']");
  expect(button.attributes("disabled")).toBeDefined();
  expect(wrapper.find("button[aria-label='Solicitar a pricing']").exists()).toBe(false);
  expect(getPricingRequestInfo).not.toHaveBeenCalled();
});

test("the text button turns into a disabled notice when the quote was already requested", async () => {
  vi.mocked(getPricingRequestInfo).mockResolvedValue(info({ can_request: false, blocked_reason: "Ya fue solicitada el 18/11/2026 10:00. Edita la cotización para volver a solicitarla." }));
  const wrapper = mount(PricingRequestButton, { props: { quoteId: 15, activator: "text" }, global: { plugins: [vuetify] }, attachTo: document.body });
  await flushPromises();
  expect(wrapper.text()).toContain("YA FUE SOLICITADO");
  expect(wrapper.find("button").attributes("disabled")).toBeDefined();
});

test("the text button stays as is when the refusal is another reason", async () => {
  vi.mocked(getPricingRequestInfo).mockResolvedValue(info({ can_request: false, blocked_reason: "Ya hay una solicitud pendiente." }));
  const wrapper = mount(PricingRequestButton, { props: { quoteId: 15, activator: "text" }, global: { plugins: [vuetify] }, attachTo: document.body });
  await flushPromises();
  expect(wrapper.text()).toContain("SOLICITAR A PRICING");
});

test("a successful request blocks the button until the quote is edited", async () => {
  vi.mocked(getPricingRequestInfo).mockResolvedValue(info());
  vi.mocked(createPricingRequest).mockResolvedValue({ estadoflag: true, mensaje: "ok", tipomensaje: "TMSGSUC", data: [] });
  const { wrapper, send } = await openDialog();
  send().click();
  await flushPromises();
  expect(wrapper.find("button[aria-label='Ya fue solicitado']").exists()).toBe(true);
});
