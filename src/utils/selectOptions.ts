// Vuetify 4 turns a model value with no matching option into a fake option whose raw value is the bare value.
export const chosenOptionTitle = (item: { raw: unknown; title: string }): string => (typeof item.raw === "object" ? item.title : "");
