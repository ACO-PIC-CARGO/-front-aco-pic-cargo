<template>
  <v-container fluid class="contenedor-scroll">
    <v-card min-height="80vh">
      <v-card-title>
        <v-text-field v-model="search" label="Buscar...."> </v-text-field>
        <v-spacer> </v-spacer>
        <!-- <v-btn
        color="success"
        @click="exportar()"
        :loading="loading"
        text
        class="mx-1"
        >EXCEL <v-icon>mdi-file-excel</v-icon>
      </v-btn> -->
        <v-btn
          color="info"
          text
          @click="dialogFiltro = !dialogFiltro"
          class="mx-1"
          >Filtrar <v-icon>mdi-filter</v-icon>
        </v-btn>
      </v-card-title>
      <v-data-table
        :search="search"
        :headers="headersCabecera"
        :items="listado"
        item-key="index"
        disable-sort
      >
        <template v-slot:expanded-item="{ item }">
          <td colspan="1"></td>
          <td colspan="16">
            <v-simple-table style="width: 100%">
              <thead>
                <tr>
                  <th>Banco Origen</th>
                  <th>Cuenta Destino (PIC)</th>
                  <!-- <th>O/A</th> -->
                  <th>Tipo Ingreso</th>
                  <th>Sub Tipo de ingreso</th>
                  <th>Monto</th>
                  <th>Moneda</th>
                  <th>Monto Ingresado</th>
                  <th>Moneda Ingresado</th>
                  <th>Tipo de Cambio</th>
                  <th>concepto</th>
                  <th>Nro Factura</th>
                  <th>Nro Serie</th>
                  <th>Accion</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(i, index) in item.detalles" :key="index">
                  <td>{{ i.banco }}</td>
                  <td>{{ i.cuenta_destino }}</td>
                  <!-- <td>{{ i.tipo }}</td> -->
                  <!-- <td>{{ i.tipo_gasto }}</td>  -->
                  <td>{{ i.tipo_ingreso }}</td>
                  <td>{{ i.subtipo_ingreso }}</td>
                  <td>{{ i.monto }}</td>
                  <td>{{ i.moneda_simbolo }}</td>
                  <td>{{ i.monto_destino }}</td>
                  <td>{{ i.moneda_destino }}</td>
                  <td>{{ i.tipocambio }}</td>
                  <td>{{ i.concepto }}</td>
                  <td>{{ i.factura }}</td>
                  <td>{{ i.serie }}</td>
                  <td>{{ i.action }}</td>
                </tr>
              </tbody>
            </v-simple-table>
          </td>
        </template>
        <template v-slot:[`item.tipocambio`]="{ item }">
          {{ item.tipocambio ? parseFloat(item.tipocambio).toFixed(2) : 0 }}
        </template>
        <template v-slot:[`item.monto_destino`]="{ item }">
          {{
            item.monto_destino ? parseFloat(item.monto_destino).toFixed(2) : 0
          }}
        </template>
        <template v-slot:[`item.concepto`]="{ item }">
          <ol>
            <li
              v-for="(subItem, index) in (item.concepto || '').split(',')"
              :key="index"
            >
              {{ subItem.trim() }}
            </li>
          </ol>
        </template>
        <template v-slot:[`item.action`]="{ item }">
          <v-btn small icon color="red" @click="verSoport(item.soporte)">
            <v-icon>mdi-file</v-icon>
          </v-btn>

          <v-btn small icon color="info" @click.native="ver(item)">
            <v-icon>mdi-eye</v-icon>
          </v-btn>
        </template>
      </v-data-table>

      <v-navigation-drawer
        absolute
        permanent
        temporary
        right
        width="20%"
        v-if="dialogFiltro"
      >
        <v-card height="100%" elevation="10">
          <v-card-title primary-title>
            Filtrar Ingresos
            <v-spacer></v-spacer>
            <v-btn icon color="default" @click="dialogFiltro = !dialogFiltro">
              <v-icon>mdi-close</v-icon>
            </v-btn></v-card-title
          >
          <v-card-text>
            <v-select
              :items="$store.state.itemsDataBanksList"
              v-model="filtro.id_banco"
              label="Banco Origen"
              item-text="acronym"
              item-value="id"
              clearable
              outlined
              class="mb-2"
              dense
              hide-details
            >
            </v-select>
            <v-select
              :items="cuentas"
              v-model="filtro.id_cuenta"
              label="Cuenta Bancaria Destino (PIC)"
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
              :items="$store.state.clientes"
              v-model="filtro.id_consigner"
              label="Consignatario"
              item-text="namelong"
              item-value="id"
              clearable
              outlined
              class="mb-2"
              dense
              hide-details
            >
            </v-autocomplete>
            <v-autocomplete
              label="Tipo de Ingreso"
              :items="$store.state.balances.tipoingreso"
              v-model="filtro.tipoingreso"
              auto-select-first
              clearable
              outlined
              class="mb-2"
              dense
              hide-details
              item-text="description"
              item-value="id"
            ></v-autocomplete>

            <v-autocomplete
              label="Subtipo de Ingreso"
              :items="tiposubingresoFilter"
              v-model="filtro.tiposubingreso"
              auto-select-first
              clearable
              outlined
              class="mb-2"
              dense
              hide-details
              item-text="description"
              item-value="id"
            ></v-autocomplete>

            <v-text-field
              clearable
              outlined
              class="mb-2"
              dense
              hide-details
              label="Nro Operacion"
              v-model="filtro.nro_operacion"
            >
            </v-text-field>
            <v-text-field
              clearable
              outlined
              class="mb-2"
              dense
              hide-details
              label="Nro Expediente"
              v-model="filtro.nro_exp"
            >
            </v-text-field>
            <v-text-field
              clearable
              outlined
              class="mb-2"
              dense
              hide-details
              type="number"
              label="Monto"
              v-model="filtro.monto"
            >
            </v-text-field>
            <FormatFecha
              :dense="true"
              :outlined="true"
              label="Fecha Desde"
              id="filtroDesde"
              v-model="filtro.fechadesde"
            />
            <FormatFecha
              :dense="true"
              :outlined="true"
              label="Fecha Hasta"
              id="filtroHasta"
              v-model="filtro.fechahasta"
            />
            <!-- <v-checkbox
              v-model="filtro.operativo"
              
              label="Operativo"
            ></v-checkbox>
            <v-checkbox
              v-model="filtro.administrativo"
              
              label="Administrativo"
            ></v-checkbox> -->
          </v-card-text>
          <v-card-actions>
            <v-spacer> </v-spacer>
            <v-btn color="success" @click="filtrar()" >Aceptar</v-btn>
            <v-btn color="error" @click="limpiar()" >Limpiar </v-btn>
          </v-card-actions>
        </v-card>
      </v-navigation-drawer>
    </v-card>
  </v-container>
</template>

<script>
import axios from "@/api/axios-config";
import swal from "sweetalert2";
import moment from "moment";
import { mapActions } from "vuex";
import Swal from "sweetalert2";
import FormatFecha from "../comun/FormatFecha.vue";
export default {
  components: {
    FormatFecha,
  },
  data() {
    return {
      stepEditarIngreso: 1,
      mostrarAdvFlag: true,
      EditarIngresoFlag: false,
      Ingreso: {},
      search: "",
      listado: [],
      dataList: false,
      headersCabecera: [
        { text: "Fecha Operacion", value: "fecha_pago" },
        // { text: "Fecha Registro",value: "fecha_creacion",filterable: false,with: "5%",},
        { text: "Nro Operación	", value: "nro_operacion" },
        // { text: "Banco Origen", value: "banco" },
        { text: "Cuenta Destino (PIC)", value: "cuenta_destino" },
        { text: "O/A	", value: "tipo" },
        { text: "Tipo de Pago", value: "tipo_gasto", with: "5%" },
        { text: "Tipo Ingreso", value: "tipo_ingreso", with: "5%" },
        { text: "Sub Tipo de ingreso", value: "subtipo_ingreso" },
        { text: "Cliente	", value: "name_consigner" },
        { text: "Monto	", value: "monto" },
        { text: "Moneda	", value: "moneda_simbolo", with: "5%" },
        {
          text: "Monto Ingresado al Banco	",
          value: "monto_destino",
          with: "5%",
        },
        {
          text: "Moneda Ingresado al Banco	",
          value: "moneda_destino",
          with: "5%",
        },
        { text: "Tipo de Cambio	", value: "tipocambio", with: "5%" },
        // { text: "Concepto	", value: "concepto", with: "20%" },
        { text: "Nro Factura", value: "factura", with: "5%" },
        { text: "Nro Serie", value: "serie", with: "5%" },
        { text: "Accion", value: "action" },
      ],
      filtro: {
        id_branch: "",
        nro_operacion: "",
        monto: "",
        fechadesde: "",
        fechahasta: "",
        factura: "",
        serie: "",
        id_banco: "",
        id_cuenta: "",
        id_consigner: "",
        id_coin: "",
        tipoingreso: "",
        tiposubingreso: "",
        operativo: true,
        administrativo: true,
      },
      payfile: null,
      dato: {
        id: "",
        id_proveedor: "",
        nro_operacion: "",
        monto: "",
        fecha: "",
        id_banco_origen: "",
        id_cuenta_pic: "",
        soporte: "",
        id_path: "",
      },
      dialogInvoice: false,
      dialogPayDebsClient: false,
      verflag: false,
      cuentas: [],
      loading: false,
      dialogFiltro: false,
      usuario: null,
      expanded: [],
      expand: [],
      singleExpand: true,
    };
  },
  async mounted() {
    this.usuario = JSON.parse(sessionStorage.getItem("dataUser"))[0].usuario;
    this.filtro.fechadesde = moment().format("YYYY-01-01");
    this.filtro.fechahasta = moment().endOf("month").format("YYYY-MM-DD");
    const vm = this;
    vm.$store.state.spiner = true;
    await vm.getListBanksDetailsCxC();
    vm.$store.state.spiner = false;

    await Promise.all([
      vm.getCargarTipoIngreso(),
      vm._getBanksList(),
      vm.getCargarTipoSubIngreso(),
      vm.filtarSubIngreso(),
      vm.getListBanksDetailsCargar(),
      vm.cargarClientes(),
      vm._getCoinsList(),
    ]);
    vm.$store.state.drawer = false;
  },
  methods: {
    ...mapActions([
      "cargarClientes",
      "_getBanksList",
      "getCargarTipoIngreso",
      "getCargarTipoSubIngreso",
      "validarUsuarioAdmin",
      "_getCoinsList",
      "ActualizarCXC",
    ]),
    async ver(pago) {
      this.$router.push({
        name: "verPagosPorCliente",
        params: { id: pago.id_pago },
      });
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
        nro_operacion: "",
        monto: "",
        fechadesde: "",
        fechahasta: "",
        factura: "",
        serie: "",
        id_banco: "",
        id_coin: "",
        id_consigner: "",
        tipoingreso: "",
        tiposubingreso: "",
        operativo: true,
        administrativo: true,
        nro_exp: "",
      };
      this.$store.state.spiner = true;
      await this.getListBanksDetailsCxC();
      this.dialogFiltro = !this.dialogFiltro;
      this.$store.state.spiner = false;
    },
    async filtrar() {
      this.$store.state.spiner = true;
      await this.getListBanksDetailsCxC();
      this.dialogFiltro = !this.dialogFiltro;
      this.$store.state.spiner = false;
    },
    nuevo() {
      this.$router.push({ name: "registroPayForCliente" });
    },
    async editar(item) {
      let val = true;
      let msg = "";
      this.payfile = null;
      this.Ingreso.id_path = null;
      await swal
        .fire({
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
        })
        .then(async (result) => {
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
      let detalles = item.detalles.map((detalle) => {
        return {
          ...detalle,
          anuladoflag: false,
        };
      });
      item.detalles = detalles;

      this.Ingreso = item;
      this.EditarIngresoFlag = true;
    },
    abrirPDF(url) {
      window.open(url, "_blank");
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
    verSoport(ruta) {
      window.open(ruta, "_blank");
    },
    async getListBanksDetailsCxC() {
      let data = {
        id_branch: JSON.parse(sessionStorage.getItem("dataUser"))[0].id_branch,
      };
      let vm = this;
      var config = {
        method: "get",
        url:
          process.env.VUE_APP_URL_MAIN +
          `getListarPayForCustomerDetalle?id_branch=${
            JSON.parse(sessionStorage.getItem("dataUser"))[0].id_branch
          }&nro_operacion=${
            this.filtro.nro_operacion ? this.filtro.nro_operacion : ""
          }&monto=${this.filtro.monto ? this.filtro.monto : ""}&fechadesde=${
            this.filtro.fechadesde ? this.filtro.fechadesde : ""
          }&fechahasta=${
            this.filtro.fechahasta ? this.filtro.fechahasta : ""
          }&factura=${this.filtro.factura ? this.filtro.factura : ""}&serie=${
            this.filtro.serie ? this.filtro.serie : ""
          }&id_banco=${
            this.filtro.id_banco ? this.filtro.id_banco : ""
          }&id_coin=${
            this.filtro.id_coin ? this.filtro.id_coin : ""
          }&id_consigner=${
            this.filtro.id_consigner ? this.filtro.id_consigner : ""
          }&id_tipoingreso=${
            this.filtro.tipoingreso ? this.filtro.tipoingreso : ""
          }&id_tiposubingreso=${
            this.filtro.tiposubingreso ? this.filtro.tiposubingreso : ""
          }&operativo=${this.filtro.operativo}&administrativo=${
            this.filtro.administrativo
          }&nro_exp=${this.filtro.nro_exp ? this.filtro.nro_exp : ""}`,
        headers: {
          "Content-Type": "application/json",
        },
        data: data,
      };
      await axios(config)
        .then(function (response) {
          let data = response.data;
          if (data.estadoflag) {
            vm.listado = data.data.map((element, index) => ({
              ...element,
              index,
            }));
            vm.dataList = true;
          } else {
            vm.listado = [];
            Swal.fire({
              icon: "error",
              text: data.mensaje,
            });
          }
        })
        .catch(function (error) {
          console.log(error);
        });
    },
    async verInvoice(id, editar = false) {
      let vm = this;
      vm.verflag = !editar;
      var config = {
        method: "get",
        url: process.env.VUE_APP_URL_MAIN + "ver_ingresos_invoice?id=" + id,

        headers: {
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
        url: process.env.VUE_APP_URL_MAIN + "ver_ingresos_debscliente?id=" + id,

        headers: {
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
      vm.dialogPayDebsClient = true;
    },
    async actualizarInvoice() {
      let vm = this;
      if (vm.$refs.formInvoice.validate()) {
        vm.dato.usuario = vm.usuario;
        var config = {
          method: "put",
          url: process.env.VUE_APP_URL_MAIN + "actualizar_ingreso_invoice",

          headers: {
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
    async actualizarDebs() {
      let vm = this;
      if (this.$refs.formInvoice.validate()) {
        vm.dato.usuario = vm.usuario;
        var config = {
          method: "put",
          url: process.env.VUE_APP_URL_MAIN + "actualizar_ingreso_debscliente",

          headers: {
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
                  vm.dialogPayDebsClient = false;
                }
              });
          })
          .catch(function (error) {
            console.log(error);
          });
      }
    },
    async exportar() {
      // let vm = this;
      this.loading = true;
      var config = {
        method: "get",
        url:
          process.env.VUE_APP_URL_MAIN +
          `exportar_listado_reporte_ingresos?id_branch=${
            JSON.parse(sessionStorage.getItem("dataUser"))[0].id_branch
          }&nro_operacion=${
            this.filtro.nro_operacion ? this.filtro.nro_operacion : ""
          }&monto=${this.filtro.monto ? this.filtro.monto : ""}&fechadesde=${
            this.filtro.fechadesde ? this.filtro.fechadesde : ""
          }&fechahasta=${
            this.filtro.fechahasta ? this.filtro.fechahasta : ""
          }&factura=${this.filtro.factura ? this.filtro.factura : ""}&serie=${
            this.filtro.serie ? this.filtro.serie : ""
          }&id_banco=${
            this.filtro.id_banco ? this.filtro.id_banco : ""
          }&id_coin=${
            this.filtro.id_coin ? this.filtro.id_coin : ""
          }&id_consigner=${
            this.filtro.id_consigner ? this.filtro.id_consigner : ""
          }&id_tipoingreso=${
            this.filtro.tipoingreso ? this.filtro.tipoingreso : ""
          }&id_tiposubingreso=${
            this.filtro.tiposubingreso ? this.filtro.tiposubingreso : ""
          }&operativo=${this.filtro.operativo}&administrativo=${
            this.filtro.administrativo
          }&nro_exp=${this.filtro.nro_exp ? this.filtro.nro_exp : ""}`,
        responseType: "blob",
        headers: {
          "Content-Type": "application/json",
        },
      };
      await axios(config)
        .then(function (response) {
          const url = window.URL.createObjectURL(new Blob([response.data]));
          const link = document.createElement("a");
          link.href = url;
          link.setAttribute(
            "download",
            `Reporte Bancos - Ingresos ${moment().format(
              "DD_MM_YYYY_h_mm_ss",
            )} .xlsx`,
          );
          document.body.appendChild(link);
          link.click();
        })
        .catch(function (error) {
          console.log(error);
        });
      this.loading = false;
      // exportar_listado_reporte_pagos
    },
    async obtenerListado() {
      let vm = this;
      vm.$store.state.spiner = true;
      await vm.getListBanksDetailsCxC();
      vm.dato = {
        id: "",
        id_proveedor: "",
        nro_operacion: "",
        monto: "",
        fecha: "",
        id_banco_origen: "",
        id_cuenta_pic: "",
        soporte: "",
        id_path: "",
      };
      vm.$store.state.spiner = false;
    },
    filtarSubIngreso() {
      if (!!this.filtro.tipoingreso) {
        this.tiposubingresoFilter =
          this.$store.state.balances.tiposubingreso.filter(
            (v) => v.id_ingreso == this.filtro.tipoingreso,
          );
      } else {
        this.tiposubingresoFilter = this.$store.state.balances.tiposubingreso;
      }
    },
    clickRow(item, event) {
      if (event.isExpanded) {
        const index = this.expanded.findIndex((i) => i === item);
        this.expanded.splice(index, 1);
      } else {
        this.expanded.push(item);
      }
    },
    async ActualizarIngreso() {
      await this.ActualizarCXC(this.Ingreso);
      this.$store.state.spiner = true;
      await this.getListBanksDetailsCxC();
      this.$store.state.spiner = false;
      this.EditarIngresoFlag = false;
    },
  },
  watch: {
    "filtro.tipoingreso"() {
      this.filtarSubIngreso();
    },
  },
  computed: {
    detalles() {
      if (Object.keys(this.Ingreso).length === 0) {
        return [];
      }

      return this.Ingreso.detalles.filter((v) => !!v && !v.anuladoflag);
    },
  },
};
</script>

<style></style>
