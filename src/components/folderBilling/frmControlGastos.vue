<template>
  <v-container fluid class="py-0 mx-0">
    <v-row>
      <v-col cols="12" md="8" xl="8" lg="8">
        <v-card class="cardHouse" v-if="$store.state.controlGastos">
          <v-card-text>
            <v-row>
              <v-col cols="12" xl="3" lg="3">
                <div class="divExped">
                  <!-- <h3>N° CONTROL: {{ $store.state.dataControl_Numero }}</h3> -->
                  <h3 class="mt-4">
                    Master:
                    {{
                      ($store.state.controlGastos.listControlGastos[0] &&
                        $store.state.controlGastos.listControlGastos[0]
                          .master_codemaster) ||
                      ""
                    }}
                  </h3>
                  <h3 class="mt-1">
                    <!-- House: {{ $store.state.dataHouse_code_house }} -->
                  </h3>
                </div>
              </v-col>
              <v-col cols="12" xl="3" lg="3">
                <h3>Datos Generales</h3>

                <div>
                  <p>
                    Sentido:
                    {{
                      ($store.state.controlGastos.listControlGastos[0] &&
                        $store.state.controlGastos.listControlGastos[0]
                          .master_modality) ||
                      ""
                    }}
                  </p>
                  <p>
                    Tipo de Embarque:
                    {{
                      ($store.state.controlGastos.listControlGastos[0] &&
                        $store.state.controlGastos.listControlGastos[0]
                          .master_shipment) ||
                      ""
                    }}
                  </p>
                  <p>
                    Puerto de Origen:
                    {{
                      ($store.state.controlGastos.listControlGastos[0] &&
                        $store.state.controlGastos.listControlGastos[0]
                          .master_port_begin) ||
                      ""
                    }}
                  </p>
                  <p>
                    Puerto de Destino:
                    {{
                      ($store.state.controlGastos.listControlGastos[0] &&
                        $store.state.controlGastos.listControlGastos[0]
                          .master_port_end) ||
                      ""
                    }}
                  </p>
                </div>
              </v-col>
              <v-col cols="12" xl="3" lg="3">
                <h3>Datos del Embarque</h3>

                <div>
                  <p>
                    Agente:
                    {{
                      ($store.state.controlGastos.listControlGastos[0] &&
                        $store.state.controlGastos.listControlGastos[0]
                          .master_operador) ||
                      ""
                    }}
                  </p>
                  <p>
                    Consignatario:
                    {{
                      ($store.state.controlGastos.listControlGastos[0] &&
                        $store.state.controlGastos.listControlGastos[0]
                          .master_consigner) ||
                      ""
                    }}
                  </p>
                  <p>
                    Notify:
                    {{
                      ($store.state.controlGastos.listControlGastos[0] &&
                        $store.state.controlGastos.listControlGastos[0]
                          .master_notify) ||
                      ""
                    }}
                  </p>
                </div>
              </v-col>
              <v-col cols="12" xl="3" lg="3">
                <h3>Datos de la carga</h3>

                <div>
                  <p>
                    Bultos:
                    {{
                      ($store.state.controlGastos.listControlGastos[0] &&
                        $store.state.controlGastos.listControlGastos[0]
                          .master_bultos) ||
                      ""
                    }}
                  </p>
                  <p>
                    Peso:
                    {{
                      ($store.state.controlGastos.listControlGastos[0] &&
                        $store.state.controlGastos.listControlGastos[0]
                          .master_peso) ||
                      ""
                    }}
                    Kg
                  </p>
                  <p>
                    Volumen:
                    {{
                      ($store.state.controlGastos.listControlGastos[0] &&
                        $store.state.controlGastos.listControlGastos[0]
                          .master_volumen) ||
                      ""
                    }}
                    m<sup>3</sup>
                  </p>
                </div>
              </v-col>
            </v-row>
          </v-card-text>
        </v-card>
      </v-col>
      <v-col cols="12" lg="4" xl="4" md="4">
        <v-alert
          icon="mdi-currency-usd"
          class="my-1 text-center"
          border="left"
          colored-border
          color="deep-purple accent-4"
          elevation="2"
          outlined
          prominent
          dense
        >
          <h2>
            PROFIT PR:
            {{ parseFloat(ingreso_pr - egreso_pr).toFixed(2) }} USD / OP:
            {{ parseFloat(ingreso_op - egreso_op).toFixed(2) }} USD
          </h2>
        </v-alert>

        <v-btn
          color="info"
          class="my-1"
          block
          dark
          small
          v-if="!editable"
          @click="irAEditar(false)"
        >
          <v-icon class="mx-1">mdi-pencil</v-icon> EDITAR
        </v-btn>
        <v-btn
          color="red"
          class="my-1"
          block
          dark
          small
          @click="imprimirControlDetallado(false)"
        >
          <v-icon class="mx-1">mdi-printer-outline</v-icon> CONTROL DETALLADO
        </v-btn>
        <v-btn
          color="teal darken-4"
          class="my-1"
          block
          small
          dark
          @click="imprimirControlDetallado(true)"
        >
          <v-icon class="mx-1">mdi-content-save-all-outline</v-icon> CONTROL
          DETALLADO
        </v-btn>
        <v-btn
          color="#FFD600"
          class="my-1"
          small
          block
          v-if="
            $store.state.controlGastos.listControlGastos[0].url_folderonedrive
          "
          @click="
            to_direct({
              url: $store.state.controlGastos.listControlGastos[0]
                .url_folderonedrive,
            })
          "
        >
          <v-icon class="mx-2">mdi-folder</v-icon> ABRIR CARPETA
        </v-btn>
      </v-col>
      <v-col cols="12">
        <Ingresos
          @recargarDatos="recargarDatos()"
          :statusBtn="statusBtn"
          :prFlag="prFlag"
          :opFlag="opFlag"
          :ingreso_pr="ingreso_pr"
          :ingreso_op="ingreso_op"
          v-on:recalcularProfit="calcularProfit()"
          :editable="editable"
        />
      </v-col>
      <!-- EGRESOS -->
      <v-col cols="12">
        <Egresos
          :statusBtn="statusBtn"
          :prFlag="prFlag"
          :opFlag="opFlag"
          :egreso_pr="egreso_pr"
          :egreso_op="egreso_op"
          v-on:recalcularProfit="calcularProfit()"
          @statusBtn="statusBtn = $event"
          @recargarDatos="recargarDatos()"
          :editable="editable"
        />
      </v-col>
    </v-row>
  </v-container>
</template>
<script>
import { mapState, mapActions } from "vuex";
import moment from "moment";
import axios from "axios";
import Swal from "sweetalert2";
export default {
  props: {
    editable: {
      type: Boolean,
      default: true,
    },
  },
  components: {
    Ingresos: () => import("./ingresos.vue"),
    Egresos: () => import("./egresos.vue"),
  },
  data: () => {
    return {
      dataProveedor: null,

      loadingFile: false,
      errfile: "",
      msgfile: "",
      id: "",
      id_coins: null,

      ingreso_pr: 0,
      egreso_pr: 0,
      ingreso_op: 0,
      egreso_op: 0,
      loading: false,
      dialog: false,
      dialogListInvoince: false,
      dialogInvoice: false,
      // dialogDebs: false,
      dialogFacturar: false,
      dialogIngreso: false,
      dialogEngreso: false,
      dialogDebsEdit: false,
      prFlag: false,
      opFlag: false,
      // dialogNewDebs: false,
      datosFactura: false,

      id_branch: null,
      proveedorId: null,

      conceptos: [],
      statusBtn: 1,
      id_correlativo: 1,

      pathfile: "",
      payPath: "",

      pathfileAll: "",
      // date: new Date(Date.now() - new Date().getTimezoneOffset() * 60000)
      //   .toISOString()
      //   .substr(0, 10),
      menu: false,
      number: "",
      id_banks: "",

      monto: 0.0,
      monto_abonado: "",
      id_cuenta_pic: "",
      cuentas: [],
      tipocambio: 1,
      comentario: "",
      itemsListInvoice: [],

      id_house: null,

      sPaymentId: "",
      dataList: [],

      search: null,

      egreso_pr: 0,
      egreso_op: 0,
      selected: [],
      // sufmoneda: "",
      id_correlativo: null,
      id_master: null,
      egreso: null,
      msgFile: "",
      errFile: "",
    };
  },
  methods: {
    ...mapActions([
      "getListControlGastos",
      "setControl",
      "cargarBranch",
      "_getBanksList",
      "_getCoinsList",
      "_getProveedor",
      "getListBanksDetailsCargar",
      "cargarCorrelativo",
      "_uploadFile",
      "guardarCuotasCgeTipoProveedor",
      "obtenerImpuestoXEmpresa",
    ]),
    // ...mapAction([])
    // --------------------
    irAEditar() {
      let id_branch =
        this.$store.state.controlGastos.listControlGastos[0].id_branch;
      if (
        !(
          JSON.parse(sessionStorage.getItem("dataUser"))[0].id_branch ==
          id_branch
        )
      ) {
        Swal.fire({
          icon: "error",
          text: "El expediente pertenece a otra sucursal, por favor logueese con la otra sucursal.",
        });
        return;
      }
      this.$router.push({
        name: "editControlGasto",
        params: {
          id: this.$route.params.id,
          id_branch: id_branch,
        },
      });
    },
    to_direct({ url }) {
      window.open(url, "_blank");
    },
    // --------------------
    async recargarDatos() {
      this.$store.state.spiner = true;
      await this.getListControlGastos(this.$route.params.id);
      this.$store.state.spiner = false;
      this._getCoinsList();
    },
    calcularMontoDolar() {
      this.monto = parseFloat(
        (this.monto_abonado ? this.monto_abonado : 0) / this.tipocambio,
      ).toFixed(2);
    },

    openDoc(path) {
      window.open(path, "_blank");
    },
    cleandData() {
      this.date = new Date(Date.now() - new Date().getTimezoneOffset() * 60000)
        .toISOString()
        .substr(0, 10);
      this.number = "";
      this.monto = 0;
      this.comentario = "";
      this.payfile = [];
      this.payPath = "";
      this.boolFile = false;
      this.id_cuenta_pic = "";
      this.tipocambio = 1;
      this.id_coins = "";
      this.monto_abonado = "";
      this.number = "";
    },
    currentDate() {
      const monthNames = [
        "Enero",
        "Febrero",
        "Marzo",
        "Abril",
        "Mayo",
        "Junio",
        "Julio",
        "Agosto",
        "Septiembre",
        "Octubre",
        "Noviembre",
        "Diciembre",
      ];
      const current = new Date();
      const date = `${current.getDate()} de ${
        monthNames[current.getMonth()]
      } del ${current.getFullYear()}`;
      return date;
    },

    calcularProfit() {
      this.$nextTick(() => {
        setTimeout(() => {
          let house =
            (this.$store.state.controlGastos.listControlGastos[0] &&
              this.$store.state.controlGastos.listControlGastos[0]
                .master_houses) ||
            [];
          let egr =
            (this.$store.state.controlGastos.listControlGastos[0] &&
              this.$store.state.controlGastos.listControlGastos[0]
                .master_egresos) ||
            [];
          this.ingreso_pr = house
            .map((element) => {
              return element.total_total_pr_ingresos;
            })
            .reduce((a, b) => {
              return a + b;
            }, 0);
          this.ingreso_op = house
            .map((element) => {
              return element.total_total_op_ingresos;
            })
            .reduce((a, b) => {
              return a + b;
            }, 0);

          this.egreso_pr = egr
            .map((element) => {
              return element.total_total_pr;
            })
            .reduce((a, b) => {
              return a + b;
            }, 0);
          this.egreso_op = egr
            .map((element) => {
              return element.total_total_op;
            })
            .reduce((a, b) => {
              return a + b;
            }, 0);
        }, 1000);
        this.$forceUpdate();
      });
    },
    async imprimirControlDetallado(guardarEnCarpeta) {
      // let master = this.$store.state.controlGastos.listControlGastos[0];
      // let egresos = [];
      // let totalEgreso = 0;
      // let totalIgvEgresos = 0;
      // let totalTotalEgresos = 0;
      // let totalEgresoOp = 0;
      // let totalIgvEgresosOp = 0;
      // let totalTotalEgresosOp = 0;
      // master.master_egresos.forEach((element) => {
      //   element.detalle.forEach((element2) => {
      //     egresos.push({
      //       namePagado: "",
      //       nameproveedor: element2.nombre_proveedor,
      //       concepto: element2.concepto,
      //       monto_pr: element2.monto_pr,
      //       igv_pr: element2.igv_pr,
      //       total_pr: element2.total_pr,
      //       monto_op: element2.monto_op,
      //       igv_op: element2.igv_op,
      //       total_op: element2.total_op,
      //     });
      //     totalEgreso += parseFloat(element2.monto_pr);
      //     totalIgvEgresos += parseFloat(element2.igv_pr);
      //     totalTotalEgresos += parseFloat(element2.total_pr);
      //     totalEgresoOp += parseFloat(element2.monto_op);
      //     totalIgvEgresosOp += parseFloat(element2.igv_op);
      //     totalTotalEgresosOp += parseFloat(element2.total_op);
      //   });
      // });
      // let data = {
      //   bultos: master.master_volumen,
      //   peso: master.master_peso,
      //   puerto_origen: master.master_port_begin,
      //   puerto_destino: master.master_port_end,
      //   tipo_embarque: master.master_shipment,
      //   volumen: master.master_volumen,
      //   sentido: master.master_modality,
      //   gananciapr: parseFloat(this.ingreso_pr - this.egreso_pr).toFixed(2),
      //   gananciaop: parseFloat(this.ingreso_op - this.egreso_op).toFixed(2),
      //   exp: this.codigo_master,
      //   totalEgreso,
      //   totalIgvEgresos,
      //   totalTotalEgresos,
      //   totalEgresoOp,
      //   totalIgvEgresosOp,
      //   totalTotalEgresosOp,
      //   itemsTotalesProveedores: master.master_egresos.map((element) => {
      //     return {
      //       nameproveedor: element.nombre_proveedor,
      //       restante: parseFloat(element.monto_pagar_op).toFixed(2),
      //       total_op: parseFloat(element.total_total_op).toFixed(2),
      //       total_p: parseFloat(element.total_total_op).toFixed(2),
      //       total_pr: parseFloat(element.total_total_pr).toFixed(2),
      //     };
      //   }),

      //   itemTotalHouse: master.master_houses.map((element) => {
      //     return {
      //       consigner: element.consigner,
      //       code_house: element.code_house,
      //       total_igv_op_ingresos: parseFloat(
      //         element.total_igv_op_ingresos
      //       ).toFixed(2),
      //       total_igv_pr_ingresos: parseFloat(
      //         element.total_igv_pr_ingresos
      //       ).toFixed(2),
      //       total_monto_op_ingresos: parseFloat(
      //         element.total_monto_op_ingresos
      //       ).toFixed(2),
      //       total_monto_pr_ingresos: parseFloat(
      //         element.total_monto_pr_ingresos
      //       ).toFixed(2),
      //       total_total_op_ingresos: parseFloat(
      //         element.total_total_op_ingresos
      //       ).toFixed(2),
      //       total_total_pr_ingresos: parseFloat(
      //         element.total_total_pr_ingresos
      //       ).toFixed(2),
      //     };
      //   }),
      //   itemHouses: master.master_houses,
      //   itemEgresos: master.master_egresos,
      // };
      var vm = this;
      // vm._calcularTotales();
      if (!guardarEnCarpeta) {
        vm.$swal({
          icon: "info",
          title: "Generando PDF...",
          text: "Por favor espere",
        });
      } else {
        vm.$swal({
          icon: "warning",
          title: "Moviendo",
          text: "Se avisará cuando se haya guardado",
          timer: 2000,
        });
      }
      var config = {
        method: "post",
        url: process.env.VUE_APP_URL_MAIN + "getPdfInstructivoDetallado",
        headers: {
          "auth-token": sessionStorage.getItem("auth-token"),
          "Content-Type": "application/json",
        },
        data: { ...this.$route.params, guardarEnCarpeta: guardarEnCarpeta },
      };
      await axios(config)
        .then(function (response) {
          vm.$swal({
            icon: "success",
            title: guardarEnCarpeta ? "PDF Guardado" : "PDF Generado",
            text: guardarEnCarpeta
              ? "Se guardó en la carpeta el pdf."
              : "El PDF se descargará automaticamente",
          });
          if (!guardarEnCarpeta) {
            window.open(
              process.env.VUE_APP_URL_MAIN + response.data.path,
              "_blank",
            );
          }
        })
        .catch(function (error) {
          console.log(error);
        });
    },
  },

  // ----------------------------------------------------------
  async mounted() {
    this.$store.state.spiner = true;
    this.prFlag =
      JSON.parse(sessionStorage.getItem("dataUser"))[0].departamento == 1
        ? true
        : false;
    this.opFlag =
      JSON.parse(sessionStorage.getItem("dataUser"))[0].departamento == 2
        ? true
        : false;
    Promise.all([
      await this.obtenerImpuestoXEmpresa(this.$route.params.id_branch),
      await this.cargarCorrelativo(),
      await this.getListControlGastos(this.$route.params.id),

      await this.cargarBranch(),
      await this._getBanksList(),
      await this._getCoinsList(),
      await this._getProveedor(),
      await this.getListBanksDetailsCargar(),
    ]);
    this.calcularProfit();
    this.codigo_master =
      this.$store.state.controlGastos.listControlGastos[0].master_nromaster;
    this.$store.state.spiner = false;
  },
};
</script>

<style lang="scss" scoped>
.divExped {
  background: #eaeaea;
  border-radius: 5px;
  padding: 10px;
}

p {
  margin: 0px;
}
</style>
