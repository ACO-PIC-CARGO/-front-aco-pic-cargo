<script setup lang="ts">
import { computed, nextTick, onMounted, useTemplateRef } from "vue";
import moment from "moment";
import { useAppStore } from "@/stores/app";
import { useMastersStore } from "@/stores/masters";
import { useMasterusuariosStore } from "@/stores/masterusuarios";
import FormatFecha from "@/components/comun/FormatFecha.vue";
import { RANGOS_CONTROL_GASTOS, fechasPorDefecto } from "@/utils/controlGastosFechas";

const appStore = useAppStore();
const mastersStore = useMastersStore();
const masterusuariosStore = useMasterusuariosStore();
const frmFiltro = useTemplateRef("frmFiltro");
const filtro = computed(() => appStore.controlgastosfiltro);

// Mismas props para todos los campos: el panel se lee como un solo formulario.
const campo = { variant: "outlined", density: "compact", clearable: true, hideDetails: true } as const;
const fecha = { outlined: true, density: "compact", clearable: true, hideDetails: true, prependInnerIcon: "mdi-calendar-blank-outline", placeholder: "dd/mm/aaaa" } as const;

const ESTADOS = [
  { value: "0", label: "Abiertos", color: "success" },
  { value: "1", label: "Cerrados", color: "error" },
  { value: "", label: "Todos", color: "primary" },
] as const;

// "Todos" = sin filtro (""), así el backend no filtra por estado.
type CampoEstado = "status_operativo" | "status_administrativo";
const estado = (clave: CampoEstado) =>
  computed({
    get: () => String(filtro.value[clave] ?? ""),
    set: (valor: string | undefined) => (filtro.value[clave] = valor ?? ""),
  });
const estadoOperativo = estado("status_operativo");
const estadoAdministrativo = estado("status_administrativo");

const CAMPOS = [
  "id_sentido", "id_shipment", "id_incoterms", "id_origen", "id_destino", "id_operador", "id_agente", "id_coloader",
  "id_canal", "id_motonave", "id_condicion", "nro_mbl", "nro_manifiesto",
] as const;
const activos = computed(() => {
  const f = filtro.value;
  const campos = CAMPOS.filter((clave) => f[clave] !== null && f[clave] !== undefined && f[clave] !== "").length;
  const rangos = RANGOS_CONTROL_GASTOS.filter((r) => f[r.desde] || f[r.hasta]).length;
  const estados = [f.status_operativo, f.status_administrativo].filter((v) => v === "0" || v === "1").length;
  return campos + rangos + estados;
});

const etiquetaRango = (nombre: string) => nombre.replace("Fecha ", "");
function avisoRango(desde?: string | null, hasta?: string | null) {
  if (!desde || !hasta) return "";
  return moment(hasta).isAfter(moment(desde).add(1, "year")) ? "Más de 1 año: se puede filtrar, pero no exportar." : "";
}

function cerrar() {
  appStore.cg_filtrarData = false;
}

async function cargarPuertos(idShipment: number | string | null) {
  filtro.value.id_origen = null;
  filtro.value.id_destino = null;
  const tipo = appStore.itemsShipment.find((item: { id: unknown }) => item.id == idShipment);
  if (!tipo?.id_transport) return;
  await Promise.all([
    appStore._getPortBegin({ id_transport: tipo.id_transport }),
    appStore._getPortEnd({ id_transport: tipo.id_transport }),
  ]);
}

async function filtrar() {
  appStore.spiner = true;
  await appStore._getControlList();
  cerrar();
  appStore.spiner = false;
}

async function limpiar() {
  appStore.spiner = true;
  frmFiltro.value!.reset();
  await nextTick();

  // vuelve al rango por defecto: Fecha Disponibilidad del 1 de enero a hoy
  Object.assign(appStore.controlgastosfiltro, fechasPorDefecto());
  appStore.controlgastosfiltro.status_operativo = "";
  appStore.controlgastosfiltro.status_administrativo = "";
  appStore.controlgastosfiltro.pagina = 1;
  appStore.controlgastosfiltro.limite = 10;

  await appStore._getControlList();
  cerrar();
  appStore.spiner = false;
}

// Listas que el listado no carga: se piden solo si aún están vacías.
onMounted(() => {
  const pendientes: Promise<unknown>[] = [];
  if (!appStore.itemsIncoterms?.length) pendientes.push(appStore._getIncoterms());
  if (!appStore.itemsOperadorList?.length) pendientes.push(appStore._getOperador());
  if (!appStore.itemsMotonave?.length) pendientes.push(appStore._getMotonave());
  if (!appStore.itemsFleteCon?.length) pendientes.push(appStore._getFleteCon());
  if (!mastersStore.itemsProveedorRolAgente?.length) pendientes.push(mastersStore._getProveedorRolAgente());
  if (!mastersStore.itemsProveedorRolColoader?.length) pendientes.push(mastersStore._getProveedorRolColoader());
  return Promise.all(pendientes);
});
</script>

<template>
  <div class="filtro-cg">
    <header class="filtro-cg__header">
      <div>
        <div class="text-overline filtro-cg__eyebrow">
          Expedientes máster
        </div>
        <div class="text-title-large font-weight-bold">
          Filtrar registros
        </div>
      </div>
      <v-spacer />
      <v-chip
        v-if="activos"
        size="small"
        color="primary"
        variant="flat"
        class="mr-1"
      >
        {{ activos }} activo{{ activos === 1 ? "" : "s" }}
      </v-chip>
      <v-btn
        icon="mdi-close"
        variant="text"
        size="small"
        aria-label="Cerrar filtros"
        @click="cerrar"
      />
    </header>

    <v-form
      ref="frmFiltro"
      class="filtro-cg__body"
      @submit.prevent="filtrar"
    >
      <section class="filtro-cg__section">
        <h3 class="filtro-cg__title">
          <span class="filtro-cg__num">1</span>
          Datos y servicios
        </h3>
        <div class="filtro-cg__grid">
          <v-autocomplete
            v-model="appStore.controlgastosfiltro.id_sentido"
            v-bind="campo"
            :items="appStore.itemsModality"
            item-title="name"
            item-value="id"
            label="Sentido"
          />
          <v-autocomplete
            v-model="appStore.controlgastosfiltro.id_shipment"
            v-bind="campo"
            :items="appStore.itemsShipment"
            item-title="embarque"
            item-value="id"
            label="Tipo de embarque"
            @update:model-value="cargarPuertos"
          />
          <v-autocomplete
            v-model="appStore.controlgastosfiltro.id_incoterms"
            v-bind="campo"
            :items="appStore.itemsIncoterms"
            item-title="name"
            item-value="id"
            label="Incoterms"
          />
          <v-autocomplete
            v-model="appStore.controlgastosfiltro.id_canal"
            v-bind="campo"
            :items="masterusuariosStore.lstCanales"
            item-title="descripcion"
            item-value="id"
            label="Canal"
          />
          <v-autocomplete
            v-model="appStore.controlgastosfiltro.id_origen"
            v-bind="campo"
            :items="appStore.itemsPortBegin"
            item-title="name"
            item-value="id_port"
            label="Origen"
            :disabled="!appStore.controlgastosfiltro.id_shipment"
          />
          <v-autocomplete
            v-model="appStore.controlgastosfiltro.id_destino"
            v-bind="campo"
            :items="appStore.itemsPortEnd"
            item-title="name"
            item-value="id_port"
            label="Destino"
            :disabled="!appStore.controlgastosfiltro.id_shipment"
          />
        </div>
        <p
          v-if="!appStore.controlgastosfiltro.id_shipment"
          class="filtro-cg__aviso"
        >
          <v-icon
            icon="mdi-alert-outline"
            size="16"
          />
          Elige el tipo de embarque para filtrar por origen y destino.
        </p>
        <v-autocomplete
          v-model="appStore.controlgastosfiltro.id_operador"
          v-bind="campo"
          :items="appStore.itemsOperadorList"
          item-title="namelong"
          item-value="id"
          label="Operador"
        />
        <v-autocomplete
          v-model="appStore.controlgastosfiltro.id_agente"
          v-bind="campo"
          :items="mastersStore.itemsProveedorRolAgente"
          item-title="namelong"
          item-value="id"
          label="Agente"
        />
        <v-autocomplete
          v-model="appStore.controlgastosfiltro.id_coloader"
          v-bind="campo"
          :items="mastersStore.itemsProveedorRolColoader"
          item-title="namelong"
          item-value="id"
          label="Coloader"
        />
      </section>

      <section class="filtro-cg__section">
        <h3 class="filtro-cg__title">
          <span class="filtro-cg__num">2</span>
          Datos del embarque
        </h3>
        <div class="filtro-cg__grid">
          <v-autocomplete
            v-model="appStore.controlgastosfiltro.id_motonave"
            v-bind="campo"
            :items="appStore.itemsMotonave"
            item-title="name"
            item-value="id"
            label="Motonave"
          />
          <v-autocomplete
            v-model="appStore.controlgastosfiltro.id_condicion"
            v-bind="campo"
            :items="appStore.itemsFleteCon"
            item-title="name"
            item-value="id"
            label="Condición del flete"
          />
        </div>
        <v-text-field
          v-model.trim="appStore.controlgastosfiltro.nro_mbl"
          v-bind="campo"
          label="BL Máster"
          placeholder="Escribe parte del número"
          prepend-inner-icon="mdi-magnify"
        />
        <v-text-field
          v-model.trim="appStore.controlgastosfiltro.nro_manifiesto"
          v-bind="campo"
          label="Número de manifiesto"
          placeholder="Escribe parte del número"
          prepend-inner-icon="mdi-magnify"
        />
      </section>

      <section class="filtro-cg__section">
        <h3 class="filtro-cg__title">
          <span class="filtro-cg__num">3</span>
          Fechas
        </h3>
        <div
          v-for="rango in RANGOS_CONTROL_GASTOS"
          :key="rango.nombre"
          class="filtro-cg__rango"
        >
          <div class="filtro-cg__label">
            {{ etiquetaRango(rango.nombre) }}
          </div>
          <div class="filtro-cg__grid">
            <FormatFecha
              v-model="appStore.controlgastosfiltro[rango.desde]"
              v-bind="fecha"
              label="Desde"
              :max="appStore.controlgastosfiltro[rango.hasta] || undefined"
            />
            <FormatFecha
              v-model="appStore.controlgastosfiltro[rango.hasta]"
              v-bind="fecha"
              label="Hasta"
              :min="appStore.controlgastosfiltro[rango.desde] || undefined"
            />
          </div>
          <p
            v-if="avisoRango(appStore.controlgastosfiltro[rango.desde], appStore.controlgastosfiltro[rango.hasta])"
            class="filtro-cg__hint filtro-cg__hint--warn"
          >
            <v-icon
              icon="mdi-alert-outline"
              size="14"
            />
            {{ avisoRango(appStore.controlgastosfiltro[rango.desde], appStore.controlgastosfiltro[rango.hasta]) }}
          </p>
        </div>
      </section>

      <section class="filtro-cg__section">
        <h3 class="filtro-cg__title">
          <span class="filtro-cg__num">4</span>
          Estado
        </h3>
        <div class="filtro-cg__label">
          Operativo
        </div>
        <v-btn-toggle
          v-model="estadoOperativo"
          mandatory
          divided
          variant="outlined"
          density="compact"
          class="filtro-cg__toggle"
        >
          <v-btn
            v-for="opcion in ESTADOS"
            :key="opcion.label"
            :value="opcion.value"
            :color="opcion.color"
          >
            {{ opcion.label }}
          </v-btn>
        </v-btn-toggle>
        <div class="filtro-cg__label">
          Administrativo
        </div>
        <v-btn-toggle
          v-model="estadoAdministrativo"
          mandatory
          divided
          variant="outlined"
          density="compact"
          class="filtro-cg__toggle"
        >
          <v-btn
            v-for="opcion in ESTADOS"
            :key="opcion.label"
            :value="opcion.value"
            :color="opcion.color"
          >
            {{ opcion.label }}
          </v-btn>
        </v-btn-toggle>
      </section>
    </v-form>

    <footer class="filtro-cg__footer">
      <v-btn
        variant="text"
        prepend-icon="mdi-filter-remove-outline"
        @click="limpiar"
      >
        Limpiar
      </v-btn>
      <v-spacer />
      <v-btn
        variant="text"
        @click="cerrar"
      >
        Cancelar
      </v-btn>
      <v-btn
        color="primary"
        variant="flat"
        prepend-icon="mdi-filter-check-outline"
        @click="filtrar"
      >
        Aplicar
      </v-btn>
    </footer>
  </div>
</template>

<style scoped>
.filtro-cg {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: rgb(var(--v-theme-surface));
}
.filtro-cg__header {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 14px 12px 12px 20px;
  border-bottom: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
}
.filtro-cg__eyebrow {
  line-height: 1.2;
  color: rgb(var(--v-theme-primary));
}
.filtro-cg__body {
  flex: 1;
  overflow-y: auto;
  padding: 4px 20px 16px;
}
.filtro-cg__section {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 16px 0;
}
.filtro-cg__section + .filtro-cg__section {
  border-top: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
}
.filtro-cg__title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.95rem;
  font-weight: 700;
}
.filtro-cg__num {
  display: inline-grid;
  place-items: center;
  width: 22px;
  height: 22px;
  border-radius: 50%;
  font-size: 0.75rem;
  color: #fff;
  background: rgb(var(--v-theme-primary));
}
.filtro-cg__grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px 8px;
}
.filtro-cg__rango {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.filtro-cg__label {
  font-size: 0.8rem;
  font-weight: 600;
}
.filtro-cg__hint {
  margin: -4px 0 0;
  font-size: 0.72rem;
  color: rgba(var(--v-theme-on-surface), var(--v-medium-emphasis-opacity));
}
.filtro-cg__aviso {
  display: flex;
  align-items: center;
  gap: 6px;
  margin: -4px 0 0;
  padding: 6px 10px;
  border-radius: 6px;
  font-size: 0.75rem;
  color: #7a5a00;
  background: #fff8e1;
  border: 1px solid #ffd54f;
}
.filtro-cg__aviso .v-icon {
  color: #f9a825;
}
.filtro-cg__hint--warn {
  margin: 0;
  display: flex;
  align-items: center;
  gap: 4px;
  color: rgb(var(--v-theme-warning));
}
.filtro-cg__toggle {
  width: 100%;
}
.filtro-cg__toggle :deep(.v-btn) {
  flex: 1;
  text-transform: none;
  letter-spacing: 0;
}
.filtro-cg__footer {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 16px;
  border-top: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
}
</style>
