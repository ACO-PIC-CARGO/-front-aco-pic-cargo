<template>
  <v-container>
    <v-expansion-panels multiple class="condensed my-1">
      <v-expansion-panel>
        <v-expansion-panel-title color="#90CAF9" dark>
          <p>
            Impuestos Opción - {{ index }} :
            <b>{{ calcularTotalImpuesto() }}</b>
          </p>
        </v-expansion-panel-title>
        <v-expansion-panel-text>
          <v-data-table
            :headers="headers"
            :items="impuestos"
            item-value="id"
            density="compact"
          >
            <template v-slot:[`item.index`]="{ item, index }">
              {{ index + 1 }}
            </template>
            <template v-slot:[`item.porcentaje`]="{ item }">
              <v-text-field
                v-model="item.codigo01"
                density="compact"
                v-if="!noPorcentaje.includes(item.codigo)"
                type="number"
                step="0.01"
                prefix="%"
                disabled
              ></v-text-field>
            </template>
            <template v-slot:[`item.monto`]="{ item }">
              {{ calcularImpuestos({ item: item }) }}
            </template>
          </v-data-table>
        </v-expansion-panel-text>
      </v-expansion-panel>
    </v-expansion-panels>
  </v-container>
</template>

<script>
import mixins from "../../../mixins/funciones.js";
export default {
  mixins: [mixins],
  props: ["amount", "impuestos", "index"],
  data() {
    return {
      headers: [
        { title: "#", key: "index" },
        { title: "Código", key: "codigo" },
        { title: "Descripción", key: "descripcion" },
        { title: "Porcentaje", key: "porcentaje" },
        { title: "Monto", key: "monto" },
      ],
      noPorcentaje: ["04", "01", "02", "10", "11", "12"],
    };
  },
  methods: {
    calcularImpuestos({ item = null }) {
      let monto = 0;
      if (item.codigo === "01") {
        monto = parseFloat(
          this.$store.state.aduana.datosPrincipales.amount
        ).toFixed(2);
      }
      if (item.codigo === "02") {
        monto = parseFloat(this.$store.state.aduana.totalFlete).toFixed(2);
      }
      if (item.codigo === "03") {
        monto = parseFloat(
          ((parseFloat(this.$store.state.aduana.totalFlete) +
            parseFloat(this.$store.state.aduana.datosPrincipales.amount)) *
            item.codigo01) /
            100
        ).toFixed(2);
      }
      if (item.codigo === "04") {
        let fob = parseFloat(this.$store.state.aduana.datosPrincipales.amount);
        let flet = parseFloat(this.$store.state.aduana.totalFlete);
        let seguro = parseFloat(
          ((parseFloat(this.$store.state.aduana.totalFlete) +
            parseFloat(this.$store.state.aduana.datosPrincipales.amount)) *
            this.obtenerPorcentaje({ code: "03" })) /
            100
        );
        monto = parseFloat(fob) + parseFloat(flet) + parseFloat(seguro);
      }
      if (item.codigo === "05") {
        let fob = parseFloat(this.$store.state.aduana.datosPrincipales.amount);
        let flet = parseFloat(this.$store.state.aduana.totalFlete);
        let seguro = parseFloat(
          ((parseFloat(this.$store.state.aduana.totalFlete) +
            parseFloat(this.$store.state.aduana.datosPrincipales.amount)) *
            this.obtenerPorcentaje({ code: "03" })) /
            100
        );
        let cif = parseFloat(fob) + parseFloat(flet) + parseFloat(seguro);
        monto = (cif * item.codigo01) / 100;
      }
      if (item.codigo === "06") {
        let fob = parseFloat(this.$store.state.aduana.datosPrincipales.amount);
        let flet = parseFloat(this.$store.state.aduana.totalFlete);

        let seguro = parseFloat(
          ((parseFloat(this.$store.state.aduana.totalFlete) +
            parseFloat(this.$store.state.aduana.datosPrincipales.amount)) *
            this.obtenerPorcentaje({ code: "03" })) /
            100
        );
        let cif = parseFloat(fob) + parseFloat(flet) + parseFloat(seguro);
        let adv = (cif * this.obtenerPorcentaje({ code: "05" })) / 100;
        monto = ((cif + adv) * item.codigo01) / 100;
      }
      if (item.codigo === "07") {
        let fob = parseFloat(this.$store.state.aduana.datosPrincipales.amount);
        let flet = parseFloat(this.$store.state.aduana.totalFlete);

        let seguro = parseFloat(
          ((parseFloat(this.$store.state.aduana.totalFlete) +
            parseFloat(this.$store.state.aduana.datosPrincipales.amount)) *
            this.obtenerPorcentaje({ code: "03" })) /
            100
        );
        let cif = parseFloat(fob) + parseFloat(flet) + parseFloat(seguro);
        let adv = (cif * this.obtenerPorcentaje({ code: "05" })) / 100;
        let isc = ((cif + adv) * this.obtenerPorcentaje({ code: "06" })) / 100;
        monto = ((cif + adv + isc) * item.codigo01) / 100;
      }
      if (item.codigo === "08") {
        let fob = parseFloat(this.$store.state.aduana.datosPrincipales.amount);
        let flet = parseFloat(this.$store.state.aduana.totalFlete);

        let seguro = parseFloat(
          ((parseFloat(this.$store.state.aduana.totalFlete) +
            parseFloat(this.$store.state.aduana.datosPrincipales.amount)) *
            this.obtenerPorcentaje({ code: "03" })) /
            100
        );
        let cif = parseFloat(fob) + parseFloat(flet) + parseFloat(seguro);
        let adv = (cif * this.obtenerPorcentaje({ code: "05" })) / 100;
        let isc = ((cif + adv) * this.obtenerPorcentaje({ code: "06" })) / 100;
        monto = ((cif + adv + isc) * item.codigo01) / 100;
      }
      if (item.codigo === "09") {
        let fob = parseFloat(this.$store.state.aduana.datosPrincipales.amount);
        let flet = parseFloat(this.$store.state.aduana.totalFlete);

        let seguro = parseFloat(
          ((parseFloat(this.$store.state.aduana.totalFlete) +
            parseFloat(this.$store.state.aduana.datosPrincipales.amount)) *
            this.obtenerPorcentaje({ code: "03" })) /
            100
        );
        let cif = parseFloat(fob) + parseFloat(flet) + parseFloat(seguro);
        let adv = (cif * this.obtenerPorcentaje({ code: "05" })) / 100;
        let isc = ((cif + adv) * this.obtenerPorcentaje({ code: "06" })) / 100;
        let ipm =
          ((cif + adv + isc) * this.obtenerPorcentaje({ code: "07" })) / 100;
        let igv =
          ((cif + adv + isc) * this.obtenerPorcentaje({ code: "08" })) / 100;

        monto = ((cif + adv + isc + igv + ipm) * item.codigo01) / 100;
      }
      if (item.codigo === "10") {
        monto = 100;
      }
      if (item.codigo === "11") {
        monto = 7;
      }
      if (item.codigo === "12") {
        monto = 3;
      }
      return parseFloat(monto).toFixed(2);
    },
    calcularTotalImpuesto() {
      let total = 0;
      let siCalcula = ["05", "06", "07", "08", "09", "10", "11", "12"];
      this.impuestos
        .filter((v) => siCalcula.includes(v.codigo))
        .forEach((element) => {
          total += parseFloat(this.calcularImpuestos({ item: element }));
        });
      return this.currencyFormat(total);
    },
    obtenerPorcentaje({ code = "" }) {
      let porcentaje =
        this.impuestos.filter((v) => v.codigo == code).length > 0
          ? this.impuestos.filter((v) => v.codigo == code)[0].codigo01
          : 0;
      return porcentaje;
    },
    disabledImp({ code = "" }) {
      return false;
    },
  },
  amount() {
    this.calcularImpuestos();
  },
};
</script>

<style></style>
