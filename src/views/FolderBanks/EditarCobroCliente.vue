<template>
  <v-card elevation="10" class="pb-5">
    <!-- v-model="value" -->
    <v-col md="12" cols="12">
      <h1>MONTO A COBRAR :{{ symbol }} {{ getMontoTotal() }}</h1>
    </v-col>
    <v-tabs color="#A43542" slider-color="primary" fixed-tabs v-model="tab">
      <v-tab href="#ref1">STEP 1</v-tab>
      <v-tab href="#ref2">STEP 2</v-tab>
      <v-tab-item value="ref1" class="px-5">
        <v-row class="mt-5">
          <v-col md="4" cols="4">
            <v-autocomplete
              :items="clientes"
              item-text="namelong"
              item-value="id"
              label="Cliente"
              v-model="$store.state.bank.record.id_cliente"
              readonly
              @change="obtenerListado()"
            >
            </v-autocomplete>
          </v-col>

          <v-col md="12" cols="12">
            <v-data-table
              :headers="headers"
              :items="$store.state.bank.record.details"
            >
              <template v-slot:[`item.moneda`]="{ item }">
                <v-autocomplete
                  :items="$store.state.itemsCoinsList"
                  v-model="id_coins"
                  item-text="acronym"
                  item-value="id"
                  label="Moneda"
                  v-on:blur="obtenerSymbol()"
                ></v-autocomplete>
              </template>
              <template v-slot:[`item.montodolar`]="{ item }">
                <v-text-field
                  :prefix="symbol"
                  v-model="item.montodolar"
                  type="number"
                  :max="item.montodolar"
                  v-on:blur="calcularTotal()"
                  @focus.native="calcularTotal()"
                  :error-messages="item.err"
                >
                </v-text-field>
              </template>
              <template v-slot:[`item.montopagar`]="{ item }">
                <v-text-field
                  :prefix="symbol"
                  v-model="item.montopagar"
                  type="number"
                  :max="item.montopagar"
                  v-on:blur="calcularTotal()"
                  @focus.native="calcularTotal()"
                  :error-messages="item.err"
                >
                </v-text-field>
              </template>
              <template v-slot:[`item.monto_destino`]="{ item }">
                <v-text-field
                  v-model="item.monto_destino"
                  type="number"
                  :max="item.monto_destino"
                  v-on:blur="calcularTotal()"
                  @focus.native="calcularTotal()"
                  :error-messages="item.err"
                />
              </template>
              <template v-slot:[`item.tipocambio`]="{ item }">
                <v-text-field
                  v-on:blur="calcularMonto()"
                  v-model="item.tipocambio"
                  @focus.native="calcularMonto()"
                  type="number"
                >
                </v-text-field>
              </template>
              <template v-slot:[`item.action`]="{ item }">
                <v-btn icon>
                  <v-icon color="red" @click="anularCobro(item)"
                    >mdi-circle-off-outline</v-icon
                  >
                </v-btn>
              </template>
            </v-data-table>
          </v-col>
        </v-row>
      </v-tab-item>
      <v-tab-item value="ref2" class="px-5">
        <v-row class="mt-5">
          <v-col md="4" cols="4"
            ><v-text-field
              v-model="$store.state.bank.record.nro_operacion"
              label="Nro Operacion"
            ></v-text-field
          ></v-col>
          <v-col cols="4" md="4">
            <v-text-field
              type="date"
              v-model="$store.state.bank.record.fecha_pago"
              label="Fecha "
            ></v-text-field>
          </v-col>
          <v-col md="4" cols="4">
            <v-btn text @click="abrirSoporte($store.state.bank.record.ruta)">
              <v-icon color="red">mdi-file-pdf-box</v-icon>
              {{ $store.state.bank.record.nombre_archivo }}
            </v-btn>
            <v-flex>
              <v-file-input
                v-model="payfile"
                label="Soporte de Pago"
                show-size
                truncate-length="50"
                hide-details
                v-if="!boolFile"
              >
              </v-file-input>
            </v-flex>
          </v-col>

          <v-col md="4" cols="4">
            <v-autocomplete
              :items="cuentas"
              item-text="label"
              item-value="id"
              label="Cuenta Destino (PIC)"
              v-model="$store.state.bank.record.id_cuentadestino"
              return-object
            ></v-autocomplete>
          </v-col>
          <!-- <v-col md="4" cols="4">
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
          </v-col> -->
          <!-- <v-col md="4" cols="4"
            ><v-text-field
              readonly
              v-model="id_cuenta.cuenta"
              label="N° Cuenta:"
            ></v-text-field
          ></v-col> -->
          <v-col md="4" cols="4">
            <v-select
              :items="$store.state.itemsDataBanksList"
              v-model="$store.state.bank.record.id_banco_origin"
              label="Banco Origen"
              item-text="acronym"
              item-value="id"
            ></v-select>
          </v-col>

          <v-col md="12" cols="12">
            <v-flex text-right>
              <v-btn
                :loading="loading"
                color="success"
                @click="actualizarCobro()"
              >
                Actualizar
              </v-btn>
            </v-flex>
          </v-col>
        </v-row>
      </v-tab-item>
    </v-tabs>
  </v-card>
</template>

<script>
import axios from '@/api/axios-config';
import Swal from "sweetalert2";
import { mapActions, mapState } from "vuex";
export default {
  props: ["tipo"],
  data() {
    return {
      loading: false,
      date: "",
      symbol: "USD",
      payfile: [],
      selected: [],
      id_coins: 1,
      payPath: "",
      id_proveedor: "",
      boolFile: false,
      cuentas: [],
      id_cuenta: "",
      itemsClientes: [],
      tab: null,
      total: 0,
      step2: true,
      name_path: "",
      url_documento: "",
      totalPagado: 0,
      nro_operacion: "",
      id_banco_origen: "",
      headers: [
        {
          text: "House",
          value: "tipo_gasto",
        },

        // {
        //   text: "Cliente Pagó",
        //   value: "statuspago",
        // },
        {
          text: "Monto Dolar",
          value: "montodolar",
        },

        // {
        //   text: "Monto Moneda Banco",
        //   value: "maxpagar",
        // },

        {
          text: "Moneda",
          value: "moneda",
        },
        {
          text: "Tipo Cambio",
          value: "tipocambio",
        },
        {
          text: "Pago Mon Ex",
          value: "monto_destino",
        },
        {
          text: "Acción",
          value: "action",
        },
      ],
    };
  },
  async mounted() {
    let vm = this;

    vm.$store.state.spiner = true;
    await vm._getBanksList();
    await vm.cargarClientes();
    await vm.obtenerListado();
    await vm.getListBanksDetailsCargar();
    await vm.getListBanksDetailsCargar();
    await vm.limpiarDatos();
    await vm.obtenerDatos();
    await vm._getCoinsList();
    await this.verCobroRealizado(this.$route.params.nro_operacion);
    vm.$store.state.spiner = false;
    vm.$store.state.drawer = false;
  },
  methods: {
    ...mapActions([
      "_getListaPagosXProveedorCxC",
      "getListBanksDetailsCargar",
      "_getCoinsList",
      "cargarClientes",
      "_getBanksList",
      "verCobroRealizado",
      "anularCobroRealizado",
      "actualizarPagoRealizado",
    ]),
    async obtenerListado() {
      this.$store.state.listPagosXProveedorCxP.listPagosXProveedorCxP = [];
      this.date = "";
      this.payfile = [];
      this.boolFile = false;
      this.id_cuenta = "";
      this.id_banco_origen = "";
      this.nro_operacion = "";
      if (this.id_proveedor.id && this.tipo == "nuevo") {
        await this._getListaPagosXProveedorCxC(this.id_proveedor.id);
      } else {
        this.selected = [];
      }
    },
    async actualizarCobro() {
      let res = await this.actualizarPagoRealizado(
        this.$store.state.bank.record.details
      );

      Swal.fire({
        icon: res.estadoflag ? "success" : "error",
        text: res.mensaje,
      }).then((response) => {
        if (response.isConfirmed) {
          this.$router.go(-1);
        }
      });
    },
    getMontoTotal() {
      let monto = 0;
      this.$store.state.bank.record.details.forEach((element) => {
        monto += parseFloat(element.monto_destino);
      });
      return parseFloat(monto).toFixed(2);
    },
    async getListBanksDetailsCargar() {
      let vm = this;
      var config = {
        method: "get",
        url: process.env.VUE_APP_URL_MAIN + "getListBanksDetailsCargar",
        params: {
          id_branch: JSON.parse(sessionStorage.getItem("dataUser"))[0].id_branch,
        },
        headers: {
         
          "Content-Type": "application/json",
        },
      };
      await axios(config)
        .then(function (response) {
          vm.cuentas = response.data.data;
        })
        .catch(function (error) {
          console.log(error);
        });
    },

    validarMonto(details) {
      if (parseFloat(details.max_pagar) < parseFloat(details.monto_deuda)) {
        document.getElementById(`pago${details.id}`).focus();
      } else {
        this.calcularTotal();
      }
    },
    obtenerSymbol() {
      this.symbol = this.$store.state.itemsCoinsList.filter(
        (v) => v.id == this.id_coins
      )[0].symbol;
    },
    calcularMonto() {
      if (this.selected.length > 0) {
        this.selected.forEach((element) => {
          this.id_coins = element.id_coins;
          this.symbol = this.$store.state.itemsCoinsList.filter(
            (v) => v.id == this.selected[0].id_coins
          )[0].symbol;
          element.montopagar = parseFloat(
            element.monto_pagar * element.tipocambio
          ).toFixed(2);
          element.montopagar > element.max_pagar
            ? (element.err = "Monto Superior a la deuda ")
            : (element.err = "");
        });
        this.calcularTotal();
        this.obtenerSymbol();
      }
    },
    calcularTotal() {
      let sum = 0;
      this.selected.forEach((element) => {
        sum += parseFloat(element.montopagar);
      });
      this.total = parseFloat(sum).toFixed(4);
    },
    async anularCobro(item) {
      await Swal.fire({
        icon: "question",
        text: "¿Está seguro que desea anular el cobro realizado. ? Recuerde que este cambio no es reversible.",
        confirmButtonText: "Si, anular",
        cancelButtonText: "Cancelar",
        showDenyButton: false,
        showCancelButton: true,
      }).then(async (result) => {
        if (result.isConfirmed) {
          await this.anularCobroRealizado(item);
          this.$router.go(-1);
        }
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
    validar(registro = false) {
      let validacion = true;
      let msg = "";
      this.listPagosXProveedorCxP.forEach((element) => {
        let monto_deuda = 0;
        monto_deuda = parseFloat(element.monto_deuda).toFixed(4);
        let max_pagar = 0;
        max_pagar = parseFloat(element.max_pagar).toFixed(4);

        if (parseFloat(monto_deuda) > parseFloat(max_pagar)) {
          validacion = false;
          msg = "No puede realizar un pago mayor a la deuda. ";
        }
      });
      if (!this.payPath && registro) {
        validacion = false;
        msg += "Por favor, seleccione un documento para soporte de pago. ";
      }
      if (!this.id_cuenta && registro) {
        validacion = false;
        msg += "Por favor, seleccione una cuenta. ";
      }

      if (this.selected.length == 0) {
        validacion = false;
        msg += "Seleccione al menos una cuenta a pagar. ";
      }

      if (!validacion) {
        this.$swal({
          icon: "error",
          title: "Lo sentimos",
          text: msg,
        });
      }

      return validacion;
    },
    async _putPayForProveedor() {
      try {
        if (this.validar(true)) {
          let vm = this;
          vm.loading = true;
          var data = {
            id_proveedor: vm.id_proveedor.id,
            id_path: vm.payPath,
            details: vm.selected,
            id_cuenta: vm.id_cuenta.id,
            fecha: vm.date,
            nro_operacion: vm.nro_operacion,
            id_banco_origen: vm.id_banco_origen,
            id_coins: vm.id_coins,
          };
          var config = {
            method: "post",
            url: process.env.VUE_APP_URL_MAIN + "setPayForCustomer",

            headers: {
             
              "Content-Type": "application/json",
            },
            data: data,
          };
          await axios(config)
            .then(function (response) {
              if (response.data.statusBol == true) {
                vm.$swal({
                  icon: "success",
                  title: "Aviso",
                  text: response.data.data.msg,
                });
                vm.limpiarDatos();
              }
            })
            .catch(function (error) {
              console.log(error);
            });
          this.loading = false;
        }
      } catch (err) {
        console.log(err);
      }
    },
    continuar() {
      if (this.validar()) {
        this.step2 = false;
        this.tab = "ref2";
      }
    },
    limpiarDatos() {
      this.payfile = [];
      this.payPath = "";
      this.id_proveedor = "";
      this.selected = [];
      this.boolFile = false;
      this.tab = "ref1";
      this.step2 = true;
      this.total = 0;
      this.$store.state.listPagosXProveedorCxP = [];
    },
    async obtenerDatos() {
      if (this.tipo == "ver") {
        let vm = this;
        let id = vm.$route.params.id;

        var config = {
          method: "get",
          url: process.env.VUE_APP_URL_MAIN + `getVerPagosPorCustomer?id=` + id,

          headers: {
           
            "Content-Type": "application/json",
          },
        };
        await axios(config)
          .then(function (response) {
            vm.step2 = false;
            vm.id_proveedor = data.id_proveedor;
            vm.$store.state.listPagosXProveedorCxP = data.details;
            vm.id_cuenta = data.id_bank;
            vm.name_path = data.documento;
            vm.url_documento = data.link_documento;
            setTimeout(() => {
              vm.calcularTotalPagado();
            }, 200);
          })
          .catch(function (error) {
            console.log(error);
          });
      }
    },
    abrirSoporte(url) {
      console.log(url);
      window.open(url, "_blank");
    },
  },
  computed: {
    ...mapState(["itemsProveedorList", "listPagosXProveedorCxP", "clientes"]),
  },
  watch: {
    selected() {
      this.calcularMonto();
    },
  },
};
</script>

<style></style>
