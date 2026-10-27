export const isClickOnControl = (event: MouseEvent): boolean =>
  (event.target as Element).closest("button, input, label, a, .v-input") !== null;
