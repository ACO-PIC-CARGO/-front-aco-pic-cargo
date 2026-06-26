<template>
  <v-container fluid class="pa-0">
    <v-card elevation="0">
      <v-card-title primary-title> Datos de la Carga </v-card-title>
      <v-card-text>
        <v-form ref="frmPuerto">
          <v-row>
            <v-col cols="12">
              <v-autocomplete
                label="Proveedor"
                outlined
                dense
                class="my-1"
                :items="$store.state.itemsProveedorList"
                item-text="namelong"
                item-value="id"
                v-model="$store.state.pricing.datosPrincipales.id_proveedor"
              ></v-autocomplete>
            </v-col>
            <v-col cols="12" lg="6" xl="6" class="py-1">
              <v-autocomplete
                label="Puerto Origen"
                outlined
                dense
                :rules="[(v) => !!v || 'Dato requerido']"
                class="my-1"
                :items="$store.state.pricing.listPortBegin"
                item-text="name"
                item-value="id_port"
                v-model="$store.state.pricing.datosPrincipales.idorigen"
                @update:search-input="recargarPuertoOrigen"
              ></v-autocomplete>
            </v-col>
            <v-col cols="12" lg="6" xl="6" class="py-1">
              <v-autocomplete
                label="Puerto Destino"
                outlined
                dense
                :rules="[(v) => !!v || 'Dato requerido']"
                class="my-1"
                :items="$store.state.pricing.listPortEnd"
                item-text="name"
                item-value="id_port"
                v-model="$store.state.pricing.datosPrincipales.iddestino"
                @update:search-input="recargarPuertoDestino"
              >
              </v-autocomplete>
            </v-col>

            <v-col cols="12" lg="6" xl="6" class="py-1" rows>
              <v-row>
                <v-col cols="12" md="6">
                  <v-checkbox
                    label="Individual"
                    v-model="
                      $store.state.pricing.datosPrincipales.esindividualflag
                    "
                    :value="true"
                    dense
                  ></v-checkbox>
                </v-col>
                <v-col cols="12" md="6">
                  <v-checkbox
                    label="Grupal"
                    v-model="$store.state.pricing.datosPrincipales.esgrupalflag"
                    :value="true"
                    dense
                  ></v-checkbox>
                </v-col>
              </v-row>
            </v-col>

            <v-col
              cols="12"
              lg="6"
              xl="6"
              class="py-1"
              v-if="mostrarComboPercepcionAduana()"
            >
              <v-autocomplete
                label="Primera o Segunda Importación"
                outlined
                dense
                :rules="[(v) => !!v || 'Dato requerido']"
                class="my-1"
                :items="$store.state.masterusuarios.lstPercepcionAduana"
                item-text="descripcion"
                item-value="id"
                v-model="
                  $store.state.pricing.datosPrincipales.id_percepcionaduana
                "
                @change="cambiarImpuesto()"
              >
              </v-autocomplete>
            </v-col>
          </v-row>
        </v-form>

        <v-row>
          <v-col class="center">
            <v-icon color="red">mdi-arrow-down-left-bold</v-icon>
            <b>LLENAR ESTOS CAMPOS</b>
            <v-icon color="red">mdi-arrow-down-right-bold</v-icon>
          </v-col>
        </v-row>
        <v-form ref="frmDatosCarga">
          <v-row v-if="!isFcl">
            <v-col cols="12" lg="4" xl="4">
              <v-text-field
                label="Número Bultos"
                v-model="numerobultos"
                outlined
                dense
                type="number"
                suffix="uni"
                :error-messages="err"
                step="1"
                :rules="[
                  (v) => !!v || 'Dato Requerido',
                  (v) =>
                    /^-?\d+$/.test(v) || 'Debe ser un número entero válido',
                  (v) => v > 0 || 'El valor tiene que ser un númro positivo',
                ]"
              >
              </v-text-field>
            </v-col>

            <v-col cols="12" lg="4" xl="4">
              <v-text-field
                label="Volumen"
                v-model="volumen"
                outlined
                dense
                type="number"
                suffix="m3"
                :rules="[
                  (v) => !!v || 'Dato Requerido',
                  (v) => v > 0 || 'El valor tiene que ser un númro positivo',
                ]"
              >
              </v-text-field>
            </v-col>
            <v-col cols="12" lg="4" xl="4">
              <v-text-field
                label="Peso"
                v-model="peso"
                outlined
                dense
                type="number"
                suffix="kg"
                :rules="[
                  (v) => !!v || 'Dato Requerido',
                  (v) => v > 0 || 'El valor tiene que ser un númro positivo',
                ]"
                v-on:keyup.enter="anadirCarga()"
              >
              </v-text-field>
            </v-col>
            <v-col cols="12" align="center">
              <v-btn class="mx-1" small color="info" @click="anadirCarga()">
                AGREGAR
              </v-btn>
              <v-btn
                class="mx-1"
                small
                color="warning"
                @click="calculadoraFlag = !calculadoraFlag"
              >
                USAR CALCULADORA
              </v-btn>
            </v-col>
            <v-col cols="12" v-if="isAereo">
              <v-simple-table dense class="elevation-1 my-2">
                <thead class="teal lighten-2 white--text">
                  <tr>
                    <th>Cant. Bultos</th>
                    <th>Peso (kg)</th>
                    <th>Volumen (m³)</th>
                    <th v-if="!ocultarLCL">Peso volumétrico (kg)</th>
                    <th v-if="!ocultarLCL">Peso cargable (kg)</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>
                      {{ $store.state.pricing.datosPrincipales.numerobultos }}
                    </td>
                    <td>{{ $store.state.pricing.datosPrincipales.peso }}</td>
                    <td>{{ $store.state.pricing.datosPrincipales.volumen }}</td>
                    <td v-if="!ocultarLCL">
                      {{
                        pesoVolumetrico !== null ? pesoVolumetrico + " kg" : ""
                      }}
                    </td>
                    <td v-if="!ocultarLCL">
                      {{ pesoCargable !== null ? pesoCargable + " kg" : "" }}
                    </td>
                  </tr>
                </tbody>
              </v-simple-table>
            </v-col>
          </v-row>

          <v-row v-else>
            <v-col cols="12" align="right">
              <v-btn
                color="success"
                @click="dialogConteiner = !dialogConteiner"
              >
                Agregar Contenedor
              </v-btn>
            </v-col>
            <v-col cols="12">
              <v-data-table
                :headers="headers"
                :items="$store.state.pricing.datosPrincipales.containers"
                class="elevation-1"
              >
                <template v-slot:[`item.action`]="item">
                  <v-btn
                    icon
                    color="red"
                    dark
                    @click="eliminarContainer({ index: item.index })"
                  >
                    <v-icon>mdi-delete</v-icon>
                  </v-btn>
                </template>
                <template v-slot:[`item.number`]="item">
                  {{ item.index + 1 }}
                </template>
              </v-data-table>
            </v-col>
          </v-row>
        </v-form>
      </v-card-text>
      <v-card-actions class="mt-auto" v-if="mostrarContinuarFlag && mostrarBtn">
        <v-spacer></v-spacer>
        <v-btn color="#3F51B5" small dark @click="aceptar()">
          Continuar Servicios
        </v-btn>
      </v-card-actions>
    </v-card>
    <!-- AGREGAR CONTAINER -->
    <v-dialog
      v-model="dialogConteiner"
      scrollable
      persistent
      max-width="30%"
      transition="dialog-transition"
    >
      <v-card>
        <v-card-title primary-title> Añadir Contenedor </v-card-title>
        <v-card-text>
          <!-- {{ $store.state.itemsContainers }} -->
          <v-form ref="frmContainer">
            <v-select
              :items="$store.state.itemsContainers"
              v-model="containers.container"
              label="Container"
              item-text="name"
              item-value="id"
              :rules="[(v) => !!v || 'Dato Requerido']"
              :error-messages="err"
              return-object
            ></v-select>
            <v-text-field
              name="Cantidad"
              label="Cantidad"
              v-model="containers.cantidad"
              type="number"
              :rules="[(v) => !!v || 'Dato Requerido']"
            ></v-text-field>
          </v-form>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="success" @click="guardarContainer()">Aceptar</v-btn>
          <v-btn color="red" dark @click="dialogConteiner = !dialogConteiner">
            Cancelar
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
    <!-- USAR CALCULADORA -->
    <v-dialog v-model="calculadoraFlag" max-width="40%">
      <v-card>
        <v-card-title class="custom-card-title justify-center">
          <h3>CALCULADORA VOLUMÉTRICA</h3>
        </v-card-title>

        <v-card-text>
          <v-container>
            <v-form ref="calcularPesoFrom">
              <div class="row">
                <div class="col-4">
                  <v-autocomplete
                    dense
                    :items="unidadesLongitud"
                    label="Longitud"
                    :rules="[
                      (v) => !!v || 'Dato Requerido.',
                      (v) =>
                        v > 0.0 || 'El valor tiene que ser un númro positivo',
                    ]"
                    v-model="fromMedidas.idLongitud"
                  >
                  </v-autocomplete>
                </div>

                <div class="col-4">
                  <v-autocomplete
                    dense
                    :items="unidadesPeso"
                    label="Peso"
                    :rules="[(v) => !!v || 'Dato Requerido.']"
                    v-model="fromMedidas.idpeso"
                  >
                  </v-autocomplete>
                </div>
                <div class="col-4">
                  <v-text-field
                    type="number"
                    min="1"
                    label="N° Bultos"
                    required
                    dense
                    step="1"
                    :rules="[
                      (v) => !!v || 'Dato Requerido.',
                      (v) =>
                        /^-?\d+$/.test(v) || 'Debe ser un número entero válido',
                      (v) => v > 0 || 'El dato debe ser positivo',
                    ]"
                    v-model="fromMedidas.bultos"
                  ></v-text-field>
                </div>
                <div class="col-12 t-blue justify-center">
                  <b>MEDIDAS POR CADA BULTO</b>
                </div>
                <div class="col-3">
                  <v-text-field
                    type="text"
                    label="Largo"
                    required
                    dense
                    :rules="[
                      (v) => !!v || 'Dato Requerido.',
                      (v) =>
                        v > 0.0 || 'El valor tiene que ser un númro positivo',
                    ]"
                    v-model="fromMedidas.largo"
                    inputmode="numeric"
                  ></v-text-field>
                </div>
                <div class="col-3">
                  <v-text-field
                    type="text"
                    label="Ancho"
                    required
                    dense
                    :rules="[
                      (v) => !!v || 'Dato Requerido.',
                      (v) =>
                        v > 0.0 || 'El valor tiene que ser un númro positivo',
                    ]"
                    v-model="fromMedidas.ancho"
                    inputmode="numeric"
                  ></v-text-field>
                </div>
                <div class="col-3">
                  <v-text-field
                    type="text"
                    label="Alto"
                    required
                    dense
                    :rules="[
                      (v) => !!v || 'Dato Requerido.',
                      (v) =>
                        v > 0.0 || 'El valor tiene que ser un númro positivo',
                    ]"
                    v-model="fromMedidas.alto"
                    inputmode="numeric"
                  ></v-text-field>
                </div>

                <div class="col-3">
                  <v-text-field
                    type="number"
                    min="0"
                    step="0.01"
                    label="Peso X Bulto"
                    required
                    dense
                    :rules="[
                      (v) => !!v || 'Dato Requerido.',
                      (v) =>
                        v > 0.0 || 'El valor tiene que ser un númro positivo',
                    ]"
                    v-model="fromMedidas.peso"
                  ></v-text-field>
                </div>
                <v-flex text-right>
                  <v-btn
                    dense
                    small
                    color="#fb9514"
                    dark
                    class="me-2 text-white"
                    @click="calcular()"
                  >
                    <b>Calcular</b>
                  </v-btn>
                </v-flex>
              </div>
            </v-form>
            <div class="col-12">
              <span class="mt-2 ma-1 pa-1">
                Nota: Los valores de Peso y Volumen serán convertidos
                automáticamente al sistema MKS (Metros, Kilogramos, segundos)
                respectivamente.
              </span>
              <v-simple-table
                dense
                class="elevation-1"
                v-if="tblMedida.length > 0"
              >
                <thead class="success white--text">
                  <tr>
                    <td>#</td>
                    <td>Uni(s)</td>
                    <td>Medidas (L x A x H)</td>
                    <td>Peso x Bulto</td>
                    <td>Peso (Kg.)</td>
                    <td>Volumen (m <sup>3</sup>)</td>
                    <td></td>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="(medida, i) in tblMedida" :key="i">
                    <td>{{ i + 1 }}</td>
                    <td>
                      <v-text-field
                        v-model="medida.uni"
                        type="number"
                        outlined
                        solo
                        dense
                        hide-details
                        @input="recalcularCalculadora"
                      ></v-text-field>
                    </td>
                    <td>
                      {{ medida.largo }} x {{ medida.ancho }} x
                      {{ medida.alto }}
                    </td>
                    <td>
                      {{ medida.pesoXBulto }}
                    </td>
                    <td>
                      <v-text-field
                        v-model="medida.peso"
                        type="number"
                        outlined
                        solo
                        dense
                        hide-details
                        @input="recalcularCalculadora"
                      ></v-text-field>
                    </td>
                    <td>
                      <v-text-field
                        v-model="medida.volumen"
                        type="number"
                        outlined
                        solo
                        dense
                        hide-details
                        @input="recalcularCalculadora"
                      ></v-text-field>
                    </td>
                    <td>
                      <v-btn dense class="ma-0 pa-0" icon>
                        <v-icon color="orange darken-4" @click="borrarFila(i)"
                          >mdi-delete-circle</v-icon
                        >
                      </v-btn>
                    </td>
                  </tr>
                  <tr>
                    <td>{{ tblTotal.descripcion }}</td>
                    <td>{{ tblTotal.uni }}</td>
                    <td></td>
                    <td></td>
                    <td>{{ tblTotal.peso }}</td>
                    <td>{{ tblTotal.volumen }}</td>
                    <td></td>
                  </tr>
                </tbody>
              </v-simple-table>
            </div>
          </v-container>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn
            color="success"
            dark
            small
            :disabled="tblMedida.length < 0"
            @click="guardarDatosCalculadora()"
          >
            Aceptar
          </v-btn>
          <v-btn
            color="red white--text"
            small
            @click="calculadoraFlag = !calculadoraFlag"
          >
            Cerrar
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script>
import { mapActions, mapState } from "vuex";
import Swal from "sweetalert2";
import funcion from "@/components/mixins/funciones";
export default {
  name: "DatosCargaComponent",
  mixins: [funcion],
  props: {
    mostrarBtn: {
      type: Boolean,
      default: true,
    },
    abrirModalContenedorRecargar: {
      type: Boolean,
      default: false,
    },
  },
  data() {
    return {
      mostrarContinuarFlag: true,
      headers: [
        { text: "", value: "action" },
        { text: "#", value: "number" },
        { text: "Tipo Contendor", value: "description" },
        { text: "Cantidad", value: "cantidad" },
      ],
      dialogConteiner: false,
      numerobultos: "",
      volumen: "",
      peso: "",
      err: "",
      containers: {
        container: "",
        cantidad: "",
      },
      calculadoraFlag: false,
      unidadesLongitud: [
        { text: "Centimetros", value: 1, factor: 0.01 },
        { text: "Metros", value: 2, factor: 1 },
        { text: "Pulgadas", value: 3, factor: 0.0254 },
        { text: "Pie", value: 4, factor: 0.3048 },
        { text: "Milímetros", value: 5, factor: 0.001 },
      ],
      unidadesPeso: [
        { text: "Kilo", value: 1, factor: 1 },
        { text: "Libra", value: 2, factor: 0.4535 },
        { text: "Tonelada", value: 3, factor: 1000 },
      ],
      fromMedidas: {
        idLongitud: null,
        idpeso: null,
        bultos: null,
        largo: null,
        ancho: null,
        alto: null,
        peso: null,
      },
      tblMedida: [],
      tblTotal: {
        descripcion: null,
        uni: null,
        peso: null,
        volumen: null,
      },
    };
  },
  async mounted() {},
  computed: {
    abrirModalContenedor: {
      get() {
        return this.$store.state.pricing.abrirModalContenedor;
      },
    },
  },
  watch: {
    abrirModalContenedorRecargar() {
      if (this.$store.state.pricing.datosPrincipales.containers.length == 0) {
        this.dialogConteiner = true;
      }
    },
    async abrirModalContenedor() {
      let isFCL = this.$store.state.pricing.listShipment.some(
        (v) =>
          v.id ==
            (this.$store.state.pricing.datosPrincipales.idtipocarga.id
              ? this.$store.state.pricing.datosPrincipales.idtipocarga.id
              : this.$store.state.pricing.datosPrincipales.idtipocarga) &&
          v.code == "FCL",
      );
      if (
        isFCL &&
        this.$store.state.pricing.datosPrincipales.containers.length == 0
      ) {
        this.dialogConteiner = true;
      }
      if (
        !isFCL &&
        (this.$store.state.pricing.datosPrincipales.numerobultos == 0 ||
          this.$store.state.pricing.datosPrincipales.peso == 0 ||
          this.$store.state.pricing.datosPrincipales.volumen == 0)
      ) {
        Swal.fire({
          icon: "info",
          title: "Importante",
          text: "Es necesario llenar los datos, el Nro Bultos, Volumen, Peso.",
        });
      }
    },
  },
  methods: {
    ...mapActions(["_getContainers", "getPortBegin", "getPortEnd"]),
    async recargarPuertoOrigen(textoBuscar) {
      let idtipocarga =
        typeof this.$store.state.pricing.datosPrincipales.idtipocarga ===
        "object"
          ? this.$store.state.pricing.datosPrincipales.idtipocarga.id
          : this.$store.state.pricing.datosPrincipales.idtipocarga;

      let id_transport = this.$store.state.pricing.listShipment.filter(
        (v) => v.id == idtipocarga,
      );

      await this.getPortBegin({
        id_transport: id_transport[0].id_transport,
        id: this.$store.state.pricing.datosPrincipales.idorigen,
        search: textoBuscar,
      });
    },
    async recargarPuertoDestino(textoBuscar) {
      let idtipocarga =
        typeof this.$store.state.pricing.datosPrincipales.idtipocarga ===
        "object"
          ? this.$store.state.pricing.datosPrincipales.idtipocarga.id
          : this.$store.state.pricing.datosPrincipales.idtipocarga;
      let id_transport = this.$store.state.pricing.listShipment.filter(
        (v) => v.id == idtipocarga,
      );
      await this.getPortEnd({
        id_transport: id_transport[0].id_transport,
        id: this.$store.state.pricing.datosPrincipales.iddestino,
        search: textoBuscar,
      });
    },
    anadirCarga() {
      if (this.$refs.frmDatosCarga.validate()) {
        this.$store.state.pricing.datosPrincipales.numerobultos =
          this.numerobultos;
        this.$store.state.pricing.datosPrincipales.volumen = this.volumen;
        this.$store.state.pricing.datosPrincipales.peso = this.peso;
        this.$refs.frmDatosCarga.reset();
        this.$store.state.pricing.actualizarCostosFlag =
          !this.$store.state.pricing.actualizarCostosFlag;
      }
    },
    async guardarContainer() {
      let cantCostos = this.$store.state.pricing.listCostos.length;
      this.err = "";
      if (this.$refs.frmContainer.validate()) {
        if (
          this.$store.state.pricing.datosPrincipales.containers.filter(
            (v) => v.id == this.containers.container.id,
          ).length == 0
        ) {
          this.$store.state.pricing.datosPrincipales.containers.push({
            id_containers: this.containers.container.id,
            id: this.containers.container.id,
            description: this.containers.container.name,
            cantidad: this.containers.cantidad,
            code: this.containers.container.code,
          });
          this.dialogConteiner = false;
          this.containers = {
            container: "",
            cantidad: "",
          };
          this.$emit("recargarCostos", false);
        } else {
          this.err = "Contenedor ya se encuentra en la lista";
        }
      }
    },
    async eliminarContainer({ index = null }) {
      this.$store.state.pricing.datosPrincipales.containers.splice(index, 1);
      this.$emit("recargarCostos");
    },
    async aceptar() {
      let validate = true;
      if (this.$refs.frmPuerto.validate()) {
        if (
          this.$store.state.pricing.datosPrincipales.idtipocarga.code == "FCL"
        ) {
          if (
            this.$store.state.pricing.datosPrincipales.containers.length == 0
          ) {
            Swal.fire({
              icon: "error",
              title: "Aviso",
              text: "Se necesita al menos un contenedor",
            });
            validate = false;
          }
        }
        if (
          this.$store.state.pricing.datosPrincipales.idtipocarga.code != "FCL"
        ) {
          if (
            !this.$store.state.pricing.datosPrincipales.numerobultos &&
            !this.$store.state.pricing.datosPrincipales.volumen &&
            !this.$store.state.pricing.datosPrincipales.peso
          ) {
            Swal.fire({
              icon: "error",
              title: "Aviso",
              text: "Se necesita los datos de la carga",
            });
            validate = false;
          }
        }
        if (!!validate) {
          this.$emit("activarServicios");
          this.mostrarContinuarFlag = false;
        }
        //
      }
      // this.$store.commit("SET_STEP_3", true);
    },

    //
    calcular() {
      if (this.$refs.calcularPesoFrom.validate()) {
        // bultos

        // factores
        let factLongitud = this.unidadesLongitud.filter(
          (v) => v.value == this.fromMedidas.idLongitud,
        )[0].factor;

        let facPeso = this.unidadesPeso.filter(
          (v) => v.value == this.fromMedidas.idpeso,
        )[0].factor;

        // volumen

        let volumen =
          this.fromMedidas.largo *
          this.fromMedidas.ancho *
          this.fromMedidas.alto *
          Math.pow(factLongitud, 3);
        // peso
        let peso = facPeso * this.fromMedidas.peso * this.fromMedidas.bultos;
        this.tblMedida.push({
          uni: this.fromMedidas.bultos,
          peso: parseFloat(peso).toFixed(2),
          volumen: parseFloat(this.fromMedidas.bultos * volumen).toFixed(2),
          largo: this.fromMedidas.largo,
          ancho: this.fromMedidas.ancho,
          alto: this.fromMedidas.alto,
          pesoXBulto: this.fromMedidas.peso,
        });

        this.$nextTick(() => {
          this.$refs.calcularPesoFrom.reset();
          this.total();
        });
      }
    },

    total() {
      this.tblTotal = null;
      let uni = 0;
      let peso = 0;
      let volumen = 0;
      this.tblMedida.forEach((element) => {
        uni += parseFloat(element.uni);
        peso += parseFloat(element.peso);
        volumen += parseFloat(element.volumen);
      });
      this.tblTotal = {
        descripcion: "Total:",
        uni: uni,
        peso: peso,
        volumen: volumen,
      };
    },

    borrarFila(i) {
      this.tblMedida.splice(i, 1);
      this.total();
    },

    guardarDatosCalculadora() {
      this.$store.state.pricing.datosPrincipales.numerobultos =
        this.tblTotal.uni;
      this.$store.state.pricing.datosPrincipales.volumen =
        this.tblTotal.volumen;
      this.$store.state.pricing.datosPrincipales.peso = this.tblTotal.peso;
      this.calculadoraFlag = false;
      this.$store.state.pricing.actualizarCostosFlag =
        !this.$store.state.pricing.actualizarCostosFlag;
    },
    mostrarComboPercepcionAduana() {
      let esPeru = JSON.parse(sessionStorage.getItem("iso_pais")) == 9589;
      return (
        esPeru &&
        this.$store.state.pricing.listModality.some(
          (v) =>
            v.id == this.$store.state.pricing.datosPrincipales.idsentido &&
            v.code == "I",
        )
      );
    },

    cambiarImpuesto() {
      let porcentaje = "10";
      if (this.$store.state.pricing.listImpuestos.length > 0) {
        this.$store.state.pricing.listImpuestos.filter(
          (v) => v.codigo == "09",
        )[0].codigo01 = "10";
      }

      if (this.$store.state.pricing.datosPrincipales.id_percepcionaduana) {
        porcentaje =
          this.$store.state.masterusuarios.lstPercepcionAduana.filter(
            (v) =>
              v.id ==
              this.$store.state.pricing.datosPrincipales.id_percepcionaduana,
          )[0].codigo01;

        if (this.$store.state.pricing.listImpuestos.length > 0) {
          this.$store.state.pricing.listImpuestos.filter(
            (v) => v.codigo == "09",
          )[0].codigo01 = "10";
        }
      }
      let newImpuesto = [...this.$store.state.pricing.listImpuestos];
      if (newImpuesto.length > 0) {
        newImpuesto.filter((v) => v.codigo == "09")[0].codigo01 = porcentaje;

        this.$store.commit("ACTUALIZAR_IMPUEST", newImpuesto);
      }

      this.$store.state.pricing.opcionCostos.forEach((element) => {
        if (element.listImpuestos.length > 0) {
          element.listImpuestos.filter((v) => v.codigo == "09")[0].codigo01 =
            porcentaje;
        }
      });
      this.$forceUpdate();
    },
    recalcularCalculadora() {
      let uni = 0;
      let peso = 0;
      let volumen = 0;
      this.tblMedida.forEach((element) => {
        uni += parseFloat(element.uni);
        peso += parseFloat(element.peso);
        volumen += parseFloat(element.volumen);
      });
      this.tblTotal.uni = parseFloat(uni).toFixed(2);
      this.tblTotal.peso = parseFloat(peso).toFixed(2);
      this.tblTotal.volumen = parseFloat(volumen).toFixed(2);
    },
  },
  computed: {
    getPuertoOrigen() {
      let puertos = [];

      if (this.$store.state.pricing.datosPrincipales.iddestino) {
        var id_port = this.$store.state.pricing.listPortEnd.filter(
          (v) =>
            v.id_port == this.$store.state.pricing.datosPrincipales.iddestino,
        )[0].id_port;
        puertos = this.$store.state.pricing.listPortBegin.filter(
          (v) => v.id_port != id_port,
        );
      } else {
        return this.$store.state.pricing.listPortBegin;
      }
      return puertos;
    },
    getPuertoDestino() {
      let puertos = [];
      if (!!this.$store.state.pricing.datosPrincipales.idorigen) {
        var id_port = this.$store.state.pricing.listPortBegin.filter(
          (v) =>
            v.id_port == this.$store.state.pricing.datosPrincipales.idorigen,
        )[0].id_port;
        puertos = this.$store.state.pricing.listPortEnd.filter(
          (v) => v.id_port != id_port,
        );
      } else {
        puertos = this.$store.state.pricing.listPortEnd;
      }
      return puertos;
    },

    isFcl() {
      if (
        typeof this.$store.state.pricing.datosPrincipales.idtipocarga ===
        "object"
      ) {
        return (
          this.$store.state.pricing.datosPrincipales.idtipocarga.code === "FCL"
        );
      }
      if (
        typeof this.$store.state.pricing.datosPrincipales.idtipocarga !==
        "object"
      ) {
        return this.$store.state.pricing.listShipment.some(
          (v) =>
            v.id == this.$store.state.pricing.datosPrincipales.idtipocarga &&
            v.code == "FCL",
        );
      }
      return false;
    },
    isAereo() {
      let inVal = ["Aéreo", "LCL"];
      const tipo = this.$store.state.pricing.datosPrincipales.idtipocarga;
      const id = tipo && typeof tipo === "object" ? tipo.id : tipo;
      if (!id) return false;
      const items = this.$store.state.pricing.listShipment || [];
      const it = items.find((v) => v.id == id);
      return it && inVal.includes(it.code);
    },
    ocultarLCL() {
      let inVal = ["LCL"];
      const tipo = this.$store.state.pricing.datosPrincipales.idtipocarga;
      const id = tipo && typeof tipo === "object" ? tipo.id : tipo;
      if (!id) return false;
      const items = this.$store.state.pricing.listShipment || [];
      const it = items.find((v) => v.id == id);
      return it && inVal.includes(it.code);
    },
    pesoVolumetrico() {
      // Solo aplica para embarques aéreos
      if (!this.isAereo) return null;

      const datos = this.$store.state.pricing.datosPrincipales || {};
      const volumen = parseFloat(datos.volumen || 0); // m³
      if (!volumen) return null;

      const pv = volumen > 0 ? volumen * 166.66 : 0;
      if (!pv || !isFinite(pv)) return null;
      return parseFloat(pv.toFixed(2));
    },
    pesoCargable() {
      // Solo aplica para embarques aéreos
      if (!this.isAereo) return null;

      const datos = this.$store.state.pricing.datosPrincipales || {};
      const pesoReal = parseFloat(datos.peso || 0); // kg
      const volumen = parseFloat(datos.volumen || 0); // m³

      if (!pesoReal && !volumen) return null;

      // Factor estándar aéreo: volumen (m³) * 166.66 kg/m³
      const pesoVolumetrico = volumen > 0 ? volumen * 166.66 : 0;

      const chargeable = Math.max(pesoReal || 0, pesoVolumetrico || 0);
      if (!chargeable || !isFinite(chargeable)) return null;
      return parseFloat(chargeable.toFixed(2));
    },
  },
};
</script>

<style>
.center {
  align-content: center !important;
  align-items: center !important;
  text-align: center !important;
}

.custom-card-title {
  background-color: #64b5f6 !important;
}

.justify-center {
  text-align: center !important;
}
.t-blue {
  color: blue !important;
}
</style>
