<script setup lang="ts">
import { abrirArchivo } from "@/composables/useVisorArchivo";
import ExpedienteVarios from "@/components/folderRequests/ExpedienteVarios.vue";
import SolicitudOrigenNota from "@/components/comun/SolicitudOrigenNota.vue";
// Tarjeta móvil / tablet de una solicitud de cobro (mismo diseño que la de Solicitudes de Pago).
// La usan Control de Gastos > Solicitudes de Cobro e Ingresos pendientes por confirmar.
import { computed } from "vue";
import Swal from "sweetalert2";
import type { AreaRevision } from "@/composables/useRevisionSolicitudPago";
import { esPagoParcial, faltaRegistrarCobro, montoCobrado, montoCobro } from "@/composables/useSolicitudCobro";
import type { SolicitudCobro, SolicitudCobroBandeja } from "@/types/solicitudCobro";
import { shortDate } from "@/utils/dates";
import { descargarArchivo } from "@/utils/descargarArchivo";
import { notifySuccess } from "@/utils/request";

const props = defineProps<{
  s: SolicitudCobro | SolicitudCobroBandeja;
  /** áreas que este usuario puede aprobar ahora mismo */
  aprobar?: AreaRevision[];
  puedeEnviar?: boolean;
  puedeRegistrar?: boolean;
  /** subir el soporte de confirmación (Administración) */
  puedeConfirmar?: boolean;
  puedeEditar?: boolean;
  puedeEliminar?: boolean;
  procesando?: boolean;
  revisando?: boolean;
  /** el paso pendiente lo puede rechazar este usuario */
  puedeRechazar?: boolean;
  /** Ingresos pendientes por confirmar: botonera de Administración (subir soporte, devolver, eliminar) */
  bandeja?: boolean;
}>();
const emit = defineEmits<{
  enviar: [];
  aprobar: [tipo: AreaRevision];
  rechazar: [];
  "ver-rechazo": [];
  "ver-soportes": [];
  registrar: [];
  confirmar: [];
  "eliminar-confirmacion": [];
  "ver-ingreso": [];
  editar: [];
  eliminar: [];
}>();

const ICONO_ESTADO: Record<string, string> = {
  BORRADOR: "mdi-pencil-circle-outline",
  PENADM: "mdi-account-outline",
  PENGER: "mdi-clock-outline",
  LISTO: "mdi-clock-outline",
  CONFIRMADO: "mdi-check-circle",
  COBRADO: "mdi-bank-check",
  RECHAZADA: "mdi-close-circle-outline",
  ELIMINADA: "mdi-trash-can-outline",
};

// fechas con el helper de FormatFecha (DD/MMM/YYYY) y la hora si la trae
function fecha(valor: string | null | undefined) {
  if (!valor) return "—";
  return `${shortDate(valor.slice(0, 10))} ${valor.slice(11, 16)}`.trim();
}

const seguimiento = computed(() => {
  const s = props.s;
  const filas: { titulo: string; icono: string; fecha: string; usuario: string | null; nota?: string | null; error?: boolean }[] = [
    { titulo: "Solicitado:", icono: "mdi-calendar-check-outline", fecha: s.fechasolicitud ? fecha(s.fechasolicitud) : "Sin enviar", usuario: s.usuario_solicitud },
  ];
  if (s.usuario_aprobadoadministracion) {
    filas.push({ titulo: "Administración:", icono: "mdi-account-check-outline", fecha: fecha(s.fecha_aprobadoadministracion), usuario: s.usuario_aprobadoadministracion });
  }
  if (s.usuario_aprobadogerencia) {
    filas.push({ titulo: "Gerencia:", icono: "mdi-account-tie-outline", fecha: fecha(s.fecha_aprobadogerencia), usuario: s.usuario_aprobadogerencia });
  }
  if (s.fecha_confirmacion) {
    filas.push({ titulo: "Confirmado:", icono: "mdi-check-decagram-outline", fecha: fecha(s.fecha_confirmacion), usuario: s.usuario_confirma ?? null,
      nota: s.fecha_ingreso ? `Ingreso en banco: ${shortDate(s.fecha_ingreso)}` : null });
  }
  if (s.codigo_estado === "RECHAZADA") {
    filas.push({
      titulo: `Rechazado (${s.area_rechazo === "ADM" ? "Adm." : "Ger."}):`,
      icono: "mdi-close-circle-outline",
      fecha: fecha(s.fecha_rechazo),
      usuario: s.usuario_rechazo,
      nota: s.motivo_rechazo || "Sin motivo",
      error: true,
    });
  }
  return filas;
});

async function copiar(texto: string | null) {
  if (!texto) return;
  try {
    await navigator.clipboard.writeText(texto);
    notifySuccess("Copiado al portapapeles");
  } catch {
    Swal.fire({ icon: "warning", text: "No se pudo copiar. Selecciona el texto y cópialo manualmente." });
  }
}
// celular: el soporte se ve en un modal (imagen o visor PDF); en la web, otra pestaña
function abrir(url: string | null | undefined) {
  abrirArchivo(url);
}
</script>

<template>
  <article class="ccm">
    <div class="ccm__head">
      <span class="ccm__icon">
        <v-icon size="26">mdi-account-cash-outline</v-icon>
      </span>
      <span class="ccm__cliente">{{ s.cliente }}</span>
      <v-btn
        icon
        variant="tonal"
        size="small"
        color="primary"
        title="Copiar cliente"
        aria-label="Copiar cliente"
        data-modo-ver="permitido"
        @click="copiar(s.cliente)"
      >
        <v-icon size="18">
          mdi-content-copy
        </v-icon>
      </v-btn>
    </div>

    <div class="ccm__monto">
      <v-icon
        size="34"
        class="ccm__montoicon"
      >
        mdi-database
      </v-icon>
      <span class="ccm__montoval">{{ montoCobro(montoCobrado(s), s.moneda) }}</span>
      <span
        v-if="esPagoParcial(s)"
        class="ccm__parcial"
      >Parcial de {{ montoCobro(s.monto, s.moneda) }}</span>
    </div>

    <div class="ccm__exp">
      Expediente:
      <ExpedienteVarios
        tipo="cobro"
        :solicitud="s"
      >
        <b>{{ s.expediente }}{{ s.correlativo ? ` - ${s.correlativo}` : "" }}</b>
      </ExpedienteVarios>
    </div>

    <div class="ccm__estado">
      <span
        class="ccm__chip"
        :class="`ccm__chip--${s.codigo_estado}`"
      >
        <v-icon size="20">{{ ICONO_ESTADO[s.codigo_estado] ?? "mdi-circle-outline" }}</v-icon>
        {{ s.estado }}
      </span>
      <SolicitudOrigenNota
        v-if="!bandeja && s.multiexpedienteflag"
        origen="adm"
        tipo="cobro"
      />
    </div>

    <div class="ccm__detail">
      <dl>
        <dt>
          <v-icon size="18">
            mdi-bank-outline
          </v-icon> Cuenta:
        </dt>
        <dd>{{ s.cuenta || "—" }}</dd>
        <dt>
          <v-icon size="18">
            mdi-bank-transfer-in
          </v-icon> Banco cliente:
        </dt>
        <dd>{{ s.banco_origen || "—" }}</dd>
        <dt>
          <v-icon size="18">
            mdi-calendar-outline
          </v-icon> Depósito:
        </dt>
        <dd>{{ fecha(s.fechadeposito) }}</dd>
        <dt>
          <v-icon size="18">
            mdi-pound
          </v-icon> N.° operación:
        </dt>
        <dd>{{ s.numerooperacion || "—" }}</dd>
      </dl>
    </div>

    <!-- seguimiento: etiqueta arriba y "fecha | usuario" debajo -->
    <div class="ccm__linea">
      <div
        v-for="f in seguimiento"
        :key="f.titulo"
        class="ccm__row"
        :class="{ 'ccm__row--error': f.error }"
      >
        <div class="ccm__rowlabel">
          <v-icon size="20">
            {{ f.icono }}
          </v-icon>
          {{ f.titulo }}
        </div>
        <div class="ccm__rowpill">
          <span>{{ f.fecha }}</span>
          <span class="ccm__rowuser">{{ f.usuario || "—" }}</span>
        </div>
        <div
          v-if="f.nota"
          class="ccm__rownota"
        >
          {{ f.nota }}
        </div>
      </div>
    </div>

    <!-- Ingresos pendientes por confirmar: botonera de Administración -->
    <template v-if="bandeja">
      <div class="ccm__bgrid ccm__bgrid--2">
        <v-btn
          v-if="(s.soportes_total ?? 1) > 1"
          class="ccm__bbtn ccm__bbtn--azul ccm__bbtn--full"
          variant="outlined"
          prepend-icon="mdi-folder-open-outline"
          data-modo-ver="permitido"
          @click="emit('ver-soportes')"
        >
          Ver pagos del cliente
        </v-btn>
        <template v-else>
          <v-btn
            class="ccm__bbtn ccm__bbtn--azul"
            variant="outlined"
            prepend-icon="mdi-eye-outline"
            :disabled="!s.voucher_path"
            data-modo-ver="permitido"
            @click="abrir(s.voucher_path)"
          >
            Ver pago del cliente
          </v-btn>
          <v-btn
            class="ccm__bbtn ccm__bbtn--azul"
            variant="outlined"
            prepend-icon="mdi-download"
            :disabled="!s.voucher_path"
            data-modo-ver="permitido"
            @click="descargarArchivo(s.voucher_path, s.voucher_nombre)"
          >
            Descargar
          </v-btn>
        </template>
        <v-btn
          v-if="s.soporte_confirmacion_path"
          class="ccm__bbtn ccm__bbtn--azul ccm__bbtn--full"
          variant="outlined"
          prepend-icon="mdi-eye-outline"
          data-modo-ver="permitido"
          @click="abrir(s.soporte_confirmacion_path)"
        >
          Ver confirmación de ingreso
        </v-btn>
        <v-btn
          v-if="s.id_pagoingreso"
          class="ccm__bbtn ccm__bbtn--full"
          variant="tonal"
          color="success"
          prepend-icon="mdi-check-decagram"
          data-modo-ver="permitido"
          @click="emit('ver-ingreso')"
        >
          Ingreso N° {{ s.numerooperacion_ingreso }}
        </v-btn>
        <v-btn
          v-if="s.codigo_estado === 'CONFIRMADO' && faltaRegistrarCobro(s) && puedeRegistrar"
          class="ccm__bbtn ccm__bbtn--full"
          variant="flat"
          color="success"
          prepend-icon="mdi-bank-transfer-in"
          :loading="procesando"
          @click="emit('registrar')"
        >
          Registrar en banco
        </v-btn>
      </div>

      <div class="ccm__bgrid ccm__bgrid--3">
        <div
          v-if="!s.soporte_confirmacion_path && s.codigo_estado === 'LISTO' && puedeConfirmar"
          class="ccm__bcol"
        >
          <v-btn
            class="ccm__bbtn ccm__bbtn--verde"
            variant="outlined"
            prepend-icon="mdi-upload"
            @click="emit('confirmar')"
          >
            Subir soporte
          </v-btn>
          <small>(Confirmación de ingreso)</small>
        </div>
        <div
          v-else-if="s.soporte_confirmacion_path && puedeEliminar && !s.id_pagoingreso"
          class="ccm__bcol"
        >
          <v-btn
            class="ccm__bbtn ccm__bbtn--rojo"
            variant="outlined"
            prepend-icon="mdi-file-remove-outline"
            title="Requiere la clave del Super administrador"
            :loading="procesando"
            @click="emit('eliminar-confirmacion')"
          >
            Quitar soporte
          </v-btn>
          <small>(Confirmación de ingreso)</small>
        </div>
        <div
          v-if="s.codigo_estado === 'RECHAZADA'"
          class="ccm__bcol"
        >
          <v-btn
            class="ccm__bbtn ccm__bbtn--naranja"
            variant="outlined"
            prepend-icon="mdi-comment-alert-outline"
            data-modo-ver="permitido"
            @click="emit('ver-rechazo')"
          >
            Ver motivo
          </v-btn>
          <small>(Rechazo)</small>
        </div>
        <div
          v-else-if="puedeRechazar"
          class="ccm__bcol"
        >
          <v-btn
            class="ccm__bbtn ccm__bbtn--naranja"
            variant="outlined"
            prepend-icon="mdi-arrow-u-left-top"
            @click="emit('rechazar')"
          >
            Rechazar / Devolver
          </v-btn>
          <small>(Datos incorrectos)</small>
        </div>
        <div
          v-if="puedeEliminar"
          class="ccm__bcol"
        >
          <v-btn
            class="ccm__bbtn ccm__bbtn--rojo"
            variant="outlined"
            prepend-icon="mdi-trash-can-outline"
            :loading="procesando"
            @click="emit('eliminar')"
          >
            Eliminar
          </v-btn>
          <small>(Todo el registro)</small>
        </div>
      </div>
    </template>

    <!-- soporte: voucher del cliente; con las aprobaciones, registrar en Bancos -->
    <div
      v-else
      class="ccm__actions"
    >
      <v-btn
        v-if="(s.soportes_total ?? 1) > 1"
        size="small"
        variant="outlined"
        color="primary"
        rounded="pill"
        prepend-icon="mdi-folder-open-outline"
        data-modo-ver="permitido"
        @click="emit('ver-soportes')"
      >
        Ver todos los soportes de ingreso
      </v-btn>
      <v-btn
        v-else
        size="small"
        variant="outlined"
        color="primary"
        rounded="pill"
        prepend-icon="mdi-eye-outline"
        :disabled="!s.voucher_path"
        data-modo-ver="permitido"
        @click="abrir(s.voucher_path)"
      >
        Ver voucher
      </v-btn>
      <v-btn
        v-if="(s.soportes_total ?? 1) <= 1"
        size="small"
        variant="outlined"
        color="primary"
        rounded="pill"
        prepend-icon="mdi-download"
        :disabled="!s.voucher_path"
        data-modo-ver="permitido"
        @click="descargarArchivo(s.voucher_path, s.voucher_nombre)"
      >
        Descargar
      </v-btn>
      <!-- soporte de confirmación (Administración) -->
      <template v-if="s.soporte_confirmacion_path">
        <v-btn
          size="small"
          variant="outlined"
          color="primary"
          rounded="pill"
          prepend-icon="mdi-file-check-outline"
          data-modo-ver="permitido"
          @click="abrir(s.soporte_confirmacion_path)"
        >
          Ver confirmación
        </v-btn>
        <v-btn
          v-if="puedeEliminar && !s.id_pagoingreso"
          size="small"
          variant="tonal"
          color="error"
          rounded="pill"
          prepend-icon="mdi-trash-can-outline"
          title="Eliminar soporte de confirmación (requiere clave del Super administrador)"
          :loading="procesando"
          @click="emit('eliminar-confirmacion')"
        >
          Eliminar soporte
        </v-btn>
      </template>
      <v-btn
        v-else-if="s.codigo_estado === 'LISTO' && puedeConfirmar"
        size="small"
        variant="outlined"
        color="primary"
        rounded="pill"
        prepend-icon="mdi-upload"
        @click="emit('confirmar')"
      >
        Subir soporte
      </v-btn>
      <v-btn
        v-if="s.id_pagoingreso"
        size="small"
        variant="tonal"
        color="success"
        rounded="pill"
        prepend-icon="mdi-check-decagram"
        data-modo-ver="permitido"
        @click="emit('ver-ingreso')"
      >
        Ingreso N° {{ s.numerooperacion_ingreso }}
      </v-btn>
      <v-btn
        v-if="s.codigo_estado === 'CONFIRMADO' && faltaRegistrarCobro(s) && puedeRegistrar"
        size="small"
        variant="flat"
        color="success"
        rounded="pill"
        prepend-icon="mdi-bank-transfer-in"
        :loading="procesando"
        @click="emit('registrar')"
      >
        REGISTRAR EN BANCO
      </v-btn>
      <v-btn
        v-if="s.codigo_estado === 'BORRADOR' && puedeEnviar"
        size="small"
        variant="flat"
        color="primary"
        rounded="pill"
        prepend-icon="mdi-send"
        :loading="procesando"
        @click="emit('enviar')"
      >
        Enviar
      </v-btn>
      <v-btn
        v-for="tipo in aprobar ?? []"
        :key="tipo"
        size="small"
        variant="tonal"
        :color="tipo === 'ADM' ? 'deep-purple' : 'amber-darken-3'"
        rounded="pill"
        :loading="revisando"
        @click="emit('aprobar', tipo)"
      >
        Aprobar {{ tipo === "ADM" ? "Administración" : "Gerencia" }}
      </v-btn>
      <v-btn
        v-if="puedeRechazar && s.codigo_estado !== 'RECHAZADA'"
        size="small"
        variant="outlined"
        color="error"
        rounded="pill"
        prepend-icon="mdi-close-circle-outline"
        @click="emit('rechazar')"
      >
        Rechazar
      </v-btn>
      <v-btn
        v-if="s.codigo_estado === 'RECHAZADA'"
        size="small"
        variant="outlined"
        color="error"
        rounded="pill"
        prepend-icon="mdi-comment-alert-outline"
        data-modo-ver="permitido"
        @click="emit('ver-rechazo')"
      >
        Ver motivo
      </v-btn>
    </div>

    <!-- 1. editar  2. eliminar -->
    <div
      v-if="!bandeja"
      class="ccm__actions ccm__actions--fin"
    >
      <v-btn
        v-if="puedeEditar && (!bandeja || !s.multiexpedienteflag)"
        size="small"
        variant="tonal"
        :color="s.id_pagoingreso ? 'grey' : 'primary'"
        rounded="pill"
        prepend-icon="mdi-pencil-outline"
        @click="emit('editar')"
      >
        Editar
      </v-btn>
      <v-btn
        v-if="puedeEliminar"
        size="small"
        variant="tonal"
        :color="s.id_pagoingreso ? 'grey' : 'error'"
        rounded="pill"
        prepend-icon="mdi-trash-can-outline"
        :loading="procesando"
        @click="emit('eliminar')"
      >
        Eliminar
      </v-btn>
    </div>
  </article>
</template>

<style scoped>
/* sin borde izquierdo en móvil: todo el ancho para el contenido */
.ccm {
  padding: 4px 12px 12px;
  border: 1px solid #dbe5f5;
  border-radius: 16px;
  background: #ffffff;
  box-shadow: 0 4px 14px rgba(30, 58, 138, 0.08);
  color: #1f2a44;
  font-size: 0.92rem;
}
.ccm__head {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 0;
}
.ccm__icon {
  display: grid;
  flex: 0 0 auto;
  place-items: center;
}
.ccm__cliente {
  flex: 1 1 auto;
  min-width: 0;
  font-size: 1.1rem;
  font-weight: 900;
  line-height: 1.2;
  word-break: break-word;
}
/* ingreso: verde (en Pagos es naranja) */
.ccm__monto {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 14px;
  padding: 12px;
  border-radius: 14px;
  background: #e9f9ef;
}
.ccm__montoicon {
  padding-right: 14px;
  border-right: 2px solid #6fcf97;
  color: #22a35a;
}
.ccm__montoval {
  font-size: 1.8rem;
  font-weight: 900;
  line-height: 1.1;
  color: #15803d;
  overflow-wrap: anywhere;
}
.ccm__exp {
  margin: 10px 8px 0;
  padding: 7px 12px;
  border-radius: 999px;
  background: #e8edf6;
  text-align: center;
  overflow-wrap: anywhere;
}
.ccm__estado {
  margin: 12px 0 8px;
}
.ccm__chip {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 14px 6px 8px;
  border-radius: 999px;
  font-size: 0.95rem;
  font-weight: 700;
}
.ccm__chip--BORRADOR { background: #eceff3; color: #475467; }
.ccm__chip--PENADM { background: #ece2fc; color: #5b21b6; }
.ccm__chip--PENGER { background: #fdf0c4; color: #7a5a00; }
.ccm__chip--LISTO { background: #fdebd3; color: #b45309; }
.ccm__chip--CONFIRMADO { background: #d9f7e1; color: #166534; }
.ccm__chip--COBRADO { background: #dbeafe; color: #1e40af; }
.ccm__chip--RECHAZADA { background: #fde2e2; color: #b42318; }
.ccm__chip--ELIMINADA { background: #eceff3; color: #475467; }
.ccm__detail {
  padding: 10px 12px;
  border-radius: 12px;
  background: #f6f9ff;
}
.ccm__detail dl {
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 6px 10px;
  margin: 0;
  font-size: 0.86rem;
}
.ccm__detail dt {
  color: #5b6b86;
  white-space: nowrap;
}
.ccm__detail dd {
  margin: 0;
  font-weight: 700;
  word-break: break-word;
}
.ccm__linea {
  margin-top: 6px;
}
.ccm__row {
  padding: 8px 0;
  border-bottom: 1px solid #e6ebf3;
}
.ccm__rowlabel {
  display: flex;
  align-items: center;
  gap: 8px;
}
.ccm__rowpill {
  display: flex;
  align-items: center;
  margin: 4px 0 0 28px;
  padding: 4px 10px;
  border-radius: 8px;
  background: #f1f4f9;
  font-size: 0.82rem;
  font-weight: 700;
}
.ccm__rowpill > span:first-child {
  flex: 0 0 auto;
  padding-right: 10px;
  border-right: 1px solid #b8c4d8;
  white-space: nowrap;
}
.ccm__rowuser {
  flex: 1 1 auto;
  min-width: 0;
  padding-left: 10px;
  overflow-wrap: anywhere;
  text-align: center;
}
.ccm__rownota {
  margin: 4px 0 0 28px;
  font-size: 0.82rem;
  color: #5b6b86;
}
.ccm__row--error .ccm__rowlabel {
  color: #b42318;
}
.ccm__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 10px;
}
.ccm__actions--fin {
  justify-content: flex-end;
  padding-top: 10px;
  border-top: 1px solid #dbe5f5;
}
/* botonera de Ingresos pendientes por confirmar */
.ccm__bgrid {
  display: grid;
  gap: 8px;
  margin-top: 12px;
}
.ccm__bgrid--2 {
  grid-template-columns: 1fr 1fr;
}
.ccm__bgrid--3 {
  grid-template-columns: repeat(3, minmax(0, 1fr));
  padding-top: 12px;
  border-top: 1px solid #dbe5f5;
}
.ccm__bgrid:empty {
  display: none;
}
.ccm__bbtn--full {
  grid-column: 1 / -1;
}
.ccm__bcol {
  display: flex;
  flex-direction: column;
  align-items: stretch;
  gap: 4px;
  min-width: 0;
  text-align: center;
}
.ccm__bcol small {
  color: #5b6b86;
  font-size: 0.72rem;
  line-height: 1.2;
}
.ccm__bbtn {
  height: auto !important;
  min-height: 40px;
  padding: 6px 8px !important;
  border-radius: 10px !important;
  font-size: 0.76rem !important;
  font-weight: 800 !important;
  letter-spacing: 0 !important;
  white-space: normal;
}
.ccm__bbtn :deep(.v-btn__content) {
  white-space: normal;
  line-height: 1.15;
}
.ccm__bbtn--azul {
  border: 1.5px solid #1d6fd8 !important;
  background: #eef5ff !important;
  color: #1d4ed8 !important;
}
.ccm__bbtn--verde {
  border: 1.5px solid #22a35a !important;
  background: #ecfbf1 !important;
  color: #15803d !important;
}
.ccm__bbtn--naranja {
  border: 1.5px solid #ea8a0c !important;
  background: #fff6ea !important;
  color: #c2410c !important;
}
.ccm__bbtn--rojo {
  border: 1.5px solid #dc2626 !important;
  background: #fff1f1 !important;
  color: #dc2626 !important;
}
.ccm__parcial {
  padding: 2px 8px;
  border-radius: 999px;
  background: #fdebd3;
  color: #b45309;
  font-size: 0.75rem;
  font-weight: 700;
}
</style>
