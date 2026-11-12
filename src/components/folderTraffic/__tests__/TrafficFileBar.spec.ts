import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { flushPromises, mount, type VueWrapper } from "@vue/test-utils";
import { createPinia, setActivePinia } from "pinia";
import Swal from "sweetalert2";
import { createVuetify } from "vuetify";
import * as components from "vuetify/components";
import * as directives from "vuetify/directives";
import TrafficFileBar from "@/components/folderTraffic/TrafficFileBar.vue";
import { useHousesStore } from "@/stores/houses";
import { accepted, httpMock, respond } from "@/stores/__tests__/catalogHttp";

const push = vi.fn();
vi.mock("vue-router", () => ({ useRouter: () => ({ push }) }));
vi.mock("@/router", () => ({ default: { push: vi.fn() } }));
vi.mock("@/api/http", () => ({ default: vi.fn() }));
vi.mock("sweetalert2", () => ({ default: { fire: vi.fn() } }));

const SendStub = { name: "TrafficSendToOperations", props: ["file"], template: "<div />" };
const pendingFile = { id_traffic: 4, code_traffic: "TR-00004", id_house: 90, quote_kind: "PRICING", id_quote: 15376, sent: false };
let wrapper: VueWrapper | undefined;

beforeEach(() => vi.clearAllMocks());
afterEach(() => wrapper?.unmount());

async function mountAs(actions: string[], file = pendingFile) {
  sessionStorage.setItem("permissions", JSON.stringify({ screens: [{ route: "lstTraffic", actions }], controlled: ["lstTraffic"] }));
  respond({ traffic_by_house: accepted([file]) });
  const pinia = createPinia();
  setActivePinia(pinia);
  wrapper = mount(TrafficFileBar, {
    props: { houseId: 90 },
    global: { plugins: [createVuetify({ components, directives }), pinia], stubs: { TrafficSendToOperations: SendStub } },
  });
  await flushPromises();
  return wrapper;
}

const buttonNamed = (text: string) => wrapper!.findAll("button").find((button) => button.text().trim() === text);

test("sending a pending file to Operaciones opens the send flow without leaving Tráfico", async () => {
  await mountAs(["VER", "MODIFICAR"]);

  await buttonNamed("Enviar a Operaciones")!.trigger("click");

  expect(push).not.toHaveBeenCalled();
  expect(wrapper!.findComponent({ name: "TrafficSendToOperations" }).props("file")).toMatchObject({ id_traffic: 4, id_quote: 15376 });
});

test("sending to Operaciones is not offered without Modificar on Tráfico", async () => {
  await mountAs(["VER"]);

  expect(buttonNamed("Enviar a Operaciones")).toBeUndefined();
});

test("a file already sent is not offered to be sent again", async () => {
  await mountAs(["VER", "MODIFICAR"], { ...pendingFile, sent: true });

  expect(buttonNamed("Enviar a Operaciones")).toBeUndefined();
  expect(wrapper!.text()).toContain("Enviado a operaciones");
});

test("the expense control opens the house's own control de gastos", async () => {
  await mountAs(["VER"]);

  await buttonNamed("Control de gastos")!.trigger("click");

  expect(push).toHaveBeenCalledWith({ name: "billControlGastos", params: { id_house: 90 } });
});

const quotelessFile = { ...pendingFile, quote_kind: null, id_quote: null };

test("a file without a quote offers no quote to open and is not sent until one is associated", async () => {
  await mountAs(["VER", "MODIFICAR"], quotelessFile as never);

  expect(buttonNamed("Ver cotización")).toBeUndefined();
  await buttonNamed("Enviar a Operaciones")!.trigger("click");

  expect(Swal.fire).toHaveBeenCalledWith(
    expect.objectContaining({ text: "Este expediente no tiene cotización. Asóciale una desde el house para enviarlo a Operaciones." }),
  );
  expect(wrapper!.findComponent({ name: "TrafficSendToOperations" }).exists()).toBe(false);
});

test("the bar reloads its file once a quote is associated to the house", async () => {
  await mountAs(["VER", "MODIFICAR"], quotelessFile as never);
  respond({ traffic_by_house: accepted([pendingFile]) });

  useHousesStore().house = { ...useHousesStore().house, id_cot: 15376 } as never;
  await flushPromises();

  expect(httpMock.mock.calls.filter(([config]) => config.url.endsWith("traffic_by_house"))).toHaveLength(2);
  expect(buttonNamed("Ver cotización")).toBeDefined();
});
