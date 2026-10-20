<template>
  <v-card v-if="costoFlag">
    <h1>
      OPCIÓN COSTOS
      {{ opcionesSeleccionadas[aduanaStore.page - 1].nro_propuesta }}
    </h1>
    <v-form ref="frmDatosOpcion">
      <v-row>
        <v-col cols="3">
          <v-text-field
            type="date"
            v-model="aduanaStore.datosPrincipales.fecha_inicio"
            :error-messages="aduanaStore.fecha_inicio"
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
              aduanaStore.opcionCostos[aduanaStore.page - 1]
                .date_end
            "
            :error-messages="aduanaStore.errfecha_fin"
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
              aduanaStore.opcionCostos[aduanaStore.page - 1]
                .tiempo_transito
            "
            :error-messages="aduanaStore.errtiempo_transito"
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
              aduanaStore.page - 1
            ].listCostos.filter((v) => v.esopcionflag == 1)
          "
          :actualizarCostosFlag="aduanaStore.actualizarCostosFlag"
          :amount="aduanaStore.datosPrincipales.amount"
          :index="page"
        />
      </v-col>
      <v-col cols="12" lg="6" xl="6">
        <VentasComponent
          :valores="
            opcionesSeleccionadas[
              aduanaStore.page - 1
            ].listCostos.filter((v) => v.esventaflag == 1)
          "
          :amount="aduanaStore.datosPrincipales.amount"
        />
      </v-col>
      <v-col cols="6" v-if="getExisteImpuesto">
        <center><h3>Impuestos de Aduana</h3></center>
        <ImpuestosComponent
          v-if="mostrarImpuestos()"
          :amount="aduanaStore.datosPrincipales.amount"
          :index="aduanaStore.page"
          :impuestos="
            aduanaStore.opcionCostos.filter((v) => v.selected)[
              aduanaStore.page - 1
            ].listImpuestos
          "
        />
      </v-col>

      <v-col cols="12" class="derecha">
        <div class="text-center">
          <v-pagination
            v-model="aduanaStore.page"
            :length="
              aduanaStore.opcionCostos.filter((v) => v.selected)
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
import { useAduanaStore } from "@/stores/aduana";
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
    this.opcionesSeleccionadas = this.aduanaStore.opcionCostos.filter(
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
      let imp = this.aduanaStore.listServices.some(
        (v) => v.codegroupservices == 15 && v.status == true
      );

      return imp;
    },
    async agregarNuevaOpcion() {
      if ((await this.$refs.frmDatosOpcion.validate()).valid) {
        let nro_propuesta = this.aduanaStore.index + 1;
        let costos = this.aduanaStore.listCostos.map((objeto) => ({
          ...objeto,
          nro_propuesta,
        }));
        let listImpuestos = this.aduanaStore.listImpuestos.map(
          (objeto) => ({
            ...objeto,
            nro_propuesta,
          })
        );
        let listNotasQuote = this.aduanaStore.listNotasQuote.map(
          (objeto) => ({
            ...objeto,
            nro_propuesta,
          })
        );
        this.aduanaStore.opcionCostos.push({
          id: null,
          nro_propuesta: this.aduanaStore.index + 1,
          date_end: "",
          tiempo_transito: 0,
          listCostos: costos,
          listImpuestos: listImpuestos,
          listNotasQuote: listNotasQuote,
          selected: true,
        });
        this.aduanaStore.index =
          parseInt(this.aduanaStore.index) + 1;
        this.mostrarCostos = false;
        this.btnIngresarCostos = true;
        this.aduanaStore.actualizarNotas =
          !this.aduanaStore.actualizarNotas;
        this.aduanaStore.actualizarComparativa =
          !this.aduanaStore.actualizarComparativa;
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
    ...mapStores(useAduanaStore),
    actualizarCostos() {
      return this.aduanaStore.costoflag;
    },
    getExisteImpuesto() {
      return this.aduanaStore.listServices.some(
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
