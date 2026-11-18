<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { useDisplay } from "vuetify";
import Swal from "sweetalert2";
import CargarPagoClienteDialog from "./CargarPagoClienteDialog.vue";
import SolicitudCobroVerDialog from "./SolicitudCobroVerDialog.vue";
import SolicitudCobroCardMovil from "./SolicitudCobroCardMovil.vue";
import { usePermissions } from "@/composables/usePermissions";
import { tienePerfilRevision } from "@/composables/useRevisionSolicitudPago";
import type { AreaRevision } from "@/composables/useRevisionSolicitudPago";
import { avisarIngresoBancosCobro, montoCobro, tieneAprobacionesCobro, useSolicitudCobro } from "@/composables/useSolicitudCobro";
import { useRouter } from "vue-router";
import { useSolicitudesMasterStore } from "@/stores/solicitudesMaster";
import type { AdminCredentials } from "@/types/seguridad";
import type { DestinoPagoCliente, SolicitudCobro } from "@/types/solicitudCobro";
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

const { procesando, revisando, revisar, enviar, eliminar, registrarEnBancos, claveSiAprobada } = useSolicitudCobro(() => cargar());
const puedeRevisarArea = (s: SolicitudCobro, tipo: AreaRevision) =>
  can("listControlGastos", "MODIFICAR") && s.codigo_estado === (tipo === "ADM" ? "PENADM" : "PENGER") && tienePerfilRevision(tipo);


// modo ver (ojito), igual que en Solicitudes de Pago
const dialogVer = ref(false);
const codigoVer = ref<string | null>(null);
function verSolicitud(s: { codigo: string }) {
  codigoVer.value = s.codigo;
  dialogVer.value = true;
}
const AREAS: AreaRevision[] = ["ADM", "GER"];
const COLOR_ESTADO: Record<string, string> = {
  BORRADOR: "grey-darken-1",
  PENADM: "orange-darken-2",
  PENGER: "amber-darken-3",
  LISTO: "blue",
  COBRADO: "green-darken-2",
  RECHAZADA: "red",
};

// editar: el mismo diálogo de "Cargar Pago Cliente"
const dialogEditar = ref(false);
const destinoEditar = ref<DestinoPagoCliente | null>(null);
const solicitudEditar = ref<SolicitudCobro | null>(null);
const adminEditar = ref<AdminCredentials | null>(null);
async function editar(s: SolicitudCobro) {
  if (avisarIngresoBancosCobro(s)) return;
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

function fecha(valor: string | null | undefined) {
  if (!valor) return "—";
  return `${shortDate(valor.slice(0, 10))} ${valor.slice(11, 16)}`.trim();
}
function abrir(url: string | null | undefined) {
  if (url) window.open(url, "_blank");
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
function aprobacion(s: SolicitudCobro, tipo: AreaRevision) {
  const adm = tipo === "ADM";
  return {
    usuario: adm ? s.usuario_aprobadoadministracion : s.usuario_aprobadogerencia,
    fecha: adm ? s.fecha_aprobadoadministracion : s.fecha_aprobadogerencia,
    rechazado: s.codigo_estado === "RECHAZADA" && s.area_rechazo === tipo,
    pendiente: s.codigo_estado === (adm ? "PENADM" : "PENGER"),
  };
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
            <th>Cliente</th>
            <th>Monto</th>
            <th>Cuenta de depósito</th>
            <th>Banco del cliente</th>
            <th>Depósito / N° Op.</th>
            <th>Estado</th>
            <th>
              Administración
              <div class="solcob__thsub">
                Aprobado por
              </div>
            </th>
            <th>
              Gerencia
              <div class="solcob__thsub">
                Aprobado por
              </div>
            </th>
            <th>Soporte</th>
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
            v-for="s in solicitudes"
            :key="s.codigo"
          >
            <td>{{ s.fechasolicitud ? fecha(s.fechasolicitud) : "Sin enviar" }}</td>
            <td class="solcob__cliente">
              {{ s.cliente }}
              <div class="text-body-small">
                Corr. {{ s.correlativo }}
              </div>
            </td>
            <td class="solcob__monto">
              {{ montoCobro(s.monto, s.moneda) }}
            </td>
            <td>{{ s.cuenta }}</td>
            <td>{{ s.banco_origen || "—" }}</td>
            <td>
              {{ fecha(s.fechadeposito) }}
              <div class="text-body-small">
                {{ s.numerooperacion }}
              </div>
            </td>
            <td>
              <span
                class="solcob__estado"
                :class="`bg-${COLOR_ESTADO[s.codigo_estado] ?? 'grey'}`"
              >{{ s.estado }}</span>
              <div
                v-if="s.codigo_estado === 'RECHAZADA'"
                class="solcob__motivo"
              >
                {{ s.motivo_rechazo || "Sin motivo" }}
              </div>
            </td>
            <td
              v-for="tipo in AREAS"
              :key="tipo"
            >
              <div class="solcob__aprob">
                <template v-if="aprobacion(s, tipo).usuario">
                  <div class="solcob__aprobuser">
                    {{ aprobacion(s, tipo).usuario }}
                  </div>
                  <span class="solcob__aprobfecha">{{ soloFecha(aprobacion(s, tipo).fecha) }}<template v-if="horaDe(aprobacion(s, tipo).fecha)"><br>{{ horaDe(aprobacion(s, tipo).fecha) }}</template></span>
                </template>
                <template v-else-if="aprobacion(s, tipo).rechazado">
                  <span class="solcob__rechazotag">Rechazado</span>
                  <div class="solcob__aprobuser">
                    {{ s.usuario_rechazo || "—" }}
                  </div>
                  <span class="solcob__aprobfecha solcob__aprobfecha--rechazo">{{ soloFecha(s.fecha_rechazo) }}<template v-if="horaDe(s.fecha_rechazo)"><br>{{ horaDe(s.fecha_rechazo) }}</template></span>
                </template>
                <v-btn
                  v-else-if="puedeRevisarArea(s, tipo)"
                  size="small"
                  variant="tonal"
                  :color="tipo === 'ADM' ? 'deep-purple' : 'amber-darken-3'"
                  class="solcob__revisar"
                  :loading="revisando === s.codigo"
                  @click="revisar(s, tipo)"
                >
                  Aprobar
                </v-btn>
                <span
                  v-else
                  class="solcob__muted"
                >—</span>
              </div>
            </td>
            <td>
              <div class="solcob__soporte">
                <div class="solcob__soporteicons">
                  <v-btn
                    icon="mdi-file-eye-outline"
                    variant="text"
                    size="small"
                    color="primary"
                    :disabled="!s.voucher_path"
                    title="Ver voucher del cliente"
                    aria-label="Ver voucher del cliente"
                    data-modo-ver="permitido"
                    @click="abrir(s.voucher_path)"
                  />
                  <v-btn
                    icon="mdi-download"
                    variant="text"
                    size="small"
                    color="primary"
                    :disabled="!s.voucher_path"
                    title="Descargar voucher del cliente"
                    aria-label="Descargar voucher del cliente"
                    data-modo-ver="permitido"
                    @click="descargarArchivo(s.voucher_path, s.voucher_nombre)"
                  />
                </div>
                <button
                  v-if="s.id_pagoingreso"
                  type="button"
                  class="solcob__salida"
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
                <v-btn
                  v-else-if="s.codigo_estado === 'LISTO' && can('registroPayForCliente', 'NUEVO')"
                  size="small"
                  color="success"
                  variant="flat"
                  prepend-icon="mdi-bank-transfer-in"
                  :loading="procesando === s.codigo"
                  @click="registrarEnBancos(s)"
                >
                  REGISTRAR EN BANCO
                </v-btn>
              </div>
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
                  size="x-small"
                  variant="text"
                  :color="s.id_pagoingreso ? 'grey' : 'primary'"
                  :title="`Editar solicitud${tieneAprobacionesCobro(s) ? ' (requiere clave de administrador)' : ''}`"
                  aria-label="Editar solicitud de cobro"
                  @click="editar(s)"
                />
                <v-btn
                  v-if="can('listControlGastos', 'ELIMINAR')"
                  icon="mdi-trash-can-outline"
                  size="x-small"
                  variant="text"
                  :color="s.id_pagoingreso ? 'grey' : 'error'"
                  :title="`Eliminar solicitud${tieneAprobacionesCobro(s) ? ' (requiere clave de administrador)' : ''}`"
                  aria-label="Eliminar solicitud de cobro"
                  :loading="procesando === s.codigo"
                  @click="eliminar(s)"
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
        v-for="(s, i) in solicitudes"
        :key="s.codigo"
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
          :aprobar="AREAS.filter((t) => puedeRevisarArea(s, t))"
          :puede-enviar="can('listControlGastos', 'NUEVO')"
          :puede-registrar="can('registroPayForCliente', 'NUEVO')"
          :puede-editar="can('listControlGastos', 'NUEVO')"
          :puede-eliminar="can('listControlGastos', 'ELIMINAR')"
          :procesando="procesando === s.codigo"
          :revisando="revisando === s.codigo"
          @enviar="enviar(s)"
          @aprobar="(tipo) => revisar(s, tipo)"
          @registrar="registrarEnBancos(s)"
          @ver-ingreso="verIngreso(s)"
          @editar="editar(s)"
          @eliminar="eliminar(s)"
          @ver="verSolicitud(s)"
        />
      </template>
    </div>

    <CargarPagoClienteDialog
      v-model="dialogEditar"
      :destino="destinoEditar"
      :solicitud="solicitudEditar"
      :admin="adminEditar"
      @guardado="cargar()"
    />
    <SolicitudCobroVerDialog
      v-model="dialogVer"
      :codigo="codigoVer"
    />
  </section>
</template>

<style scoped>
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
