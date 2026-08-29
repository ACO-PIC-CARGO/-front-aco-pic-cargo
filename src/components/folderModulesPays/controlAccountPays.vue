<template>
  <v-card elevation="0">
    <v-card-title v-if="tipo == 'ver'">
      VER FACTURA TIPO
      {{ radio == 1 ? "ADMNINISTRATIVA" : "OPERATIVA" }}</v-card-title
    >
    <v-card-title v-if="tipo == 'editar'">
      EDITAR FACTURA TIPO
      {{ radio == 1 ? "ADMNINISTRATIVA" : "OPERATIVA" }}</v-card-title
    >
    <v-card-title v-else> CARGAR UNA CUENTA POR PAGAR </v-card-title>
    <v-card-text>
      <v-radio-group v-model="radio" row v-if="tipo == 'nuevo'">
        <v-radio value="1" label="Administrativa"></v-radio>
        <v-radio value="2" label="Operativa"></v-radio>
      </v-radio-group>
      <v-form ref="frmFactura">
        <v-row dense>
          <v-col cols="12" md="6" v-if="radio == 2">
            <v-autocomplete
              :items="itemsExpedientes"
              item-text="namelong"
              item-value="id"
              label="Expediente"
              v-model="id_expediente"
              :disabled="radio == ''"
              @change="_getProformace()"
              :rules="[(v) => !!v || 'Datos Requerido']"
            >
            </v-autocomplete>
          </v-col>
          <v-col cols="12" md="6" v-if="radio == 1">
            <v-row dense>
              <v-col cols="12" md="6">
                <v-autocomplete
                  :items="$store.state.month"
                  item-text="description"
                  item-value="id"
                  label="Mes del Gasto"
                  v-model="id_month"
                  :disabled="radio == ''"
                  :rules="[(v) => !!v || 'Datos Requerido']"
                >
                </v-autocomplete>
              </v-col>
              <v-col cols="12" md="6">
                <v-autocomplete
                  :items="$store.state.year"
                  item-text="description"
                  item-value="id"
                  label="Año del Gasto"
                  v-model="id_year"
                  :disabled="radio == ''"
                  :rules="[(v) => !!v || 'Datos Requerido']"
                >
                </v-autocomplete>
              </v-col>
            </v-row>
          </v-col>
          <v-col cols="12" md="6" class="pb-0">
            <custom-tree-select
              v-model="id_gastos"
              :options="$store.state.balances.arbolGastos"
              :rules="[(v) => !!v || 'Dato Requerido']"
              :disabled="radio == ''"
              :outlined="false"
              :dense="false"
              placeholder="Seleccione un Sub Gasto"
              search-nested
              :disable-branch-nodes="true"
              :multiple="false"
            />
          </v-col>
          <v-col cols="12" md="6">
            <v-autocomplete
              :items="$store.state.performances"
              item-text="description"
              item-value="id"
              label="Tipo de Comprobante"
              v-model="id_proformace"
              :disabled="radio == ''"
              @change="validacionesRequeridas()"
              return-object
              :rules="[(v) => !!v || 'Datos Requerido']"
            >
            </v-autocomplete>
          </v-col>
          <v-col cols="12" md="6">
            <v-autocomplete
              :items="$store.state.itemsProveedorList"
              item-text="namelong"
              item-value="id"
              label="Proveedor"
              v-model="id_proveedor"
              :disabled="radio == ''"
              :rules="[(v) => !!v || 'Datos Requerido']"
            >
            </v-autocomplete>
          </v-col>

          <v-col cols="12" md="6">
            <v-text-field
              type="date"
              :disabled="radio == ''"
              label="Fecha Emisión de la Factura"
              v-model="date"
            ></v-text-field>
          </v-col>
          <v-col cols="12" md="6">
            <v-text-field
              v-model="nro_factura"
              :disabled="radio == ''"
              label="Nro. de Factura"
              :rules="[(v) => !!v || 'Datos Requerido']"
            ></v-text-field>
          </v-col>
          <v-col cols="12" md="6">
            <v-text-field
              v-model="nro_serie"
              :disabled="radio == ''"
              label="Nro. de Serie"
              :rules="[(v) => !!v || 'Datos Requerido']"
            ></v-text-field>
          </v-col>
          <v-col cols="12" md="6">
            <v-autocomplete
              :disabled="radio == ''"
              :items="$store.state.itemsCoinsList"
              v-model="id_coins"
              item-text="acronym"
              item-value="id"
              label="Moneda"
              return-object
              @change="obtenerPrefixCoins()"
              :rules="[(v) => !!v || 'Datos Requerido']"
            ></v-autocomplete>
          </v-col>
          <v-col cols="12" md="6">
            <v-text-field
              type="number"
              label="Tipo de Cambio"
              v-model="tipocambio"
              :disabled="radio == ''"
              @input="cambiarTipodeCambio()"
              v-if="id_coins && symbol != 'USD'"
            ></v-text-field>
          </v-col>

          <!-- SECCIÓN CONCEPTOS DE PAGO -->
          <v-col cols="12" class="mt-4">
            <v-card
              outlined
              color="#f2f8fd"
              class="pa-4 rounded-lg"
              style="border: 1.5px solid #a8d5e5 !important"
            >
              <!-- Encabezado con Icono -->
              <div class="d-flex align-center mb-2">
                <v-avatar color="white" size="36" class="mr-3 elevation-1">
                  <v-icon color="#009688">mdi-file-document-outline</v-icon>
                </v-avatar>
                <span
                  class="text-subtitle-1 font-weight-bold"
                  style="letter-spacing: 0.5px"
                >
                  CONCEPTOS DE PAGO
                </span>
              </div>

              <!-- Alerta Informativa -->
              <div class="d-flex align-center mb-4 pl-1" v-if="tipo !== 'ver'">
                <v-icon color="orange darken-2" small class="mr-1"
                  >mdi-alert-circle-outline</v-icon
                >
                <span
                  class="caption text-uppercase font-weight-bold orange--text text--darken-3"
                >
                  OBLIGATORIO:
                </span>
                <span class="caption grey--text text--darken-2 ml-1">
                  Añade al menos un concepto para continuar.
                </span>
              </div>

              <!-- Botón Añadir Concepto -->
              <v-btn
                block
                color="#009688"
                dark
                x-large
                elevation="0"
                class="text-uppercase font-weight-bold my-2"
                @click="abrirDialogNuevoProducto()"
                v-if="tipo !== 'ver'"
              >
                <v-icon left>mdi-plus</v-icon>
                Añadir Concepto de Pago
              </v-btn>

              <!-- Tabla de Conceptos (Muestra si existen registros activos) -->
              <v-simple-table
                dense
                v-if="itemsProductos.filter((v) => v.status == 1).length > 0"
                class="mt-4 white rounded"
              >
                <thead>
                  <tr>
                    <th v-if="tipo != 'ver'">Acciones</th>
                    <th>Producto / Concepto</th>
                    <th style="background: #adcaf5">Monto</th>
                    <th style="background: #adcaf5">
                      {{ $store.state.enterprises.impuesto.nombre_impuesto }}
                    </th>
                    <th style="background: #adcaf5">Total</th>
                    <th v-if="mostrarColumna()" style="background: #c7f7d7">
                      Monto (USD)
                    </th>
                    <th v-if="mostrarColumna()" style="background: #c7f7d7">
                      {{
                        $store.state.enterprises.impuesto.nombre_impuesto
                      }}(USD)
                    </th>
                    <th v-if="mostrarColumna()" style="background: #c7f7d7">
                      Total (USD)
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr
                    v-for="(productos, index) in itemsProductos.filter(
                      (v) => v.status == 1,
                    )"
                    :key="index"
                  >
                    <td v-if="tipo != 'ver'">
                      <v-btn
                        icon
                        color="red"
                        x-small
                        @click="eliminar(productos)"
                      >
                        <v-icon>mdi-delete</v-icon>
                      </v-btn>
                    </td>
                    <td>{{ productos.concepto }}</td>
                    <td>
                      <span v-if="tipo == 'ver'">{{ productos.monto }}</span>
                      <v-text-field
                        v-else
                        type="number"
                        v-model="productos.monto"
                        step="0.01"
                        @input="recalcularMonto(productos, index)"
                        style="max-width: 150px"
                        outlined
                        dense
                        hide-details
                        :prefix="symbol"
                      ></v-text-field>
                    </td>
                    <td v-if="productos.id != null">
                      {{ symbol }} {{ productos.igv }}
                    </td>
                    <td v-else>{{ symbol }} {{ productos.igv }}</td>
                    <td>
                      {{ symbol }} {{ parseFloat(productos.total).toFixed(2) }}
                    </td>
                    <td v-if="mostrarColumna()">
                      USD {{ productos.montodolar }}
                    </td>
                    <td v-if="mostrarColumna()">
                      USD {{ productos.igvdolar }}
                    </td>
                    <td v-if="mostrarColumna()">
                      USD {{ parseFloat(productos.totaldolar).toFixed(2) }}
                    </td>
                  </tr>
                  <!-- Fila Totales -->
                  <tr class="font-weight-bold">
                    <td v-if="tipo != 'ver'"></td>
                    <td>Total:</td>
                    <td>
                      {{ symbol }}
                      {{
                        parseFloat(
                          itemsProductos
                            .filter((v) => v.status == 1)
                            .reduce(
                              (sum, producto) =>
                                sum + parseFloat(producto.monto || 0),
                              0,
                            ),
                        ).toFixed(2)
                      }}
                    </td>
                    <td>
                      {{ symbol }}
                      {{
                        parseFloat(
                          itemsProductos
                            .filter((v) => v.status == 1)
                            .reduce(
                              (sum, producto) =>
                                sum + parseFloat(producto.igv || 0),
                              0,
                            ),
                        ).toFixed(2)
                      }}
                    </td>
                    <td>
                      {{ symbol }}
                      {{
                        parseFloat(
                          itemsProductos
                            .filter((v) => v.status == 1)
                            .reduce(
                              (sum, producto) =>
                                sum + parseFloat(producto.total || 0),
                              0,
                            ),
                        ).toFixed(2)
                      }}
                    </td>
                    <td v-if="mostrarColumna()">
                      USD
                      {{
                        parseFloat(
                          itemsProductos
                            .filter((v) => v.status == 1)
                            .reduce(
                              (sum, producto) =>
                                sum + parseFloat(producto.montodolar || 0),
                              0,
                            ),
                        ).toFixed(2)
                      }}
                    </td>
                    <td v-if="mostrarColumna()">
                      USD
                      {{
                        parseFloat(
                          itemsProductos
                            .filter((v) => v.status == 1)
                            .reduce(
                              (sum, producto) =>
                                sum + parseFloat(producto.igvdolar || 0),
                              0,
                            ),
                        ).toFixed(2)
                      }}
                    </td>
                    <td v-if="mostrarColumna()">
                      USD
                      {{
                        parseFloat(
                          itemsProductos
                            .filter((v) => v.status == 1)
                            .reduce(
                              (sum, producto) =>
                                sum + parseFloat(producto.totaldolar || 0),
                              0,
                            ),
                        ).toFixed(2)
                      }}
                    </td>
                  </tr>
                </tbody>
              </v-simple-table>
            </v-card>
          </v-col>
          <v-col cols="12">
            <ArrastraYSolarComponent
              :initial-url="payPath"
              :initial-id="id_path"
              :read-only="tipo === 'ver'"
              :rules="[(v) => !!v || 'El archivo soporte es obligatorio']"
              @idArchivoCargado="recibirId"
            />
          </v-col>
          <!-- ACCIONES (Botón inferior alineado a la derecha) -->
          <v-col cols="12" class="d-flex flex-column align-end mt-2">
            <!-- Texto de ayuda dinámico -->
            <span
              v-if="
                itemsProductos.length == 0 &&
                (tipo == 'nuevo' || tipo == 'editar')
              "
              class="caption grey--text text--darken-1 mb-2"
            >
              Primero añade un concepto de pago.
            </span>

            <!-- Botones de Acción -->
            <v-btn
              elevation="0"
              @click="_setInvoice()"
              color="primary"
              large
              v-if="tipo == 'nuevo'"
              :disabled="itemsProductos.length == 0"
              class="font-weight-bold text-uppercase"
            >
              GUARDAR CUENTA POR PAGAR
            </v-btn>

            <v-btn
              elevation="0"
              color="primary"
              large
              v-if="tipo == 'editar'"
              @click="setUpdateInvoiceAdmin()"
              :disabled="itemsProductos.length == 0"
              class="font-weight-bold text-uppercase"
            >
              GUARDAR CAMBIOS
            </v-btn>
          </v-col>
        </v-row>
      </v-form>
    </v-card-text>
    <v-dialog
      v-model="dialog"
      persistent
      :overlay="false"
      max-width="25%"
      transition="dialog-transition"
      class="mx-5"
    >
      <v-card>
        <v-card-title primary-title> Cargar Conceptos a Pagar </v-card-title>
        <v-form ref="validacionConcepto">
          <v-row class="ma-3">
            <v-col cols="12" md="12">
              <v-text-field
                placeholder="Descripción"
                label="Producto/ Concepto"
                v-model="producto.concepto"
                :rules="[(v) => !!v || 'Dato Requerido']"
                required
              ></v-text-field>
            </v-col>
            <v-col cols="12" md="12">
              <v-text-field
                placeholder="0.00"
                label="Monto"
                v-model="producto.monto"
                type="number"
                :prefix="symbol"
                :rules="[validarMonto]"
              ></v-text-field>
            </v-col>
            <v-col cols="12" md="12">
              <v-radio-group row v-model="producto.afecto">
                <v-radio label="Afecto" value="true"></v-radio>
                <v-radio label="No Afecto" value="false"></v-radio>
              </v-radio-group>
            </v-col>
            <v-col cols="12" md="12">
              <v-btn
                color="success"
                class="mx-1"
                small
                @click="añadirProducto()"
              >
                Aceptar
              </v-btn>
              <v-btn color="warning" class="mx-1" small @click="dialog = false">
                Cancelar
              </v-btn>
            </v-col>
          </v-row>
        </v-form>
      </v-card>
    </v-dialog>
  </v-card>
</template>
<script>
import axios from "@/api/axios-config";
import { mapActions, mapState } from "vuex";
// import the component
import Treeselect from "@riophae/vue-treeselect";
// import the styles
import "@riophae/vue-treeselect/dist/vue-treeselect.css";
import CustomTreeSelect from "./../comun/CustomTreeSelect.vue";
import Swal from "sweetalert2";
import ArrastraYSolarComponent from "../comun/ArrastraYSolarComponent.vue";
export default {
  name: "controlAccountPaysCom",
  props: {
    operativa: "",
    exp: "",
    pro: "",
    id_pro: "",
    tipo: "",
  },
  components: { Treeselect, CustomTreeSelect, ArrastraYSolarComponent },

  data: () => ({
    date: new Date(Date.now() - new Date().getTimezoneOffset() * 60000)
      .toISOString()
      .substr(0, 10),
    row: "",
    id_gastos: null,
    menu: false,
    modal: false,
    menu2: false,
    dialog: false,
    radio: "",
    itemsProveedores: [],
    dataList: false,
    payfile: [],
    payPath: "",
    id_path: "",
    pathfile: "",
    tipocambio: 1,
    pathfileAll: "",
    payPathName: "",
    boolFile: false,
    itemsExpedientes: [],
    itemsProformace: [],
    itemsProductos: [],
    name_path: "",
    producto: {},
    facturaFlag: false,
    serieFlag: false,
    id_proformace: "",
    symbol: "",
    id_expediente: "",

    id_proveedor: "",
    fecha: "",
    nro_factura: "",
    nro_serie: "",
    id_coins: "",
    monto: "",
    igv: "",
    total: {
      monto: 0,
      total: 0,
    },
    dialogPro: false,
    conceptoRule: [(v) => !!v || "Descripción Requerida"],
    id_month: "",
    id_year: "",
    errorGasto: "",
    // id_subgasto: "",
  }),
  async mounted() {
    this.$store.state.spiner = true;

    this.cleanData();

    await Promise.all([
      this.obtenerImpuestoXEmpresa(),
      this._getPerformance(),
      this.getArbolGastos(),
      this._getChargeMonth(),
      this._getChargeYear(),
      this._getCoinsList(),
      this._getProveedor(),
    ]);
    this._valida();
    if (this.tipo == "ver" || this.tipo == "editar") {
      await this._getInvoiceAdmin(this.$route.params.id);
    }
    setTimeout(() => {
      this.producto = {
        concepto: "",
        monto: null,
        afecto: "true",
        total: 0,
      };
    }, 600);
    this.$store.state.spiner = false;
    this.$store.state.drawer = false;
  },
  computed: {
    ...mapState(["performances", "InvoiceAdmin"]),
  },
  methods: {
    ...mapActions([
      "_getBanksList",
      "_getCoinsList",
      "_getPerformance",
      "_getChargeMonth",
      "_getChargeYear",
      "_getInvoiceAdmin",
      "_getInvoice",
      "getArbolGastos",
      "_getProveedor",
      "obtenerImpuestoXEmpresa",
    ]),
    recibirId(file) {
      if (Object.keys(file).length > 0) {
        this.payPath = file.id;
        this.id_path = file.id;
      } else {
        this.payPath = null;
        this.id_path = null;
      }
    },
    validarMonto(v) {
      if (!v) return "Dato Requerido";

      if (this.id_proformace.code === "07") {
        return Number(v) !== 0 || "El monto no puede ser cero";
      }
      return Number(v) > 0 || "Monto Mayor que 0.00";
    },
    abrirDialogNuevoProducto() {
      if (!this.id_coins) {
        Swal.fire({
          icon: "warning",
          title: "Advertencia",
          text: "Es necesario seleccionar una moneda.",
        });
        return false;
      }
      this.dialog = true;
    },
    abrirDialogNuevoProducto() {
      if (!this.id_proformace) {
        Swal.fire({
          icon: "warning",
          title: "Tipo de Comprobante Requerido",
          html: `
      <div style="text-align: left; font-size: 14px; color: #555; line-height: 1.5;">
        <p style="margin-bottom: 8px;">No se ha especificado el tipo de documento asociado.</p>
        <p style="margin: 0;"><b>Es necesario seleccionar un tipo de documento o proforma</b> para continuar con el registro del comprobante.</p>
      </div>
    `,
          confirmButtonText: "Entendido",
          confirmButtonColor: "#3085d6",
        });
        return false;
      }
      if (!this.id_coins) {
        Swal.fire({
          icon: "warning",
          title: "Selección de Moneda Requerida",
          html: `
      <div style="text-align: left; font-size: 14px; color: #555; line-height: 1.5;">
        <p style="margin-bottom: 8px;">No se ha especificado la divisa para esta transacción.</p>
        <p style="margin: 0;"><b>Es necesario seleccionar una moneda</b> para calcular correctamente los montos y conversiones del registro.</p>
      </div>
    `,
          confirmButtonText: "Entendido",
          confirmButtonColor: "#3085d6",
        });
        return false;
      }

      if (this.symbol !== "USD" && this.tipocambio <= 1) {
        Swal.fire({
          icon: "warning",
          title: "Validación de Tipo de Cambio",
          html: `
      <div style="text-align: left; font-size: 14px; color: #555; line-height: 1.5;">
        <p style="margin-bottom: 8px;">Se ha detectado una operación en moneda extranjera sin conversión válida.</p>
        <p style="margin: 0;"><b>Es necesario registrar un tipo de cambio mayor a 1</b> para continuar con el proceso de registro.</p>
      </div>
    `,
          confirmButtonText: "Entendido",
          confirmButtonColor: "#3085d6",
        });
        return;
      }
      this.dialog = true;
    },
    _valida() {
      if (this.operativa == 1) {
        this.radio = 2;
        this._getMasterList();
        this.id_expediente = this.exp;
        this._getProformace();
        this.id_proformace = this.pro;
        this.id_proveedor = this.id_pro;
      }
    },
    sendData() {
      this.id_proveedor = this.id_proformace.id_proveedor;
    },
    sendPro(id, idPro) {
      this.id_proformace = id;
      this.id_proveedor = idPro;
      this.dialogPro = false;
    },
    _callModalEntitie() {
      if (this.radio == 1) {
        this.$store.state.id_role_actual = 28;
        this.$store.state.modalAdmin = !this.$store.state.modalAdmin;
      } else if (this.radio == 2) {
        this.$store.state.id_role_actual = 15;
        this.$store.state.modalPro = !this.$store.state.modalPro;
      }
    },
    _uploadFile() {
      var FormData = require("form-data");
      var fs = require("fs");
      var data = new FormData();
      var vm = this;
      if (vm.radio == 1) {
        data.append("name", "Factura Administrativa");
      } else if (vm.radio == 2) {
        data.append("name", "Factura Operativa");
      }

      data.append("file", vm.payfile);

      var config = {
        method: "post",
        url: process.env.VUE_APP_URL_MAIN + "uploadAllPath",
        headers: {
          "Content-Type": "application/json",
        },
        data: data,
      };

      axios(config)
        .then(function (response) {
          vm.boolFile = true;
          vm.payPath = response.data.data[0].insertid;
          vm.id_path = response.data.data[0].insertid;
        })
        .catch(function (error) {
          console.error(error);
        });
    },
    async _getMasterList() {
      var vm = this;
      let data = {
        id_branch: JSON.parse(sessionStorage.getItem("dataUser"))[0].id_branch,
      };
      var config = {
        method: "get",
        url: process.env.VUE_APP_URL_MAIN + "getHouseListAll",
        data: data,
        headers: {
          "Content-Type": "application/json",
        },
      };
      await axios(config)
        .then(function (response) {
          vm.itemsExpedientes = response.data.data;
        })
        .catch(function (error) {
          console.error(error);
        });
    },
    async _getProformace() {
      var vm = this;

      var data = {
        id_house: vm.id_expediente,
      };

      var config = {
        method: "post",
        url: process.env.VUE_APP_URL_MAIN + "getListInvoiceExp",

        headers: {
          "Content-Type": "application/json",
        },
        data: data,
      };
      await axios(config)
        .then(function (response) {
          vm.itemsProformace = response.data.data;
        })
        .catch(function (error) {
          console.error(error);
        });
    },
    recalcularMonto(prod, index) {
      console.log("prod", prod);
      let igv = 0;
      let igvdolar = 0;
      let total = parseFloat(prod.monto);
      let montodolar = parseFloat(prod.monto / this.tipocambio);
      let totaldolar = parseFloat(prod.monto / this.tipocambio);
      // ------------------------------
      if (prod.afecto == "true" || prod.afecto == 1) {
        igv =
          (parseFloat(prod.monto) *
            this.$store.state.enterprises.impuesto.impuesto) /
          100;

        igvdolar = parseFloat(igv / this.tipocambio);

        totaldolar += parseFloat(igvdolar);
        console.log("totaldolar", totaldolar);
        total += parseFloat(igv);
      }
      // ------------------------------

      let producto = {
        id: prod.id,
        concepto: prod.concepto,
        monto: prod.monto,
        montodolar: parseFloat(montodolar).toFixed(2),
        igv: parseFloat(igv).toFixed(2),
        igvdolar: parseFloat(igvdolar).toFixed(2),
        afecto: prod.afecto,
        status: 1,
        total: total,
        totaldolar: totaldolar,
      };

      // Usar Vue.set para actualizar reactividad en Vue 2
      this.$set(this.itemsProductos, index, { ...producto });

      // console.log(
      //   "Producto después de actualizar:",
      //   this.itemsProductos[index]
      // );
    },
    cleanData() {
      this.radio = "";
      this.id_proveedor = "";
      this.fecha = "";
      this.nro_factura = "";
      this.nro_serie = "";
      this.id_coins = "";
      this.monto = "";
      this.igv = "";
      this.total = "";
      this.payPath = "";
      this.id_path = "";
      this.boolFile = false;
      this.facturaFlag = false;
      this.serieFlag = false;
    },
    async _setInvoice() {
      var vm = this;
      vm.errorGasto = "";
      if (this.itemsProductos.length == 0) {
        vm.$swal({
          icon: "error",
          title: "Aviso",
          text: "Debes cargar el concepto a pagar y su monto para poder registrar la factura.",
          allowEnterKey: false,
          allowOutsideClick: false,
        }).then((res) => {
          if (res.isConfirmed) {
            this.dialog = true;
          }
        });
        return false;
      }
      if (this.$refs.frmFactura.validate() && this.id_gastos) {
        vm.$swal({
          icon: "info",
          title: "Guardando...",
          text: "Por favor espere",
        });

        var data = {
          type_payment: vm.radio || vm.radio != "" ? vm.radio : null,
          id_expediente:
            vm.id_expediente || vm.id_expediente != ""
              ? vm.id_expediente
              : null,
          id_proveedor:
            vm.id_proveedor || vm.id_proveedor != "" ? vm.id_proveedor : null,
          fecha: vm.date || vm.date != "" ? vm.date : null,
          nro_factura:
            vm.nro_factura || vm.nro_factura != "" ? vm.nro_factura : null,
          nro_serie: vm.nro_serie || vm.nro_serie != "" ? vm.nro_serie : null,
          id_coins:
            vm.id_coins.id || vm.id_coins.id != "" ? vm.id_coins.id : null,
          monto: vm.total.total || vm.total.total != "" ? vm.total.total : null,
          montodolar:
            vm.total.totaldolar || vm.total.totaldolar != ""
              ? vm.total.totaldolar
              : null,
          type_igv: vm.igv || vm.igv != "" ? vm.igv : null,
          total: vm.total.total || vm.total.total != "" ? vm.total.total : null,
          id_path: vm.id_path || vm.id_path != "" ? vm.id_path : null,
          detalle: vm.itemsProductos.filter((v) => v.status == 1),
          id_proformance:
            vm.id_proformace.id || vm.id_proformace.id != ""
              ? vm.id_proformace.id
              : null,
          id_month: vm.id_month || vm.id_month != "" ? vm.id_month : null,
          id_year: vm.id_year || vm.id_year != "" ? vm.id_year : null,
          status: 1,
          tipocambio: vm.tipocambio,
          id_gastos: vm.id_gastos,
          id_branch: JSON.parse(sessionStorage.getItem("dataUser"))[0]
            .id_branch,
        };
        var config = {
          method: "post",
          url: process.env.VUE_APP_URL_MAIN + "setInvoiceAdmin",

          headers: {
            "Content-Type": "application/json",
          },
          data: data,
        };
        await axios(config)
          .then(function (response) {
            vm.itemsInvoice = response.data.data;

            vm.$swal({
              icon: "success",
              title: "Documento Cargado",
              text: "El documento ha sido cargado correctamente",
            });

            if (vm.radio == 1 && vm.id_proformace > 0) {
              vm.putPro();
            } else {
              vm.$router.back();
              vm.cleanData();
            }

            vm._getInvoice();
            vm.dialogInvoice = false;
          })
          .catch(function (error) {
            console.error(error);
          });
      } else {
        vm.errorGasto = "Dato Requerido";
      }
    },
    async setUpdateInvoiceAdmin() {
      var vm = this;
      vm.errorGasto = "";
      if (this.$refs.frmFactura.validate() && this.id_gastos) {
        vm.$swal({
          icon: "info",
          title: "Guardando...",
          text: "Por favor espere",
        });

        var data = {
          type_payment: vm.radio,
          id_expediente: vm.id_expediente,
          id_proveedor: vm.id_proveedor,
          fecha: vm.date,
          nro_factura: vm.nro_factura,
          nro_serie: vm.nro_serie,
          id_coins: vm.id_coins.id ? vm.id_coins.id : vm.id_coins,
          monto: vm.total.total,
          montodolar: vm.total.montodolar,
          type_igv: vm.igv,
          //igv: vm.,
          total: vm.total.total,
          status: 1,
          id_path: vm.id_path,
          detalle: vm.itemsProductos.filter((v) => v.status == 1),
          id_proformance: vm.id_proformace,
          id_month: vm.id_month,
          id_year: vm.id_year,
          id: vm.$route.params.id,
          tipocambio: vm.tipocambio,
          id_gastos: vm.id_gastos,
        };
        var config = {
          method: "put",
          url: process.env.VUE_APP_URL_MAIN + "setUpdateInvoiceAdmin",

          headers: {
            "Content-Type": "application/json",
          },
          data: data,
        };
        await axios(config)
          .then(function (response) {
            vm.itemsInvoice = response.data.data;
            if (response.data.data.estado) {
              vm.$swal({
                icon: "success",
                title: "Documento Cargado",
                text: "El documento ha sido actualizado correctamente",
              });
            }

            // vm.$router.push({
            //   name: "viewAccountPays",
            //   params: { id: vm.$route.params.id },
            // });
            // vm._getInvoice();
            vm.dialogInvoice = false;
          })
          .catch(function (error) {
            console.error(error);
          });
      } else {
        vm.errorGasto = "Dato Requerido";
      }
    },

    async putPro() {
      var vm = this;

      var data = {
        id_path: vm.id_path,
        id_proformace: vm.id_proformace,
      };
      var config = {
        method: "post",
        url: process.env.VUE_APP_URL_MAIN + "putPro",

        headers: {
          "Content-Type": "application/json",
        },
        data: data,
      };
      await axios(config)
        .then(function (response) {
          vm.cleanData();

          vm._getInvoice();
          vm.$router.back();
          vm.dialogInvoice = false;
        })
        .catch(function (error) {
          console.error(error);
        });
    },

    añadirProducto() {
      if (!this.$refs.validacionConcepto.validate()) return;

      let igv = 0;
      let igvdolar = 0;
      let total = parseFloat(this.producto.monto);
      let montodolar = parseFloat(this.producto.monto / this.tipocambio);
      let totaldolar = parseFloat(this.producto.monto / this.tipocambio);
      // ------------------------------
      if (this.producto.afecto == "true" || this.producto.afecto == 1) {
        igv =
          (parseFloat(this.producto.monto) *
            this.$store.state.enterprises.impuesto.impuesto) /
          100;

        igvdolar = parseFloat(igv / this.tipocambio);

        totaldolar += parseFloat(igvdolar);
        console.log("totaldolar", totaldolar);
        total += parseFloat(igv);
      }
      // ------------------------------

      let producto = {
        id: null,
        concepto: this.producto.concepto,
        monto: this.producto.monto,
        montodolar: parseFloat(montodolar).toFixed(2),
        igv: parseFloat(igv).toFixed(2),
        igvdolar: parseFloat(igvdolar).toFixed(2),
        afecto: this.producto.afecto,
        status: 1,
        total: total,
        totaldolar: totaldolar,
      };

      this.itemsProductos.push(producto);
      this.dialog = false;
      this.producto = {
        concepto: "",
        monto: null,
        afecto: true,
        total: 0,
      };

      this.calculcularTotal();
    },
    eliminar(producto) {
      this.itemsProductos.filter((v) => v == producto)[0].status = 0;
      setTimeout(() => {
        this.calculcularTotal();
      }, 200);
    },
    calculcularTotal() {
      let totalF = {
        monto: 0,
        igv: 0,
        total: 0,
        montodolar: 0,
        igvdolar: 0,
        totaldolar: 0,
      };
      this.itemsProductos
        .filter((v) => v.status == 1)
        .forEach((element) => {
          totalF.monto += parseFloat(element.monto);
          totalF.igv += parseFloat(element.igv);
          totalF.total += parseFloat(element.total);
          totalF.montodolar += parseFloat(element.montodolar);
          totalF.igvdolar += parseFloat(element.igvdolar);
          totalF.totaldolar += parseFloat(element.totaldolar);
        });

      this.total = totalF;
    },

    cambiarTipodeCambio() {
      this.itemsProductos.forEach((element) => {
        this.recalcularMonto(element, this.itemsProductos.indexOf(element));
      });

      this.calculcularTotal();
    },
    validacionesRequeridas() {
      switch (this.id_proformace.code) {
        case "002":
          this.facturaFlag = true;
          this.serieFlag = true;
          break;

        default:
          this.facturaFlag = false;
          this.serieFlag = false;
          break;
      }
    },
    obtenerPrefixCoins() {
      this.symbol = this.id_coins.symbol;
      this.tipocambio = 1;
      this.cambiarTipodeCambio();
    },
    validarFormulario() {
      let mensaje = "";
      let validacion = true;
      if (this.radio == "") {
        mensaje += " Seleccione una opcion Administrativa / Operativa.";
        validacion = false;
      } else {
        if ((this.id_month == "" || this.id_year == "") && this.radio == 1) {
          mensaje += "Seleccione un mes y año correspondiente a la factura.";
          validacion = false;
        }
        if (
          (this.facturaFlag && this.nro_factura == "") ||
          (this.serieFlag && this.nro_serie == "")
        ) {
          mensaje += "La factura y el número de serie son requerido.";
          validacion = false;
        }

        if (this.itemsProductos.length == 0) {
          mensaje +=
            " Para guardar la factura se necesita al menos un producto/ concepto.";
          validacion = false;
        }
      }
      if (validacion == false) {
        this.$swal({
          icon: "error",
          title: "Advertencia...",
          text: mensaje,
        });
      }

      return validacion;
    },
    mostrarColumna() {
      if (this.symbol == "USD") {
        return false;
      }
      return true;
    },
  },
  watch: {
    InvoiceAdmin() {
      var vm = this;

      vm.id_proformace = vm.InvoiceAdmin[0].id_proformace;
      vm.id_expediente = vm.InvoiceAdmin[0].id_expediente;
      vm.id_proveedor = vm.InvoiceAdmin[0].id_proveedor;
      vm.date = new Date(vm.InvoiceAdmin[0].fecha)
        .toISOString()
        .substring(0, 10);
      vm.nro_factura = vm.InvoiceAdmin[0].nro_factura;
      vm.nro_serie = vm.InvoiceAdmin[0].nro_serie;
      vm.id_coins = vm.InvoiceAdmin[0].id_coins;
      vm.monto = vm.InvoiceAdmin[0].monto;
      vm.radio = vm.InvoiceAdmin[0].type_payment;
      vm.payPathName = vm.InvoiceAdmin[0].originalname;
      vm.id_path = vm.InvoiceAdmin[0].id_path;
      vm.payPath = vm.InvoiceAdmin[0].path;
      vm.id_path = vm.InvoiceAdmin[0].id_path;
      vm.id_proformace = vm.InvoiceAdmin[0].id_proformance;
      vm.id_month = vm.InvoiceAdmin[0].id_month;
      vm.id_year = vm.InvoiceAdmin[0].id_year;
      vm.tipocambio = vm.InvoiceAdmin[0].tipocambio;
      vm.id_gastos = vm.InvoiceAdmin[0].id_subgasto;
      vm.id_gastos = vm.InvoiceAdmin[0].id_subgasto;
      vm.name_path = vm.InvoiceAdmin[0].name_path;
      // DETALLES
      vm.itemsProductos = vm.InvoiceAdmin[0].details;

      vm.calculcularTotal();
      // setTimeout(async () => {
      //   await this._getProveedor();
      // }, 200);
    },
    async radio() {
      //  await this._getMasterList();

      let vm = this;
      if (vm.itemsExpedientes.length == 0 && vm.radio == 2) {
        this.$store.state.spiner = true;
        await this._getMasterList();
        this.$store.state.spiner = false;
      }
    },
  },
};
</script>
