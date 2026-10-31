import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { defineComponent } from "vue";
import { flushPromises, mount } from "@vue/test-utils";
import type { VueWrapper } from "@vue/test-utils";
import { createPinia, setActivePinia } from "pinia";
import Swal from "sweetalert2";
import { createVuetify } from "vuetify";
import * as components from "vuetify/components";
import * as directives from "vuetify/directives";
import ListaTiposTelefonoComponent from "@/components/FolderTypePhone/ListaTiposTelefonoComponent.vue";
import { accepted, httpMock, rejected, respond, URL_MAIN } from "@/stores/__tests__/catalogHttp";

vi.mock("@/api/http", () => ({ default: vi.fn() }));
vi.mock("@/router", () => ({ default: { push: vi.fn() } }));
vi.mock("vue-router", () => ({ useRouter: () => ({ go: vi.fn() }) }));
vi.mock("sweetalert2", () => ({ default: { fire: vi.fn() } }));

globalThis.ResizeObserver ??= class {
  observe() {}
  unobserve() {}
  disconnect() {}
};

const reload = vi.fn();
let wrapper: VueWrapper | undefined;

beforeEach(() => {
  vi.clearAllMocks();
  vi.stubGlobal("location", { reload });
  sessionStorage.setItem("dataUser", JSON.stringify([{ id_branch: 7 }]));
  vi.mocked(Swal.fire).mockResolvedValue({ isConfirmed: true } as never);
  respond({ getListTypePhone: accepted([{ id: 3, code: "MOV", name: "Móvil", status: 1 }]), insertTypePhone: accepted([]) });
});

afterEach(() => {
  wrapper?.unmount();
  vi.unstubAllGlobals();
});

const buttonNamed = (name: string, within: ParentNode = document.body) =>
  [...within.querySelectorAll<HTMLElement>("button")].find((button) => button.textContent?.trim() === name)!;
const activeDrawers = () => document.body.querySelectorAll(".v-navigation-drawer--active");
const fieldIn = (drawer: Element, label: string) =>
  [...drawer.querySelectorAll(".v-text-field")]
    .find((field) => field.querySelector("label")?.textContent?.trim() === label)!
    .querySelector("input")!;

const mountList = async () => {
  const pinia = createPinia();
  setActivePinia(pinia);
  wrapper = mount(
    defineComponent({ components: { ListaTiposTelefonoComponent }, template: "<v-app><ListaTiposTelefonoComponent /></v-app>" }),
    { global: { plugins: [createVuetify({ components, directives }), pinia] }, attachTo: document.body },
  );
  await flushPromises();
};
const stillLoading = () =>
  [...document.body.querySelectorAll(".v-col")].some(
    (column) => column.textContent!.includes("Cargando información") && !column.closest(".v-navigation-drawer"),
  );

test("the list shows the phone types it loads", { timeout: 15_000 }, async () => {
  await mountList();

  expect(stillLoading()).toBe(false);
  expect([...document.body.querySelectorAll("tbody tr")].map((row) => row.textContent)).toEqual([
    expect.stringContaining("Móvil"),
  ]);
});

test("a rejected list shows its message and stops loading", { timeout: 15_000 }, async () => {
  respond({ getListTypePhone: rejected("No se encontraron registros") });

  await mountList();

  expect(vi.mocked(Swal.fire).mock.calls[0]![0]).toMatchObject({ icon: "error", text: "No se encontraron registros" });
  expect(stillLoading()).toBe(false);
});

test("a saved phone type closes the panel, empties the form and reloads only the list", { timeout: 15_000 }, async () => {
  await mountList();
  buttonNamed("Nuevo").click();
  await flushPromises();
  const code = fieldIn(activeDrawers()[0]!, "Código (*)");
  code.value = "FAX";
  code.dispatchEvent(new Event("input"));
  await flushPromises();
  httpMock.mockClear();

  buttonNamed("Registrar", activeDrawers()[0]!).click();
  await flushPromises();

  expect(httpMock.mock.calls.map(([config]) => config.url.slice(URL_MAIN.length).split("?")[0])).toEqual([
    "insertTypePhone",
    "getListTypePhone",
  ]);
  expect(reload).not.toHaveBeenCalled();
  expect(activeDrawers()).toHaveLength(0);
  buttonNamed("Nuevo").click();
  await flushPromises();
  expect(fieldIn(activeDrawers()[0]!, "Código (*)").value).toBe("");
});
