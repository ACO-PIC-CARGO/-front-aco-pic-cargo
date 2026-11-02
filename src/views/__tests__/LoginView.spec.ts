import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { defineComponent } from "vue";
import { flushPromises, mount } from "@vue/test-utils";
import type { VueWrapper } from "@vue/test-utils";
import { createPinia, setActivePinia } from "pinia";
import { createVuetify } from "vuetify";
import * as components from "vuetify/components";
import * as directives from "vuetify/directives";
import LoginView from "@/views/LoginView.vue";
import { useSecuritysStore } from "@/stores/securitys";
import type { SucursalSesion } from "@/types/sesion";

const push = vi.fn();
vi.mock("vue-router", () => ({ useRouter: () => ({ push }) }));
vi.mock("@/router", () => ({ default: { push: vi.fn(), currentRoute: { value: {} } } }));
vi.mock("@/utils/sesion", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/utils/sesion")>()),
  chooseSessionBranch: vi.fn(),
}));

globalThis.ResizeObserver ??= class {
  observe() {}
  unobserve() {}
  disconnect() {}
};

let wrapper: VueWrapper | undefined;

beforeEach(() => {
  vi.useFakeTimers();
  push.mockClear();
  sessionStorage.setItem("menu", "[]");
});

afterEach(() => {
  wrapper?.unmount();
  vi.useRealTimers();
});

const continueToBranch = async (loadConfig: () => Promise<null>) => {
  const pinia = createPinia();
  setActivePinia(pinia);
  const securitysStore = useSecuritysStore();
  securitysStore.lstSucursal = [{ id: 3, trade_name: "PIC" } as SucursalSesion];
  securitysStore.frmLogin.id_sucursal = 3;
  vi.spyOn(securitysStore, "_getMenuItem").mockResolvedValue(undefined);
  vi.spyOn(securitysStore, "ObtenerDatosConfig").mockImplementation(loadConfig);
  wrapper = mount(defineComponent({ components: { LoginView }, template: "<v-app><LoginView /></v-app>" }), {
    global: { plugins: [createVuetify({ components, directives }), pinia], config: { errorHandler: vi.fn() } },
  });
  await wrapper.findAll("button").find((button) => button.text().includes("Continuar"))!.trigger("click");
  await flushPromises();
};

test("opens Main right after the company config arrives, never before it", async () => {
  let configLoaded!: () => void;
  await continueToBranch(() => new Promise((resolve) => (configLoaded = () => resolve(null))));
  expect(push).not.toHaveBeenCalled();

  configLoaded();
  await flushPromises();

  expect(push).toHaveBeenCalledWith({ name: "Main" });
});

test("still opens Main when the company config cannot be loaded", async () => {
  await continueToBranch(() => Promise.reject(new Error("Network Error")));

  expect(push).toHaveBeenCalledWith({ name: "Main" });
});
