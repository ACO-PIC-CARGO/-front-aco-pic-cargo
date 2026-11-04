import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { flushPromises, mount, type VueWrapper } from "@vue/test-utils";
import { createPinia, setActivePinia } from "pinia";
import { createVuetify } from "vuetify";
import * as components from "vuetify/components";
import * as directives from "vuetify/directives";
import TrafficFileBar from "@/components/folderTraffic/TrafficFileBar.vue";
import { accepted, respond } from "@/stores/__tests__/catalogHttp";

const push = vi.fn();
vi.mock("vue-router", () => ({ useRouter: () => ({ push }) }));
vi.mock("@/api/http", () => ({ default: vi.fn() }));

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
