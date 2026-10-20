<template>
  <v-container fluid>
    <v-card class="px-5" v-if="aduanaStore.llenadoCostos">
      <h1>
        OPCIÓN COSTOS
        {{
          aduanaStore.opcionCostos[aduanaStore.index]
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
                aduanaStore.opcionCostos[aduanaStore.index]
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
                aduanaStore.opcionCostos[aduanaStore.index]
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
      <v-container fluid v-if="mostrarCostos">
        <v-row>
          <v-col cols="12">
            <CostosComponent
              :valores="
                aduanaStore.opcionCostos[
                  aduanaStore.index
                ].listCostos.filter((v) => v.esopcionflag == 1)
              "
              :amount="aduanaStore.datosPrincipales.amount"
              index=""
            />
          </v-col>
          <v-col cols="12" class="derecha">
            <v-spacer></v-spacer>
            <v-btn
              color="#3363A2"
              v-if="aduanaStore.mostrarGuardarCostos"
              @click="agregarNuevoCostoIrAVentas()"
              >GUARDAR COSTOS OPCIÓN {{ aduanaStore.index + 1 }}</v-btn
            >
          </v-col>
        </v-row>
      </v-container>
    </v-card>
    <!--  -->
    <v-card class="px-5" v-else-if="opcionesSeleccionadas.length > 0">
      <h1>
        OPCIÓN COSTOS
        {{ opcionesSeleccionadas[aduanaStore.page - 1].nro_propuesta }}
      </h1>
      <v-row>
        <v-col cols="4">
          <v-text-field
            type="date"
            :name="`Fecha Validez de la Opción ${
              opcionesSeleccionadas[aduanaStore.page - 1].nro_propuesta
            }`"
            :label="`Fecha Validez de la Opción ${
              opcionesSeleccionadas[aduanaStore.page - 1].nro_propuesta
            }`"
            v-model="
              opcionesSeleccionadas[aduanaStore.page - 1].date_end
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
              opcionesSeleccionadas[aduanaStore.page - 1].nro_propuesta
            }`"
            :label="`Tiempo en tránsito de la Opción ${
              opcionesSeleccionadas[aduanaStore.page - 1].nro_propuesta
            }`"
            v-model="
              opcionesSeleccionadas[aduanaStore.page - 1]
                .tiempo_transito
            "
            :rules="[
              (v) => !!v || 'Dato Requerido',
              (v) => v > 0 || 'El valor tiene que ser positivo.',
            ]"
          />
        </v-col>
        <v-col cols="12" class="derecha">
          <div class="text-center">
            <v-pagination
              v-model="aduanaStore.page"
              :length="opcionesSeleccionadas.length"
              rounded
            ></v-pagination>
          </div>
        </v-col>
        <v-col cols="12">
          <v-row>
            <v-col cols="12" lg="6" xl="6">
              <CostosComponent
                :valores="
                  opcionesSeleccionadas[
                    aduanaStore.page - 1
                  ].listCostos.filter((v) => v.esopcionflag == 1)
                "
                :actualizarCostosFlag="
                  aduanaStore.actualizarCostosFlag
                "
                :amount="aduanaStore.datosPrincipales.amount"
                :index="aduanaStore.page"
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
            <v-col
              cols="12"
              class="derecha"
              v-if="mostrarContinuarVentas && mostrarBtn"
            >
              <v-btn color="#3363A2" @click="activarImpuesto">
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
              aduanaStore.opcionCostos[aduanaStore.index]
                .nro_propuesta
            "
            :amount="aduanaStore.datosPrincipales.amount"
            :impuestos="
              opcionesSeleccionadas[aduanaStore.page - 1].listImpuestos
            "
          />
        </v-col>
        <v-col cols="12">
          <v-row>
            <v-col cols="4" class="izquierda">
              <v-btn
                @click="irAComparativa()"
                color="default"
                v-if="
                  aduanaStore.opcionCostos.length > 1 && mostrarBtn
                "
                >Regresar a la comparativa</v-btn
              >
            </v-col>
            <v-col class="derecha" v-if="mostrarBotonIrANotas">
              <v-btn color="success" @click="irANotas()"
                >IR A NOTAS DE COSTOS</v-btn
              >
            </v-col>
          </v-row>
        </v-col>
      </v-row>
    </v-card>
  </v-container>
</template>

<script>
import { defineAsyncComponent } from "vue";
import moment from "moment";
import Swal from "sweetalert2";
import { mapStores } from "pinia";
import { useAduanaStore } from "@/stores/aduana";

export default {
  emits: ["continuarComparativa", "anadirNuevaOpcion", "irANotas"],
  props: {
    mostrarBtn: {
      type: Boolean,
      default: true,
    },
    mostrarImpuestosEditar: {
      type: Boolean,
      default: false,
    },
    indexCostos: {
      type: Number,
    },
  },
  components: {
    CostosComponent: defineAsyncComponent(() => import("./Costos/CostosComponent.vue")),
    VentasComponent: defineAsyncComponent(() => import("./Costos/VentasComponent.vue")),
    ImpuestosComponent: defineAsyncComponent(() => import("./Costos/ImpuestosComponent.vue")),
  },
  data() {
    return {
      // opcionesSeleccionadas: [],
      mostrarCostos: false,
      mostrarVentasFlag: false,
      btnIngresarCostos: true,

      mostrarContinuarVentas: true,
      // mostrarSeccionImpuestos: false,
      mostrarBtnContinuarNotas: false,
    };
  },
  mounted() {
    if (!this.llenadoCostos) this.aduanaStore.page = 1;
  },
  methods: {
    irAComparativa() {
      this.aduanaStore.tab = 3;
      this.aduanaStore.actualizarComparativa =
        !this.aduanaStore.actualizarComparativa;
    },
    async pasarLlenadoCostos() {
      if ((await this.$refs.frmDatosOpcion.validate()).valid) {
        this.btnIngresarCostos = false;
        this.mostrarCostos = true;
      }
    },
    cancelarLlenadoCostos() {
      this.aduanaStore.opcionCostos.splice(-1, 1);
      this.aduanaStore.index = this.aduanaStore.index - 1;
      this.btnIngresarCostos = false;
      this.mostrarCostos = true;
      setTimeout(() => {
        this.aduanaStore.cancelarLlenadoNuevaOpcion =
          !this.aduanaStore.cancelarLlenadoNuevaOpcion;
      }, 100);
    },
    agregarNuevoCostoIrAVentas() {
      if (this.aduanaStore.index == 0) {
        Swal.fire({
          icon: "question",
          width: 1000,
          html: "<h1>¿Desea agregar una nueva opción para los costos o ir la venta al Cliente Final?</h1>",
          allowEnterKey: false,
          allowOutsideClick: false,
          allowEnterKey: false,
          allowOutsideClick: false,
          confirmButtonColor: "green",
          denyButtonColor: "#3363A2",
          confirmButtonText: `<h1>Agregar Costos - Opcion ${
            this.aduanaStore.index + 2
          }</h1> `,
          denyButtonText: "<h1>Ir a la venta del cliente final</h1>",
          showDenyButton: true,
          showCancelButton: false,
          showCloseButton: true,
        }).then((action) => {
          if (action.isConfirmed) {
            let nro_propuesta = this.aduanaStore.index + 2;
            this.$emit("anadirNuevaOpcion", nro_propuesta);
            this.aduanaStore.index =
              parseInt(this.aduanaStore.index) + 1;
            this.mostrarCostos = false;
            this.btnIngresarCostos = true;
            this.$refs.frmDatosOpcion.resetValidation();
          }
          if (action.isDenied) {
            this.aduanaStore.opcionCostos[0].selected = 1;
            this.aduanaStore.llenadoCostos = false;
          }
        });
      }
      if (this.aduanaStore.index > 0) {
        Swal.fire({
          icon: "question",
          width: 1000,
          html: "<h1>¿Desea agregar una nueva opción para los costos o ir la venta al Cliente Final?</h1>",
          allowEnterKey: false,
          allowOutsideClick: false,
          allowEnterKey: false,
          allowOutsideClick: false,
          confirmButtonColor: "green",
          denyButtonColor: "#3363A2",
          confirmButtonText: `<h1>Agregar Costos - Opcion ${
            this.aduanaStore.index + 2
          } </h1>`,
          denyButtonText: "<h1>Ir a la comparativa</h1>",
          showDenyButton: true,
          showCancelButton: false,
          showCloseButton: true,
        }).then((action) => {
          if (action.isConfirmed) {
            let nro_propuesta = this.aduanaStore.index + 2;
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
              nro_propuesta: this.aduanaStore.index + 2,
              date_end: "",
              tiempo_transito: 0,
              listCostos: costos,

              listImpuestos: listImpuestos,
              listNotasQuote: listNotasQuote,
              selected: false,
            });
            this.aduanaStore.index =
              parseInt(this.aduanaStore.index) + 1;
            this.mostrarCostos = false;
            this.btnIngresarCostos = true;
            this.$refs.frmDatosOpcion.resetValidation();
          }
          if (action.isDenied) {
            
            this.aduanaStore.actualizarComparativa =
              !this.aduanaStore.actualizarComparativa;
            this.$emit("continuarComparativa");
          }
        });
      }
    },

    async activarCosto() {
      if ((await this.$refs.frmFecha.validate()).valid) {
        this.aduanaStore.costoflag = true;
        let cost = this.aduanaStore.listCostos.filter(
          (v) => v.esopcionflag == 1
        );
        cost.forEach((element) => {
          let res = this.validateCost({ costo: element });
          if (!!res) {
            element.error = "El costo que tiene un valor 0.00.";
          } else {
            element.error = "";
          }
        });
      }
    },
    activarImpuesto() {
      this.mostrarContinuarVentas = false;

      if (
        this.aduanaStore.listServices.some(
          (v) => v.code_service == "15" || v.code_service == 15
        )
      ) {
        this.mostrarSeccionImpuestos = true;

        this.$nextTick(() => {
          const element = document.getElementById("cmpImpuesto");
          if (element) {
            element.scrollIntoView({ behavior: "smooth", block: "start" });
          }
        });
      }
      this.mostrarBtnContinuarNotas = true;
    },
    irANotas() {
      this.aduanaStore.actualizarNotas =
        !this.aduanaStore.actualizarNotas;
      this.aduanaStore.bloquearBtnImprimir = false;
      this.aduanaStore.page = 1;
      this.$emit("irANotas");
    },
    activarVenta() {
      this.aduanaStore.ventaflag = true;
      this.scrollToComponent("ventas-component");
    },
    isDateValid(date) {
      if (!date) {
        return true; // Pasa la validación si el campo está vacío
      }

      const selectedDate = moment(date, "YYYY-MM-DD", true);
      const today = moment();

      return selectedDate.isAfter(today);
    },
    validateCost({ costo }) {
      let service = this.aduanaStore.listServices.filter(
        (v) => v.status == 1
      );
      let multiplocadores = this.aduanaStore.listMultiplicador.filter(
        (v) => {
          return this.comienzaNoConCaracter(v.text, "%");
        }
      );
      let idMultiplicador = multiplocadores.map((v) => v.id);
      let idServices = service.map((v) => v.id_groupservices);
      if (
        !!idMultiplicador.includes(costo.id_multiplicador) &&
        !!idServices.includes(costo.id_groupservices) &&
        !!(costo.costounitario == 0)
      ) {
        return true;
      } else {
        return false;
      }
    },
    comienzaNoConCaracter(nombre, caracter) {
      return nombre.charAt(0).toUpperCase() !== caracter.toUpperCase();
    },
    comienzaConCaracter(nombre, caracter) {
      return nombre.charAt(0).toUpperCase() === caracter.toUpperCase();
    },
    scrollToComponent(componentId) {
      setTimeout(() => {
        const element = document.getElementById(componentId);
        if (element) {
          element.scrollIntoView({ behavior: "smooth", block: "start" });
        }
      }, 100);
    },
  },
  computed: {
    ...mapStores(useAduanaStore),
    opcionesSeleccionadas() {
      return this.aduanaStore.opcionCostos.filter((v) => !!v.selected);
    },
    llenadoCostos: {
      get() {
        return this.aduanaStore.llenadoCostos;
      },
      set(val) {
        return (this.aduanaStore.llenadoCostos = llenadoCostos);
      },
    },
    recargarCostoSeleccionados: {
      get() {
        return this.aduanaStore.recargarCostoSeleccionados;
      },
      set(val) {
        return (this.aduanaStore.recargarCostoSeleccionados =
          recargarCostoSeleccionados);
      },
    },
    reset: {
      get() {
        return this.aduanaStore.reset;
      },
      set(val) {
        return (this.aduanaStore.reset = reset);
      },
    },
    mostrarImpuestos() {
    
      let imp = this.aduanaStore.listServices.some(
        (v) =>
          (v.code_service == 15 || v.code_service == "15") && v.status == true
      );

      return imp;
    },
    mostrarBotonIrANotas() {
      return (
        this.opcionesSeleccionadas.length == this.aduanaStore.page &&
        this.opcionesSeleccionadas.length > 0 &&
        this.mostrarBtnContinuarNotas
      );
    },
  },
  watch: {
    llenadoCostos() {
      if (!this.llenadoCostos) {
        this.aduanaStore.page = 1;
      }
    },
    recargarCostoSeleccionados() {
      this.aduanaStore.page = 1;
    },
    reset() {
      this.aduanaStore.llenadoCostos = true;
      this.mostrarCostos = false;
      this.mostrarVentasFlag = false;
      this.btnIngresarCostos = true;
      this.aduanaStore.page = 1;
      this.mostrarContinuarVentas = true;
      this.mostrarBtnContinuarNotas = false;

      this.aduanaStore.index = 0;
      this.mostrarContinuarVentas = true;
      // this.mostrarSeccionImpuestos = f;
      // this.opcionesSeleccionadas = [];
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
.v-pagination__item {
  font-size: 2em !important;
}
</style>
