import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { defineComponent } from "vue";
import { flushPromises, mount } from "@vue/test-utils";
import type { VueWrapper } from "@vue/test-utils";
import { createPinia, setActivePinia } from "pinia";
import Swal from "sweetalert2";
import type { SweetAlertOptions } from "sweetalert2";
import { createVuetify } from "vuetify";
import * as components from "vuetify/components";
import * as directives from "vuetify/directives";
import DatosPrincipales from "@/components/folderPricing/DatosPrincipales.vue";
import { FOLDER_NOT_CREATED } from "@/components/folderPricing/quoteRules";
import { usePricingStore } from "@/stores/pricing";
import { accepted, httpMock, rejected } from "@/stores/__tests__/catalogHttp";

const routerPush = vi.hoisted(() => vi.fn());
vi.mock("@/api/http", () => ({ default: vi.fn() }));
vi.mock("@/router", () => ({ default: { push: vi.fn(), currentRoute: { value: { params: {} } } } }));
vi.mock("vue-router", () => ({ useRoute: () => ({ name: "editQuote" }), useRouter: () => ({ push: routerPush }) }));
vi.mock("sweetalert2", () => ({ default: { fire: vi.fn(), close: vi.fn() } }));

globalThis.ResizeObserver ??= class {
  observe() {}
  unobserve() {}
  disconnect() {}
};
Object.defineProperty(window, "visualViewport", {
  value: { width: 1024, height: 768, addEventListener() {}, removeEventListener() {} },
  configurable: true,
});

let wrapper: VueWrapper | undefined;
const swalCalls = () => vi.mocked(Swal.fire).mock.calls.map(([options]) => options as SweetAlertOptions);

beforeEach(() => {
  vi.clearAllMocks();
  vi.stubGlobal("location", { reload: vi.fn() });
  sessionStorage.setItem("dataUser", JSON.stringify([{ id_branch: 1 }]));
  vi.mocked(Swal.fire).mockResolvedValue({ isConfirmed: true } as never);
  httpMock.mockResolvedValue({ data: accepted([]) });
});

afterEach(() => {
  wrapper?.unmount();
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

async function openQuoteInEdit() {
  const pinia = createPinia();
  setActivePinia(pinia);
  const pricing = usePricingStore();
  pricing.listIncoterms = [{ id: 9, name: "FOB" }, { id: 10, name: "EXW" }];
  pricing.datosPrincipales = { idincoterms: 9, idsentido: 1, idtipocarga: 3 };
  wrapper = mount(
    defineComponent({ components: { DatosPrincipales }, template: "<v-app><DatosPrincipales /></v-app>" }),
    { global: { plugins: [createVuetify({ components, directives }), pinia] }, attachTo: document.body },
  );
  await flushPromises();
  return pricing;
}

async function chooseIncoterm(pricing: ReturnType<typeof usePricingStore>, id: number) {
  const incoterms = wrapper!.findAllComponents({ name: "VAutocomplete" }).find((field) => field.props("label") === "Incoterms")!;
  pricing.datosPrincipales.idincoterms = id;
  incoterms.vm.$emit("update:modelValue", id);
  await flushPromises();
}

test("cancelling a new incoterm right after the quote opens puts back the quote's incoterm", { timeout: 15_000 }, async () => {
  vi.useFakeTimers({ toFake: ["setTimeout"] });
  vi.mocked(Swal.fire).mockResolvedValue({ isConfirmed: false } as never);
  const pricing = await openQuoteInEdit();

  await chooseIncoterm(pricing, 10);

  expect(pricing.datosPrincipales.idincoterms).toBe(9);
});

async function changeIncotermInEdit({ saved, folderUrl, motivo = null }: { saved: boolean; folderUrl: string | null; motivo?: string | null }) {
  const pricing = await openQuoteInEdit();
  vi.spyOn(pricing, "registrarQuotePorCambioIncoterms").mockImplementation(async () => {
    if (!saved) return rejected("El puerto de origen elegido no pertenece a tu empresa. Elige uno de la lista e intenta de nuevo.");
    pricing.id = 610;
    pricing.mensaje = "Cotización ingresada con el número 16000-P";
    return accepted([]);
  });
  const crearCarpeta = vi.spyOn(pricing, "crearCarpetaOneDrive").mockResolvedValue({ url: folderUrl, motivo });
  vi.spyOn(pricing, "actualizarURLEnElQuote").mockResolvedValue();

  await chooseIncoterm(pricing, 10);
  await new Promise((resolve) => setTimeout(resolve, 600));
  await flushPromises();
  return { pricing, crearCarpeta };
}

test("a new incoterm whose OneDrive folder was created offers to copy the files into it", { timeout: 15_000 }, async () => {
  await changeIncotermInEdit({ saved: true, folderUrl: "https://drive/16000-P" });

  expect(swalCalls().some((options) => options.confirmButtonText === "Copiar Archivos")).toBe(true);
  expect(document.body.textContent).toContain("Archivos a Copiar");
});

test("a new incoterm whose folder could not be created says so and opens the new quote instead of offering a copy", { timeout: 15_000 }, async () => {
  await changeIncotermInEdit({ saved: true, folderUrl: null });

  expect(swalCalls().some((options) => options.confirmButtonText === "Copiar Archivos")).toBe(false);
  expect(swalCalls().some((options) => String(options.text).includes(FOLDER_NOT_CREATED))).toBe(true);
  expect(document.body.textContent).not.toContain("Archivos a Copiar");
  expect(routerPush).toHaveBeenCalledWith({ name: "editQuote", params: { id: 610 } });
});

test("a new incoterm whose folder the server did not create says why", { timeout: 15_000 }, async () => {
  await changeIncotermInEdit({ saved: true, folderUrl: null, motivo: "Las carpetas de OneDrive solo se crean en producción." });

  expect(swalCalls().some((options) => String(options.text).includes("Las carpetas de OneDrive solo se crean en producción."))).toBe(true);
});

test("a new incoterm the backend refuses shows why, keeps the edited quote and its incoterm", { timeout: 15_000 }, async () => {
  const { pricing, crearCarpeta } = await changeIncotermInEdit({ saved: false, folderUrl: "https://drive/x" });

  expect(swalCalls()).toContainEqual(
    expect.objectContaining({ icon: "error", text: "El puerto de origen elegido no pertenece a tu empresa. Elige uno de la lista e intenta de nuevo." }),
  );
  expect(crearCarpeta).not.toHaveBeenCalled();
  expect(pricing.datosPrincipales.idincoterms).toBe(9);
  expect(routerPush).not.toHaveBeenCalled();
});

test("Ejecutivo and Pricing show no raw id before the executives load, then show the executive's name", { timeout: 15_000 }, async () => {
  const pricing = await openQuoteInEdit();
  pricing.datosPrincipales.id_vendedor = 4;
  pricing.datosPrincipales.id_pricing = 4;
  const fieldText = (label: string) =>
    wrapper!.findAllComponents({ name: "VAutocomplete" }).find((field) => field.props("label") === label)!.find(".v-field__input").text();
  await flushPromises();

  expect([fieldText("Ejecutivo"), fieldText("Pricing")]).toEqual(["", ""]);

  pricing.listEjecutivo = [{ id: 4, nombrecompleto: "ZURITA RAMIREZ CESAR" }];
  await flushPromises();

  expect([fieldText("Ejecutivo"), fieldText("Pricing")]).toEqual(["ZURITA RAMIREZ CESAR", "ZURITA RAMIREZ CESAR"]);
});
