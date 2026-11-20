<script setup lang="ts">
import { abrirArchivo } from "@/composables/useVisorArchivo";
import { computed } from "vue";
import { useDisplay } from "vuetify";
import { montoCobro } from "@/composables/useSolicitudCobro";
import type { SoporteCobro } from "@/types/solicitudCobro";
import { shortDate } from "@/utils/dates";
import { descargarArchivo } from "@/utils/descargarArchivo";

// "Ver todos los soportes de ingreso" (solo con 2 o más pagos): los pagos cargados de ESE cliente /
// expediente, con el mismo diseño del listado de solicitudes de cobro (sin "Método de pago").
// Estado y confirmación son de la solicitud; cada pago muestra si ya tiene su ingreso en Bancos.
export interface SolicitudDeSoportes {
  codigo_estado?: string | null;
  estado?: string | null;
  fecha_ingreso?: string | null;
  soporte_confirmacion_path?: string | null;
  soporte_confirmacion_nombre?: string | null;
  usuario_confirma?: string | null;
  fecha_confirmacion?: string | null;
}

// un pago con la solicitud a la que pertenece (el correlativo puede tener varias solicitudes)
export type SoporteDeSolicitud = SoporteCobro & { solicitud?: SolicitudDeSoportes & { editable?: boolean } };

const props = defineProps<{
  modelValue: boolean;
  soportes: SoporteDeSolicitud[];
  moneda: string | null;
  // monto a cobrar de la solicitud (para el saldo pendiente)
  total: number | string;
  cliente?: string | null;
  // solo los pagos de este house / correlativo del expediente
  expediente?: string | null;
  correlativo?: string | null;
  // estado y confirmación de la solicitud
  solicitud?: SolicitudDeSoportes | null;
  // Control de Gastos: editar / eliminar cada pago
  editable?: boolean;
  eliminable?: boolean;
}>();
const emit = defineEmits<{
  "update:modelValue": [valor: boolean];
  editar: [soporte: SoporteDeSolicitud];
  eliminar: [soporte: SoporteDeSolicitud];
}>();
const { smAndDown } = useDisplay();

const abierto = computed({
  get: () => props.modelValue,
  set: (valor: boolean) => emit("update:modelValue", valor),
});
const suma = computed(() => props.soportes.reduce((acc, s) => acc + Number(s.monto || 0), 0));
const saldo = computed(() => Math.max(Math.round((Number(props.total || 0) - suma.value) * 100) / 100, 0));
const conAcciones = computed(() => !!(props.editable || props.eliminable));

const ICONO_ESTADO: Record<string, string> = {
  BORRADOR: "mdi-pencil-circle-outline",
  LISTO: "mdi-clock-outline",
  CONFIRMADO: "mdi-check-circle",
  COBRADO: "mdi-bank-check",
  RECHAZADA: "mdi-close-circle",
  ELIMINADA: "mdi-trash-can-outline",
};
// el pago con su ingreso en Bancos ya está registrado; si no, el estado de la solicitud
// confirmación: la del propio pago; si no la trae, la de su solicitud
function solDe(sop: SoporteDeSolicitud) {
  const base = sop.solicitud ?? props.solicitud ?? null;
  if (sop.confirmadoflag === undefined) return base;
  return {
    ...base,
    fecha_ingreso: sop.fecha_ingreso ?? null,
    soporte_confirmacion_path: sop.soporte_confirmacion_path ?? null,
    soporte_confirmacion_nombre: sop.soporte_confirmacion_nombre ?? null,
    usuario_confirma: sop.usuario_confirma ?? null,
    fecha_confirmacion: sop.fecha_confirmacion ?? null,
  };
}
// editar / eliminar: no si ya está en Bancos ni si su solicitud ya está confirmada
function modificable(sop: SoporteDeSolicitud) {
  return !sop.id_pagoingreso && !sop.confirmadoflag && sop.solicitud?.editable !== false;
}
function estadoDe(sop: SoporteDeSolicitud) {
  if (sop.id_pagoingreso) return { codigo: "COBRADO", texto: "Registrado en Bancos" };
  if (sop.confirmadoflag) return { codigo: "CONFIRMADO", texto: "Confirmado" };
  const sol = solDe(sop);
  if (sol?.codigo_estado === "CONFIRMADO") return { codigo: "LISTO", texto: "Pendiente por confirmar" };
  return { codigo: sol?.codigo_estado ?? "BORRADOR", texto: sol?.estado ?? "Sin enviar" };
}
function soloFecha(valor: string | null | undefined) {
  return valor ? shortDate(valor.slice(0, 10)) : "";
}
function horaDe(valor: string | null | undefined) {
  return valor ? valor.slice(11, 16) : "";
}
// celular: el soporte se ve en un modal (imagen o visor PDF); en la web, otra pestaña
function abrir(url: string | null | undefined) {
  abrirArchivo(url);
}
</script>

<template>
  <v-dialog
    v-model="abierto"
    :max-width="smAndDown ? undefined : 1280"
    :fullscreen="smAndDown"
    scrollable
  >
    <v-card
      class="sopcob"
      :class="{ 'sopcob--full': smAndDown }"
    >
      <!-- mismo encabezado que "Confirmar ingreso", solo de este cliente / expediente -->
      <div class="sopcob__head">
        <span class="sopcob__icon"><v-icon size="28">mdi-folder-open-outline</v-icon></span>
        <div class="sopcob__titles">
          <h3>Soportes de ingreso ({{ soportes.length }})</h3>
          <span>Pagos cargados del cliente para este expediente.</span>
        </div>
        <v-btn
          icon="mdi-close"
          variant="text"
          size="small"
          aria-label="Cerrar"
          @click="abierto = false"
        />
      </div>

      <div class="sopcob__caso">
        <div>
          <span class="sopcob__label">Cliente</span>
          <b>{{ cliente || "—" }}</b>
          <small v-if="expediente">{{ expediente }}{{ correlativo ? ` - ${correlativo}` : "" }}</small>
        </div>
        <div class="sopcob__casodato">
          <span class="sopcob__label">Pagos cargados</span>
          <b>{{ montoCobro(suma, moneda) }}</b>
        </div>
        <div class="sopcob__casodato">
          <span class="sopcob__label">Monto</span>
          <b class="sopcob__verde">{{ montoCobro(total, moneda) }}</b>
          <small :class="saldo > 0 ? 'sopcob__falta' : 'sopcob__ok'">
            {{ saldo > 0 ? `Saldo pendiente: ${montoCobro(saldo, moneda)}` : "Monto completo" }}
          </small>
        </div>
      </div>

      <v-card-text class="sopcob__body">
        <!-- web: tabla con el diseño del listado -->
        <div
          v-if="!smAndDown"
          class="sopcob__wrap"
        >
          <table class="sopcob__table">
            <thead>
              <tr>
                <th>Soporte de pago<br>(Cliente)</th>
                <th>Fecha de<br>solicitud</th>
                <th>Monto</th>
                <th>Banco</th>
                <th>N° de cuenta /<br>Código</th>
                <th>Estado</th>
                <th>Fecha de ingreso<br>en banco</th>
                <th>Soporte de confirmación<br>(Administración)</th>
                <th>Persona que<br>confirma</th>
                <th>Fecha de<br>confirmación</th>
                <th v-if="conAcciones">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="sop in soportes"
                :key="sop.codigo"
              >
                <td>
                  <v-btn
                    icon="mdi-eye-outline"
                    variant="outlined"
                    size="small"
                    rounded="lg"
                    color="primary"
                    class="sopcob__ojo"
                    :disabled="!sop.voucher_path"
                    :title="sop.voucher_nombre ? `Ver ${sop.voucher_nombre}` : 'Ver soporte de pago del cliente'"
                    aria-label="Ver soporte de pago del cliente"
                    data-modo-ver="permitido"
                    @click="abrir(sop.voucher_path)"
                  />
                </td>
                <td>
                  <span
                    v-if="sop.fecha_registro"
                    class="sopcob__chipfecha"
                  >{{ soloFecha(sop.fecha_registro) }}<br>{{ horaDe(sop.fecha_registro) }}</span>
                  <span v-else>—</span>
                </td>
                <td>
                  <b class="sopcob__nowrap">{{ montoCobro(sop.monto, moneda) }}</b>
                </td>
                <td>{{ sop.banco || "—" }}</td>
                <td class="sopcob__nowrap">
                  {{ sop.nrocuenta || "—" }}
                </td>
                <td>
                  <span
                    class="sopcob__estado"
                    :class="`sopcob__estado--${estadoDe(sop).codigo}`"
                  >
                    <v-icon size="16">{{ ICONO_ESTADO[estadoDe(sop).codigo] ?? "mdi-circle-outline" }}</v-icon>
                    {{ estadoDe(sop).texto }}
                  </span>
                </td>
                <td>
                  <span
                    v-if="solDe(sop)?.fecha_ingreso"
                    class="sopcob__chipfecha"
                  >{{ soloFecha(solDe(sop)!.fecha_ingreso) }}</span>
                  <span v-else>—</span>
                </td>
                <td>
                  <v-btn
                    v-if="solDe(sop)?.soporte_confirmacion_path"
                    icon="mdi-eye-outline"
                    variant="outlined"
                    size="small"
                    rounded="lg"
                    color="primary"
                    class="sopcob__ojo"
                    title="Ver soporte de confirmación"
                    aria-label="Ver soporte de confirmación"
                    data-modo-ver="permitido"
                    @click="abrir(solDe(sop)!.soporte_confirmacion_path)"
                  />
                  <span v-else>—</span>
                </td>
                <td>
                  <b>{{ solDe(sop)?.usuario_confirma || "—" }}</b>
                </td>
                <td>
                  <span
                    v-if="solDe(sop)?.fecha_confirmacion"
                    class="sopcob__chipfecha"
                  >{{ soloFecha(solDe(sop)!.fecha_confirmacion) }}<br>{{ horaDe(solDe(sop)!.fecha_confirmacion) }}</span>
                  <span v-else>—</span>
                </td>
                <td v-if="conAcciones">
                  <div class="sopcob__acciones">
                    <v-btn
                      v-if="editable && modificable(sop)"
                      icon="mdi-pencil-outline"
                      variant="outlined"
                      size="small"
                      rounded="lg"
                      color="primary"
                      title="Editar pago"
                      aria-label="Editar pago"
                      @click="emit('editar', sop)"
                    />
                    <v-btn
                      v-if="eliminable && modificable(sop)"
                      icon="mdi-trash-can-outline"
                      variant="outlined"
                      size="small"
                      rounded="lg"
                      color="error"
                      title="Eliminar pago"
                      aria-label="Eliminar pago"
                      @click="emit('eliminar', sop)"
                    />
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- celular y tablet: tarjetas -->
        <template v-else>
          <article
            v-for="(sop, i) in soportes"
            :key="sop.codigo"
            class="sopcob__item"
          >
            <div class="sopcob__num">
              {{ i + 1 }}
            </div>
            <div class="sopcob__datos">
              <div class="sopcob__fila1">
                <b class="sopcob__verde">{{ montoCobro(sop.monto, moneda) }}</b>
                <span
                  class="sopcob__estado"
                  :class="`sopcob__estado--${estadoDe(sop).codigo}`"
                >{{ estadoDe(sop).texto }}</span>
              </div>
              <div class="sopcob__det">
                <span><v-icon size="14">mdi-calendar-outline</v-icon> {{ soloFecha(sop.fecha_registro) || "—" }} {{ horaDe(sop.fecha_registro) }}</span>
                <span><v-icon size="14">mdi-bank-outline</v-icon> {{ sop.banco || "—" }} · {{ sop.nrocuenta || "—" }}</span>
              </div>
              <div
                v-if="sop.voucher_nombre"
                class="sopcob__archivo"
              >
                <v-icon size="14">
                  mdi-paperclip
                </v-icon> {{ sop.voucher_nombre }}
              </div>
            </div>
            <div class="sopcob__acciones">
              <v-btn
                icon="mdi-eye-outline"
                variant="outlined"
                size="small"
                rounded="lg"
                color="primary"
                :disabled="!sop.voucher_path"
                aria-label="Ver voucher"
                data-modo-ver="permitido"
                @click="abrir(sop.voucher_path)"
              />
              <v-btn
                icon="mdi-download"
                variant="text"
                size="small"
                color="primary"
                :disabled="!sop.voucher_path"
                aria-label="Descargar voucher"
                data-modo-ver="permitido"
                @click="descargarArchivo(sop.voucher_path, sop.voucher_nombre)"
              />
              <v-btn
                v-if="editable && modificable(sop)"
                icon="mdi-pencil-outline"
                variant="text"
                size="small"
                color="primary"
                aria-label="Editar pago"
                @click="emit('editar', sop)"
              />
              <v-btn
                v-if="eliminable && modificable(sop)"
                icon="mdi-trash-can-outline"
                variant="text"
                size="small"
                color="error"
                aria-label="Eliminar pago"
                @click="emit('eliminar', sop)"
              />
            </div>
          </article>
        </template>
        <p
          v-if="!soportes.length"
          class="sopcob__vacio"
        >
          Aún no hay pagos cargados.
        </p>
      </v-card-text>
    </v-card>
  </v-dialog>
</template>

<style scoped>
.sopcob {
  border-radius: 18px !important;
  color: #0a1f44;
}
.sopcob--full {
  border-radius: 0 !important;
}
.sopcob__head {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px 18px 10px;
}
.sopcob__icon {
  display: grid;
  place-items: center;
  width: 48px;
  height: 48px;
  border-radius: 12px;
  background: #e3ebfa;
  color: #1e5bd8;
}
.sopcob__titles {
  flex: 1;
  min-width: 0;
}
.sopcob__titles h3 {
  margin: 0;
  font-size: 1.15rem;
  font-weight: 800;
  text-transform: uppercase;
}
.sopcob__titles span {
  color: #5b6b86;
  font-size: 0.8rem;
}
.sopcob__caso {
  display: grid;
  grid-template-columns: 1fr auto auto;
  gap: 24px;
  margin: 0 18px 8px;
  padding: 12px 14px;
  border-radius: 12px;
  background: #eef4ff;
}
.sopcob__caso > div {
  display: flex;
  flex-direction: column;
  min-width: 0;
}
.sopcob__caso small {
  color: #5b6b86;
}
.sopcob__casodato {
  text-align: right;
}
.sopcob__label {
  color: #5b6b86;
  font-size: 0.7rem;
  font-weight: 700;
  text-transform: uppercase;
}
.sopcob__verde {
  color: #15803d;
  font-size: 1.05rem;
}
.sopcob__caso .sopcob__falta {
  color: #b45309;
  font-weight: 700;
}
.sopcob__caso .sopcob__ok {
  color: #15803d;
  font-weight: 700;
}
.sopcob__body {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 8px 18px 18px !important;
}
.sopcob__wrap {
  overflow-x: auto;
  border: 1px solid #e3eaf5;
  border-radius: 14px;
  box-shadow: 0 2px 8px rgba(10, 31, 68, 0.06);
}
.sopcob__table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
}
.sopcob__table th {
  padding: 10px 8px;
  background: #eaf2ff;
  color: #1e3a8a;
  font-weight: 700;
  line-height: 1.3;
  text-align: center;
  white-space: nowrap;
}
.sopcob__table td {
  padding: 10px 8px;
  border-top: 1px solid #edf1f7;
  text-align: center;
  vertical-align: middle;
}
.sopcob__ojo {
  border-color: #93b4f0 !important;
}
.sopcob__nowrap {
  white-space: nowrap;
}
.sopcob__chipfecha {
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
.sopcob__estado {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 5px 10px;
  border-radius: 8px;
  font-size: 0.8rem;
  font-weight: 700;
  line-height: 1.2;
}
.sopcob__estado--BORRADOR { background: #eceff3; color: #475467; }
.sopcob__estado--LISTO { background: #fdebd3; color: #b45309; }
.sopcob__estado--CONFIRMADO { background: #d9f7e1; color: #166534; }
.sopcob__estado--CONFIRMADO .v-icon { color: #16a34a; }
.sopcob__estado--COBRADO { background: #dbeafe; color: #1e40af; }
.sopcob__estado--RECHAZADA { background: #fde2e2; color: #b42318; }
.sopcob__acciones {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}
.sopcob__item {
  display: grid;
  grid-template-columns: 28px 1fr;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  border: 1px solid #dbe5f3;
  border-radius: 12px;
}
.sopcob__num {
  display: grid;
  place-items: center;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: #1e5bd8;
  color: #fff;
  font-size: 0.8rem;
  font-weight: 800;
}
.sopcob__datos {
  min-width: 0;
}
.sopcob__fila1 {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
}
.sopcob__det {
  display: flex;
  flex-wrap: wrap;
  gap: 4px 14px;
  margin-top: 4px;
  color: #3b4a63;
  font-size: 0.82rem;
}
.sopcob__archivo {
  margin-top: 2px;
  color: #5b6b86;
  font-size: 0.8rem;
  overflow-wrap: anywhere;
}
.sopcob__item .sopcob__acciones {
  grid-column: 1 / -1;
  justify-content: flex-end;
}
.sopcob__vacio {
  margin: 12px 0;
  color: #5b6b86;
  text-align: center;
}
@media (max-width: 600px) {
  .sopcob__caso {
    grid-template-columns: 1fr;
    gap: 8px;
  }
  .sopcob__casodato {
    text-align: left;
  }
}
</style>
