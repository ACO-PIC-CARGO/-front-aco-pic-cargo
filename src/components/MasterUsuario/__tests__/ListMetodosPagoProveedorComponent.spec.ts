import { describe, expect, test, vi } from "vitest";
import { flushPromises, mount } from "@vue/test-utils";
import { createVuetify } from "vuetify";
import * as components from "vuetify/components";
import * as directives from "vuetify/directives";
import ListMetodosPagoProveedorComponent from "@/components/MasterUsuario/ListMetodosPagoProveedorComponent.vue";

const http = vi.hoisted(() => ({ get: vi.fn(), put: vi.fn(), post: vi.fn() }));
vi.mock("@/api/http", () => ({ default: http }));
vi.mock("sweetalert2", () => ({ default: { fire: vi.fn(() => Promise.resolve({ isConfirmed: false })) } }));

globalThis.ResizeObserver ??= class {
  observe() {}
  unobserve() {}
  disconnect() {}
};

const METODOS = [
  { id: 1, codigo: "01", descripcion: "Alibaba", detalle: "Tarjeta de Débito / Crédito", estado: true, orden: 1 },
  { id: 2, codigo: "02", descripcion: "Alibaba", detalle: "Transferencia Internacional", estado: true, orden: 2 },
  { id: 3, codigo: "04", descripcion: "Alipay", detalle: null, estado: false, orden: 3 },
];

async function montar() {
  http.get.mockResolvedValue({ data: { estadoflag: true, data: METODOS.map((m) => ({ ...m })) } });
  http.put.mockResolvedValue({ data: { estadoflag: true, mensaje: "Orden actualizado." } });
  const wrapper = mount(ListMetodosPagoProveedorComponent, {
    global: { plugins: [createVuetify({ components, directives })] },
  });
  await flushPromises();
  return wrapper;
}

describe("ListMetodosPagoProveedorComponent", () => {
  test("lists the branch payment methods with code, detail and state", async () => {
    const wrapper = await montar();
    const filas = wrapper.findAll(".mpp__row");
    expect(filas).toHaveLength(3);
    expect(filas[0]!.text()).toContain("01");
    expect(filas[0]!.text()).toContain("Alibaba (Tarjeta de Débito / Crédito)");
    expect(filas[2]!.classes()).toContain("is-inactive");
  });

  test("moving a row down saves the whole order by code", async () => {
    const wrapper = await montar();
    await wrapper.findAll(".mpp__row")[0]!.find('[title="Bajar"]').trigger("click");
    await flushPromises();
    expect(http.put).toHaveBeenCalledWith(expect.stringContaining("metodos_pago_proveedor/orden"), {
      codigos: ["02", "01", "04"],
    });
    expect(wrapper.findAll(".mpp__row")[0]!.text()).toContain("02");
  });
});
