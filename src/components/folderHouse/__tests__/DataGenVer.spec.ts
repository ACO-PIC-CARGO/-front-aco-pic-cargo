import { expect, test, vi } from "vitest";
import { flushPromises, mount } from "@vue/test-utils";
import { createPinia, setActivePinia } from "pinia";
import { createVuetify } from "vuetify";
import * as components from "vuetify/components";
import * as directives from "vuetify/directives";
import DataGenVer from "@/components/folderHouse/DataGenVer.vue";
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
  useHousesStore().house = { shipment: "LCL", bultos: 5 } as never;
  const wrapper = mount(DataGenVer, {
    props: { editing },
    global: { plugins: [createVuetify({ components, directives }), pinia] },
  });
  await flushPromises();
  return wrapper;
}

const bultosInput = (wrapper: Awaited<ReturnType<typeof mountCard>>) =>
  wrapper.findAll(".v-text-field").find((field) => field.text().includes("Bultos"))!.find("input");

test("bultos are read-only in view mode", async () => {
  const wrapper = await mountCard(false);
  expect(bultosInput(wrapper).attributes("readonly")).toBeDefined();
  wrapper.unmount();
});

test("bultos are edited into the house edit form in edit mode", async () => {
  const wrapper = await mountCard(true);
  const input = bultosInput(wrapper);
  expect(input.attributes("readonly")).toBeUndefined();
  await input.setValue("8");
  expect(useHouseEditStore().form.bultos).toBe(8);
  wrapper.unmount();
});

test("the customs quote of a house that already has one is never editable", async () => {
  const pinia = createPinia();
  setActivePinia(pinia);
  sessionStorage.setItem("dataUser", JSON.stringify([{ id_branch: 22 }]));
  useHousesStore().house = { shipment: "LCL", id_cot: 1, id_quoteaduana: 3 } as never;
  const wrapper = mount(DataGenVer, {
    props: { editing: true },
    global: { plugins: [createVuetify({ components, directives }), pinia] },
  });
  await flushPromises();
  const quote = wrapper.findAll(".v-autocomplete").find((field) => field.text().includes("Quote aduana"))!;
  expect(quote.classes()).toContain("v-input--readonly");
  wrapper.unmount();
});
