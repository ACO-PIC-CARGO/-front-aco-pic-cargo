<script setup lang="ts">
import { computed } from "vue";
import { useAppStore } from "@/stores/app";
import { useMastersStore } from "@/stores/masters";
import Swal from "sweetalert2";
import { useMasterusuariosStore } from "@/stores/masterusuarios";
import { availabilityBaseDate, isEtaBeforeEtd } from "@/utils/masters";

const appStore = useAppStore();
const mastersStore = useMastersStore();
const masterusuariosStore = useMasterusuariosStore();
const itemsModality = computed(() => appStore.itemsModality);
const itemsShipment = computed(() => appStore.itemsShipment);

function isAereo() {
  let val = false;
  const id = appStore.master_id_trasnport.id
    ? appStore.master_id_trasnport.id
    : appStore.master_id_trasnport;

  const code =
    itemsShipment.value.filter((v: { id: number }) => v.id == id).length > 0
      ? itemsShipment.value.filter((v: { id: number }) => v.id == id)[0]!.code
      : "";

  if (code == "Aéreo") {
    val = true;
  }
  return val;
}
function isLCL() {
  let val = false;
  const id = appStore.master_id_trasnport.id
    ? appStore.master_id_trasnport.id
    : appStore.master_id_trasnport;

  const code =
    itemsShipment.value.filter((v: { id: number }) => v.id == id).length > 0
      ? itemsShipment.value.filter((v: { id: number }) => v.id == id)[0]!.code
      : "";

  if (code == "LCL") {
    val = true;
  }
  return val;
}
function modalityCode() {
  return itemsModality.value.find((v: { id: number }) => v.id == mastersStore.master_sentido)?.code;
}
function availabilityBase() {
  return availabilityBaseDate(
    modalityCode(),
    mastersStore.master_fecha_etd as string,
    mastersStore.master_fecha_eta as string,
  );
}
function _getDate() {
  if (isEtaBeforeEtd(mastersStore.master_fecha_etd as string, mastersStore.master_fecha_eta as string)) {
    Swal.fire({
      icon: "warning",
      text: "La fecha de llegada (ETA) no puede ser anterior a la de salida (ETD). Corrige una de las dos.",
    });
    return;
  }
  if (!mastersStore.master_fecha_disponibilidad) {
    mastersStore.master_fecha_disponibilidad = availabilityBase() ?? "";
  }
  _validaDate();
}
function _validaDate() {
  const base = availabilityBase();
  if (base && mastersStore.master_fecha_disponibilidad < base) {
    mastersStore.master_fecha_disponibilidad = base;
    Swal.fire({
      icon: "warning",
      text:
        modalityCode() === "I"
          ? "La fecha de disponibilidad no puede ser anterior a la salida (ETD)."
          : "La fecha de disponibilidad no puede ser anterior a la llegada (ETA).",
    });
  }
}
</script>

<template>
  <div>
    <v-row density="compact">
      <v-col
        cols="12"
        md="6"
      >
        <v-text-field
          v-model="mastersStore.master_fecha_etd"
          @change="_getDate()"
          type="date"
          label="Salida (ETD)"
        />
      </v-col>
      <v-col
        cols="12"
        md="6"
      >
        <v-checkbox
          label="Salida Confirmada"
          v-model="mastersStore.salidaflag"
          density="compact"
        />
      </v-col>
      <v-col
        cols="12"
        md="6"
      >
        <v-text-field
          v-model="mastersStore.master_fecha_eta"
          @change="_getDate()"
          type="date"
          label="Llegada (ETA)"
        />
      </v-col>
      <v-col
        cols="12"
        md="6"
      >
        <v-checkbox
          label="Llegada Confirmada"
          v-model="mastersStore.llegadaflag"
          density="compact"
        />
      </v-col>

      <v-col
        cols="12"
        md="6"
        align="right"
        justify="right"
      >
        <v-text-field
          v-model="mastersStore.master_fecha_disponibilidad"
          type="date"
          @change="_validaDate()"
          label="Fecha de Disponibilidad"
        />
      </v-col>
      <v-col
        cols="12"
        md="6"
        align="right"
        justify="right"
      >
        <v-checkbox
          label="Confirmación Disponibilidad"
          v-model="mastersStore.disponibilidadflag"
          density="compact"
        />
      </v-col>
      <v-col
        cols="12"
        md="6"
      >
        <v-select
          :items="masterusuariosStore.lstCanales"
          item-title="descripcion"
          item-value="id"
          v-model="mastersStore.id_canal"
          label="Canal"
        />
      </v-col>
      <v-col
        cols="12"
        md="6"
      >
        <v-text-field
          label="Almacén Recepción"
          v-model="mastersStore.almacen_recepcion"
        />
      </v-col>
      <v-col
        cols="12"
        md="6"
      >
        <v-text-field
          v-model="mastersStore.fecha_libre_almacenaje"
          type="date"
          label="Fecha Máxima Libre de Almacenaje"
        />
      </v-col>

      <!-- Solo FCL: Días libres de sobreestadía y fecha límite de sobreestadía -->
      <v-col
        cols="12"
        md="6"
        v-if="!(isAereo() || isLCL())"
      >
        <v-text-field
          label="Días Libres de Sobreestadía."
          type="number"
          suffix="Día(s)"
          v-model="mastersStore.dias_sobreestadia"
          min="0"
        />
      </v-col>
      <v-col
        cols="12"
        md="6"
        v-if="!(isAereo() || isLCL())"
      >
        <v-text-field
          v-model="mastersStore.fecha_libre_sobreestadia"
          type="date"
          label="Libre de Sobreestadía Hasta"
        />
      </v-col>

      <!-- <v-col cols="12" md="6">
          <v-text-field
            type="number"
            min="0"
            v-model="$store.state.master_ganancia_pricing"
            label="Ganancia Pricing"
          ></v-text-field>
        </v-col>
        <v-col cols="12" md="6">
          <v-text-field
            type="number"
            min="0"
            v-model="$store.state.master_ganancia_operaciones"
            label="Ganancia Operaciones"
          ></v-text-field>
        </v-col> -->
      <v-col
        cols="12"
        md="6"
      >
        <v-text-field
          type="number"
          min="0"
          v-model="mastersStore.nro_manifiesto"
          label="Número de Manifiesto"
        />
      </v-col>
    </v-row>
  </div>
</template>


