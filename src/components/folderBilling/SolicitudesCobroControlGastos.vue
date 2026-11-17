<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { useDisplay } from "vuetify";
import Swal from "sweetalert2";
import CargarPagoClienteDialog from "./CargarPagoClienteDialog.vue";
import SolicitudCobroVerDialog from "./SolicitudCobroVerDialog.vue";
import { usePermissions } from "@/composables/usePermissions";
import { tienePerfilRevision } from "@/composables/useRevisionSolicitudPago";
import type { AreaRevision } from "@/composables/useRevisionSolicitudPago";
import { avisarIngresoBancosCobro, montoCobro, tieneAprobacionesCobro, useSolicitudCobro } from "@/composables/useSolicitudCobro";
import { useSolicitudesMasterStore } from "@/stores/solicitudesMaster";
import type { AdminCredentials } from "@/types/seguridad";
import type { DestinoPagoCliente, SolicitudCobro } from "@/types/solicitudCobro";
import { CONNECTION_ERROR_MESSAGE, hasFailed } from "@/utils/request";
import { shortDate } from "@/utils/dates";

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

    <p
      v-if="!cargando && !solicitudes.length"
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
            <th>Voucher</th>
            <th>Estado</th>
            <th>Administración</th>
            <th>Gerencia</th>
            <th>Ingreso en Bancos</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
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
              <v-btn
                icon="mdi-file-eye-outline"
                size="small"
                variant="text"
                color="primary"
                :disabled="!s.voucher_path"
                :title="s.voucher_nombre || 'Ver voucher'"
                aria-label="Ver voucher del cliente"
                @click="abrir(s.voucher_path)"
              />
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
              <v-btn
                v-if="puedeRevisarArea(s, tipo)"
                size="x-small"
                variant="flat"
                :color="tipo === 'ADM' ? 'orange-darken-2' : 'amber-darken-3'"
                :loading="revisando === s.codigo"
                @click="revisar(s, tipo)"
              >
                Confirmar
              </v-btn>
              <span
                v-else-if="aprobacion(s, tipo).usuario"
                class="solcob__aprob"
              >
                <v-icon
                  size="14"
                  color="success"
                >mdi-check-circle</v-icon>
                {{ aprobacion(s, tipo).usuario }}<br>{{ fecha(aprobacion(s, tipo).fecha) }}
              </span>
              <span
                v-else-if="aprobacion(s, tipo).rechazado"
                class="text-error"
              >Rechazó</span>
              <span v-else>{{ aprobacion(s, tipo).pendiente ? "Pendiente" : "—" }}</span>
            </td>
            <td>{{ s.numerooperacion_ingreso ? `N° ${s.numerooperacion_ingreso}` : "—" }}</td>
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
                  v-if="s.codigo_estado === 'LISTO' && can('registroPayForCliente', 'NUEVO')"
                  size="x-small"
                  variant="flat"
                  color="green-darken-2"
                  prepend-icon="mdi-bank-transfer-in"
                  :loading="procesando === s.codigo"
                  @click="registrarEnBancos(s)"
                >
                  Registrar en Bancos
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
                  icon="mdi-delete-outline"
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
      <article
        v-for="s in solicitudes"
        :key="s.codigo"
        class="solcob-card"
        :class="`solcob-card--${s.codigo_estado.toLowerCase()}`"
      >
        <span
          class="solcob__estado"
          :class="`bg-${COLOR_ESTADO[s.codigo_estado] ?? 'grey'}`"
        >{{ s.estado }}</span>
        <div class="solcob-card__cliente">
          {{ s.cliente }} · Corr. {{ s.correlativo }}
        </div>
        <div class="solcob-card__monto">
          {{ montoCobro(s.monto, s.moneda) }}
        </div>
        <dl class="solcob-card__datos">
          <dt>Cuenta</dt>
          <dd>{{ s.cuenta }}</dd>
          <dt>Banco cliente</dt>
          <dd>{{ s.banco_origen || "—" }}</dd>
          <dt>Depósito</dt>
          <dd>{{ fecha(s.fechadeposito) }} · N° {{ s.numerooperacion }}</dd>
          <template v-if="s.codigo_estado === 'RECHAZADA'">
            <dt>Motivo</dt>
            <dd class="text-error">
              {{ s.motivo_rechazo || "Sin motivo" }}
            </dd>
          </template>
          <template v-if="s.numerooperacion_ingreso">
            <dt>Ingreso</dt>
            <dd>N° {{ s.numerooperacion_ingreso }}</dd>
          </template>
        </dl>
        <footer class="solcob-card__acciones">
          <v-btn
            size="small"
            variant="tonal"
            color="primary"
            prepend-icon="mdi-file-eye-outline"
            :disabled="!s.voucher_path"
            @click="abrir(s.voucher_path)"
          >
            Voucher
          </v-btn>
          <v-btn
            v-if="s.codigo_estado === 'BORRADOR' && can('listControlGastos', 'NUEVO')"
            size="small"
            variant="flat"
            color="primary"
            :loading="procesando === s.codigo"
            @click="enviar(s)"
          >
            Enviar
          </v-btn>
          <v-btn
            v-for="tipo in AREAS.filter((t) => puedeRevisarArea(s, t))"
            :key="tipo"
            size="small"
            variant="flat"
            :color="tipo === 'ADM' ? 'orange-darken-2' : 'amber-darken-3'"
            :loading="revisando === s.codigo"
            @click="revisar(s, tipo)"
          >
            Confirmar {{ tipo === "ADM" ? "Adm." : "Ger." }}
          </v-btn>
          <v-btn
            v-if="s.codigo_estado === 'LISTO' && can('registroPayForCliente', 'NUEVO')"
            size="small"
            variant="flat"
            color="green-darken-2"
            :loading="procesando === s.codigo"
            @click="registrarEnBancos(s)"
          >
            Registrar
          </v-btn>
          <v-btn
            v-if="can('listControlGastos', 'NUEVO')"
            icon="mdi-pencil-outline"
            size="small"
            variant="text"
            color="primary"
            aria-label="Editar solicitud de cobro"
            @click="editar(s)"
          />
          <v-btn
            v-if="can('listControlGastos', 'ELIMINAR')"
            icon="mdi-delete-outline"
            size="small"
            variant="text"
            color="error"
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
        </footer>
      </article>
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
.solcob__vacio {
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
.solcob__aprob {
  font-size: 11.5px;
  line-height: 1.25;
}
.solcob__acciones {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
}
.solcob__cards {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.solcob-card {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 10px 12px;
  border: 1px solid #d6dde8;
  border-left: 5px solid #90a4ae;
  border-radius: 12px;
  background: #fff;
}
.solcob-card--penadm { border-left-color: #f57c00; }
.solcob-card--penger { border-left-color: #ff8f00; }
.solcob-card--listo { border-left-color: #1e88e5; }
.solcob-card--cobrado { border-left-color: #2e7d32; }
.solcob-card--rechazada { border-left-color: #e53935; }
.solcob-card .solcob__estado {
  align-self: flex-start;
}
.solcob-card__codigo {
  font-weight: 800;
  color: #0a1f44;
}
.solcob-card__cliente {
  font-weight: 700;
  overflow-wrap: anywhere;
}
.solcob-card__monto {
  font-size: 18px;
  font-weight: 900;
  color: #1b5e20;
}
.solcob-card__datos {
  display: grid;
  grid-template-columns: 96px 1fr;
  gap: 2px 8px;
  margin: 0;
  font-size: 12.5px;
}
.solcob-card__datos dt {
  color: #6b7a90;
}
.solcob-card__datos dd {
  margin: 0;
  overflow-wrap: anywhere;
}
.solcob-card__acciones {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}
@media (max-width: 600px) {
  .solcob-card__acciones .v-btn:not(.v-btn--icon) {
    flex: 1 1 calc(50% - 6px);
  }
}
</style>
