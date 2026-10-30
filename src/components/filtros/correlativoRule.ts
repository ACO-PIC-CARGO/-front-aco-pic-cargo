export const wholeCorrelativo = (value: string | null | undefined): true | string =>
  !value || /^\d{1,9}$/.test(value) || "Escribe solo el número del correlativo, sin letras ni decimales. Por ejemplo: 125.";
