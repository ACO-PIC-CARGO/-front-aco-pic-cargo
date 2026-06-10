<template>
  <v-container class="mt-0">
    <v-tabs color="#A43542" slider-color="primary" fixed-tabs v-model="tab">
      <v-tab href="#ref1">STEP 1</v-tab>
      <v-tab href="#ref2" :disabled="selected.length == 0">STEP 2</v-tab>
      <v-tab-item value="ref1">
        <h2>Monto a Pagar: {{ parseFloat(monto_usd).toFixed(2) }} USD</h2>
        <v-autocomplete
          :items="this.$store.state.provedores"
          item-text="label"
          item-value="id"
          label="Proveedor"
          v-model="proveedor"
          return-object
          clearable
          @change="obtenerListado()"
        >
        </v-autocomplete>
        <v-data-table
          v-model="selected"
          :headers="headers"
          show-select
          :items="$store.state.controlGastos.listCorrelativo"
          :search="search"
          item-key="index"
        >
          <template v-slot:[`item.pago`]="{ item }">
            {{ item.acronym }} {{ item.monto_pagarcuentabanco }}
          </template>
          <template v-slot:[`item.parcial`]="{ item }">
            <v-btn
              small
              icon
              color="primary"
              @click="generarPagoParcial(item)"
              :disabled="
                selected.filter(
                  (v) =>
                    v.id_master == item.id_master &&
                    v.id_correlativo == item.id_correlativo
                ).length == 0
              "
            >
              <v-icon>mdi-credit-card-off-outline</v-icon>
            </v-btn>
          </template>
        </v-data-table>
        <v-flex text-right>
          <v-btn
            color="success"
            :disabled="selected.length == 0"
            @click="continuar()"
          >
            Continuar
          </v-btn>
        </v-flex>
      </v-tab-item>
      <v-tab-item value="ref2">
        <v-form ref="formCuentas">
          <v-row>
            <v-col md="4" cols="4">
              <v-text-field
                v-model="nro_operacion"
                label="N° de Operación"
                :rules="[(v) => !!v || 'Datos Requerido']"
              ></v-text-field>
            </v-col>
            <v-col cols="4" md="4">
              <v-text-field
                type="date"
                v-model="date"
                label="Fecha de Pago"
                :rules="[(v) => !!v || 'Datos Requerido']"
              ></v-text-field>
            </v-col>
            <v-col md="4" cols="4">
              <v-flex>
                <v-file-input
                  v-model="payfile"
                  label="Soporte de Pago"
                  show-size
                  truncate-length="50"
                  @change="_uploadFile()"
                  clearable
                  :success-messages="msgfile"
                  :error-messages="errfile"
                  :rules="[(v) => !!v || 'Datos Requerido']"
                >
                </v-file-input>
              </v-flex>
            </v-col>

            <v-col md="4" cols="4">
              <v-autocomplete
                :items="$store.state.cuentas_pic"
                item-text="label"
                item-value="id"
                label="CUENTA BANCARIA"
                v-model="id_cuenta"
                return-object
                :rules="[(v) => !!v || 'Datos Requerido']"
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

            <v-col md="12" cols="12">
              <v-flex text-right>
                <v-btn color="success" @click="guardar()">
                  PROCESAR PAGOS
                </v-btn>
              </v-flex>
            </v-col>
          </v-row>
        </v-form>
      </v-tab-item>
    </v-tabs>
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
          <v-btn text color="red" @click="dialog = !dialog">Cancelar</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script>
import axios from '@/api/axios-config';;
import moment from "moment";
import { mapActions } from "vuex";
export default {
  data() {
    return {
      tab: null,
      step2: true,
      selected: [],
      selectedParcial: [],
      proveedor: "",
      search: "",
      detalles: [],
      dialog: false,
      item: null,
      monto_usd: 0,
      monto_banco: 0,
      boolFile: false,
      nro_operacion: null,
      id_cuenta: "",
      payfile: null,
      msgfile: "",
      errfile: "",
      date: moment(new Date()).format("YYYY-MM-DD"),
      headers: [
        { text: "Código Master", value: "code_master" },
        { text: "Correlativo", value: "description_correlativo" },
        { text: "Conceptos", value: "conceptos" },
        // { text: "details", value: "details" },
        { text: "Monto Pagar (USD)", value: "monto_pagar" },
        { text: "Monto Pagar Cuenta", value: "pago" },
        { text: "Pago Parcial", value: "parcial" },
      ],
      headersParcial: [
        { text: "Concepto", value: "concepto" },
        { text: "Total Operaciones (USD)", value: "total_op" },
        { text: "Moneda Cuenta Banco", value: "acronym" },
        { text: "Total Cuenta Banco", value: "totalopcuentabanco" },
      ],
    };
  },
  async mounted() {
    this.$store.state.spiner = true;
    await this.cargarProveedores();
    await this.getListBanksDetailsCargar();

    this.$store.state.spiner = false;
  },
  methods: {
    ...mapActions([
      "getListBanksDetailsCargar",
      "cargarProveedores",
      "listarCGECcorralativo",
    ]),
    continuar() {
      this.step2 = false;
      this.tab = "ref2";
    },
    async obtenerListado() {
      if (this.proveedor) {
        this.$store.state.spiner = true;
        await this.listarCGECcorralativo(this.proveedor.id);
        this.$store.state.spiner = false;
      }
    },
    generarPagoParcial(item) {
      this.item = item;
      this.selectedParcial = item.details.filter((v) => v.pagar == true);
      this.detalles = item.details;
      this.dialog = true;
    },
    obtenerMontoPagar() {
      this.monto_usd = 0;
      this.selected.forEach((element) => {
        element.details.forEach((detalles) => {
          if (detalles.pagar) {
            this.monto_usd += parseFloat(detalles.total_op);
          }
        });
      });
    },
    guardarMontoParciales() {
      let a = null;
      let monto_op = 0;
      let monto_opcb = 0;

      this.item.details.forEach((element) => {
        a = this.selectedParcial.filter((v) => v.id == element.id).length;
        if (a == 1) {
          monto_op += parseFloat(element.total_op);
          monto_opcb += parseFloat(element.totalopcuentabanco);
          element.pagar = true;
        } else {
          element.pagar = false;
        }
      });
      this.item.monto_pagar = monto_op;
      this.item.monto_pagarcuentabanco = monto_opcb;

      this.obtenerMontoPagar();
      this.dialog = false;
    },
    async _uploadFile() {
      var vm = this;
      vm.msgfile = "";
      vm.errfile = "";
      if (vm.payfile) {
        var FormData = require("form-data");
        var fs = require("fs");
        var data = new FormData();
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
        vm.$store.state.spiner = true;
        axios(config)
          .then(function (response) {
            vm.boolFile = true;
            vm.payPath = JSON.stringify(response.data.data[0].insertid);
            vm.msgfile = "Archivo Cargado correctamente.";
          })
          .catch(function (error) {
            vm.errfile =
              "Ocurrió un problmea conuníquese con el administrador del sistema";
          });
        vm.$store.state.spiner = false;
      }
    },
    async guardar() {
      if (this.$refs.formCuentas.validate()) {
        let cge = [];
        this.selected.forEach((element) => {
          element.details.forEach((detalle) => {
            cge.push(detalle);
          });
        });
        var data = {
          control_gasto: cge,
          nro_operacion: this.nro_operacion,
          date: this.date,
          payPath: this.payPath,
          id_cuenta: this.id_cuenta.id,
        };
      }
    },
  },
  watch: {
    selected() {
      this.obtenerMontoPagar();
    },
  },
};
</script>

<style></style>
