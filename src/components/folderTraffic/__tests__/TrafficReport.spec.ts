import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { mount } from "@vue/test-utils";
import type { VueWrapper } from "@vue/test-utils";
import { createPinia } from "pinia";
import Swal from "sweetalert2";
import { createVuetify } from "vuetify";
import * as components from "vuetify/components";
import { VAutocomplete, VBtn, VRadio, VRadioGroup, VSelect } from "vuetify/components";
import * as directives from "vuetify/directives";
import FormatFecha from "@/components/comun/FormatFecha.vue";
import TrafficReport from "@/components/folderTraffic/TrafficReport.vue";
import { CONNECTION_ERROR_MESSAGE } from "@/utils/request";
import { accepted, flushPromises, httpMock, rejected, respond, URL_MAIN } from "@/stores/__tests__/catalogHttp";

vi.mock("@/api/http", () => ({ default: vi.fn() }));
vi.mock("sweetalert2", () => ({ default: { fire: vi.fn().mockResolvedValue({}), close: vi.fn(), showLoading: vi.fn() } }));
globalThis.ResizeObserver ??= class {
  observe() {}
  unobserve() {}
  disconnect() {}
};
Object.defineProperty(window, "visualViewport", {
  value: { width: 1024, height: 768, addEventListener() {}, removeEventListener() {} },
  configurable: true,
});

const IN_REVIEW = { id: 5, name: "En revisión", position: 1 };
const OPERATOR = { id: 33, namelong: "LUIS OPERADOR" };
let wrapper: VueWrapper | undefined;

beforeEach(() => {
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(new Date(2026, 10, 3));
  vi.mocked(Swal.fire).mockClear();
  httpMock.mockReset();
  respond({
    traffic_list: accepted([]),
    traffic_status: accepted([IN_REVIEW]),
    getEntitiesList: accepted([OPERATOR]),
    traffic_report_pdf: new Blob([JSON.stringify(rejected())], { type: "application/json" }),
  });
});

afterEach(() => {
  wrapper?.unmount();
  wrapper = undefined;
  vi.useRealTimers();
  document.body.innerHTML = "";
});

async function mountReport(actions = ["VER", "EXPORTAR"]) {
  sessionStorage.setItem("permissions", JSON.stringify({ screens: [{ route: "reportsTraffic", actions }], controlled: ["reportsTraffic"] }));
  sessionStorage.setItem("dataUser", JSON.stringify([{ id_branch: 1 }]));
  wrapper = mount(TrafficReport, {
    global: { plugins: [createVuetify({ components, directives }), createPinia()] },
    attachTo: document.body,
  });
  await flushPromises();
}

const button = (label: string) => wrapper!.findAllComponents(VBtn).find((candidate) => candidate.text() === label);

async function click(label: string) {
  await button(label)!.trigger("click");
  await flushPromises();
}

interface ChoiceField {
  props(key: string): unknown;
  setValue(value: unknown): Promise<void>;
}

async function choose(id: string, ...titles: string[]) {
  const fields = [...wrapper!.findAllComponents(VSelect), ...wrapper!.findAllComponents(VAutocomplete)] as unknown as ChoiceField[];
  const select = fields.find((candidate) => candidate.props("id") === id)!;
  const titleKey = select.props("itemTitle") as string;
  const valueKey = select.props("itemValue") as string;
  const items = select.props("items") as Record<string, unknown>[];
  const values = titles.map((title) => items.find((item) => item[titleKey] === title)![valueKey]);
  await select.setValue(select.props("multiple") ? values : values[0]);
}

async function chooseState(label: string) {
  const group = wrapper!.findComponent(VRadioGroup);
  const radio = group.findAllComponents(VRadio).find((candidate) => candidate.props("label") === label)!;
  await group.setValue(radio.props("value"));
}

async function type(label: string, day: string) {
  const field = wrapper!.findAllComponents(FormatFecha).find((candidate) => candidate.props("label") === label)!;
  field.vm.$emit("update:modelValue", day);
  await flushPromises();
}

const lastSent = (path: string) => {
  const sent = httpMock.mock.calls.map(([config]) => config).filter((config) => config.url === URL_MAIN + path);
  return sent[sent.length - 1]!;
};

test("choosing whole months searches from the first day of the earliest to the last day of the latest", async () => {
  await mountReport();
  await click("Filtrar");
  await choose("traffic-report-months", "Octubre 2026", "Agosto 2026");
  await click("Buscar");

  expect(lastSent("traffic_list").params).toMatchObject({ desde: "2026-08-01", hasta: "2026-10-31" });
});

test("a typed range is searched until months are chosen, then the months win", async () => {
  await mountReport();
  await click("Filtrar");
  await type("Desde", "2026-01-05");
  await type("Hasta", "2026-01-20");
  await click("Buscar");
  expect(lastSent("traffic_list").params).toMatchObject({ desde: "2026-01-05", hasta: "2026-01-20" });

  await click("Filtrar");
  await choose("traffic-report-months", "Octubre 2026");
  await click("Buscar");
  expect(lastSent("traffic_list").params).toMatchObject({ desde: "2026-10-01", hasta: "2026-10-31" });
});

test.each([
  ["Todos", null],
  ["Pendientes", "PENDING"],
  ["Enviados a operaciones", "SENT"],
])("the state %s searches with state %s", async (label, state) => {
  await mountReport();
  await click("Filtrar");
  await chooseState("Pendientes");
  await chooseState(label);
  await choose("traffic-report-status", "En revisión");
  await click("Buscar");

  expect(lastSent("traffic_list").params).toMatchObject({ state, status: 5 });
});

test("the PDF is exported with the same filters the screen searched", async () => {
  await mountReport();
  await click("Filtrar");
  await chooseState("Enviados a operaciones");
  await choose("traffic-report-months", "Septiembre 2026");
  await click("Buscar");
  await click("Exportar PDF");

  expect(lastSent("traffic_report_pdf").data).toEqual(lastSent("traffic_list").params);
  expect(lastSent("traffic_report_pdf").data).toMatchObject({ state: "SENT", desde: "2026-09-01", hasta: "2026-09-30" });
});

test("a sentido and a master's operator are searched and exported", async () => {
  await mountReport();
  await click("Filtrar");
  await choose("traffic-report-sentido", "Exportación");
  await choose("traffic-report-operator", "LUIS OPERADOR");
  await click("Buscar");
  await click("Exportar PDF");

  expect(lastSent("traffic_list").params).toMatchObject({ sentido: 2, id_operador: 33 });
  expect(lastSent("traffic_report_pdf").data).toMatchObject({ sentido: 2, id_operador: 33 });
});

test("the PDF is offered only with the Exportar permission", async () => {
  await mountReport(["VER"]);
  expect(button("Exportar PDF")).toBeUndefined();

  wrapper!.unmount();
  await mountReport(["VER", "EXPORTAR"]);
  expect(button("Exportar PDF")).toBeDefined();
});

test("a search the server cannot answer tells the user what happened", async () => {
  respond({ traffic_list: new Error("offline"), traffic_status: accepted([]) });
  await mountReport();

  expect(Swal.fire).toHaveBeenCalledWith({ icon: "error", text: CONNECTION_ERROR_MESSAGE });
});
