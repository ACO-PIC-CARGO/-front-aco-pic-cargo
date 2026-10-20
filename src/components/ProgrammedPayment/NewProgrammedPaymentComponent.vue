<script setup lang="ts">
import { onMounted, ref, watch } from "vue";
import { useAppStore } from "@/stores/app";
import Swal from "sweetalert2";
import axios from '@/api/http';
import moment from "moment";
import type { ProgramacionPagoListado } from "@/types/banksProveedor";
import { sessionBranchId } from "@/utils/sesion";

const props = defineProps<{
  id?: number | string;
  tipo?: number | string;
  // eslint-disable-next-line vue/prop-name-casing
  id_master?: number | string;
  // eslint-disable-next-line vue/prop-name-casing
  id_proveedor?: number | string;
}>();
const emit = defineEmits<{ cerrar: [value: boolean] }>();

const appStore = useAppStore();

const headers = ref([
  {
    title: "Correlativo",
    key: "correlativo",
  },
  {
    title: "Fecha Programada",
    key: "fecha",
  },
]);
const listado = ref<ProgramacionPagoListado[]>([]);
const selected = ref<ProgramacionPagoListado[]>([]);
const fecha = ref(moment(new Date()).add(7, "days").format("YYYY-MM-DD"));

async function ListProgrammedPayment() {
  const data = {
    id_branch: sessionBranchId(),
  };
  const config = {
    method: "get",
    url: import.meta.env.VITE_URL_MAIN + "ListProgrammedPayment",

    headers: {
     
      "Content-Type": "application/json",
    },
    data: data,
  };
  await axios(config)
    .then(function (response) {
      listado.value = response.data.data;
    })
    .catch(function (error) {
      console.error(error);
    });
}
function validarSeleccionado() {
  fecha.value = selected.value[0]!.fecha;
}
function cerrarModal() {
  emit("cerrar", false);
}
async function guardar() {
  const data = {
    id: selected.value.length > 0 ? selected.value[0]!.id : 0,
    nuevoflag: selected.value.length > 0 ? false : true,
    id_detailspayinvoicecxp: props.tipo == 0 ? props.id : null,
    id_controlgastosegresos: props.tipo == 1 ? props.id : null,
    fecha: fecha.value,
    controlgastoegreso: props.tipo == 1 ? true : false,
    id_master: props.id_master,
    id_proveedor: props.id_proveedor,
    STATUS: true,
    id_branch: sessionBranchId(),
  };
  const config = {
    method: "post",
    url: import.meta.env.VITE_URL_MAIN + "setProgrammedPayment",
    headers: {
     
      "Content-Type": "application/json",
    },
    data: data,
  };
  await axios(config)
    .then(function () {
      ListProgrammedPayment();
      appStore.refreshReport = !appStore.refreshReport;
      Swal.fire("Registro Correcto");
      emit("cerrar", false);
    })
    .catch(function (error) {
      console.error(error);
    });
}

watch(() => props.id, () => {
  ListProgrammedPayment();
  selected.value = [];
});

//   data: () => ({}),
onMounted(async () => {
  appStore.spiner = true;
  await ListProgrammedPayment();
  appStore.spiner = false;
});
</script>

<template>
  <v-card elevation="2">
    <v-card-title primary-title>
      REGISTRO DE NUEVA PROGRAMACIÓN
    </v-card-title>
    <v-card-text>
      <div
        class="col-12"
        v-if="listado.length > 0"
      >
        <v-card-title primary-title>
          Ya existe(n) programación(es):
        </v-card-title>
        <v-card-subtitle primary-title>
          Desea asociar a alguna fecha de programación, seleccione una, sino
          puede seleccionar su propia fecha.
        </v-card-subtitle>
        <v-data-table
          :headers="headers"
          :items="listado"
          class="elevation-1"
          item-value="id"
          return-object
          select-strategy="single"
          show-select
          v-model="selected"
          :items-per-page="5"
          @update:model-value="validarSeleccionado()"
        />
      </div>
      <div class="col-4">
        <v-text-field
          label="Fecha de programación"
          v-model="fecha"
          type="date"
        />
      </div>
    </v-card-text>
    <v-card-actions>
      <v-btn
        color="success"
        @click="guardar"
      >
        Registrar
      </v-btn>
      <v-btn
        color="warning"
        @click="cerrarModal"
      >
        CancelarSH
      </v-btn>
    </v-card-actions>
  </v-card>
</template>

<style></style>
