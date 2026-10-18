<template>
  <v-card v-if="costoFlag">
    <h1>
      OPCIÓN COSTOS
      {{ opcionesSeleccionadas[$store.state.aduana.page - 1].nro_propuesta }}
    </h1>
    <v-form ref="frmDatosOpcion">
      <v-row>
        <v-col cols="3">
          <v-text-field
            type="date"
            v-model="$store.state.aduana.datosPrincipales.fecha_inicio"
            :error-messages="$store.state.aduana.fecha_inicio"
            readonly
            label="Fecha de Registro de Cotización"
          ></v-text-field>
        </v-col>
        <v-col cols="3">
          <v-text-field
            readonly
            type="date"
            :name="`Fecha Validez de la Opción ${page}`"
            :label="`Fecha Validez de la Opción ${page}`"
            v-model="
              $store.state.aduana.opcionCostos[$store.state.aduana.page - 1]
                .date_end
            "
            :error-messages="$store.state.aduana.errfecha_fin"
            :rules="[
              (v) => !!v || 'Dato Requerido',
              (v) => isDateValid(v) || 'La fecha debe ser mayor que hoy.',
            ]"
          ></v-text-field>
        </v-col>
        <v-col cols="3">
          <v-text-field
            readonly
            type="number"
            :name="`Tiempo en tránsito de la Opción ${page}`"
            :label="`Tiempo en tránsito de la Opción ${page}`"
            v-model="
              $store.state.aduana.opcionCostos[$store.state.aduana.page - 1]
                .tiempo_transito
            "
            :error-messages="$store.state.aduana.errtiempo_transito"
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
              $store.state.aduana.page - 1
            ].listCostos.filter((v) => v.esopcionflag == 1)
          "
          :actualizarCostosFlag="$store.state.aduana.actualizarCostosFlag"
          :amount="$store.state.aduana.datosPrincipales.amount"
          :index="page"
        />
      </v-col>
      <v-col cols="12" lg="6" xl="6">
        <VentasComponent
          :valores="
            opcionesSeleccionadas[
              $store.state.aduana.page - 1
            ].listCostos.filter((v) => v.esventaflag == 1)
          "
          :amount="$store.state.aduana.datosPrincipales.amount"
        />
      </v-col>
      <v-col cols="6" v-if="getExisteImpuesto">
        <center><h3>Impuestos de Aduana</h3></center>
        <ImpuestosComponent
          v-if="mostrarImpuestos()"
          :amount="$store.state.aduana.datosPrincipales.amount"
          :index="$store.state.aduana.page"
          :impuestos="
            $store.state.aduana.opcionCostos.filter((v) => v.selected)[
              $store.state.aduana.page - 1
            ].listImpuestos
          "
        />
      </v-col>

      <v-col cols="12" class="derecha">
        <div class="text-center">
          <v-pagination
            v-model="$store.state.aduana.page"
            :length="
              $store.state.aduana.opcionCostos.filter((v) => v.selected)
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
    this.opcionesSeleccionadas = this.$store.state.aduana.opcionCostos.filter(
      (v) => !!v.selected
    );
  },
  components: {
    CostosComponent: defineAsyncComponent(() => import("./Costos/CostosComponent.vue")),
    VentasComponent: defineAsyncComponent(() => import("./Costos/VentasComponent.vue")),
    ImpuestosComponent: defineAsyncComponent(() => import("./Costos/ImpuestosComponent.vue")),
  },
  methods: {
    mostrarImpuestos() {
      let imp = this.$store.state.aduana.listServices.some(
        (v) => v.codegroupservices == 15 && v.status == true
      );

      return imp;
    },
    async agregarNuevaOpcion() {
      if ((await this.$refs.frmDatosOpcion.validate()).valid) {
        let nro_propuesta = this.$store.state.aduana.index + 1;
        let costos = this.$store.state.aduana.listCostos.map((objeto) => ({
          ...objeto,
          nro_propuesta,
        }));
        let listImpuestos = this.$store.state.aduana.listImpuestos.map(
          (objeto) => ({
            ...objeto,
            nro_propuesta,
          })
        );
        let listNotasQuote = this.$store.state.aduana.listNotasQuote.map(
          (objeto) => ({
            ...objeto,
            nro_propuesta,
          })
        );
        this.$store.state.aduana.opcionCostos.push({
          id: null,
          nro_propuesta: this.$store.state.aduana.index + 1,
          date_end: "",
          tiempo_transito: 0,
          listCostos: costos,
          listImpuestos: listImpuestos,
          listNotasQuote: listNotasQuote,
          selected: true,
        });
        this.$store.state.aduana.index =
          parseInt(this.$store.state.aduana.index) + 1;
        this.mostrarCostos = false;
        this.btnIngresarCostos = true;
        this.$store.state.aduana.actualizarNotas =
          !this.$store.state.aduana.actualizarNotas;
        this.$store.state.aduana.actualizarComparativa =
          !this.$store.state.aduana.actualizarComparativa;
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
    //   return this.$store.state.aduana.listServices.some(
    //     (v) => v.codegroupservices == "15" || v.codegroupservices == 15
    //   );
    // },
  },
  computed: {
    actualizarCostos() {
      return this.$store.state.aduana.costoflag;
    },
    getExisteImpuesto() {
      return this.$store.state.aduana.listServices.some(
        (v) => v.codegroupservices == "15" || v.codegroupservices == 15
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
