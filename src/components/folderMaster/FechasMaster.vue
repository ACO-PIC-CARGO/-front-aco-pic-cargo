<script setup lang="ts">
import { computed } from "vue";
import { useRoute } from "vue-router";
import { useAppStore } from "@/stores/app";
import { useMastersStore } from "@/stores/masters";
import Swal from "sweetalert2";
import FormatFecha from "@/components/comun/FormatFecha.vue";
import { availabilityBaseDate, isEtaBeforeEtd } from "@/utils/masters";
import MasterDateHistory from "./MasterDateHistory.vue";
import MasterField from "./MasterField.vue";

const appStore = useAppStore();
const mastersStore = useMastersStore();
const route = useRoute();
const masterId = computed(() => (route.params.id ? String(route.params.id) : null));
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
  <div class="master-fechas">
    <v-row density="compact">
      <v-col cols="7">
        <MasterField
          label="Salida (ETD)"
          v-slot="{ id }"
        >
          <FormatFecha
            :id="id"
            v-model="mastersStore.master_fecha_etd"
            @update:model-value="_getDate()"
            label=""
            placeholder="dd/mm/aaaa"
            outlined
            density="compact"
            hide-details="auto"
            prepend-inner-icon="mdi-calendar-blank-outline"
          />
        </MasterField>
        <MasterDateHistory
          :master-id="masterId"
          campo="fecha_etd"
          title="Salida (ETD)"
          column="ETD"
        />
      </v-col>
      <v-col
        cols="5"
        class="master-fechas__check"
      >
        <v-checkbox
          label="Salida Confirmada"
          v-model="mastersStore.salidaflag"
          density="compact"
          hide-details
        />
      </v-col>

      <v-col cols="7">
        <MasterField
          label="Llegada (ETA)"
          v-slot="{ id }"
        >
          <FormatFecha
            :id="id"
            v-model="mastersStore.master_fecha_eta"
            @update:model-value="_getDate()"
            label=""
            placeholder="dd/mm/aaaa"
            outlined
            density="compact"
            hide-details="auto"
            prepend-inner-icon="mdi-calendar-blank-outline"
          />
        </MasterField>
        <MasterDateHistory
          :master-id="masterId"
          campo="fecha_eta"
          title="Llegada (ETA)"
          column="ETA"
        />
      </v-col>
      <v-col
        cols="5"
        class="master-fechas__check"
      >
        <v-checkbox
          label="Llegada Confirmada"
          v-model="mastersStore.llegadaflag"
          density="compact"
          hide-details
        />
      </v-col>

      <v-col cols="7">
        <MasterField
          label="Fecha de Disponibilidad"
          v-slot="{ id }"
        >
          <FormatFecha
            :id="id"
            v-model="mastersStore.master_fecha_disponibilidad"
            @update:model-value="_validaDate()"
            label=""
            placeholder="dd/mm/aaaa"
            outlined
            density="compact"
            hide-details="auto"
            prepend-inner-icon="mdi-calendar-blank-outline"
          />
        </MasterField>
        <MasterDateHistory
          :master-id="masterId"
          campo="fecha_disponibilidad"
          title="Fecha de Disponibilidad"
          column="Disponibilidad"
        />
      </v-col>
      <v-col
        cols="5"
        class="master-fechas__check"
      >
        <v-checkbox
          label="Confirmación Disponibilidad"
          v-model="mastersStore.disponibilidadflag"
          density="compact"
          hide-details
        />
      </v-col>

      <v-col cols="7">
        <MasterField
          label="Fecha Máxima Libre de Almacenaje"
          v-slot="{ id }"
        >
          <FormatFecha
            :id="id"
            v-model="mastersStore.fecha_libre_almacenaje"
            label=""
            placeholder="dd/mm/aaaa"
            outlined
            density="compact"
            hide-details="auto"
            prepend-inner-icon="mdi-calendar-blank-outline"
          />
        </MasterField>
      </v-col>

      <!-- Solo FCL: Días libres de sobreestadía y fecha límite de sobreestadía -->
      <template v-if="!(isAereo() || isLCL())">
        <v-col
          cols="12"
          sm="6"
        >
          <MasterField
            label="Días Libres de Sobreestadía"
            v-slot="{ id }"
          >
            <v-text-field
              :id="id"
              type="number"
              suffix="Día(s)"
              v-model="mastersStore.dias_sobreestadia"
              min="0"
            />
          </MasterField>
        </v-col>
        <v-col
          cols="12"
          sm="6"
        >
          <MasterField
            label="Libre de Sobreestadía Hasta"
            v-slot="{ id }"
          >
            <FormatFecha
              :id="id"
              v-model="mastersStore.fecha_libre_sobreestadia"
              label=""
              placeholder="dd/mm/aaaa"
              outlined
              density="compact"
              hide-details="auto"
              prepend-inner-icon="mdi-calendar-blank-outline"
            />
          </MasterField>
        </v-col>
      </template>

      <v-col cols="12">
        <MasterField
          label="Almacén de Recepción"
          inline
          v-slot="{ id }"
        >
          <v-text-field
            :id="id"
            v-model="mastersStore.almacen_recepcion"
          />
        </MasterField>
      </v-col>
      <v-col cols="12">
        <MasterField
          label="Número de Manifiesto"
          inline
          v-slot="{ id }"
        >
          <v-text-field
            :id="id"
            type="number"
            min="0"
            v-model="mastersStore.nro_manifiesto"
          />
        </MasterField>
      </v-col>
    </v-row>
  </div>
</template>

<style scoped>
.master-fechas__check {
  display: flex;
  align-items: flex-start;
  padding-top: 24px;
}
.master-fechas__check :deep(.v-label) {
  font-size: 13px;
  line-height: 1.2;
  opacity: 1;
}
</style>
