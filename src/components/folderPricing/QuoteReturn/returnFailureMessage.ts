const SEND_FAILED = "No pudimos devolver la cotización. Revisa tu conexión e inténtalo de nuevo.";
const NO_PERMISSION = "No tienes permiso para devolver esta cotización. Pide acceso a un administrador.";

export const returnFailureMessage = (error: unknown): string =>
  (error as { response?: { status?: number } } | undefined)?.response?.status === 403 ? NO_PERMISSION : SEND_FAILED;
