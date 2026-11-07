import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { flushPromises, mount, type VueWrapper } from "@vue/test-utils";
import { createPinia, setActivePinia } from "pinia";
import Swal from "sweetalert2";
import { createVuetify } from "vuetify";
import * as components from "vuetify/components";
import * as directives from "vuetify/directives";
import TrafficFileCreateDialog from "@/components/folderTraffic/TrafficFileCreateDialog.vue";
import { useAppStore } from "@/stores/app";
import { URL_MAIN, accepted, httpMock, rejected, respond } from "@/stores/__tests__/catalogHttp";

const push = vi.fn();
vi.mock("vue-router", () => ({ useRouter: () => ({ push }) }));
vi.mock("@/router", () => ({ default: { push: vi.fn(), currentRoute: { value: { params: {} } } } }));
vi.mock("@/api/http", () => ({ default: vi.fn() }));
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

interface DialogState {
  form: Record<string, number | null>;
  problem: string;
  create(): Promise<void>;
}

const automatic = { correlativo: null, last_used: 8, next_code: "TR-00009", manual: false };
let wrapper: VueWrapper | undefined;

beforeEach(() => {
  vi.clearAllMocks();
  sessionStorage.setItem("dataUser", JSON.stringify([{ id: 4, id_branch: 1 }]));
  vi.mocked(Swal.fire).mockResolvedValue({ isConfirmed: false } as never);
});
afterEach(() => wrapper?.unmount());

async function mountDialog(bodies: Record<string, unknown>) {
  respond({ traffic_correlative: accepted([automatic]), CargarClientes: accepted([]), get_personal_pricing: accepted([]), ...bodies });
  const pinia = createPinia();
  setActivePinia(pinia);
  vi.spyOn(useAppStore(), "_getModality").mockResolvedValue();
  vi.spyOn(useAppStore(), "_getShipment").mockResolvedValue();
  vi.spyOn(useAppStore(), "_getIncoterms").mockResolvedValue();
  vi.spyOn(useAppStore(), "_getPortBegin").mockResolvedValue();
  vi.spyOn(useAppStore(), "_getPortEnd").mockResolvedValue();
  wrapper = mount(TrafficFileCreateDialog, {
    props: { modelValue: true },
    global: { plugins: [createVuetify({ components, directives }), pinia] },
    attachTo: document.body,
  });
  await flushPromises();
  return wrapper.vm as unknown as DialogState;
}

const fill = async (dialog: DialogState) => {
  useAppStore().itemsShipment = [{ id: 2, code: "AEREO", id_transport: 1 }] as never;
  Object.assign(dialog.form, { id_consigner: 12, id_modality: 1, id_shipment: 2 });
  await flushPromises();
  Object.assign(dialog.form, { id_port_begin: 3, id_port_end: 4 });
};

const createKeys = () =>
  httpMock.mock.calls.filter(([config]) => config.url === URL_MAIN + "traffic_file").map(([config]) => config.headers!["idempotency-key"]);

test("an incomplete form sends nothing and names the missing field", async () => {
  const dialog = await mountDialog({});

  await dialog.create();

  expect(createKeys()).toEqual([]);
  expect(dialog.problem).toBe("Elige el cliente.");
});

test("a refused create shows the server's reason and the retry uses a new key", async () => {
  const dialog = await mountDialog({ traffic_file: rejected("El cliente elegido no pertenece a tu empresa.", "TMSGADV") });
  await fill(dialog);

  await dialog.create();
  await dialog.create();

  expect(dialog.problem).toBe("El cliente elegido no pertenece a tu empresa.");
  const [first, second] = createKeys();
  expect(first).not.toBe(second);
});

test("a lost connection keeps the retry key, so a retry cannot create a second file", async () => {
  const dialog = await mountDialog({ traffic_file: new Error("network down") });
  await fill(dialog);

  await dialog.create();
  await dialog.create();

  const [first, second] = createKeys();
  expect(first).toBe(second);
});

test("after creating, the user can open the new file", async () => {
  const dialog = await mountDialog({ traffic_file: accepted([{ id_traffic: 9, code_traffic: "TR-00009", id_house: 91 }]) });
  vi.mocked(Swal.fire).mockResolvedValueOnce({ isConfirmed: true } as never);
  await fill(dialog);

  await dialog.create();
  await flushPromises();

  expect(wrapper!.emitted("created")).toHaveLength(1);
  expect(push).toHaveBeenCalledWith({ name: "trafficVer", params: { id: 91 } });
});

test("changing the shipment type clears the ports picked for the old one", async () => {
  const dialog = await mountDialog({});
  await fill(dialog);
  useAppStore().itemsShipment = [{ id: 2, code: "AEREO", id_transport: 1 }, { id: 5, code: "FCL", id_transport: 2 }] as never;

  dialog.form.id_shipment = 5;
  await flushPromises();

  expect(dialog.form.id_port_begin).toBeNull();
  expect(dialog.form.id_port_end).toBeNull();
  expect(useAppStore()._getPortBegin).toHaveBeenLastCalledWith({ id_transport: 2 });
});
