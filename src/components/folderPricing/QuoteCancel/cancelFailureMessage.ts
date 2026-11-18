const CANCEL_FAILED = "No pudimos anular la solicitud. Revisa tu conexión e inténtalo de nuevo.";
const NO_PERMISSION = "No tienes permiso para anular esta solicitud. Pide acceso a un administrador.";

export const cancelFailureMessage = (error: unknown): string =>
  (error as { response?: { status?: number } } | undefined)?.response?.status === 403 ? NO_PERMISSION : CANCEL_FAILED;
