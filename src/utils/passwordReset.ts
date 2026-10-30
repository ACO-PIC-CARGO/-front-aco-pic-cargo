const MIN_PASSWORD_LENGTH = 8;

interface PasswordResetForm {
  email: string;
  clave: string;
  confirmaclave: string;
}

export const passwordResetProblem = ({ email, clave, confirmaclave }: PasswordResetForm): string | null => {
  if (!email.trim()) return "Escribe el correo de tu cuenta.";
  if (clave.length < MIN_PASSWORD_LENGTH) return `La contraseña debe tener al menos ${MIN_PASSWORD_LENGTH} caracteres.`;
  if (clave !== confirmaclave) return "Las contraseñas no coinciden. Escríbelas de nuevo.";
  return null;
};
