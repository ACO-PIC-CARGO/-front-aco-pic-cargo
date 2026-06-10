<template>
  <v-card>
    <!-- <v-alert type="warning" v-if="mostrarAdvFlag" class="ocultarMovil">
      <v-row>
        <v-col cols="11">
          Solo se muestran los movimientos del mes actual. Usa el filtro
          <v-icon color="info">mdi-filter</v-icon>
        </v-col>
        <v-col cols="1">
          <v-btn @click="mostrarAdvFlag = !mostrarAdvFlag" icon>
            <v-icon>mdi-close</v-icon>
          </v-btn>
        </v-col>
      </v-row>
    </v-alert> -->
    <v-card-title>
      <v-text-field v-model="search" label="Buscar...."> </v-text-field>
      <v-spacer> </v-spacer>
      <v-btn color="success" small @click="nuevo" text
        >NUEVO PAGO <v-icon small>mdi-plus</v-icon>
      </v-btn>
      <v-btn color="success" small @click="exportar()" :loading="loading" text
        >EXCEL <v-icon small>mdi-file-excel</v-icon>
      </v-btn>
      <v-btn color="info" text small @click="dialogFiltro = !dialogFiltro"
        >Filtrar <v-icon small>mdi-filter</v-icon>
      </v-btn>
      <v-btn color="default" text small @click="limpiar()"
        >Limpiar <v-icon small>mdi-close</v-icon>
      </v-btn>
    </v-card-title>

    <v-data-table
      :search="search"
      :headers="headersCabecera"
      :items="$store.state.bank.list"
      :expanded.sync="expanded"
      :single-expand="singleExpand"
      show-expand
      @click:row="clickRow"
      item-key="id"
      dense
      disable-sort
    >
      <template v-slot:[`item.action`]="{ item }">
        <v-btn icon color="red" @click="verSoport(item.ruta)">
          <v-icon>mdi-file</v-icon>
        </v-btn>
        <v-btn small icon color="info" @click.native="ver(item)">
          <v-icon>mdi-eye</v-icon>
        </v-btn>
        <v-btn small icon color="orange" @click.native="editar(item)">
          <v-icon>mdi-pencil</v-icon>
        </v-btn>
      </template>
      <template v-slot:expanded-item="{ item }">
        <td colspan="1"></td>
        <td colspan="12">
          <v-simple-table style="width: 100%">
            <thead style="background: #e3f2fd">
              <tr>
                <!-- <th>Fecha Registro</th> -->
                <th>O/A</th>
                <th>Expediente</th>
                <th>Factura</th>
                <th>Serie</th>
                <th>Monto (USD)</th>
                <th>Monto</th>
                <!-- <th>Nro Serie</th> -->
                <!-- <th>Accion</th> -->
              </tr>
            </thead>
            <tbody>
              <tr v-for="i in item.detalles" :key="i.id">
                <td>{{ i.tipo }}</td>
                <td>{{ i.code_master }}</td>
                <td>{{ i.nro_factura }}</td>
                <td>{{ i.nro_serie }}</td>
                <td>{{ i.montodolar }}</td>
                <td>{{ i.montomonedalocal }}</td>

                <!--  <td>
                 <v-btn small color="warning" @click.native="verFactura(i)">
                    VER FACTURAS
                  </v-btn> 
                </td>-->
              </tr>
            </tbody>
          </v-simple-table>
          <v-simple-table
            style="width: 100%"
            v-if="item.table_comisionbancaria.length > 0"
          >
            <thead style="background: #e3f2fd">
              <tr>
                <!-- <th>Fecha Registro</th> -->
                <th>Comisión Bancaria</th>
                <th>Monto(USD)</th>
                <th>Monto (ML)</th>
                <th>Accion</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="i in item.table_comisionbancaria" :key="i.id">
                <td>{{ i.concepto }}</td>
                <td>{{ i.montodolar }}</td>
                <td>{{ i.monto }}</td>
                <td>
                  <!-- <v-btn small color="warning" @click.native="verFactura(i)">
                    VER FACTURAS
                  </v-btn> -->
                </td>
              </tr>
            </tbody>
          </v-simple-table>
        </td>
      </template>
      <!-- <template v-slot:[`item.action`]="{ item }">
        <v-btn x-small icon color="primary" @click="verSoport(item.soporte)">
          <v-icon>mdi-file-cloud-outline</v-icon>
        </v-btn>

        <v-btn
          x-small
          icon
          color="warning"
          @click.native="verPagosEgresos(item.id, true)"
          v-if="item.esinvoiceadmin == false"
        >
          <v-icon>mdi-pencil</v-icon>
        </v-btn>
      </template> -->
    </v-data-table>

    <v-dialog
      v-model="dialog"
      scrollable
      persistent
      max-width="60%"
      transition="dialog-transition"
    >
      <v-card>
        <v-card-title primary-title>
          {{ verflag ? "Ver " : "Editar" }}
          <v-spacer> </v-spacer>
          <v-btn icon color="default" @click="dialog = !dialog">
            <v-icon>mdi-close</v-icon>
          </v-btn>
        </v-card-title>
        <v-card-text>
          <v-form ref="formEditar">
            <v-row>
              <v-col cols="12">
                <h2>{{ dato.name_proveedor }}</h2>
              </v-col>
              <v-col cols="3">
                <v-text-field
                  label="Nro Operacion"
                  type="number"
                  v-model="dato.nro_operacion"
                  :rules="[(v) => !!v || 'Datos Requerido']"
                >
                </v-text-field>
              </v-col>
              <v-col cols="3">
                <v-text-field
                  type="date"
                  label="Fecha Operacion"
                  v-model="dato.fecha"
                  :rules="[(v) => !!v || 'Datos Requerido']"
                >
                </v-text-field>
              </v-col>
            </v-row>

            <!-- -------------------------------------- -->
            <v-text-field
              label="Monto "
              v-model="dato.monto"
              :rules="[(v) => !!v || 'Datos Requerido']"
            >
            </v-text-field>

            <v-select
              :items="cuentas"
              v-model="dato.id_cuenta"
              label="Cuenta Bancaria"
              item-text="label"
              item-value="id"
              :rules="[(v) => !!v || 'Datos Requerido']"
            >
            </v-select>

            <v-file-input
              v-model="payfile"
              label="Nuevo Soporte de Pago"
              show-size
              truncate-length="50"
              hide-details
              clearable
              @change="_uploadFile()"
            >
            </v-file-input>
          </v-form>
        </v-card-text>
        <v-card-actions>
          <v-spacer> </v-spacer>
          <v-btn color="success" text @click="actualizarCGEgreso()"
            >Guardar</v-btn
          >
          <v-btn
            color="warning"
            text
            @click="dialogPayControlGasto = !dialogPayControlGasto"
            >Cancelar</v-btn
          >
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-navigation-drawer
      absolute
      permanent
      temporary
      right
      width="20%"
      v-if="dialogFiltro"
    >
      <v-card height="100%" elevation="10">
        <v-card-title primary-title> Filtrar Gastos </v-card-title>
        <v-card-text>
          <v-select
            :items="cuentas"
            v-model="filtro.id_cuenta"
            label="Cuenta Bancaria (PIC)"
            item-text="label"
            item-value="id"
            clearable
            outlined
            class="mb-2"
            dense
            hide-details
          >
          </v-select>
          <v-autocomplete
            :items="$store.state.provedores"
            v-model="filtro.id_proveedor"
            label="Proveedor"
            item-text="namelong"
            item-value="id"
            clearable
            outlined
            class="mb-2"
            dense
            hide-details
          >
          </v-autocomplete>

          <v-text-field
            clearable
            outlined
            class="mb-2"
            label="Cod. Expediente"
            v-model="filtro.expediente"
            dense
            hide-details
          >
          </v-text-field>

          <v-text-field
            clearable
            outlined
            class="mb-2"
            label="Nro Operacion"
            v-model="filtro.nro_operacion"
            dense
            hide-details
          >
          </v-text-field>
          <v-text-field
            clearable
            outlined
            class="mb-2"
            type="number"
            label="Monto"
            v-model="filtro.monto"
            dense
            hide-details
          >
          </v-text-field>
          <v-text-field
            outlined
            class="mb-2"
            v-model="filtro.desde"
            label="Fecha Desde"
            type="date"
            dense
            hide-details
          >
          </v-text-field>
          <v-text-field
            outlined
            class="mb-2"
            v-model="filtro.hasta"
            label="Fecha Hasta"
            type="date"
            hide-details
            dense
          >
          </v-text-field>
          <!-- <v-checkbox
            outlined
            class="mb-2"
            v-model="filtro.operativo"
            label="Operativo"
            hide-details
            dense
          ></v-checkbox>
          <v-checkbox
            v-model="filtro.administrativo"
            label="Administrativo"
            hide-details
            dense
          ></v-checkbox> -->
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="success" small @click="filtrar()">Filtrar</v-btn>
          <v-btn
            color="warning"
            style="color: black"
            small
            @click="dialogFiltro = !dialogFiltro"
            >Cancelar</v-btn
          >
        </v-card-actions>
      </v-card>
    </v-navigation-drawer>

    <v-dialog v-model="dialogFacturas" width="30%">
      <v-card class="py-5">
        <v-card-text>
          <v-textarea
            auto-grow
            v-model="lstFacturas.concepto"
            label="Concepto(s)"
            rows="1"
          />
          <v-textarea
            auto-grow
            v-model="lstFacturas.factura"
            label="Factura(s)"
            rows="1"
          />
          <v-textarea
            auto-grow
            v-model="lstFacturas.serie"
            label="Serie(s)"
            rows="1"
          />
          <!-- {{ lstFacturas }} -->
        </v-card-text>
      </v-card>
    </v-dialog>
  </v-card>
</template>

<script>
import axios from '@/api/axios-config';;
import swal from "sweetalert2";
import moment from "moment";
import { mapActions } from "vuex";
export default {
  data() {
    return {
      mostrarAdvFlag: true,
      lstFacturas: [],
      dialogFacturas: false,
      usuario: "",
      loading: false,
      search: "",
      stepEditarIngreso: 1,
      EditarIngresoFlag: false,
      listado: [],
      Ingreso: {},
      dataList: false,
      headersCabecera: [
        { text: "Fecha Operacion", value: "fechaoperacion" },
        // { text: "Fecha Registro", value: "create_at" },
        { text: "Nro Operación	", value: "numerooperacion" },
        { text: "Cuenta Salida", value: "cuenta" },
        //{ text: "O/A	", value: "tipo" },
        //{ text: "Tipo Gasto	", value: "tipo_gasto" },
        //{ text: "Sub Tipo de Gasto", value: "subtipo_gasto" },
        { text: "Proveedor	", value: "proveedor" },
        { text: "Monto (USD)	", value: "totaldolar" },
        { text: "Tipo de Cambio	", value: "tipocambio" },
        { text: "Monto	", value: "totalmonedalocal" },
        { text: "Moneda	", value: "moneda" },
        { text: "Comentarios", value: "comentario" },
        // { text: "concepto	", value: "concepto" },
        // { text: "Nro Factura", value: "factura" },
        // { text: "Nro Serie", value: "serie" },
        { text: "Accion", value: "action" },
      ],
      expanded: [],
      expand: [],
      dialog: false,
      singleExpand: false,
      // dialogInvoice: false,
      // dialogPayControlGasto: false,
      dialogFiltro: false,
      verflag: false,
      pce: null,
      dato: {
        id: "",
        id_proveedor: "",
        nro_operacion: "",
        monto: "",
        fecha: "",
        id_cuenta: "",
        soporte: "",
        id_path: "",
        usuario: "",
      },
      cuentas: [],
      payfile: null,
      usuario: null,
      filtro: {
        id_branch: "",
        desde: "",
        hasta: "",
        expediente: "",
        nro_operacion: "",
        id_cuenta: "",
        id_proveedor: "",
        monto: "",
        id_moneda: "",
        nro_factura: "",
        nro_serie: "",
        tipogastos: "",
        tiposubgastos: "",
        operativo: true,
        administrativo: true,
      },
    };
  },
  async mounted() {
    this.filtro.desde = moment().format("YYYY-01-01");
    this.filtro.hasta = moment().endOf("month").format("YYYY-MM-DD");
    this.usuario = JSON.parse(sessionStorage.getItem("dataUser"))[0].usuario;

    let vm = this;
    vm.$store.state.spiner = true;
    await vm.getRegistroEgresos(this.filtro);
    vm.$store.state.spiner = false;
    Promise.all([
      vm.getListBanksDetailsCargar(),
      vm.getCargarTipoGastos(),
      vm.getCargarTipoSubGastos(),
      vm.cargarProveedores(),
      vm._getBanksList(),
    ]).then((res) => {
      vm.cuentas = vm.$store.state.bank.list.map((item) => ({
        id: item.id,
        label: item.name,
      }));
    });
    this.$store.state.drawer = false;
  },
  methods: {
    ...mapActions([
      "cargarProveedores",
      "getCargarTipoGastos",
      "getCargarTipoSubGastos",
      "validarUsuarioAdmin",
      "verVacturas",
      "_getBanksList",
      "ActualizarCXP",
      "getRegistroEgresos",
    ]),
    nuevo() {
      this.$store.state.files.payPath = null;
      this.$router.push({ name: "registroPayForProveedor" });
    },
    async ver(pago) {
      console.log("pago", pago);
      this.$router.push({
        name: "verPagosPorProveedor",
        params: { id: pago.id },
      });
    },
    async editar(pago) {
      console.log("pago", pago);
      this.$router.push({
        name: "editarPagosPorProveedor",
        params: { id: pago.id },
      });
    },
    async ActualizarIngreso() {
      await this.ActualizarCXP(this.Ingreso);
      this.$store.state.spiner = true;
      await this.getRegistroEgresos();
      this.$store.state.spiner = false;
      this.EditarIngresoFlag = false;
    },
    _uploadFile() {
      if (this.payfile) {
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
            vm.Ingreso.id_path = JSON.stringify(response.data.data[0].insertid);
          })
          .catch(function (error) {
            console.log(error);
          });
      }
    },
    async limpiar() {
      this.filtro = {
        id_branch: "",
        desde: "",
        hasta: "",
        nro_operacion: "",
        expediente: "",
        id_cuenta: "",
        id_proveedor: "",
        monto: "",
        id_moneda: "",
        nro_factura: "",
        nro_serie: "",
        tipogastos: "",
        tiposubgastos: "",
        operativo: true,
        administrativo: true,
      };
      this.filtro.desde = moment().format("YYYY-01-01");
      this.filtro.hasta = moment().endOf("month").format("YYYY-MM-DD");

      this.$store.state.spiner = true;
      await this.getRegistroEgresos(this.filtro);
      this.$store.state.spiner = false;
    },
    async filtrar() {
      this.$store.state.spiner = true;
      await this.getRegistroEgresos(this.filtro);
      this.dialogFiltro = !this.dialogFiltro;
      this.$store.state.spiner = false;
    },

    async verInvoice(id, editar = false) {
      let vm = this;
      vm.verflag = !editar;
      var config = {
        method: "get",
        url: process.env.VUE_APP_URL_MAIN + "ver_pago_invoice?id=" + id,

        headers: {
          "auth-token": sessionStorage.getItem("auth-token"),
          "Content-Type": "application/json",
        },
      };
      await axios(config)
        .then(function (response) {
          let data = response.data;
          if (data.estadoflag == true) {
            vm.dato = data.data[0];
          }
        })
        .catch(function (error) {
          console.log(error);
        });
      vm.dialogInvoice = true;
    },

    async verPagosEgresos(id, editar = false) {
      let vm = this;
      vm.verflag = !editar;
      var config = {
        method: "get",
        url: process.env.VUE_APP_URL_MAIN + "ver_pago_cgegreso?id=" + id,

        headers: {
          "auth-token": sessionStorage.getItem("auth-token"),
          "Content-Type": "application/json",
        },
      };
      await axios(config)
        .then(function (response) {
          let data = response.data;
          if (data.estadoflag == true) {
            vm.dato = data.data[0];
          }
        })
        .catch(function (error) {
          console.log(error);
        });
      vm.dialogPayControlGasto = true;
    },
    async verPagosControlEgresos(item) {
      let vm = this;

      var config = {
        method: "get",
        url:
          process.env.VUE_APP_URL_MAIN +
          "ver_pagoscontrol_egresos?id=" +
          item.id,

        headers: {
          "auth-token": sessionStorage.getItem("auth-token"),
          "Content-Type": "application/json",
        },
      };
      await axios(config)
        .then(function (response) {
          vm.dato = response.data.data[0];
          vm.name_proveedor = item.name_proveedor;
        })
        .catch(function (error) {
          console.log(error);
        });
    },
    async actualizarInvoice() {
      let vm = this;
      if (this.$refs.formInvoice.validate()) {
        vm.dato.usuario = vm.usuario;
        var config = {
          method: "put",
          url: process.env.VUE_APP_URL_MAIN + "actualizar_pago_invoice",

          headers: {
            "auth-token": sessionStorage.getItem("auth-token"),
            "Content-Type": "application/json",
          },
          data: this.dato,
        };
        await axios(config)
          .then(function (response) {
            let data = response.data.data[0];
            swal
              .fire({
                title: "AVISO",
                text: data.mensaje,
              })
              .then((result) => {
                if (result.isConfirmed) {
                  vm.payfile = null;
                  vm.obtenerListado();
                  vm.dialogInvoice = false;
                }
              });
            // if (data.estadoflag == true) {
            // }
          })
          .catch(function (error) {
            console.log(error);
          });
      }
    },
    async actualizarCGEgreso() {
      let vm = this;
      if (this.$refs.formInvoice.validate()) {
        vm.dato.usuario = vm.usuario;
        var config = {
          method: "put",
          url: process.env.VUE_APP_URL_MAIN + "actualizar_pago_cgegreso",

          headers: {
            "auth-token": sessionStorage.getItem("auth-token"),
            "Content-Type": "application/json",
          },
          data: this.dato,
        };
        await axios(config)
          .then(function (response) {
            let data = response.data.data[0];
            swal
              .fire({
                text: data.mensaje,
              })
              .then((result) => {
                if (result.isConfirmed) {
                  vm.payfile = null;
                  vm.obtenerListado();
                  vm.dialogPayControlGasto = false;
                }
              });
            // if (data.estadoflag == true) {
            // }
          })
          .catch(function (error) {
            console.log(error);
          });
      }
    },
    async obtenerListado() {
      let vm = this;
      vm.$store.state.spiner = true;
      await vm.getRegistroEgresos();
      vm.dato = {
        id: "",
        id_proveedor: "",
        nro_operacion: "",
        monto: "",
        fecha: "",
        id_cuenta: "",
        soporte: "",
        id_path: "",
      };
      vm.$store.state.spiner = false;
    },
    clickRow(item, event) {
      if (event.isExpanded) {
        const index = this.expanded.findIndex((i) => i === item);
        this.expanded.splice(index, 1);
      } else {
        this.expanded.push(item);
      }
    },
    verSoport(ruta) {
      window.open(ruta, "_blank");
    },
    async verFactura(data) {
      let fac = await this.verVacturas(data);
      this.lstFacturas = fac.data[0];
      this.dialogFacturas = true;
    },
    async exportar() {
      // let vm = this;
      this.loading = true;
      var config = {
        method: "get",
        url:
          process.env.VUE_APP_URL_MAIN +
          `exportar_listado_reporte_egresos?id_branch=${
            JSON.parse(sessionStorage.getItem("dataUser"))[0].id_branch
          }&desde=${
            this.filtro.fechadesde ? this.filtro.fechadesde : ""
          }&hasta=${
            this.filtro.fechahasta ? this.filtro.fechahasta : ""
          }&nro_operacion=${
            this.filtro.nro_operacion ? this.filtro.nro_operacion : ""
          }&id_cuenta=${
            this.filtro.id_cuenta ? this.filtro.id_cuenta : ""
          }&id_proveedor=${
            this.filtro.id_proveedor ? this.filtro.id_proveedor : ""
          }&monto=${this.filtro.monto ? this.filtro.monto : ""}&id_moneda=${
            this.filtro.id_moneda ? this.filtro.id_moneda : ""
          }&nro_factura=${
            this.filtro.nro_factura ? this.filtro.nro_factura : ""
          }&nro_serie=${
            this.filtro.nro_serie ? this.filtro.nro_serie : ""
          }&nro_serie=${
            this.filtro.nro_serie ? this.filtro.nro_serie : ""
          }&tipogastos=${
            this.filtro.tipogastos ? this.filtro.tipogastos : ""
          }&tiposubgastos=${
            this.filtro.tiposubgastos ? this.filtro.tiposubgastos : ""
          }&operativo=${this.filtro.operativo}&administrativo=${
            this.filtro.administrativo
          }`,
        responseType: "blob",
        headers: {
          "auth-token": sessionStorage.getItem("auth-token"),
          "Content-Type": "application/json",
        },
      };
      await axios(config)
        .then(function (response) {
          const url = window.URL.createObjectURL(new Blob([response.data]));
          const link = document.createElement("a");
          link.href = url;
          link.setAttribute("download", `${Date.now()}.xlsx`);
          document.body.appendChild(link);
          link.click();
        })
        .catch(function (error) {
          console.log(error);
        });
      this.loading = false;
      // exportar_listado_reporte_pagos
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

    filtarSubGasto() {
      if (!!this.tipogastos) {
        this.tiposubgastosFilter =
          this.$store.state.balances.tiposubgastos.filter(
            (v) => v.id_gasto == this.filtro.tipogastos,
          );
      } else {
        this.tiposubgastosFilter = this.$store.state.balances.tiposubgastos;
      }
    },
  },
  watch: {
    tipogastos() {
      this.filtarSubGasto();
    },
  },
  computed: {
    detalles() {
      if (Object.keys(this.Ingreso).length === 0) {
        return [];
      }
      return this.Ingreso.detalle.filter((v) => !!v && !v.anuladoflag);
    },
  },
};
</script>

<style></style>
