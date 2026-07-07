<template>
  <v-container v-if="mostrar">
    <v-expansion-panels class="condensed my-1" v-model="abierto">
      <v-expansion-panel>
        <v-expansion-panel-header color="#90CAF9" dark>
          <p>
            Impuestos Opción - {{ impuestos[0].nro_propuesta }} :
            <b>{{ calcularTotalImpuesto() }}</b>
          </p>
        </v-expansion-panel-header>
        <v-expansion-panel-content>
          <v-data-table
            :headers="headers"
            :items="impuestos"
            item-key="id"
            dense
            disable-sort
          >
            <template v-slot:[`item.index`]="{ item, index }">
              {{ index + 1 }}
            </template>
            <template v-slot:[`item.porcentaje`]="{ item }">
              <v-text-field
                v-model="item.codigo01"
                dense
                v-if="!noPorcentaje.includes(item.codigo)"
                type="number"
                step="0.01"
                prefix="%"
                :disabled="disabledImp({ code: item.codigo })"
              ></v-text-field>
            </template>
            <template v-slot:[`item.monto`]="{ item }">
              {{ calcularImpuestos({ item: item }) }}
            </template>
          </v-data-table>
        </v-expansion-panel-content>
      </v-expansion-panel>
    </v-expansion-panels>
  </v-container>
</template>

<script>
import mixins from "@/components/mixins/funciones";
export default {
  props: ["amount", "impuestos", "index"],
  mixins: [mixins],
  data() {
    return {
      mostrar: true,
      headers: [
        { text: "#", value: "index" },
        { text: "Código", value: "codigo" },
        { text: "Descripción", value: "descripcion" },
        { text: "Porcentaje", value: "porcentaje" },
        { text: "Monto", value: "monto" },
      ],
      noPorcentaje: ["04", "01", "02", "10", "11", "12"],
      abierto: 0,
    };
  },
  methods: {
    calcularImpuestos({ item = null }) {
      let monto = 0;
      if (item.codigo === "01") {
        monto = parseFloat(
          this.$store.state.pricing.datosPrincipales.amount
        ).toFixed(2);
      }
      if (item.codigo === "02") {
        monto = parseFloat(this.$store.state.pricing.totalFlete).toFixed(2);
      }
      if (item.codigo === "03") {
        monto = parseFloat(
          ((parseFloat(this.$store.state.pricing.totalFlete) +
            parseFloat(this.$store.state.pricing.datosPrincipales.amount)) *
            item.codigo01) /
            100
        ).toFixed(2);
      }
      if (item.codigo === "04") {
        let fob = parseFloat(this.$store.state.pricing.datosPrincipales.amount);
        let flet = parseFloat(this.$store.state.pricing.totalFlete);
        let seguro = parseFloat(
          ((parseFloat(this.$store.state.pricing.totalFlete) +
            parseFloat(this.$store.state.pricing.datosPrincipales.amount)) *
            this.obtenerPorcentaje({ code: "03" })) /
            100
        );
        monto = parseFloat(fob) + parseFloat(flet) + parseFloat(seguro);
      }
      if (item.codigo === "05") {
        let fob = parseFloat(this.$store.state.pricing.datosPrincipales.amount);
        let flet = parseFloat(this.$store.state.pricing.totalFlete);
        let seguro = parseFloat(
          ((parseFloat(this.$store.state.pricing.totalFlete) +
            parseFloat(this.$store.state.pricing.datosPrincipales.amount)) *
            this.obtenerPorcentaje({ code: "03" })) /
            100
        );
        let cif = parseFloat(fob) + parseFloat(flet) + parseFloat(seguro);
        monto = (cif * item.codigo01) / 100;
      }
      if (item.codigo === "06") {
        let fob = parseFloat(this.$store.state.pricing.datosPrincipales.amount);
        let flet = parseFloat(this.$store.state.pricing.totalFlete);

        let seguro = parseFloat(
          ((parseFloat(this.$store.state.pricing.totalFlete) +
            parseFloat(this.$store.state.pricing.datosPrincipales.amount)) *
            this.obtenerPorcentaje({ code: "03" })) /
            100
        );
        let cif = parseFloat(fob) + parseFloat(flet) + parseFloat(seguro);
        let adv = (cif * this.obtenerPorcentaje({ code: "05" })) / 100;
        monto = ((cif + adv) * item.codigo01) / 100;
      }
      if (item.codigo === "07") {
        let fob = parseFloat(this.$store.state.pricing.datosPrincipales.amount);
        let flet = parseFloat(this.$store.state.pricing.totalFlete);

        let seguro = parseFloat(
          ((parseFloat(this.$store.state.pricing.totalFlete) +
            parseFloat(this.$store.state.pricing.datosPrincipales.amount)) *
            this.obtenerPorcentaje({ code: "03" })) /
            100
        );
        let cif = parseFloat(fob) + parseFloat(flet) + parseFloat(seguro);
        let adv = (cif * this.obtenerPorcentaje({ code: "05" })) / 100;
        let isc = ((cif + adv) * this.obtenerPorcentaje({ code: "06" })) / 100;
        monto = ((cif + adv + isc) * item.codigo01) / 100;
      }
      if (item.codigo === "08") {
        let fob = parseFloat(this.$store.state.pricing.datosPrincipales.amount);
        let flet = parseFloat(this.$store.state.pricing.totalFlete);

        let seguro = parseFloat(
          ((parseFloat(this.$store.state.pricing.totalFlete) +
            parseFloat(this.$store.state.pricing.datosPrincipales.amount)) *
            this.obtenerPorcentaje({ code: "03" })) /
            100
        );
        let cif = parseFloat(fob) + parseFloat(flet) + parseFloat(seguro);
        let adv = (cif * this.obtenerPorcentaje({ code: "05" })) / 100;
        let isc = ((cif + adv) * this.obtenerPorcentaje({ code: "06" })) / 100;
        monto = ((cif + adv + isc) * item.codigo01) / 100;
      }
      if (item.codigo === "09") {
        let fob = parseFloat(this.$store.state.pricing.datosPrincipales.amount);
        let flet = parseFloat(this.$store.state.pricing.totalFlete);

        let seguro = parseFloat(
          ((parseFloat(this.$store.state.pricing.totalFlete) +
            parseFloat(this.$store.state.pricing.datosPrincipales.amount)) *
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
  computed: {
    actualizarCostosFlag() {
      return this.$store.state.pricing.actualizarCostosFlag;
    },
  },
  watch: {
    impuestos() {
      this.calcularImpuestos();
      this.abierto = 0;
    },
    actualizarCostosFlag() {
      setTimeout(() => {
        this.mostrar = !this.mostrar;
        this.mostrar = !this.mostrar;
        this.abierto = 0;
      }, 120);
    },
    amount() {
      this.calcularImpuestos();
      this.abierto = 0;
    },
  },
};
</script>

<style></style>
