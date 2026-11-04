import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { flushPromises, mount, type VueWrapper } from "@vue/test-utils";
import { createPinia, setActivePinia } from "pinia";
import { createVuetify } from "vuetify";
import * as components from "vuetify/components";
import * as directives from "vuetify/directives";
import TrafficList from "@/components/folderTraffic/TrafficList.vue";
import { URL_MAIN, accepted, httpMock, respond } from "@/stores/__tests__/catalogHttp";

const push = vi.fn();
vi.mock("vue-router", () => ({ useRouter: () => ({ push }) }));
vi.mock("@/api/http", () => ({ default: vi.fn() }));
vi.mock("sweetalert2", () => ({ default: { fire: vi.fn() } }));
globalThis.ResizeObserver ??= class {
  observe() {}
  unobserve() {}
  disconnect() {}
};

const pending = {
  id_traffic: 4,
  code_traffic: "TR-00004",
  id_house: 90,
  quote_kind: "PRICING",
  id_quote: 15376,
  quote_number: "00015376",
  sent_at: null,
  status_name: null,
  code_master: null,
};
let wrapper: VueWrapper | undefined;

beforeEach(() => vi.clearAllMocks());
afterEach(() => wrapper?.unmount());

async function mountAs(actions: string[], rows: unknown[] = [pending]) {
  sessionStorage.setItem("permissions", JSON.stringify({ screens: [{ route: "lstTraffic", actions }], controlled: ["lstTraffic"] }));
  respond({ traffic_list: accepted(rows), traffic_status: accepted([]) });
  const pinia = createPinia();
  setActivePinia(pinia);
  wrapper = mount(TrafficList, { global: { plugins: [createVuetify({ components, directives }), pinia] } });
  await flushPromises();
  return wrapper;
}

const listParams = () =>
  httpMock.mock.calls.filter(([config]) => config.url === URL_MAIN + "traffic_list").map(([config]) => config.params);
const labelled = (label: string) => wrapper!.find(`button[aria-label="${label}"]`);

test("the list starts on the files still pending", async () => {
  await mountAs(["VER"]);

  expect(listParams()).toEqual([{ state: "PENDING", status: null }]);
  expect(wrapper!.text()).toContain("TR-00004");
});

test("choosing another state lists those files", async () => {
  await mountAs(["VER"]);

  (wrapper!.vm as unknown as { state: string | null }).state = "SENT";
  await flushPromises();

  const calls = listParams();
  expect(calls[calls.length - 1]).toEqual({ state: "SENT", status: null });
});

test("a file opens on its house screen", async () => {
  await mountAs(["VER"]);

  await labelled("Ver TR-00004").trigger("click");

  expect(push).toHaveBeenCalledWith({ name: "trafficVer", params: { id: 90 } });
});

test("a pending file is sent on from its quote's send step", async () => {
  await mountAs(["VER", "MODIFICAR"]);

  await labelled("Enviar TR-00004 a Operaciones").trigger("click");

  expect(push).toHaveBeenCalledWith({ name: "verQuote", params: { id: 15376, step: 5 } });
});

test("a file already sent is not offered to be sent or re-labelled", async () => {
  await mountAs(["VER", "MODIFICAR"], [{ ...pending, sent_at: "2026-11-03", code_master: "2026MBL01742" }]);

  expect(labelled("Enviar TR-00004 a Operaciones").exists()).toBe(false);
  expect(labelled("Cambiar estatus de TR-00004").exists()).toBe(false);
  expect(wrapper!.text()).toContain("Enviado a operaciones");
});

test("without Modificar on Tráfico, files are only viewed", async () => {
  await mountAs(["VER"]);

  expect(labelled("Enviar TR-00004 a Operaciones").exists()).toBe(false);
  expect(labelled("Cambiar estatus de TR-00004").exists()).toBe(false);
  expect(wrapper!.findAll("button").some((button) => button.text().includes("Configurar correlativo"))).toBe(false);
});
