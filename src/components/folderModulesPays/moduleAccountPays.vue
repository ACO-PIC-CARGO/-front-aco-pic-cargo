<template>
  <v-container fluid>
    <v-row>
      <v-col cols="12">
        <v-alert dense color="#E3F2FD" width="520px">
          Se han aplicado filtros. Si necesita cambiar, de clic en
          <a
            href="#"
            class="text-decoration-underline text-info font-weight-bold"
            @click.prevent="dialogFiltro = !dialogFiltro"
            dense
          >
            FILTRAR <v-icon color="info">mdi-filter</v-icon>
          </a>
        </v-alert>
      </v-col>
      <v-col cols="12" md="3" class="pt-0">
        <v-text-field
          hide-details
          v-model="searchFactura"
          dense
          id="id"
          outlined
          label="Buscar"
          placeholder="Buscar..."
          append-icon="mdi-text-search"
        ></v-text-field>
      </v-col>
      <v-col cols="12" md="9" class="text-right pt-0">
        <v-btn class="mx-1" @click="filtroflag = true" color="default">
          <v-icon small>mdi-filter</v-icon> Filtro
        </v-btn>
        <v-btn class="mx-1" @click="toPageAdd()" color="primary">
          <v-icon small>mdi-plus</v-icon> NUEVA FACTURA
        </v-btn>
        <v-btn class="mx-1" @click="limpiar()" color="red" outlined>
          <v-icon small>mdi-filter-remove</v-icon> LIMPIAR
        </v-btn>
      </v-col>
      <v-col cols="12">
        <v-data-table
          :headers="headersFacturas"
          :items="itemsListInvoice"
          dense
          :single-expand="true"
          @click:row="clickRow"
          :expanded.sync="expanded"
          :search="searchFactura"
        >
          <template v-slot:expanded-item="{ item }">
            <td :colspan="headersFacturas.length">
              <v-simple-table>
                <thead style="background: #e3f2fd; font-weight: bold">
                  <tr>
                    <td>Concepto</td>
                    <td>Monto</td>
                    <td>IGV</td>
                    <td>Total</td>
                    <td>Monto (USD)</td>
                    <td>IGV (USD)</td>
                    <td>Total (USD)</td>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="(detalle, index) in item.detalle" :key="index">
                    <td>{{ detalle.concepto }}</td>
                    <td>
                      {{ item.namecoins }}
                      {{ parseFloat(detalle.monto).toFixed(2) }}
                    </td>
                    <td>
                      {{ item.namecoins }}
                      {{ parseFloat(detalle.igv).toFixed(2) }}
                    </td>
                    <td>
                      {{ item.namecoins }}
                      {{ parseFloat(detalle.total).toFixed(2) }}
                    </td>
                    <td>USD {{ parseFloat(detalle.montodolar).toFixed(2) }}</td>
                    <td>USD {{ parseFloat(detalle.igvdolar).toFixed(2) }}</td>
                    <td>USD {{ parseFloat(detalle.totaldolar).toFixed(2) }}</td>
                  </tr>
                </tbody>
              </v-simple-table>
            </td>
          </template>
          <template v-slot:[`item.paymentname`]="{ item }">
            {{ item.paymentname.charAt(0) }}
          </template>
          <template v-slot:[`item.accion`]="{ item }">
            <v-chip
              block
              medium
              class=""
              color="orange"
              text-color="white"
              v-if="item.status == 1"
            >
              Pendiente
            </v-chip>
            <v-chip
              block
              medium
              class=""
              color="success"
              v-if="item.status == 2"
            >
              Pagado
            </v-chip>
          </template>
          <template v-slot:[`item.totaldolar`]="{ item }">
            USD {{ item.total }}
          </template>
          <template v-slot:[`item.total`]="{ item }">
            {{ item.namecoins }}
            {{ item.total }}
          </template>
          <template v-slot:[`item.action`]="{ item }">
            <div class="d-flex align-center">
              <v-icon
                class="btn_add mr-2"
                icon
                v-if="item.status == 1"
                color="red"
                @click="delPro(item.id)"
              >
                mdi-delete
              </v-icon>
              <v-icon
                class="btn_add mr-2"
                icon
                v-if="item.status == 1"
                color="blue"
                @click="penPro(item.id)"
              >
                mdi-pencil
              </v-icon>

              <v-icon
                class="btn_add mr-2"
                icon
                color="green"
                @click="eyePro(item.id)"
              >
                mdi-eye
              </v-icon>
            </div>
          </template>
        </v-data-table>
      </v-col>
    </v-row>
    <!-- seeción filtro -->

    <v-navigation-drawer
      v-model="filtroflag"
      right
      absolute
      bottom
      persistent
      width="40%"
      temporary
      class="filtro-container"
    >
      <v-card min-height="800px">
        <v-card-title primary-title>
          Filtro Para Facturas
          <v-spacer></v-spacer>
          <v-btn color="default" text @click="filtroflag = false">
            <v-icon>mdi-close</v-icon>
          </v-btn>
        </v-card-title>
        <v-divider></v-divider>
        <v-card-text>
          <v-autocomplete
            :items="$store.state.provedores"
            v-model="id_proveedor"
            item-text="namelong"
            item-value="id"
            clearable
            label="Proveedor"
            outlined
            dense
          ></v-autocomplete>

          <FormatFecha
            v-model="fechapagodesde"
            label="Fecha Emisión desde "
            :outlined="true"
            :dense="true"
          />
          <FormatFecha
            v-model="fechapagohasta"
            label="Fecha Emisión Hasta"
            :outlined="true"
            :dense="true"
          />
          <v-text-field
            v-model="factura"
            clearable
            outlined
            dense
            label="Factura"
          />
          <v-text-field
            v-model="serie"
            clearable
            outlined
            dense
            label="Serie"
          />
        </v-card-text>
        <v-divider></v-divider>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="info" @click="_getInvoiceAdmin()">
            <v-icon>mdi-filter-check-outline</v-icon> Filtrar
          </v-btn>
          <v-btn color="danger" @click="limpiar()">
            <v-icon>mdi-filter-remove-outline</v-icon> Limpiar
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-navigation-drawer>
  </v-container>
</template>

<script>
import axios from "@/api/axios-config";
import Swal from "sweetalert2";
import moment from "moment";
import FormatFecha from "../comun/FormatFecha.vue";
import { mapActions } from "vuex";

export default {
  name: "AccountPaysCom",
  components: {
    FormatFecha,
  },
  data() {
    return {
      itemsListInvoice: [],
      searchFactura: "",
      dialogPayment: false,
      id_pro: "",
      id_gasto: null,
      id_subgasto: null,
      fechapagodesde: moment().format("YYYY-01-01"),
      fechapagohasta: moment().format("YYYY-MM-DD"),
      id_proveedor: null,
      factura: null,
      serie: null,
      expanded: [],
      filtroflag: false,
      headersFacturas: [
        {
          text: "",
          value: "action",
        },
        {
          text: "Tipo",
          value: "paymentname",
        },
        {
          text: "Gasto",
          value: "gasto_description",
        },
        {
          text: "Sub Gasto",
          value: "subgasto_description",
        },

        {
          text: "Fecha Emisión",
          value: "fecha",
        },
        // {
        //   text: "Fecha Vencimiento",
        //   value: "fechavencimiento",
        // },
        {
          text: "Expediente",
          value: "nro_master",
        },
        {
          text: "Proveedor",
          value: "nameconsigner",
        },
        {
          text: "Nro. Factura",
          value: "nro_factura",
        },
        {
          text: "Nro. Serie",
          value: "nro_serie",
        },

        {
          text: "Total",
          value: "total",
          class: "totalcss",
        },
        {
          text: "Tipo de Cambio",
          value: "tipocambio",
        },
        {
          text: "Total",
          value: "totaldolar",
          class: "montodolarcss",
        },
        {
          text: "Estado",
          value: "accion",
        },
      ],
    };
  },

  async mounted() {
    this.$store.state.spiner = true;

    await this._getInvoiceAdmin();
    this.$store.state.spiner = false;
    Promise.all([this.cargarProveedores()]);
  },

  methods: {
    ...mapActions([
      "getListFlujoOperacionMes",
      "cargarClientes",
      "cargarProveedores",
      "validarUsuarioAdmin",
    ]),
    filterOnlyCapsText(value, search) {
      let text = search ? search.toLocaleUpperCase() : null;
      return (
        value != null &&
        search != null &&
        typeof value === "string" &&
        value.toString().toLocaleUpperCase().indexOf(text) !== -1
      );
    },
    toPageAdd() {
      this.$router.push({ name: "addAccountPays" });
    },

    uploadPayment(id) {
      this.id_pro = id;
      this.dialogPayment = true;
    },

    eyePro(id) {
      // window.open(id, "_blank");
      this.$router.push({ name: "viewAccountPays", params: { id: id } });
    },
    penPro(id) {
      // window.open(id, "_blank");
      this.$router.push({ name: "EditAccountPays", params: { id: id } });
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
          console.error(error);
        });
    },
    cleanData() {
      this.payfile = "";
      this.date = "";
      this.payPath = "";
      this.factura_pago = "";
      this.serie_pago = "";
      this.banco_pago = "";
      this.moneda_pago = "";
      this.monto_pago = "";
    },

    async _putInvoice() {
      var vm = this;

      var data = {
        id_pago: vm.payPath,
        fecha_pago: vm.date,
        factura_pago: vm.factura_pago,
        serie_pago: vm.serie_pago,
        id_bank_pago: vm.banco_pago,
        id_coin_pago: vm.moneda_pago,
        monto_pago: vm.monto_pago,
        status: 2,
      };

      var config = {
        method: "post",
        url: process.env.VUE_APP_URL_MAIN + "paymentInvoiceAdmin/" + vm.id_pro,

        headers: {
          "Content-Type": "application/json",
        },
        data: data,
      };
      await axios(config)
        .then(function (response) {
          //vm.dialogListInvoince = true;
          // vm.itemsListInvoice = response.data.data;
          vm.$swal({
            icon: "success",
            title: "Documento Cargado",
            text: "El documento ha sido cargado correctamente",
          });
          vm.dialogPayment = false;
          vm.cleanData();
          vm._getInvoiceAdmin();
        })
        .catch(function (error) {
          console.error(error);
        });
    },
    limpiar() {
      this.filtroflag = false;
      this.id_gasto = null;
      this.id_subgasto = null;
      this.fechapagodesde = moment().format("YYYY-01-01");
      this.fechapagohasta = moment().format("YYYY-MM-DD");
      this.id_proveedor = null;
      this.factura = null;
      this.serie = null;
      this._getInvoiceAdmin();
    },
    async _getInvoiceAdmin() {
      var vm = this;
      vm.$store.state.spiner = true;
      var config = {
        method: "get",
        url: process.env.VUE_APP_URL_MAIN + "getInvoiceAdmin",
        params: {
          id_branch: JSON.parse(sessionStorage.getItem("dataUser"))[0]
            .id_branch,
          id_gasto: vm.id_gasto,
          id_subgasto: vm.id_subgasto,
          fechapagodesde: vm.fechapagodesde,
          fechapagohasta: vm.fechapagohasta,
          id_proveedor: vm.id_proveedor,
          factura: vm.factura,
          serie: vm.serie,
        },
        headers: {
          "Content-Type": "application/json",
        },
      };
      await axios(config)
        .then(function (response) {
          //vm.dialogListInvoince = true;
          vm.itemsListInvoice = response.data.data;
        })
        .catch(function (error) {
          console.error(error);
        });
      vm.$store.state.spiner = false;
      vm.filtroflag = false;
    },

    async delPro(id) {
      let val = true;
      await Swal.fire({
        title: "Ingrese sus datos Administrador",
        html:
          '<input id="swal-input1" class="swal2-input" placeholder="Nombre">' +
          '<input id="swal-input2" type="password" class="swal2-input" placeholder="Clave">',
        focusConfirm: false,
        showCancelButton: true,
        confirmButtonText: "Aceptar",
        cancelButtonText: "Cancelar",
        preConfirm: () => {
          const input1 = document.getElementById("swal-input1").value.trim();
          const input2 = document.getElementById("swal-input2").value.trim();
          if (!input1 || !input2) {
            Swal.showValidationMessage("Por favor, complete ambos campos");
            return false;
          }
          return { usuario: input1, clave: input2 };
        },
      }).then(async (result) => {
        if (!result.isConfirmed) {
          // Usuario canceló
          val = false;
          msg = "Operación cancelada";
          return;
        }

        if (result.value) {
          const res = await this.validarUsuarioAdmin({
            usuario: result.value.usuario,
            clave: result.value.clave,
          });

          if (res && res.estadoflag) {
            val = true;
          } else {
            val = false;
            msg = res?.mensaje || "Credenciales incorrectas";
          }
        } else {
          val = false;
          msg = "Debe ingresar las credenciales";
        }
      });

      if (!val) {
        await swal.fire({
          icon: "error",
          text: msg,
        });
        return false;
      }

      await this.EliminarCuenta(id);
      await this.limpiar();
    },
    clickRow(item, event) {
      if (event.isExpanded) {
        const index = this.expanded.findIndex((i) => i === item);
        this.expanded.splice(index, 1);
      } else {
        this.expanded.push(item);
      }
    },
    async EliminarCuenta(id) {
      var vm = this;

      var data = {
        id: id,
      };

      var config = {
        method: "post",
        url: process.env.VUE_APP_URL_MAIN + "delPro",

        headers: {
          "Content-Type": "application/json",
        },
        data: data,
      };
      await axios(config)
        .then(function (response) {
          vm._getInvoiceAdmin();
        })
        .catch(function (error) {
          console.error(error);
        });
    },
  },
};
</script>
<style scoped>
.totalcss {
  background: #adcaf5 !important;
}
.montodolarcss {
  background: #c7f7d7 !important;
}
</style>
<style>
.filtro-container {
  position: fixed !important;
  height: 100vh;
  z-index: 9999;
  overflow-y: auto;
}
</style>
