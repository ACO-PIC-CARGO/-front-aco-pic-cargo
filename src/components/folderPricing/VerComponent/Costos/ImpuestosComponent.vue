<template>
  <v-container>
    <v-expansion-panels multiple class="condensed my-1">
      <v-expansion-panel>
        <v-expansion-panel-title color="#90CAF9">
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
            disable-sort
            :row-props="({ item }) => ({ class: claseFila(item) })"
          >
            <template v-slot:[`item.descripcion`]="{ item }">
              {{ item.descripcion }}
              <p
                class="my-0 py-0"
                v-if="item.codigo == '04'"
                style="color: blue; font-style: italic; font-size: 0.8em"
              >
                Monto para Cálculo de Impuestos
              </p>
            </template>
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
import { mapStores } from "pinia";
import { usePricingStore } from "@/stores/pricing";
export default {
  mixins: [mixins],
  props: ["amount", "impuestos", "index", "listCostos"],
  data() {
    return {
      headers: [
        { title: "#", key: "index" },
        // { text: "Código", value: "codigo" },
        { title: "Descripción", key: "descripcion" },
        { title: "Porcentaje", key: "porcentaje" },
        { title: "Monto", key: "monto" },
      ],
      noPorcentaje: ["04", "01", "02", "10", "11", "12"],
      siCalcula: ["05", "06", "07", "08", "09", "10", "11", "12"],
    };
  },
  computed: {
    ...mapStores(usePricingStore),
  },
  methods: {
    calcularImpuestos({ item = null } = {}) {
      if (!item) return "0.00";
      const pricing = this.pricingStore;
      return mixins.methods.calcularImpuestos.call(this, {
        impuestos: this.impuestos || [],
        item,
        totalFlete: mixins.methods.calcularTotalFleteVentaPorOpcion.call(this, {
          listCostos: this.listCostos,
        }),
        datosPrincipales: {
          ...pricing.datosPrincipales,
          amount:
            this.amount !== undefined && this.amount !== null
              ? this.amount
              : pricing.datosPrincipales.amount,
        },
      });
    },
    calcularTotalImpuesto() {
      let total = 0;
      
      (this.impuestos || [])
        .filter(Boolean)
        .filter((v) => this.siCalcula.includes(String(v.codigo)))
        .forEach((element) => {
          total += parseFloat(this.calcularImpuestos({ item: element }));
        });
      return this.currencyFormat(total);
    },
    obtenerPorcentaje({ code = "" }) {
      return mixins.methods.obtenerPorcentaje.call(this, {
        listImpuestos: this.impuestos || [],
        code,
      });
    },
    disabledImp({ code = "" }) {
      return false;
    },
    claseFila(item) {
      // Arreglo con los códigos que queremos pintar
      const codigosResaltados = ["01", "02", "03", "04", "05"];

      if (!this.siCalcula.includes(item.codigo)) {
        return "fila-color-especial"; // Nombre de la clase CSS que aplicaremos
      }
      return ""; // Las demás filas se quedan normales
    },
  },
  amount() {
    this.calcularImpuestos();
  },
};
</script>

<style>
.fila-color-especial {
  background-color: #fff9c4 !important; /* Puedes cambiar este color */
}
</style>
