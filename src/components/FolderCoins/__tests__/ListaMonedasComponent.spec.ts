import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { defineComponent } from "vue";
import { flushPromises, mount } from "@vue/test-utils";
import type { VueWrapper } from "@vue/test-utils";
import { createPinia, setActivePinia } from "pinia";
import Swal from "sweetalert2";
import { createVuetify } from "vuetify";
import * as components from "vuetify/components";
import * as directives from "vuetify/directives";
import ListaMonedasComponent from "@/components/FolderCoins/ListaMonedasComponent.vue";
import { accepted, httpMock, rejected } from "@/stores/__tests__/catalogHttp";

vi.mock("@/api/http", () => ({ default: vi.fn() }));
vi.mock("@/router", () => ({ default: { push: vi.fn() } }));
vi.mock("sweetalert2", () => ({ default: { fire: vi.fn() } }));

globalThis.ResizeObserver ??= class {
  observe() {}
  unobserve() {}
  disconnect() {}
};

const usd = { id: 1, code: "6001", symbol: "USD", acronym: "USD", name: "Dólares", description: "", status: 1 };
let wrapper: VueWrapper | undefined;

const answerWith = (saveAnswer: unknown) =>
  httpMock.mockImplementation(async (config) => ({ data: config.method === "put" ? saveAnswer : accepted([usd]) }));
const requestsTo = (endpoint: string) =>
  httpMock.mock.calls.map(([config]) => config).filter((config) => config.url.split("?")[0]!.endsWith(endpoint));

beforeEach(() => {
  vi.clearAllMocks();
  sessionStorage.setItem("dataUser", JSON.stringify([{ id_branch: 7 }]));
  vi.mocked(Swal.fire).mockResolvedValue({ isConfirmed: true } as never);
  answerWith(accepted([]));
});

afterEach(() => wrapper?.unmount());

const mountScreen = async () => {
  const pinia = createPinia();
  setActivePinia(pinia);
  wrapper = mount(
    defineComponent({ components: { ListaMonedasComponent }, template: "<v-app><ListaMonedasComponent /></v-app>" }),
    { global: { plugins: [createVuetify({ components, directives }), pinia] }, attachTo: document.body },
  );
  await flushPromises();
};

const buttonNamed = (name: string, within: ParentNode = document.body) =>
  [...within.querySelectorAll<HTMLElement>("button")].find((element) => element.textContent?.trim() === name)!;
const openDrawers = () => document.body.querySelectorAll<HTMLElement>(".v-navigation-drawer--active");

const typeInto = async (label: string, value: string) => {
  const field = [...openDrawers()[0]!.querySelectorAll(".v-text-field")].find(
    (element) => element.querySelector("label")?.textContent?.trim() === label,
  )!;
  const input = field.querySelector("input")!;
  input.value = value;
  input.dispatchEvent(new Event("input"));
  await flushPromises();
};

const editUsdName = async (name: string) => {
  await mountScreen();
  document.body.querySelector<HTMLElement>(".mdi-pencil")!.click();
  await flushPromises();
  await typeInto("Nombre (*)", name);
  buttonNamed("Aceptar", openDrawers()[0]!).click();
  await flushPromises();
};

test("a renamed currency is saved with its stored symbol and acronym and the panel closes", { timeout: 15_000 }, async () => {
  await editUsdName("Dólar americano");

  expect(requestsTo("actualizar_coins").map((config) => config.data)).toEqual([
    expect.objectContaining({ id: 1, symbol: "USD", acronym: "USD", name: "Dólar americano" }),
  ]);
  expect(openDrawers()).toHaveLength(0);
});

test("a refused change keeps the edit panel open with the reason", { timeout: 15_000 }, async () => {
  answerWith(rejected("No puedes inactivar esta moneda.", undefined));
  await editUsdName("Dólar americano");

  expect(Swal.fire).toHaveBeenCalledWith(expect.objectContaining({ text: "No puedes inactivar esta moneda." }));
  expect(openDrawers()).toHaveLength(1);
});

test("a name of only spaces is not sent", { timeout: 15_000 }, async () => {
  await editUsdName("   ");

  expect(requestsTo("actualizar_coins")).toHaveLength(0);
});

test("Filtrar can list the inactive currencies so they can be switched back on", { timeout: 15_000 }, async () => {
  await mountScreen();

  buttonNamed("Filtrar").click();
  await flushPromises();
  const filter = openDrawers()[0]!;
  [...filter.querySelectorAll<HTMLInputElement>("input[type=radio]")]
    .find((radio) => radio.closest(".v-radio")?.textContent?.includes("Inactivo"))!
    .click();
  await flushPromises();
  buttonNamed("Aceptar", filter).click();
  await flushPromises();

  const listings = requestsTo("listar_coins");
  expect(listings[listings.length - 1]!.url).toContain("status=0");
});
