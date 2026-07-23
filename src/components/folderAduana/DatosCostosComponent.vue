<template>
  <v-container fluid>
    <v-card class="px-5" v-if="$store.state.aduana.llenadoCostos">
      <h1>
        OPCIÓN COSTOS
        {{
          $store.state.aduana.opcionCostos[$store.state.aduana.index]
            .nro_propuesta
        }}
      </h1>
      <v-form ref="frmDatosOpcion">
        <v-row>
          <v-col cols="2">
            <v-text-field
              type="date"
              :name="`Fecha Validez de la Opción ${
                $store.state.aduana.index + 1
              }`"
              :label="`Fecha Validez de la Opción ${
                $store.state.aduana.index + 1
              }`"
              v-model="
                $store.state.aduana.opcionCostos[$store.state.aduana.index]
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
                $store.state.aduana.index + 1
              }`"
              :label="`Tiempo en tránsito de la Opción ${
                $store.state.aduana.index + 1
              }`"
              v-model="
                $store.state.aduana.opcionCostos[$store.state.aduana.index]
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
              x-large
              dark
              @click="pasarLlenadoCostos()"
              v-if="btnIngresarCostos"
            >
              INGRESAR COSTOS OPCIÓN
              {{ $store.state.aduana.index + 1 }}
            </v-btn>

            <v-btn
              color="red"
              class="mx-1"
              x-large
              dark
              @click="cancelarLlenadoCostos()"
              v-if="$store.state.aduana.index > 0 && btnIngresarCostos"
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
                $store.state.aduana.opcionCostos[
                  $store.state.aduana.index
                ].listCostos.filter((v) => v.esopcionflag == 1)
              "
              :amount="$store.state.aduana.datosPrincipales.amount"
              index=""
            />
          </v-col>
          <v-col cols="12" class="derecha">
            <v-spacer></v-spacer>
            <v-btn
              color="#3363A2"
              dark
              v-if="$store.state.aduana.mostrarGuardarCostos"
              @click="agregarNuevoCostoIrAVentas()"
              >GUARDAR COSTOS OPCIÓN {{ $store.state.aduana.index + 1 }}</v-btn
            >
          </v-col>
        </v-row>
      </v-container>
    </v-card>
    <!--  -->
    <v-card class="px-5" v-else>
      <h1>
        OPCIÓN COSTOS
        {{ opcionesSeleccionadas[$store.state.aduana.page - 1].nro_propuesta }}
      </h1>
      <v-row>
        <v-col cols="4">
          <v-text-field
            type="date"
            :name="`Fecha Validez de la Opción ${
              opcionesSeleccionadas[$store.state.aduana.page - 1].nro_propuesta
            }`"
            :label="`Fecha Validez de la Opción ${
              opcionesSeleccionadas[$store.state.aduana.page - 1].nro_propuesta
            }`"
            v-model="
              opcionesSeleccionadas[$store.state.aduana.page - 1].date_end
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
              opcionesSeleccionadas[$store.state.aduana.page - 1].nro_propuesta
            }`"
            :label="`Tiempo en tránsito de la Opción ${
              opcionesSeleccionadas[$store.state.aduana.page - 1].nro_propuesta
            }`"
            v-model="
              opcionesSeleccionadas[$store.state.aduana.page - 1]
                .tiempo_transito
            "
            :rules="[
              (v) => !!v || 'Dato Requerido',
              (v) => v > 0 || 'El valor tiene que ser positivo.',
            ]"
          />
        </v-col>
        <v-col cols="12" class="derecha">
          <template>
            <div class="text-center">
              <v-pagination
                v-model="$store.state.aduana.page"
                :length="opcionesSeleccionadas.length"
                circle
              ></v-pagination>
            </div>
          </template>
        </v-col>
        <v-col cols="12">
          <v-row>
            <v-col cols="12" lg="6" xl="6">
              <CostosComponent
                :valores="
                  opcionesSeleccionadas[
                    $store.state.aduana.page - 1
                  ].listCostos.filter((v) => v.esopcionflag == 1)
                "
                :actualizarCostosFlag="
                  $store.state.aduana.actualizarCostosFlag
                "
                :amount="$store.state.aduana.datosPrincipales.amount"
                :index="$store.state.aduana.page"
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
            <v-col
              cols="12"
              class="derecha"
              v-if="mostrarContinuarVentas && mostrarBtn"
            >
              <v-btn color="#3363A2" @click="activarImpuesto" dark>
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
              $store.state.aduana.opcionCostos[$store.state.aduana.index]
                .nro_propuesta
            "
            :amount="$store.state.aduana.datosPrincipales.amount"
            :impuestos="
              opcionesSeleccionadas[$store.state.aduana.page - 1].listImpuestos
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
                  $store.state.aduana.opcionCostos.length > 1 && mostrarBtn
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
import moment from "moment";
import Swal from "sweetalert2";

export default {
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
    CostosComponent: () => import("./Costos/CostosComponent.vue"),
    VentasComponent: () => import("./Costos/VentasComponent.vue"),
    ImpuestosComponent: () => import("./Costos/ImpuestosComponent.vue"),
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
    if (!this.llenadoCostos) {
      this.opcionesSeleccionadas =
        this.$store.state.aduana.opcionCostos.filter((v) => !!v.selected);
    }
  },
  methods: {
    irAComparativa() {
      this.$store.state.aduana.tab = 3;
      this.$store.state.aduana.actualizarComparativa =
        !this.$store.state.aduana.actualizarComparativa;
    },
    pasarLlenadoCostos() {
      if (this.$refs.frmDatosOpcion.validate()) {
        this.btnIngresarCostos = false;
        this.mostrarCostos = true;
      }
    },
    cancelarLlenadoCostos() {
      this.$store.state.aduana.opcionCostos.splice(-1, 1);
      this.$store.state.aduana.index = this.$store.state.aduana.index - 1;
      this.btnIngresarCostos = false;
      this.mostrarCostos = true;
      setTimeout(() => {
        this.$store.state.aduana.cancelarLlenadoNuevaOpcion =
          !this.$store.state.aduana.cancelarLlenadoNuevaOpcion;
      }, 100);
    },
    agregarNuevoCostoIrAVentas() {
      if (this.$store.state.aduana.index == 0) {
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
            this.$store.state.aduana.index + 2
          }</h1> `,
          denyButtonText: "<h1>Ir a la venta del cliente final</h1>",
          showDenyButton: true,
          showCancelButton: false,
          showCloseButton: true,
        }).then((action) => {
          if (action.isConfirmed) {
            let nro_propuesta = this.$store.state.aduana.index + 2;
            this.$emit("anadirNuevaOpcion", nro_propuesta);
            this.$store.state.aduana.index =
              parseInt(this.$store.state.aduana.index) + 1;
            this.mostrarCostos = false;
            this.btnIngresarCostos = true;
            this.$refs.frmDatosOpcion.resetValidation();
          }
          if (action.isDenied) {
            this.$store.state.aduana.opcionCostos[0].selected = 1;
            this.$store.state.aduana.llenadoCostos = false;
          }
        });
      }
      if (this.$store.state.aduana.index > 0) {
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
            this.$store.state.aduana.index + 2
          } </h1>`,
          denyButtonText: "<h1>Ir a la comparativa</h1>",
          showDenyButton: true,
          showCancelButton: false,
          showCloseButton: true,
        }).then((action) => {
          if (action.isConfirmed) {
            let nro_propuesta = this.$store.state.aduana.index + 2;
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
              nro_propuesta: this.$store.state.aduana.index + 2,
              date_end: "",
              tiempo_transito: 0,
              listCostos: costos,

              listImpuestos: listImpuestos,
              listNotasQuote: listNotasQuote,
              selected: false,
            });
            this.$store.state.aduana.index =
              parseInt(this.$store.state.aduana.index) + 1;
            this.mostrarCostos = false;
            this.btnIngresarCostos = true;
            this.$refs.frmDatosOpcion.resetValidation();
          }
          if (action.isDenied) {
            
            this.$store.state.aduana.actualizarComparativa =
              !this.$store.state.aduana.actualizarComparativa;
            this.$emit("continuarComparativa");
          }
        });
      }
    },

    activarCosto() {
      if (this.$refs.frmFecha.validate()) {
        this.$store.state.aduana.costoflag = true;
        let cost = this.$store.state.aduana.listCostos.filter(
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
        this.$store.state.aduana.listServices.some(
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
      this.$store.state.aduana.actualizarNotas =
        !this.$store.state.aduana.actualizarNotas;
      this.$store.state.aduana.bloquearBtnImprimir = false;
      this.$store.state.aduana.page = 1;
      this.$emit("irANotas");
    },
    activarVenta() {
      this.$store.state.aduana.ventaflag = true;
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
      let service = this.$store.state.aduana.listServices.filter(
        (v) => v.status == 1
      );
      let multiplocadores = this.$store.state.aduana.listMultiplicador.filter(
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
    opcionesSeleccionadas() {
      return this.$store.state.aduana.opcionCostos.filter((v) => !!v.selected);
    },
    llenadoCostos: {
      get() {
        return this.$store.state.aduana.llenadoCostos;
      },
      set(val) {
        return (this.$store.state.aduana.llenadoCostos = llenadoCostos);
      },
    },
    recargarCostoSeleccionados: {
      get() {
        return this.$store.state.aduana.recargarCostoSeleccionados;
      },
      set(val) {
        return (this.$store.state.aduana.recargarCostoSeleccionados =
          recargarCostoSeleccionados);
      },
    },
    reset: {
      get() {
        return this.$store.state.aduana.reset;
      },
      set(val) {
        return (this.$store.state.aduana.reset = reset);
      },
    },
    mostrarImpuestos() {
    
      let imp = this.$store.state.aduana.listServices.some(
        (v) =>
          (v.code_service == 15 || v.code_service == "15") && v.status == true
      );

      return imp;
    },
    mostrarBotonIrANotas() {
      return (
        this.opcionesSeleccionadas.length == this.$store.state.aduana.page &&
        this.opcionesSeleccionadas.length > 0 &&
        this.mostrarBtnContinuarNotas
      );
    },
  },
  watch: {
    llenadoCostos() {
      if (!this.llenadoCostos) {
        this.opcionesSeleccionadas =
          this.$store.state.aduana.opcionCostos.filter((v) => !!v.selected);
        this.$store.state.aduana.page = 1;
      }
    },
    recargarCostoSeleccionados() {
      this.opcionesSeleccionadas =
        this.$store.state.aduana.opcionCostos.filter((v) => !!v.selected);
      this.$store.state.aduana.page = 1;
    },
    reset() {
      this.$store.state.aduana.llenadoCostos = true;
      this.mostrarCostos = false;
      this.mostrarVentasFlag = false;
      this.btnIngresarCostos = true;
      this.$store.state.aduana.page = 1;
      this.mostrarContinuarVentas = true;
      this.mostrarBtnContinuarNotas = false;

      this.$store.state.aduana.index = 0;
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
.v-btn.v-size--x-large {
  font-size: 1.5rem !important;
}
.v-pagination__item {
  font-size: 2em !important;
}
</style>
