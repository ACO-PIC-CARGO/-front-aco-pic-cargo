<script setup lang="ts">
import { computed, defineAsyncComponent, nextTick, ref, useTemplateRef, watch } from "vue";
import moment from "moment";
import Swal from "sweetalert2";
import { usePricingStore } from "@/stores/pricing";
import type { Costo } from "@/types/cotizacion";

withDefaults(
  defineProps<{
    mostrarBtn?: boolean;
    mostrarImpuestosEditar?: boolean;
    indexCostos?: number;
  }>(),
  { mostrarBtn: true, mostrarImpuestosEditar: false, indexCostos: undefined },
);
const emit = defineEmits<{
  continuarComparativa: [];
  anadirNuevaOpcion: [nroPropuesta: number];
  irANotas: [];
}>();

const CostosComponent = defineAsyncComponent(() => import("./Costos/CostosComponent.vue"));
const VentasComponent = defineAsyncComponent(() => import("./Costos/VentasComponent.vue"));
const ImpuestosComponent = defineAsyncComponent(() => import("./Costos/ImpuestosComponent.vue"));

const pricingStore = usePricingStore();

const mostrarCostos = ref(false);
const mostrarVentasFlag = ref(false);
const btnIngresarCostos = ref(true);

const mostrarContinuarVentas = ref(true);
// mostrarSeccionImpuestos: false,
const mostrarBtnContinuarNotas = ref(false);
// eslint-disable-next-line @typescript-eslint/no-unused-vars
let mostrarSeccionImpuestos: boolean | undefined;
const frmDatosOpcion = useTemplateRef("frmDatosOpcion");
const frmFecha = ref<{ validate: () => Promise<{ valid: boolean }> }>();

const opcionesSeleccionadas = computed(() =>
  pricingStore.opcionCostos.filter((v) => !!v.selected),
);
const opcionSeleccionadaActual = computed(() => {
  const page = pricingStore.page - 1;
  return (
    opcionesSeleccionadas.value[page] ||
    opcionesSeleccionadas.value[0] ||
    null
  );
});
const llenadoCostos = computed(() => pricingStore.llenadoCostos);
const recargarCostoSeleccionados = computed(
  () => pricingStore.recargarCostoSeleccionados,
);
const reset = computed(() => pricingStore.reset);
const mostrarImpuestos = computed(() => {
  const imp = pricingStore.listServices.some(
    (v) =>
      (v.code_service == 15 || v.code_service == "15") && v.status == true,
  );

  return imp;
});
const mostrarBotonIrANotas = computed(() => {
  return (
    opcionesSeleccionadas.value.length == pricingStore.page &&
    opcionesSeleccionadas.value.length > 0 &&
    mostrarBtnContinuarNotas.value
  );
});

function irAComparativa() {
  pricingStore.actualizarComparativa = !pricingStore.actualizarComparativa;
  emit("continuarComparativa");
}
async function pasarLlenadoCostos() {
  if ((await frmDatosOpcion.value!.validate()).valid) {
    btnIngresarCostos.value = false;
    mostrarCostos.value = true;
  }
}
function cambiarPagina(pagina: number | string) {
  pricingStore.page = Number(pagina);
}
function cancelarLlenadoCostos() {
  pricingStore.opcionCostos.splice(-1, 1);
  pricingStore.index = pricingStore.index - 1;
  btnIngresarCostos.value = false;
  mostrarCostos.value = true;
  setTimeout(() => {
    pricingStore.cancelarLlenadoNuevaOpcion =
      !pricingStore.cancelarLlenadoNuevaOpcion;
  }, 100);
}
function agregarNuevoCostoIrAVentas() {
  if (pricingStore.index == 0) {
    Swal.fire({
      icon: "question",
      width: 1000,
      html: "<h1>¿Desea agregar una nueva opción para los costos o ir la venta al Cliente Final?</h1>",
      allowEnterKey: false,
      allowOutsideClick: false,
      confirmButtonColor: "green",
      denyButtonColor: "#3363A2",
      confirmButtonText: `<h1>Agregar Costos - Opcion ${
        pricingStore.index + 2
      }</h1> `,
      denyButtonText: "<h1>Ir a la venta del cliente final</h1>",
      showDenyButton: true,
      showCancelButton: false,
      showCloseButton: true,
    }).then((action) => {
      if (action.isConfirmed) {
        const nro_propuesta = pricingStore.index + 2;
        emit("anadirNuevaOpcion", nro_propuesta);
        pricingStore.index = parseInt(String(pricingStore.index)) + 1;
        mostrarCostos.value = false;
        btnIngresarCostos.value = true;
        frmDatosOpcion.value!.resetValidation();
      }
      if (action.isDenied) {
        pricingStore.opcionCostos[0]!.selected = 1 as unknown as boolean;
        pricingStore.llenadoCostos = false;
        pricingStore.btnRegistrar = true;
        pricingStore.bloquearBtnImprimir = false;
      }
    });
  }
  if (pricingStore.index > 0) {
    Swal.fire({
      icon: "question",
      width: 1000,
      html: "<h1>¿Desea agregar una nueva opción para los costos o ir la venta al Cliente Final?</h1>",
      allowEnterKey: false,
      allowOutsideClick: false,
      confirmButtonColor: "green",
      denyButtonColor: "#3363A2",
      confirmButtonText: `<h1>Agregar Costos - Opcion ${
        pricingStore.index + 2
      } </h1>`,
      denyButtonText: "<h1>Ir a la comparativa</h1>",
      showDenyButton: true,
      showCancelButton: false,
      showCloseButton: true,
    }).then((action) => {
      if (action.isConfirmed) {
        const nro_propuesta = Number(pricingStore.index) + 2;
        emit("anadirNuevaOpcion", nro_propuesta);
        pricingStore.index = parseInt(String(pricingStore.index)) + 1;
        mostrarCostos.value = false;
        btnIngresarCostos.value = true;
        frmDatosOpcion.value!.resetValidation();
      }
      if (action.isDenied) {
        pricingStore.actualizarComparativa =
          !pricingStore.actualizarComparativa;
        emit("continuarComparativa");
      }
    });
  }
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
async function activarCosto() {
  if ((await frmFecha.value!.validate()).valid) {
    pricingStore.costoflag = true;
    const cost = pricingStore.listCostos.filter((v) => v.esopcionflag == 1);
    cost.forEach((element) => {
      const res = validateCost({ costo: element });
      if (res) {
        element.error = "El costo que tiene un valor 0.00.";
      } else {
        element.error = "";
      }
    });
  }
}
function activarImpuesto() {
  mostrarContinuarVentas.value = false;
  pricingStore.btnRegistrar = true;
  pricingStore.bloquearBtnImprimir = false;
  if (
    pricingStore.listServices.some(
      (v) => v.code_service == "15" || v.code_service == 15,
    )
  ) {
    mostrarSeccionImpuestos = true;

    nextTick(() => {
      const element = document.getElementById("cmpImpuesto");
      if (element) {
        element.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    });
  }
  mostrarBtnContinuarNotas.value = true;
}
function irANotas() {
  pricingStore.actualizarNotas = !pricingStore.actualizarNotas;
  pricingStore.bloquearBtnImprimir = false;
  pricingStore.page = 1;
  emit("irANotas");
}
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function activarVenta() {
  pricingStore.ventaflag = true;
  scrollToComponent("ventas-component");
}
function isDateValid(date: string) {
  if (!date) {
    return true; // Pasa la validación si el campo está vacío
  }

  const selectedDate = moment(date, "YYYY-MM-DD", true);
  const today = moment();

  return selectedDate.isAfter(today);
}
function validateCost({ costo }: { costo: Costo }) {
  const service = pricingStore.listServices.filter((v) => v.status == 1);
  const multiplocadores = pricingStore.listMultiplicador.filter((v) => {
    return comienzaNoConCaracter(v.text as string, "%");
  });
  const idMultiplicador = multiplocadores.map((v) => v.id);
  const idServices = service.map((v) => v.id_groupservices);
  if (
    !!idMultiplicador.includes(costo.id_multiplicador) &&
    !!idServices.includes(costo.id_groupservices) &&
    !!(costo.costounitario == 0)
  ) {
    return true;
  } else {
    return false;
  }
}
function comienzaNoConCaracter(nombre: string, caracter: string) {
  return nombre.charAt(0).toUpperCase() !== caracter.toUpperCase();
}
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function comienzaConCaracter(nombre: string, caracter: string) {
  return nombre.charAt(0).toUpperCase() === caracter.toUpperCase();
}
function scrollToComponent(componentId: string) {
  setTimeout(() => {
    const element = document.getElementById(componentId);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, 100);
}

watch(opcionesSeleccionadas, () => {
  pricingStore.page = 1;
});
watch(llenadoCostos, () => {
  if (!llenadoCostos.value) {
    pricingStore.page = 1;
  }
});
watch(recargarCostoSeleccionados, () => {
  pricingStore.page = 1;
});
watch(reset, () => {
  pricingStore.llenadoCostos = true;
  mostrarCostos.value = false;
  mostrarVentasFlag.value = false;
  btnIngresarCostos.value = true;
  pricingStore.page = 1;
  mostrarContinuarVentas.value = true;
  mostrarBtnContinuarNotas.value = false;

  pricingStore.index = 0;
  mostrarContinuarVentas.value = true;
  // this.mostrarSeccionImpuestos = f;
  // this.opcionesSeleccionadas = [];
});
</script>

<template>
  <v-container fluid>
    <v-card
      class="px-5"
      v-if="pricingStore.llenadoCostos"
    >
      <h1>
        OPCIÓN COSTOS
        {{
          pricingStore.opcionCostos[pricingStore.index]!
            .nro_propuesta
        }}
      </h1>
      <v-form ref="frmDatosOpcion">
        <v-row>
          <v-col
            cols="12"
            lg="2"
            xl="2"
          >
            <v-text-field
              type="date"
              :name="`Fecha Validez de la Opción ${
                pricingStore.index + 1
              }`"
              :label="`Fecha Validez de la Opción ${
                pricingStore.index + 1
              }`"
              v-model="
                pricingStore.opcionCostos[pricingStore.index]!
                  .date_end
              "
              :rules="[
                (v) => !!v || 'Dato Requerido',
                (v) => isDateValid(v) || 'La fecha debe ser mayor que hoy.',
              ]"
            />
          </v-col>
          <v-col
            cols="12"
            lg="2"
            xl="2"
          >
            <v-text-field
              type="number"
              :name="`Tiempo en tránsito de la Opción ${
                pricingStore.index + 1
              }`"
              :label="`Tiempo en tránsito de la Opción ${
                pricingStore.index + 1
              }`"
              v-model="
                pricingStore.opcionCostos[pricingStore.index]!
                  .tiempo_transito
              "
              :rules="[
                (v) => !!v || 'Dato Requerido',
                (v) => v > 0 || 'El valor tiene que ser positivo.',
              ]"
            />
          </v-col>
          <v-col cols="8">
            <v-btn
              color="#3363A2"
              class="mx-1 btn-ingresarcostos"
              size="x-large"
              @click="pasarLlenadoCostos()"
              v-if="btnIngresarCostos"
            >
              INGRESAR COSTOS OPCIÓN
              {{ pricingStore.index + 1 }}
            </v-btn>

            <v-btn
              color="red"
              class="mx-1"
              size="x-large"
              @click="cancelarLlenadoCostos()"
              v-if="pricingStore.index > 0 && btnIngresarCostos"
            >
              CANCELAR
            </v-btn>
          </v-col>
        </v-row>
      </v-form>
      <v-container
        fluid
        v-if="mostrarCostos"
      >
        <v-row>
          <v-col cols="12">
            <CostosComponent
              :valores="
                pricingStore.opcionCostos[
                  pricingStore.index
                ]!.listCostos.filter((v) => v.esopcionflag == 1)
              "
              :amount="pricingStore.datosPrincipales.amount"
              index=""
            />
          </v-col>
          <v-col
            cols="12"
            class="derecha"
          >
            <v-spacer />
            <v-btn
              color="#3363A2"
              v-if="pricingStore.mostrarGuardarCostos"
              @click="agregarNuevoCostoIrAVentas()"
            >
              GUARDAR COSTOS OPCIÓN {{ pricingStore.index + 1 }}
            </v-btn>
          </v-col>
        </v-row>
      </v-container>
    </v-card>
    <!--  -->
    <v-card
      class="px-5"
      v-else-if="opcionSeleccionadaActual"
    >
      <h1>
        OPCIÓN COSTOS
        {{ opcionSeleccionadaActual.nro_propuesta }}
      </h1>
      <v-row>
        <v-col
          cols="12"
          lg="4"
          xl="4"
        >
          <v-text-field
            type="date"
            :name="`Fecha Validez de la Opción ${opcionSeleccionadaActual.nro_propuesta}`"
            :label="`Fecha Validez de la Opción ${opcionSeleccionadaActual.nro_propuesta}`"
            v-model="opcionSeleccionadaActual.date_end"
            :rules="[
              (v) => !!v || 'Dato Requerido',
              (v) => isDateValid(v) || 'La fecha debe ser mayor que hoy.',
            ]"
          />
        </v-col>
        <v-col
          cols="12"
          lg="4"
          xl="4"
        >
          <v-text-field
            type="number"
            :name="`Tiempo en tránsito de la Opción ${opcionSeleccionadaActual.nro_propuesta}`"
            :label="`Tiempo en tránsito de la Opción ${opcionSeleccionadaActual.nro_propuesta}`"
            v-model="opcionSeleccionadaActual.tiempo_transito"
            :rules="[
              (v) => !!v || 'Dato Requerido',
              (v) => v > 0 || 'El valor tiene que ser positivo.',
            ]"
          />
        </v-col>
        <v-col
          cols="12"
          class="derecha"
        >
          <div class="text-center">
            <v-pagination
              :model-value="pricingStore.page"
              :length="opcionesSeleccionadas.length"
              @update:model-value="cambiarPagina"
              rounded
            />
          </div>
        </v-col>
        <v-col cols="12">
          <v-row>
            <v-col
              cols="12"
              lg="6"
              xl="6"
            >
              <CostosComponent
                :key="`costos-${opcionSeleccionadaActual.nro_propuesta}`"
                :valores="
                  opcionSeleccionadaActual.listCostos.filter(
                    (v) => v.esopcionflag == 1,
                  )
                "
                :actualizar-costos-flag="
                  pricingStore.actualizarCostosFlag
                "
                :amount="pricingStore.datosPrincipales.amount"
                :index="pricingStore.page"
              />
            </v-col>
            <v-col
              cols="12"
              lg="6"
              xl="6"
            >
              <VentasComponent
                :key="`ventas-${opcionSeleccionadaActual.nro_propuesta}`"
                :valores="
                  opcionSeleccionadaActual.listCostos.filter(
                    (v) => v.esventaflag == 1,
                  )
                "
                :amount="pricingStore.datosPrincipales.amount"
              />
            </v-col>
            <v-col
              cols="12"
              class="derecha"
              v-if="mostrarContinuarVentas && mostrarBtn"
            >
              <v-btn
                color="#3363A2"
                @click="activarImpuesto"
              >
                Continuar Impuesto
              </v-btn>
            </v-col>
          </v-row>
        </v-col>

        <v-col
          cols="12"
          lg="6"
          xl="6"
          v-if="mostrarImpuestos && mostrarImpuestosEditar"
          id="cmpImpuesto"
        >
          <center v-if="mostrarImpuestos && mostrarImpuestosEditar">
            <h3>Impuestos de Aduana</h3>
          </center>
          <ImpuestosComponent
            :key="`impuestos-${opcionSeleccionadaActual.nro_propuesta}`"
            class="col-12"
            v-if="mostrarImpuestos && mostrarImpuestosEditar"
            :index="opcionSeleccionadaActual.nro_propuesta"
            :amount="pricingStore.datosPrincipales.amount"
            :list-costos="opcionSeleccionadaActual.listCostos"
            :impuestos="opcionSeleccionadaActual.listImpuestos"
          />
        </v-col>
        <v-col cols="12">
          <v-row>
            <v-col
              cols="12"
              lg="4"
              xl="4"
              class="izquierda"
            >
              <v-btn
                @click="irAComparativa()"
                color="default"
                v-if="
                  pricingStore.opcionCostos.length > 1 && mostrarBtn
                "
              >
                Regresar a la comparativa
              </v-btn>
            </v-col>
            <v-col
              class="derecha"
              v-if="mostrarBotonIrANotas"
            >
              <v-btn
                color="success"
                @click="irANotas()"
              >
                IR A NOTAS DE COSTOS
              </v-btn>
            </v-col>
          </v-row>
        </v-col>
      </v-row>
    </v-card>
  </v-container>
</template>

<style scoped>
.derecha {
  text-align: right !important;
  align-content: right !important;
}
.v-btn.v-btn--size-x-large {
  font-size: 1.5rem !important;
}
.v-pagination__item {
  font-size: 2em !important;
}
</style>
