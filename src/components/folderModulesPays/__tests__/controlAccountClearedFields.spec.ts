import { beforeEach, describe, expect, test, vi } from "vitest";
import { flushPromises, shallowMount } from "@vue/test-utils";
import type { Component } from "vue";
import { createPinia } from "pinia";
import ControlAccountPaysComponent from "@/components/folderModulesPays/ControlAccountPaysComponent.vue";
import ControlAccountReceivableComponent from "@/components/folderModulesPays/ControlAccountReceivableComponent.vue";
import { accepted, httpMock } from "@/stores/__tests__/catalogHttp";

vi.mock("@/api/http", () => ({ default: vi.fn() }));
vi.mock("@/router", () => ({ default: { push: vi.fn(), go: vi.fn() } }));
vi.mock("vue-router", () => ({
  useRouter: () => ({ push: vi.fn(), go: vi.fn(), back: vi.fn() }),
  useRoute: () => ({ params: {} }),
}));
vi.mock("sweetalert2", () => ({ default: { fire: vi.fn().mockResolvedValue({ isConfirmed: false }) } }));

beforeEach(() => {
  vi.spyOn(console, "warn").mockImplementation(() => {});
});

async function openNewAccount(screen: Component) {
  sessionStorage.setItem("dataUser", JSON.stringify([{ id_branch: 7 }]));
  httpMock.mockResolvedValue({ data: accepted([]) });
  const errors: unknown[] = [];
  const wrapper = shallowMount(screen, {
    props: { tipo: "nuevo" },
    global: { plugins: [createPinia()], renderStubDefaultSlot: true, config: { errorHandler: (error) => errors.push(error) } },
  });
  await flushPromises();
  const fieldLabeled = (name: string, label: string) =>
    wrapper.findAllComponents({ name }).find((field) => field.props("label") === label)!;
  const clear = (label: string) => fieldLabeled("VAutocomplete", label).vm.$emit("update:modelValue", null);
  return { errors, clear, fieldLabeled };
}

describe.each([
  ["pagar", ControlAccountPaysComponent],
  ["cobrar", ControlAccountReceivableComponent],
])("Nueva cuenta por %s", (_name, screen) => {
  test("erasing the voucher type does not break the form", async () => {
    const { errors, clear } = await openNewAccount(screen);

    await clear("Tipo de Comprobante");

    expect(errors).toEqual([]);
  });

  test("erasing the currency does not break the form", async () => {
    const { errors, clear } = await openNewAccount(screen);

    await clear("Moneda");

    expect(errors).toEqual([]);
  });

  test("an amount is still validated after the voucher type is erased", async () => {
    const { clear, fieldLabeled } = await openNewAccount(screen);

    await clear("Tipo de Comprobante");
    const [amountRule] = fieldLabeled("VTextField", "Monto").props("rules") as ((value: string) => unknown)[];

    expect(amountRule!("10")).toBe(true);
  });
});
