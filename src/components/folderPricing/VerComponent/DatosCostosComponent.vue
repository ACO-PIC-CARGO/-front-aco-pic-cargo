<template>
  <v-card
    v-if="costoFlag && opcionesSeleccionadas[pricingStore.page - 1]"
  >
    <h1>
      OPCIÓN COSTOS
      {{ opcionesSeleccionadas[pricingStore.page - 1].nro_propuesta }}
    </h1>
    <v-form ref="frmDatosOpcion">
      <v-row>
        <v-col cols="12" lg="3" xl="3">
          <v-text-field
            type="date"
            v-model="pricingStore.datosPrincipales.fecha_inicio"
            :error-messages="pricingStore.fecha_inicio"
            readonly
            label="Fecha de Registro de Cotización"
          ></v-text-field>
        </v-col>
        <v-col cols="12" lg="3" xl="3">
          <v-text-field
            readonly
            type="date"
            :name="`Fecha Validez de la Opción ${page}`"
            :label="`Fecha Validez de la Opción ${page}`"
            v-model="
              pricingStore.opcionCostos[pricingStore.page - 1]
                .date_end
            "
            :error-messages="pricingStore.errfecha_fin"
            :rules="[
              (v) => !!v || 'Dato Requerido',
              (v) => isDateValid(v) || 'La fecha debe ser mayor que hoy.',
            ]"
          ></v-text-field>
        </v-col>
        <v-col cols="12" lg="3" xl="3">
          <v-text-field
            readonly
            type="number"
            :name="`Tiempo en tránsito de la Opción ${page}`"
            :label="`Tiempo en tránsito de la Opción ${page}`"
            v-model="
              pricingStore.opcionCostos[pricingStore.page - 1]
                .tiempo_transito
            "
            :error-messages="pricingStore.errtiempo_transito"
            :rules="[
              (v) => !!v || 'Dato Requerido',
              (v) => v > 0 || 'El valor tiene que ser positivo.',
            ]"
          >
          </v-text-field
        ></v-col>
      </v-row>
    </v-form>
    <v-row>
      <v-col cols="12" lg="6" xl="6">
        <CostosComponent
          :valores="
            opcionesSeleccionadas[
              pricingStore.page - 1
            ].listCostos.filter((v) => v.esopcionflag == 1)
          "
          :actualizarCostosFlag="pricingStore.actualizarCostosFlag"
          :amount="pricingStore.datosPrincipales.amount"
          :index="page"
        />
      </v-col>
      <v-col cols="12" lg="6" xl="6">
        <VentasComponent
          :valores="
            opcionesSeleccionadas[
              pricingStore.page - 1
            ].listCostos.filter((v) => v.esventaflag == 1)
          "
          :actualizarCostosFlag="pricingStore.actualizarCostosFlag"
          :amount="pricingStore.datosPrincipales.amount"
        />
      </v-col>
      <v-col cols="12" md="6" v-if="getExisteImpuesto">
        <center><h3>Impuestos de Aduana</h3></center>
        <ImpuestosComponent
          v-if="mostrarImpuestos()"
          :amount="pricingStore.datosPrincipales.amount"
          :list-costos="
            opcionesSeleccionadas[pricingStore.page - 1].listCostos
          "
          :index="pricingStore.page"
          :impuestos="
            pricingStore.opcionCostos.filter((v) => v.selected)[
              pricingStore.page - 1
            ].listImpuestos
          "
        />
      </v-col>

      <v-col cols="12" class="derecha">
        
          <div class="text-center">
            <v-pagination
              v-model="pricingStore.page"
              :length="
                pricingStore.opcionCostos.filter((v) => v.selected)
                  .length
              "
              rounded
            ></v-pagination>
          </div>
        
      </v-col>
    </v-row>
  </v-card>
</template>

<script>
import { defineAsyncComponent } from "vue";
import moment from "moment";
import { mapStores } from "pinia";
import { usePricingStore } from "@/stores/pricing";
// import Swal from "sweetalert2";
export default {
  data() {
    return {
      costoFlag: true,
      page: 1,
      opcionesSeleccionadas: [],
    };
  },
  mounted() {
    this.opcionesSeleccionadas = this.pricingStore.opcionCostos.filter(
      (v) => !!v.selected,
    );
  },
  components: {
    CostosComponent: defineAsyncComponent(() => import("./Costos/CostosComponent.vue")),
    VentasComponent: defineAsyncComponent(() => import("./Costos/VentasComponent.vue")),
    ImpuestosComponent: defineAsyncComponent(() => import("./Costos/ImpuestosComponent.vue")),
  },
  methods: {
    mostrarImpuestos() {
      let imp = this.pricingStore.listServices.some(
        (v) => v.codegroupservices == 15 && v.status == true,
      );

      return imp;
    },
    async agregarNuevaOpcion() {
      if ((await this.$refs.frmDatosOpcion.validate()).valid) {
        let nro_propuesta = this.pricingStore.index + 1;
        let costos = this.pricingStore.listCostos.map((objeto) => ({
          ...objeto,
          nro_propuesta,
        }));
        let listImpuestos = this.pricingStore.listImpuestos.map(
          (objeto) => ({
            ...objeto,
            nro_propuesta,
          }),
        );
        let listNotasQuote = this.pricingStore.listNotasQuote.map(
          (objeto) => ({
            ...objeto,
            nro_propuesta,
          }),
        );
        this.pricingStore.opcionCostos.push({
          id: null,
          nro_propuesta: this.pricingStore.index + 1,
          date_end: moment().add(7, "days").format("YYYY-MM-DD"),
          tiempo_transito: 35,
          listCostos: costos,
          listImpuestos: listImpuestos,
          listNotasQuote: listNotasQuote,
          selected: true,
        });
        this.pricingStore.index =
          parseInt(this.pricingStore.index) + 1;
        this.mostrarCostos = false;
        this.btnIngresarCostos = true;
        this.pricingStore.actualizarNotas =
          !this.pricingStore.actualizarNotas;
        this.pricingStore.actualizarComparativa =
          !this.pricingStore.actualizarComparativa;
        this.page = this.page + 1;
      }
    },
    isDateValid(date) {
      if (!date) {
        return true; // Pasa la validación si el campo está vacío
      }

      const selectedDate = moment(date, "YYYY-MM-DD", true);
      const today = moment();

      return selectedDate.isAfter(today);
    },
    // getExisteImpuesto() {
    //   return this.$store.state.pricing.listServices.some(
    //     (v) => v.codegroupservices == "15" || v.codegroupservices == 15
    //   );
    // },
  },
  computed: {
    ...mapStores(usePricingStore),
    actualizarCostos() {
      return this.pricingStore.costoflag;
    },
    getExisteImpuesto() {
      return this.pricingStore.listServices.some(
        (v) => v.codegroupservices == "15" || v.codegroupservices == 15,
      );
    },
  },
  watch: {
    actualizarCostos() {
      this.costoFlag = false;
      this.costoFlag = true;
    },
  },
};
</script>
<style scoped>
.derecha {
  text-align: right !important;
  align-content: right !important;
}
.v-btn.v-btn--size-x-large {
  font-size: 1.5rem !important;
}
</style>
