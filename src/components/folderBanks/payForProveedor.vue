<template>
  <v-card class="px-5">
    <v-card-title primary-title>
      <v-row>
        <v-autocomplete
          :items="provedores"
          item-text="namelong"
          item-value="id"
          label="Proveedor"
          v-model="id_proveedor"
          return-object
          clearable
          :readonly="tipo == 'ver'"
          @change="obtenerListado()"
        >
        </v-autocomplete>
        <v-spacer></v-spacer>
      </v-row>
    </v-card-title>
    <v-card-text
      ><v-row>
        <v-col cols="3">
          <v-text-field
            style="font-size: 20pt"
            label="Monto en que va a salir del banco"
            v-model="montoMonExt"
            readonly
            :prefix="symbol"
          ></v-text-field>
          <!-- :prefix="acronym" -->
        </v-col>
      </v-row>
      <!-- v-model="value" -->
      <v-tabs color="#A43542" slider-color="primary" fixed-tabs v-model="tab">
        <v-tab href="#ref1">STEP 1</v-tab>
        <v-tab href="#ref2" :disabled="step2">STEP 2</v-tab>
        <v-tab-item value="ref1">
          <v-row class="mt-5">
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
            <v-col md="12" cols="12">
              <v-data-table
                :headers="headers"
                :items="listPagosXProveedorCxP"
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
                    :disabled="
                      selected.filter((v) => v.id == item.id).length == 0
                    "
                    @change="calcularTotales"
                  ></v-autocomplete>
                </template>
                <!--  -->
                <template v-slot:[`item.tipo_cambio`]="{ item }">
                  <v-text-field
                    v-model="tipocambio"
                    type="number"
                    step="0.01"
                    :disabled="
                      selected.filter((v) => v.id == item.id).length == 0
                    "
                    v-on:blur="calcularTotales()"
                    @focus.native="calcularTotales()"
                  ></v-text-field>
                </template>

                <template v-slot:[`item.monto_pagar_ex`]="{ item }">
                  <v-text-field
                    v-model="item.monto_mon_ext"
                    type="number"
                    :prefix="symbol"
                    v-on:blur="calcularTotalesInput()"
                    @focus.native="calcularTotalesInput()"
                    :error-messages="item.errorEx"
                  ></v-text-field>
                </template>
              </v-data-table>
            </v-col>
          </v-row>
        </v-tab-item>
        <v-tab-item value="ref2">
          <v-form ref="frmRegister">
            <v-row class="mt-5">
              <v-col md="3" cols="3">
                <v-text-field
                  v-model="nro_operacion"
                  label="N° de Operación"
                  v-on:blur="ValidaNroOp()"
                  :error-messages="msgNroOperacion"
                  id="nro_operacion"
                  :rules="[(v) => !!v || 'Datos Requerido']"
                  :success-messages="successMessages"
                ></v-text-field>
              </v-col>
              <v-col cols="3" md="3">
                <v-text-field
                  type="date"
                  v-model="date"
                  label="Fecha de Pago"
                  :rules="[(v) => !!v || 'Datos Requerido']"
                ></v-text-field>
              </v-col>
              <v-col md="6" cols="6">
                <!-- <v-file-input
                  label="Cargar Archivo"
                  v-model="payfile"
                  ref="fileInput"
                  @change="uploadFile()"
                  :success-messages="msgfile"
                  :error-messages="errfile"
                  :loading="loadingFile"
                >
                </v-file-input> -->
              </v-col>

              <v-col md="4" cols="4">
                <v-autocomplete
                  :items="(cuentas || []).filter((v) => v.symbol == symbol)"
                  item-text="label"
                  item-value="id"
                  label="Cuenta de Salida de Banco"
                  v-model="id_cuenta"
                  return-object
                  :readonly="tipo == 'ver'"
                  :rules="[(v) => !!v || 'Datos Requerido']"
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
              <v-col md="4" cols="4"
                ><v-text-field
                  readonly
                  v-model="id_cuenta.cci"
                  label="CCI:"
                  v-if="tipo == 'nuevo'"
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
              <v-col md="12" cols="12" v-if="tipo == 'nuevo'">
                <v-flex text-right>
                  <v-btn
                    color="success"
                    :loading="loading"
                    @click="_putPayForProveedor()"
                  >
                    PROCESAR PAGO
                  </v-btn>
                </v-flex>
              </v-col>
            </v-row>
          </v-form>
        </v-tab-item>
      </v-tabs>
    </v-card-text>
  </v-card>
</template>

<script>
import axios from "axios";
import Swal from "sweetalert2";
import { mapActions, mapState } from "vuex";
import ArrastraYSolarComponent from "../comun/ArrastraYSolarComponent.vue";
export default {
  components: {
    ArrastraYSolarComponent,
  },
  props: ["tipo"],
  data() {
    return {
      loading: false,
      loading: false,
      successMessages: "",
      search: "",
      montoMonExt: 0,
      selected: [],
      nro_operacion: "",
      id_coins: 1,
      date: new Date(Date.now() - new Date().getTimezoneOffset() * 60000)
        .toISOString()
        .substr(0, 10),
      payfile: [],
      payPath: "",
      id_proveedor: "",
      boolFile: false,
      cuentas: [],
      id_cuenta: "",

      tab: null,
      total: 0,
      step2: true,
      name_path: "",
      url_documento: "",
      totalPagado: 0,
      tipocambio: 1,
      comentarios: "",
      loadingFile: false,
      errfile: "",
      msgfile: "",
      headers: [
        {
          text: "Factura",
          value: "nro_factura",
        },

        {
          text: "Expediente",
          value: "codigo_house",
        },
        {
          text: "Procedencia",
          value: "procedencia",
        },

        {
          text: "Monto",
          value: "monto_pagar",
        },

        {
          text: "Monto Deuda",
          value: "monto_deuda",
        },

        {
          text: "Moneda Pagar",
          value: "item_moneda",
        },
        {
          text: "Tipo de Cambio",
          value: "tipo_cambio",
        },
        {
          text: "Monto Pagar",
          value: "monto_pagar_ex",
          shortable: false,
        },
      ],
      msgNroOperacion: "",
    };
  },
  async mounted() {
    console.log("ssss");
    let vm = this;
    vm.$store.state.files.payPath = null;
    vm.$store.state.files.datosPath = null;
    vm.tab = 1;
    await this.cargarProveedores();
    await this.obtenerListado();
    await this.getListBanksDetailsCargar();
    await this.limpiarDatos();
    await this._getCoinsList();
    setTimeout(() => {
      this.obtenerDatos();
    }, 1000);
    vm.$store.state.drawer = false;
  },
  methods: {
    ...mapActions([
      "_getListaPagosXProveedorCxP",
      "_uploadFile",
      "getValidaNroOp",
      "cargarProveedores",
      "_getCoinsList",
    ]),
    obtenerListado() {
      this.tab = 0;
      this.$store.state.listPagosXProveedorCxP = [];
      if (this.id_proveedor) {
        this._getListaPagosXProveedorCxP(this.id_proveedor.id);
      }
      this.selected = [];
    },
    calcularTotalesInput() {
      this.montoMonExt = this.selected.reduce((sum, pago) => {
        console.log(pago);
        return sum + parseFloat(pago.monto_mon_ext);
      }, 0);
      // this.
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
          vm.cuentas = response.data.data;
        })
        .catch(function (error) {
          console.log(error);
        });
    },
    validarMonto(details) {
      if (details.max_pagar > details.monto_deuda) {
        document.getElementById(`pago${details.id}`).focus();
      } else {
        this.calcularTotal();
      }
    },
    calcularTotal() {
      let sum = 0;
      this.listPagosXProveedorCxP.map((item) => {
        if (item.pagar) {
          if (item.cktotal) {
            sum += parseFloat(item.monto_deuda);
            item.max_pagar = item.monto_deuda;
          } else {
            sum += parseFloat(item.max_pagar);
          }
        }
      });
      this.total = parseFloat(sum).toFixed(4);
    },
    calcularTotalPagado() {
      let sum = 0;
      this.listPagosXProveedorCxP.map((item) => {
        sum += parseFloat(item.monto_pagar);
      });
      this.totalPagado = parseFloat(sum).toFixed(4);
    },
    setearMonto(details) {
      if (details.pagar) {
        this.listPagosXProveedorCxP.filter(
          (v) => v.id == details.id,
        )[0].cktotal = true;
      }
    },
    async uploadFile() {
      this.msgfile = "";
      this.errfile = "";
      if (this.payfile) {
        this.loadingFile = true;
        await this._uploadFile(this.payfile);
        this.loadingFile = false;
        this.$store.state.files.payPath
          ? (this.msgfile = "Archivo cargado")
          : (this.errfile = "Comuniquese con el admistrador");
      } else {
        this.errfile = "Dato Requerido";
      }
    },
    validar(registro = false) {
      let validacion = true;
      let msg = "";
      if (!this.payPath && registro) {
        validacion = false;
        msg += "Por favor, seleccione un documento para soporte de pago. ";
      }
      if (!this.id_cuenta && registro) {
        validacion = false;
        msg += "Por favor, seleccione una cuenta. ";
      }

      if (!this.listPagosXProveedorCxP.filter((v) => v.pagar).length > 0) {
        validacion = false;
        msg += "Seleccione al menos una cuenta a pagar. ";
      }

      if (
        this.listPagosXProveedorCxP.filter(
          (v) => parseFloat(v.monto_deuda) < parseFloat(v.max_pagar),
        ).length > 0
      ) {
        validacion = false;
        msg += "No puede realizar un pago mayor a la deuda. ";
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
            this.procesarPago();
          }
        });
        return false;
      }
      this.procesarPago();
    },
    async procesarPago() {
      this.loading = true;
      if (this.$refs.frmRegister.validate() && !this.msgNroOperacion) {
        let vm = this;
        var data = {
          id_coins: vm.id_coins,
          tipocambio: vm.id_coins == 1 ? 1 : vm.tipocambio,
          details: vm.selected,
          fecha_pago: vm.date,
          nro_operacion: vm.nro_operacion,
          comentarios: vm.comentarios,
          id_proveedor: vm.id_proveedor.id,
          id_path: vm.$store.state.files.payPath,
          id_proveedor: vm.id_proveedor.id,
          id_cuenta: vm.id_cuenta.id,
        };
        var config = {
          method: "post",
          url: process.env.VUE_APP_URL_MAIN + "setPayForProveedor",

          headers: {
            "auth-token": sessionStorage.getItem("auth-token"),
            "Content-Type": "application/json",
          },
          data: data,
        };
        await axios(config)
          .then(function (response) {
            if (response.data.statusBol == true) {
              console.log(response.data);
              vm.$store.state.files.payPath = null;
              vm.$swal({
                icon: "success",
                title: "Aviso",
                text: response.data.data[0].mensaje,
              }).then((result) => {
                if (result.isConfirmed) {
                  vm.$router.go(-1);
                }
              });
              // vm.$router.go(-1);
            }
          })
          .catch(function (error) {
            console.log(error);
          });
        this.loading = false;
      }
    },
    continuar() {
      if (
        this.selected.some((v) => {
          const condicion =
            parseFloat(v.monto_deuda) <
            parseFloat(
              parseFloat(v.monto_mon_ext) / parseFloat(this.tipocambio),
            ).toFixed(2);

          return condicion;
        })
      ) {
        Swal.fire({
          icon: "warning",
          title: "Advertencia",
          text: "No puede pagar más de la deuda. Verifique",
        });
        return false;
      }

      this.step2 = false;
      this.tab = "ref2";
    },
    calcularTotales() {
      let monex = 0;
      let coins = [...this.$store.state.itemsCoinsList];
      let moneda = coins.filter((v) => v.id == this.id_coins)[0];

      if (this.selected.length > 0) {
        if (moneda.acronym != "USD") {
          this.selected.forEach((element) => {
            element.monto_mon_ext = parseFloat(
              this.tipocambio * element.monto_deuda,
            ).toFixed(4);
            monex += parseFloat(element.monto_mon_ext);
          });
        }
        if (moneda.acronym == "USD") {
          this.tipocambio = 1;
          this.selected.forEach((element) => {
            console.log(element);
            element.monto_mon_ext = parseFloat(
              element.monto_deuda / this.tipocambio,
            ).toFixed(4);
            monex += parseFloat(element.monto_mon_ext).toFixed(2);
          });
        }
      }
      this.montoMonExt = parseFloat(monex).toFixed(2);
    },
    calculamonto_pagar_exrTotalesInput() {
      let monex = 0;
      if (this.selected.length > 0) {
        this.selected.forEach((element) => {
          monex += parseFloat(element.monto_mon_ext);
        });
      }
      this.montoMonExt = parseFloat(monex).toFixed(2);
    },
    limpiarDatos() {
      this.payfile = [];
      this.payPath = "";
      this.id_proveedor = "";
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
          url:
            process.env.VUE_APP_URL_MAIN + `getVerPagosPorProveedor?id=` + id,

          headers: {
            "auth-token": sessionStorage.getItem("auth-token"),
            "Content-Type": "application/json",
          },
        };
        await axios(config)
          .then(function (response) {
            let data = response.data.data[0];
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
    async ValidaNroOp() {
      this.msgNroOperacion = "";
      this.successMessages = "";
      this.$store.state.spiner = true;
      let res = await this.getValidaNroOp(this.nro_operacion);

      if (!!this.$store.state.bancos.validacionBanco.estadoflag) {
        this.msgNroOperacion = this.$store.state.bancos.validacionBanco.mensaje;
        document.getElementById("nro_operacion").focus();
      }

      if (res.mensaje) {
        this.successMessages = `Existen Operaciones con Nro(s) Similiares: ${res.mensaje}`;
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
      this.payPath = file.inserid;
      this.payfile = file.archivo;

      this.msgfile = "Archivo procesado y vinculado correctamente.";
      this.errfile = "";
    },
  },
  computed: {
    ...mapState(["itemsProveedorList", "listPagosXProveedorCxP", "provedores"]),
    symbol() {
      let symbol = "";
      const coin = this.$store.state.itemsCoinsList.find(
        (v) => v.id == this.id_coins,
      );
      if (coin) {
        symbol = coin.symbol;
      }
      return symbol;
    },
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
