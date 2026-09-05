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
        <v-btn class="mx-1" @click="toGoPage()" color="primary">
          <v-icon small>mdi-plus</v-icon> NUEVO COBRO
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
          <template v-slot:[`item.totaldolar`]="{ item }">
            USD {{ item.totaldolar }}
          </template>
          <template v-slot:[`item.total`]="{ item }">
            {{ item.namecoins }}
            {{ item.total }}
          </template>

          <template v-slot:[`item.paymentname`]="{ item }">
            {{ item.paymentname.charAt(0) }}
          </template>
          <template v-slot:[`item.tipo_cambio`]="{ item }">
            {{ item.tipocambio }}
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
                v-if="item.status == 2"
                color="blue"
                @click="penProConClaveAdmin(item.id)"
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
            :items="$store.state.clientes"
            v-model="id_cliente"
            item-text="namelong"
            item-value="id"
            clearable
            label="Cliente"
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
          <v-btn color="info" @click="_getInvoiceAdminCxC()">
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
import moment from "moment";
import FormatFecha from "../comun/FormatFecha.vue";
import { mapActions } from "vuex";
import Swal from "sweetalert2";
export default {
  name: "controlAccountReceivableCom",
  components: {
    FormatFecha,
  },
  props: {
    operativa: "",
    exp: "",
    pro: "",
    id_pro: "",
    tipo: "",
  },
  data() {
    return {
      filtroflag: false,
      itemsListInvoice: [],
      searchFactura: "",
      dialogPayment: false,
      date: new Date(Date.now() - new Date().getTimezoneOffset() * 60000)
        .toISOString()
        .substr(0, 10),
      row: "",
      menu: false,
      modal: false,
      menu2: false,
      pathfileAll: "",
      boolFile: false,
      pathfile: "",
      payfile: "",
      payPath: "",
      serie_pago: "",
      factura_pago: "",
      moneda_pago: "",
      monto_pago: "",
      banco_pago: "",
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
          text: "Ingreso",
          value: "ingreso_description",
        },
        {
          text: "Sub Ingreso",
          value: "subingreso_description",
        },

        {
          text: "Fecha",
          value: "fecha",
        },
        {
          text: "Expediente",
          value: "nro_master",
        },
        {
          text: "Cliente",
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
        // {
        //   text: "Moneda",
        //   value: "namecoins",
        // },
        {
          text: "Total",
          value: "total",
        },
        {
          text: "Tipo de cambio",
          value: "tipo_cambio",
        },
        // {
        //   text: "Monto Dolar",
        //   value: "montodolar",
        // },

        {
          text: "Total",
          value: "totaldolar",
        },
        {
          text: "",
          value: "accion",
        },
      ],
      id_ingreso: null,
      id_subingreso: null,
      fechapagodesde: moment().format("YYYY-01-01"),
      fechapagohasta: moment().format("YYYY-MM-DD"),
      id_cliente: null,
      factura: null,
      serie: null,
      expanded: [],
    };
  },

  async mounted() {
    this.$store.state.spiner = true;
    await this._getInvoiceAdminCxC();
    this.$store.state.spiner = false;
    this.cargarClientes();
  },

  methods: {
    ...mapActions(["cargarClientes", "validarUsuarioAdmin"]),
    limpiar() {
      this.filtroflag = false;
      this.id_ingreso = null;
      this.id_subingreso = null;
      this.fechapagodesde = moment().format("YYYY-01-01");
      this.fechapagohasta = moment().format("YYYY-MM-DD");
      this.id_cliente = null;
      this.factura = null;
      this.serie = null;
      this._getInvoiceAdminCxC();
    },
    toGoPage() {
      this.$router.push({ name: "controlAccountReceivable" });
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
      this.$router.push({ name: "viewAccountPaysCxC", params: { id: id } });
    },
    penPro(id) {
      // window.open(id, "_blank");
      this.$router.push({ name: "EditAccountPaysCxC", params: { id: id } });
    },
    async penProConClaveAdmin(id) {
      let val = true;
      let msg = "";
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
          const vm = this;
          const res = await vm.validarUsuarioAdmin({
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
        await Swal.fire({
          icon: "error",
          text: msg,
        });
        return false;
      }
      this.$router.push({ name: "EditAccountPaysCxC", params: { id: id } });
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
        url:
          process.env.VUE_APP_URL_MAIN + "paymentInvoiceAdminCxC/" + vm.id_pro,

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
          vm._getInvoiceAdminCxC();
        })
        .catch(function (error) {
          console.error(error);
        });
    },
    clickRow(item, event) {
      if (event.isExpanded) {
        const index = this.expanded.findIndex((i) => i === item);
        this.expanded.splice(index, 1);
      } else {
        this.expanded.push(item);
      }
    },
    async _getInvoiceAdminCxC(id_proveedor, id_house) {
      var vm = this;
      vm.$store.state.spiner = true;
      var config = {
        method: "get",
        url: process.env.VUE_APP_URL_MAIN + "getInvoiceAdminCxC",
        params: {
          id_branch: JSON.parse(sessionStorage.getItem("dataUser"))[0]
            .id_branch,
          id_ingreso: vm.id_ingreso,
          id_subgingreso: vm.id_subingreso,
          fechapagodesde: vm.fechapagodesde,
          fechapagohasta: vm.fechapagohasta,
          id_cliente: vm.id_cliente,
          factura: vm.factura,
          serie: vm.serie,
        },
        headers: {
          "Content-Type": "application/json",
        },
      };
      await axios(config)
        .then(function (response) {
          let res = response.data;
          console.log(res);
          if (res.estadoflag) {
            vm.itemsListInvoice = response.data.data;
          } else {
            vm.itemsListInvoice = [];
            Swal.fire({
              icon: "error",
              text: res.mensaje,
            });
          }
        })
        .catch(function (error) {
          console.error(error);
        });
      vm.$store.state.spiner = false;
      this.filtroflag = false;
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
    async EliminarCuenta(id) {
      var vm = this;

      var data = {
        id: id,
      };

      var config = {
        method: "post",
        url: process.env.VUE_APP_URL_MAIN + "delProCxC",

        headers: {
          "Content-Type": "application/json",
        },
        data: data,
      };
      await axios(config)
        .then(function (response) {
          vm._getInvoiceAdminCxC();
        })
        .catch(function (error) {
          console.error(error);
        });
    },
  },
};
</script>
