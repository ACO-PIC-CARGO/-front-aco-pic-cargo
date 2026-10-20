<script setup lang="ts">
import { computed } from "vue";
import { useStore } from "vuex";
import Swal from "sweetalert2";
import { useMasterusuariosStore } from "@/stores/masterusuarios";

const rootStore = useStore();
const masterusuariosStore = useMasterusuariosStore();
const itemsModality = computed(() => rootStore.state.itemsModality);
const itemsShipment = computed(() => rootStore.state.itemsShipment);

function isAereo() {
  let val = false;
  const id = rootStore.state.master_id_trasnport.id
    ? rootStore.state.master_id_trasnport.id
    : rootStore.state.master_id_trasnport;

  const code =
    itemsShipment.value.filter((v: { id: number }) => v.id == id).length > 0
      ? itemsShipment.value.filter((v: { id: number }) => v.id == id)[0].code
      : "";

  if (code == "Aéreo") {
    val = true;
  }
  return val;
}
function isLCL() {
  let val = false;
  const id = rootStore.state.master_id_trasnport.id
    ? rootStore.state.master_id_trasnport.id
    : rootStore.state.master_id_trasnport;

  const code =
    itemsShipment.value.filter((v: { id: number }) => v.id == id).length > 0
      ? itemsShipment.value.filter((v: { id: number }) => v.id == id)[0].code
      : "";

  if (code == "LCL") {
    val = true;
  }
  return val;
}
function _getDate() {
  const code_sentido = itemsModality.value.filter(
    (v: { id: number }) => v.id == rootStore.state.master_sentido,
  )[0].code;

  if (code_sentido == "E") {
    if (!rootStore.state.master_fecha_disponibilidad) {
      rootStore.state.master_fecha_disponibilidad =
        rootStore.state.master_fecha_eta;
    }
  } else if (code_sentido == "I") {
    if (!rootStore.state.master_fecha_disponibilidad) {
      rootStore.state.master_fecha_disponibilidad =
        rootStore.state.master_fecha_etd;
    }
  }
  _validaDate();
}
function _validaDate() {
  const code_sentido = itemsModality.value.filter(
    (v: { id: number }) => v.id == rootStore.state.master_sentido,
  )[0].code;
  if (code_sentido == "E") {
    if (
      rootStore.state.master_fecha_disponibilidad <
      rootStore.state.master_fecha_eta
    ) {
      rootStore.state.master_fecha_disponibilidad =
        rootStore.state.master_fecha_eta;
      Swal.fire({
        icon: "warning",
        title: "Lo sentimos",
        text: "La fecha de disponibilidad no puede ser menor a la fecha de llegada",
      });
    }
  } else if (code_sentido == "I") {
    if (
      rootStore.state.master_fecha_disponibilidad <
      rootStore.state.master_fecha_etd
    ) {
      rootStore.state.master_fecha_disponibilidad =
        rootStore.state.master_fecha_etd;
      Swal.fire({
        icon: "warning",
        title: "Lo sentimos",
        text: "La fecha de disponibilidad no puede ser menor a la fecha de llegada",
      });
    }
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
          v-model="rootStore.state.master_fecha_etd"
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
          v-model="rootStore.state.salidaflag"
          density="compact"
        />
      </v-col>
      <v-col
        cols="12"
        md="6"
      >
        <v-text-field
          v-model="rootStore.state.master_fecha_eta"
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
          v-model="rootStore.state.llegadaflag"
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
          v-model="rootStore.state.master_fecha_disponibilidad"
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
          v-model="rootStore.state.disponibilidadflag"
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
          v-model="rootStore.state.id_canal"
          label="Canal"
        />
      </v-col>
      <v-col
        cols="12"
        md="6"
      >
        <v-text-field
          label="Almacén Recepción"
          v-model="rootStore.state.almacen_recepcion"
        />
      </v-col>
      <v-col
        cols="12"
        md="6"
      >
        <v-text-field
          v-model="rootStore.state.fecha_libre_almacenaje"
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
          v-model="rootStore.state.dias_sobreestadia"
          min="0"
        />
      </v-col>
      <v-col
        cols="12"
        md="6"
        v-if="!(isAereo() || isLCL())"
      >
        <v-text-field
          v-model="rootStore.state.fecha_libre_sobreestadia"
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
          v-model="rootStore.state.nro_manifiesto"
          label="Número de Manifiesto"
        />
      </v-col>
    </v-row>
  </div>
</template>


