<script setup lang="ts">
import { computed, defineAsyncComponent, onMounted, ref, useTemplateRef, watch } from "vue";
import moment from "moment";
import { useAduanaStore } from "@/stores/aduana";
import type { OpcionCosto } from "@/types/cotizacion";
// import Swal from "sweetalert2";

const CostosComponent = defineAsyncComponent(() => import("./Costos/CostosComponent.vue"));
const VentasComponent = defineAsyncComponent(() => import("./Costos/VentasComponent.vue"));
const ImpuestosComponent = defineAsyncComponent(() => import("./Costos/ImpuestosComponent.vue"));

const aduanaStore = useAduanaStore();

const costoFlag = ref(true);
const page = ref(1);
const opcionesSeleccionadas = ref<OpcionCosto[]>([]);
const frmDatosOpcion = useTemplateRef("frmDatosOpcion");
// eslint-disable-next-line @typescript-eslint/no-unused-vars
let mostrarCostos: boolean | undefined;
// eslint-disable-next-line @typescript-eslint/no-unused-vars
let btnIngresarCostos: boolean | undefined;


const actualizarCostos = computed(() => {
  return aduanaStore.costoflag;
});
const getExisteImpuesto = computed(() => {
  return aduanaStore.listServices.some(
    (v) => v.codegroupservices == "15" || v.codegroupservices == 15
  );
});

function mostrarImpuestos() {
  const imp = aduanaStore.listServices.some(
    (v) => v.codegroupservices == 15 && v.status == true
  );

  return imp;
}
// eslint-disable-next-line @typescript-eslint/no-unused-vars
async function agregarNuevaOpcion() {
  if ((await frmDatosOpcion.value!.validate()).valid) {
    const nro_propuesta = aduanaStore.index + 1;
    const costos = aduanaStore.listCostos.map((objeto) => ({
      ...objeto,
      nro_propuesta,
    }));
    const listImpuestos = aduanaStore.listImpuestos.map(
      (objeto) => ({
        ...objeto,
        nro_propuesta,
      })
    );
    const listNotasQuote = aduanaStore.listNotasQuote.map(
      (objeto) => ({
        ...objeto,
        nro_propuesta,
      })
    );
    aduanaStore.opcionCostos.push({
      id: null as unknown as number,
      nro_propuesta: aduanaStore.index + 1,
      date_end: "",
      tiempo_transito: 0,
      listCostos: costos,
      listImpuestos: listImpuestos,
      listNotasQuote: listNotasQuote,
      selected: true,
    });
    aduanaStore.index =
      parseInt(String(aduanaStore.index)) + 1;
    mostrarCostos = false;
    btnIngresarCostos = true;
    aduanaStore.actualizarNotas =
      !aduanaStore.actualizarNotas;
    aduanaStore.actualizarComparativa =
      !aduanaStore.actualizarComparativa;
    page.value = page.value + 1;
  }
}
function isDateValid(date: string) {
  if (!date) {
    return true; // Pasa la validación si el campo está vacío
  }

  const selectedDate = moment(date, "YYYY-MM-DD", true);
  const today = moment();

  return selectedDate.isAfter(today);
}
// getExisteImpuesto() {
//   return this.$store.state.aduana.listServices.some(
//     (v) => v.codegroupservices == "15" || v.codegroupservices == 15
//   );
// },

watch(actualizarCostos, () => {
  costoFlag.value = false;
  costoFlag.value = true;
});

onMounted(() => {
  opcionesSeleccionadas.value = aduanaStore.opcionCostos.filter(
    (v) => !!v.selected
  );
});
</script>

<template>
  <v-card v-if="costoFlag">
    <h1>
      OPCIÓN COSTOS
      {{ opcionesSeleccionadas[aduanaStore.page - 1]!.nro_propuesta }}
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
          />
        </v-col>
        <v-col cols="3">
          <v-text-field
            readonly
            type="date"
            :name="`Fecha Validez de la Opción ${page}`"
            :label="`Fecha Validez de la Opción ${page}`"
            v-model="
              aduanaStore.opcionCostos[aduanaStore.page - 1]!
                .date_end
            "
            :error-messages="aduanaStore.errfecha_fin"
            :rules="[
              (v) => !!v || 'Dato Requerido',
              (v) => isDateValid(v) || 'La fecha debe ser mayor que hoy.',
            ]"
          />
        </v-col>
        <v-col cols="3">
          <v-text-field
            readonly
            type="number"
            :name="`Tiempo en tránsito de la Opción ${page}`"
            :label="`Tiempo en tránsito de la Opción ${page}`"
            v-model="
              aduanaStore.opcionCostos[aduanaStore.page - 1]!
                .tiempo_transito
            "
            :error-messages="aduanaStore.errtiempo_transito"
            :rules="[
              (v) => !!v || 'Dato Requerido',
              (v) => v > 0 || 'El valor tiene que ser positivo.',
            ]"
          />
        </v-col>
      </v-row>
    </v-form>
    <v-row>
      <v-col
        cols="12"
        lg="6"
        xl="6"
      >
        <CostosComponent
          :valores="
            opcionesSeleccionadas[
              aduanaStore.page - 1
            ]!.listCostos.filter((v) => v.esopcionflag == 1)
          "
          :actualizar-costos-flag="aduanaStore.actualizarCostosFlag"
          :amount="aduanaStore.datosPrincipales.amount"
          :index="page"
        />
      </v-col>
      <v-col
        cols="12"
        lg="6"
        xl="6"
      >
        <VentasComponent
          :valores="
            opcionesSeleccionadas[
              aduanaStore.page - 1
            ]!.listCostos.filter((v) => v.esventaflag == 1)
          "
          :amount="aduanaStore.datosPrincipales.amount"
        />
      </v-col>
      <v-col
        cols="6"
        v-if="getExisteImpuesto"
      >
        <center><h3>Impuestos de Aduana</h3></center>
        <ImpuestosComponent
          v-if="mostrarImpuestos()"
          :amount="aduanaStore.datosPrincipales.amount"
          :index="aduanaStore.page"
          :impuestos="
            aduanaStore.opcionCostos.filter((v) => v.selected)[
              aduanaStore.page - 1
            ]!.listImpuestos
          "
        />
      </v-col>

      <v-col
        cols="12"
        class="derecha"
      >
        <div class="text-center">
          <v-pagination
            v-model="aduanaStore.page"
            :length="
              aduanaStore.opcionCostos.filter((v) => v.selected)
                .length
            "
            rounded
          />
        </div>
      </v-col>
    </v-row>
  </v-card>
</template>

<style scoped>
.derecha {
  text-align: right !important;
  align-content: right !important;
}
.v-btn.v-btn--size-x-large {
  font-size: 1.5rem !important;
}
</style>
