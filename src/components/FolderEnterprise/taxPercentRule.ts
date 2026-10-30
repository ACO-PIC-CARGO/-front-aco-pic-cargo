export const taxPercent = (value: unknown): true | string => {
  if (value === "" || value === null || value === undefined) return true;
  const percent = Number(value);
  return (Number.isFinite(percent) && percent >= 0 && percent <= 100) || "Escribe un porcentaje entre 0 y 100.";
};
