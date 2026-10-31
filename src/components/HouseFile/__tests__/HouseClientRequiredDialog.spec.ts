import { afterEach, beforeEach, expect, test, vi } from "vitest";
import type { Mock } from "vitest";
import { flushPromises, mount } from "@vue/test-utils";
import type { VueWrapper } from "@vue/test-utils";
import { createPinia, setActivePinia } from "pinia";
import { createVuetify } from "vuetify";
import * as components from "vuetify/components";
import * as directives from "vuetify/directives";
import { VAutocomplete } from "vuetify/components";
import Swal from "sweetalert2";
import http from "@/api/http";
import HouseClientRequiredDialog from "@/components/HouseFile/HouseClientRequiredDialog.vue";
import { useAppStore } from "@/stores/app";
import { useHousesStore } from "@/stores/houses";
import { useHouseEditStore } from "@/stores/houseEdit";
import { editFormFromHouse } from "@/components/HouseFile/houseEditForm";
import type { HouseDetalle } from "@/types/operaciones";

vi.mock("@/api/http", () => ({ default: vi.fn() }));
vi.mock("@/router", () => ({ default: { push: vi.fn() } }));
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

const httpMock = http as unknown as Mock<(config: Record<string, unknown>) => Promise<{ data: unknown }>>;
const house = { id: 2856, id_master: 77, id_consigner: null, id_proveedor: null, services: [], url_onedrive: "x" } as unknown as HouseDetalle;
let wrapper: VueWrapper | undefined;

beforeEach(() => {
  vi.clearAllMocks();
  sessionStorage.setItem("dataUser", JSON.stringify([{ id_branch: 22 }]));
  vi.mocked(Swal.fire).mockResolvedValue({ isConfirmed: true } as never);
});
afterEach(() => wrapper?.unmount());

async function openDialog() {
  const pinia = createPinia();
  setActivePinia(pinia);
  useHousesStore().house = house as never;
  useHouseEditStore().form = editFormFromHouse(house);
  useAppStore().clientes = [{ id: 31, namelong: "ACME SAC" }] as never;
  wrapper = mount(HouseClientRequiredDialog, {
    props: { modelValue: true },
    global: { plugins: [createVuetify({ components, directives }), pinia] },
    attachTo: document.body,
  });
  await flushPromises();
}

const save = async () => {
  [...document.body.querySelectorAll<HTMLButtonElement>("button")].find((button) => button.textContent?.includes("Guardar"))!.click();
  await flushPromises();
};

const pickClient = async () => {
  wrapper!.findComponent(VAutocomplete).vm.$emit("update:modelValue", 31);
  await flushPromises();
};

test("saves the chosen client and confirms it", async () => {
  httpMock.mockResolvedValue({ data: { estadoflag: true, mensaje: "Actualización correcta", tipomensaje: "TMSGINF" } });
  await openDialog();
  await pickClient();
  await save();

  const [config] = httpMock.mock.calls[0]!;
  expect(config).toMatchObject({ method: "put", url: "setHouseEdit", data: { id: 2856, id_consigner: 31 } });
  expect(vi.mocked(Swal.fire).mock.calls[0]![0]).toMatchObject({ icon: "success", text: "House actualizado éxitosamente" });
  expect(wrapper!.emitted("saved")).toHaveLength(1);
  expect(wrapper!.emitted("update:modelValue")).toEqual([[false]]);
});

test("stays open and explains a save the server refused", async () => {
  httpMock.mockResolvedValue({ data: { estadoflag: false, mensaje: "No encontramos ese expediente.", tipomensaje: "TMSGADV" } });
  await openDialog();
  await pickClient();
  await save();

  expect(document.body.textContent).toContain("No encontramos ese expediente.");
  expect(Swal.fire).not.toHaveBeenCalled();
  expect(wrapper!.emitted("saved")).toBeUndefined();
});

test("asks for a client before saving", async () => {
  await openDialog();
  await save();
  expect(document.body.textContent).toContain("Elige el cliente HBL para continuar.");
  expect(httpMock).not.toHaveBeenCalled();
});
