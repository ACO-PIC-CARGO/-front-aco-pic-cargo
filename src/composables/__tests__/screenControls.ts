import { flushPromises, mount } from "@vue/test-utils";
import type { VueWrapper } from "@vue/test-utils";
import { defineComponent, h, nextTick } from "vue";
import type { Component } from "vue";
import { createPinia, setActivePinia } from "pinia";
import { createVuetify } from "vuetify";
import * as components from "vuetify/components";
import * as directives from "vuetify/directives";
import { URL_MAIN, accepted, httpMock } from "@/stores/__tests__/catalogHttp";

export interface ScreenControl {
  name: string;
  action: string;
  shown: () => boolean;
}

export interface ControlledScreen {
  name: string;
  route: string;
  component: Component;
  controls: ScreenControl[];
  props?: Record<string, unknown>;
  rows?: Record<string, unknown[]>;
  prepare?: (wrapper: VueWrapper) => Promise<void> | void;
}

export const button = (text: string) => () =>
  [...document.body.querySelectorAll("button")].some((candidate) =>
    (candidate.textContent ?? "").trim().toUpperCase().includes(text.toUpperCase()));

export const icon = (name: string) => () => document.body.querySelector(`.${name}`) !== null;

export const setState = async (wrapper: VueWrapper, state: Record<string, unknown>) => {
  const component = wrapper.findComponent({ name: "ScreenUnderTest" }).vm as unknown as Record<string, unknown>;
  Object.assign(component, state);
  await nextTick();
  await flushPromises();
};

globalThis.ResizeObserver ??= class {
  observe() {}
  unobserve() {}
  disconnect() {}
};

Object.defineProperty(window, "visualViewport", {
  value: { width: 1024, height: 768, addEventListener() {}, removeEventListener() {} },
  configurable: true,
});

const answerRows = (rows: Record<string, unknown[]>) =>
  httpMock.mockImplementation(async (config) => {
    const path = config.url.slice(URL_MAIN.length).split("?")[0]!;
    const listed = Object.keys(rows).find((prefix) => path.startsWith(prefix));
    return { data: accepted(listed ? rows[listed] : []) };
  });

let mounted: VueWrapper | undefined;

export async function shownControls(screen: ControlledScreen, actions: string[]): Promise<string[]> {
  mounted?.unmount();
  document.body.innerHTML = "";
  sessionStorage.setItem("dataUser", JSON.stringify([{ id_branch: 7 }]));
  sessionStorage.setItem("permissions", JSON.stringify({ screens: [{ route: screen.route, actions }], controlled: [screen.route] }));
  answerRows(screen.rows ?? {});
  const pinia = createPinia();
  setActivePinia(pinia);
  const ScreenUnderTest = { ...screen.component, name: "ScreenUnderTest" };
  mounted = mount(
    defineComponent({ render: () => h(components.VApp, () => h(ScreenUnderTest, screen.props ?? {})) }),
    { global: { plugins: [createVuetify({ components, directives }), pinia] }, attachTo: document.body },
  );
  await flushPromises();
  await screen.prepare?.(mounted);
  return screen.controls.filter((control) => control.shown()).map((control) => control.name);
}

export const actionsOf = (screen: ControlledScreen) => [...new Set(screen.controls.map((control) => control.action))];

export const controlsFor = (screen: ControlledScreen, action: string) =>
  screen.controls.filter((control) => control.action === action).map((control) => control.name);
