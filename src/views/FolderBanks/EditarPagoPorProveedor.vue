<template>
  <v-card class="px-5">
    <v-card-title primary-title>
      <v-row>
        <v-autocomplete
          :items="provedores"
          item-text="namelong"
          item-value="id"
          label="Proveedor"
          v-model="$store.state.bank.record.id_proveedor"
          readonly
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
            style="font-size: 20pt; color: green"
            label="Monto en que va a salir del bancoss"
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
        <v-tab href="#ref2">STEP 2</v-tab>
        <v-tab-item value="ref1">
          <v-row class="mt-5">
            <v-col cols="3">
              <!-- <v-text-field label="Buscar..." v-model="search"></v-text-field> -->
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
                :items="$store.state.bank.record.detalle"
                v-model="selected"
              >
                <template v-slot:[`item.item_moneda`]="{ item }">
                  <v-autocomplete
                    :items="$store.state.itemsCoinsList"
                    v-model="item.id_coins"
                    item-text="acronym"
                    item-value="id"
                    label="Moneda"
                  ></v-autocomplete>
                </template>
                <!--  -->
                <template v-slot:[`item.tipo_cambio`]="{ item }">
                  <v-text-field
                    v-model="item.tipocambio"
                    type="number"
                    step="0.01"
                  ></v-text-field>
                </template>
                <template v-slot:[`item.monto_dolar`]="{ item }">
                  <v-text-field
                    v-model="item.monto_dolar"
                    type="number"
                    step="0.01"
                  ></v-text-field>
                </template>

                <template v-slot:[`item.monto_mon_ex`]="{ item }">
                  <v-text-field
                    v-model="item.monto_mon_ex"
                    type="number"
                    :prefix="symbol"
                    v-on:blur="calcularTotalesInput()"
                    :error-messages="item.errorEx"
                  ></v-text-field>
                </template>
                <template v-slot:[`item.action`]="{ item }">
                  <v-btn icon>
                    <v-icon color="red" @click="anularPago(item.id)"
                      >mdi-circle-off-outline</v-icon
                    >
                  </v-btn>
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
                  v-model="$store.state.bank.record.nro_operacion"
                  label="N° de Operación"
                  v-on:blur="ValidaNroOp()"
                  :error-messages="msgNroOperacion"
                  id="nro_operacion"
                  :rules="[(v) => !!v || 'Datos Requerido']"
                ></v-text-field>
              </v-col>
              <v-col cols="3" md="3">
                <v-text-field
                  type="date"
                  v-model="$store.state.bank.record.fecha_pago"
                  label="Fecha de Pago"
                  :rules="[(v) => !!v || 'Datos Requerido']"
                ></v-text-field>
              </v-col>
              <v-col md="6" cols="6">
                <v-btn
                  text
                  @click="abrirSoporte($store.state.bank.record.ruta)"
                >
                  <v-icon color="red">mdi-file-pdf-box</v-icon>
                  {{ $store.state.bank.record.nombre_archivo }}
                </v-btn>
                <v-file-input
                  label="Cargar Archivo"
                  v-model="payfile"
                  @change="uploadFile()"
                  :success-messages="msgfile"
                  :error-messages="errfile"
                  :rules="[(v) => !!v || 'Datos Requerido']"
                  :loading="loadingFile"
                >
                </v-file-input>
              </v-col>

              <v-col md="4" cols="4">
                <v-autocomplete
                  :items="cuentas"
                  item-text="label"
                  item-value="id"
                  label="Cuenta de Salida de Banco"
                  v-model="$store.state.bank.record.id_banco"
                ></v-autocomplete>
              </v-col>
              <v-col md="4" cols="4" v-if="tipo == 'nuevo'">
                <v-text-field
                  readonly
                  v-model="id_cuenta.banco"
                  label="Banco:"
                ></v-text-field>
              </v-col>
              <v-col md="4" cols="4" v-if="tipo == 'nuevo'">
                <v-text-field
                  readonly
                  v-model="id_cuenta.moneda"
                  label="Moneda:"
                ></v-text-field>
              </v-col>
              <v-col md="4" cols="4" v-if="tipo == 'nuevo'"
                ><v-text-field
                  readonly
                  v-model="id_cuenta.cuenta"
                  label="N° Cuenta:"
                ></v-text-field
              ></v-col>
              <v-col md="4" cols="4" v-if="tipo == 'nuevo'"
                ><v-text-field
                  readonly
                  v-model="id_cuenta.cci"
                  label="CCI:"
                ></v-text-field
              ></v-col>
              <v-col md="4" cols="4">
                <v-text-field
                  v-model="$store.state.bank.record.comentarios"
                  label="Comentarios"
                  placeholder="Comentarios......"
                ></v-text-field
              ></v-col>
              <v-col md="12" cols="12">
                <v-flex text-right>
                  <v-btn color="success" @click="actualizarPago()">
                    Actualizar
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
import axios from '@/api/axios-config';
import Swal from "sweetalert2";
import { mapActions, mapState } from "vuex";
export default {
  props: ["tipo"],
  data() {
    return {
      symbol: "",
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
          value: "factura",
        },
        {
          text: "Serie",
          value: "serie",
        },

        {
          text: "Expediente",
          value: "tipo_gasto",
        },
        {
          text: "Procedencia",
          value: "tipo_pago",
        },

        {
          text: "Monto Dolar",
          value: "monto_dolar",
        },

        // {
        //   text: "Monto Deuda",
        //   value: "monto_deuda",
        // },

        {
          text: "Tipo de Cambio",
          value: "tipo_cambio",
        },
        {
          text: "Moneda Pagar",
          value: "item_moneda",
        },
        {
          text: "Monto Mon Ex",
          value: "monto_mon_ex",
          shortable: false,
        },
        {
          text: "Acción",
          value: "action",
          shortable: false,
        },
      ],
      msgNroOperacion: "",
    };
  },
  async mounted() {
    let vm = this;

    await this.cargarProveedores();
    await this.getListBanksDetailsCargar();
    await this._getCoinsList();
    await this.verPagoRealizado(this.$route.params.nro_operacion);
    this.calcularTotal();

    vm.$store.state.drawer = false;
  },
  methods: {
    ...mapActions([
      "_getListaPagosXProveedorCxP",
      "_uploadFile",
      "getValidaNroOp",
      "cargarProveedores",
      "_getCoinsList",
      "verPagoRealizado",
      "anularPagoRealizado",
      "actualizarPagoRealizado",
    ]),
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
      let total = 0;
      this.$store.state.bank.record.detalle.forEach((element) => {
        total += parseFloat(element.monto_mon_ex);
      });
      this.montoMonExt = parseFloat(total).toFixed(2);
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
    async anularPago(id) {
      await Swal.fire({
        icon: "question",
        text: "¿Está seguro que desea anular el pago realizado. ? Recuerde que este cambio no es reversible.",
        confirmButtonText: "Si, anular",
        cancelButtonText: "Cancelar",
        showDenyButton: false,
        showCancelButton: true,
      }).then(async (result) => {
        if (result.isConfirmed) {
          await this.anularPagoRealizado(id);
          this.$router.go(-1);
        }
      });
    },
    async actualizarPago() {
      let data = [];
      this.$store.state.bank.record.detalle.forEach((element) => {
        let pago = {
          id: element.id,
          id_path: this.$store.state.files.payPath,
          id_cuenta: this.$store.state.bank.record.id_banco,
          fecha: this.$store.state.bank.record.fecha_pago,
          monto: element.monto_dolar,
          nro_operacion: this.$store.state.bank.record.nro_operacion,
          monto_mon_ex: element.monto_mon_ex,
          tipocambio: element.tipocambio,
          id_coins: element.tipocambio,
          comentarios: this.$store.state.bank.record.comentarios,
        };
        data.push(pago);
      });
      let res = await this.actualizarPagoRealizado(data);

      Swal.fire({
        icon: res.estadoflag ? "success" : "error",
        text: res.mensaje,
      }).then((response) => {
        if (response.isConfirmed) {
          this.$router.go(-1);
        }
      });
    },
    abrirSoporte(url) {
      console.log(url);
      window.open(url, "_blank");
    },
  },
  computed: {
    ...mapState(["itemsProveedorList", "listPagosXProveedorCxP", "provedores"]),
  },
  watch: {
    selected() {
      this.calcularTotales();
    },
  },
};
</script>

<style></style>
