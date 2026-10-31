export const detailsToSave = <T extends { id?: number | null; estado?: boolean }>(rows: T[]): T[] =>
  rows.filter((row) => row.id || row.estado);
