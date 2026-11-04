import type { SetupContext } from "vue";
import { VAutocomplete, VSelect } from "vuetify/components";

type SelectProps = { modelValue: unknown; items?: unknown[]; itemValue?: unknown };
type SelectSetup = (props: SelectProps, ctx: SetupContext) => unknown;

const isEmptyOption = (item: unknown, itemValue: unknown) =>
  (item !== null && typeof item === "object" && typeof itemValue === "string"
    ? (item as Record<string, unknown>)[itemValue]
    : item) === "";

const asNoSelection = (props: SelectProps) =>
  new Proxy(props, {
    get(target, key, receiver) {
      const value = Reflect.get(target, key, receiver);
      if (key !== "modelValue" || value !== "") return value;
      return target.items?.some((item) => isEmptyOption(item, target.itemValue)) ? value : null;
    },
  });

// Vuetify 2 showed an empty-string model as no selection; Vuetify 4 floats the label as if something were chosen.
export function showEmptyStringAsNoSelection(): void {
  for (const component of [VSelect, VAutocomplete] as unknown as { setup: SelectSetup }[]) {
    const setup = component.setup;
    component.setup = (props, ctx) => setup(asNoSelection(props), ctx);
  }
}
