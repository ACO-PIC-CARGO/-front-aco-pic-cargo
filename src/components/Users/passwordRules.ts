const PASSWORD_MIN_LENGTH = 8;

export const passwordRules = [
  (value: string) => !!value || "Escribe una clave.",
  (value: string) =>
    (value ?? "").length >= PASSWORD_MIN_LENGTH ||
    `La clave debe tener al menos ${PASSWORD_MIN_LENGTH} caracteres.`,
];

export const matchesPassword = (password: () => string | undefined) => (value: string) =>
  value === password() || "Las claves no coinciden. Escribe la misma clave en los dos campos.";
