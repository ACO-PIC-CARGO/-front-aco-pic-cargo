import Swal from "sweetalert2";

// Modo ver: la pantalla se ve igual que en edición, pero cualquier acción
// (botones, campos, selectores) se bloquea con un aviso para ir al modo edición.
// Excepciones:
//  - los encabezados de los paneles expandibles (solo muestran/ocultan información)
//  - los elementos marcados con data-modo-ver="permitido" (acciones de solo consulta)
// Los diálogos se montan fuera de la zona bloqueada, así que funcionan con normalidad.

const INTERACTIVO =
  'button, a[href], input, textarea, select, [contenteditable="true"], [role="button"], [role="checkbox"], ' +
  '[role="switch"], [role="combobox"], [role="radio"], .v-field, .v-selection-control';
const CAMPO = 'input:not([type="hidden"]), textarea, select, [contenteditable="true"]';

export function useModoVer(opciones: { activo: () => boolean; puedeEditar: () => boolean; irAEditar: () => void }) {
  function accionBloqueada(target: EventTarget | null): HTMLElement | null {
    if (!opciones.activo() || !(target instanceof Element)) return null;
    if (target.closest('[data-modo-ver="permitido"]')) return null;
    const elemento = target.closest<HTMLElement>(INTERACTIVO);
    if (!elemento || elemento.classList.contains("v-expansion-panel-title")) return null;
    return elemento;
  }

  async function avisar() {
    if (Swal.isVisible()) return;
    const puedeEditar = opciones.puedeEditar();
    const { isConfirmed } = await Swal.fire({
      icon: "info",
      title: "Modo de solo consulta",
      html: puedeEditar
        ? "Estás visualizando este control de gastos en <b>modo consulta</b>.<br>Para registrar o modificar información, cambia al <b>modo edición</b>."
        : "Estás visualizando este control de gastos en <b>modo consulta</b>.<br>No tienes permiso para modificarlo; si lo necesitas, solicítalo a tu administrador.",
      showCancelButton: puedeEditar,
      confirmButtonText: puedeEditar ? "Ir al modo edición" : "Entendido",
      cancelButtonText: "Seguir consultando",
      confirmButtonColor: "#1e5bd8",
      reverseButtons: true,
    });
    if (isConfirmed && puedeEditar) opciones.irAEditar();
  }

  function bloquear(event: Event, conAviso: boolean) {
    if (!accionBloqueada(event.target)) return;
    event.preventDefault();
    event.stopPropagation();
    if (conAviso) avisar();
  }

  // listeners en fase de captura sobre el contenedor de la zona protegida
  return {
    onMousedownCapture: (e: MouseEvent) => bloquear(e, false), // evita que el campo tome el foco o abra su menú
    onClickCapture: (e: MouseEvent) => bloquear(e, true),
    onKeydownCapture: (e: KeyboardEvent) => {
      if (e.key === "Enter" || e.key === " " || e.key.length === 1 || e.key === "Backspace" || e.key === "Delete") {
        bloquear(e, true);
      }
    },
    onFocusinCapture: (e: FocusEvent) => {
      // con Tab se puede llegar a un campo: se le quita el foco
      if (accionBloqueada(e.target) && (e.target as Element).matches(CAMPO)) {
        (e.target as HTMLElement).blur();
      }
    },
  };
}
