import { beforeEach, expect, test, vi } from "vitest";
import { flushPromises, mount } from "@vue/test-utils";
import type { VueWrapper } from "@vue/test-utils";
import { createPinia, setActivePinia } from "pinia";
import { createVuetify } from "vuetify";
import * as components from "vuetify/components";
import { VAutocomplete, VSwitch } from "vuetify/components";
import * as directives from "vuetify/directives";
import http from "@/api/http";
import EditUserComponent from "@/components/Users/EditUserComponent.vue";
import { useUserStore } from "@/stores/user";

vi.mock("@/api/http", () => ({ default: vi.fn() }));
vi.mock("@/router", () => ({ default: { push: vi.fn(), currentRoute: { value: { params: {} } } } }));
vi.mock("vue-router", () => ({ useRoute: () => ({ params: { id: "4" } }), useRouter: () => ({ push: vi.fn() }) }));
vi.mock("sweetalert2", () => ({ default: { fire: vi.fn().mockResolvedValue({ isConfirmed: true }) } }));
globalThis.ResizeObserver ??= class {
  observe() {}
  unobserve() {}
  disconnect() {}
};

const URL_MAIN = String(import.meta.env.VITE_URL_MAIN);
const branch = { id: 7, trade_name: "PIC LOGISTICA SAC", document: "20100000001", status: 1 };
const userDetail = (extra: Record<string, unknown> = {}) => ({
  id: 4,
  status: 1,
  id_document: 1,
  document: "12345678",
  names: "ANA",
  phone: "999888777",
  id_sex: 1,
  id_pais: 1,
  departamento: 1,
  positions: [
    { id: 10, id_position: 2, code: "02", name: "MASTER PRICING", status: false },
    { id: 11, id_position: 3, code: "03", name: "MASTER OPERATIVO", status: true },
    { id: 12, id_position: 4, code: "04", name: "MASTER ADMINISTRATIVO", status: true },
  ],
  sucursales: [{ id: 30, id_branch: 7, trade_name: "PIC LOGISTICA SAC", status: true }],
  ...extra,
});

const answer = (data: unknown[]) => ({ data: { estadoflag: true, mensaje: "ok", tipomensaje: "TMSGINF", data } });

const mountEditor = async (detail: Record<string, unknown>) => {
  vi.mocked(http).mockImplementation((async (config: { url: string }) => {
    const path = config.url.slice(URL_MAIN.length);
    if (path.startsWith("ver_usuario")) return answer([detail]);
    if (path.startsWith("CargarBranch")) return answer([branch]);
    return answer([]);
  }) as never);
  const pinia = createPinia();
  setActivePinia(pinia);
  const wrapper = mount(EditUserComponent, {
    global: { plugins: [createVuetify({ components, directives }), pinia], stubs: { VOverlay: true } },
  });
  await flushPromises();
  return wrapper;
};

const clickButton = async (wrapper: VueWrapper, name: string) => {
  await wrapper.findAll("button").find((button) => button.text().trim() === name)!.trigger("click");
  await flushPromises();
};

beforeEach(() => {
  sessionStorage.setItem("dataUser", JSON.stringify([{ id_branch: 7, id_user: 4 }]));
});

test("removing a role removes that role, even when an earlier role is hidden", async () => {
  const wrapper = await mountEditor(userDetail());
  await wrapper.findAll(".v-tab").find((tab) => tab.text().includes("Módulos a Usar"))!.trigger("click");
  await flushPromises();

  const row = wrapper.findAll("tr").find((tableRow) => tableRow.text().includes("MASTER ADMINISTRATIVO"))!;
  await row.find("button").trigger("click");

  const statusByCode = Object.fromEntries(useUserStore().positions.map((role) => [role.code, role.status]));
  expect(statusByCode).toEqual({ "02": false, "03": true, "04": false });
  wrapper.unmount();
});

test("a role added and removed before saving is not sent at all", async () => {
  const wrapper = await mountEditor(userDetail());
  await wrapper.findAll(".v-tab").find((tab) => tab.text().includes("Módulos a Usar"))!.trigger("click");
  await flushPromises();
  const picker = wrapper.findAllComponents(VAutocomplete).find((field) => field.props("label") === "Posición")!;
  picker.vm.$emit("update:modelValue", { id: 5, code: "05", name: "MASTER SISTEMA", estado: true });
  await flushPromises();
  await clickButton(wrapper, "Agregar");

  const row = wrapper.findAll("tr").find((tableRow) => tableRow.text().includes("MASTER SISTEMA"))!;
  await row.find("button").trigger("click");

  expect(useUserStore().positions.map((role) => role.code)).toEqual(["02", "03", "04"]);
  wrapper.unmount();
});

test("the Activo switch sends the numbers the API stores, so a user can be switched off and back on", async () => {
  const wrapper = await mountEditor(userDetail());
  const statusSwitch = wrapper.findComponent(VSwitch).find("input");
  const toggle = async () => {
    await statusSwitch.trigger("click");
    await statusSwitch.trigger("input");
  };

  await toggle();
  expect(useUserStore().model.status).toBe(0);

  await toggle();
  expect(useUserStore().model.status).toBe(1);
  wrapper.unmount();
});

test("a branch added in Editar is sent with its branch id, and removing it before saving drops it", async () => {
  const wrapper = await mountEditor(userDetail({ sucursales: [] }));
  await clickButton(wrapper, "Guardar");

  const picker = wrapper.findAllComponents(VAutocomplete).find((field) => field.props("label") === "Sucursal")!;
  picker.vm.$emit("update:modelValue", branch);
  await flushPromises();
  await clickButton(wrapper, "Agregar");

  const store = useUserStore();
  expect(store.sucursales).toEqual([expect.objectContaining({ id_branch: 7, status: true })]);

  const row = wrapper.findAll("tr").find((tableRow) => tableRow.text().includes("PIC LOGISTICA SAC"))!;
  await row.find("button").trigger("click");
  expect(store.sucursales).toEqual([]);
  wrapper.unmount();
});
