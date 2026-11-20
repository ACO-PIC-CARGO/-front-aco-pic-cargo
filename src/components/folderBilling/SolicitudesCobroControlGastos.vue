<script setup lang="ts">
import { abrirArchivo } from "@/composables/useVisorArchivo";
import { computed, ref, watch } from "vue";
import { useDisplay } from "vuetify";
import Swal from "sweetalert2";
import CargarPagoClienteDialog from "./CargarPagoClienteDialog.vue";
import SolicitudCobroVerDialog from "./SolicitudCobroVerDialog.vue";
import SolicitudCobroCardMovil from "./SolicitudCobroCardMovil.vue";
import ConfirmarCobroDialog from "./ConfirmarCobroDialog.vue";
import RechazarSolicitudDialog from "./RechazarSolicitudDialog.vue";
import SoportesCobroDialog from "./SoportesCobroDialog.vue";
import { useRechazoSolicitud, verMotivoRechazo } from "@/composables/useRechazoSolicitud";
import { faltaRegistrarCobro } from "@/composables/useSolicitudCobro";
import type { SolicitudConfirmar } from "./ConfirmarCobroDialog.vue";
import { usePermissions } from "@/composables/usePermissions";
import {
  areaRechazoCobro,
  avisarIngresoBancosCobro,
  filasPorSoporte,
  type FilaSoporteCobro,
  editarPideClaveCobro,
  esPagoParcial,
  montoCobrado,
  montoCobro,
  tieneAprobacionesCobro,
  useSolicitudCobro,
} from "@/composables/useSolicitudCobro";
import { useRouter } from "vue-router";
import { useSolicitudesMasterStore } from "@/stores/solicitudesMaster";
import type { AdminCredentials } from "@/types/seguridad";
import type { DestinoPagoCliente, SolicitudCobro, SoporteCobro } from "@/types/solicitudCobro";
import { CONNECTION_ERROR_MESSAGE, hasFailed } from "@/utils/request";
import { shortDate } from "@/utils/dates";
import { descargarArchivo } from "@/utils/descargarArchivo";

// Control de Gastos > "Solicitudes de Cobro" del expediente (debajo de Costos, encima de Pagos).
// Usa los mismos datos que la columna "Envíos / Administración" de Ingresos (una sola llamada).
const props = defineProps<{ idMaster?: number | null }>();

const { can } = usePermissions();
const { smAndDown } = useDisplay();
const store = useSolicitudesMasterStore();
const solicitudes = computed<SolicitudCobro[]>(() => (props.idMaster ? store.cobros[props.idMaster] ?? [] : []));
// una fila por soporte (pago cargado)
const filas = computed(() => filasPorSoporte(solicitudes.value));
// la solicitud completa (con todos sus pagos) de una fila
const solicitudDe = (fila: { codigo: string }) => solicitudes.value.find((s) => s.codigo === fila.codigo)!;
// eliminar desde una fila: si la solicitud tiene más pagos se quita solo ese; si es el único, la solicitud
function eliminarFila(fila: FilaSoporteCobro<SolicitudCobro>) {
  const s = solicitudDe(fila);
  if (fila._soporte && (s.soportes?.length ?? 0) > 1) eliminarSoporte(s, fila._soporte);
  else eliminar(s);
}
const cargando = ref(false);

// forzar = después de una acción o con "Actualizar"; al entrar solo si Ingresos no lo cargó recién
async function cargar(forzar = true) {
  if (!props.idMaster) return;
  cargando.value = true;
  const response = forzar ? await store.cargarCobros(props.idMaster) : await store.asegurarCobros(props.idMaster);
  cargando.value = false;
  if (response && hasFailed(response)) Swal.fire({ icon: "warning", text: response.mensaje || CONNECTION_ERROR_MESSAGE });
}
// no se recarga sola al volver a la pestaña del navegador (botón "Actualizar")
watch(() => props.idMaster, () => cargar(false), { immediate: true });

// sin aprobaciones de Administración / Gerencia: enviada queda pendiente por confirmar
const { procesando, enviar, eliminar, eliminarSoporte, registrarEnBancos, claveSiAprobada, eliminarConfirmacion } =
  useSolicitudCobro(() => cargar());


// modo ver (ojito), igual que en Solicitudes de Pago
const dialogVer = ref(false);
const codigoVer = ref<string | null>(null);
function verSolicitud(s: { codigo: string }) {
  codigoVer.value = s.codigo;
  dialogVer.value = true;
}
// Rechazar: Administración (04 / 01) mientras está pendiente por confirmar
const { dialogRechazo, rechazoSel, puedeRechazar, tituloRechazar, abrirRechazo } = useRechazoSolicitud(areaRechazoCobro);
// varios pagos parciales del cliente
const dialogSoportes = ref(false);
const solicitudSoportes = ref<SolicitudCobro | null>(null);
function verSoportes(s: SolicitudCobro) {
  solicitudSoportes.value = s;
  dialogSoportes.value = true;
}
// estado con ícono (diseño del listado)
// Soporte de confirmación (Administración): subir con la fecha de ingreso en banco
const dialogConfirmar = ref(false);
const solicitudConfirmar = ref<SolicitudConfirmar | null>(null);
function abrirConfirmar(s: SolicitudConfirmar) {
  solicitudConfirmar.value = s;
  dialogConfirmar.value = true;
}
const ICONO_ESTADO_LISTA: Record<string, string> = {
  BORRADOR: "mdi-pencil-circle-outline",
  PENADM: "mdi-clock-outline",
  PENGER: "mdi-clock-outline",
  LISTO: "mdi-clock-outline",
  CONFIRMADO: "mdi-check-circle",
  COBRADO: "mdi-bank-check",
  RECHAZADA: "mdi-close-circle",
  ELIMINADA: "mdi-trash-can-outline",
};

// editar: el mismo diálogo de "Cargar Pago Cliente"
const dialogEditar = ref(false);
const destinoEditar = ref<DestinoPagoCliente | null>(null);
const solicitudEditar = ref<SolicitudCobro | null>(null);
const adminEditar = ref<AdminCredentials | null>(null);
const soporteEditar = ref<SoporteCobro | null>(null);
// varios pagos parciales: se elige cuál editar en la lista de soportes
async function editar(s: SolicitudCobro, soporte: SoporteCobro | null = null) {
  if (avisarIngresoBancosCobro(s)) return;
  if (!soporte && (s.soportes?.length ?? 0) > 1) {
    verSoportes(s);
    return;
  }
  soporteEditar.value = soporte ?? s.soportes?.[0] ?? null;
  const admin = await claveSiAprobada(s, "editarla");
  if (admin === undefined) return;
  adminEditar.value = admin;
  destinoEditar.value = {
    id_house: s.id_house,
    id_correlativo: s.id_correlativo,
    cliente: s.cliente,
    correlativo: s.correlativo,
    deuda: s.monto,
  };
  solicitudEditar.value = s;
  dialogEditar.value = true;
}

// celular: el soporte se ve en un modal (imagen o visor PDF); en la web, otra pestaña
function abrir(url: string | null | undefined) {
  abrirArchivo(url);
}
// aprobaciones como en Pagos: fecha arriba (helper de FormatFecha) y hora abajo
function soloFecha(valor: string | null | undefined) {
  return valor ? shortDate(valor.slice(0, 10)) : "—";
}
function horaDe(valor: string | null | undefined) {
  return valor ? valor.slice(11, 16) : "";
}
const router = useRouter();
function verIngreso(s: SolicitudCobro) {
  if (s.id_pagoingreso) window.open(router.resolve({ name: "verPagosPorCliente", params: { id: s.id_pagoingreso } }).href, "_blank");
}

defineExpose({ cargar });
</script>

<template>
  <section class="solcob">
    <div class="solcob__bar">
      <v-btn
        size="small"
        variant="text"
        color="primary"
        prepend-icon="mdi-refresh"
        :loading="cargando"
        @click="cargar()"
      >
        Actualizar
      </v-btn>
    </div>

    <!-- celular: sin solicitudes, solo el mensaje (en la web la tabla muestra sus cabeceras, como Pagos) -->
    <p
      v-if="smAndDown && !cargando && !solicitudes.length"
      class="solcob__vacio"
    >
      No hay solicitudes de cobro en este expediente. Se crean con <b>Cargar Pago Cliente</b> en Ingresos.
    </p>

    <!-- web: tabla -->
    <div
      v-else-if="!smAndDown"
      class="solcob__wrap"
    >
      <table class="solcob__table">
        <thead>
          <tr>
            <th>Fecha de solicitud</th>
            <th>Expediente</th>
            <th>Cliente</th>
            <th>Monto</th>
            <th>Banco</th>
            <th>N° de cuenta / Código</th>
            <th>Estado</th>
            <th>Soporte de pago (Cliente)</th>
            <th>Fecha de ingreso en banco</th>
            <th>Soporte de confirmación (Administración)</th>
            <th>Persona que confirma</th>
            <th>Fecha de confirmación</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="!solicitudes.length">
            <td
              colspan="12"
              class="solcob__empty"
            >
              {{ cargando ? "Cargando solicitudes..." : "No hay solicitudes de cobro registradas." }}
            </td>
          </tr>
          <tr
            v-for="s in filas"
            :key="s._key"
          >
            <td>
              <div
                v-if="s.fechasolicitud"
                class="cobl__fecha"
              >
                <span>{{ soloFecha(s.fechasolicitud) }}</span>
                <span>{{ horaDe(s.fechasolicitud) }}</span>
              </div>
              <span v-else>Sin enviar</span>
            </td>
            <td>
              <span
                class="cobl__exp"
              >
                {{ s.expediente }}
              </span>
              <div
                v-if="s.correlativo"
                class="cobl__corr"
              >
                Corr. {{ s.correlativo }}
              </div>
            </td>
            <td>
              <span class="cobl__cliente">{{ s.cliente }}</span>
            </td>
            <td>
              <span class="cobl__monto">{{ montoCobro(montoCobrado(s), s.moneda) }}</span>
              <span
                v-if="esPagoParcial(s)"
                class="cobl__parcial"
              >Parcial de {{ montoCobro(s.monto, s.moneda) }}</span>
            </td>
            <td>
              <b>{{ s.banco || "—" }}</b>
            </td>
            <td>
              <span class="cobl__nowrap">{{ s.nrocuenta || "—" }}</span>
            </td>
            <td>
              <span
                class="cobl__estado"
                :class="`cobl__estado--${s.codigo_estado}`"
              >
                <v-icon size="16">{{ ICONO_ESTADO_LISTA[s.codigo_estado] ?? "mdi-circle-outline" }}</v-icon>
                {{ s.estado }}
              </span>
              <div
                v-if="s.codigo_estado === 'RECHAZADA'"
                class="cobl__motivo"
              >
                {{ s.motivo_rechazo || "Sin motivo" }}
              </div>
            </td>
            <td>
              <!-- un soporte: el ojo; dos o más: "Ver todos los soportes de ingreso" -->
              <v-btn
                v-if="(s.soportes_total ?? 1) > 1"
                variant="text"
                size="small"
                color="primary"
                prepend-icon="mdi-folder-open-outline"
                class="cobl__vertodos"
                data-modo-ver="permitido"
                @click="verSoportes(s)"
              >
                Ver todos los soportes de ingreso
              </v-btn>
              <div
                v-else
                class="cobl__iconos"
              >
                <v-btn
                  icon="mdi-eye-outline"
                  variant="outlined"
                  size="small"
                  rounded="lg"
                  color="primary"
                  class="cobl__ojo"
                  :disabled="!s.voucher_path"
                  title="Ver soporte de pago del cliente"
                  aria-label="Ver soporte de pago del cliente"
                  data-modo-ver="permitido"
                  @click="abrir(s.voucher_path)"
                />
                <v-btn
                  icon="mdi-download"
                  variant="text"
                  size="small"
                  color="primary"
                  :disabled="!s.voucher_path"
                  title="Descargar soporte de pago del cliente"
                  aria-label="Descargar soporte de pago del cliente"
                  data-modo-ver="permitido"
                  @click="descargarArchivo(s.voucher_path, s.voucher_nombre)"
                />
              </div>
            </td>
            <td>
              <span
                v-if="s.fecha_ingreso"
                class="cobl__chipfecha"
              >{{ soloFecha(s.fecha_ingreso) }}</span>
              <span v-else>—</span>
            </td>
            <td>
              <div
                v-if="s.soporte_confirmacion_path"
                class="cobl__soportecol"
              >
                <div class="cobl__iconos">
                  <v-btn
                    icon="mdi-eye-outline"
                    variant="outlined"
                    size="small"
                    rounded="lg"
                    color="primary"
                    class="cobl__ojo"
                    title="Ver soporte de confirmación"
                    aria-label="Ver soporte de confirmación"
                    data-modo-ver="permitido"
                    @click="abrir(s.soporte_confirmacion_path)"
                  />
                  <v-btn
                    icon="mdi-download"
                    variant="text"
                    size="small"
                    color="primary"
                    title="Descargar soporte de confirmación"
                    aria-label="Descargar soporte de confirmación"
                    data-modo-ver="permitido"
                    @click="descargarArchivo(s.soporte_confirmacion_path, s.soporte_confirmacion_nombre)"
                  />
                  <!-- ya confirmado: el soporte solo se elimina con la clave del Super administrador -->
                  <v-btn
                    v-if="can('listControlGastos', 'ELIMINAR') && !s.id_pagoingreso"
                    icon="mdi-trash-can-outline"
                    variant="text"
                    size="small"
                    color="error"
                    title="Eliminar soporte de confirmación (requiere clave del Super administrador)"
                    aria-label="Eliminar soporte de confirmación"
                    :loading="procesando === s.codigo"
                    @click="eliminarConfirmacion(s)"
                  />
                </div>
                <!-- con el soporte cargado ya se puede registrar el ingreso en Bancos -->
                <button
                  v-if="s.id_pagoingreso"
                  type="button"
                  class="cobl__ingreso"
                  title="Ver el ingreso registrado en Bancos"
                  data-modo-ver="permitido"
                  @click="verIngreso(s)"
                >
                  <v-icon
                    size="16"
                    color="success"
                  >
                    mdi-check-decagram
                  </v-icon>
                  Ingreso N° {{ s.numerooperacion_ingreso }}
                </button>
                <!-- un ingreso por pago cargado: sigue el botón mientras falte alguno -->
                <v-btn
                  v-if="s.codigo_estado === 'CONFIRMADO' && faltaRegistrarCobro(s) && can('registroPayForCliente', 'NUEVO')"
                  size="small"
                  color="success"
                  variant="flat"
                  prepend-icon="mdi-bank-transfer-in"
                  :loading="procesando === s.codigo"
                  @click="registrarEnBancos(s)"
                >
                  REGISTRAR EN BANCO<template v-if="(s.soportes_total ?? 1) > 1">
                    ({{ (s.soportes_registrados ?? 0) + 1 }}/{{ s.soportes_total }})
                  </template>
                </v-btn>
              </div>
              <v-btn
                v-else
                icon="mdi-file-upload-outline"
                variant="text"
                size="small"
                color="primary"
                :disabled="s.codigo_estado !== 'LISTO' || !can('listControlGastos', 'MODIFICAR')"
                :title="s.codigo_estado === 'LISTO' ? 'Subir soporte de confirmación' : 'Se sube cuando la solicitud está enviada (pendiente por confirmar)'"
                aria-label="Subir soporte de confirmación"
                @click="abrirConfirmar(s)"
              />
            </td>
            <td>
              <b class="cobl__persona">{{ s.usuario_confirma || "—" }}</b>
            </td>
            <td>
              <span
                v-if="s.fecha_confirmacion"
                class="cobl__chipfecha"
              >{{ soloFecha(s.fecha_confirmacion) }}<br>{{ horaDe(s.fecha_confirmacion) }}</span>
              <span v-else>—</span>
            </td>
            <td>
              <div class="solcob__acciones">
                <v-btn
                  v-if="s.codigo_estado === 'BORRADOR' && can('listControlGastos', 'NUEVO')"
                  size="x-small"
                  variant="flat"
                  color="primary"
                  prepend-icon="mdi-send"
                  :loading="procesando === s.codigo"
                  @click="enviar(s)"
                >
                  Enviar
                </v-btn>
                <v-btn
                  v-if="can('listControlGastos', 'NUEVO')"
                  icon="mdi-pencil-outline"
                  size="small"
                  variant="outlined"
                  rounded="lg"
                  class="cobl__accion"
                  :color="s.id_pagoingreso ? 'grey' : 'primary'"
                  :title="`Editar solicitud${editarPideClaveCobro(s) ? ' (requiere clave de administrador)' : ''}`"
                  aria-label="Editar solicitud de cobro"
                  @click="editar(solicitudDe(s), s._soporte)"
                />
                <v-btn
                  v-if="can('listControlGastos', 'ELIMINAR')"
                  icon="mdi-trash-can-outline"
                  size="small"
                  variant="outlined"
                  rounded="lg"
                  class="cobl__accion"
                  :color="s.id_pagoingreso ? 'grey' : 'error'"
                  :title="`Eliminar solicitud${tieneAprobacionesCobro(s) ? ' (requiere clave de administrador)' : ''}`"
                  aria-label="Eliminar solicitud de cobro"
                  :loading="procesando === s.codigo"
                  @click="eliminarFila(s)"
                />
                <v-btn
                  icon="mdi-eye-outline"
                  variant="tonal"
                  size="small"
                  color="primary"
                  title="Ver solicitud de cobro"
                  aria-label="Ver solicitud de cobro"
                  data-modo-ver="permitido"
                  @click="verSolicitud(s)"
                />
                <v-btn
                  v-if="s.codigo_estado === 'RECHAZADA'"
                  size="small"
                  variant="outlined"
                  rounded="lg"
                  color="error"
                  prepend-icon="mdi-comment-alert-outline"
                  class="cobl__rechazar"
                  data-modo-ver="permitido"
                  @click="verMotivoRechazo({ motivo: s.motivo_rechazo, usuario: s.usuario_rechazo, fecha: s.fecha_rechazo, area: s.area_rechazo })"
                >
                  Ver motivo
                </v-btn>
                <v-btn
                  v-else-if="can('listControlGastos', 'MODIFICAR')"
                  size="small"
                  variant="outlined"
                  rounded="lg"
                  color="error"
                  class="cobl__rechazar"
                  :disabled="!puedeRechazar(s.codigo_estado, true)"
                  :title="tituloRechazar(s.codigo_estado)"
                  @click="abrirRechazo(s.codigo, s.codigo_estado)"
                >
                  Rechazar
                </v-btn>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- celular y tablet: tarjetas -->
    <div
      v-else
      class="solcob__cards"
    >
      <template
        v-for="(s, i) in filas"
        :key="s._key"
      >
        <!-- separador marcado entre solicitudes -->
        <v-divider
          v-if="i > 0"
          class="solcob__sep"
          :thickness="2"
          opacity="1"
        />
        <SolicitudCobroCardMovil
          :s="s"
          :puede-rechazar="puedeRechazar(s.codigo_estado, can('listControlGastos', 'MODIFICAR'))"
          :puede-enviar="can('listControlGastos', 'NUEVO')"
          :puede-registrar="can('registroPayForCliente', 'NUEVO')"
          :puede-confirmar="can('listControlGastos', 'MODIFICAR')"
          :puede-editar="can('listControlGastos', 'NUEVO')"
          :puede-eliminar="can('listControlGastos', 'ELIMINAR')"
          :procesando="procesando === s.codigo"
          @enviar="enviar(s)"
          @rechazar="abrirRechazo(s.codigo, s.codigo_estado)"
          @ver-rechazo="verMotivoRechazo({ motivo: s.motivo_rechazo, usuario: s.usuario_rechazo, fecha: s.fecha_rechazo, area: s.area_rechazo })"
          @ver-soportes="verSoportes(s)"
          @registrar="registrarEnBancos(s)"
          @confirmar="abrirConfirmar(s)"
          @eliminar-confirmacion="eliminarConfirmacion(s)"
          @ver-ingreso="verIngreso(s)"
          @editar="editar(solicitudDe(s), s._soporte)"
          @eliminar="eliminarFila(s)"
        />
      </template>
    </div>

    <CargarPagoClienteDialog
      v-model="dialogEditar"
      :destino="destinoEditar"
      :solicitud="solicitudEditar"
      :soporte="soporteEditar"
      :admin="adminEditar"
      @guardado="cargar()"
    />
    <RechazarSolicitudDialog
      v-model="dialogRechazo"
      :solicitud="rechazoSel"
      tipo="INGRESO"
      ruta="solicitud_cobro_rechazar"
      @rechazado="cargar()"
    />
    <SoportesCobroDialog
      v-model="dialogSoportes"
      :soportes="solicitudSoportes?.soportes ?? []"
      :moneda="solicitudSoportes?.moneda ?? null"
      :total="solicitudSoportes?.monto ?? 0"
      :cliente="solicitudSoportes?.cliente"
      :expediente="solicitudSoportes?.expediente"
      :correlativo="solicitudSoportes?.correlativo"
      :solicitud="solicitudSoportes"
      :editable="can('listControlGastos', 'NUEVO') && !solicitudSoportes?.confirmadoflag"
      :eliminable="can('listControlGastos', 'ELIMINAR') && !solicitudSoportes?.confirmadoflag"
      @editar="(sop) => { dialogSoportes = false; editar(solicitudSoportes!, sop); }"
      @eliminar="async (sop) => { if (await eliminarSoporte(solicitudSoportes!, sop)) dialogSoportes = false; }"
    />
    <ConfirmarCobroDialog
      v-model="dialogConfirmar"
      :solicitud="solicitudConfirmar"
      @guardado="cargar()"
    />
    <SolicitudCobroVerDialog
      v-model="dialogVer"
      :codigo="codigoVer"
    />
  </section>
</template>

<style scoped>
/* ===== listado de solicitudes de cobro (diseño acordado) ===== */
.cobl__parcial {
  display: block;
  margin-top: 2px;
  color: #b45309;
  font-size: 0.72rem;
  font-weight: 700;
  white-space: nowrap;
}
.cobl__vertodos {
  height: auto !important;
  min-height: 28px;
  padding: 2px 6px !important;
  font-size: 0.75rem;
  font-weight: 600;
  letter-spacing: 0;
  text-decoration: underline;
  text-transform: none;
}
.cobl__vertodos :deep(.v-btn__content) {
  white-space: normal;
  text-align: center;
}
.cobl__rechazar {
  min-width: 0;
  font-weight: 600;
  letter-spacing: 0;
  text-transform: none;
}
.cobl__soportecol {
  display: inline-flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}
.cobl__ingreso {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 2px 10px;
  border: 0;
  border-radius: 999px;
  background: rgba(46, 160, 67, 0.12);
  color: #1f7a35;
  font-size: 0.8rem;
  font-weight: 600;
  white-space: nowrap;
  cursor: pointer;
}
.cobl__fecha {
  display: flex;
  flex-direction: column;
  line-height: 1.3;
  white-space: nowrap;
}
.cobl__exp {
  display: inline-block;
  padding: 3px 10px;
  border-radius: 8px;
  background: #e3ebfa;
  color: #1e3a8a;
  font-weight: 700;
  white-space: nowrap;
}
button.cobl__exp:hover {
  text-decoration: underline;
}
.cobl__corr {
  margin-top: 4px;
  color: #5b6b86;
  font-size: 0.78rem;
}
.cobl__cliente,
.cobl__persona {
  font-weight: 700;
  color: #1f2a44;
}
.cobl__monto {
  font-weight: 800;
  white-space: nowrap;
}
.cobl__nowrap {
  white-space: nowrap;
}
.cobl__estado {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 5px 10px;
  border-radius: 8px;
  font-size: 0.8rem;
  font-weight: 700;
  line-height: 1.2;
  text-align: left;
}
.cobl__estado--BORRADOR { background: #eceff3; color: #475467; }
.cobl__estado--PENADM,
.cobl__estado--PENGER { background: #fdebd3; color: #b45309; }
.cobl__estado--LISTO { background: #fdebd3; color: #b45309; }
.cobl__estado--CONFIRMADO { background: #d9f7e1; color: #166534; }
.cobl__estado--CONFIRMADO .v-icon { color: #16a34a; }
.cobl__estado--COBRADO { background: #dbeafe; color: #1e40af; }
.cobl__estado--RECHAZADA { background: #fde2e2; color: #b42318; }
.cobl__estado--ELIMINADA { background: #eceff3; color: #475467; }
.cobl__motivo {
  max-width: 200px;
  margin: 4px auto 0;
  color: #b42318;
  font-size: 0.75rem;
}
.cobl__iconos {
  display: inline-flex;
  align-items: center;
  gap: 2px;
}
.cobl__ojo {
  border-color: #93b4f0 !important;
}
.cobl__chipfecha {
  display: inline-block;
  padding: 4px 12px;
  border-radius: 8px;
  background: #e3ebfa;
  color: #1e3a8a;
  font-size: 0.8rem;
  font-weight: 700;
  line-height: 1.3;
  white-space: nowrap;
}
.cobl__accion {
  border-color: currentColor !important;
}
.solcob__bar {
  display: flex;
  justify-content: flex-end;
  margin-bottom: 4px;
}
.solcob__empty {
  padding: 28px 12px !important;
  color: #5b6b86;
  text-align: center;
}
/* aviso vacío: recuadro blanco (el mismo en Pagos, celular) */
.solcob__vacio {
  margin: 0;
  padding: 14px;
  border: 1px dashed #c9d3e1;
  border-radius: 12px;
  background: #ffffff;
  color: #5b6b86;
  text-align: center;
}
/* mismo contenedor que "Solicitudes de Pagos Administración": fondo blanco y sombra */
.solcob__wrap {
  overflow-x: auto;
  border: 1px solid #dbe5f5;
  border-radius: 14px;
  background: #ffffff;
  box-shadow: 0 4px 16px rgba(30, 58, 138, 0.06);
}
.solcob__table tbody tr:hover td {
  background: #f8fbff;
}
.solcob__table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
}
.solcob__table th {
  padding: 10px 8px;
  background: #eaf2ff;
  color: #1e3a8a;
  font-weight: 700;
  text-align: center;
  white-space: nowrap;
}
.solcob__table td {
  padding: 8px;
  border-top: 1px solid #edf1f7;
  text-align: center;
  vertical-align: middle;
}
.solcob__cliente {
  max-width: 220px;
  text-align: left !important;
}
.solcob__monto {
  font-weight: 800;
  white-space: nowrap;
}
.solcob__estado {
  display: inline-block;
  padding: 3px 10px;
  border-radius: 10px;
  font-size: 12px;
  font-weight: 700;
  line-height: 1.3;
}
.solcob__motivo {
  max-width: 200px;
  margin-top: 2px;
  color: #c62828;
  font-size: 11.5px;
}
.solcob__soporte {
  display: inline-flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}
.solcob__soporteicons {
  display: inline-flex;
  align-items: center;
}
.solcob__thsub {
  font-size: 0.7rem;
  font-weight: 600;
  color: #667085;
}
.solcob__aprob {
  font-size: 0.8rem;
  line-height: 1.5;
  text-align: center;
}
.solcob__aprobuser {
  font-weight: 600;
  white-space: nowrap;
}
.solcob__aprobfecha {
  display: inline-block;
  margin-top: 2px;
  padding: 2px 10px;
  border-radius: 8px;
  line-height: 1.3;
  text-align: center;
  background: #e7efff;
  color: #1e3a8a;
  font-size: 0.72rem;
  font-weight: 600;
  white-space: nowrap;
}
.solcob__aprobfecha--rechazo {
  background: #fde2e2;
  color: #b42318;
}
.solcob__rechazotag {
  display: inline-block;
  padding: 0 8px;
  border-radius: 999px;
  background: #fde2e2;
  color: #b42318;
  font-size: 0.7rem;
  font-weight: 700;
  text-transform: uppercase;
}
.solcob__revisar {
  text-transform: none;
  letter-spacing: 0;
  font-weight: 600;
}
.solcob__muted {
  color: #98a2b3;
}
.solcob__salida {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 2px 10px;
  border: 0;
  border-radius: 999px;
  background: rgba(46, 160, 67, 0.12);
  color: #1f7a35;
  font-size: 0.8rem;
  font-weight: 600;
  white-space: nowrap;
  cursor: pointer;
}
.solcob__acciones {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
}
/* separador entre solicitudes (móvil): marcado para no confundir una tarjeta con otra */
.solcob__sep {
  margin: 2px 8px;
  border-color: #9fb4d6;
}
.solcob__cards {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
</style>
