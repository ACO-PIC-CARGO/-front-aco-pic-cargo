import { beforeEach, expect, test, vi } from "vitest";
import { flushPromises, mount } from "@vue/test-utils";
import Swal from "sweetalert2";
import { createVuetify } from "vuetify";
import * as components from "vuetify/components";
import * as directives from "vuetify/directives";
import PricingRequestButton from "../PricingRequestButton.vue";
import { createPricingRequest, getPricingRequestInfo } from "../pricingRequestApi";

vi.mock("../pricingRequestApi", () => ({ getPricingRequestInfo: vi.fn(), createPricingRequest: vi.fn() }));
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
  const { send, text } = await openDialog();
  expect(text()).toContain("Revisar flete");

  send().click();
  await flushPromises();

  expect(createPricingRequest).toHaveBeenCalledWith(15);
  expect(Swal.fire).toHaveBeenCalledWith(expect.objectContaining({ icon: "success", text: "Le avisamos a ANA PRICING que revise la cotización 15479-P." }));
});

test("a quote without notes says so", async () => {
  vi.mocked(getPricingRequestInfo).mockResolvedValue(info({ pricing_notes: null }));
  const { text } = await openDialog();
  expect(text()).toContain("Esta cotización no tiene notas a pricing.");
});

test("a connection failure shows friendly copy instead of the error", async () => {
  vi.mocked(getPricingRequestInfo).mockRejectedValue(new Error("Network Error"));
  const { send, text } = await openDialog();

  expect(text()).toContain("No pudimos cargar los datos de la solicitud. Revisa tu conexión e inténtalo de nuevo.");
  expect(text()).not.toContain("Network Error");
  expect(send().disabled).toBe(true);
});
