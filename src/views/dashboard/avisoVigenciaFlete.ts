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
      <path d="M43 7a8 8 0 0 1 14 0l32 48a8 8 0 0 1-7 12H18a8 8 0 0 1-7-12z" fill="currentColor"/>
      <path d="M50 24v19" stroke="white" stroke-width="6" stroke-linecap="round"/>
      <circle cx="50" cy="53" r="3.5" fill="white"/>
      <path d="M14 13l-6-7M9 22l-7-3M86 13l6-7M91 22l7-3" stroke="currentColor" stroke-width="3.5" stroke-linecap="round"/>
    </svg>`,
    titleText: "TARIFA DE FLETE",
    html: `
      <div class="freight-alert-heading">${vencido ? "VENCIDA" : hoy ? "VENCE HOY" : "POR VENCER"}</div>
      <div class="freight-alert-deadline"><span class="freight-alert-deadline-label"></span> <span class="freight-alert-deadline-value"></span></div>
      <div class="freight-alert-date"></div>
      <div class="freight-alert-message">
        <div class="freight-alert-countdown" aria-live="polite"></div>
        <div><strong>Actualiza ahora</strong><br>para mantener tus cotizaciones correctas.</div>
      </div>
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
    confirmButtonText: '<i class="mdi mdi-calendar-month" aria-hidden="true"></i> Actualizar vigencia',
    showDenyButton: true,
    denyButtonText: '<i class="mdi mdi-cog" aria-hidden="true"></i> Configurar flete',
    showCancelButton: true,
    cancelButtonText: '<i class="mdi mdi-arrow-right" aria-hidden="true"></i> Continuar',
    willOpen: () => {
      Swal.getDenyButton()!.disabled = true;
      Swal.getCancelButton()!.disabled = true;
    },
    didOpen: (popup) => {
      const deadlineLabel = popup.querySelector<HTMLElement>(".freight-alert-deadline-label")!;
      const deadlineValue = popup.querySelector<HTMLElement>(".freight-alert-deadline-value")!;
      const date = popup.querySelector<HTMLElement>(".freight-alert-date")!;
      const countdown = popup.querySelector<HTMLElement>(".freight-alert-countdown")!;
      const configButton = Swal.getDenyButton()!;
      const continueButton = Swal.getCancelButton()!;
      deadlineLabel.textContent = `${plazoEtiqueta}${hoy ? "" : ":"}`;
      deadlineValue.textContent = plazoValor;
      date.textContent = vigencia ? `Fecha de vigencia: ${vigencia}` : "";

      let remaining = 5;
      countdown.textContent = `${remaining}s`;
      interval = setInterval(() => {
        remaining--;
        countdown.style.setProperty("--freight-progress", `${remaining * 20}%`);
        if (remaining > 0) {
          countdown.textContent = `${remaining}s`;
        } else {
          clearInterval(interval);
          interval = undefined;
          countdown.textContent = "✓";
          configButton.disabled = false;
          continueButton.disabled = false;
        }
      }, 1000);
    },
    didClose: () => {
      if (interval !== undefined) clearInterval(interval);
    },
  });
}
