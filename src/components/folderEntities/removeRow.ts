export const removeRow = <Row>(rows: Row[], row: Row): void => {
  const position = rows.indexOf(row);
  if (position >= 0) rows.splice(position, 1);
};
