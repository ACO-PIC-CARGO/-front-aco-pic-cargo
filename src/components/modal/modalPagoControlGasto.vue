<template>
  <v-card>
    <v-card-title primary-title>
      <v-row>
        <v-autocomplete
          :items="provedores"
          label="Proveedores"
          v-model="proveedor"
          item-value="id"
          item-text="namelong"
          style="font-size: 20pt"
          clearable
          @change="listarPagosXControlGasto()"
        >
        </v-autocomplete>
        <v-spacer></v-spacer>
      </v-row>
    </v-card-title>

    <v-card-text>
      <v-row>
        <v-col cols="3">
          <v-text-field
            style="font-size: 20pt"
            label="Monto en que va a salir del banco"
            v-model="montoMonExt"
            readonly
            :prefix="acronym"
          ></v-text-field>
        </v-col>
      </v-row>
      <v-tabs color="#A43542" slider-color="primary" fixed-tabs v-model="tab">
        <v-tab href="#ref1">STEP 1</v-tab>
        <v-tab href="#ref2" v-if="selected.length > 0">STEP 2</v-tab>
        <v-tab-item value="ref1" class="mt-5">
          <v-card-text>
            <v-row>
              <v-col cols="3">
                <v-text-field label="Buscar..." v-model="search"></v-text-field>
              </v-col>
              <v-col cols="3">
                <v-btn
                  v-if="selected.length > 0"
                  color="green darken-4"
                  @click="continuar()"
                  dark
                  >Continuar</v-btn
                >
              </v-col>
            </v-row>

            <v-data-table
              :headers="cabPagos"
              :items="lstPagos"
              item-key="index"
              :search="search"
              :loading="loadingTable"
              show-select
              v-model="selected"
            >
              <template v-slot:[`item.item_moneda`]="{ item }">
                <v-autocomplete
                  :items="$store.state.itemsCoinsList"
                  v-model="id_coins"
                  item-text="acronym"
                  item-value="id"
                  label="Moneda"
                  v-on:blur="calcularTotales()"
                  :disabled="
                    selected.filter((v) => v.id == item.id).length == 0
                  "
                  v-if="item.tipo == 'A'"
                ></v-autocomplete>
                <p v-else>
                  {{ acronym }}
                </p>
              </template>
              <!--  -->
              <template v-slot:[`item.tipo_cambio`]="{ item }">
                <v-text-field
                  v-model="item.tipocambio"
                  type="number"
                  step="0.01"
                  :disabled="
                    selected.filter((v) => v.id == item.id).length == 0
                  "
                  v-on:blur="calcularTotales()"
                  @focus.native="calcularTotales()"
                ></v-text-field>
              </template>
              <!--  -->
              <template v-slot:[`item.parcial`]="{ item }">
                <v-btn
                  v-if="item.tipo == 'CG'"
                  small
                  icon
                  color="primary"
                  @click="generarPagoParcial(item)"
                  :disabled="
                    selected.filter((v) => v.id == item.id).length == 0
                  "
                >
                  <v-icon v-if="item.iscontrolgasto == true">
                    mdi-credit-card-off-outline
                  </v-icon>
                </v-btn>
                <v-text-field
                  :disabled="
                    selected.filter((v) => v.id == item.id).length == 0
                  "
                  v-else
                  :prefix="acronym"
                  type="number"
                  v-model="item.monto_mon_ex"
                  v-on:input="calcularTotales()"
                  v-on:blur="calcularTotales()"
                  @focus.native="calcularTotales()"
                  :error-messages="item.errorEx"
                ></v-text-field>
              </template>
            </v-data-table>
          </v-card-text>
        </v-tab-item>
        <v-tab-item value="ref2">
          <v-card-text>
            <v-row class="mt-5">
              <v-col cols="3">
                <v-text-field
                  v-model="nro_operacion"
                  label="N° de Operación"
                  v-on:blur="ValidaNroOp()"
                  :error-messages="msgNroOperacion"
                  id="nro_operacion"
                ></v-text-field>
              </v-col>
              <v-col cols="3" md="3">
                <v-text-field
                  type="date"
                  v-model="date"
                  label="Fecha "
                ></v-text-field>
              </v-col>
              <v-col md="6" cols="6"> </v-col>

              <v-col md="4" cols="4">
                <v-autocomplete
                  :items="cuentas"
                  item-text="label"
                  item-value="id"
                  label="CUENTA BANCARIA"
                  v-model="id_cuenta"
                  return-object
                ></v-autocomplete>
              </v-col>
              <v-col md="4" cols="4">
                <v-text-field
                  readonly
                  v-model="id_cuenta.banco"
                  label="Banco:"
                ></v-text-field>
              </v-col>
              <v-col md="4" cols="4">
                <v-text-field
                  readonly
                  v-model="id_cuenta.moneda"
                  label="Moneda:"
                ></v-text-field>
              </v-col>
              <v-col md="4" cols="4"
                ><v-text-field
                  readonly
                  v-model="id_cuenta.cuenta"
                  label="N° Cuenta:"
                ></v-text-field
              ></v-col>
              <v-col md="4" cols="4"
                ><v-text-field
                  readonly
                  v-model="id_cuenta.cci"
                  label="CCI:"
                ></v-text-field
              ></v-col>
              <v-col md="4" cols="4"
                ><v-text-field
                  v-model="comentarios"
                  label="Comentarios"
                  placeholder="Comentarios......"
                ></v-text-field
              ></v-col>
              <v-col md="12" cols="12">
                <ArrastraYSolarComponent @idArchivoCargado="recibirId" />
              </v-col>
            </v-row>
          </v-card-text>
          <v-card-actions>
            <v-spacer></v-spacer>
            <v-btn
              color="success"
              @click="registrarPago()"
              :disabled="!id_cuenta"
              :loading="loadingPago"
            >
              PROCESAR PAGO
            </v-btn>
            <v-btn color="red" @click="$emit('cancelar')">Cancelar</v-btn>
          </v-card-actions>
        </v-tab-item>
      </v-tabs>
    </v-card-text>
    <!-- ---------------------------------------------- -->
    <v-dialog
      v-model="dialog"
      :overlay="false"
      max-width="70%"
      transition="dialog-transition"
    >
      <v-card>
        <v-card-title primary-title> Realizar Pago Parcial </v-card-title>
        <v-card-text>
          <v-data-table
            show-select
            v-model="selectedParcial"
            :headers="headersParcial"
            :items="detalles"
            class="elevation-1"
            item-key="id"
          >
          </v-data-table>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn text color="green" @click="guardarMontoParciales()"
            >Aceptar</v-btn
          >
          <v-btn color="red" @click="dialog = !dialog">Cancelar</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-card>
</template>

<script>
import axios from "axios";
import moment from "moment";
import { mapActions, mapState } from "vuex";
import Swal from "sweetalert2";
import ArrastraYSolarComponent from "../comun/ArrastraYSolarComponent.vue";
export default {
  props: { limpar: Boolean },
  async mounted() {
    await this.cargarProveedores();
    await this.getListBanksDetailsCargar();
  },
  components: {
    ArrastraYSolarComponent,
  },
  data() {
    return {
      loading: false,
      msgNroOperacion: "",
      comentarios: "",
      montoDolar: 0.0,
      id_coins: 1,
      montoMonExt: 0.0,
      acronym: "USD",
      dialog: false,
      loadingPago: false,
      headersParcial: [
        { text: "Concepto", value: "concepto" },
        { text: "Total Operaciones (USD)", value: "total_op" },
        { text: "Moneda Cuenta Banco", value: "acronym" },
        { text: "Total Cuenta Banco", value: "totalopcuentabanco" },
      ],
      detalles: [],
      lstPagos: [],
      payfile: [],
      cuentas: [],
      selected: [],
      selectedParcial: [],
      totalDeuda: 0,
      totalMonto: 0,
      tab: null,
      step2: true,
      boolFile: false,
      id_cuenta: "",
      nro_operacion: "",
      search: "",
      tipocambio: 1,
      payPath: 0,
      date: "",
      dataList: false,
      cabPagos: [
        // {
        //   text: "Expediente",
        //   value: "nro_master",
        //   shortable: false,
        // },

        {
          text: "Master",
          value: "code_master",
          shortable: false,
        },
        { text: "Factura/ Proforma", value: "expedientes" },
        {
          text: "Procedencia",
          value: "procedencia",
          shortable: false,
        },
        { text: "Monto (USD)", value: "monto_dolar" },
        {
          text: "Monto Factura",
          value: "monto_banco",
          shortable: false,
        },
        {
          text: "Tipo Cambio",
          value: "tipo_cambio",
        },

        {
          text: "Moneda Pagar",
          value: "item_moneda",
        },
        {
          text: "Monto Pagar",
          value: "parcial",
          shortable: false,
        },
      ],
      msgfile: "",
      errfile: "",
      proveedor: "",
      loadingTable: false,
    };
  },
  methods: {
    ...mapActions([
      "cargarProveedores",
      "_getCoinsList",
      // "_uploadFile",
      "getValidaNroOp",
    ]),

    calcularTotales() {
      let mondolar = 0;
      let monex = 0;
      let mon_ex = 0;
      this.selected.forEach(async (element) => {
        if (element.tipo == "CG") {
          mon_ex = 0;
          await element.details.forEach((element2) => {
            if (!!element2.pagar) {
              element.tipocambio = parseFloat(element2.tipocambio).toFixed(2);
              mon_ex =
                parseFloat(mon_ex) + parseFloat(element2.totalopcuentabanco);
              mondolar = parseFloat(mondolar) + parseFloat(element2.total_op);
              monex =
                parseFloat(monex) + parseFloat(element2.totalopcuentabanco);
            }
            this.id_coins = element2
              ? this.$store.state.itemsCoinsList.filter(
                  (v) => v.acronym == element2.acronym,
                )[0].id
              : 1;
          });
          element.monto_mon_ex = mon_ex;
        } else {
          element.monto_mon_ex = element.monto_mon_ex
            ? element.monto_mon_ex
            : element.monto_banco;

          monex += parseFloat(element.monto_mon_ex);
          // if (
          //   !element.monto_mon_ex ||
          //   typeof element.monto_mon_ex == "undefined"
          // ) {
          //   element.monto_mon_ex = parseFloat(
          //     element.monto_dolar * element.tipocambio
          //   ).toFixed(2);
          //   monex += parseFloat(
          //     element.monto_mon_ex ? element.monto_mon_ex : 0.0
          //   );
          // } else {
          //   element.monto_mon_ex = parseFloat(
          //     parseFloat(element.monto_dolar) * parseFloat(element.tipocambio)
          //   ).toFixed(2);
          //   monex = parseFloat(
          //     parseFloat(element.monto_dolar) * parseFloat(element.tipocambio)
          //   ).toFixed(2);
          // }
        }

        this.acronym = this.$store.state.itemsCoinsList.filter(
          (v) => v.id == this.id_coins,
        )[0].acronym;
      });

      this.montoMonExt = parseFloat(monex).toFixed(2);
      this.calcularTotalesInput();
      this.acronym = this.$store.state.itemsCoinsList.filter(
        (v) => v.id == this.id_coins,
      )[0].acronym;
    },

    async calcularTotalesInput() {
      let monex = 0;
      await this.selected.forEach((element) => {
        element.errorEx = "";
        if (
          parseFloat(element.monto_mon_ex) >
          parseFloat(
            parseFloat(element.monto_banco) * parseFloat(element.tipocambio),
          )
        ) {
          element.errorEx =
            "El monto no puede ser mayor que el monto como deuda";
        } else {
          monex = parseFloat(monex) + parseFloat(element.monto_mon_ex);
        }
      });
    },
    async listarPagosXControlGasto() {
      var vm = this;
      vm.loadingTable = true;
      vm.lstPagos = [];
      vm.nro_operacion = null;
      vm.payfile = null;
      vm.msgfile = null;
      vm.errfile = null;
      vm.id_cuenta = "";
      vm.comentarios = null;
      if (!!vm.proveedor) {
        var config = {
          method: "get",
          url:
            process.env.VUE_APP_URL_MAIN +
            "listPagoControlGastoXProveedor/" +
            vm.proveedor,
          headers: {
            "auth-token": sessionStorage.getItem("auth-token"),
            "Content-Type": "application/json",
          },
        };
        await axios(config)
          .then(function (response) {
            let res = response.data;

            if (typeof res.data != "undefined") {
              let data = response.data.data;
              data.forEach((element) => {
                element.tipocambio = element.tipocambio
                  ? element.tipocambio
                  : 1;
              });
              let index = 0;
              data.forEach((element) => {
                element.index = index;
                index++;
              });
              vm.lstPagos = data;
              vm.loadingTable = false;
            } else {
              vm.lstPagos = [];
              vm.loadingTable = false;
              Swal.fire({
                icon: "info",
                title: "AVISO IMPORTANTE",
                text: response.data.mensaje,
              });
            }
          })
          .catch(function (error) {
            console.log(error);
          });
        vm.dataList = true;
      } else {
        vm.lstPagos = [];
        vm.loadingTable = false;
        vm.tab = 1;
        vm.payfile = [];
      }
    },
    calcularMontoPagar() {
      if (this.lstPagos.length > 0) {
        let monto = this.lstPagos
          .filter((v) => v.pagar == true)
          .map((item) => item.monto)
          .reduce((a, b) => parseFloat(a) + parseFloat(b), parseFloat(0));
        this.totalMonto = parseFloat(monto).toFixed(2);
      } else {
        this.totalMonto = 0;
      }
    },
    guardarMontoParciales() {
      let a = null;

      this.item.details.forEach((element) => {
        a = this.selectedParcial.filter((v) => v.id == element.id).length;
        if (a == 1) {
          element.pagar = true;
        } else {
          element.pagar = false;
        }
      });

      this.calcularTotales();
      this.dialog = false;
    },
    async getListBanksDetailsCargar() {
      let vm = this;
      var config = {
        method: "get",
        url: process.env.VUE_APP_URL_MAIN + "getListBanksDetailsCargar",
        params: {
          id_branch: JSON.parse(sessionStorage.getItem("dataUser"))[0]
            .id_branch,
        },
        headers: {
          "auth-token": sessionStorage.getItem("auth-token"),
          "Content-Type": "application/json",
        },
      };
      await axios(config)
        .then(function (response) {
          let data = response.data.data;

          vm.cuentas = data;
        })
        .catch(function (error) {
          console.log(error);
        });
    },
    continuar() {
      // if (this.validar()) {
      this.step2 = false;
      this.tab = "ref2";
      // }
    },
    _uploadFile() {
      var vm = this;
      vm.msgfile = "";
      vm.errfile = "";
      if (vm.payfile) {
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
            "auth-token": sessionStorage.getItem("auth-token"),
            "Content-Type": "application/json",
          },
          data: data,
        };

        axios(config)
          .then(function (response) {
            vm.boolFile = true;
            vm.payPath = JSON.stringify(response.data.data[0].insertid);
            vm.msgfile = "Archivo Cargado correctamente.";
          })
          .catch(function (error) {
            vm.errfile =
              "Ocurrió un problmea conuníquese con el administrador del sistema";
            console.log(error);
          });
      }
    },
    async registrarPago() {
      if (
        this.$store.state.files.payPath == 0 ||
        !this.$store.state.files.payPath
      ) {
        Swal.fire({
          icon: "warning",
          title: "Soporte de Pago",
          text: "SE SUGIERE GUARDAR EL SOPORTE DE PAGO POR FAVOR ANEXARLO",
          confirmButtonText: "Continuar, sin soporte",
          cancelButtonText: "Cancelar",
          showDenyButton: false,
          allowEnterKey: false,
          allowOutsideClick: false,
          allowEscapeKey: false,
          showCancelButton: true,
          cancelButtonColor: "#B71C1C",
        }).then((res) => {
          if (res.isConfirmed) {
            this.pagar();
          }
        });
        return false;
      }
      this.pagar();
    },
    async pagar() {
      let vm = this;
      vm.loadingPago = true;
      let isaprobacion = vm.selected.map((element) => {
        return element.isaprobacion;
      });
      let iscontrolgasto = vm.selected.map((element) => {
        return element.iscontrolgasto;
      });
      let isprogramado = vm.selected.map((element) => {
        return element.isprogramado;
      });
      let id = vm.selected.map((element) => {
        return element.id;
      });
      let monto = vm.selected.map((element) => {
        return element.monto_mon_ex;
      });

      let tipo = vm.selected.map((element) => {
        return element.tipo;
      });
      let id_concepto = [];
      vm.selected
        .filter((v) => v.iscontrolgasto == true)
        .forEach((element) => {
          element.details.forEach((detalle) => {
            if (detalle.pagar == true) {
              id_concepto.push(detalle.id);
            }
          });
        });

      let data = {
        isaprobacion: isaprobacion,
        iscontrolgasto: iscontrolgasto,
        isprogramado: isprogramado,
        id: id,
        monto: monto,
        id_concepto: id_concepto,
        id_path: vm.$store.state.files.payPath,
        id_cuenta: vm.id_cuenta.id,
        fecha: vm.date,
        nro_operacion: vm.nro_operacion,
        id_proveedor: vm.proveedor,
        id_user: JSON.parse(sessionStorage.getItem("dataUser"))[0].id_user,
        tipocambio: vm.selected.map((element) => {
          return element.tipocambio;
        }),
        id_coins: vm.id_coins,
        comentarios: vm.comentarios,
        tipo: tipo,
        id_correlativo: vm.selected.map((element) => {
          return element.id_correlativo ? element.id_correlativo : null;
        }),
      };

      var config = {
        method: "post",
        url: process.env.VUE_APP_URL_MAIN + "registro_pago_detalles",
        headers: {
          "auth-token": sessionStorage.getItem("auth-token"),
          "Content-Type": "application/json",
        },
        data: data,
      };
      await axios(config)
        .then(function (response) {
          vm.$store.state.files.payPath = null;
          if (response.data.statusBol) {
            vm.$swal({
              icon: "success",
              title: "AVISO",
              text: response.data.data.msg,
            });

            vm.$store.state.actualizar = !vm.$store.state.actualizar;
          }
        })
        .catch(function (error) {
          console.log(error);
        });
      this.loadingPago = false;
      this.$emit("cerrarModal", true);
    },
    async limpiarFormulario() {
      this.proveedor = null;
      this.lstPagos = [];
      this.payfile = [];
      this.cuentas = [];
      this.selected = [];
      this.totalDeuda = 0;
      this.totalMonto = 0;
      this.tab = null;
      this.step2 = true;
      this.boolFile = false;
      this.id_cuenta = "";
      this.nro_operacion = "";
      this.search = "";
      this.payPath = 0;
      this.date = moment(new Date()).format("YYYY-MM-DD");
      await this.cargarProveedores();

      await this.getListBanksDetailsCargar();
    },
    generarPagoParcial(item) {
      this.item = item;
      this.selectedParcial = item.details.filter((v) => v.pagar == true);
      this.detalles = item.details;
      this.dialog = true;
    },
    obtenerMontoPagar() {
      this.totalMonto = 0;
      let monto = 0;
      this.selected.forEach((element) => {
        if (element.iscontrolgasto == true) {
          element.details.forEach((detalles) => {
            if (detalles.pagar) {
              monto += parseFloat(detalles.total_op);
            }
          });
        } else {
          monto += parseFloat(element.monto_actual);
        }
      });
      this.totalMonto = parseFloat(monto).toFixed(2);
    },
    async ValidaNroOp() {
      this.msgNroOperacion = "";
      this.$store.state.spiner = true;
      await this.getValidaNroOp(this.nro_operacion);
      if (!!this.$store.state.bancos.validacionBanco.estadoflag) {
        this.msgNroOperacion = this.$store.state.bancos.validacionBanco.mensaje;
        document.getElementById("nro_operacion").focus();
      } else {
        this.msgNroOperacion = "";
      }

      this.$store.state.spiner = false;
    },
    moverSeleccionadoAlInicio() {
      const listaPagos = this.$store.state.listPagosXProveedorCxP;

      const seleccionadosIds = new Set(this.selected.map((item) => item.id));

      listaPagos.sort((a, b) => {
        const aSeleccionado = seleccionadosIds.has(a.id);
        const bSeleccionado = seleccionadosIds.has(b.id);

        if (aSeleccionado && !bSeleccionado) return -1;
        if (!aSeleccionado && bSeleccionado) return 1;
        return 0;
      });
    },
    recibirId(file) {
      console.log(file);
      this.payPath = file.inserid;
      this.payfile = file.archivo;

      this.msgfile = "Archivo procesado y vinculado correctamente.";
      this.errfile = "";
    },
  },
  computed: {
    ...mapState(["provedores", "limpiar"]),
  },
  watch: {
    selected(newVal, oldVal) {
      this.calcularTotales();
      if (newVal.length > oldVal.length) {
        this.$nextTick(() => {
          this.moverSeleccionadoAlInicio();
        });
      }
    },
  },
};
</script>

<style></style>
