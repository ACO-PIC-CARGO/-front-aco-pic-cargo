<template>
  <v-container fluid class="pa-0">
    <v-card elevation="0">
      <v-card-title> Datos de la Carga </v-card-title>
      <v-card-text>
        <v-form ref="frmPuerto">
          <v-row>
            <v-col cols="12">
              <v-autocomplete
                label="Proveedor"
                variant="outlined"
                density="compact"
                class="my-1"
                :items="$store.state.itemsProveedorList"
                item-title="namelong"
                item-value="id"
                v-model="$store.state.pricing.datosPrincipales.id_proveedor"
              ></v-autocomplete>
            </v-col>
            <v-col cols="12" lg="6" xl="6" class="py-1">
              <v-autocomplete
                label="Puerto Origen"
                variant="outlined"
                density="compact"
                :rules="[(v) => !!v || 'Dato requerido']"
                class="my-1"
                :items="$store.state.pricing.listPortBegin"
                item-title="name"
                item-value="id_port"
                v-model="$store.state.pricing.datosPrincipales.idorigen"
                @update:search="recargarPuertoOrigen"
              ></v-autocomplete>
            </v-col>
            <v-col cols="12" lg="6" xl="6" class="py-1">
              <v-autocomplete
                label="Puerto Destino"
                variant="outlined"
                density="compact"
                :rules="[(v) => !!v || 'Dato requerido']"
                class="my-1"
                :items="$store.state.pricing.listPortEnd"
                item-title="name"
                item-value="id_port"
                v-model="$store.state.pricing.datosPrincipales.iddestino"
                @update:search="recargarPuertoDestino"
              >
              </v-autocomplete>
            </v-col>

            <v-col cols="12" lg="6" xl="6" class="py-1 rows" v-if="esFobFlag()">
              <v-row>
                <v-col cols="12" md="6">
                  <v-checkbox
                    label="Individual"
                    v-model="proxyIndividual"
                    density="compact"
                  ></v-checkbox>
                </v-col>
                <v-col cols="12" md="6">
                  <v-checkbox
                    label="Grupal"
                    v-model="proxyGrupal"
                    density="compact"
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
                variant="outlined"
                density="compact"
                :rules="[(v) => !!v || 'Dato requerido']"
                class="my-1"
                :items="masterusuariosStore.lstPercepcionAduana"
                item-title="descripcion"
                item-value="id"
                v-model="
                  $store.state.pricing.datosPrincipales.id_percepcionaduana
                "
                @update:model-value="cambiarImpuesto()"
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
                variant="outlined"
                density="compact"
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
                v-on:keyup.enter="anadirCarga()"
              >
              </v-text-field>
            </v-col>

            <v-col cols="12" lg="4" xl="4">
              <v-text-field
                label="Peso"
                v-model="peso"
                variant="outlined"
                density="compact"
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
            <v-col cols="12" lg="4" xl="4">
              <v-text-field
                label="Volumen"
                v-model="volumen"
                variant="outlined"
                density="compact"
                type="number"
                suffix="m3"
                :rules="[
                  (v) => !!v || 'Dato Requerido',
                  (v) => v > 0 || 'El valor tiene que ser un númro positivo',
                ]"
                v-on:keyup.enter="anadirCarga()"
              >
              </v-text-field>
            </v-col>
            <v-col cols="12" align="center">
              <v-btn class="mx-1" size="small" color="info" @click="anadirCarga()">
                AGREGAR
              </v-btn>
              <v-btn
                class="mx-1"
                size="small"
                color="warning"
                @click="calculadoraFlag = !calculadoraFlag"
              >
                USAR CALCULADORA
              </v-btn>
            </v-col>
            <v-col cols="12" v-if="isAereo">
              <v-table density="compact" class="elevation-1 my-2">
                <thead class="bg-teal-lighten-2 text-white">
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
              </v-table>
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
                :items="containersList"
                class="elevation-1"
              >
                <template v-slot:[`item.action`]="item">
                  <v-btn variant="text"
                    icon
                    color="red"
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
        <v-btn color="#3F51B5" size="small" @click="aceptar()">
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
        <v-card-title> Añadir Contenedor </v-card-title>
        <v-card-text>
          <!-- {{ $store.state.itemsContainers }} -->
          <v-form ref="frmContainer">
            <v-select
              :items="$store.state.itemsContainers"
              v-model="containers.container"
              label="Container"
              item-title="name"
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
          <v-btn color="red" @click="dialogConteiner = !dialogConteiner">
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
                  <v-autocomplete item-title="text"
                    density="compact"
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
                  <v-autocomplete item-title="text"
                    density="compact"
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
                    density="compact"
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
                    density="compact"
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
                    density="compact"
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
                    density="compact"
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
                    density="compact"
                    :rules="[
                      (v) => !!v || 'Dato Requerido.',
                      (v) =>
                        v > 0.0 || 'El valor tiene que ser un númro positivo',
                    ]"
                    v-model="fromMedidas.peso"
                  ></v-text-field>
                </div>
                <div class="flex-grow-1 text-right">
                  <v-btn
                    size="small"
                    color="#fb9514"
                    class="me-2 text-white"
                    @click="calcular()"
                  >
                    <b>Calcular</b>
                  </v-btn>
                </div>
              </div>
            </v-form>
            <div class="col-12">
              <span class="mt-2 ma-1 pa-1">
                Nota: Los valores de Peso y Volumen serán convertidos
                automáticamente al sistema MKS (Metros, Kilogramos, segundos)
                respectivamente.
              </span>
              <v-table
                density="compact"
                class="elevation-1"
                v-if="tblMedida.length > 0"
              >
                <thead class="bg-success text-white">
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
                        variant="outlined"
                        density="compact"
                        hide-details
                        @update:model-value="recalcularCalculadora"
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
                        variant="outlined"
                        density="compact"
                        hide-details
                        @update:model-value="recalcularCalculadora"
                      ></v-text-field>
                    </td>
                    <td>
                      <v-text-field
                        v-model="medida.volumen"
                        type="number"
                        variant="outlined"
                        density="compact"
                        hide-details
                        @update:model-value="recalcularCalculadora"
                      ></v-text-field>
                    </td>
                    <td>
                      <v-btn variant="text" class="ma-0 pa-0" icon>
                        <v-icon color="orange-darken-4" @click="borrarFila(i)"
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
              </v-table>
            </div>
          </v-container>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn
            color="success"
            size="small"
            :disabled="tblMedida.length < 0"
            @click="guardarDatosCalculadora()"
          >
            Aceptar
          </v-btn>
          <v-btn
            color="red"
            class="text-white"
            size="small"
            @click="calculadoraFlag = !calculadoraFlag"
          >
            Cerrar
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog
      v-model="dialogCambiarPercepcionAduana"
      max-width="560px"
      persistent
    >
      <v-card class="dialog-impuestos" rounded="lg">
        <!-- ENCABEZADO -->
        <v-card-title class="px-6 pt-5 pb-3">
          <div class="d-flex align-center flex-grow-1">
            <v-avatar size="72" color="blue-lighten-5" class="mr-4">
              <v-icon size="38" color="blue-darken-2">
                mdi-file-percent-outline
              </v-icon>
            </v-avatar>

            <div class="text-headline-medium font-weight-bold text-uppercase">
              Cálculo de impuestos
            </div>

            <v-spacer />

            <v-btn variant="text" icon @click="cerrarDialogCambiarPercepcionAduana">
              <v-icon color="blue-grey"> mdi-close </v-icon>
            </v-btn>
          </div>
        </v-card-title>

        <!-- CONTENIDO -->
        <v-card-text class="px-6 pt-2 pb-5">
          <v-alert
            color="blue-lighten-5"
            variant="tonal"
            class="alerta-impuestos mb-5"
          >
            <div class="d-flex align-center">
              <v-icon color="blue-darken-1" size="32" class="mr-4">
                mdi-information
              </v-icon>

              <div class="texto-aviso">
                Confirma si se mantiene como
                <strong>primera o segunda importación.</strong>
              </div>
            </div>
          </v-alert>

          <v-autocomplete
            v-model="id_percepcionaduana"
            :items="masterusuariosStore.lstPercepcionAduana"
            item-title="descripcion"
            item-value="id"
            label="Tipo de importación"
            variant="outlined"
            density="compact"
            hide-details="auto"
            :rules="[
              (v) =>
                (v !== null && v !== undefined && v !== '') ||
                'Selecciona el tipo de importación',
            ]"
          />
        </v-card-text>

        <v-divider />

        <!-- BOTONES -->
        <v-card-actions class="px-6 py-4">
          <v-spacer />

          <v-btn
            color="blue-grey-lighten-5"
            variant="flat"
            class="btn-impuestos btn-cancelar"
            @click="cerrarDialogCambiarPercepcionAduana"
          >
            Cancelar
          </v-btn>

          <v-btn
            color="blue-darken-1"
            variant="flat"
            class="btn-impuestos"
            :disabled="
              id_percepcionaduana === null ||
              id_percepcionaduana === undefined ||
              id_percepcionaduana === ''
            "
            @click="cambiarPercepcionAduana"
          >
            Confirmar
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog v-model="dialogSeleccionDistrito" max-width="560px" persistent>
      <v-card rounded="lg">
        <v-card-title class="text-headline-medium font-weight-bold">
          Seleccionar distrito
        </v-card-title>
        <v-card-text>
          <p>Selecciona el distrito para calcular la tarifa de transporte.</p>
          <v-autocomplete
            v-model="idTownSeleccionado"
            :items="townStore.lstTown"
            item-title="nombrecompleto"
            item-value="id"
            density="compact"
            variant="outlined"
            label="Distrito"
            :error-messages="errorIdTown"
            @update:model-value="errorIdTown = ''"
          />
        </v-card-text>
        <v-card-actions class="px-6 pb-4">
          <v-spacer />
          <v-btn color="primary" @click="confirmarSeleccionDistrito">
            Aceptar
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
import { mapActions as mapPiniaActions, mapStores } from "pinia";
import { useTownStore } from "@/stores/town";
import { useMasterusuariosStore } from "@/stores/masterusuarios";
import { useCalculadorasStore } from "@/stores/calculadoras";
export default {
  name: "DatosCargaComponent",
  mixins: [funcion],
  emits: ["recargarGrupalFlag", "recargarCostos", "activarServicios"],
  props: {
    mostrarBtn: {
      type: Boolean,
      default: true,
    },
    abrirModalContenedorRecargar: {
      type: Boolean,
      default: false,
    },
    ServicesComponentFlag: {
      type: Boolean,
      default: false,
    },
  },
  data() {
    return {
      dialogCambiarPercepcionAduana: false,
      dialogSeleccionDistrito: false,
      idTownSeleccionado: null,
      errorIdTown: "",
      mostrarContinuarFlag: true,
      headers: [
        { title: "", key: "action" },
        { title: "#", key: "number" },
        { title: "Tipo Contendor", key: "description" },
        { title: "Cantidad", key: "cantidad" },
      ],
      id_percepcionaduana: null,
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
      puertoOrigenDebounce: null,
      puertoDestinoDebounce: null,
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
  async mounted() {
    // console.log("listPortEnd", this.$store.state.pricing.listPortEnd);
  },
  beforeUnmount() {
    clearTimeout(this.puertoOrigenDebounce);
    clearTimeout(this.puertoDestinoDebounce);
  },

  watch: {
    abrirModalContenedorRecargar() {
      if (this.containersList.length == 0) {
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
      if (isFCL && this.containersList.length == 0) {
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
    ...mapActions([
      "_getContainers",
      "getPortBegin",
      "getPortEnd",
    ]),
    ...mapPiniaActions(useCalculadorasStore, ["obtenerFleteCalculadora"]),
    cambiarGrupalIndividual() {
      const { esindividualflag, esgrupalflag } =
        this.$store.state.pricing.datosPrincipales;

      if (esgrupalflag) {
        if (esgrupalflag === true) {
          this.$store.state.pricing.datosPrincipales.esindividualflag = false;
          let percepcionAduana =
            this.masterusuariosStore.lstPercepcionAduana.find(
              (v) => v.codigo == "02",
            );
          this.$store.state.pricing.datosPrincipales.id_percepcionaduana =
            percepcionAduana.id;
          setTimeout(() => {
            Promise.all([
              this.cambiarMontosACero({
                esgrupalflag: esgrupalflag,
                esindividualflag: esindividualflag,
              }),
              this.cambiarNotasIndividualGrupal({
                esgrupalflag: esgrupalflag,
                esindividualflag: esindividualflag,
              }),
            ]);
          }, 500);
        }
      } else if (esindividualflag) {
        this.$store.state.pricing.datosPrincipales.esgrupalflag = false;
        setTimeout(() => {
          Promise.all([
            this.cambiarMontosACero({
              esgrupalflag: esgrupalflag,
              esindividualflag: esindividualflag,
            }),
            this.cambiarNotasIndividualGrupal({
              esgrupalflag: false,
              esindividualflag: true,
            }),
          ]);
        }, 100);
      }
      this.cambiarImpuesto();
    },
    cambiarMontosACero({ esgrupalflag = false, esindividualflag = false }) {
      const flags = { esgrupalflag, esindividualflag };

      let codeServicesActivos = new Set(
        this.$store.state.pricing.listServices
          .filter((v) => v.status === true || v.status === 1)
          .map((v) => Number(v.code_service)),
      );

      let costos = [...this.$store.state.pricing.preCostos];
      let idTipoCarga =
        typeof this.$store.state.pricing.datosPrincipales.idtipocarga ===
        "object"
          ? this.$store.state.pricing.datosPrincipales.idtipocarga.id
          : this.$store.state.pricing.datosPrincipales.idtipocarga;

      let preCostosFiltrados = costos.filter(
        (v) =>
          v.id_incoterms ==
            this.$store.state.pricing.datosPrincipales.idincoterms &&
          v.id_modality ==
            this.$store.state.pricing.datosPrincipales.idsentido &&
          v.id_shipment == idTipoCarga &&
          codeServicesActivos.has(Number(v.code_service)),
      );

      let tipoImportacion =
        this.masterusuariosStore.lstPercepcionAduana.find(
          (v) =>
            v.id ==
            this.$store.state.pricing.datosPrincipales.id_percepcionaduana,
        );
      let codigoImportacion = tipoImportacion?.codigo;

      const COSTOS_ESPECIALES = [69, 114, 105, 39];

      this.$store.state.pricing.opcionCostos.forEach((opcion) => {
        opcion.listCostos.forEach((element) => {
          const esCostoTransporte = Number(element.code_cost) === 13;

          if (
            esCostoTransporte &&
            !this.$store.state.pricing.datosPrincipales.id_town
          ) {
            element.costounitario = 0;
            element.tienefleteflag = false;
            element.fechavigencia = null;
            element.tieneprofitflag = false;
            element.cif = esgrupalflag ? 0 : parseFloat(0.35);
            element.seguro = esgrupalflag ? 0 : parseFloat(0.45);
            return;
          }

          let flete = this.obtenerFleteOpcion(element, flags);
          let fleteVenta = this.obtenerFleteOpcionVenta(element, flags);
          let transporte = this.obtenerTransporte(element, flags);

          let costoBase = preCostosFiltrados.find(
            (v) => v.code_cost == element.code_cost,
          );

          if (costoBase) {
            let costoBaseUnitario = parseFloat(
              esgrupalflag ? 0 : costoBase.costounitario || 0,
            );

            // CASO A: COSTOS ESPECIALES
            if (COSTOS_ESPECIALES.includes(element.code_cost)) {
              element.costounitario =
                costoBaseUnitario +
                parseFloat(flete.monto || 0) +
                parseFloat(fleteVenta.monto || 0);
              element.tienefleteflag = false;
              element.fechavigencia = null;
            } else {
              // CASO B: COSTOS NORMALES CON CODE_COST
              if (element.esventaflag === 1 || element.esventaflag === true) {
                let montoprofit = 0;

                if (costoBase.profit_ganancia_pricing?.length > 0) {
                  let profitObj = costoBase.profit_ganancia_pricing.find((v) =>
                    esindividualflag ? v.esindividualflag : v.esgrupalflag,
                  );
                  if (profitObj) {
                    if (codigoImportacion === "01")
                      montoprofit = profitObj.profitprimeraimportacion || 0;
                    else if (codigoImportacion === "02")
                      montoprofit = profitObj.profitsegundaimportacion || 0;
                  }
                }

                element.costounitario =
                  element.code_cost == 13
                    ? parseFloat(transporte)
                    : parseFloat(costoBaseUnitario) +
                      parseFloat(montoprofit) +
                      parseFloat(!esgrupalflag ? flete.monto || 0 : 0) +
                      parseFloat(esgrupalflag ? fleteVenta.monto || 0 : 0);

                element.tieneprofitflag = parseFloat(montoprofit) > 0;
                element.tienefleteflag = esindividualflag
                  ? flete.tienefleteflag
                  : fleteVenta.tienefleteflag;
                element.fechavigencia = esindividualflag
                  ? flete.fechavigencia
                  : fleteVenta.fechavigencia;
              } else if (
                element.esopcionflag === 1 ||
                element.esopcionflag === true
              ) {
                element.costounitario =
                  (esgrupalflag
                    ? 0
                    : element.code_cost == 13
                    ? transporte
                    : costoBaseUnitario) + parseFloat(flete.monto || 0);

                element.tienefleteflag = flete.tienefleteflag;
                element.fechavigencia = flete.fechavigencia;
              }
            }
          } else {
            // CASO C: ÍTEMS SIN CODE_COST
            // Se conserva el ítem en la lista, pero si pasa a grupal, su monto se resetea a 0
            if (esgrupalflag) {
              element.costounitario = 0;
              element.tienefleteflag = false;
              element.fechavigencia = null;
              element.tieneprofitflag = false;
            }
          }

          // Asignación de CIF y Seguro según modalidad
          element.cif = esgrupalflag ? 0 : parseFloat(0.35);
          element.seguro = esgrupalflag ? 0 : parseFloat(0.45);
        });
      });

      setTimeout(() => {
        this.$emit("recargarGrupalFlag");
      }, 500);
    },
    cambiarNotasIndividualGrupal({
      esgrupalflag = false,
      esindividualflag = false,
    } = {}) {
      const newNotas = this.$store.state.pricing.listNotasQuote.filter((v) =>
        esindividualflag ? v.individualflag : esgrupalflag && v.grupalflag,
      );

      this.$store.state.pricing.opcionCostos.forEach((element) => {
        element.listNotasQuote = [
          ...element.listNotasQuote.filter((v) => v.estado == 0),
          ...newNotas.map((v) => ({ ...v, id: null, estado: 1 })),
        ];
      });
    },
    esFobFlag() {
      let valBranch = [1, 2, "1", "2"];
      let branch = JSON.parse(sessionStorage.getItem("dataBranch"))[0];

      if (!valBranch.includes(branch.id)) return false;
      return true;
      // return this.$store.state.pricing.listIncoterms.some(
      //   (v) =>
      //     v.id == this.$store.state.pricing.datosPrincipales.idincoterms &&
      //     v.name == "FOB",
      // );
    },
    obtenerFleteOpcion(item) {
      let datoFlete = { monto: 0, tienefleteflag: false, fechavigencia: null };
      if (item.code_cost == 4) {
        if (this.$store.state.pricing.datosPrincipales.esindividualflag) {
          let val = !!this.calculadorasStore.fletePricing.monto_flete;
          datoFlete.monto = val
            ? this.calculadorasStore.fletePricing.monto_flete
            : 0;
          datoFlete.tienefleteflag = val;
          datoFlete.fechavigencia = val
            ? this.calculadorasStore.fletePricing.vigencia
            : null;
        }
        if (this.$store.state.pricing.datosPrincipales.esgrupalflag) {
          let val =
            !!this.calculadorasStore.fletePricing.monto_flete_grupal;
          datoFlete.monto = val
            ? this.obtenerPrecioUnitarioGrupal(
                item,
                this.calculadorasStore.fletePricing.monto_flete_grupal,
              )
            : 0;
          datoFlete.tienefleteflag = val;
          datoFlete.fechavigencia = val
            ? this.calculadorasStore.fletePricing.vigencia_grupal ||
              null
            : null;
        }
      }
      return datoFlete;
    },
    obtenerFleteOpcionVenta(item) {
      let datoFlete = { monto: 0, tienefleteflag: false, fechavigencia: null };
      if (item.code_cost == 7 && item.esventaflag == 1) {
        if (this.$store.state.pricing.datosPrincipales.esgrupalflag) {
          let val =
            !!this.calculadorasStore.fletePricing
              .monto_flete_grupal_venta;
          datoFlete.monto = val
            ? this.obtenerPrecioUnitarioGrupal(
                item,
                parseFloat(
                  this.calculadorasStore.fletePricing
                    .monto_flete_grupal_venta || 0,
                ) -
                  parseFloat(
                    this.calculadorasStore.fletePricing
                      .monto_flete_grupal || 0,
                  ),
              )
            : 0;
          datoFlete.tienefleteflag = val;
          datoFlete.fechavigencia = val
            ? this.calculadorasStore.fletePricing
                .vigencia_grupal_venta || null
            : null;
        }
      }
      if (item.code_cost == 4 && item.esventaflag == 1) {
        if (this.$store.state.pricing.datosPrincipales.esgrupalflag) {
          let val =
            !!this.calculadorasStore.fletePricing.monto_flete_grupal;
          datoFlete.monto = val
            ? this.obtenerPrecioUnitarioGrupal(
                item,
                this.calculadorasStore.fletePricing.monto_flete_grupal,
              )
            : 0;
          datoFlete.tienefleteflag = val;
          datoFlete.fechavigencia = val
            ? this.calculadorasStore.fletePricing.vigencia_grupal ||
              null
            : null;
        }
      }
      if (datoFlete.monto < 0) {
        datoFlete.monto = 0;
      }
      return datoFlete;
    },
    obtenerPrecioUnitarioGrupal(item, monto) {
      const { listMultiplicador, datosPrincipales } = this.$store.state.pricing;
      const multiplicador = (listMultiplicador || []).find(
        (v) => v.id == item.id_multiplicador,
      );
      let factor = multiplicador
        ? this.calcularFac(
            multiplicador.code,
            datosPrincipales.volumen,
            datosPrincipales.peso,
            datosPrincipales.containers,
            datosPrincipales.amount,
          )
        : 0;
      if (item.code_cost == 4 && datosPrincipales.volumen < 1 && factor < 1) {
        factor = 1;
      }
      return factor > 0
        ? Number((parseFloat(monto || 0) / factor).toFixed(3))
        : 0;
    },
    recargarPuertoOrigen(textoBuscar) {
      clearTimeout(this.puertoOrigenDebounce);
      if (!textoBuscar) return;

      this.puertoOrigenDebounce = setTimeout(() => {
        this.buscarPuertoOrigen(textoBuscar);
      }, 300);
    },
    async buscarPuertoOrigen(textoBuscar) {
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

    recargarPuertoDestino(textoBuscar) {
      clearTimeout(this.puertoDestinoDebounce);
      if (!textoBuscar) return;

      this.puertoDestinoDebounce = setTimeout(() => {
        this.buscarPuertoDestino(textoBuscar);
      }, 300);
    },
    async buscarPuertoDestino(textoBuscar) {
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
    async anadirCarga() {
      if ((await this.$refs.frmDatosCarga.validate()).valid) {
        this.$store.state.pricing.datosPrincipales.numerobultos =
          this.numerobultos;
        this.$store.state.pricing.datosPrincipales.volumen = this.volumen;
        this.$store.state.pricing.datosPrincipales.peso = this.peso;
        const datos = this.$store.state.pricing.datosPrincipales;
        const idTipoCarga =
          typeof datos.idtipocarga === "object"
            ? datos.idtipocarga.id
            : datos.idtipocarga;
        const shipment = this.$store.state.pricing.listShipment.find(
          (v) => v.id == idTipoCarga,
        );
        const puertoOrigen = this.$store.state.pricing.listPortBegin.find(
          (v) => v.id_port == datos.idorigen,
        );
        const puertoDestino = this.$store.state.pricing.listPortEnd.find(
          (v) => v.id_port == datos.iddestino,
        );
        this.$store.state.spiner = true;
        if (!!datos.idorigen && !!datos.iddestino) {
          await this.obtenerFleteCalculadora({
            shipment: shipment.code,
            puerto_origen: puertoOrigen.puerto,
            puerto_destino: puertoDestino.puerto,
            volumen: datos.volumen,
            peso: datos.peso,
          });
        }
        this.$store.state.spiner = false;
        const { esgrupalflag, esindividualflag } = datos;
        this.cambiarMontosACero({ esgrupalflag, esindividualflag });
        this.$refs.frmDatosCarga.reset();
        this.$store.state.pricing.actualizarCostosFlag =
          !this.$store.state.pricing.actualizarCostosFlag;
      }
    },
    cambiarServicioTransporteActivo() {
      const servicio = this.$store.state.pricing.listServices.find(
        (s) => Number(s.code_service) === 14,
      );

      if (servicio) {
        servicio.status = 1;
      }

      const { datosPrincipales, preCostos, opcionCostos } =
        this.$store.state.pricing;
      const idTipoCarga =
        typeof datosPrincipales.idtipocarga === "object"
          ? datosPrincipales.idtipocarga.id
          : datosPrincipales.idtipocarga;
      const idContainers = new Set(
        (datosPrincipales.containers || []).map((container) =>
          Number(container.id || container.id_containers),
        ),
      );
      const costosServicio = (preCostos || []).filter(
        (costo) =>
          (Number(costo.code_service) === 14 ||
            (servicio?.id_groupservices &&
              Number(costo.id_groupservices) ===
                Number(servicio.id_groupservices)) ||
            (servicio?.id &&
              Number(costo.id_services) === Number(servicio.id))) &&
          Number(costo.id_incoterms) === Number(datosPrincipales.idincoterms) &&
          Number(costo.id_modality) === Number(datosPrincipales.idsentido) &&
          Number(costo.id_shipment) === Number(idTipoCarga) &&
          (!costo.escontenedorflag ||
            idContainers.has(Number(costo.id_container))),
      );
      const costosEspeciales = [69, 114, 105, 39];

      opcionCostos.forEach((opcion) => {
        const costosActuales = opcion.listCostos || [];
        const nuevosCostos = costosServicio.flatMap((costo) => {
          const tiposCosto = costosEspeciales.includes(Number(costo.code_cost))
            ? [{ esopcionflag: 1, esventaflag: 0 }]
            : [
                { esopcionflag: 1, esventaflag: 0 },
                { esopcionflag: 0, esventaflag: 1 },
              ];

          return tiposCosto
            .filter(
              ({ esopcionflag, esventaflag }) =>
                !costosActuales.some(
                  (actual) =>
                    (Number(actual.code_service) === 14 ||
                      (servicio?.id_groupservices &&
                        Number(actual.id_groupservices) ===
                          Number(servicio.id_groupservices)) ||
                      (servicio?.id &&
                        Number(actual.id_services) === Number(servicio.id))) &&
                    Number(actual.code_cost) === Number(costo.code_cost) &&
                    String(actual.id_multiplicador || "N") ===
                      String(costo.id_multiplicador || "N") &&
                    Number(actual.id_container || 0) ===
                      Number(costo.id_container || 0) &&
                    Number(actual.esopcionflag) === esopcionflag &&
                    Number(actual.esventaflag) === esventaflag,
                ),
            )
            .map((tipoCosto) => ({
              ...costo,
              ...tipoCosto,
              id: 0,
              nro_propuesta: opcion.nro_propuesta,
              status: true,
              costounitario: 0,
              cif: 0.35,
              seguro: 0.45,
            }));
        });

        if (nuevosCostos.length) {
          opcion.listCostos = [...costosActuales, ...nuevosCostos];
        }
      });

      this.$forceUpdate();
    },
    desactivarTransporteParaGrupal() {
      const servicioTransporte = this.$store.state.pricing.listServices.find(
        (servicio) => Number(servicio.code_service) === 14,
      );
      if (servicioTransporte) {
        servicioTransporte.status = false;
      }
      this.$store.state.pricing.datosPrincipales.id_town = null;
    },
    async guardarContainer() {
      let cantCostos = this.$store.state.pricing.listCostos.length;

      this.err = "";
      if ((await this.$refs.frmContainer.validate()).valid) {
        if (
          !Array.isArray(this.$store.state.pricing.datosPrincipales.containers)
        ) {
          this.$store.state.pricing.datosPrincipales.containers = [];
        }
        if (
          this.containersList.filter(
            (v) => v.id == this.containers.container.id,
          ).length == 0
        ) {
          this.containersList.push({
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
      this.containersList.splice(index, 1);
      this.$emit("recargarCostos");
    },
    async aceptar() {
      let validate = true;

      if (
        !this.$store.state.pricing.datosPrincipales.esgrupalflag &&
        !this.$store.state.pricing.datosPrincipales.esindividualflag
      ) {
        Swal.fire({
          icon: "warning",
          title: "Tipo de Cotización",
          text: "Por favor seleccione, el tipo de cotización.",
        });
        return;
      }

      if (this.$store.state.pricing.datosPrincipales.esgrupalflag) {
        if (
          !this.$store.state.pricing.listPortBegin.some(
            (v) =>
              v.id == this.$store.state.pricing.datosPrincipales.idorigen &&
              v.puerto == "NINGBO",
          )
        ) {
          Swal.fire({
            icon: "warning",
            title: "Cotización Grupal",
            text: "Para una cotización grupal, el puerto de salida debe ser NINGBO",
          });
          return;
        }
      }
      if ((await this.$refs.frmPuerto.validate()).valid) {
        if (this.isFcl) {
          if (this.containersList.length == 0) {
            Swal.fire({
              icon: "error",
              title: "Aviso",
              text: "Se necesita al menos un contenedor",
            });
            validate = false;
          }
        }
        if (!this.isFcl) {
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
    async calcular() {
      if ((await this.$refs.calcularPesoFrom.validate()).valid) {
        let factLongitud = this.unidadesLongitud.filter(
          (v) => v.value == this.fromMedidas.idLongitud,
        )[0].factor;

        let facPeso = this.unidadesPeso.filter(
          (v) => v.value == this.fromMedidas.idpeso,
        )[0].factor;

        let volumen =
          this.fromMedidas.largo *
          this.fromMedidas.ancho *
          this.fromMedidas.alto *
          Math.pow(factLongitud, 3);

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
          this.masterusuariosStore.lstPercepcionAduana.filter(
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
    calcularCostoUnitario(costo, costoAsociado) {
      let costounitario = costo.costounitario;
      let esindividualflag =
        this.$store.state.pricing.datosPrincipales.esindividualflag;
      let esgrupalflag =
        this.$store.state.pricing.datosPrincipales.esgrupalflag;
      let montoprofit = 0;
      let flete = this.obtenerFleteOpcion(costo);
      let fleteVenta = this.obtenerFleteOpcionVenta(costo);
      let transporte = this.obtenerTransporte(costo);
      let tipoImportacion =
        this.masterusuariosStore.lstPercepcionAduana.find(
          (v) =>
            v.id ==
            this.$store.state.pricing.datosPrincipales.id_percepcionaduana,
        );
      // OBTENIENDO LOS PROFIT
      if (
        costoAsociado.profit_ganancia_pricing.length > 0 &&
        esindividualflag
      ) {
        if (tipoImportacion.codigo == "01") {
          montoprofit = costoAsociado.profit_ganancia_pricing.find(
            (v) => v.esindividualflag,
          ).profitprimeraimportacion;
        }
        if (tipoImportacion.codigo == "02") {
          montoprofit = costoAsociado.profit_ganancia_pricing.find(
            (v) => v.esindividualflag,
          ).profitsegundaimportacion;
        }
      }
      if (costoAsociado.profit_ganancia_pricing.length > 0 && esgrupalflag) {
        if (tipoImportacion.codigo == "01") {
          montoprofit = costoAsociado.profit_ganancia_pricing.find(
            (v) => v.esgrupalflag,
          ).profitprimeraimportacion;
        }
        if (tipoImportacion.codigo == "02") {
          montoprofit = costoAsociado.profit_ganancia_pricing.find(
            (v) => v.esgrupalflag,
          ).profitsegundaimportacion;
        }
      }
      /* -------- CALCUALAR COSTO UNITARIO ---------------*/

      if (esgrupalflag) {
        if (costo.esopcionflag == 1) {
          if (costo.code_cost == 13) {
            costounitario = transporte;
          } else if (costo.code_cost == 4 || costo.code_cost == 7) {
            costounitario =
              parseFloat(costoAsociado.costounitario) +
              parseFloat(montoprofit) +
              parseFloat(flete.monto) +
              parseFloat(fleteVenta.monto);
          } else {
            costounitario = 0;
          }
        }
        if (costo.esventaflag == 1) {
          costounitario =
            parseFloat(costoAsociado.costounitario) +
            parseFloat(montoprofit) +
            parseFloat(flete.monto) +
            parseFloat(fleteVenta.monto);
        }
      }

      if (esindividualflag) {
        if (costo.esopcionflag == 1) {
          if (costo.code_cost == 13) {
            costounitario = transporte;
          } else {
            costounitario =
              parseFloat(costoAsociado.costounitario) + parseFloat(flete.monto);
          }
        }
        if (costo.esventaflag == 1) {
          if (costo.code_cost == 13) {
            costounitario = transporte;
          } else {
            costounitario =
              parseFloat(costoAsociado.costounitario) +
              parseFloat(montoprofit) +
              parseFloat(flete.monto) +
              parseFloat(fleteVenta.monto);
          }
        }
      }

      return {
        costounitario: costounitario,
        flete: flete,
        fleteVenta: fleteVenta,
      };
    },
    obtenerTransporte(item) {
      let monto = 0;
      if (item.code_cost == 13) {
        let opcion = this.$store.state.pricing.datosPrincipales.esindividualflag
          ? 1
          : this.$store.state.pricing.datosPrincipales.esgrupalflag
          ? 2
          : 0;
        let pesoActual =
          parseFloat(this.$store.state.pricing.datosPrincipales.peso) || 0;

        let transporte = this.calculadorasStore.lstTransporte.find(
          (v) =>
            v.id_distrito ==
              this.$store.state.pricing.datosPrincipales.id_town &&
            v.opcion == opcion &&
            pesoActual >= parseFloat(v.peso_desde) &&
            pesoActual <= parseFloat(v.peso_hasta),
        );

        if (transporte) {
          monto = parseFloat(transporte.tarifadolar);
        }
      }
      return monto;
    },
    async confirmarCambio(tipo, nuevoValor) {
      this.id_percepcionaduana = null;

      if (!nuevoValor) {
        if (tipo === "grupal")
          this.$store.state.pricing.datosPrincipales.esgrupalflag = false;
        if (tipo === "individual")
          this.$store.state.pricing.datosPrincipales.esindividualflag = false;
        return;
      }

      if (tipo === "grupal") {
        const result = await Swal.fire({
          title:
            '<span style="color: #3F51B5;">¿Cambiar a modalidad grupal?</span>',
          html: `
            <div style="text-align: left; line-height: 1.5; font-size: 15px;">
              <p style="margin-bottom: 12px;">Al seleccionar la opción <b>Grupal</b>, el sistema realizará los siguientes ajustes automáticos:</p>

              <div style="background-color: #e8eaf6; color: #1a237e; padding: 12px; border-radius: 6px; font-size: 14px; border: 1px solid #c5cae9; margin-bottom: 12px;">
                📦 <b>Actualización de costos:</b> Se actualizará la estructura tarifaria según el esquema consolidado.
              </div>

              <p style="font-size: 14px; color: #555;">¿Desea continuar con la aplicación de estos cambios?</p>
            </div>
          `,
          icon: "warning",
          showCancelButton: true,
          confirmButtonColor: "#3085d6",
          cancelButtonColor: "#d33",
          confirmButtonText: "SI CAMBIAR A GRUPAL",
          cancelButtonText: "Cancelar",
          allowOutsideClick: false,
        });

        if (result.isConfirmed) {
          this.$store.state.pricing.datosPrincipales.esgrupalflag = true;
          this.$store.state.pricing.datosPrincipales.esindividualflag = false;
          this.desactivarTransporteParaGrupal();
          setTimeout(() => {
            this.cambiarGrupalIndividual();
          }, 100);
        } else {
          this.$store.state.pricing.datosPrincipales.esgrupalflag = true;
          this.$nextTick(() => {
            this.$store.state.pricing.datosPrincipales.esgrupalflag = false;
            this.$store.state.pricing.datosPrincipales.esindividualflag = true;
          });
        }
      }

      // Lógica para cambio a INDIVIDUAL
      else if (tipo === "individual") {
        const result = await Swal.fire({
          title:
            '<span style="color: #3F51B5;">¿Cambiar a modalidad individual?</span>',
          html: `
            <div style="text-align: left; line-height: 1.5; font-size: 15px;">
              <p style="margin-bottom: 12px;">Está a punto de cambiar los parámetros de la cotización:</p>

              <div style="background-color: #e1f5fe; color: #01579b; padding: 12px; border-radius: 6px; font-size: 14px; border: 1px solid #b3e5fc; margin-bottom: 12px;">
                👤 <b>Recálculo individual:</b> El sistema ajustará los costos base y beneficios aplicables a este esquema.
              </div>

              <p style="font-size: 14px; color: #555;">¿Desea proceder con esta modificación?</p>
            </div>
          `,
          icon: "question",
          showCancelButton: true,
          confirmButtonColor: "#3085d6",
          cancelButtonColor: "#d33",
          confirmButtonText: "SÍ, CAMBIAR A INDIVIDUAL",
          cancelButtonText: "Cancelar",
          allowOutsideClick: false,
        });

        if (result.isConfirmed) {
          this.$store.state.pricing.datosPrincipales.esindividualflag = true;
          this.$store.state.pricing.datosPrincipales.esgrupalflag = false;
          this.cambiarServicioTransporteActivo();
          setTimeout(() => {
            this.cambiarGrupalIndividual();
            this.id_percepcionaduana =
              this.$store.state.pricing.datosPrincipales.id_percepcionaduana;
            this.dialogCambiarPercepcionAduana = true;
          }, 200);
        } else {
          this.$store.state.pricing.datosPrincipales.esindividualflag = true;
          this.$nextTick(() => {
            this.$store.state.pricing.datosPrincipales.esindividualflag = false;
            this.$store.state.pricing.datosPrincipales.esgrupalflag = true;
          });
        }
      }
    },
    cambiarPercepcionAduana() {
      this.$store.state.pricing.datosPrincipales.id_percepcionaduana =
        this.id_percepcionaduana;
      this.cambiarImpuesto();
      this.cerrarDialogCambiarPercepcionAduana();
    },
    cerrarDialogCambiarPercepcionAduana() {
      this.dialogCambiarPercepcionAduana = false;
      this.$nextTick(() => {
        this.errorIdTown = "";
        const servicioTransporteActivo =
          this.$store.state.pricing.listServices.some(
            (servicio) =>
              Number(servicio.code_service) === 14 &&
              (servicio.status === true || Number(servicio.status) === 1),
          );
        if (!servicioTransporteActivo) {
          return;
        }
        this.idTownSeleccionado = null;
        this.dialogSeleccionDistrito = true;
      });
    },
    confirmarSeleccionDistrito() {
      const idTown = this.idTownSeleccionado;
      if (!idTown) {
        this.errorIdTown = "Selecciona un distrito";
        return;
      }

      this.$store.state.pricing.datosPrincipales.id_town = idTown;

      this.$store.state.pricing.opcionCostos.forEach((opcion) => {
        (opcion.listCostos || []).forEach((costo) => {
          if (Number(costo.code_cost) === 13) {
            costo.costounitario = this.obtenerTransporte(costo);
          }
        });
      });

      this.dialogSeleccionDistrito = false;
      this.$store.state.pricing.actualizarCostosFlag =
        !this.$store.state.pricing.actualizarCostosFlag;
      this.$forceUpdate();
    },
  },
  computed: {
    ...mapStores(useCalculadorasStore, useMasterusuariosStore, useTownStore),
    abrirModalContenedor: {
      get() {
        return this.$store.state.pricing.abrirModalContenedor;
      },
    },
    containersList() {
      const containers = this.$store.state.pricing.datosPrincipales.containers;
      return Array.isArray(containers) ? containers : [];
    },
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
      const tipoCarga = this.$store.state.pricing.datosPrincipales.idtipocarga;
      if (tipoCarga && typeof tipoCarga === "object") {
        return tipoCarga.code === "FCL";
      }
      return (this.$store.state.pricing.listShipment || []).some(
        (item) => item && item.id == tipoCarga && item.code == "FCL",
      );
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
      if (!this.isAereo) return null;

      const datos = this.$store.state.pricing.datosPrincipales || {};
      const volumen = parseFloat(datos.volumen || 0); // m³
      if (!volumen) return null;

      const pv = volumen > 0 ? volumen * 166.66 : 0;
      if (!pv || !isFinite(pv)) return null;
      return parseFloat(pv.toFixed(2));
    },
    pesoCargable() {
      if (!this.isAereo) return null;

      const datos = this.$store.state.pricing.datosPrincipales || {};
      const pesoReal = parseFloat(datos.peso || 0); // kg
      const volumen = parseFloat(datos.volumen || 0); // m³

      if (!pesoReal && !volumen) return null;

      const pesoVolumetrico = volumen > 0 ? volumen * 166.66 : 0;

      const chargeable = Math.max(pesoReal || 0, pesoVolumetrico || 0);
      if (!chargeable || !isFinite(chargeable)) return null;
      return parseFloat(chargeable.toFixed(2));
    },
    proxyIndividual: {
      get() {
        return this.$store.state.pricing.datosPrincipales.esindividualflag;
      },
      set(valor) {
        if (this.$store.state.pricing.datosPrincipales.id) {
          this.confirmarCambio("individual", valor);
        } else {
          const cambioDesdeGrupal =
            this.$store.state.pricing.datosPrincipales.esgrupalflag;
          this.$store.state.pricing.datosPrincipales.esindividualflag = true;
          this.$store.state.pricing.datosPrincipales.esgrupalflag = false;
          if (cambioDesdeGrupal) {
            this.cambiarServicioTransporteActivo();
          }
          this.cambiarNotasIndividualGrupal({
            esgrupalflag: false,
            esindividualflag: true,
          });
          setTimeout(() => {
            this.cambiarImpuesto();
            if (cambioDesdeGrupal) {
              this.id_percepcionaduana =
                this.$store.state.pricing.datosPrincipales.id_percepcionaduana;
              this.dialogCambiarPercepcionAduana = true;
            }
          }, 100);
        }
      },
    },
    proxyGrupal: {
      get() {
        return this.$store.state.pricing.datosPrincipales.esgrupalflag;
      },
      set(valor) {
        if (this.$store.state.pricing.datosPrincipales.id) {
          this.confirmarCambio("grupal", valor);
        } else {
          let percepcionAduana =
            this.masterusuariosStore.lstPercepcionAduana.find(
              (v) => v.codigo == "02",
            );
          this.$store.state.pricing.datosPrincipales.id_percepcionaduana =
            percepcionAduana.id;
          this.$store.state.pricing.datosPrincipales.esgrupalflag = true;
          this.$store.state.pricing.datosPrincipales.esindividualflag = false;
          this.desactivarTransporteParaGrupal();
          this.cambiarNotasIndividualGrupal({
            esgrupalflag: true,
            esindividualflag: false,
          });
          setTimeout(() => {
            this.cambiarImpuesto();
          }, 100);
        }
      },
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

<style scoped>
.dialog-impuestos {
  border-radius: 12px !important;
  overflow: hidden;
}

.alerta-impuestos {
  border-radius: 9px;
  margin-left: 0;
  margin-right: 0;
}

.texto-aviso {
  color: #173b69;
  font-size: 16px;
  line-height: 1.5;
}

.texto-aviso strong {
  display: block;
  color: #1565c0;
  font-weight: 700;
}

.btn-impuestos {
  min-width: 125px !important;
  height: 42px !important;
  border-radius: 7px;
  font-weight: 700;
  letter-spacing: 0.3px;
}

.btn-cancelar {
  color: #526176 !important;
}

@media (max-width: 600px) {
  .dialog-impuestos .text-headline-medium {
    font-size: 17px !important;
  }

  .dialog-impuestos .v-avatar {
    width: 48px !important;
    height: 48px !important;
  }

  .texto-aviso {
    font-size: 14px;
  }

  .btn-impuestos {
    min-width: 0 !important;
    padding: 0 12px !important;
  }
}
</style>
