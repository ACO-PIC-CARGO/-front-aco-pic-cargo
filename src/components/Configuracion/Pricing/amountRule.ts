const AMOUNT = /^(\d+(\.\d*)?|\.\d+)$/;

export const nonNegativeAmount = (value: unknown): true | string =>
  AMOUNT.test(String(value ?? "").trim()) || "Ingresa un monto de 0 o más.";
