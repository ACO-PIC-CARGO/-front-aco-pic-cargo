<template>
  <v-container fluid>
    <v-row v-if="step == 1">
      <v-col cols="6">
        <v-file-input @update:model-value="obtenerDatosExcel()" id="excel"></v-file-input>
        <v-btn color="success" :disabled="items.length == 0" @click="generar()"
          >Generar</v-btn
        >
      </v-col>
      <v-col cols="6">
        <v-data-table :headers="headers" :items="items" density="compact"> </v-data-table>
      </v-col>
    </v-row>
    <v-row v-if="step == 2">
      <v-data-table
        :headers="headersStep2"
        :items="consolidacionStore.lstConsolidacion"
        density="compact"
      >
      </v-data-table>
      <v-btn color="success" @click="step = 1">Volver</v-btn>
    </v-row>
  </v-container>
</template>

<script>
import { readSheet as readXlsFile } from "read-excel-file/browser";
import moment from "moment";
import { mapActions as mapPiniaActions, mapStores } from "pinia";
import { useConsolidacionStore } from "@/stores/consolidacion";
export default {
  data() {
    return {
      step: 1,
      files: null,
      headers: [
        { title: "Fecha", key: "fecha" },
        { title: "Nro Operación", key: "nroop" },
        { title: "Monto", key: "monto" },
      ],
      items: [],
      headersStep2: [
        { title: "Fecha/ PIC", key: "fecha_operacion_sistema" },
        { title: "Fecha/ Banco", key: "fecha_operacion_banco" },
        { title: "Proveedor", key: "name_proveedor" },
        { title: "Ingreso/ PIC", key: "monto_sistema" },
        { title: "Ingreso/ Banco", key: "monto_banco" },
        { title: "Nro Operación ", key: "nro_operacion" },
      ],
      consolidacion: [],
    };
  },
  computed: {
    ...mapStores(useConsolidacionStore),
  },
  methods: {
    ...mapPiniaActions(useConsolidacionStore, ["generarConsolidacion"]),
    obtenerDatosExcel() {
      const file = document.getElementById("excel");
      try {
        readXlsFile(file.files[0]).then((rows) => {
          this.guardarDatos(rows);
        });
      } catch (err) {
        console.error(err);
      }
    },
    guardarDatos(rows) {
      let year = moment(new Date()).format("YYYY");
      let text = "";
      let valor = "";
      rows.forEach((element) => {
        text = element[33].toString();
        if (text.substring(text.length - 1, text.length) == "-") {
          valor = "-" + text.replace(",", "").substring(0, text.length - 1);
        } else {
          valor = element[33];
        }

        this.items.push({
          fecha: element[0] + "-" + year,
          nroop: element[18],
          monto: parseFloat(valor).toFixed(4),
        });
      });
    },
    async generar() {
      let data = this.items.sort((a, b) => {
        if (a.fecha < b.fecha) {
          return -1;
        }
        if (a.fecha > b.fecha) {
          return 1;
        }
        return 0;
      });

      await this.generarConsolidacion({
        fecha_inicio: moment(data[0].fecha).format("YYYY-MM-DD"),
        fecha_fin: moment(data[data.length - 1].fecha).format("YYYY-MM-DD"),
        cost: this.items,
      });

      //   this.step = 2;
    },
  },
};
</script>
