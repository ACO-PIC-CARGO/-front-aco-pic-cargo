import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { flushPromises, mount, type VueWrapper } from "@vue/test-utils";
import { createPinia, setActivePinia } from "pinia";
import Swal from "sweetalert2";
import { createVuetify } from "vuetify";
import * as components from "vuetify/components";
import * as directives from "vuetify/directives";
import TrafficSendToOperations from "@/components/folderTraffic/TrafficSendToOperations.vue";
import { usePricingStore } from "@/stores/pricing";
import { URL_MAIN, accepted, httpMock, rejected, respond } from "@/stores/__tests__/catalogHttp";

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

const pricingFile = { id_traffic: 4, code_traffic: "TR-00004", id_house: 90, quote_kind: "PRICING" as const, id_quote: 15376 };
const aduanaFile = { ...pricingFile, quote_kind: "ADUANA" as const, id_quote: 31 };
const InstructivoStub = { name: "FileSequenceInstructivo", template: "<div class='instructivo-stub' />", emits: ["continuar", "cerrarDialogo"] };
let wrapper: VueWrapper | undefined;

beforeEach(() => {
  vi.clearAllMocks();
  setActivePinia(createPinia());
  vi.mocked(Swal.fire).mockResolvedValue({ isConfirmed: false } as never);
});
afterEach(() => wrapper?.unmount());

async function mountFlow(file = pricingFile) {
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

test("a pricing file opens its quote's instructivo before choosing the master", async () => {
  respond({ "traffic/4/masters": accepted([]) });
  const getQuote = vi.spyOn(usePricingStore(), "getQuote").mockResolvedValue(undefined);

  const flow = await mountFlow();

  expect(getQuote).toHaveBeenCalledWith({ id: "15376" });
  expect(flow.step).toBe("instructivo");
  wrapper!.findComponent({ name: "FileSequenceInstructivo" }).vm.$emit("continuar");
  await flushPromises();
  expect(flow.step).toBe("master");
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
