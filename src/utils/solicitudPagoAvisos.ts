import Swal from "sweetalert2";
import "@/styles/solicitud-pago-avisos.css";

// Avisos de la solicitud de pago con el diseño de Control de Gastos (proveedor y monto en recuadro azul)

export const escaparHtml = (texto: string) =>
  texto.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

/** "USD 220.00" */
export function montoConMoneda(monto: number | string | null | undefined, moneda?: string | null) {
  const valor = Number(monto || 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return [moneda, valor].filter(Boolean).join(" ");
}

const ACCIONES_UNA = { actions: "spa-actions spa-actions--single", confirmButton: "spa-btn spa-btn--primary" };
const ACCIONES_DOS = {
  actions: "spa-actions",
  confirmButton: "spa-btn spa-btn--primary",
  cancelButton: "spa-btn spa-btn--outline",
};

const OLA = `<svg class="spa-wave" viewBox="0 0 560 56" preserveAspectRatio="none" aria-hidden="true">
  <path d="M0 30 C140 52 300 8 560 22 L560 56 L0 56 Z" fill="#9ec5f8"/>
  <path d="M0 40 C160 58 330 18 560 32 L560 56 L0 56 Z" fill="#0b5fd6"/>
</svg>`;

/** Solicitud enviada / reenviada a Administración: proveedor y monto */
export async function avisoSolicitudEnviada(opciones: { titulo: string; proveedor: string; monto: string }) {
  await Swal.fire({
    html: `<div class="spa-body">
        <div class="spa-icon spa-icon--ok"><i class="mdi mdi-check-bold"></i></div>
        <h2 class="spa-title spa-title--upper">${escaparHtml(opciones.titulo)}</h2>
        <div class="spa-box">
          <div class="spa-box__row">
            <i class="mdi mdi-storefront-outline spa-box__icon"></i>
            <span class="spa-box__label">Proveedor:</span>
            <span class="spa-box__value">${escaparHtml(opciones.proveedor)}</span>
          </div>
          <div class="spa-box__row">
            <i class="mdi mdi-database-outline spa-box__icon"></i>
            <span class="spa-box__label">Monto:</span>
            <span class="spa-box__value">${escaparHtml(opciones.monto)}</span>
          </div>
        </div>
      </div>`,
    footer: OLA,
    confirmButtonText: "OK",
    buttonsStyling: false,
    customClass: { popup: "spa-popup spa-popup--wave", footer: "spa-footer", ...ACCIONES_UNA },
    didOpen: (popup) => {
      // la ola va pegada al borde inferior, sin el separador del pie de Swal
      const pie = popup.querySelector<HTMLElement>(".swal2-footer");
      if (pie) Object.assign(pie.style, { margin: "0", padding: "0", border: "0", display: "block" });
    },
  });
}

/** "No se puede eliminar" con el motivo y el botón para eliminar primero lo que lo impide; true = eliminarlo */
async function avisoNoSePuedeEliminar(opciones: { icono: string; mensaje: string; boton: string }) {
  const { isConfirmed } = await Swal.fire({
    html: `<div class="spa-body">
        <div class="spa-icon spa-icon--info"><i class="mdi mdi-information-variant"></i></div>
        <h2 class="spa-title">No se puede eliminar</h2>
        <div class="spa-note">
          <i class="mdi ${opciones.icono}"></i>
          <span>${opciones.mensaje}</span>
        </div>
      </div>`,
    showCloseButton: true,
    showCancelButton: true,
    reverseButtons: true,
    focusCancel: true,
    confirmButtonText: `<i class="mdi mdi-trash-can-outline"></i> ${opciones.boton}`,
    cancelButtonText: "Cancelar",
    buttonsStyling: false,
    customClass: { popup: "spa-popup", ...ACCIONES_DOS },
  });
  return isConfirmed;
}

/** La factura / proforma tiene solicitud de pago. true = eliminar primero la solicitud */
export const avisoDocumentoConSolicitud = () =>
  avisoNoSePuedeEliminar({
    icono: "mdi-file-document-alert-outline",
    mensaje: "Este documento tiene una <b>solicitud de pago asociada.</b>",
    boton: "Eliminar solicitud de pago",
  });

/** La solicitud ya tiene soporte de pago (ya se pagó). true = eliminar primero el soporte */
export const avisoSolicitudConSoporte = () =>
  avisoNoSePuedeEliminar({
    icono: "mdi-cash-check",
    mensaje: "Esta solicitud ya tiene <b>soporte de pago</b> (ya se pagó). Primero elimina el soporte con la clave del Super administrador.",
    boton: "Eliminar soporte de pago",
  });

export interface DatosEliminarSolicitud {
  proveedor: string;
  idProveedor: number | string;
  monto: string;
  aprobadaAdministracion: boolean;
  aprobadaGerencia: boolean;
  usuarioAdministracion?: string | null;
  usuarioGerencia?: string | null;
  soporte: boolean;
  /** con aprobaciones o soporte se pide la clave del Super administrador */
  pideClave: boolean;
}

/** Confirmación antes de eliminar una solicitud de pago: aprobaciones, soporte y si pedirá clave */
export async function confirmarEliminarSolicitudPago(d: DatosEliminarSolicitud) {
  const item = (hecho: boolean, texto: string, usuario?: string | null) =>
    `<li class="${hecho ? "spa-aprob__ok" : "spa-aprob__pend"}">
      <i class="mdi ${hecho ? "mdi-check-bold" : "mdi-clock-outline"}"></i>
      <span>${texto}${hecho && usuario ? ` <small>(${escaparHtml(usuario)})</small>` : hecho ? "" : " <small>(pendiente)</small>"}</span>
    </li>`;
  const soporte = d.soporte
    ? `<li class="spa-aprob__warn"><i class="mdi mdi-alert"></i><span>Soporte de pago cargado (ya se pagó)</span></li>`
    : "";
  const { isConfirmed } = await Swal.fire({
    html: `<div class="spa-head">
        <span class="spa-head__icon"><i class="mdi mdi-storefront-outline"></i></span>
        <span class="spa-head__item">Proveedor: <b>${escaparHtml(d.proveedor)}</b></span>
        <span class="spa-head__item">Código: <b>${escaparHtml(String(d.idProveedor))}</b></span>
        <span class="spa-head__item">Monto: <span class="spa-head__pill">${escaparHtml(d.monto)}</span></span>
      </div>
      <div class="spa-del">
        <div class="spa-del__title">
          <span class="spa-del__trash"><i class="mdi mdi-trash-can-outline"></i></span>
          <h2>Eliminar solicitud de pago</h2>
        </div>
        <div class="spa-aprob">
          <span class="spa-aprob__label">Aprobaciones:</span>
          <ul>
            ${item(d.aprobadaAdministracion, "Aprobación de Administración", d.usuarioAdministracion)}
            ${item(d.aprobadaGerencia, "Aprobación de Gerencia", d.usuarioGerencia)}
            ${soporte}
          </ul>
        </div>
        <p class="spa-question">¿Deseas eliminar esta solicitud de pago?</p>
        <p class="spa-sub">Se eliminará del sistema y ya no podrá ser vista ni gestionada.</p>
        ${d.pideClave ? `<span class="spa-key"><i class="mdi mdi-shield-key-outline"></i> Se necesitará la clave del Super administrador.</span>` : ""}
      </div>`,
    showCloseButton: true,
    showCancelButton: true,
    reverseButtons: true,
    focusCancel: true,
    confirmButtonText: `<i class="mdi mdi-trash-can-outline"></i> Sí, eliminar`,
    cancelButtonText: "Cancelar",
    buttonsStyling: false,
    customClass: { popup: "spa-popup", ...ACCIONES_DOS },
  });
  return isConfirmed;
}

/** Confirmación antes de eliminar el soporte de pago (siempre pide la clave del Super administrador) */
export async function confirmarEliminarSoporte(d: { proveedor: string; idProveedor: number | string; monto: string }) {
  const { isConfirmed } = await Swal.fire({
    html: `<div class="spa-head">
        <span class="spa-head__icon"><i class="mdi mdi-storefront-outline"></i></span>
        <span class="spa-head__item">Proveedor: <b>${escaparHtml(d.proveedor)}</b></span>
        <span class="spa-head__item">Código: <b>${escaparHtml(String(d.idProveedor))}</b></span>
        <span class="spa-head__item">Monto: <span class="spa-head__pill">${escaparHtml(d.monto)}</span></span>
      </div>
      <div class="spa-del">
        <div class="spa-del__title">
          <span class="spa-del__trash"><i class="mdi mdi-file-remove-outline"></i></span>
          <h2>Eliminar soporte de pago</h2>
        </div>
        <p class="spa-question">¿Deseas eliminar el soporte de pago?</p>
        <p class="spa-sub">La solicitud volverá a <b>Listo para transferir</b> y se podrá subir otro soporte.</p>
        <span class="spa-key"><i class="mdi mdi-shield-key-outline"></i> Se necesitará la clave del Super administrador.</span>
      </div>`,
    showCloseButton: true,
    showCancelButton: true,
    reverseButtons: true,
    focusCancel: true,
    confirmButtonText: `<i class="mdi mdi-trash-can-outline"></i> Sí, eliminar`,
    cancelButtonText: "Cancelar",
    buttonsStyling: false,
    customClass: { popup: "spa-popup", ...ACCIONES_DOS },
  });
  return isConfirmed;
}
