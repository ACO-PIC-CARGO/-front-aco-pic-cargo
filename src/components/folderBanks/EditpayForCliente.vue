<template>
  
    <v-container fluid>
      <!-- v-model="value" -->
      <v-tabs color="#A43542" slider-color="primary" fixed-tabs v-model="tab">
        <v-tab href="#ref1">STEP 1</v-tab>
        <v-tab href="#ref2" :disabled="step2">STEP 2</v-tab>
        <v-tab-item value="ref1">
          <v-row class="mt-5">
            <v-col md="12" cols="12">
              <h1 v-if="tipo == 'nuevo'">
                MONTO A COBRAR :{{ symbol }} {{ total }}
              </h1>
              <h1 v-else>MONTO TOTAL : {{ totalPagado }}</h1>
            </v-col>
            <v-col md="4" cols="4">
              <v-autocomplete
                :items="clientes"
                item-text="namelong"
                item-value="id"
                label="Cliente"
                v-model="id_proveedor"
                return-object
                clearable
                :readonly="tipo == 'ver'"
                @change="obtenerListado()"
              >
              </v-autocomplete>
            </v-col>

            <v-col
              md="12"
              cols="12"
              v-if="$store.state.listPagosXProveedorCxP.length > 0"
            >
              <v-data-table
                :headers="headers"
                :items="listPagosXProveedorCxP"
                show-select
                v-model="selected"
              >
                <template v-slot:[`item.moneda`]="{ item }">
                  <v-autocomplete
                    :items="$store.state.itemsCoinsList"
                    v-model="id_coins"
                    item-text="acronym"
                    item-value="id"
                    label="Moneda"
                    v-on:blur="obtenerSymbol()"
                    :disabled="
                      selected.filter((v) => v.id == item.id).length == 0
                    "
                  ></v-autocomplete>
                </template>
                <template v-slot:[`item.montopagar`]="{ item }">
                  <v-text-field
                    :prefix="symbol"
                    v-model="item.montopagar"
                    type="number"
                    :max="item.montopagar"
                    :disabled="
                      selected.filter((v) => v.index == item.index).length == 0
                    "
                    v-on:blur="calcularTotal()"
                    @focus.native="calcularTotal()"
                    :error-messages="item.err"
                  >
                  </v-text-field>
                </template>
                <template v-slot:[`item.maxpagar`]="{ item }">
                  {{ item.symbol }} {{ item.max_pagar }}
                </template>
                <template v-slot:[`item.tipocambio`]="{ item }">
                  <v-text-field
                    v-on:blur="calcularMonto()"
                    v-model="item.tipocambio"
                    @focus.native="calcularMonto()"
                    type="number"
                    :disabled="
                      selected.filter((v) => v.index == item.index).length == 0
                    "
                  >
                  </v-text-field>
                </template>
              </v-data-table>
            </v-col>
            <v-col
              md="12"
              cols="12"
              v-if="$store.state.listPagosXProveedorCxP.length > 0"
            >
              <v-flex text-right v-if="tipo == 'nuevo'">
                <v-btn color="success" @click="continuar()"> Continuar </v-btn>
              </v-flex>
            </v-col>
          </v-row>
        </v-tab-item>
        <v-tab-item value="ref2">
          <v-col md="12" cols="12">
            <h1>MONTO A COBRAR : {{ symbol }} {{ total }}</h1>
          </v-col>
          <v-row class="mt-5">
            <v-col cols="4" md="4">
              <v-text-field
                type="date"
                v-model="date"
                label="Fecha "
              ></v-text-field>
            </v-col>
            <v-col md="6" cols="6" v-if="tipo == 'nuevo'">
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
                <v-chip color="success" v-if="boolFile">
                  Documento Cargado
                </v-chip>
              </v-flex>
            </v-col>
            <v-col md="2" cols="2" v-if="!boolFile && tipo == 'nuevo'">
              <v-btn color="info" @click="_uploadFile()">
                <v-icon class="mx-1" dense small>
                  mdi-cloud-upload-outline
                </v-icon>
                Upload
              </v-btn>
            </v-col>
            <v-col md="6" v-if="tipo != 'nuevo'">
              <h6>DOCUMENTO:</h6>
              <v-simple-table>
                <tbody>
                  <tr>
                    <td>{{ name_path }}</td>
                    <td>
                      <v-btn
                        icon
                        color="red"
                        :href="url_documento"
                        target="_blank"
                      >
                        <v-icon>mdi-file-pdf-box</v-icon>
                      </v-btn>
                    </td>
                  </tr>
                </tbody>
              </v-simple-table>
            </v-col>
            <v-col md="4" cols="4">
              <v-autocomplete
                :items="cuentas.filter((v) => v.symbol == symbol)"
                item-text="label"
                item-value="id"
                label="Cuenta Destino (PIC)"
                v-model="id_cuenta"
                return-object
                :readonly="tipo == 'ver'"
              ></v-autocomplete>
            </v-col>
            <v-col md="4" cols="4">
              <v-text-field
                readonly
                v-model="id_cuenta.banco"
                label="Banco:"
                v-if="tipo == 'nuevo'"
              ></v-text-field>
            </v-col>
            <v-col md="4" cols="4">
              <v-text-field
                readonly
                v-model="id_cuenta.moneda"
                label="Moneda:"
                v-if="tipo == 'nuevo'"
              ></v-text-field>
            </v-col>
            <v-col md="4" cols="4"
              ><v-text-field
                readonly
                v-model="id_cuenta.cuenta"
                label="N° Cuenta:"
                v-if="tipo == 'nuevo'"
              ></v-text-field
            ></v-col>
            <v-col md="4" cols="4">
              <v-select
                :items="$store.state.itemsDataBanksList"
                v-model="id_banco_origen"
                label="Banco Origen"
                item-text="acronym"
                item-value="id"
              ></v-select>
            </v-col>
            <v-col md="4" cols="4"
              ><v-text-field
                v-model="nro_operacion"
                label="Nro Operacion"
                v-if="tipo == 'nuevo'"
              ></v-text-field
            ></v-col>
            <v-col md="12" cols="12" v-if="tipo == 'nuevo'">
              <v-flex text-right>
                <v-btn
                  :loading="loading"
                  :disabled="
                    !id_cuenta.id ||
                    !nro_operacion ||
                    !id_banco_origen 
                  "
                  color="success"
                  @click="_putPayForProveedor()"
                >
                  PROCESAR PAGO
                </v-btn>
              </v-flex>
            </v-col>
          </v-row>
        </v-tab-item>
      </v-tabs>
    </v-container>
  
</template>

<script>
import axios from '@/api/axios-config';

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
          text: "Fecha",
          value: "fecha",
        },

        {
          text: "House",
          value: "codigo_house",
        },

        {
          text: "Cliente Pagó",
          value: "statuspago",
        },
        {
          text: "Monto Dolar",
          value: "monto_pagar",
        },

        {
          text: "Monto Moneda Banco",
          value: "maxpagar",
        },

        {
          text: "Moneda",
          value: "moneda",
        },
        {
          text: "Tipo Cambio",
          value: "tipocambio",
        },
        {
          text: "Pago Parcial",
          value: "montopagar",
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

    vm.$store.state.spiner = false;
  },
  methods: {
    ...mapActions([
      "_getListaPagosXProveedorCxC",
      "getListBanksDetailsCargar",
      "_getCoinsList",
      "cargarClientes",
      "_getBanksList",
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
