import Swal from "sweetalert2";

export function mostrarAvisoVigenciaFlete(diasRestantes: number, vigencia?: string) {
  const vencido = diasRestantes < 0;
  const hoy = diasRestantes === 0;
  const dias = Math.abs(diasRestantes);
  const plazoEtiqueta = hoy ? "Vence" : vencido ? "Venció hace" : "Vence en";
  const plazoValor = hoy ? "hoy" : `${dias} ${dias === 1 ? "día" : "días"}`;
  let interval: ReturnType<typeof setInterval> | undefined;

  return Swal.fire({
    icon: vencido ? "error" : "warning",
    iconHtml: `<svg viewBox="0 0 100 70" aria-hidden="true">
      <defs><linearGradient id="freight-alert-grad" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="currentColor" stop-opacity="0.7"/><stop offset="1" stop-color="currentColor"/>
      </linearGradient></defs>
      <path d="M43 7a8 8 0 0 1 14 0l32 48a8 8 0 0 1-7 12H18a8 8 0 0 1-7-12z" fill="url(#freight-alert-grad)"/>
      <path d="M50 24v19" stroke="white" stroke-width="6" stroke-linecap="round"/>
      <circle cx="50" cy="53" r="3.5" fill="white"/>
      <path d="M14 13l-6-7M9 22l-7-3M86 13l6-7M91 22l7-3" stroke="currentColor" stroke-width="3.5" stroke-linecap="round"/>
    </svg>`,
    titleText: "TARIFA DE FLETE",
    html: `
      <div class="freight-alert-heading">${vencido ? "VENCIDA" : hoy ? "VENCE HOY" : "POR VENCER"}</div>
      <div class="freight-alert-deadline"><span class="freight-alert-deadline-label"></span> <span class="freight-alert-deadline-value"></span></div>
      <div class="freight-alert-date"></div>
    `,
    customClass: {
      popup: "freight-alert",
      title: "freight-alert-title",
      htmlContainer: "freight-alert-content",
      actions: "freight-alert-actions",
      confirmButton: "freight-alert-update",
      denyButton: "freight-alert-config",
      cancelButton: "freight-alert-continue",
    },
    allowOutsideClick: false,
    allowEscapeKey: false,
    confirmButtonText: '<i class="mdi mdi-check-circle" aria-hidden="true"></i> ACTUALIZAR AHORA',
    showDenyButton: true,
    denyButtonText: '<i class="mdi mdi-cog" aria-hidden="true"></i> Configurar flete',
    showCancelButton: true,
    // Solo "Cancelar" espera la cuenta regresiva; las otras acciones están disponibles de inmediato
    cancelButtonText: `<i class="mdi mdi-close" aria-hidden="true"></i> <span class="freight-alert-cancel-label">CANCELAR EN</span>
      <span class="freight-alert-countdown" aria-live="polite"></span>`,
    willOpen: () => {
      Swal.getCancelButton()!.disabled = true;
    },
    didOpen: (popup) => {
      const deadlineLabel = popup.querySelector<HTMLElement>(".freight-alert-deadline-label")!;
      const deadlineValue = popup.querySelector<HTMLElement>(".freight-alert-deadline-value")!;
      const date = popup.querySelector<HTMLElement>(".freight-alert-date")!;
      const cancelButton = Swal.getCancelButton()!;
      const countdown = cancelButton.querySelector<HTMLElement>(".freight-alert-countdown")!;
      const cancelLabel = cancelButton.querySelector<HTMLElement>(".freight-alert-cancel-label")!;
      deadlineLabel.textContent = `${plazoEtiqueta}${hoy ? "" : ":"}`;
      deadlineValue.textContent = plazoValor;
      date.textContent = vigencia ? `Fecha de vigencia: ${vigencia}` : "";

      let remaining = 5;
      countdown.textContent = `${remaining} s`;
      interval = setInterval(() => {
        remaining--;
        countdown.style.setProperty("--freight-progress", `${remaining * 20}%`);
        if (remaining > 0) {
          countdown.textContent = `${remaining} s`;
        } else {
          clearInterval(interval);
          interval = undefined;
          countdown.remove();
          cancelLabel.textContent = "CANCELAR";
          cancelButton.disabled = false;
        }
      }, 1000);
    },
    didClose: () => {
      if (interval !== undefined) clearInterval(interval);
    },
  });
}
