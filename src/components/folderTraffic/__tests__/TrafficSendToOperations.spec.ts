import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { defineComponent, h } from "vue";
import { flushPromises, mount, type VueWrapper } from "@vue/test-utils";
import { createPinia, setActivePinia } from "pinia";
import Swal from "sweetalert2";
import { createVuetify } from "vuetify";
import * as components from "vuetify/components";
import * as directives from "vuetify/directives";
import MasterSelectDialog from "@/components/comun/MasterSelectDialog.vue";
import TrafficSendToOperations from "@/components/folderTraffic/TrafficSendToOperations.vue";
import router from "@/router";
import { useAppStore } from "@/stores/app";
import { useControlGastosStore } from "@/stores/controlGastos";
import { useFilesStore } from "@/stores/files";
import { useHousesStore } from "@/stores/houses";
import { usePricingStore } from "@/stores/pricing";
import { URL_MAIN, accepted, httpMock, rejected, respond } from "@/stores/__tests__/catalogHttp";
import type { QuoteKind } from "@/types/traffic";

const push = vi.fn();
vi.mock("vue-router", () => ({ useRouter: () => ({ push }), useRoute: () => ({ params: {} }) }));
vi.mock("@/router", () => ({ default: { push: vi.fn(), currentRoute: { value: { params: {} } } } }));
vi.mock("@/api/http", () => ({ default: vi.fn() }));
vi.mock("sweetalert2", () => ({ default: { fire: vi.fn() } }));
Object.defineProperty(window, "visualViewport", {
  value: { width: 1024, height: 768, addEventListener() {}, removeEventListener() {} },
  configurable: true,
});
globalThis.ResizeObserver ??= class {
  observe() {}
  unobserve() {}
  disconnect() {}
};

interface FlowState {
  step: string;
  isNew: boolean;
  availability: string;
  masterId: number | null;
  problem: string;
  send(): Promise<void>;
}

interface FileToSend {
  id_traffic: number;
  code_traffic: string;
  id_house: number;
  quote_kind: QuoteKind | null;
  id_quote: number | null;
}

const pricingFile: FileToSend = { id_traffic: 4, code_traffic: "TR-00004", id_house: 90, quote_kind: "PRICING", id_quote: 15376 };
const aduanaFile: FileToSend = { ...pricingFile, quote_kind: "ADUANA", id_quote: 31 };
const InstructivoStub = { name: "FileSequenceInstructivo", template: "<div class='instructivo-stub' />", emits: ["continuar", "cerrarDialogo"] };
let wrapper: VueWrapper | undefined;

beforeEach(() => {
  vi.clearAllMocks();
  setActivePinia(createPinia());
  vi.mocked(Swal.fire).mockResolvedValue({ isConfirmed: false } as never);
  sessionStorage.setItem("dataUser", JSON.stringify([{ id: 176, id_branch: 1 }]));
  vi.spyOn(useHousesStore(), "guardarCarpetaHouse").mockResolvedValue(undefined);
  vi.spyOn(useFilesStore(), "moveFileToOneDrive").mockResolvedValue(undefined);
  vi.spyOn(useControlGastosStore(), "imprimirGuardarControlDetallado").mockResolvedValue(undefined);
});
afterEach(() => wrapper?.unmount());

async function mountFlow(file: FileToSend = pricingFile) {
  wrapper = mount(TrafficSendToOperations, {
    props: { file },
    global: { plugins: [createVuetify({ components, directives })], stubs: { FileSequenceInstructivo: InstructivoStub } },
    attachTo: document.body,
  });
  await flushPromises();
  return wrapper.vm as unknown as FlowState;
}

const sentPayloads = () =>
  httpMock.mock.calls
    .map(([config]) => config)
    .filter((config) => config.url === URL_MAIN + "traffic/4/send_to_operations")
    .map((config) => ({ data: config.data, key: config.headers!["idempotency-key"] }));

const quoteMaster = { id: 3831, code_master: "2026MBL01741", url_folderonedrive: "https://drive/3831" };

async function continuePricingInstructivo() {
  vi.spyOn(usePricingStore(), "getQuote").mockResolvedValue(null);
  usePricingStore().datosPrincipales = { nombre: "ZEVALLOS" } as never;
  const app = useAppStore();
  const loadMasters = vi.spyOn(app, "cargarMaster").mockImplementation(async () => {
    app.itemsMasterList = [quoteMaster];
  });
  await mountFlow();
  wrapper!.findComponent({ name: "FileSequenceInstructivo" }).vm.$emit("continuar");
  await flushPromises();
  return loadMasters;
}

const expedienteQuestion = expect.objectContaining({ confirmButtonText: "CREAR NUEVO EXPEDIENTE", denyButtonText: "SELECCIONAR EXPEDIENTE YA CREADO" });

test("a pricing file opens its quote's instructivo and then asks the quote's expediente question, not a master form of its own", async () => {
  vi.mocked(Swal.fire).mockResolvedValue({ isDismissed: true } as never);
  const getQuote = vi.spyOn(usePricingStore(), "getQuote").mockResolvedValue(null);
  const loadMasters = vi.spyOn(useAppStore(), "cargarMaster").mockResolvedValue(undefined);

  const flow = await mountFlow();
  expect(getQuote).toHaveBeenCalledWith({ id: "15376" });
  expect(flow.step).toBe("instructivo");
  wrapper!.findComponent({ name: "FileSequenceInstructivo" }).vm.$emit("continuar");
  await flushPromises();

  expect(loadMasters).toHaveBeenCalledWith(usePricingStore().datosPrincipales);
  expect(Swal.fire).toHaveBeenCalledWith(expedienteQuestion);
  expect(document.body.textContent).not.toContain("Crear un master nuevo");
});

test("creating a new expediente sends the pricing file with the master's availability date", async () => {
  respond({ "traffic/4/send_to_operations": accepted([{ id_master: 1 }]) });
  vi.mocked(Swal.fire)
    .mockResolvedValueOnce({ isConfirmed: true } as never)
    .mockResolvedValueOnce({ isConfirmed: true, value: "2099-01-15" } as never)
    .mockResolvedValue({ isConfirmed: false } as never);

  await continuePricingInstructivo();

  expect(sentPayloads().map((sent) => sent.data)).toEqual([{ nuevoexpediente: true, id_exp: null, fecha_validez: "2099-01-15" }]);
  expect(wrapper!.emitted("sent")).toHaveLength(1);
});

test("selecting an existing expediente sends the pricing file with the master picked in the quote's master dialog", async () => {
  respond({ "traffic/4/send_to_operations": accepted([{ id_master: 3831 }]) });
  vi.mocked(Swal.fire).mockResolvedValueOnce({ isDenied: true } as never).mockResolvedValue({ isConfirmed: false } as never);

  await continuePricingInstructivo();
  wrapper!.findComponent(MasterSelectDialog).vm.$emit("select", quoteMaster);
  await flushPromises();

  expect(sentPayloads().map((sent) => sent.data)).toEqual([{ nuevoexpediente: false, id_exp: 3831, fecha_validez: null }]);
  expect(wrapper!.emitted("sent")).toHaveLength(1);
});

test("closing the expediente question sends nothing and closes the flow", async () => {
  vi.mocked(Swal.fire).mockResolvedValue({ isDismissed: true } as never);

  await continuePricingInstructivo();

  expect(sentPayloads()).toEqual([]);
  expect(wrapper!.emitted("close")).toHaveLength(1);
});

test("a refused pricing send shows the server's reason", async () => {
  respond({ "traffic/4/send_to_operations": rejected("El master elegido no pertenece a tu empresa.", "TMSGADV") });
  vi.mocked(Swal.fire).mockResolvedValueOnce({ isDenied: true } as never).mockResolvedValue({ isConfirmed: false } as never);

  await continuePricingInstructivo();
  wrapper!.findComponent(MasterSelectDialog).vm.$emit("select", quoteMaster);
  await flushPromises();

  expect(Swal.fire).toHaveBeenLastCalledWith(expect.objectContaining({ icon: "error", text: "El master elegido no pertenece a tu empresa." }));
  expect(wrapper!.emitted("sent")).toBeUndefined();
});

test("a new expediente ends like an approved quote: the master gets its folder and expense control, and the expense control is offered", async () => {
  respond({ "traffic/4/send_to_operations": accepted([{ code_master: "2026-01760", id_master: 3900, id_house: 90 }]) });
  vi.mocked(Swal.fire)
    .mockResolvedValueOnce({ isConfirmed: true } as never)
    .mockResolvedValueOnce({ isConfirmed: true, value: "2099-01-15" } as never)
    .mockResolvedValue({ isConfirmed: true } as never);

  await continuePricingInstructivo();

  expect(useHousesStore().guardarCarpetaHouse).toHaveBeenCalledWith(expect.objectContaining({ nroMaster: "2026-01760 - ZEVALLOS", id: 3900 }));
  expect(useControlGastosStore().imprimirGuardarControlDetallado).toHaveBeenCalledWith({ guardarEnCarpeta: false, asociadoflag: true, id: 3900, id_branch: 1 });
  expect(Swal.fire).toHaveBeenLastCalledWith(expect.objectContaining({ confirmButtonText: "Ir al control de gastos", denyButtonText: "Ahora continuaremos con los Email." }));
  expect(router.push).toHaveBeenCalledWith({ name: "editControlGasto", params: { id: 3900, id_branch: 1 } });
});

test("an existing expediente moves the quote's files into that master's folder", async () => {
  respond({ "traffic/4/send_to_operations": accepted([{ code_master: "2026MBL01741", id_master: 3831, id_house: 90 }]) });
  vi.mocked(Swal.fire).mockResolvedValueOnce({ isDenied: true } as never).mockResolvedValue({ isConfirmed: false } as never);

  await continuePricingInstructivo();
  wrapper!.findComponent(MasterSelectDialog).vm.$emit("select", quoteMaster);
  await flushPromises();

  expect(useFilesStore().moveFileToOneDrive).toHaveBeenCalledWith(
    expect.objectContaining({ destinationFolderUrl: "https://drive/3831", nroMaster: "2026MBL01741 - ZEVALLOS", id: 3831 }),
  );
});

test("choosing the emails opens this file's quote on its emails step", async () => {
  respond({ "traffic/4/send_to_operations": accepted([{ code_master: "2026MBL01741", id_master: 3831, id_house: 90 }]) });
  vi.mocked(Swal.fire).mockResolvedValueOnce({ isDenied: true } as never).mockResolvedValue({ isDenied: true } as never);
  vi.useFakeTimers({ toFake: ["setTimeout"] });

  await continuePricingInstructivo();
  wrapper!.findComponent(MasterSelectDialog).vm.$emit("select", quoteMaster);
  await flushPromises();

  vi.useRealTimers();
  expect(router.push).toHaveBeenCalledWith({ name: "verQuote", params: { id: 15376, step: 5 } });
});

test("an aduana file goes straight to the master choice", async () => {
  respond({ "traffic/4/masters": accepted([]) });
  const getQuote = vi.spyOn(usePricingStore(), "getQuote");

  const flow = await mountFlow(aduanaFile);

  expect(getQuote).not.toHaveBeenCalled();
  expect(flow.step).toBe("master");
});

test("a new master without its availability date is not sent", async () => {
  respond({ "traffic/4/masters": accepted([]) });
  const flow = await mountFlow(aduanaFile);

  await flow.send();

  expect(sentPayloads()).toEqual([]);
  expect(flow.problem).toBe("Elige la fecha de disponibilidad del master.");
});

test("a new master is sent with its availability date", async () => {
  respond({ "traffic/4/masters": accepted([]), "traffic/4/send_to_operations": accepted([{ id_master: 1 }]) });
  const flow = await mountFlow(aduanaFile);
  flow.availability = "2099-01-15";

  await flow.send();

  expect(sentPayloads().map((sent) => sent.data)).toEqual([{ nuevoexpediente: true, id_exp: null, fecha_validez: "2099-01-15" }]);
  expect(wrapper!.emitted("sent")).toHaveLength(1);
});

test("an existing master is sent by its id", async () => {
  respond({ "traffic/4/masters": accepted([{ id: 3831, code_master: "2026MBL01741" }]), "traffic/4/send_to_operations": accepted([{ id_master: 3831 }]) });
  const flow = await mountFlow(aduanaFile);
  flow.isNew = false;
  flow.masterId = 3831;

  await flow.send();

  expect(sentPayloads().map((sent) => sent.data)).toEqual([{ nuevoexpediente: false, id_exp: 3831, fecha_validez: null }]);
});

test("a refused send shows the server's reason and the retry uses a new key", async () => {
  respond({
    "traffic/4/masters": accepted([]),
    "traffic/4/send_to_operations": rejected("Este expediente ya se envió a Operaciones.", "TMSGADV"),
  });
  const flow = await mountFlow(aduanaFile);
  flow.availability = "2099-01-15";

  await flow.send();
  await flow.send();

  const [first, retry] = sentPayloads().map((sent) => sent.key);
  expect(flow.problem).toBe("Este expediente ya se envió a Operaciones.");
  expect(retry).not.toBe(first);
  expect(wrapper!.emitted("sent")).toBeUndefined();
});

test("inside a read-only host form, like the house screen, the instructivo and the quote's master dialog stay editable", async () => {
  vi.mocked(Swal.fire).mockResolvedValueOnce({ isDenied: true } as never);
  vi.spyOn(usePricingStore(), "getQuote").mockResolvedValue(null);
  vi.spyOn(useAppStore(), "cargarMaster").mockResolvedValue(undefined);
  const InstructivoWithField = { ...InstructivoStub, template: "<v-text-field id='instructivo-field' />" };
  const ReadOnlyHouseForm = defineComponent(() => () => h(components.VForm, { readonly: true }, () => h(TrafficSendToOperations, { file: pricingFile })));
  wrapper = mount(ReadOnlyHouseForm, {
    global: { plugins: [createVuetify({ components, directives })], stubs: { FileSequenceInstructivo: InstructivoWithField } },
    attachTo: document.body,
  });
  await flushPromises();
  const field = (selector: string) => document.querySelector<HTMLInputElement>(selector)!;

  expect(field("#instructivo-field").readOnly).toBe(false);
  wrapper.findComponent({ name: "FileSequenceInstructivo" }).vm.$emit("continuar");
  await flushPromises();
  const masterField = [...document.querySelectorAll<HTMLElement>(".v-autocomplete")].find((el) => el.textContent?.includes("Expediente"))!;
  expect(masterField.querySelector("input")!.readOnly).toBe(false);
});
