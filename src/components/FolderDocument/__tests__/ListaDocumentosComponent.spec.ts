import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { defineComponent } from "vue";
import { flushPromises, mount } from "@vue/test-utils";
import type { VueWrapper } from "@vue/test-utils";
import { createPinia, setActivePinia } from "pinia";
import Swal from "sweetalert2";
import { createVuetify } from "vuetify";
import * as components from "vuetify/components";
import * as directives from "vuetify/directives";
import ListaDocumentosComponent from "@/components/FolderDocument/ListaDocumentosComponent.vue";
import { useDocumentStore } from "@/stores/document";
import { accepted, httpMock, respond } from "@/stores/__tests__/catalogHttp";

vi.mock("@/api/http", () => ({ default: vi.fn() }));
vi.mock("@/router", () => ({ default: { push: vi.fn() } }));
vi.mock("sweetalert2", () => ({ default: { fire: vi.fn() } }));

globalThis.ResizeObserver ??= class {
  observe() {}
  unobserve() {}
  disconnect() {}
};

const viewedDocument = { id: 5, code: "05", name: "Pasaporte", description: "Pasaporte extranjero", status: 0 };
let wrapper: VueWrapper | undefined;

beforeEach(() => {
  vi.clearAllMocks();
  sessionStorage.setItem("dataUser", JSON.stringify([{ id_branch: 7 }]));
  vi.mocked(Swal.fire).mockResolvedValue({ isConfirmed: true } as never);
  respond({ listar_documents: accepted([]), insertar_documents: accepted([]) });
});

afterEach(() => wrapper?.unmount());

const mountScreen = async () => {
  const pinia = createPinia();
  setActivePinia(pinia);
  useDocumentStore().record = viewedDocument;
  wrapper = mount(
    defineComponent({ components: { ListaDocumentosComponent }, template: "<v-app><ListaDocumentosComponent /></v-app>" }),
    { global: { plugins: [createVuetify({ components, directives }), pinia] }, attachTo: document.body },
  );
  await flushPromises();
};

const openNew = async () => {
  [...document.body.querySelectorAll<HTMLElement>("button")].find((button) => button.textContent?.trim() === "Nuevo")!.click();
  await flushPromises();
};

const typeInto = async (label: string, value: string) => {
  const input = [...document.body.querySelectorAll(".v-navigation-drawer--active .v-text-field")]
    .find((field) => field.querySelector("label")?.textContent?.trim() === label)!
    .querySelector("input")!;
  input.value = value;
  input.dispatchEvent(new Event("input"));
  await flushPromises();
};

const acceptButton = () =>
  [...document.body.querySelectorAll<HTMLElement>(".v-navigation-drawer--active button")].find(
    (button) => button.textContent?.trim() === "Aceptar",
  )!;

const inserts = () => httpMock.mock.calls.filter(([config]) => config.url.endsWith("insertar_documents"));
const listRequests = () => httpMock.mock.calls.filter(([config]) => config.url.includes("listar_documents?")).length;

test("opening Nuevo does not ask the server for the list again", async () => {
  await mountScreen();
  const before = listRequests();

  await openNew();

  expect(listRequests()).toBe(before);
});

test("Nuevo starts an empty, active document type even after viewing another one", async () => {
  await mountScreen();

  await openNew();
  await typeInto("Nombre (Descripción Corta) (*)", "CE");
  await typeInto("Descripción Larga (*)", "Carné de extranjería");
  acceptButton().click();
  await flushPromises();

  expect(inserts().map(([config]) => config.data)).toEqual([
    expect.objectContaining({ name: "CE", description: "Carné de extranjería", status: 1 }),
  ]);
});

test("Aceptar saves a new document type once and closes the drawer", async () => {
  await mountScreen();

  await openNew();
  await typeInto("Nombre (Descripción Corta) (*)", "CE");
  await typeInto("Descripción Larga (*)", "Carné de extranjería");
  const accept = acceptButton();
  accept.click();
  accept.click();
  await flushPromises();
  await new Promise((resolve) => setTimeout(resolve, 50));
  await flushPromises();

  expect(inserts()).toHaveLength(1);
  expect(document.body.querySelector(".v-navigation-drawer--active")).toBeNull();
});
