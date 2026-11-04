import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { flushPromises, mount } from "@vue/test-utils";
import type { VueWrapper } from "@vue/test-utils";
import { createPinia, setActivePinia } from "pinia";
import { createVuetify } from "vuetify";
import * as components from "vuetify/components";
import * as directives from "vuetify/directives";
import VerHouse from "@/views/folderHouse/VerHouse.vue";
import { useHousesStore } from "@/stores/houses";

interface Call {
  url: string;
  method?: string;
  data?: Record<string, unknown>;
  params?: Record<string, unknown>;
}

const http = vi.hoisted(() => Object.assign(vi.fn(), { put: vi.fn(), get: vi.fn(), post: vi.fn() }));
const route = vi.hoisted(() => ({ name: "controlHouseEditar", params: { id: "9" }, meta: {} }));

vi.mock("@/api/http", () => ({ default: http }));
vi.mock("@/router", () => ({ default: { push: vi.fn() } }));
vi.mock("vue-router", () => ({ useRouter: () => ({ push: vi.fn(), replace: vi.fn() }), useRoute: () => route }));
vi.mock("sweetalert2", () => ({ default: { fire: vi.fn().mockResolvedValue({}) } }));
vi.setConfig({ testTimeout: 30000 });
globalThis.ResizeObserver ??= class {
  observe() {}
  unobserve() {}
  disconnect() {}
};
Object.defineProperty(window, "visualViewport", {
  value: { width: 1024, height: 768, addEventListener() {}, removeEventListener() {} },
  configurable: true,
});

const SECTIONS = {
  dataGen: true,
  dataEmbar: true,
  HouseStepList: true,
  ClientTrackingPreview: true,
  HouseCustomsCard: true,
  HouseMasterDates: true,
  HouseArrivalNoticeDialog: true,
  HouseClientRequiredDialog: true,
};
const FLETE = { id: 31, id_house: 9, nameservice: "FLETE", status: 1, created_at: "2026-11-01T10:00:00", updated_at: "2026-11-02T10:00:00" };
const DESCARGA = { ...FLETE, id: 40, nameservice: "DESCARGA" };
const HOUSE = {
  id: 9,
  id_master: 5,
  nro_hbl: "H-9",
  modality: "Importación",
  id_modality: 1,
  id_shipment: 2,
  id_incoterms: 3,
  id_consigner: 11,
  id_proveedor: 12,
  telexconfirmado: false,
  fechaconfirmaciontelex: null,
  services: [FLETE],
};
const ok = (data: unknown) => ({ data: { estadoflag: true, mensaje: "ok", tipomensaje: "TMSGSUC", token: "tok", data } });

let servicesInDb: unknown[] | Error = [FLETE];
let wrapper: VueWrapper | undefined;

beforeEach(() => {
  vi.clearAllMocks();
  document.body.innerHTML = "";
  servicesInDb = [FLETE];
  sessionStorage.setItem("dataUser", JSON.stringify([{ id_branch: 7, id: 4 }]));
  sessionStorage.setItem(
    "permissions",
    JSON.stringify({ screens: [{ route: "listHouse", actions: ["VER", "NUEVO", "MODIFICAR", "ELIMINAR"] }], controlled: ["listHouse"] }),
  );
  http.mockImplementation(async (config: Call) => {
    if (config.url.includes("house_ver")) return ok([{ ...HOUSE, services: servicesInDb instanceof Error ? [FLETE] : servicesInDb }]);
    if (config.url.includes("getHouseServices")) {
      if (servicesInDb instanceof Error) throw servicesInDb;
      return ok(servicesInDb);
    }
    return ok([]);
  });
  http.put.mockResolvedValue(ok([]));
  http.get.mockResolvedValue(ok([]));
  http.post.mockResolvedValue(ok([]));
});
afterEach(() => wrapper?.unmount());

async function openHouse(routeName: string) {
  route.name = routeName;
  const pinia = createPinia();
  setActivePinia(pinia);
  wrapper = mount(VerHouse, {
    global: { plugins: [createVuetify({ components, directives }), pinia], stubs: SECTIONS },
    attachTo: document.body,
  });
  await flushPromises();
}

const calls = (path: string) => http.mock.calls.map(([config]) => config as Call).filter((config) => config.url.includes(path));
const button = (text: string) =>
  [...document.body.querySelectorAll("button")].find((element) => (element.textContent ?? "").trim() === text);
const switchIn = (text: string) =>
  [...document.body.querySelectorAll<HTMLElement>("tr, .v-card")]
    .filter((element) => (element.textContent ?? "").includes(text))
    .pop()!
    .querySelector<HTMLInputElement>("input[type=checkbox]")!;

async function save() {
  button("Guardar cambios")!.click();
  await flushPromises();
}

test("confirming the BL telex from the house edit screen saves the confirmation and its date", async () => {
  await openHouse("controlHouseEditar");

  switchIn("BL TELEXT").click();
  await flushPromises();
  useHousesStore().fechaconfirmaciontelex = "2026-11-04";
  await flushPromises();
  button("Confirmar Telex")!.click();
  await flushPromises();

  expect(http.put).toHaveBeenCalledWith(
    expect.stringContaining("houses_confirmar_telex"),
    { id: "9", telexconfirmado: true, fechaconfirmaciontelex: "2026-11-04" },
    expect.anything(),
  );
});

test("saving the house keeps the service switches the user changed", async () => {
  await openHouse("controlHouseEditar");

  switchIn("FLETE").click();
  await flushPromises();
  await save();

  const [saved] = calls("setHouseEdit");
  expect(saved!.data!.lstservices).toEqual([{ id: 31, id_begend: null, nameservice: "FLETE", status: 0, date_service: null }]);
});

test("the house is not saved when its services could not be loaded", async () => {
  servicesInDb = new Error("Network Error");
  await openHouse("controlHouseEditar");

  await save();

  expect(calls("setHouseEdit")).toEqual([]);
});

test("saving after a quote added services to the house keeps those services", async () => {
  servicesInDb = [];
  await openHouse("controlHouseEditar");

  servicesInDb = [DESCARGA];
  await useHousesStore().verHouse({ id: 9 });
  await flushPromises();
  await save();

  const [saved] = calls("setHouseEdit");
  expect(saved!.data!.lstservices).toEqual([expect.objectContaining({ id: 40, nameservice: "DESCARGA" })]);
});

test.each(["controlHouseVer", "controlHouseEditar"])(
  "the house screen (%s) loads this house's bitácora and the statuses for its modality, shipment and incoterm",
  async (routeName) => {
    await openHouse(routeName);

    expect(calls("getHouseBitacora").map((config) => config.data!.id)).toContain("9");
    expect(calls("getBitacoraLineal").map((config) => config.params)).toContainEqual({ id_modalidad: 1, id_shipment: 2, id_incoterms: 3 });
  },
);
