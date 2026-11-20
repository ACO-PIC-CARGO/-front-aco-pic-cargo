import { describe, expect, test } from "vitest";
import { mount } from "@vue/test-utils";
import { createVuetify } from "vuetify";
import * as components from "vuetify/components";
import * as directives from "vuetify/directives";
import { VSelect } from "vuetify/components";
import AprobarDestinoDialog from "@/components/comun/AprobarDestinoDialog.vue";

const vuetify = createVuetify({ components, directives });

function abrir(props: Record<string, unknown> = {}) {
  return mount(AprobarDestinoDialog, {
    props: {
      modelValue: true,
      target: null,
      opcion: "",
      targets: ["OPERATIONS", "TRAFFIC"],
      opciones: [{ value: 1, titulo: "Opción 1", detalle: "CARGOTRANS (187)" }],
      ...props,
    },
    global: { plugins: [vuetify] },
    attachTo: document.body,
  });
}

const continuar = () => document.querySelector<HTMLButtonElement>("#aprobar-continuar")!;

describe("Aprobar: destino y opción", () => {
  test("Continuar stays disabled until both the destination and the option are chosen", async () => {
    const w = abrir({ target: "TRAFFIC" });
    await w.vm.$nextTick();
    expect(continuar().disabled).toBe(true);
    expect(await (w.vm as unknown as { validate: () => Promise<{ valid: boolean }> }).validate()).toEqual({ valid: false });

    await w.setProps({ opcion: 1 });
    expect(continuar().disabled).toBe(false);
    expect(await (w.vm as unknown as { validate: () => Promise<{ valid: boolean }> }).validate()).toEqual({ valid: true });
    w.unmount();
  });

  test("both selects offer the destinations and options and update both models", async () => {
    const w = abrir();
    await w.vm.$nextTick();
    const [destino, opcion] = w.findAllComponents(VSelect);
    expect(destino.props("items").map((i: { title: string }) => i.title)).toEqual([
      "Enviar a Operaciones",
      "Enviar a Tráfico",
    ]);
    expect(opcion.props("items")[0].title).toBe("Opción 1 – CARGOTRANS (187)");
    destino.vm.$emit("update:modelValue", "TRAFFIC");
    opcion.vm.$emit("update:modelValue", 1);
    expect(w.emitted("update:target")?.at(-1)).toEqual(["TRAFFIC"]);
    expect(w.emitted("update:opcion")?.at(-1)).toEqual([1]);
    w.unmount();
  });
});
