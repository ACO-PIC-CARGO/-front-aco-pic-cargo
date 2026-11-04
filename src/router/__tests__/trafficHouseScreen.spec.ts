import { expect, test, vi } from "vitest";
import { defineComponent, h } from "vue";
import { flushPromises, mount } from "@vue/test-utils";
import { createMemoryHistory, createRouter, RouterView } from "vue-router";
import appRouter from "@/router";

const houseScreen = vi.hoisted(() => ({ mounts: 0 }));
vi.mock("@/views/folderHouse/VerHouse.vue", async () => {
  const vue = await import("vue");
  return {
    default: vue.defineComponent({
      setup() {
        houseScreen.mounts++;
        return () => vue.h("div");
      },
    }),
  };
});

const routeNamed = (name: string) => {
  const record = appRouter.getRoutes().find((route) => route.name === name)!;
  return { path: record.path, name, component: record.components!.default! };
};

test("going from a traffic file to its house shows the house screen afresh, while view and edit keep the same screen", async () => {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: ["trafficVer", "trafficEditar", "controlHouseVer"].map(routeNamed),
  });
  mount(defineComponent(() => () => h(RouterView)), { global: { plugins: [router] } });
  const house = { id: 8373 };

  await router.push({ name: "trafficVer", params: house });
  await router.replace({ name: "trafficEditar", params: house });
  await router.replace({ name: "trafficVer", params: house });
  await flushPromises();
  expect(houseScreen.mounts).toBe(1);

  await router.push({ name: "controlHouseVer", params: house });
  await flushPromises();
  expect(houseScreen.mounts).toBe(2);
});
