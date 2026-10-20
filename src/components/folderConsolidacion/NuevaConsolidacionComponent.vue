<script setup lang="ts">
import { ref } from "vue";
import { readSheet as readXlsFile } from "read-excel-file/browser";
import type { SheetData } from "read-excel-file/browser";
import moment from "moment";
import { useConsolidacionStore } from "@/stores/consolidacion";
import type { FilaExcelConsolidacion } from "@/types/operacionesMaster";

const consolidacionStore = useConsolidacionStore();

const step = ref(1);
const headers = [
  { title: "Fecha", key: "fecha" },
  { title: "Nro Operación", key: "nroop" },
  { title: "Monto", key: "monto" },
];
const items = ref<FilaExcelConsolidacion[]>([]);
const headersStep2 = [
  { title: "Fecha/ PIC", key: "fecha_operacion_sistema" },
  { title: "Fecha/ Banco", key: "fecha_operacion_banco" },
  { title: "Proveedor", key: "name_proveedor" },
  { title: "Ingreso/ PIC", key: "monto_sistema" },
  { title: "Ingreso/ Banco", key: "monto_banco" },
  { title: "Nro Operación ", key: "nro_operacion" },
];

function obtenerDatosExcel() {
  const file = document.getElementById("excel") as HTMLInputElement;
  try {
    readXlsFile(file.files![0]!).then((rows) => {
      guardarDatos(rows);
    });
  } catch (err) {
    console.error(err);
  }
}
function guardarDatos(rows: SheetData) {
  const year = moment(new Date()).format("YYYY");
  let text = "";
  let valor: unknown = "";
  rows.forEach((element) => {
    text = element[33]!.toString();
    if (text.substring(text.length - 1, text.length) == "-") {
      valor = "-" + text.replace(",", "").substring(0, text.length - 1);
    } else {
      valor = element[33];
    }

    items.value.push({
      fecha: (element[0] as string) + "-" + year,
      nroop: element[18],
      monto: parseFloat(String(valor)).toFixed(4),
    });
  });
}
async function generar() {
  const data = items.value.sort((a, b) => {
    if (a.fecha < b.fecha) {
      return -1;
    }
    if (a.fecha > b.fecha) {
      return 1;
    }
    return 0;
  });

  await consolidacionStore.generarConsolidacion({
    fecha_inicio: moment(data[0]!.fecha).format("YYYY-MM-DD"),
    fecha_fin: moment(data[data.length - 1]!.fecha).format("YYYY-MM-DD"),
    cost: items.value,
  });

  //   this.step = 2;
}
</script>

<template>
  <v-container fluid>
    <v-row v-if="step == 1">
      <v-col cols="6">
        <v-file-input
          @update:model-value="obtenerDatosExcel()"
          id="excel"
        />
        <v-btn
          color="success"
          :disabled="items.length == 0"
          @click="generar()"
        >
          Generar
        </v-btn>
      </v-col>
      <v-col cols="6">
        <v-data-table
          :headers="headers"
          :items="items"
          density="compact"
        />
      </v-col>
    </v-row>
    <v-row v-if="step == 2">
      <v-data-table
        :headers="headersStep2"
        :items="consolidacionStore.lstConsolidacion"
        density="compact"
      />
      <v-btn
        color="success"
        @click="step = 1"
      >
        Volver
      </v-btn>
    </v-row>
  </v-container>
</template>
