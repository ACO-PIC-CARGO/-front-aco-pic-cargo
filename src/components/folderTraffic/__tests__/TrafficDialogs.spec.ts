import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { flushPromises, mount, type VueWrapper } from "@vue/test-utils";
import { createPinia, setActivePinia } from "pinia";
import Swal from "sweetalert2";
import { createVuetify } from "vuetify";
import * as components from "vuetify/components";
import * as directives from "vuetify/directives";
import TrafficCorrelativeDialog from "@/components/folderTraffic/TrafficCorrelativeDialog.vue";
import TrafficStatusDialog from "@/components/folderTraffic/TrafficStatusDialog.vue";
import { URL_MAIN, accepted, httpMock, rejected, respond } from "@/stores/__tests__/catalogHttp";
import type { TrafficFile } from "@/types/traffic";

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

const file = { id_traffic: 4, code_traffic: "TR-00004", id_status: null } as TrafficFile;
let wrapper: VueWrapper | undefined;

beforeEach(() => {
  vi.clearAllMocks();
  setActivePinia(createPinia());
});
afterEach(() => wrapper?.unmount());

const vuetify = () => createVuetify({ components, directives });
const buttonNamed = (text: string) => [...document.body.querySelectorAll("button")].find((button) => button.textContent?.trim() === text)!;
const sent = (path: string) => httpMock.mock.calls.filter(([config]) => config.url === URL_MAIN + path).map(([config]) => config.data);

test("saving a file's status sends the chosen status and tells the list", async () => {
  respond({ "traffic/4/status": accepted([]) });
  wrapper = mount(TrafficStatusDialog, { props: { file }, global: { plugins: [vuetify()] }, attachTo: document.body });
  (wrapper.vm as unknown as { chosen: number }).chosen = 7;

  buttonNamed("Guardar estatus").click();
  await flushPromises();

  expect(sent("traffic/4/status")).toEqual([{ id_status: 7 }]);
  expect(wrapper.emitted("saved")).toHaveLength(1);
});

test("a refused status shows the server's reason and keeps the list as it was", async () => {
  respond({ "traffic/4/status": rejected("Este expediente ya se envió a Operaciones; su estatus ya no cambia.", "TMSGADV") });
  wrapper = mount(TrafficStatusDialog, { props: { file }, global: { plugins: [vuetify()] }, attachTo: document.body });

  buttonNamed("Guardar estatus").click();
  await flushPromises();

  expect(Swal.fire).toHaveBeenCalledWith(
    expect.objectContaining({ icon: "error", text: "Este expediente ya se envió a Operaciones; su estatus ya no cambia." }),
  );
  expect(wrapper.emitted("saved")).toBeUndefined();
});

async function openNumbering() {
  wrapper = mount(TrafficCorrelativeDialog, {
    props: { modelValue: false, "onUpdate:modelValue": (open: boolean) => wrapper!.setProps({ modelValue: open }) },
    global: { plugins: [vuetify()] },
    attachTo: document.body,
  });
  await wrapper.setProps({ modelValue: true });
  await flushPromises();
}

test("the numbering dialog tells the next file code", async () => {
  respond({ traffic_correlative: accepted([{ correlativo: null, last_used: 4, next_code: "TR-00005" }]) });

  await openNumbering();

  expect(document.body.textContent).toContain("TR-00005");
});

test("a start already used shows the server's reason and stays open", async () => {
  respond({
    traffic_correlative: accepted([{ correlativo: null, last_used: 4, next_code: "TR-00005" }]),
  });
  await openNumbering();
  httpMock.mockImplementation(async (config) =>
    config.method === "put"
      ? { data: rejected("El último expediente es TR-00004. El número inicial debe ser mayor.", "TMSGADV") }
      : { data: accepted([{ correlativo: null, last_used: 4, next_code: "TR-00005" }]) },
  );
  (wrapper!.vm as unknown as { start: number }).start = 3;

  buttonNamed("Guardar número inicial").click();
  await flushPromises();

  expect(document.body.textContent).toContain("El último expediente es TR-00004. El número inicial debe ser mayor.");
  expect((wrapper!.props() as { modelValue: boolean }).modelValue).toBe(true);
});

test("a start of zero is refused without asking the server", async () => {
  respond({ traffic_correlative: accepted([{ correlativo: null, last_used: 0, next_code: "TR-00001" }]) });
  await openNumbering();
  (wrapper!.vm as unknown as { start: number }).start = 0;

  buttonNamed("Guardar número inicial").click();
  await flushPromises();

  expect(httpMock.mock.calls.some(([config]) => config.method === "put")).toBe(false);
  expect(document.body.textContent).toContain("Escribe un número mayor que cero.");
});
