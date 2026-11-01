import { computed } from "vue";
import type { Ref } from "vue";

// Vuetify shows any non-null return-object model as a selection, so an empty record would render as "[object Object]".
export function useSelectModel<T extends { id?: unknown }>(record: Ref<T>) {
  return computed<T | null>({
    get: () => (record.value.id ? record.value : null),
    set: (selected) => {
      record.value = selected ?? ({} as T);
    },
  });
}
