import { afterEach, expect, test, vi } from "vitest";
import { mount } from "@vue/test-utils";
import type { VueWrapper } from "@vue/test-utils";
import { createPinia, setActivePinia } from "pinia";
import type { Component } from "vue";
import { createVuetify } from "vuetify";
import * as components from "vuetify/components";
import * as directives from "vuetify/directives";
import HouseStepComments from "@/components/HouseFile/HouseStepComments.vue";
import HouseStepItem from "@/components/HouseFile/HouseStepItem.vue";
import SendToTrackingButton from "@/components/HouseFile/SendToTrackingButton.vue";
import type { HouseTrackingStep } from "@/types/houseTracking";
import { HOUSE_SCREEN } from "@/composables/useHouseScreen";

vi.mock("@/api/http", () => ({ default: vi.fn() }));
vi.mock("@/router", () => ({ default: { push: vi.fn() } }));
vi.mock("sweetalert2", () => ({ default: { fire: vi.fn() } }));
globalThis.ResizeObserver ??= class {
  observe() {}
  unobserve() {}
  disconnect() {}
};

const comment = { id: 7, comment: "Documentos recibidos.", created_at: "2026-10-01T10:00:00Z", author: "Ana", sent_at: null };
const confirmedStep: HouseTrackingStep = {
  id: 1,
  name: "Pago al proveedor",
  icon: "mdi-currency-usd",
  number: 1,
  visible_to_client: true,
  confirmed_at: "2026-10-01T10:00:00Z",
  confirmed_by: null,
  sent_at: null,
  scheduled_at: null,
  validation: null,
  validation_result: null,
  validation_result_code: null,
  quote_validity: null,
  state: "confirmed",
  comments: [comment] as HouseTrackingStep["comments"],
};
let wrapper: VueWrapper | undefined;

afterEach(() => wrapper?.unmount());

function mountAs(actions: string[], component: Component, props: Record<string, unknown>) {
  sessionStorage.setItem("permissions", JSON.stringify({ screens: [{ route: "listHouse", actions }], controlled: ["listHouse"] }));
  const pinia = createPinia();
  setActivePinia(pinia);
  wrapper?.unmount();
  wrapper = mount(component, { props, global: { plugins: [createVuetify({ components, directives }), pinia] } });
  return wrapper;
}

const buttonNamed = (text: string) => wrapper!.findAll("button").find((button) => button.text().trim() === text);

test("a step is confirmed, unconfirmed or re-dated only with Modificar", () => {
  const stepControls = () => ({
    toggle: wrapper!.find('input[type="checkbox"]').exists(),
    redate: wrapper!.find('button[aria-label^="Corregir fecha"]').attributes("disabled") === undefined,
  });

  mountAs(["VER", "NUEVO", "ELIMINAR"], HouseStepItem, { houseId: 1, step: confirmedStep, blockedBy: null });
  expect(stepControls()).toEqual({ toggle: false, redate: false });

  mountAs(["VER", "MODIFICAR"], HouseStepItem, { houseId: 1, step: confirmedStep, blockedBy: null });
  expect(stepControls()).toEqual({ toggle: true, redate: true });
});

test("a step comment is added only with Nuevo and deleted only with Eliminar", () => {
  const commentControls = () => ({
    agregar: buttonNamed("Agregar comentario") !== undefined,
    eliminar: wrapper!.find('button[aria-label="Eliminar comentario 1"]').exists(),
  });

  mountAs(["VER", "MODIFICAR"], HouseStepComments, { houseId: 1, step: confirmedStep });
  expect(commentControls()).toEqual({ agregar: false, eliminar: false });

  mountAs(["VER", "NUEVO"], HouseStepComments, { houseId: 1, step: confirmedStep });
  expect(commentControls()).toEqual({ agregar: true, eliminar: false });

  mountAs(["VER", "ELIMINAR"], HouseStepComments, { houseId: 1, step: confirmedStep });
  expect(commentControls()).toEqual({ agregar: false, eliminar: true });
});

test("a comment is sent to or withdrawn from the client tracking only with Modificar, and its sent state stays visible", () => {
  const sendProps = (sentAt: string | null) => ({
    state: sentAt ? "sent" : "ready",
    sentAt,
    blockedHint: "",
    confirmText: "",
    send: vi.fn(),
    withdrawConfirmText: "",
    withdraw: vi.fn(),
  });

  mountAs(["VER"], SendToTrackingButton, sendProps(null));
  expect(buttonNamed("Enviar a tracking")).toBeUndefined();
  mountAs(["VER"], SendToTrackingButton, sendProps("2026-10-01T10:00:00Z"));
  expect({ enviado: wrapper!.text().includes("Enviado"), retirar: buttonNamed("Retirar") !== undefined }).toEqual({
    enviado: true,
    retirar: false,
  });

  mountAs(["VER", "MODIFICAR"], SendToTrackingButton, sendProps(null));
  expect(buttonNamed("Enviar a tracking")).toBeDefined();
  mountAs(["VER", "MODIFICAR"], SendToTrackingButton, sendProps("2026-10-01T10:00:00Z"));
  expect(buttonNamed("Retirar")).toBeDefined();
});

test("inside a Tráfico file the steps follow the Tráfico permissions, not the House ones", () => {
  sessionStorage.setItem(
    "permissions",
    JSON.stringify({
      screens: [
        { route: "lstTraffic", actions: ["VER", "MODIFICAR"] },
        { route: "listHouse", actions: ["VER"] },
      ],
      controlled: ["lstTraffic", "listHouse"],
    }),
  );
  const pinia = createPinia();
  setActivePinia(pinia);
  wrapper?.unmount();
  wrapper = mount(HouseStepItem, {
    props: { houseId: 1, step: confirmedStep, blockedBy: null },
    global: { plugins: [createVuetify({ components, directives }), pinia], provide: { [HOUSE_SCREEN as symbol]: () => "lstTraffic" } },
  });

  expect(wrapper.find('input[type="checkbox"]').exists()).toBe(true);
});
