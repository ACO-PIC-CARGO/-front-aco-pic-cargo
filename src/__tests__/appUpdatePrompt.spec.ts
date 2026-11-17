import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { flushPromises, shallowMount } from "@vue/test-utils";
import type { VueWrapper } from "@vue/test-utils";
import { createPinia, setActivePinia } from "pinia";
import { createVuetify } from "vuetify";
import App from "@/App.vue";
import http from "@/api/http";
import { checkForUpdate } from "@/utils/swUpdate";

vi.mock("@/utils/swUpdate", async () => {
  const { reactive } = await import("vue");
  return { swUpdate: reactive({ fase: "idle" }), checkForUpdate: vi.fn(), applyUpdate: vi.fn(() => false) };
});

vi.mock("vue-router", () => ({ useRoute: () => ({ name: "Home", params: {} }), useRouter: () => ({ push: vi.fn() }) }));
vi.mock("@/router", () => ({ default: { push: vi.fn(), currentRoute: { value: { params: {} } } } }));
vi.mock("@/api/http", () => ({ default: vi.fn() }));
vi.mock("socket.io-client", () => ({ io: () => ({ on: vi.fn(), emit: vi.fn(), disconnect: vi.fn() }) }));

const RUNNING_VERSION = "3.01";
let wrapper: VueWrapper | undefined;

const isAskingToUpdate = () => (wrapper!.vm as unknown as { dialogVersion: boolean }).dialogVersion;

beforeEach(async () => {
  vi.useFakeTimers();
  vi.stubEnv("VITE_VERSION", RUNNING_VERSION);
  vi.stubGlobal("localStorage", { getItem: () => null, setItem: vi.fn(), removeItem: vi.fn() });
  sessionStorage.clear();
  sessionStorage.setItem("auth-token", "token");
  vi.mocked(http).mockResolvedValue({ data: { data: [{ version: RUNNING_VERSION, power: 1 }] } } as never);

  const pinia = createPinia();
  setActivePinia(pinia);
  wrapper = shallowMount(App, { global: { plugins: [pinia, createVuetify()], stubs: { RouterView: true } } });
  await vi.runAllTimersAsync();
  await flushPromises();
});

afterEach(() => {
  wrapper?.unmount();
  vi.useRealTimers();
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

test("a deploy of the same version does not ask to update by itself", () => {
  expect(isAskingToUpdate()).toBe(false);
});

test("a new version announced by the server makes the service worker go fetch it", async () => {
  wrapper!.unmount();
  vi.mocked(checkForUpdate).mockClear();
  vi.mocked(http).mockResolvedValue({ data: { data: [{ version: "9.99", power: 1 }] } } as never);

  wrapper = shallowMount(App, { global: { plugins: [createPinia(), createVuetify()], stubs: { RouterView: true } } });
  await vi.runAllTimersAsync();
  await flushPromises();

  expect(isAskingToUpdate()).toBe(true);
  expect(checkForUpdate).toHaveBeenCalled();
});
