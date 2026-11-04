// After a choice, Vuetify 4 writes the chosen item's title into the search box; filtering by it would leave only that item.
export const serverSearchText = <Item>(
  text: string | null | undefined,
  items: Item[],
  title: (item: Item) => unknown,
): string | null => (text && !items.some((item) => title(item) === text) ? text : null);
