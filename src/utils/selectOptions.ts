// Vuetify 4 turns a model value with no matching option into a fake option whose raw value is the bare value.
export const chosenOptionTitle = (item: { raw: unknown; title: string }): string => (typeof item.raw === "object" ? item.title : "");

// Lists only carry active options; a record may still point to one that was deactivated after it was saved.
export function withChosenOption<Option extends { id?: unknown; name?: unknown }>(
  list: Option[],
  id: unknown,
  name: string | null | undefined,
): (Option | { id: unknown; name: string })[] {
  if (!id || !name || list.some((option) => option.id == id)) return list;
  return [...list, { id, name }];
}
