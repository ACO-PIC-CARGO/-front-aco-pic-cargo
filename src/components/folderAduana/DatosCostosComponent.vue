<script setup lang="ts">
import { computed, defineAsyncComponent, nextTick, onMounted, ref, useTemplateRef, watch } from "vue";
import moment from "moment";
import Swal from "sweetalert2";
import { useAduanaStore } from "@/stores/aduana";
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
  anadirNuevaOpcion: [nro_propuesta: number];
  irANotas: [];
}>();

const CostosComponent = defineAsyncComponent(() => import("./Costos/CostosComponent.vue"));
const VentasComponent = defineAsyncComponent(() => import("./Costos/VentasComponent.vue"));
const ImpuestosComponent = defineAsyncComponent(() => import("./Costos/ImpuestosComponent.vue"));

const aduanaStore = useAduanaStore();

// opcionesSeleccionadas: [],
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


const opcionesSeleccionadas = computed(() => {
  return aduanaStore.opcionCostos.filter((v) => !!v.selected);
});
const llenadoCostos = computed(() => aduanaStore.llenadoCostos);
const recargarCostoSeleccionados = computed(() => aduanaStore.recargarCostoSeleccionados);
const reset = computed(() => aduanaStore.reset);
const mostrarImpuestos = computed(() => {

  const imp = aduanaStore.listServices.some(
    (v) =>
      (v.code_service == 15 || v.code_service == "15") && v.status == true
  );

  return imp;
});
const mostrarBotonIrANotas = computed(() => {
  return (
    opcionesSeleccionadas.value.length == aduanaStore.page &&
    opcionesSeleccionadas.value.length > 0 &&
    mostrarBtnContinuarNotas.value
  );
});

function irAComparativa() {
  aduanaStore.tab = 3;
  aduanaStore.actualizarComparativa =
    !aduanaStore.actualizarComparativa;
}
async function pasarLlenadoCostos() {
  if ((await frmDatosOpcion.value!.validate()).valid) {
    btnIngresarCostos.value = false;
    mostrarCostos.value = true;
  }
}
function cancelarLlenadoCostos() {
  aduanaStore.opcionCostos.splice(-1, 1);
  aduanaStore.index = aduanaStore.index - 1;
  btnIngresarCostos.value = false;
  mostrarCostos.value = true;
  setTimeout(() => {
    aduanaStore.cancelarLlenadoNuevaOpcion =
      !aduanaStore.cancelarLlenadoNuevaOpcion;
  }, 100);
}
function agregarNuevoCostoIrAVentas() {
  if (aduanaStore.index == 0) {
    Swal.fire({
      icon: "question",
      width: 1000,
      html: "<h1>¿Desea agregar una nueva opción para los costos o ir la venta al Cliente Final?</h1>",
      allowEnterKey: false,
      allowOutsideClick: false,
      confirmButtonColor: "green",
      denyButtonColor: "#3363A2",
      confirmButtonText: `<h1>Agregar Costos - Opcion ${
            aduanaStore.index + 2
          }</h1> `,
      denyButtonText: "<h1>Ir a la venta del cliente final</h1>",
      showDenyButton: true,
      showCancelButton: false,
      showCloseButton: true,
    }).then((action) => {
      if (action.isConfirmed) {
        const nro_propuesta = aduanaStore.index + 2;
        emit("anadirNuevaOpcion", nro_propuesta);
        aduanaStore.index =
          parseInt(String(aduanaStore.index)) + 1;
        mostrarCostos.value = false;
        btnIngresarCostos.value = true;
        frmDatosOpcion.value!.resetValidation();
      }
      if (action.isDenied) {
        aduanaStore.opcionCostos[0]!.selected = 1 as unknown as boolean;
        aduanaStore.llenadoCostos = false;
      }
    });
  }
  if (aduanaStore.index > 0) {
    Swal.fire({
      icon: "question",
      width: 1000,
      html: "<h1>¿Desea agregar una nueva opción para los costos o ir la venta al Cliente Final?</h1>",
      allowEnterKey: false,
      allowOutsideClick: false,
      confirmButtonColor: "green",
      denyButtonColor: "#3363A2",
      confirmButtonText: `<h1>Agregar Costos - Opcion ${
            aduanaStore.index + 2
          } </h1>`,
      denyButtonText: "<h1>Ir a la comparativa</h1>",
      showDenyButton: true,
      showCancelButton: false,
      showCloseButton: true,
    }).then((action) => {
      if (action.isConfirmed) {
        const nro_propuesta = aduanaStore.index + 2;
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
          nro_propuesta: aduanaStore.index + 2,
          date_end: "",
          tiempo_transito: 0,
          listCostos: costos,

          listImpuestos: listImpuestos,
          listNotasQuote: listNotasQuote,
          selected: false,
        });
        aduanaStore.index =
          parseInt(String(aduanaStore.index)) + 1;
        mostrarCostos.value = false;
        btnIngresarCostos.value = true;
        frmDatosOpcion.value!.resetValidation();
      }
      if (action.isDenied) {
        
        aduanaStore.actualizarComparativa =
          !aduanaStore.actualizarComparativa;
        emit("continuarComparativa");
      }
    });
  }
}
// eslint-disable-next-line @typescript-eslint/no-unused-vars
async function activarCosto() {
  if ((await frmFecha.value!.validate()).valid) {
    aduanaStore.costoflag = true;
    const cost = aduanaStore.listCostos.filter(
      (v) => v.esopcionflag == 1
    );
    cost.forEach((element) => {
      const res = validateCost({ costo: element });
      if (!!res) {
        element.error = "El costo que tiene un valor 0.00.";
      } else {
        element.error = "";
      }
    });
  }
}
function activarImpuesto() {
  mostrarContinuarVentas.value = false;

  if (
    aduanaStore.listServices.some(
      (v) => v.code_service == "15" || v.code_service == 15
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
  aduanaStore.actualizarNotas =
    !aduanaStore.actualizarNotas;
  aduanaStore.bloquearBtnImprimir = false;
  aduanaStore.page = 1;
  emit("irANotas");
}
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function activarVenta() {
  aduanaStore.ventaflag = true;
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
  const service = aduanaStore.listServices.filter(
    (v) => v.status == 1
  );
  const multiplocadores = aduanaStore.listMultiplicador.filter(
    (v) => {
      return comienzaNoConCaracter(v.text!, "%");
    }
  );
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

watch(llenadoCostos, () => {
  if (!llenadoCostos.value) {
    aduanaStore.page = 1;
  }
});
watch(recargarCostoSeleccionados, () => {
  aduanaStore.page = 1;
});
watch(reset, () => {
  aduanaStore.llenadoCostos = true;
  mostrarCostos.value = false;
  mostrarVentasFlag.value = false;
  btnIngresarCostos.value = true;
  aduanaStore.page = 1;
  mostrarContinuarVentas.value = true;
  mostrarBtnContinuarNotas.value = false;

  aduanaStore.index = 0;
  mostrarContinuarVentas.value = true;
  // this.mostrarSeccionImpuestos = f;
  // this.opcionesSeleccionadas = [];
});

onMounted(() => {
  if (!llenadoCostos.value) aduanaStore.page = 1;
});
</script>

<template>
  <v-container fluid>
    <v-card
      class="px-5"
      v-if="aduanaStore.llenadoCostos"
    >
      <h1>
        OPCIÓN COSTOS
        {{
          aduanaStore.opcionCostos[aduanaStore.index]!
            .nro_propuesta
        }}
      </h1>
      <v-form ref="frmDatosOpcion">
        <v-row>
          <v-col cols="2">
            <v-text-field
              type="date"
              :name="`Fecha Validez de la Opción ${
                aduanaStore.index + 1
              }`"
              :label="`Fecha Validez de la Opción ${
                aduanaStore.index + 1
              }`"
              v-model="
                aduanaStore.opcionCostos[aduanaStore.index]!
                  .date_end
              "
              :rules="[
                (v) => !!v || 'Dato Requerido',
                (v) => isDateValid(v) || 'La fecha debe ser mayor que hoy.',
              ]"
            />
          </v-col>
          <v-col cols="2">
            <v-text-field
              type="number"
              :name="`Tiempo en tránsito de la Opción ${
                aduanaStore.index + 1
              }`"
              :label="`Tiempo en tránsito de la Opción ${
                aduanaStore.index + 1
              }`"
              v-model="
                aduanaStore.opcionCostos[aduanaStore.index]!
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
              {{ aduanaStore.index + 1 }}
            </v-btn>

            <v-btn
              color="red"
              class="mx-1"
              size="x-large"
              @click="cancelarLlenadoCostos()"
              v-if="aduanaStore.index > 0 && btnIngresarCostos"
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
                aduanaStore.opcionCostos[
                  aduanaStore.index
                ]!.listCostos.filter((v) => v.esopcionflag == 1)
              "
              :amount="aduanaStore.datosPrincipales.amount"
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
              v-if="aduanaStore.mostrarGuardarCostos"
              @click="agregarNuevoCostoIrAVentas()"
            >
              GUARDAR COSTOS OPCIÓN {{ aduanaStore.index + 1 }}
            </v-btn>
          </v-col>
        </v-row>
      </v-container>
    </v-card>
    <!--  -->
    <v-card
      class="px-5"
      v-else-if="opcionesSeleccionadas.length > 0"
    >
      <h1>
        OPCIÓN COSTOS
        {{ opcionesSeleccionadas[aduanaStore.page - 1]!.nro_propuesta }}
      </h1>
      <v-row>
        <v-col cols="4">
          <v-text-field
            type="date"
            :name="`Fecha Validez de la Opción ${
              opcionesSeleccionadas[aduanaStore.page - 1]!.nro_propuesta
            }`"
            :label="`Fecha Validez de la Opción ${
              opcionesSeleccionadas[aduanaStore.page - 1]!.nro_propuesta
            }`"
            v-model="
              opcionesSeleccionadas[aduanaStore.page - 1]!.date_end
            "
            :rules="[
              (v) => !!v || 'Dato Requerido',
              (v) => isDateValid(v) || 'La fecha debe ser mayor que hoy.',
            ]"
          />
        </v-col>
        <v-col cols="4">
          <v-text-field
            type="number"
            :name="`Tiempo en tránsito de la Opción ${
              opcionesSeleccionadas[aduanaStore.page - 1]!.nro_propuesta
            }`"
            :label="`Tiempo en tránsito de la Opción ${
              opcionesSeleccionadas[aduanaStore.page - 1]!.nro_propuesta
            }`"
            v-model="
              opcionesSeleccionadas[aduanaStore.page - 1]!
                .tiempo_transito
            "
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
              v-model="aduanaStore.page"
              :length="opcionesSeleccionadas.length"
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
                :valores="
                  opcionesSeleccionadas[
                    aduanaStore.page - 1
                  ]!.listCostos.filter((v) => v.esopcionflag == 1)
                "
                :actualizar-costos-flag="
                  aduanaStore.actualizarCostosFlag
                "
                :amount="aduanaStore.datosPrincipales.amount"
                :index="aduanaStore.page"
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
          cols="6"
          v-if="mostrarImpuestos && mostrarImpuestosEditar"
          id="cmpImpuesto"
        >
          <center v-if="mostrarImpuestos && mostrarImpuestosEditar">
            <h3>Impuestos de Aduana</h3>
          </center>
          <ImpuestosComponent
            class="col-12"
            v-if="mostrarImpuestos && mostrarImpuestosEditar"
            :index="
              aduanaStore.opcionCostos[aduanaStore.index]!
                .nro_propuesta
            "
            :amount="aduanaStore.datosPrincipales.amount"
            :impuestos="
              opcionesSeleccionadas[aduanaStore.page - 1]!.listImpuestos
            "
          />
        </v-col>
        <v-col cols="12">
          <v-row>
            <v-col
              cols="4"
              class="izquierda"
            >
              <v-btn
                @click="irAComparativa()"
                color="default"
                v-if="
                  aduanaStore.opcionCostos.length > 1 && mostrarBtn
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
