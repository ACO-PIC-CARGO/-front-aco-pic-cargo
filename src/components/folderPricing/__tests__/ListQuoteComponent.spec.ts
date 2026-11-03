import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { defineComponent } from "vue";
import { flushPromises, mount } from "@vue/test-utils";
import type { VueWrapper } from "@vue/test-utils";
import { createPinia, setActivePinia } from "pinia";
import Swal from "sweetalert2";
import { createVuetify } from "vuetify";
import * as components from "vuetify/components";
import * as directives from "vuetify/directives";
import ListQuoteComponent from "@/components/folderPricing/ListQuoteComponent.vue";
import { URL_MAIN, accepted, httpMock } from "@/stores/__tests__/catalogHttp";

const push = vi.hoisted(() => vi.fn());
vi.mock("vue-router", () => ({ useRouter: () => ({ push }), useRoute: () => ({ params: {} }) }));
vi.mock("@/api/http", () => ({ default: Object.assign(vi.fn(), { post: vi.fn(), get: vi.fn() }) }));
vi.mock("@/router", () => ({ default: { push: vi.fn(), currentRoute: { value: { params: {} } } } }));
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

const APPROVED = { id: 5, codigo: "Q-5", nombres: "APROBADA SAC", statusmain: 1, statusquote: 7, aprobadoflag: true };
const DRAFT = { id: 6, codigo: "Q-6", nombres: "BORRADOR SAC", statusmain: 1, statusquote: 3, aprobadoflag: false };
const DELETED = { id: 7, codigo: "Q-7", nombres: "ELIMINADA SAC", statusmain: 0, statusquote: 3, aprobadoflag: false, status: "ELIMINADO" };
let wrapper: VueWrapper | undefined;

const listAnswer = (total: number) => accepted([APPROVED, DRAFT, DELETED].map((row) => ({ ...row, totalregistro: String(total) })));
const answerWith = (answers: Record<string, unknown>) =>
  httpMock.mockImplementation(async (config) => {
    const path = config.url.slice(URL_MAIN.length).split("?")[0]!;
    return { data: answers[path] ?? (path === "getQuoteList" ? listAnswer(3) : accepted([])) };
  });
const requestsTo = (path: string) => httpMock.mock.calls.filter(([config]) => config.url === URL_MAIN + path);

beforeEach(() => {
  vi.clearAllMocks();
  sessionStorage.setItem("dataUser", JSON.stringify([{ id: 4, id_branch: 1 }]));
  vi.mocked(Swal.fire).mockResolvedValue({ isConfirmed: true } as never);
  answerWith({});
});
afterEach(() => wrapper?.unmount());

const mountList = async () => {
  const pinia = createPinia();
  setActivePinia(pinia);
  wrapper = mount(defineComponent({ components: { ListQuoteComponent }, template: "<v-app><ListQuoteComponent /></v-app>" }), {
    global: { plugins: [createVuetify({ components, directives }), pinia] },
    attachTo: document.body,
  });
  await flushPromises();
  httpMock.mockClear();
};
const rowOf = (client: string) => [...document.body.querySelectorAll("tr")].find((row) => row.textContent?.includes(client))!;
const actionIn = (row: HTMLElement, label: string) => row.querySelector<HTMLElement>(`button[aria-label="${label}"]`);
const click = async (element: HTMLElement) => {
  element.click();
  await flushPromises();
};
const callDialog = () => document.body.querySelector<HTMLElement>(".v-overlay--active .v-card");
const searchField = () =>
  [...document.body.querySelectorAll(".v-text-field")].find((field) => field.querySelector("label")?.textContent === "Buscar")!
    .querySelector("input")!;
const lastListParams = () => {
  const requests = requestsTo("getQuoteList");
  return requests[requests.length - 1]![0].params;
};

test("the table counts every quote the server found and asks the server for the page the user moves to", async () => {
  answerWith({ getQuoteList: listAnswer(30) });
  await mountList();

  expect(document.body.querySelector(".v-data-table-footer")!.textContent).toContain("1-10 of 30");

  await click(document.body.querySelector<HTMLElement>('button[aria-label="Next page"]')!);

  expect(lastListParams()).toMatchObject({ pagina: 2, limit: 10 });
  expect(requestsTo("resumen_por_estado")).toHaveLength(0);
});

test("a search goes to the server once the user stops typing, from the first page, without recounting the totals", async () => {
  answerWith({ getQuoteList: listAnswer(30) });
  await mountList();
  await click(document.body.querySelector<HTMLElement>('button[aria-label="Next page"]')!);
  httpMock.mockClear();
  vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout", "Date"] });
  const field = searchField();

  field.value = "ACME";
  field.dispatchEvent(new Event("input"));
  vi.advanceTimersByTime(400);
  expect(requestsTo("getQuoteList")).toHaveLength(0);

  vi.advanceTimersByTime(100);
  await flushPromises();

  expect(requestsTo("getQuoteList")).toHaveLength(1);
  expect(lastListParams()).toMatchObject({ search: "ACME", pagina: 1 });
  expect(requestsTo("resumen_por_estado")).toHaveLength(0);
  vi.useRealTimers();
});

test("a deleted quote can only be looked at: it says it was deleted and offers no action", async () => {
  await mountList();

  expect(rowOf("ELIMINADA SAC").textContent).toContain("Eliminada");
  expect(rowOf("ELIMINADA SAC").querySelectorAll("button")).toHaveLength(0);
  expect(actionIn(rowOf("BORRADOR SAC"), "Ver cotización")).not.toBeNull();
});

test("editing an approved quote opens the editor, which asks for an administrator", async () => {
  await mountList();

  await click(actionIn(rowOf("APROBADA SAC"), "Editar cotización")!);

  expect(push).toHaveBeenCalledWith({ name: "editQuote", params: { id: 5 } });
});

test("an approved quote offers no delete", async () => {
  await mountList();

  expect(actionIn(rowOf("APROBADA SAC"), "Eliminar cotización")).toBeNull();
  expect(actionIn(rowOf("BORRADOR SAC"), "Eliminar cotización")).not.toBeNull();
});

test("a delete the server refuses is not reported as done, and the list and its totals reload", async () => {
  answerWith({ delQuote: { estadoflag: false, mensaje: "No se pudo eliminar.", tipomensaje: "TMSGERR" } });
  await mountList();

  await click(actionIn(rowOf("BORRADOR SAC"), "Eliminar cotización")!);

  expect(Swal.fire).toHaveBeenCalledWith(expect.objectContaining({ icon: "error", text: "No se pudo eliminar." }));
  expect(Swal.fire).not.toHaveBeenCalledWith(expect.objectContaining({ icon: "success" }));
  expect(requestsTo("getQuoteList")).toHaveLength(1);
  expect(requestsTo("resumen_por_estado")).toHaveLength(1);
});

test("the call dialog stays open until the call is saved, then the list and its totals reload", async () => {
  answerWith({ setCalls: { estadoflag: false, mensaje: "No pudimos guardar la llamada.", tipomensaje: "TMSGERR" } });
  await mountList();
  await click(actionIn(rowOf("BORRADOR SAC"), "Registrar llamada")!);
  const description = callDialog()!.querySelectorAll("input")[1]!;
  description.value = "Cliente pidió más tiempo";
  description.dispatchEvent(new Event("input"));
  await flushPromises();

  await click([...callDialog()!.querySelectorAll<HTMLElement>("button")].find((button) => button.textContent?.trim() === "Aceptar")!);

  expect(callDialog()).not.toBeNull();
  expect(requestsTo("resumen_por_estado")).toHaveLength(0);

  answerWith({ setCalls: accepted([]) });
  await click([...callDialog()!.querySelectorAll<HTMLElement>("button")].find((button) => button.textContent?.trim() === "Aceptar")!);

  const saved = requestsTo("setCalls");
  expect(saved[saved.length - 1]![0].data).toMatchObject({ id_quote: 6, comentario: "Cliente pidió más tiempo", id_status: 3 });
  expect(callDialog()).toBeNull();
  expect(requestsTo("resumen_por_estado")).toHaveLength(1);
});

test("a call on an approved quote offers no status change", async () => {
  await mountList();
  await click(actionIn(rowOf("APROBADA SAC"), "Registrar llamada")!);

  expect(callDialog()!.textContent).not.toContain("ESTADO DE LA COTIZACIÓN");
});
