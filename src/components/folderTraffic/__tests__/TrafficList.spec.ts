import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { flushPromises, mount, type VueWrapper } from "@vue/test-utils";
import { createPinia, setActivePinia } from "pinia";
import Swal from "sweetalert2";
import { createVuetify } from "vuetify";
import * as components from "vuetify/components";
import { VDataTableServer } from "vuetify/components";
import * as directives from "vuetify/directives";
import TrafficList from "@/components/folderTraffic/TrafficList.vue";
import { URL_MAIN, accepted, httpMock, respond } from "@/stores/__tests__/catalogHttp";

const push = vi.fn();
vi.mock("vue-router", () => ({ useRouter: () => ({ push }) }));
vi.mock("@/router", () => ({ default: { push: vi.fn() } }));
vi.mock("@/api/http", () => ({ default: vi.fn() }));
vi.mock("sweetalert2", () => ({ default: { fire: vi.fn() } }));
globalThis.ResizeObserver ??= class {
  observe() {}
  unobserve() {}
  disconnect() {}
};

const SendStub = { name: "TrafficSendToOperations", props: ["file"], template: "<div />" };
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

async function mountAs(actions: string[], rows: unknown[] = [pending], statuses: unknown[] = []) {
  sessionStorage.setItem("permissions", JSON.stringify({ screens: [{ route: "lstTraffic", actions }], controlled: ["lstTraffic"] }));
  respond({ traffic_list: accepted(rows), traffic_status: accepted(statuses) });
  const pinia = createPinia();
  setActivePinia(pinia);
  wrapper = mount(TrafficList, {
    global: { plugins: [createVuetify({ components, directives }), pinia], stubs: { TrafficSendToOperations: SendStub } },
  });
  await flushPromises();
  return wrapper;
}

const listParams = () =>
  httpMock.mock.calls.filter(([config]) => config.url === URL_MAIN + "traffic_list").map(([config]) => config.params);
const lastListParams = () => {
  const calls = listParams();
  return calls[calls.length - 1];
};
const labelled = (label: string) => wrapper!.find(`button[aria-label="${label}"]`);

test("without a default status the list starts with every file", async () => {
  await mountAs(["VER"]);

  expect(listParams()).toEqual([{ state: null, status: null, pagina: 1, limit: 10 }]);
  expect(wrapper!.text()).toContain("TR-00004");
});

test("choosing another state lists those files", async () => {
  await mountAs(["VER"]);

  (wrapper!.vm as unknown as { state: string | null }).state = "SENT";
  await flushPromises();

  const calls = listParams();
  expect(calls[calls.length - 1]).toEqual({ state: "SENT", status: null, pagina: 1, limit: 10 });
});

test("another page is asked to the server, and another state starts again on the first page", async () => {
  await mountAs(["VER"], [{ ...pending, totalregistro: "25", totalenviados: "0" }]);

  wrapper!.findComponent(VDataTableServer).vm.$emit("update:page", 2);
  await flushPromises();
  expect(lastListParams()).toMatchObject({ pagina: 2, limit: 10 });

  (wrapper!.vm as unknown as { state: string | null }).state = "SENT";
  await flushPromises();
  expect(lastListParams()).toMatchObject({ state: "SENT", pagina: 1 });
});

test("no page size asks for more files than the server sends in one page", async () => {
  await mountAs(["VER"]);

  const sizes = wrapper!.findComponent(VDataTableServer).props("itemsPerPageOptions") as number[];
  expect(sizes.every((size) => size > 0 && size <= 100)).toBe(true);
});

test("a file opens on its house screen", async () => {
  await mountAs(["VER"]);

  await labelled("Ver TR-00004").trigger("click");

  expect(push).toHaveBeenCalledWith({ name: "trafficVer", params: { id: 90 } });
});

test("sending a pending file to Operaciones opens the send flow without leaving the list", async () => {
  await mountAs(["VER", "MODIFICAR"]);

  await labelled("Enviar TR-00004 a Operaciones").trigger("click");

  expect(push).not.toHaveBeenCalled();
  expect(wrapper!.findComponent({ name: "TrafficSendToOperations" }).props("file")).toMatchObject({ id_traffic: 4, id_quote: 15376 });
});

test("a file without a quote is not sent until one is associated", async () => {
  await mountAs(["VER", "MODIFICAR"], [{ ...pending, quote_kind: null, id_quote: null, quote_number: null }]);

  await labelled("Enviar TR-00004 a Operaciones").trigger("click");

  expect(Swal.fire).toHaveBeenCalledWith(
    expect.objectContaining({ text: "Este expediente no tiene cotización. Asóciale una desde el house para enviarlo a Operaciones." }),
  );
  expect(wrapper!.findComponent({ name: "TrafficSendToOperations" }).exists()).toBe(false);
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

test("the list starts filtered by the company's default status", async () => {
  await mountAs(["VER"], [pending], [
    { id: 3, name: "En negociación", position: 1, is_default: false },
    { id: 7, name: "Por embarcar", position: 2, is_default: true },
  ]);

  expect(listParams()).toEqual([{ state: null, status: 7, pagina: 1, limit: 10 }]);
});
