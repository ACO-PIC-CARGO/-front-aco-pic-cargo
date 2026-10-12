<template>
  <v-container fluid>
    <v-row v-if="step == 1">
      <v-col cols="6">
        <v-file-input @change="obtenerDatosExcel()" id="excel"></v-file-input>
        <v-btn color="success" :disabled="items.length == 0" @click="generar()"
          >Generar</v-btn
        >
      </v-col>
      <v-col cols="6">
        <v-data-table :headers="headers" :items="items" dense> </v-data-table>
      </v-col>
    </v-row>
    <v-row v-if="step == 2">
      <v-data-table
        :headers="headersStep2"
        :items="$store.state.consolidacion.lstConsolidacion"
        dense
      >
      </v-data-table>
      <v-btn color="success" @click="step = 1">Volver</v-btn>
    </v-row>
  </v-container>
</template>

<script>
import { readSheet as readXlsFile } from "read-excel-file/browser";
import moment from "moment";
import { mapActions } from "vuex";
export default {
  data() {
    return {
      step: 1,
      files: null,
      headers: [
        { text: "Fecha", value: "fecha" },
        { text: "Nro Operación", value: "nroop" },
        { text: "Monto", value: "monto" },
      ],
      items: [],
      headersStep2: [
        { text: "Fecha/ PIC", value: "fecha_operacion_sistema" },
        { text: "Fecha/ Banco", value: "fecha_operacion_banco" },
        { text: "Proveedor", value: "name_proveedor" },
        { text: "Ingreso/ PIC", value: "monto_sistema" },
        { text: "Ingreso/ Banco", value: "monto_banco" },
        { text: "Nro Operación ", value: "nro_operacion" },
      ],
      consolidacion: [],
    };
  },
  methods: {
    ...mapActions(["generarConsolidacion"]),
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
