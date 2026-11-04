import { expect, test, vi } from "vitest";
import type { Mock } from "vitest";
import { flushPromises, shallowMount } from "@vue/test-utils";
import { createPinia, setActivePinia } from "pinia";
import http from "@/api/http";
import DataGen from "@/components/folderHouse/DataGen.vue";

vi.mock("@/api/http", () => ({ default: vi.fn() }));
vi.mock("@/router", () => ({ default: { push: vi.fn() } }));
vi.mock("vue-router", () => ({
  useRoute: () => ({ params: { id: "2892" } }),
  useRouter: () => ({ push: vi.fn() }),
}));
vi.mock("sweetalert2", () => ({ default: { fire: vi.fn() } }));

const httpMock = http as unknown as Mock<(config: { url?: string }) => Promise<{ data: unknown }>>;
const requestedUrls = () => httpMock.mock.calls.map(([config]) => String(config?.url));

test("a house without quotes asks for the pending quotes and customs quotes at the same time", async () => {
  const pinia = createPinia();
  setActivePinia(pinia);
  sessionStorage.setItem("dataUser", JSON.stringify([{ id_branch: 22 }]));
  httpMock.mockImplementation((config) => {
    const url = String(config?.url);
    if (url.includes("listar_montos_finales_quote")) return new Promise(() => {});
    if (url.includes("house_ver")) return Promise.resolve({ data: { estadoflag: true, data: [{ id: 2892, id_cot: null, id_quoteaduana: null }] } });
    return Promise.resolve({ data: { estadoflag: false, data: [] } });
  });

  const wrapper = shallowMount(DataGen, { global: { plugins: [pinia] } });
  await flushPromises();

  expect(requestedUrls().some((url) => url.includes("listar_montos_finales_quote"))).toBe(true);
  expect(requestedUrls().some((url) => url.includes("listar_montos_finales_aduana"))).toBe(true);
  wrapper.unmount();
});

test("a house saved without a coloader shows no coloader chosen", async () => {
  const pinia = createPinia();
  setActivePinia(pinia);
  sessionStorage.setItem("dataUser", JSON.stringify([{ id_branch: 22 }]));
  httpMock.mockImplementation((config) => {
    const url = String(config?.url);
    if (url.includes("house_ver")) return Promise.resolve({ data: { estadoflag: true, data: [{ id: 2892, id_cot: 1, id_coloader: 0 }] } });
    return Promise.resolve({ data: { estadoflag: false, data: [] } });
  });

  const wrapper = shallowMount(DataGen, { global: { plugins: [pinia] } });
  await flushPromises();
  const { useHousesStore } = await import("@/stores/houses");

  expect(useHousesStore().house_id_coloader).toBeNull();
  wrapper.unmount();
});

test("a confirmed telex keeps its confirmation date when confirmed again", async () => {
  const pinia = createPinia();
  setActivePinia(pinia);
  sessionStorage.setItem("dataUser", JSON.stringify([{ id_branch: 22 }]));
  httpMock.mockImplementation((config) => {
    const url = String(config?.url);
    if (url.includes("house_ver"))
      return Promise.resolve({
        data: { estadoflag: true, data: [{ id: 2892, id_cot: 1, telexconfirmado: true, fechaconfirmaciontelex: "25-11-2026" }] },
      });
    return Promise.resolve({ data: { estadoflag: false, data: [] } });
  });

  const wrapper = shallowMount(DataGen, { global: { plugins: [pinia] } });
  await flushPromises();
  const { useHousesStore } = await import("@/stores/houses");

  expect(useHousesStore().fechaconfirmaciontelex).toBe("2026-11-25");
  wrapper.unmount();
});
