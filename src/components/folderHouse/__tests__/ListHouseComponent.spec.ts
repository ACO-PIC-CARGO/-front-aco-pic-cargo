import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { flushPromises, mount } from "@vue/test-utils";
import type { VueWrapper } from "@vue/test-utils";
import { createPinia, setActivePinia } from "pinia";
import { createVuetify } from "vuetify";
import * as components from "vuetify/components";
import * as directives from "vuetify/directives";
import { VAutocomplete, VTextarea } from "vuetify/components";
import ListHouseComponent from "@/components/folderHouse/ListHouseComponent.vue";
import { URL_MAIN, accepted, httpMock } from "@/stores/__tests__/catalogHttp";

vi.mock("@/api/http", () => ({ default: vi.fn() }));
vi.mock("@/router", () => ({ default: { push: vi.fn(), currentRoute: { value: { name: "listHouse" } } } }));
vi.mock("vue-router", () => ({ useRouter: () => ({ push: vi.fn() }) }));
vi.mock("sweetalert2", () => ({ default: { fire: vi.fn().mockResolvedValue({}) } }));
globalThis.ResizeObserver ??= class {
  observe() {}
  unobserve() {}
  disconnect() {}
};
Object.defineProperty(window, "visualViewport", {
  value: { width: 1024, height: 768, addEventListener() {}, removeEventListener() {} },
  configurable: true,
});

const SESSION_ENTITY_ID = 4;
const EXECUTIVES = [
  { id_branch: 22, id_entitie: SESSION_ENTITY_ID, status: 1, name: "ANA SESION" },
  { id_branch: 23, id_entitie: 12, status: 1, name: "LUIS VENTAS" },
];
const HOUSE = { id: 31, id_master: 7, code_house: "H-31", list_comentarios: [], status: 1 };
let wrapper: VueWrapper | undefined;
let bodies: Record<string, unknown>;

beforeEach(() => {
  vi.clearAllMocks();
  sessionStorage.setItem("dataUser", JSON.stringify([{ id_branch: 22, id: SESSION_ENTITY_ID }]));
  bodies = {
    listado_houses: accepted([HOUSE]),
    getModulesEntities: accepted(EXECUTIVES),
    insertComentarioHouse: accepted([]),
  };
  httpMock.mockImplementation(async (config) => {
    const path = config.url.slice(URL_MAIN.length).split("?")[0]!;
    return { data: bodies[path] ?? accepted([]) };
  });
});
afterEach(() => wrapper?.unmount());

async function openList(config: { errorHandler?: (error: unknown) => void } = {}) {
  const pinia = createPinia();
  setActivePinia(pinia);
  wrapper = mount(ListHouseComponent, {
    global: { plugins: [createVuetify({ components, directives }), pinia], config },
    attachTo: document.body,
  });
  await flushPromises();
}

async function openCommentDialog() {
  await openList();
  await wrapper!.find(".mdi-chat-plus").trigger("click");
  await flushPromises();
}

const executiveSelector = () => wrapper!.findAllComponents(VAutocomplete).find((field) => field.props("label") === "Ejecutivo")!;

async function saveComment(text: string) {
  wrapper!.findComponent(VTextarea).vm.$emit("update:modelValue", text);
  await flushPromises();
  [...document.body.querySelectorAll<HTMLButtonElement>("button")].find((button) => button.textContent?.includes("Guardar"))!.click();
  await flushPromises();
}

const sentComments = () =>
  httpMock.mock.calls.map(([config]) => config).filter((config) => config.url === URL_MAIN + "insertComentarioHouse");

test("offers the company's executives with the session user already chosen as the author", async () => {
  await openCommentDialog();

  expect(executiveSelector().props("items")).toEqual(EXECUTIVES);
  expect(executiveSelector().props("modelValue")).toBe(SESSION_ENTITY_ID);

  await saveComment("Llegó a puerto");
  expect(sentComments()[0]!.data).toMatchObject({ id_house: 31, id_entities: SESSION_ENTITY_ID, comentario: "Llegó a puerto" });
});

test("sends the executive the writer picks as the comment's author", async () => {
  await openCommentDialog();

  executiveSelector().vm.$emit("update:modelValue", 12);
  await saveComment("Sigue en aduana");

  expect(sentComments()).toHaveLength(1);
  expect(sentComments()[0]!.data).toMatchObject({ id_house: 31, id_entities: 12, comentario: "Sigue en aduana" });
});

test("expanding a house that has no comments does not break the list", async () => {
  bodies.listado_houses = accepted([{ ...HOUSE, list_comentarios: null }]);
  const errors: unknown[] = [];
  await openList({ errorHandler: (error) => errors.push(error) });

  await wrapper!.find("tbody tr").trigger("click");
  await flushPromises();

  expect(errors).toEqual([]);
});
