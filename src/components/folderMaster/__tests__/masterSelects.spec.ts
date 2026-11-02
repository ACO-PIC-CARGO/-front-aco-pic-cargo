import { expect, test, vi } from "vitest";
import { flushPromises, mount } from "@vue/test-utils";
import { createPinia, setActivePinia } from "pinia";
import { createVuetify } from "vuetify";
import * as components from "vuetify/components";
import * as directives from "vuetify/directives";
import DataGenMaster from "@/components/folderMaster/DataGenMaster.vue";
import DataEmbarMaster from "@/components/folderMaster/DataEmbarMaster.vue";
import { useAppStore } from "@/stores/app";
import { useMastersStore } from "@/stores/masters";

vi.mock("@/api/http", () => ({ default: vi.fn().mockResolvedValue({ data: { estadoflag: true, data: [] } }) }));
vi.mock("@/router", () => ({ default: { push: vi.fn(), currentRoute: { value: { params: {} } } } }));
vi.mock("vue-router", () => ({ useRoute: () => ({ name: "controlMasterEditar", params: {} }), useRouter: () => ({ push: vi.fn() }) }));
vi.mock("sweetalert2", () => ({ default: { fire: vi.fn() } }));
globalThis.ResizeObserver ??= class {
  observe() {}
  unobserve() {}
  disconnect() {}
};

const shownSelections = async (section: unknown, shipmentCode: string) => {
  const pinia = createPinia();
  setActivePinia(pinia);
  sessionStorage.setItem("dataUser", JSON.stringify([{ id_branch: 7 }]));
  const app = useAppStore();
  app.itemsShipment = [{ id: 2, code: shipmentCode }] as never;
  app.master_id_trasnport = { id: 2 } as never;
  app.master_id_agente = 0 as never;
  Object.assign(useMastersStore(), {
    master_id_operador: 0,
    master_id_coloader: 0,
    master_id_naviera: 0,
    master_id_motonave: 0,
    master_id_condicion: 0,
  });
  const wrapper = mount(section as never, {
    global: { plugins: [createVuetify({ components, directives }), pinia], stubs: { VOverlay: true } },
  });
  await flushPromises();
  const shown = wrapper
    .findAll(".v-autocomplete")
    .filter((input) => input.find(".v-autocomplete__selection-text").exists())
    .map((input) => `${input.find("label").text()}=${input.find(".v-autocomplete__selection-text").text()}`);
  wrapper.unmount();
  return shown.filter((pair) => /^(Operador|Agente|Coloader|Naviera|Motonave|Condición)=/.test(pair));
};

test.each([
  { section: DataGenMaster, shipment: "FCL" },
  { section: DataGenMaster, shipment: "LCL" },
  { section: DataEmbarMaster, shipment: "FCL" },
])("a master with none of its parties or freight condition chosen leaves those fields empty ($shipment)", async ({ section, shipment }) => {
  expect(await shownSelections(section, shipment)).toEqual([]);
});
