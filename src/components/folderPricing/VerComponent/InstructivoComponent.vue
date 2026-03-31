<template>
  <v-container>
    <v-col cols="12">
      <template>
        <div class="text-center">
          <v-pagination
            v-model="page"
            :length="
              $store.state.pricing.opcionCostos.filter((v) => !!v.selected)
                .length
            "
            circle
          ></v-pagination>
        </div>
      </template>
    </v-col>
    <v-dialog
      v-model="aprobarflag"
      scrollable
      persistent
      max-width="50%"
      transition="dialog-transition"
      class="classDialog"
    >
      <v-card>
        <v-card-title primary-title>
          SELECCIONE EL EXPEDIENTE A ASOCIAR:
          <v-spacer></v-spacer>
          <v-btn icon color="default" @click="aprobarflag = !aprobarflag">
            <v-icon>mdi-close</v-icon>
          </v-btn>
        </v-card-title>
        <v-card-text>
          <v-form ref="frmAprobar">
            <v-row>
              <v-autocomplete
                :items="$store.state.itemsMasterList"
                v-model="id_exp"
                label="Expediente"
                item-text="code_master"
                item-value="id"
                :rules="[(v) => !!v || 'Dato Requerido']"
                :no-data-text="noDataText()"
                @change="verificarMaster()"
                class="mx-5 my-5"
              >
              </v-autocomplete>
            </v-row>
          </v-form>
          <v-alert
            v-if="mostrarAdvertencia"
            border="left"
            colored-border
            type="error"
            elevation="2"
          >
            El Master seleccionado no coincide con
            {{ textValidacionCotizacionMaster.join(", ") }} asociados a la
            cotización.
            <h3>¿Está seguro, de asociar la cotización a este registro?</h3>
          </v-alert>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn
            class="mx-1"
            small
            @click="continuarAprobar()"
            color="success"
            :loading="loading"
          >
            SELECCIONAR
          </v-btn>
          <v-btn
            class="mx-1"
            small
            color="error"
            @click="aprobarflag = !aprobarflag"
          >
            Cancelar
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
    <v-dialog
      v-model="seleccionQuoteAprobar"
      scrollable
      persistent
      max-width="35%"
      transition="dialog-transition"
      class="classDialog"
    >
      <v-card class="pa-5">
        <h2 class="blue--text justify--text">
          ESTÁS A PUNTO DE GENERAR UN INSTRUCTIVO A OPERACIONES
        </h2>
        Seleccione la opción aprobada por el cliente:

        <v-card-text>
          <v-form ref="frmAprobar">
            <v-radio-group
              v-model="nro_propuesta"
              :rules="[(v) => !!v || 'Seleccione una opción']"
            >
              <v-radio
                :value="opcion.nro_propuesta"
                v-for="(
                  opcion, index
                ) in $store.state.pricing.opcionCostos.filter(
                  (v) => v.selected,
                )"
                :key="index"
                :label="`Opción ${opcion.nro_propuesta} - ${getProveedor(
                  opcion,
                )}`"
              >
              </v-radio>
            </v-radio-group>
          </v-form>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn
            class="mx-1"
            @click="abrirModalListadoArchivos()"
            color="success"
          >
            Enviar a Operaciones - Tráfico
          </v-btn>
          <v-btn
            class="mx-1"
            color="error"
            @click="seleccionQuoteAprobar = !seleccionQuoteAprobar"
            >Cancelar</v-btn
          >
        </v-card-actions>
      </v-card>
    </v-dialog>
    <div class="col-12 mb-0 pa-0">
      <v-btn
        class="mx-1"
        color="#FF4500"
        elevation="2"
        small
        @click="imprimir()"
      >
        <v-icon color="white">mdi-printer-outline</v-icon>
      </v-btn>

      <v-btn
        class="mx-1"
        color="#01579B"
        elevation="2"
        small
        v-if="!mostrarBtnAprobar()"
        dark
        @click="dialogSequenceInstructivo = true"
      >
        <v-icon>mdi-email-outline</v-icon> Instructivo
      </v-btn>
      <v-btn
        class="mx-1"
        color="#004D40"
        elevation="2"
        v-if="mostrarBtnAprobar()"
        small
        @click="abrirSeleccionDeQuoteAAprobar()"
      >
        <span style="color: #ffffff">Enviar a Operaciones/ Tráfico</span>
      </v-btn>
      <center>
        <h3>
          INSTRUCTIVO COMPRA
          {{ $store.state.pricing.listInstructivo[0].expediente }} - N°{{
            nroPropuestaActual
          }}
        </h3>

        <h3 class="mb-1 ml-1">
          {{ $store.state.pricing.aprobadoflag == true ? "APROBADO" : "" }}
          | Exp. Master:
          {{
            $store.state.pricing.listInstructivo[0].code_master
              ? $store.state.pricing.listInstructivo[0].code_master
              : "--"
          }}
          | Exp. House:
          {{
            $store.state.pricing.listInstructivo[0].code_house
              ? $store.state.pricing.listInstructivo[0].code_house
              : "--"
          }}
        </h3>
        <h4 class="mb-1 ml-1">
          {{ $store.state.pricing.listInstructivo[0].sentido }} -
          {{ $store.state.pricing.listInstructivo[0].carga }} -
          {{ $store.state.pricing.listInstructivo[0].incoterms }}
        </h4>
      </center>
    </div>
    <v-row>
      <v-col cols="12" md="4" lg="4" xl="4">
        <v-col cols="12">
          <v-card class="pa-1" elevation="5">
            <h4 class="mb-5 ml-1">DATOS DEL CLIENTE</h4>
            <v-text-field
              class="my-1"
              readonly
              v-model="$store.state.pricing.datosPrincipales.nombre"
              label="NOMBRE:"
              dense
            ></v-text-field>
            <v-text-field
              class="my-1"
              readonly
              v-model="$store.state.pricing.listInstructivo[0].direccion"
              label="DIRECCIÓN:"
              dense
            ></v-text-field>
            <v-text-field
              class="my-1"
              readonly
              v-model="$store.state.pricing.datosPrincipales.telefono"
              label="CONTACTO:"
              dense
            ></v-text-field>

            <v-text-field
              class="my-1"
              readonly
              v-model="$store.state.pricing.vendedor"
              label="VENDEDOR:"
              dense
            ></v-text-field>
          </v-card>
        </v-col>
        <v-col cols="12">
          <v-card class="pa-1" elevation="5">
            <h4 class="mb-1 ml-1">SERVICIOS A REALIZAR</h4>
            <v-simple-table dense>
              <tbody>
                <tr
                  v-for="(servicio, i) in $store.state.pricing
                    .listServiciosInstructivo"
                  :key="i"
                >
                  <td>{{ servicio.name }}</td>
                  <td>{{ servicio.status }}</td>
                </tr>
              </tbody>
            </v-simple-table>
          </v-card>
        </v-col>
        <v-col cols="12">
          <v-card class="pa-1" elevation="5">
            <h4 class="mb-5 ml-1">DATOS DE MOVIMIENTO DE MERCANCIA</h4>
            <v-text-field
              class="my-1"
              dense
              label="NOMBRE DEL PROVEEDOR:"
              v-model="$store.state.pricing.listInstructivo[0].proveedor"
              required
            >
            </v-text-field>
            <v-text-field
              class="my-1"
              dense
              readonly
              v-model="$store.state.pricing.listInstructivo[0].direccionorigen"
              label="DIRECCION ORIGEN:"
              v-if="$store.state.pricing.listInstructivo[0].icotems == 'SXWORK'"
            >
            </v-text-field>
            <v-text-field
              class="my-1"
              dense
              readonly
              v-model="$store.state.pricing.listInstructivo[0].origen"
              label="POL:"
            >
            </v-text-field>
            <v-text-field
              class="my-1"
              dense
              readonly
              v-model="$store.state.pricing.listInstructivo[0].destino"
              label="POD:"
            >
            </v-text-field>
            <v-text-field
              class="my-1"
              dense
              v-model="$store.state.pricing.listInstructivo[0].fiscal"
              required
              label="NOMBRE FISCAL"
            >
            </v-text-field>
            <v-text-field
              class="my-1"
              dense
              readonly
              v-model="$store.state.pricing.listInstructivo[0].ruc"
              label="RUC:"
            >
            </v-text-field>
          </v-card>
        </v-col>
        <v-col cols="12">
          <v-card class="pa-1" elevation="5">
            <h4 class="mb-5 ml-1">
              NOTAS ESPECIALES:
              <v-btn color="success" @click="dialog = !dialog" icon>
                <v-icon>mdi-plus</v-icon>
              </v-btn>
            </h4>
            <v-simple-table dense border>
              <tbody>
                <tr
                  v-for="(nota, i) in $store.state.pricing.listInstructivo[0]
                    .notas"
                  :key="i"
                >
                  <td>{{ nota.description }}</td>
                </tr>
              </tbody>
            </v-simple-table>
          </v-card>
        </v-col>
        <div class="col-12"></div>
      </v-col>

      <v-col cols="12" md="8" lg="8" xl="8">
        <v-row>
          <v-col cols="12">
            <v-card class="pa-1" elevation="5">
              <h4 class="mb-1 ml-1">INGRESOS</h4>
              <v-simple-table dense>
                <thead>
                  <tr>
                    <th class="header align-right"></th>
                    <th class="header align-left">DESCRIPCIÓN</th>
                    <th class="header align-right"></th>
                    <th class="header align-right">TOTAL</th>
                  </tr>
                </thead>
                <tbody>
                  <tr
                    v-for="(venta, index) in ingresosInstructivoActual"
                    :key="index"
                    :class="[
                      venta.descripcion === 'TOTAL'
                        ? 'totalClass'
                        : venta.descripcion === 'SubTotal'
                        ? 'subTotalClass'
                        : '',
                      venta.service === 'TOTAL'
                        ? 'totalClass'
                        : venta.service === 'SubTotal'
                        ? 'subTotalClass'
                        : '',
                    ]"
                  >
                    <td>
                      {{ venta.descripcion }}
                    </td>
                    <td>
                      {{ venta.service }}
                    </td>
                    <td class="align-right">
                      {{ venta.igv }}
                    </td>
                    <td class="align-right">
                      {{ venta.total }}
                    </td>
                  </tr>
                </tbody>
              </v-simple-table>
            </v-card>
          </v-col>

          <v-col cols="12">
            <v-card class="pa-1" elevation="5">
              <h4 class="mb-1 ml-1">COSTOS:</h4>

              <v-simple-table dense>
                <thead>
                  <tr>
                    <th class="header"></th>
                    <th class="header align-left">DESCRIPCIÓN</th>
                    <th class="header align-right">TOTAL</th>
                  </tr>
                </thead>
                <tbody>
                  <tr
                    v-for="(costo, index) in costosInstructivoActual"
                    :key="index"
                    :class="[
                      costo.proveedor === 'TOTAL'
                        ? 'totalClass'
                        : costo.proveedor === 'SubTotal'
                        ? 'subTotalClass'
                        : '',
                      costo.service === 'TOTAL'
                        ? 'totalClass'
                        : costo.service === 'SubTotal'
                        ? 'subTotalClass'
                        : '',
                    ]"
                  >
                    <td>
                      {{ costo.proveedor }}
                    </td>
                    <td>
                      {{ costo.service }}
                    </td>
                    <td class="align-right">
                      {{ costo.total }}
                    </td>
                  </tr>
                </tbody>
              </v-simple-table>
            </v-card>
          </v-col>

          <v-col
            cols="12"
            v-if="$store.state.pricing.listImpuestosInstructivo.length > 0"
          >
            <v-card class="pa-1" elevation="5">
              <h4 class="mb-1 ml-1">IMPUESTOS</h4>

              <v-simple-table dense>
                <thead>
                  <tr>
                    <th class="header align-left">DESCRIPCIÓN</th>

                    <th class="header align-left">PORCENTAJE</th>
                    <th class="header align-right">TOTAL</th>
                  </tr>
                </thead>
                <tbody>
                  <tr
                    v-for="(costo, index) in impuestosInstructivoActual"
                    :key="index"
                    :class="[
                      costo.name === 'TOTAL'
                        ? 'totalClass'
                        : costo.name === 'SubTotal'
                        ? 'subTotalClass'
                        : '',
                    ]"
                  >
                    <td>
                      {{ costo.name }}
                    </td>
                    <td>
                      {{ costo.percentage }}
                    </td>

                    <td class="align-right">
                      {{ costo.valor }}
                    </td>
                  </tr>
                </tbody>
              </v-simple-table>
            </v-card>
          </v-col>
        </v-row>
      </v-col>
    </v-row>
    <v-dialog v-model="dialog" max-width="600px" transition="dialog-transition">
      <v-card>
        <v-card-title primary-title> NUEVA NOTA: </v-card-title>
        <v-card-text>
          <v-form ref="nota">
            <v-text-field
              label="DESCRIPCIÓN"
              v-model="descripcionNota"
            ></v-text-field>
          </v-form>
        </v-card-text>
        <v-card-actions>
          <v-btn color="success" text @click="guardarNota">Añadir</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
    <v-dialog
      v-model="dialogConfig"
      persistent
      max-width="30%"
      transition="dialog-transition"
    >
      <v-card>
        <ConfigCotizacion />
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn class="mx-1" color="success" @click="guardarConfig()">
            Guardar
          </v-btn>
          <!-- <v-btn class="mx-1" color="error">Cancelar</v-btn> -->
        </v-card-actions>
      </v-card>
    </v-dialog>
    <v-dialog
      v-model="dialogHouse"
      scrollable
      persistent
      max-width="50%"
      transition="dialog-transition"
      class="classDialog"
    >
      <v-card cass="px-5 ">
        <v-card-title primary-title>
          CREAR NUEVO HOUSE O ASOCIAR A UNO
          <v-spacer></v-spacer>
          <v-btn icon color="default" @click="dialogHouse = !dialogHouse">
            <v-icon>mdi-close</v-icon>
          </v-btn>
        </v-card-title>
        <v-card-text>
          <v-autocomplete
            :items="lstHouse"
            v-model="id_house"
            item-text="code_house"
            item-value="id"
            @change="validarExistePagosHouse"
          >
          </v-autocomplete>
          <v-autocomplete
            v-if="id_house != 0 && !textValidacionPago"
            :items="optionHouse"
            v-model="id_opcion_house"
            item-value="id"
            @change="validarExistePagosMaster"
          />
          <p class="red--text mx-5 my-0">
            {{ textValidacionPago }}
          </p>
        </v-card-text>

        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn
            class="mx-1"
            small
            color="success"
            @click="aprobar()"
            :disabled="activarBtnContinuar"
          >
            APROBAR
          </v-btn>
          <v-btn
            class="mx-1"
            small
            color="error"
            @click="dialogHouse = !dialogHouse"
          >
            Cancelar
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
    <v-dialog
      v-model="dialogCostos"
      scrollable
      persistent
      max-width="50%"
      transition="dialog-transition"
      class="classDialog"
    >
      <v-card cass="px-5">
        <v-card-title primary-title>
          OPCIÓN SOBRE LOS COSTOS
          <v-spacer></v-spacer>
          <v-btn icon color="default" @click="dialogCostos = !dialogCostos">
            <v-icon>mdi-close</v-icon>
          </v-btn>
        </v-card-title>
        <v-card-text>
          <v-autocomplete
            :items="optionCostos"
            v-model="id_opcion"
            item-value="id"
            @change="validarExistePagosMaster"
          />
        </v-card-text>
        <p class="red--text mx-5 my-0">
          {{ textValidacionPago }}
        </p>
        <v-card-actions>
          <v-spacer></v-spacer>
          <!-- <v-btn class="mx-1" small color="success" @click="aprobar"> -->
          <v-btn
            class="mx-1"
            small
            color="success"
            @click="buscarHouseAsociadosAMaster"
            :disabled="activarBtnContinuar"
          >
            CONITNUAR
          </v-btn>
          <v-btn
            class="mx-1"
            small
            color="error"
            @click="dialogCostos = !dialogCostos"
          >
            Cancelar
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
    <v-dialog v-model="dialogFiles" max-width="40%">
      <v-card>
        <v-card-title> Archivos a Copiar </v-card-title>
        <v-card-text>
          <v-data-table
            :headers="headersFiles"
            :items="$store.state.pricing.listadoFilesDrive"
            show-select
            v-model="$store.state.pricing.selectedFile"
            item-key="id"
          >
            <template v-slot:[`item.action`]="{ item }">
              <v-btn
                icon
                small
                :color="getColorIcon(item)"
                :href="item.webUrl"
                target="_blank"
              >
                <v-icon>{{ getIconFile(item) }}</v-icon>
              </v-btn>
            </template>
          </v-data-table>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn small color="success" @click="abrirSeleccionCorreo"
            >Continuar</v-btn
          >
          <v-btn small color="error" @click="dialogFiles = false"
            >Cancelar</v-btn
          >
        </v-card-actions>
      </v-card>
    </v-dialog>
    <v-dialog
      v-model="dialogSequenceInstructivo"
      fullscreen
      persistent
      scrollable
      v-if="dialogSequenceInstructivo"
    >
      <v-card tile shadow="none">
        <v-card-title class="pa-0">
          <v-toolbar flat dark color="primary">
            <v-toolbar-title>Datos Manuales Instructivo</v-toolbar-title>
            <v-spacer></v-spacer>
            <v-btn
              small
              class="mx-1"
              v-if="verPrevisualizacion"
              color="#01579B"
              dark
              @click="verDatosPreview = !verDatosPreview"
            >
              <v-icon class="mx-1" small v-if="verDatosPreview"
                >mdi-eye-off</v-icon
              >
              <v-icon class="mx-1" small v-else>mdi-lead-pencil</v-icon>
              {{ verDatosPreview ? "Ocultar Datos" : "Editar Datos" }}
            </v-btn>
            <v-btn
              small
              class="mx-1"
              v-if="verDatosPreview"
              color="#01579B"
              dark
              @click="verPrevisualizacion = !verPrevisualizacion"
            >
              <v-icon class="mx-1" small v-if="verPrevisualizacion"
                >mdi-eye-off</v-icon
              >
              <v-icon class="mx-1" small v-else>mdi-eye</v-icon>
              {{
                verPrevisualizacion
                  ? "Ocultar Previsualización"
                  : "Ver Previsualización"
              }}
            </v-btn>
            <v-btn icon @click="cerrarDialogoSequenceInstructivo">
              <v-icon>mdi-close</v-icon>
            </v-btn>
          </v-toolbar>
        </v-card-title>

        <v-card-text class="pa-0">
          <v-container fluid class="pa-0">
            <v-row no-gutters>
              <v-col cols="12">
                <fileSequenceInstructivo
                  @continuar="abrirModalAprobar"
                  :aprobadoflag="$store.state.pricing.aprobadoflag"
                  :verPrevisualizacion="verPrevisualizacion"
                  :verDatosPreview="verDatosPreview"
                  @cerrarDialogo="cerrarDialogoSequenceInstructivo"
                />
              </v-col>
            </v-row>
          </v-container>
        </v-card-text>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script>
import { mapActions } from "vuex";
import Swal from "sweetalert2";
import moment from "moment";
import mixins from "../../../components/mixins/funciones.js";
import axios from "axios";
import FileSequenceInstructivo from "../../comun/fileSequenceInstructivo.vue";

export default {
  mixins: [mixins],
  components: {
    ConfigCotizacion: () =>
      import("@/components/folderPricing/ConfigExpediente"),
    FileSequenceInstructivo,
  },
  data() {
    return {
      verPrevisualizacion: true,
      verDatosPreview: true,
      proveedorInstructivo: {},
      dialogSequenceInstructivo: false,
      dialogFiles: false,
      nuevoexpediente: "",
      aprobarflag: "",
      id_exp: "",
      fecha_validez: "",
      descripcionNota: "",
      dialog: false,
      seleccionQuoteAprobar: false,
      opcionesSeleccionadas: [],
      page: 1,
      nro_propuesta: "",
      mostrarAdvertencia: false,
      textValidacionCotizacionMaster: [],
      dialogConfig: false,
      dialogCostos: false,
      textValidacionPago: "",
      activarBtnContinuar: true,
      loading: false,
      lstHouse: [],
      dialogHouse: false,
      id_house: "",
      optionCostos: [
        { id: "0", text: "No hacer ninguna acción" },
        { id: "1", text: "Reemplazar los costos, ya existente de proveedores" },
        {
          id: "2",
          text: "Sumar los nuevos costos, a los costos ya existentes de proveedores",
        },
      ],
      optionHouse: [
        // { id: "0", text: "Crear un nuevo house" },
        {
          id: "1",
          text: "Reemplazar los nuevos montos, ya existente del house",
        },
        {
          id: "2",
          text: "Sumar los nuevos montos, a los costos ya existentes del house",
        },
      ],
      id_opcion: "0",
      id_opcion_house: "0",
      headersFiles: [
        { text: "Archivo", value: "name" },
        { text: "", value: "action" },
      ],
    };
  },
  computed: {
    ingresosInstructivoActual() {
      const lista = this.$store.state.pricing.listIngresosInstructivo;
      const index = this.page - 1;
      if (!lista || !lista.length || index < 0 || index >= lista.length) {
        return [];
      }
      const item = lista[index];
      return item && item.opcion ? item.opcion : [];
    },
    costosInstructivoActual() {
      const lista = this.$store.state.pricing.listCostosInstructivo;
      const index = this.page - 1;
      if (!lista || !lista.length || index < 0 || index >= lista.length) {
        return [];
      }
      const item = lista[index];
      return item && item.opcion ? item.opcion : [];
    },
    impuestosInstructivoActual() {
      const lista = this.$store.state.pricing.listImpuestosInstructivo;
      const index = this.page - 1;
      if (!lista || !lista.length || index < 0 || index >= lista.length) {
        return [];
      }
      const item = lista[index];
      return item && item.opcion ? item.opcion : [];
    },
    nroPropuestaActual() {
      const lista = this.$store.state.pricing.listIngresosInstructivo;
      const index = this.page - 1;
      if (!lista || !lista.length || index < 0 || index >= lista.length) {
        return "";
      }
      const item = lista[index];
      return item && item.nro_propuesta ? item.nro_propuesta : "";
    },
  },

  async mounted() {
    this.$nextTick(async () => {
      this.dialogSequenceInstructivo = true;
      setTimeout(async () => {
        await this.generaInstructivoparaguardata();
        if (this.$store.state.pricing.aprobadoflag) {
        }
      }, 4000);
    });
  },
  methods: {
    ...mapActions([
      "imprimirInstructivoQuote",
      "aprobarCotizacion",
      "cargarMaster",
      "setNoteQuote",
      "getInstructivoId",
      "generaInstructivoparaguardata",
      "GuardarConfiguracionEmpresa",
      "ObtenerDatosConfig",
    ]),
    cerrarDialogoSequenceInstructivo() {
      Swal.fire({
        icon: "warning",
        title: "Advertencia",
        text: "Si cierra esta pestaña no se guardará ningún cambio. Está seguro de cerrar esta pestaña.",
        allowEnterKey: false,
        allowEscapeKey: false,
        allowOutsideClick: false,
        confirmButtonText: "Si, cerrar.",
        cancelButtonText: "Cancelar",
        cancelButtonColor: "red",
        showCancelButton: true,
      }).then((res) => {
        if (res.isConfirmed) {
          this.dialogSequenceInstructivo = false;
        }
      });
      // dialogSequenceInstructivo
    },
    getIconFile(item) {
      if (item.folder) return "mdi-folder";

      const extension = item.extension ? item.extension.toLowerCase() : "";

      switch (extension) {
        case "pdf":
          return "mdi-file-pdf-box";
        case "xls":
        case "xlsx":
          return "mdi-file-excel";
        case "doc":
        case "docx":
          return "mdi-file-word";
        case "png":
        case "jpg":
        case "jpeg":
          return "mdi-file-image";
        case "zip":
        case "rar":
          return "mdi-zip-box";
        default:
          return "mdi-file";
      }
    },

    getColorIcon(item) {
      if (item.folder) return "amber";
      const extension = item.extension ? item.extension.toLowerCase() : "";

      const colors = {
        pdf: "red",
        xlsx: "green",
        xls: "green",
        docx: "blue",
        doc: "blue",
        png: "purple",
        jpg: "purple",
      };

      return colors[extension] || "grey";
    },
    async guardarConfig() {
      await this.GuardarConfiguracionEmpresa();
      await this.ObtenerDatosConfig();
      this.dialogConfig = false;
      this.abrirSeleccionDeQuoteAAprobar();
    },
    verificarMaster() {
      this.mostrarAdvertencia = false;
      this.textValidacionCotizacionMaster = [];
      let master = this.$store.state.itemsMasterList.filter(
        (v) => v.id == this.id_exp,
      )[0];
      if (
        !(
          this.$store.state.pricing.datosPrincipales.idsentido ==
          master.id_modality
        )
      ) {
        this.mostrarAdvertencia = true;
        this.textValidacionCotizacionMaster.push("Modalidad");
      }
      if (
        !(
          this.$store.state.pricing.datosPrincipales.idtipocarga ==
          master.id_shipment
        )
      ) {
        this.mostrarAdvertencia = true;
        this.textValidacionCotizacionMaster.push("Tipó de Cargar");
      }
      if (
        !(
          this.$store.state.pricing.datosPrincipales.idincoterms ==
          master.id_incoterms
        )
      ) {
        this.mostrarAdvertencia = true;
        this.textValidacionCotizacionMaster.push("Incoterms");
      }

      if (
        !(
          this.$store.state.pricing.datosPrincipales.idorigen ==
          master.id_port_begin
        )
      ) {
        this.mostrarAdvertencia = true;
        this.textValidacionCotizacionMaster.push("Puerto de origien");
      }
      if (
        !(
          this.$store.state.pricing.datosPrincipales.iddestino ==
          master.id_port_end
        )
      ) {
        this.mostrarAdvertencia = true;
        this.textValidacionCotizacionMaster.push("Puerto de Destino");
      }
    },
    async imprimir() {
      for (
        let index = 0;
        index <
        this.$store.state.pricing.opcionCostos.filter((v) => !!v.selected)
          .length;
        index++
      ) {
        (function (index) {
          this.imprimirInstructivoQuote(
            this.$store.state.pricing.opcionCostos[index].nro_propuesta,
          );
        }).call(this, index); // Pasamos 'index' como argumento y establecemos el contexto a 'this'
      }
    },
    async guardarNota() {
      if (this.$refs.nota.validate()) {
        this.$store.state.spiner = true;
        let data = {
          name: this.descripcionNota,
          id_quote: this.$route.params.id,
        };
        await this.setNoteQuote(data);
        this.$refs.nota.reset();
        await this.getInstructivoId({ id: this.$route.params.id });
        this.dialog = false;
        this.$store.state.spiner = false;
      }
    },
    async abrirSeleccionDeQuoteAAprobar() {
      if (!this.$store.state.pricing.datosPrincipales.id_proveedor) {
        Swal.fire({
          icon: "warning",
          title: "Proveedor",
          text: "Para Aprobar la cotización necesita un proveedor",
        });
        return;
      }
      let opcionCostos = this.$store.state.pricing.opcionCostos.filter(
        (v) => !!v.selected,
      );
      if (opcionCostos.length != 1) {
        Swal.fire({
          icon: "warning",
          title: "Costos",
          text: "Es necesario seleccionar opción para cotizar",
        });
        return;
      }
      let costosFlete = opcionCostos[0].listCostos.filter(
        (v) => v.esfleteflag == 1 && v.status == 1 && v.esopcionflag == 1,
      );

      let proveedoresUnicos = [
        ...new Set(costosFlete.map((v) => v.id_proveedor)),
      ];
      if (proveedoresUnicos.length > 1) {
        Swal.fire({
          icon: "warning",
          title: "Costos",
          text: "Para aprobar, en la sección Flete y gastos de origen, debe tener un solo proveedor",
        });
        return;
      }
      this.proveedorInstructivo = this.$store.state.provedores.find(
        (v) => v.id == proveedoresUnicos[0],
      );

      let val = JSON.parse(sessionStorage.getItem("ConfigEmpresa"));
      this.dialogConfig = !val.existemaster;
      if (this.dialogConfig) {
        return false;
      }

      await this.cargarMaster(this.$store.state.pricing.datosPrincipales);

      this.seleccionQuoteAprobar = true;
    },
    mostrarBtnAprobar() {
      return !this.$store.state.pricing.aprobadoflag;
    },
    abrirModalListadoArchivos() {
      this.dialogFiles = true;
    },
    abrirSeleccionCorreo() {
      Swal.fire({
        icon: "question",
        title: "¿Empezar Instructivo?",
        showConfirmButton: true,
        confirmButtonText: "Empezar",
        cancelButtonText: "Cancelar",
        allowEnterKey: false,
        allowEscapeKey: false,
        allowOutsideClick: false,
      }).then((confirmacion) => {
        if (confirmacion.isConfirmed) {
          this.dialogFiles = false;
          this.dialogSequenceInstructivo = true;
        }
      });
    },
    async abrirModalAprobar() {
      this.dialogFiles = false;
      this.dialogSequenceInstructivo = false;
      await this.generaInstructivoparaguardata();
      if (this.$refs.frmAprobar.validate()) {
        let fecha_validez = this.$store.state.pricing.opcionCostos.filter(
          (v) => v.nro_propuesta == this.nro_propuesta,
        )[0].date_end;
        let esValida = moment(fecha_validez).isSameOrAfter(moment(), "day");
        if (!esValida) {
          return Swal.fire({
            icon: "warning",
            title: "Advertencia",
            text: "No se puede aprobar ya que la validez ya expiró.",
          }).then(() => false);
        }
        esValida = moment(fecha_validez, "YYYY-MM-DD").isSameOrAfter(
          moment().add(15, "days").startOf("day"),
        );
        let hoy = moment();
        let newFechaValize = moment(fecha_validez);
        let cantFecha = newFechaValize.diff(hoy, "days");

        if (!esValida) {
          return Swal.fire({
            icon: "question",
            title: "Advertencia",
            text: `Quedan ${
              cantFecha + 1
            } días de validez. ¿Desea continuar.? `,
            allowEnterKey: false,
            allowOutsideClick: false,
            allowEscapeKey: false,
            showCancelButton: true,
            confirmButtonText: "Enviar a Operaciones.",
            cancelButtonText: "No aprobar.",
          }).then((res) => {
            if (res.isDismissed) {
              return false;
            }

            this.nuevoexpediente = true;
            this.id_exp = "";
            let vm = this;
            Swal.fire({
              icon: "question",
              iconColor: "red",
              width: 1000,
              html:
                this.$store.state.itemsMasterList.length > 0
                  ? "<h1>¿Desea crear un nuevo expediente o seleccionar uno registrado?</h1>"
                  : "<h1>¿Desea crear un nuevo expediente?</h1>",
              showConfirmButton: true,
              confirmButtonText: "CREAR NUEVO EXPEDIENTE",
              showDenyButton: this.$store.state.itemsMasterList.length > 0,
              denyButtonText: "SELECCIONAR EXPEDIENTE YA CREADO",
              showCloseButton: true,
              showCancelButton: false,
              allowOutsideClick: false,
            }).then(async (res) => {
              if (res.isConfirmed) {
                Swal.fire({
                  icon: "warning",
                  width: 1000,
                  title: "Fecha de Disponibilidad - Master",
                  html: `<input type="date" id="swal-input1" class="swal2-input">
              <p>Si es Importación seria el ETA </p>
              <p>SI  es Exportación Colocar el ETD </p>
              <p style="color:red">Esto te Ayudara a Controlar tus Operaciones  </p>


              `,
                  allowOutsideClick: false,
                  confirmButtonText: "ACEPTAR",
                  showCancelButton: true,
                  cancelButtonText: "CANCELAR",
                  preConfirm: () => {
                    const dateInput =
                      document.getElementById("swal-input1").value;
                    if (!dateInput) {
                      Swal.showValidationMessage(
                        "La fecha de validez es requerida",
                      );
                    } else {
                      const selectedDate = moment(dateInput, "YYYY-MM-DD"); // Parsea la fecha ingresada
                      const currentDate = moment(); // Obtiene la fecha actual

                      if (selectedDate.isSameOrBefore(currentDate)) {
                        Swal.showValidationMessage(
                          "La fecha debe ser mayor que la fecha actual",
                        );
                      } else {
                        return dateInput;
                      }
                    }
                  },
                }).then(async (res) => {
                  this.fecha_validez = res.value;
                  console.log(
                    "b",
                    this.$store.state.pricing.listIngresosInstructivoAprobar,
                  );
                  let sum =
                    this.$store.state.pricing.listIngresosInstructivoAprobar.filter(
                      (v) => v.nro_propuesta == this.nro_propuesta,
                    );
                  let igv =
                    this.$store.state.pricing.listIngresosInstructivoAprobar
                      .filter((v) => v.nro_propuesta == this.nro_propuesta)[0]
                      .dataIngresos.filter(
                        (v) => v.descripcion === "TOTAL",
                      )[0].igv;
                  let valor =
                    this.$store.state.pricing.listIngresosInstructivoAprobar
                      .filter((v) => v.nro_propuesta == this.nro_propuesta)[0]
                      .dataIngresos.filter(
                        (v) => v.descripcion === "TOTAL",
                      )[0].valor;
                  let listCostosInstructivo =
                    this.$store.state.pricing.listIngresosInstructivoAprobar.filter(
                      (v) => v.nro_propuesta == this.nro_propuesta,
                    )[0].dataCostos;
                  let listVentasInstructivo =
                    this.$store.state.pricing.listIngresosInstructivoAprobar.filter(
                      (v) => v.nro_propuesta == this.nro_propuesta,
                    )[0].dataVentas;
                  if (res.isConfirmed) {
                    Swal.fire({
                      icon: "info",
                      title: "Aprobando Cotizacion",
                      timerProgressBar: true,
                      allowOutsideClick: false,
                      timer: null,
                      didOpen: () => {
                        Swal.showLoading();
                      },
                    });
                    await vm.aprobarCotizacion({
                      id_quote: vm.$route.params.id,
                      nuevoexpediente: true,
                      id_exp: vm.id_exp,
                      fecha_validez: vm.fecha_validez,
                      totalIngreso: valor,
                      igvIngreso: igv,
                      valorIngreso: valor,
                      listCostosInstructivo: listCostosInstructivo,
                      listVentasInstructivo: listVentasInstructivo,
                      id_house: this.id_house,
                      id_opcion: this.id_opcion,
                    });
                    this.$store.state.spiner = true;

                    this.$store.state.spiner = false;
                  }
                });
              }
              if (res.isDenied) {
                this.nuevoexpediente = false;
                this.aprobarflag = true;
              }
            });
          });
        } else {
          this.nuevoexpediente = true;
          this.id_exp = "";
          let vm = this;
          Swal.fire({
            icon: "question",
            iconColor: "red",
            width: 1000,
            html:
              this.$store.state.itemsMasterList.length > 0
                ? "<h1>¿Desea crear un nuevo expediente o seleccionar uno registrado?</h1>"
                : "<h1>¿Desea crear un nuevo expediente?</h1>",
            showConfirmButton: true,
            confirmButtonText: "CREAR NUEVO EXPEDIENTE",
            showDenyButton: this.$store.state.itemsMasterList.length > 0,
            denyButtonText: "SELECCIONAR EXPEDIENTE YA CREADO",
            showCloseButton: true,
            showCancelButton: false,
            allowOutsideClick: false,
          }).then(async (res) => {
            if (res.isConfirmed) {
              Swal.fire({
                icon: "warning",
                width: 1000,
                title: "Fecha de Disponibilidad - Master",
                html: `<input type="date" id="swal-input1" class="swal2-input">
              <p>Si es Importación seria el ETA </p>
              <p>SI  es Exportación Colocar el ETD </p>
              <p style="color:red">Esto te Ayudara a Controlar tus Operaciones  </p>


              `,
                allowOutsideClick: false,
                confirmButtonText: "ACEPTAR",
                showCancelButton: true,
                cancelButtonText: "CANCELAR",
                preConfirm: () => {
                  const dateInput =
                    document.getElementById("swal-input1").value;
                  if (!dateInput) {
                    Swal.showValidationMessage(
                      "La fecha de validez es requerida",
                    );
                  } else {
                    const selectedDate = moment(dateInput, "YYYY-MM-DD"); // Parsea la fecha ingresada
                    const currentDate = moment(); // Obtiene la fecha actual

                    if (selectedDate.isSameOrBefore(currentDate)) {
                      Swal.showValidationMessage(
                        "La fecha debe ser mayor que la fecha actual",
                      );
                    } else {
                      return dateInput;
                    }
                  }
                },
              }).then(async (res) => {
                this.fecha_validez = res.value;
                console.log(
                  "a",
                  this.$store.state.pricing.listIngresosInstructivoAprobar,
                );
                let sum =
                  this.$store.state.pricing.listIngresosInstructivoAprobar.filter(
                    (v) => v.nro_propuesta == this.nro_propuesta,
                  );
                let igv =
                  this.$store.state.pricing.listIngresosInstructivoAprobar
                    .filter((v) => v.nro_propuesta == this.nro_propuesta)[0]
                    .dataIngresos.filter(
                      (v) => v.descripcion === "TOTAL",
                    )[0].igv;
                let valor =
                  this.$store.state.pricing.listIngresosInstructivoAprobar
                    .filter((v) => v.nro_propuesta == this.nro_propuesta)[0]
                    .dataIngresos.filter(
                      (v) => v.descripcion === "TOTAL",
                    )[0].valor;
                let listCostosInstructivo =
                  this.$store.state.pricing.listIngresosInstructivoAprobar.filter(
                    (v) => v.nro_propuesta == this.nro_propuesta,
                  )[0].dataCostos;
                let listVentasInstructivo =
                  this.$store.state.pricing.listIngresosInstructivoAprobar.filter(
                    (v) => v.nro_propuesta == this.nro_propuesta,
                  )[0].dataVentas;
                if (res.isConfirmed) {
                  Swal.fire({
                    icon: "info",
                    title: "Aprobando Cotizacion",
                    timerProgressBar: true,
                    allowOutsideClick: false,
                    timer: null,
                    didOpen: () => {
                      Swal.showLoading();
                    },
                  });
                  await vm.aprobarCotizacion({
                    id_quote: vm.$route.params.id,
                    nuevoexpediente: true,
                    id_exp: vm.id_exp,
                    fecha_validez: vm.fecha_validez,
                    totalIngreso: valor,
                    igvIngreso: igv,
                    valorIngreso: valor,
                    listCostosInstructivo: listCostosInstructivo,
                    listVentasInstructivo: listVentasInstructivo,
                    id_house: this.id_house,
                    id_opcion: this.id_opcion,
                  });
                  this.$store.state.spiner = true;

                  this.$store.state.spiner = false;
                }
              });
            }
            if (res.isDenied) {
              this.nuevoexpediente = false;
              this.aprobarflag = true;
            }
          });
        }
      }
    },
    async validarExistePagosMaster() {
      this.activarBtnContinuar = true;
      this.textValidacionPago = "";
      if (this.id_opcion == "1") {
        var config = {
          method: "get",
          url: process.env.VUE_APP_URL_MAIN + "validar_existe_pago_master",
          headers: {
            "Content-Type": "application/json",
            "auth-token": sessionStorage.getItem("auth-token"),
          },
          params: {
            id: this.id_exp,
          },
        };
        let res = await axios(config).then((res) => {
          return res.data;
        });
        this.activarBtnContinuar = res.estadoflag;
        this.textValidacionPago = res.mensaje;
        this.loading = false;
        return;
      }
      this.activarBtnContinuar = false;
    },
    async validarExistePagosHouse() {
      this.activarBtnContinuar = true;
      this.textValidacionPago = "";

      var config = {
        method: "get",
        url: process.env.VUE_APP_URL_MAIN + "validar_existe_pago_house",
        headers: {
          "Content-Type": "application/json",
          "auth-token": sessionStorage.getItem("auth-token"),
        },
        params: {
          id: this.id_house,
        },
      };
      let res = await axios(config).then((res) => {
        return res.data;
      });
      this.activarBtnContinuar = res.estadoflag;
      this.textValidacionPago = res.mensaje;
      return;
    },
    async buscarHouseAsociadosAMaster() {
      this.lstHouse = [];
      var config = {
        method: "get",
        url: process.env.VUE_APP_URL_MAIN + "cargar_house_asociado_master",
        headers: {
          "Content-Type": "application/json",
          "auth-token": sessionStorage.getItem("auth-token"),
        },
        params: {
          id_master: this.id_exp,
        },
      };
      this.loading = true;
      let res = await axios(config).then((res) => {
        return res.data;
      });
      this.loading = false;

      if (!!res.estadoflag) {
        this.lstHouse = res.data;
      }
      this.lstHouse.unshift({
        id: 0,
        code_house: "CREAR UN NUEVO HOUSE",
      });
      this.activarBtnContinuar = true;
      this.textValidacionPago = "";
      this.aprobarflag = false;
      this.dialogHouse = true;
    },
    continuarAprobar() {
      this.id_opcion = "";
      this.aprobarflag = false;
      this.dialogCostos = true;
    },
    async aprobar() {
      await this.generaInstructivoparaguardata();

      let sum = this.$store.state.pricing.listIngresosInstructivoAprobar.filter(
        (v) => v.nro_propuesta == this.nro_propuesta,
      );
      let igv = this.$store.state.pricing.listIngresosInstructivoAprobar
        .filter((v) => v.nro_propuesta == this.nro_propuesta)[0]
        .dataIngresos.filter((v) => v.descripcion === "TOTAL")[0].igv;
      let valor = this.$store.state.pricing.listIngresosInstructivoAprobar
        .filter((v) => v.nro_propuesta == this.nro_propuesta)[0]
        .dataIngresos.filter((v) => v.descripcion === "TOTAL")[0].valor;
      let listCostosInstructivo =
        this.$store.state.pricing.listIngresosInstructivoAprobar.filter(
          (v) => v.nro_propuesta == this.nro_propuesta,
        )[0].dataCostos;
      let listVentasInstructivo =
        this.$store.state.pricing.listIngresosInstructivoAprobar.filter(
          (v) => v.nro_propuesta == this.nro_propuesta,
        )[0].dataVentas;
      if (this.$refs.frmAprobar.validate()) {
        Swal.fire({
          icon: "info",
          title: "Aprobando Cotizacion",
          timerProgressBar: true,
          allowOutsideClick: false,
          timer: null,
          didOpen: () => {
            Swal.showLoading();
          },
        });
        await this.aprobarCotizacion({
          id_quote: this.$route.params.id,
          nuevoexpediente: false,
          id_exp: this.id_exp,
          fecha_validez: this.fecha_validez,
          totalIngreso: valor,
          igvIngreso: igv,
          valorIngreso: valor,
          listCostosInstructivo: listCostosInstructivo,
          listVentasInstructivo: listVentasInstructivo,
          id_house: this.id_house,
          id_opcion: this.id_opcion,
          id_opcion_house: this.id_opcion_house,
        });
        this.$store.state.spiner = true;
        this.aprobarflag = false;
        this.$store.state.spiner = false;
      }
    },

    noDataText() {
      return `No se encontraron Masters con la misma Modalidad, Tipo de Carga, Incoterms y/o Puerto Origen/ Destino asociados a la cotización.`;
    },
    getProveedor(element) {
      let id_proveedor = element.listCostos.some(
        (v) => v.code_cost == 4 && v.esopcionflag == 1,
      )
        ? element.listCostos.filter(
            (v) => v.code_cost == 4 && v.esopcionflag == 1,
          )[0].id_proveedor
        : "";
      let nameProveedor = id_proveedor
        ? this.$store.state.provedores.filter((v) => v.id == id_proveedor)[0]
            .namelong
        : "";
      return nameProveedor;
    },
  },
};
</script>

<style scoped>
.header[data-v-44bc4a93] {
  background: #3949ab;
  color: white !important;
  align-content: center !important;
  /* text-align: center !important; */
}
.align-left {
  text-align: left !important;
}
.align-center {
  text-align: center !important;
}
.align-right {
  text-align: right !important;
}

.totalClass {
  font-weight: bold;
  /* background: #1a237e !important; */
  background: #42a5f5 !important;
  color: black !important;
}
.subTotalClass {
  font-weight: bold;
  background: #bbdefb !important;
  color: black !important;
}

.flotante {
  position: fixed !important;
  z-index: 99;
  /* bottom: 40px;
	right: 40px; */
}
#create .v-speed-dial {
  position: absolute;
}

#create .v-btn--floating {
  position: relative;
}
.header align-right[data-v-44bc4a93] {
  background: #3949ab;
  color: white !important;
  align-content: center !important;
  text-align: center !important;
}
.align-right {
  text-align: right !important;
}

.totalClass {
  font-weight: bold;
  /* background: #1a237e !important; */
  background: #42a5f5 !important;
  color: black !important;
}
.subTotalClass {
  font-weight: bold;
  background: #bbdefb !important;
  color: black !important;
}

.flotante {
  position: fixed !important;
  z-index: 99;
  /* bottom: 40px;
	right: 40px; */
}
#create .v-speed-dial {
  position: absolute;
}

#create .v-btn--floating {
  position: relative;
}
/* .tableClass:hover[data-v-44bc4a93] { */
/* .v-data-table >>> tr:hover {
  background: unset !important;
} */
.classDialog {
  min-height: 900px !important;
}
</style>
