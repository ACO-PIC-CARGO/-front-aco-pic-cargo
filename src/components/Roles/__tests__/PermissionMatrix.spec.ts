import { afterEach, expect, test } from "vitest";
import { mount } from "@vue/test-utils";
import type { VueWrapper } from "@vue/test-utils";
import { createVuetify } from "vuetify";
import * as components from "vuetify/components";
import * as directives from "vuetify/directives";
import PermissionMatrix from "@/components/Roles/PermissionMatrix.vue";
import type { CatalogScreen } from "@/types/roles";
import type { Grants } from "@/utils/permissionGrants";

const ACTIONS = ["VER", "NUEVO", "MODIFICAR", "ELIMINAR", "COPIAR", "EXPORTAR"];
const screen = (menu_id: number, module_id: number, notGrantable: string[] = []): CatalogScreen => ({
  module_id,
  module: `Módulo ${module_id}`,
  module_order: module_id,
  group_id: module_id * 10,
  group_name: `Grupo ${module_id}`,
  menu_id,
  route: `route${menu_id}`,
  screen: `Pantalla ${menu_id}`,
  actions: ACTIONS.map((name, id) => ({ id, code: `0${id}`, name, granted: false, grantable: !notGrantable.includes(name) })),
});
const catalog = [screen(7, 1, ["ELIMINAR"]), screen(8, 1), screen(9, 2)];

let wrapper: VueWrapper | undefined;
let current: Grants = {};
afterEach(() => wrapper?.unmount());

const mountMatrix = (props: { modelValue?: Grants; readonly?: boolean } = {}) => {
  current = props.modelValue ?? {};
  wrapper = mount(PermissionMatrix, {
    props: {
      catalog,
      modelValue: {},
      ...props,
      "onUpdate:modelValue": (grants: Grants) => {
        current = grants;
        return wrapper!.setProps({ modelValue: grants });
      },
    },
    global: { plugins: [createVuetify({ components, directives })] },
  });
  return wrapper;
};

const box = (label: string) => wrapper!.find<HTMLInputElement>(`input[aria-label="${label}"]`);
const grants = () => current;
const sorted = (actions: readonly string[] | undefined) => [...(actions ?? [])].sort();

test("a cell the user cannot grant is disabled, the others are not", () => {
  mountMatrix();

  expect(box("Eliminar en Pantalla 7").element.disabled).toBe(true);
  expect(box("Eliminar en Pantalla 8").element.disabled).toBe(false);
});

test("checking an action on a screen also grants Ver on it", async () => {
  mountMatrix();

  await box("Nuevo en Pantalla 7").setValue(true);

  expect(grants()).toEqual({ 7: ["VER", "NUEVO"] });
});

test("unchecking Ver clears the screen's row", async () => {
  mountMatrix({ modelValue: { 7: ["VER", "NUEVO", "EXPORTAR"] } });

  await box("Ver en Pantalla 7").setValue(false);

  expect(grants()).toEqual({ 7: [] });
});

test("selecting a whole module grants every action the user can grant on its screens only", async () => {
  mountMatrix();

  await box("Seleccionar todo en Módulo 1").setValue(true);

  expect(sorted(grants()[7])).toEqual(sorted(ACTIONS.filter((action) => action !== "ELIMINAR")));
  expect(sorted(grants()[8])).toEqual(sorted(ACTIONS));
  expect(grants()[9]).toBeUndefined();
});

test("selecting an action column grants it, with Ver, on every screen that allows it", async () => {
  mountMatrix();

  await box("Eliminar en todas las pantallas").setValue(true);

  expect(grants()).toEqual({ 8: ["VER", "ELIMINAR"], 9: ["VER", "ELIMINAR"] });
});

test("a read-only matrix shows the grants but lets nothing change", () => {
  mountMatrix({ modelValue: { 7: ["VER"] }, readonly: true });

  expect(box("Ver en Pantalla 7").element.checked).toBe(true);
  expect(wrapper!.findAll("input").every((input) => (input.element as HTMLInputElement).disabled)).toBe(true);
});
