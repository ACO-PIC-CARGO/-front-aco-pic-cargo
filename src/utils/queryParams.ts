const isEmptyFilter = (value: unknown) => value === "" || value === null || value === undefined || value === "null";

export const filledParams = (filters: object): Record<string, unknown> =>
  Object.fromEntries(Object.entries(filters).filter(([, value]) => !isEmptyFilter(value)));
