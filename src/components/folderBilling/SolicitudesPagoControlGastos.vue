<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { useDisplay } from "vuetify";
import { useRouter } from "vue-router";
import Swal from "sweetalert2";
import { usePermissions } from "@/composables/usePermissions";
import { tienePerfilRevision, useRevisionSolicitudPago } from "@/composables/useRevisionSolicitudPago";
import SoportePagoDialog from "./SoportePagoDialog.vue";
import SolicitudPagoVerDialog from "./SolicitudPagoVerDialog.vue";
import SolicitudesPagoMovil from "./SolicitudesPagoMovil.vue";
import SolicitudPagoEditarDialog from "@/components/folderBilling/SolicitudPagoEditarDialog.vue";
import {
  tieneAprobacionesSolicitud,
  tieneSalidaBancosSolicitud,
  useAccionesSolicitudPago,
} from "@/composables/useAccionesSolicitudPago";
import type { SolicitudPagoAccion } from "@/composables/useAccionesSolicitudPago";
import { CONNECTION_ERROR_MESSAGE, hasFailed, notifySuccess, request } from "@/utils/request";
import type { ApiResponse } from "@/types/api";
import type {
  FacturaProveedorCargada,
  SolicitudPagoControl,
} from "@/types/billingEntries";

const props = defineProps<{ idMaster?: number | null }>();
const emit = defineEmits<{ actualizado: [] }>();

const { can } = usePermissions();
const { smAndDown } = useDisplay();
const router = useRouter();

const URL_MAIN = import.meta.env.VITE_URL_MAIN;

const MESES = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];

const solicitudes = ref<SolicitudPagoControl[]>([]);
const cargando = ref(false);
const procesando = ref<number | null>(null);

// modal ver solicitud (ojito)
const dialogVer = ref(false);
const idSolicitudVer = ref<number | null>(null);

// modal soporte
const dialogSoporte = ref(false);
const solicitudSoporte = ref<SolicitudPagoControl | null>(null);



// modal anexos
const dialogAnexos = ref(false);
const anexos = ref<FacturaProveedorCargada[]>([]);
const anexoProveedor = ref("");
const cargandoAnexos = ref(false);

const puedeAprobar = computed(() => can("listControlGastos", "MODIFICAR"));
// Administración: perfil 04 | Gerencia: perfil 01
const { revisando, revisar: aprobar } = useRevisionSolicitudPago(() => cargar());
const puedeTransferir = computed(() => can("registroPayForProveedor", "NUEVO"));

function etiquetaProveedor(s: SolicitudPagoControl) {
  return `${s.proveedor} (${s.id_proveedor})`;
}

function cuentaOCodigo(s: SolicitudPagoControl) {
  return s.codigo_tipopago === "02" ? s.codigopago || "" : s.nrocuenta || "";
}

function formatoMonto(valor: number | string) {
  return Number(valor || 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function formatoFecha(valor: string | null) {
  if (!valor) return "—";
  const [anio, mes, dia] = valor.slice(0, 10).split("-");
  return `${dia}-${MESES[Number(mes) - 1]}-${anio}`;
}

// aprobaciones: fecha arriba y hora abajo ("13-Nov-2026" / "18:53")
function horaDe(valor: string | null | undefined) {
  return valor ? valor.slice(11, 16) : "";
}

function aprobaciones(s: SolicitudPagoControl) {
  return [
    {
      area: "administracion",
      tipo: "ADM" as const,
      aprobado: !!s.aprobadoadministracionflag,
      usuario: s.usuario_aprobadoadministracion,
      fecha: s.fecha_aprobadoadministracion,
      rechazado: !!s.rechazadoflag && s.area_rechazo === "ADM",
      pendiente: s.codigo_estado === "PENADM",
    },
    {
      area: "gerencia",
      tipo: "GER" as const,
      aprobado: !!s.aprobadogerenciaflag,
      usuario: s.usuario_aprobadogerencia,
      fecha: s.fecha_aprobadogerencia,
      rechazado: !!s.rechazadoflag && s.area_rechazo === "GER",
      pendiente: s.codigo_estado === "PENGER",
    },
  ];
}

function avisar(response: ApiResponse) {
  Swal.fire({
    icon: response.tipomensaje === "TMSGERR" ? "error" : "warning",
    text: response.mensaje || CONNECTION_ERROR_MESSAGE,
  });
}

async function cargar() {
  if (!props.idMaster) return;
  cargando.value = true;
  const response = await request<SolicitudPagoControl>({
    method: "get",
    url: URL_MAIN + "solicitud_pago_listar",
    params: { id_master: props.idMaster },
  });
  cargando.value = false;
  if (hasFailed(response)) {
    avisar(response);
    return;
  }
  solicitudes.value = response.estadoflag ? response.data : [];
  emit("actualizado");
}

async function copiar(texto: string | null) {
  if (!texto) return;
  try {
    await navigator.clipboard.writeText(texto);
    notifySuccess("Copiado al portapapeles");
  } catch {
    Swal.fire({ icon: "warning", text: "No se pudo copiar. Selecciona el texto y cópialo manualmente." });
  }
}


// PAGADO: genera el token y abre Bancos > Nueva salida con los datos precargados
async function transferir(s: SolicitudPagoControl) {
  procesando.value = s.id;
  const response = await request<{ token: string }>({
    method: "put",
    url: URL_MAIN + "solicitud_pago_transferir/" + s.id,
  });
  procesando.value = null;
  const token = response.estadoflag ? response.data[0]?.token : null;
  if (!token) {
    avisar(response);
    await cargar();
    return;
  }
  router.push({ name: "registroPagoSolicitud", params: { token } });
}

function verSalida(s: SolicitudPagoControl) {
  if (s.id_pagoegreso) window.open(`/home/FolderBanks/verPagosPorProveedor/${s.id_pagoegreso}`, "_blank");
}

function verSolicitud(s: SolicitudPagoControl) {
  idSolicitudVer.value = s.id;
  dialogVer.value = true;
}

// Acciones de la solicitud: editar / eliminar (con aprobaciones piden clave de administrador;
// con salida en Bancos avisan que primero se elimine ese movimiento) y ver
const {
  dialogEditar: dialogEditarSolicitud,
  solicitudEditar,
  adminEditar,
  eliminando: eliminandoSolicitud,
  editar: editarSolicitud,
  eliminar: eliminarSolicitud,
} = useAccionesSolicitudPago(() => cargar());
const puedeEditarSolicitud = computed(() => can("listControlGastos", "NUEVO") || can("solicitudesPagoBancos", "MODIFICAR"));
const puedeEliminarSolicitud = computed(() => can("listControlGastos", "ELIMINAR") || can("solicitudesPagoBancos", "MODIFICAR"));
const anuladaSolicitud = (s: SolicitudPagoAccion & { fecha_anulado?: string | null; usuario_anulado?: string | null }) => !!(s.fecha_anulado || s.usuario_anulado);
function tituloAccion(s: SolicitudPagoAccion, accion: "Editar" | "Eliminar") {
  if (tieneSalidaBancosSolicitud(s)) return "Ya está pagada en Bancos: elimine primero el movimiento";
  return `${accion} solicitud de pago${tieneAprobacionesSolicitud(s) ? " (requiere clave de administrador)" : ""}`;
}

function abrirSoporte(s: SolicitudPagoControl) {
  solicitudSoporte.value = s;
  dialogSoporte.value = true;
}


async function verAnexo(s: SolicitudPagoControl) {
  anexoProveedor.value = etiquetaProveedor(s);
  anexos.value = [];
  cargandoAnexos.value = true;
  dialogAnexos.value = true;
  const response = await request<FacturaProveedorCargada>({
    method: "get",
    url: URL_MAIN + "list_invoice_path",
    params: { id_master: s.id_master, id_proveedor: s.id_proveedor, id_correlativo: s.id_correlativo },
  });
  cargandoAnexos.value = false;
  anexos.value = response.estadoflag ? response.data.filter((a) => !!a.path) : [];
}

// el monto se copia como número: 1433.64 (sin separador de miles ni moneda)
function montoNumero(valor: number | string) {
  return Number(valor || 0).toFixed(2);
}

function abrir(url: string | null | undefined) {
  if (url) window.open(url, "_blank");
}

function nombreAnexo(a: FacturaProveedorCargada) {
  const tipo = a.type_pago == 1 ? "Factura" : a.type_pago == 2 ? "Proforma" : "Otro";
  return `${tipo}${a.number ? " - " + a.number : ""}`;
}

watch(
  () => props.idMaster,
  () => cargar(),
  { immediate: true },
);

defineExpose({ cargar });
</script>

<template>
  <section class="solpago">
    <v-progress-linear
      v-if="cargando"
      indeterminate
      color="primary"
      class="mb-2"
    />

    <!-- ======================= WEB ======================= -->
    <div
      v-if="!smAndDown"
      class="solpago__tablewrap"
    >
      <table class="solpago__table">
        <thead>
          <tr>
            <th>Fecha de solicitud</th>
            <th>Expediente</th>
            <th>Proveedor</th>
            <th>Monto</th>
            <th>Banco</th>
            <th>Método de pago</th>
            <th>Código / N° de cuenta</th>
            <th>Estado</th>
            <th class="text-center">
              Administración
              <div class="solpago__thsub">
                Aprobado por
              </div>
            </th>
            <th class="text-center">
              Gerencia
              <div class="solpago__thsub">
                Aprobado por
              </div>
            </th>
            <th>Fecha de pago</th>
            <th class="text-center">
              Soporte
            </th>
            <th class="text-center">
              Acciones
            </th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="!solicitudes.length">
            <td
              colspan="13"
              class="solpago__empty"
            >
              {{ cargando ? "Cargando solicitudes..." : "No hay solicitudes de pago registradas." }}
            </td>
          </tr>
          <tr
            v-for="s in solicitudes"
            :key="s.id"
          >
            <td class="text-no-wrap">
              {{ formatoFecha(s.fechasolicitud) }}
            </td>
            <td>
              <span class="solpago__pill">{{ s.expediente }}</span>
              <div
                v-if="s.correlativo"
                class="solpago__sub"
              >
                Corr. {{ s.correlativo }}
              </div>
            </td>
            <td>
              <div class="solpago__prov">
                <span class="solpago__provname">{{ etiquetaProveedor(s) }}</span>
                <v-btn
                  icon
                  variant="text"
                  size="x-small"
                  color="primary"
                  title="Copiar proveedor"
                  data-modo-ver="permitido"
                  @click="copiar(etiquetaProveedor(s))"
                >
                  <v-icon>mdi-content-copy</v-icon>
                </v-btn>
              </div>
              <button
                type="button"
                class="solpago__anexo"
                data-modo-ver="permitido"
                @click="verAnexo(s)"
              >
                <v-icon size="14">
                  mdi-paperclip
                </v-icon> Ver anexo
              </button>
            </td>
            <td class="solpago__monto text-no-wrap">
              {{ formatoMonto(s.monto) }} {{ s.moneda }}
              <v-btn
                icon
                variant="text"
                size="x-small"
                color="primary"
                title="Copiar monto"
                aria-label="Copiar monto"
                data-modo-ver="permitido"
                @click="copiar(montoNumero(s.monto))"
              >
                <v-icon>mdi-content-copy</v-icon>
              </v-btn>
            </td>
            <td class="font-weight-bold">
              {{ s.banco || "—" }}
            </td>
            <td>{{ s.tipopago }}</td>
            <td>
              <div class="solpago__cuenta">
                <span>{{ cuentaOCodigo(s) || "—" }}</span>
                <v-btn
                  v-if="cuentaOCodigo(s)"
                  icon
                  variant="text"
                  size="x-small"
                  color="primary"
                  title="Copiar"
                  data-modo-ver="permitido"
                  @click="copiar(cuentaOCodigo(s))"
                >
                  <v-icon>mdi-content-copy</v-icon>
                </v-btn>
              </div>
            </td>
            <td>
              <v-tooltip location="top">
                <template #activator="{ props: tip }">
                  <span
                    v-bind="tip"
                    class="solpago__chip"
                    :class="`solpago__chip--${s.codigo_estado}`"
                  >{{ s.estado }}</span>
                </template>
                <div>Solicitado: {{ s.usuario_solicitud || "—" }} · {{ s.fechasolicitud }}</div>
                <div v-if="s.aprobadoadministracionflag">
                  Administración: {{ s.usuario_aprobadoadministracion }} · {{ s.fecha_aprobadoadministracion }}
                </div>
                <div v-if="s.aprobadogerenciaflag">
                  Gerencia: {{ s.usuario_aprobadogerencia }} · {{ s.fecha_aprobadogerencia }}
                </div>
                <div v-if="s.pagadoflag">
                  Pago registrado: {{ s.usuario_pagado }} · {{ s.fecha_registropago }}
                </div>
              </v-tooltip>
            </td>
            <td
              v-for="a in aprobaciones(s)"
              :key="a.area"
              class="solpago__aprob text-center"
            >
              <template v-if="a.aprobado">
                <div class="solpago__aprobuser">
                  {{ a.usuario || "—" }}
                </div>
                <span class="solpago__aprobfecha">{{ formatoFecha(a.fecha) }}<template v-if="horaDe(a.fecha)"><br>{{ horaDe(a.fecha) }}</template></span>
              </template>
              <div
                v-else-if="a.rechazado"
                class="solpago__rechazo"
                :title="s.motivo_rechazo ? `Motivo: ${s.motivo_rechazo}` : ''"
              >
                <span class="solpago__rechazotag">Rechazado</span>
                <div class="solpago__aprobuser">
                  {{ s.usuario_rechazo || "—" }}
                </div>
                <span class="solpago__aprobfecha solpago__aprobfecha--rechazo">{{ formatoFecha(s.fecha_rechazo ?? null) }}<template v-if="horaDe(s.fecha_rechazo ?? null)"><br>{{ horaDe(s.fecha_rechazo ?? null) }}</template></span>
              </div>
              <v-btn
                v-else-if="a.pendiente && puedeAprobar && tienePerfilRevision(a.tipo)"
                size="small"
                :color="a.tipo === 'ADM' ? 'deep-purple' : 'amber-darken-3'"
                variant="tonal"
                class="solpago__revisar"
                :loading="revisando === s.id"
                @click="aprobar(s, a.tipo)"
              >
                Aprobar
              </v-btn>
              <span v-else>—</span>
            </td>
            <td class="text-center text-no-wrap">
              {{ s.pagadoflag ? formatoFecha(s.fechapago) : "—" }}
            </td>
            <td class="text-center">
              <div
                v-if="s.pagadoflag"
                class="solpago__soporte"
              >
                <v-btn
                  icon
                  variant="text"
                  size="small"
                  color="primary"
                  title="Ver soporte de pago"
                  data-modo-ver="permitido"
                  @click="abrir(s.soporte_path)"
                >
                  <v-icon>mdi-file-eye-outline</v-icon>
                </v-btn>
                <!-- con el soporte cargado ya se puede registrar el pago en Bancos -->
                <button
                  v-if="s.id_pagoegreso"
                  type="button"
                  class="solpago__salida"
                  title="Ver la salida registrada en Bancos"
                  data-modo-ver="permitido"
                  @click="verSalida(s)"
                >
                  <v-icon
                    size="16"
                    color="success"
                  >
                    mdi-check-decagram
                  </v-icon>
                  Salida N° {{ s.numerooperacion_pago }}
                </button>
                <v-btn
                  v-else-if="puedeTransferir"
                  size="small"
                  color="success"
                  variant="flat"
                  prepend-icon="mdi-bank-transfer-out"
                  :loading="procesando === s.id"
                  @click="transferir(s)"
                >
                  REGISTRAR EN BANCO
                </v-btn>
              </div>
              <v-btn
                v-else
                icon
                variant="text"
                size="small"
                color="primary"
                :disabled="s.codigo_estado !== 'LISTO' || !puedeAprobar"
                title="Subir soporte de pago"
                @click="abrirSoporte(s)"
              >
                <v-icon>mdi-file-upload-outline</v-icon>
              </v-btn>
            </td>
            <td class="text-center">
              <!-- 1. editar  2. eliminar  3. ver: editar/eliminar con las mismas reglas que Control de Gastos -->
              <div class="solpago__acciones">
                <v-btn
                  v-if="puedeEditarSolicitud && !anuladaSolicitud(s)"
                  icon="mdi-pencil-outline"
                  variant="text"
                  size="small"
                  :color="tieneSalidaBancosSolicitud(s) ? 'grey' : 'primary'"
                  :title="tituloAccion(s, 'Editar')"
                  aria-label="Editar solicitud de pago"
                  @click="editarSolicitud(s)"
                />
                <v-btn
                  v-if="puedeEliminarSolicitud && !anuladaSolicitud(s)"
                  icon="mdi-delete-outline"
                  variant="text"
                  size="small"
                  :color="tieneSalidaBancosSolicitud(s) ? 'grey' : 'error'"
                  :title="tituloAccion(s, 'Eliminar')"
                  aria-label="Eliminar solicitud de pago"
                  :loading="eliminandoSolicitud === s.id"
                  @click="eliminarSolicitud(s)"
                />
                <v-btn
                  icon="mdi-eye-outline"
                  variant="tonal"
                  size="small"
                  color="primary"
                  title="Ver solicitud de pago"
                  aria-label="Ver solicitud de pago"
                  data-modo-ver="permitido"
                  @click="verSolicitud(s)"
                />
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- ======================= MÓVIL ======================= -->
    <SolicitudesPagoMovil
      v-else
      :items="solicitudes"
      :cargando="cargando"
      :puede-aprobar="puedeAprobar"
      :puede-transferir="puedeTransferir"
      :puede-editar="puedeEditarSolicitud"
      :puede-eliminar="puedeEliminarSolicitud"
      :procesando="procesando"
      :revisando="revisando"
      :eliminando="eliminandoSolicitud"
      @aprobar="(sol, tipo) => aprobar(sol as SolicitudPagoControl, tipo)"
      @subir-soporte="(sol) => abrirSoporte(sol as SolicitudPagoControl)"
      @transferir="(sol) => transferir(sol as SolicitudPagoControl)"
      @ver-salida="(sol) => verSalida(sol as SolicitudPagoControl)"
      @ver-anexo="(sol) => verAnexo(sol as SolicitudPagoControl)"
      @editar="editarSolicitud"
      @eliminar="eliminarSolicitud"
      @ver="(sol) => verSolicitud(sol as SolicitudPagoControl)"
    />

    <div class="solpago__note">
      <v-icon color="primary">
        mdi-information-outline
      </v-icon>
      Al registrar el soporte de pago, será obligatorio ingresar la fecha de pago.
    </div>

    <SolicitudPagoEditarDialog
      v-model="dialogEditarSolicitud"
      :solicitud="solicitudEditar"
      :admin="adminEditar"
      @guardado="cargar()"
    />
    <SolicitudPagoVerDialog
      v-model="dialogVer"
      :id-solicitud="idSolicitudVer"
    />

    <SoportePagoDialog
      v-model="dialogSoporte"
      :solicitud="solicitudSoporte"
      @guardado="cargar"
    />


    <!-- ======================= MODAL ANEXOS ======================= -->
    <v-dialog
      v-model="dialogAnexos"
      max-width="520"
    >
      <v-card rounded="xl">
        <v-card-title class="d-flex align-center">
          <v-icon
            color="primary"
            class="mr-2"
          >
            mdi-paperclip
          </v-icon>
          Anexos de {{ anexoProveedor }}
          <v-spacer />
          <v-btn
            icon
            variant="text"
            size="small"
            @click="dialogAnexos = false"
          >
            <v-icon>mdi-close</v-icon>
          </v-btn>
        </v-card-title>
        <v-card-text>
          <v-progress-linear
            v-if="cargandoAnexos"
            indeterminate
            color="primary"
          />
          <p
            v-else-if="!anexos.length"
            class="text-medium-emphasis"
          >
            El proveedor no tiene facturas o proformas cargadas para este expediente.
          </p>
          <v-list
            v-else
            density="compact"
          >
            <v-list-item
              v-for="a in anexos"
              :key="a.id"
              :title="nombreAnexo(a)"
              :subtitle="a.originalname || ''"
              @click="abrir(a.path)"
            >
              <template #prepend>
                <v-icon :color="a.type === 'pdf' ? 'red' : 'blue-grey'">
                  {{ a.type === "pdf" ? "mdi-file-pdf-box" : "mdi-file-image" }}
                </v-icon>
              </template>
              <template #append>
                <v-icon size="18">
                  mdi-open-in-new
                </v-icon>
              </template>
            </v-list-item>
          </v-list>
        </v-card-text>
      </v-card>
    </v-dialog>
  </section>
</template>

<style scoped>
.solpago {
  --sp-primary: #1e3a8a;
  --sp-accent: #1e5bd8;
  --sp-surface: #ffffff;
  --sp-soft: #eef4ff;
  --sp-border: #dbe5f5;
  --sp-text: #1f2a44;
  --sp-muted: #5b6b86;
  --sp-green-bg: #d9f7e1;
  --sp-green-fg: #166534;
  --sp-green: #22c55e;
  --sp-amber-bg: #fdf0c4;
  --sp-amber-fg: #7a5a00;
  --sp-amber: #f5c518;
  --sp-purple-bg: #ece2fc;
  --sp-purple-fg: #5b21b6;
  --sp-purple: #8b5cf6;
  --sp-blue-bg: #dbeafe;
  --sp-blue-fg: #1e40af;
  --sp-red-bg: #fde2e2;
  --sp-red-fg: #b42318;
  --sp-red: #ef4444;
  /* sin tarjeta contenedora: solo la tabla y el aviso */
  color: var(--sp-text);
}
.solpago__tablewrap {
  overflow-x: auto;
  border-radius: 14px;
  border: 1px solid var(--sp-border);
  background: var(--sp-surface);
  box-shadow: 0 4px 16px rgba(30, 58, 138, 0.06);
}
.solpago__table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.85rem;
}
.solpago__table th {
  background: #e7efff;
  color: var(--sp-primary);
  font-weight: 700;
  text-align: center;
  padding: 10px 8px;
  white-space: nowrap;
}
.solpago__table td {
  text-align: center;
  padding: 8px;
  border-top: 1px solid #edf1f8;
  vertical-align: middle;
}
.solpago__table tbody tr:hover td {
  background: #f8fbff;
}
.solpago__empty {
  text-align: center;
  color: var(--sp-muted);
  padding: 28px 12px !important;
}
.solpago__pill {
  display: inline-block;
  padding: 3px 10px;
  border-radius: 8px;
  background: #e9eef8;
  color: var(--sp-text);
  font-size: 0.82rem;
  font-weight: 600;
  white-space: nowrap;
}
.solpago__sub {
  margin-top: 2px;
  font-size: 0.75rem;
  color: var(--sp-muted);
  white-space: nowrap;
}
.solpago__prov {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 2px;
}
.solpago__provname {
  font-weight: 700;
  color: var(--sp-primary);
}
.solpago__soporte {
  display: inline-flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  white-space: nowrap;
}
.solpago__salida {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 2px 10px;
  border: 0;
  border-radius: 999px;
  background: rgba(46, 160, 67, 0.12);
  color: #1f7a35;
  font-weight: 600;
  font-size: 0.8rem;
  white-space: nowrap;
  cursor: pointer;
}

.solpago__anexo {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  margin: 4px 0 0;
  padding: 1px 10px;
  border: 1px solid var(--sp-accent);
  border-radius: 999px;
  color: var(--sp-accent);
  font-size: 0.78rem;
  font-weight: 600;
  white-space: nowrap;
  background: var(--sp-surface);
}
.solpago__anexo:hover {
  background: var(--sp-soft);
}
.solpago__aprob {
  font-size: 0.8rem;
  line-height: 1.5;
}
.solpago__rechazotag {
  display: inline-block;
  padding: 0 8px;
  border-radius: 999px;
  background: var(--sp-red-bg);
  color: var(--sp-red-fg);
  font-size: 0.7rem;
  font-weight: 700;
  text-transform: uppercase;
}
.solpago__aprobfecha--rechazo {
  background: var(--sp-red-bg);
  color: var(--sp-red-fg);
}
.solpago__thsub {
  font-size: 0.7rem;
  font-weight: 600;
  color: var(--sp-muted);
}
.solpago__aprobuser {
  font-weight: 600;
  white-space: nowrap;
}
.solpago__aprobfecha {
  display: inline-block;
  margin-top: 2px;
  padding: 2px 10px;
  border-radius: 8px;
  line-height: 1.3;
  text-align: center;
  background: #e7efff;
  color: var(--sp-primary);
  font-size: 0.72rem;
  font-weight: 600;
  white-space: nowrap;
}
.solpago__monto {
  font-weight: 700;
  white-space: nowrap;
}
.solpago__cuenta {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 2px;
  white-space: nowrap;
}
.solpago__chip {
  display: inline-block;
  padding: 4px 12px;
  border-radius: 8px;
  font-weight: 700;
  font-size: 0.82rem;
  white-space: nowrap;
}
.solpago__chip--LISTO {
  background: var(--sp-green-bg);
  color: var(--sp-green-fg);
}
.solpago__chip--PENGER {
  background: var(--sp-amber-bg);
  color: var(--sp-amber-fg);
}
.solpago__chip--PENADM {
  background: var(--sp-purple-bg);
  color: var(--sp-purple-fg);
}
.solpago__chip--RECHAZADA {
  background: var(--sp-red-bg);
  color: var(--sp-red-fg);
}
.solpago__chip--PAGADO {
  background: var(--sp-blue-bg);
  color: var(--sp-blue-fg);
}
.solpago__note {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-top: 16px;
  padding: 12px 16px;
  border-radius: 12px;
  background: var(--sp-soft);
  border: 1px solid var(--sp-border);
  font-size: 0.92rem;
}

/* acciones: editar, eliminar y ver */
.solpago__acciones {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 2px;
  white-space: nowrap;
}
</style>
