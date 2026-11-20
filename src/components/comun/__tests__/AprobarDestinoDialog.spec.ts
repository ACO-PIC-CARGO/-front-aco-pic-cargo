import { describe, expect, test } from "vitest";
import { mount } from "@vue/test-utils";
import { createVuetify } from "vuetify";
import * as components from "vuetify/components";
import * as directives from "vuetify/directives";
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

  test("choosing a destination card and an option updates both models", async () => {
    const w = abrir();
    await w.vm.$nextTick();
    const radios = [...document.querySelectorAll<HTMLButtonElement>("[role='radio']")];
    radios.find((b) => b.textContent?.includes("Enviar a Tráfico"))!.click();
    radios.find((b) => b.textContent?.includes("Opción 1"))!.click();
    expect(w.emitted("update:target")?.at(-1)).toEqual(["TRAFFIC"]);
    expect(w.emitted("update:opcion")?.at(-1)).toEqual([1]);
    w.unmount();
  });
});
