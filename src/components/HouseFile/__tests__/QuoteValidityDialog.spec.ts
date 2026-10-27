import { afterEach, beforeEach, expect, test, vi } from "vitest";
import type { Mock } from "vitest";
import { flushPromises, mount } from "@vue/test-utils";
import type { VueWrapper } from "@vue/test-utils";
import { createPinia, setActivePinia } from "pinia";
import { createVuetify } from "vuetify";
import * as components from "vuetify/components";
import * as directives from "vuetify/directives";
import http from "@/api/http";
import QuoteValidityDialog from "@/components/HouseFile/QuoteValidityDialog.vue";
import type { HouseTrackingStep } from "@/types/houseTracking";

vi.mock("@/api/http", () => ({ default: vi.fn() }));
vi.mock("@/router", () => ({ default: { resolve: (path: string) => ({ href: `/#${path}` }), push: vi.fn() } }));
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

interface RequestConfig {
  method: string;
  url: string;
}

const httpMock = http as unknown as Mock<(config: RequestConfig) => Promise<{ data: unknown }>>;
const accepted = (mensaje: string) => ({ estadoflag: true, mensaje, tipomensaje: "TMSGINF", data: [] });
const rejected = (mensaje: string) => ({ estadoflag: false, mensaje, tipomensaje: "TMSGADV", data: [] });
const etdStep: HouseTrackingStep = {
  id: 6,
  name: "ETD (Salida de origen)",
  icon: "mdi-ferry",
  number: 6,
  visible_to_client: true,
  confirmed_at: null,
  confirmed_by: null,
  sent_at: null,
  scheduled_at: null,
  validation: { code: "quote_validity", name: "Vigencia de cotización" },
  validation_result: null,
  quote_validity: { quote_id: 7092, valid_until: "2025-11-14", kept_by: null, kept_at: null },
  state: "next",
  comments: [],
};
let wrapper: VueWrapper | undefined;

beforeEach(() => {
  vi.clearAllMocks();
  sessionStorage.setItem("dataUser", JSON.stringify([{ id: 1, id_branch: 1, nombrecompleto: "Carlos Ramírez" }]));
});

afterEach(() => wrapper?.unmount());

function respondKeep(body: unknown) {
  httpMock.mockImplementation(async ({ method }) => ({
    data: method === "put" ? body : { estadoflag: true, mensaje: null, tipomensaje: null, data: [] },
  }));
}

async function openDialog() {
  const pinia = createPinia();
  setActivePinia(pinia);
  wrapper = mount(QuoteValidityDialog, {
    props: { houseId: 2830, step: etdStep, modelValue: false },
    global: { plugins: [createVuetify({ components, directives }), pinia] },
    attachTo: document.body,
  });
  await wrapper.setProps({ modelValue: true });
  await flushPromises();
  return wrapper;
}

async function clickButton(name: string) {
  const buttons = [...document.body.querySelectorAll<HTMLButtonElement>(".v-overlay--active button")];
  const named = buttons.filter((button) => button.textContent?.trim() === name);
  named[named.length - 1]!.click();
  await flushPromises();
}

async function chooseOption(title: string) {
  const option = [...document.body.querySelectorAll<HTMLElement>(".v-overlay--active .v-radio")].find((radio) =>
    radio.textContent?.includes(title),
  )!;
  option.querySelector<HTMLInputElement>("input")!.click();
  await flushPromises();
}

test("skipping closes and tells the caller without saving anything", async () => {
  const wrapper = await openDialog();
  await clickButton("Continuar");
  expect(wrapper.emitted("skip")).toEqual([[]]);
  expect(httpMock).not.toHaveBeenCalled();
});

test("keeping the rate shows who authorizes and records it before continuing", async () => {
  respondKeep(accepted("Mantuvimos la tarifa de flete de la cotización."));
  const wrapper = await openDialog();
  await chooseOption("Mantener tarifa de flete");
  await clickButton("Continuar");
  expect(document.body.textContent).toContain("Carlos Ramírez");
  expect(document.body.textContent).toContain("Confirmar tarifa de flete");
  await clickButton("Continuar");
  expect(httpMock.mock.calls[0]![0]).toMatchObject({ method: "put", url: "house_tracking/2830/steps/6/rate_keep" });
  expect(wrapper.emitted("kept")).toEqual([[]]);
});

test("a rate that cannot be kept shows the reason and does not continue", async () => {
  respondKeep(rejected("Este house no tiene una cotización con vigencia. Vincula una cotización e intenta de nuevo."));
  const wrapper = await openDialog();
  await chooseOption("Mantener tarifa de flete");
  await clickButton("Continuar");
  await clickButton("Continuar");
  expect(document.body.textContent).toContain("Este house no tiene una cotización con vigencia.");
  expect(wrapper.emitted("kept")).toBeUndefined();
});

test("updating the quote opens it in a new tab and saves nothing", async () => {
  const open = vi.spyOn(window, "open").mockReturnValue(null);
  const wrapper = await openDialog();
  await chooseOption("Actualizar cotización");
  await clickButton("Continuar");
  expect(open).toHaveBeenCalledWith("/#/home/folderPricing/verQuote/7092", "_blank", "noopener");
  expect(wrapper.emitted("skip")).toBeUndefined();
  expect(wrapper.emitted("kept")).toBeUndefined();
  expect(httpMock).not.toHaveBeenCalled();
});
