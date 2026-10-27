import { expect, test, vi } from "vitest";
import { flushPromises, mount } from "@vue/test-utils";
import { createPinia, setActivePinia } from "pinia";
import { createVuetify } from "vuetify";
import * as components from "vuetify/components";
import * as directives from "vuetify/directives";
import DataEmbarVer from "@/components/folderHouse/DataEmbarVer.vue";
import { useHousesStore } from "@/stores/houses";
import { useHouseEditStore } from "@/stores/houseEdit";

vi.mock("@/api/http", () => ({ default: vi.fn().mockResolvedValue({ data: { data: [] } }) }));
vi.mock("@/router", () => ({ default: { push: vi.fn() } }));
vi.mock("vue-router", () => ({ useRoute: () => ({ params: { id: "2892" } }), useRouter: () => ({ push: vi.fn() }) }));
vi.mock("sweetalert2", () => ({ default: { fire: vi.fn() } }));
globalThis.ResizeObserver ??= class {
  observe() {}
  unobserve() {}
  disconnect() {}
};

async function mountCard(editing: boolean) {
  const pinia = createPinia();
  setActivePinia(pinia);
  sessionStorage.setItem("dataUser", JSON.stringify([{ id_branch: 22 }]));
  useHousesStore().house = { shipment: "FCL", nro_viaje: "V12" } as never;
  const wrapper = mount(DataEmbarVer, {
    props: { editing },
    global: { plugins: [createVuetify({ components, directives }), pinia] },
  });
  await flushPromises();
  return wrapper;
}

const viajeInput = (wrapper: Awaited<ReturnType<typeof mountCard>>) =>
  wrapper.findAll(".v-text-field").find((field) => field.text().includes("Viaje"))!.find("input");

test("the viaje is read-only in view mode", async () => {
  const wrapper = await mountCard(false);
  expect(viajeInput(wrapper).attributes("readonly")).toBeDefined();
  wrapper.unmount();
});

test("the viaje is edited into the house edit form in edit mode", async () => {
  const wrapper = await mountCard(true);
  const input = viajeInput(wrapper);
  expect(input.attributes("readonly")).toBeUndefined();
  await input.setValue("V99");
  expect(useHouseEditStore().form.nro_viaje).toBe("V99");
  wrapper.unmount();
});
