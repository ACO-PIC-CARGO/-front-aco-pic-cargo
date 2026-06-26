<template>
  <div>
    <v-container fluid>
      <v-row>
        <v-col cols="9" md="8">
          <v-card class="cardHouse">
            <v-card-text>
              <dataHouse />
            </v-card-text>
          </v-card>
        </v-col>
        <v-col>
          <v-btn
            v-if="!this.$route.params.id_control"
            block
            @click="_setControl"
            :disabled="$store.state.dataControl_Numero != ''"
            color="primary"
            >GENERAR CONTROL</v-btn
          >
          <v-btn
            v-if="this.$route.params.id_control"
            block
            @click="_setControl"
            :disabled="$store.state.dataControl_Numero != ''"
            color="primary"
          >
            GENERAR NUEVA VERSION DE CONTROL</v-btn
          >

          <v-btn
            :disabled="!this.$route.params.id_control"
            @click.native="_generatePDF()"
            block
            color="orange"
            class="mt-2"
            >IMPRIMIR CONTROL</v-btn
          >

          <v-btn
            :disabled="$store.state.dataControl_Numero == ''"
            block
            color="primary"
            class="mt-2"
            @click="_openDebs()"
            >CARGAR ABONOS DEL CLIENTE</v-btn
          >
          <v-btn
            :disabled="$store.state.dataControl_Numero == ''"
            block
            color="pink"
            class="mt-2"
            dark
            @click="abrirModalFacturar()"
          >
            EMITIR FACTURA A CLIENTE
          </v-btn>
        </v-col>
        <v-col cols="12" md="8">
          <v-expansion-panels v-model="panel" multiple>
            <v-expansion-panel v-for="(item, i) in items" :key="i">
              <v-expansion-panel-header>
                <b>Ingresos </b>
              </v-expansion-panel-header>
              <v-expansion-panel-content>
                <ingresos />
              </v-expansion-panel-content>
            </v-expansion-panel>
          </v-expansion-panels>

          <v-expansion-panels class="mt-5" v-model="panels" multiple>
            <v-expansion-panel v-for="(item, i) in items" :key="i">
              <v-expansion-panel-header>
                <b>Costos </b>
              </v-expansion-panel-header>
              <v-expansion-panel-content>
                <egresos />
              </v-expansion-panel-content>
            </v-expansion-panel>
          </v-expansion-panels>

          <v-card
            class="mt-5"
            :disabled="$store.state.dataControl_Numero == ''"
          >
            <v-card-text>
              <totales />
            </v-card-text>
          </v-card>
        </v-col>

        <v-col cols="12" md="4">
          <v-expansion-panels>
            <v-expansion-panel>
              <v-expansion-panel-header>
                <b>Servicios a Realizar</b>
              </v-expansion-panel-header>
              <v-expansion-panel-content>
                <services />
              </v-expansion-panel-content>
            </v-expansion-panel>
          </v-expansion-panels>

          <v-card
            class="mt-5"
            :disabled="$store.state.dataControl_Numero == ''"
          >
            <v-card-text>
              <totalesProveedor />
            </v-card-text>
          </v-card>
        </v-col>
        <v-col cols="12"> </v-col>

        <v-dialog max-width="900" v-model="dialogDebs">
          <v-card>
            <v-card-title>
              Abonos del cliente
              <v-spacer></v-spacer>
              <v-btn outlined color="primary" @click="_newDebs()"
                >CARGAR NUEVO ABONO</v-btn
              >
            </v-card-title>
            <v-card-text>
              <v-data-table :headers="headersdebs" :items="itemsDebsClient">
                <template v-slot:[`item.accion`]="{ item }">
                  <v-icon
                    class="btn_add mr-2"
                    dense
                    large
                    color="grey"
                    @click="openDoc(item.path)"
                    >mdi-eye</v-icon
                  >

                  <v-icon
                    class="btn_add mr-2"
                    dense
                    large
                    color="red"
                    v-if="item.status == 1"
                    @click="_delDebsClient(item.id)"
                    >mdi-delete</v-icon
                  >
                </template>
                <template v-slot:[`item.status`]="{ item }">
                  <v-chip
                    block
                    v-if="item.status == 2"
                    small
                    class=""
                    color="success"
                    outlined
                  >
                    <v-icon left> mdi-check </v-icon>
                    Confirmado
                  </v-chip>
                  <v-chip
                    block
                    v-if="item.status == 1"
                    small
                    class=""
                    color="orange"
                    outlined
                  >
                    <v-icon left> mdi-warning </v-icon>
                    Por Confirmar
                  </v-chip>
                </template>
              </v-data-table>
            </v-card-text>
          </v-card>
        </v-dialog>

        <v-dialog max-width="800" v-model="dialogNewDebs">
          <v-card>
            <v-card-title>
              Cargar un nuevo abono
              <v-spacer></v-spacer>
            </v-card-title>
            <v-card-text>
              <v-container>
                <v-row dense>
                  <v-col cols="12" md="6">
                    <v-menu
                      ref="menu"
                      v-model="menu"
                      :close-on-content-click="false"
                      :return-value.sync="date"
                      transition="scale-transition"
                      offset-y
                      min-width="auto"
                    >
                      <template v-slot:activator="{ on, attrs }">
                        <v-text-field
                          v-model="date"
                          label="Fecha de Operación"
                          prepend-icon="mdi-calendar"
                          readonly
                          v-bind="attrs"
                          v-on="on"
                        ></v-text-field>
                      </template>
                      <v-date-picker
                        locale="es-pe"
                        v-model="date"
                        no-title
                        scrollable
                      >
                        <v-spacer></v-spacer>
                        <v-btn text color="primary" @click="menu = false">
                          Cancel
                        </v-btn>
                        <v-btn
                          text
                          color="primary"
                          @click="$refs.menu.save(date)"
                        >
                          OK
                        </v-btn>
                      </v-date-picker>
                    </v-menu>
                  </v-col>
                  <v-col cols="12" md="6">
                    <v-text-field
                      v-model="number"
                      label="No. Operación"
                    ></v-text-field>
                  </v-col>

                  <v-col cols="12" md="4">
                    <v-autocomplete
                      :items="$store.state.itemsDataBanksList"
                      v-model="id_banks"
                      item-text="acronym"
                      item-value="id"
                      label="Banco"
                    ></v-autocomplete>
                  </v-col>
                  <v-col cols="12" md="4">
                    <v-autocomplete
                      :items="$store.state.itemsCoinsList"
                      v-model="id_coins"
                      item-text="acronym"
                      item-value="id"
                      label="Moneda"
                    ></v-autocomplete>
                  </v-col>
                  <v-col cols="12" md="4">
                    <v-text-field
                      v-model="monto"
                      type="number"
                      label="Monto"
                    ></v-text-field>
                  </v-col>
                  <v-col cols="12" md="12">
                    <v-textarea
                      rows="2"
                      v-model="comentario"
                      label="Comentario"
                    ></v-textarea>
                  </v-col>
                  <v-col cols="12" md="9">
                    <v-file-input
                      v-if="!boolFile"
                      v-model="payfile"
                      show-size
                      label="Adjuntar Pago"
                    >
                    </v-file-input>

                    <v-chip
                      block
                      v-if="boolFile"
                      large
                      class=""
                      color="success"
                      outlined
                    >
                      <v-icon left> mdi-check </v-icon>
                      Archivo cargado éxitosamente
                    </v-chip>
                  </v-col>
                  <v-col cols="3">
                    <v-btn
                      :disabled="boolFile || payfile == []"
                      color="blue-grey"
                      block
                      class="ma-2 white--text"
                      large
                      @click="_uploadFile()"
                    >
                      Subir
                      <v-icon right dark> mdi-cloud-upload </v-icon>
                    </v-btn>
                  </v-col>
                </v-row>
              </v-container>
            </v-card-text>
            <v-card-actions>
              <v-btn
                color="primary"
                @click="_setDebsClient()"
                :disabled="!boolFile"
                >GUARDAR ABONO</v-btn
              >
              <v-spacer></v-spacer>
              <v-btn
                outlined
                color="red"
                @click="dialogNewDebs = !dialogNewDebs"
                >Cerrar</v-btn
              >
            </v-card-actions>
          </v-card>
        </v-dialog>
      </v-row>
    </v-container>
    <v-dialog
      v-model="dialogFacturar"
      scrollable
      persistent
      :overlay="false"
      max-width="50%"
      transition="dialog-transition"
    >
      <v-card>
        <v-card-title primary-title> GENERAR FACTURA </v-card-title>
        <v-card-text>
          <v-row>
            <v-col>
              <v-autocomplete
                :items="branch"
                item-text="trade_name"
                item-value="id"
                label="Sucursal"
                placeholder="Seleccione una sucursal"
                v-model="id_branch"
                @change="obtenerDatos()"
              >
              </v-autocomplete>
            </v-col>
          </v-row>
        </v-card-text>
        <v-card-actions>
          <v-btn
            color="success"
            :loading="obtenerDatosHouse"
            :disabled="id_branch == ''"
            @click="generarDocumento()"
          >
            Generar Facturar
          </v-btn>
          <v-btn color="warning" @click="dialogFacturar = !dialogFacturar"
            >Cancelar</v-btn
          >
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>
<script>
import dataHouse from "./dataHouse.vue";
import ingresos from "./ingresos.vue";
import egresos from "./egresos.vue";
import services from "./services.vue";
import totalesProveedor from "./totalesProveedor.vue";
import totales from "./totales.vue";
import { mapState, mapActions } from "vuex";
import axios from '@/api/axios-config';
export default {
  name: "ControlGastos",
  components: {
    dataHouse,
    ingresos,
    egresos,
    totales,
    services,
    totalesProveedor,
  },
  data() {
    return {
      panel: [0],
      panels: [0],
      items: 1,
      dataGastos: true,
      dialogDebs: false,
      dialogNewDebs: false,
      dialogFacturar: false,
      obtenerDatosHouse: false,
      pathfile: "",
      payPath: "",
      payfile: "",
      boolFile: "",
      pathfileAll: "",

      itemsDebsClient: [],
      branch: [],
      id_branch: "",
      number: "",
      id_banks: "",
      id_coins: "",
      monto: "",
      comentario: "",
      datosFactura: [],

      date: new Date(Date.now() - new Date().getTimezoneOffset() * 60000)
        .toISOString()
        .substr(0, 10),
      menu: false,
      modal: false,
      menu2: false,

      headersdebs: [
        {
          text: "Documento",
          align: "start",
          sortable: false,
          value: "name",
        },
        {
          text: "Fecha",
          value: "date",
        },
        {
          text: "Monto",
          value: "monto_letra",
        },
        {
          text: "Comentario de Admin.",
          value: "comentario_admin",
        },
        {
          text: "Status",
          value: "status",
        },
        {
          text: "Ver",
          value: "accion",
        },
      ],
    };
  },
  computed: {
    ...mapState(["itemsDataControl"]),
  },
  beforeMount() {
    this._getDebsClient();
  },

  methods: {
    ...mapActions([
      "_setControl",
      "_getIngresos",
      "_getEgresos",
      "_getBanksList",
      "_getCoinsList",
    ]),
    openDoc(path) {
      window.open(path, "_blank");
    },

    all() {
      this.panel = [...Array(this.items).keys()].map((k, i) => i);
    },

    _newDebs() {
      this.dialogNewDebs = true;
    },

    _openDebs() {
      this.dialogDebs = true;
    },
    async cargarBranch() {
      let vm = this;
      var config = {
        method: "get",
        url:
          process.env.VUE_APP_URL_MAIN +
          "CargarBranch/" +
          JSON.parse(sessionStorage.getItem("dataUser"))[0].id_user,

        headers: {
         
          "Content-Type": "application/json",
        },
      };
      await axios(config).then(function (response) {
        if (response.data.statusBol == true) {
          vm.branch = response.data.data;
        }
      });
    },

    abrirModalFacturar() {
      let vm = this;
      vm.dialogFacturar = true;
    },

    async obtenerDatos() {
      let vm = this;
      vm.obtenerDatosHouse = true;
      vm.datosFactura = [];
      var config = {
        method: "get",
        url: `${process.env.VUE_APP_URL_MAIN}data_factura/${vm.$route.params.id_house}/${vm.id_branch}`,

        headers: {
         
          "Content-Type": "application/json",
        },
      };
      await axios(config).then(function (response) {
        if (response.data.statusBol == true) {
          vm.datosFactura = response.data.data[0];
        }
      });
      vm.obtenerDatosHouse = false;
    },
    async generarDocumento() {
      let vm = this;
      vm.obtenerDatosHouse = true;
      let data = vm.datosFactura;
      var config = {
        method: "post",
        url: `${process.env.VUE_APP_URL_MAIN}factura`,
        headers: {
         
          "Content-Type": "application/json",
        },
        data: data,
      };
      let res = await axios(config).then(function (response) {
        return response;
      });

      if (res.data.statusBol == true) {
        vm.registrarFactura(res.data);
        vm.dialogFacturar = false;
        vm.id_branch = "";
      }
      vm.obtenerDatosHouse = false;
    },
    async registrarFactura(data) {
      let vm = this;
      let dataFactura = {
        id_house: vm.$route.params.id_house,
        nro_factura: data.nro_factura,
        url_documento: process.env.VUE_APP_URL_MAIN + data.path,
        total_monto: vm.datosFactura.total_monto,
        total_igv: vm.datosFactura.total_igv,
        total: vm.datosFactura.total,
      };
      var config = {
        method: "post",
        url: process.env.VUE_APP_URL_MAIN + "registrar_factura",
        headers: {
         
          "Content-Type": "application/json",
        },
        data: dataFactura,
      };
      await axios(config);
      window.open(process.env.VUE_APP_URL_MAIN + data.path, "_blank");
    },
    cleandData() {
      this.date = new Date(Date.now() - new Date().getTimezoneOffset() * 60000)
        .toISOString()
        .substr(0, 10);
      this.number = "";
      this.monto = "";
      this.comentario = "";
      this.payfile = [];
      this.payPath = "";
      this.boolFile = false;
    },

    async _delDebsClient(id) {
      var vm = this;

      var config = {
        method: "post",
        url: process.env.VUE_APP_URL_MAIN + "delDebsClient/" + id,

        headers: {
         
          "Content-Type": "application/json",
        },
      };
      await axios(config)
        .then(function (response) {
          vm._getDebsClient();
        })
        .catch(function (error) {
          console.log(error);
        });
    },

    async _setDebsClient() {
      var vm = this;
      vm.$swal({
        icon: "info",
        title: "Cargando pago...",
        text: "Por favor espere",
      });
      var data = {
        id_house: vm.$route.params.id_house,
        date: vm.date,
        number: vm.number,
        id_banks: vm.id_banks,
        id_coins: vm.id_coins,
        monto: vm.monto,
        comentario_usuario: vm.comentario,
        id_path: vm.payPath,
        status: 1,
      };
      var config = {
        method: "post",
        url: process.env.VUE_APP_URL_MAIN + "setDebsClient",

        headers: {
         
          "Content-Type": "application/json",
        },
        data: data,
      };
      await axios(config)
        .then(function (response) {
          //vm._getRequestPayment();
          //vm.itemsSPayment = response.data.data;
          vm.$swal({
            icon: "success",
            title: "Pago Cargado",
            text: "El pago ha sido cargado correctamente",
          });

          vm._getDebsClient();

          vm.cleandData();
          vm.dialogNewDebs = false;
        })
        .catch(function (error) {
          console.log(error);
        });
    },

    async _getDebsClient() {
      var vm = this;
      let data = {
        id_branch: JSON.parse(sessionStorage.getItem("dataUser"))[0].id_branch,
      };
      var config = {
        method: "post",
        url:
          process.env.VUE_APP_URL_MAIN +
          "getDebsClient/" +
          vm.$route.params.id_house,

        headers: {
         
          "Content-Type": "application/json",
        },
        data: data,
      };
      await axios(config)
        .then(function (response) {
          vm.itemsDebsClient = response.data.data;
        })
        .catch(function (error) {
          console.log(error);
        });
    },

    _uploadFile() {
      var FormData = require("form-data");
      var fs = require("fs");
      var data = new FormData();
      var vm = this;
      data.append("name", "Prueba");
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
          vm.payPath = JSON.stringify(response.data.data[0].insertid);
        })
        .catch(function (error) {
          console.log(error);
        });
    },

    async _generatePDF() {
      this.$swal({
        icon: "info",
        title: "Generando PDF...",
        text: "Por favor espere",
      });
      var sentido;
      if (this.$store.state.report_id_sentido == "") {
        sentido = "";
      } else {
        sentido = this.$store.state.report_id_sentido;
      }
      var data = {
        nombre_impuesto: this.$store.state.enterprises.impuesto.nombre_impuesto,
        nro_control: this.$store.state.dataControl_Numero,
        profit: (
          (this.$store.state.totalTotalIngresos
            ? this.$store.state.totalTotalIngresos
            : 0) -
          (this.$store.state.totalTotalEgresos
            ? this.$store.state.totalTotalEgresos
            : 0)
        ).toFixed(2),
        code_master: this.$store.state.dataHouse_code_master,
        code_house: this.$store.state.dataHouse_code_house,
        sentido: this.$store.state.dataHouse_modality,
        tipo_embarque: this.$store.state.dataHouse_shipment,
        puerto_origen: this.$store.state.dataHouse_port_begin,
        puerto_destino: this.$store.state.dataHouse_port_end,
        agente: this.$store.state.dataHouse_agente,
        consignatario: this.$store.state.dataHouse_consigners,
        notify: this.$store.state.dataHouse_notify,
        bultos: this.$store.state.dataHouse_bultos,
        peso: this.$store.state.dataHouse_peso,
        volumen: this.$store.state.dataHouse_volumen,
        itemsIngreso: this.$store.state.itemsDataIngresosList,
        itemsEgreso: this.$store.state.itemsDataEgresosList,
        itemsTotalesProveedores: this.$store.state.itemsDataTotalesProveedor,
        ruc: this.$store.state.dataHouse_ruc,
        totalIngreso: this.$store.state.totalIngresos,
        totalIngresoOp: this.$store.state.totalIngresosOp,
        totalEgreso: this.$store.state.totalEgresos,
        totalEgresoOp: this.$store.state.totalEgresosOp,
        exp: this.$store.state.dataHouse_exp,
        totalIgv: this.$store.state.dataHouse_exp,
        exp: this.$store.state.dataHouse_exp,
        totalIgvEgresos: this.$store.state.totalIgvEgresos,
        totalIgvEgresosOp: this.$store.state.totalIgvEgresosOp,
        totalTotalEgresos: this.$store.state.totalTotalEgresos,
        totalTotalEgresosOp: this.$store.state.totalTotalEgresosOp,
        totalIgvIngresos: this.$store.state.totalIgvIngresos,
        totalIgvIngresosOp: this.$store.state.totalIgvIngresosOp,
        totalTotalIngresos: this.$store.state.totalTotalIngresos,
        totalTotalIngresosOp: this.$store.state.totalTotalIngresosOp,
        gananciapr: (
          (this.$store.state.totalTotalIngresos
            ? this.$store.state.totalTotalIngresos
            : 0) -
          (this.$store.state.totalTotalEgresos
            ? this.$store.state.totalTotalEgresos
            : 0)
        ).toFixed(2),
        igvpr: Math.abs(
          (
            this.$store.state.totalIgvIngresos -
            this.$store.state.totalIgvEgresos
          ).toFixed(2)
        ),
        subtotalpr: (
          this.$store.state.totalTotalIngresos -
          this.$store.state.totalTotalEgresos
        ).toFixed(2),
        gananciaop: (
          (this.$store.state.totalTotalIngresosOp
            ? this.$store.state.totalTotalIngresosOp
            : 0) -
          (this.$store.state.totalTotalEgresosOp
            ? this.$store.state.totalTotalEgresosOp
            : 0)
        ).toFixed(2),
        igvop: Math.abs(
          (
            this.$store.state.totalIgvIngresosOp -
            this.$store.state.totalIgvEgresosOp
          ).toFixed(2)
        ),
        subtotalop: (
          this.$store.state.totalTotalIngresosOp -
          this.$store.state.totalTotalEgresosOp
        ).toFixed(2),
      };

      var config = {
        method: "post",
        url: process.env.VUE_APP_URL_MAIN + "getPdfInstructivo",
        headers: {
         
          "Content-Type": "application/json",
        },
        data: data,
      };
      var vm = this;
      await axios(config)
        .then(function (response) {
          vm.$swal({
            icon: "success",
            title: "PDF Generado",
            text: "El PDF se descargará automaticamente",
          });

          window.open(
            process.env.VUE_APP_URL_MAIN + "INSTRUCTIVO.pdf",
            "_blank"
          );
        })
        .catch(function (error) {
          console.log(error);
        });
    },
  },
  mounted() {
    let vm = this;
    this.$store.state.dataControl_id_house = this.$route.params.id_house;
    this.all();
    this._getBanksList();
    this._getCoinsList();
    this.cargarBranch();
    if (this.$route.params.id_control) {
      this.$store.state.drawer = false;
      this.$store.state.dataControl_id_user = JSON.parse(
        sessionStorage.getItem("dataUser")
      )[0].id;
    }
    vm.$store.state.drawer = false;
  },
};
</script>

<style lang="scss" scoped>
.cardHouse {
  height: 150px;
  overflow-y: scroll;
}

.cardHouse::-webkit-scrollbar {
  width: 0px;
}
</style>
