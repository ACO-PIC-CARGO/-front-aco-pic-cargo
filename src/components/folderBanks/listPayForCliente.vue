<template>
  <v-card min-height="80vh">
    <v-card-title>
      <v-text-field v-model="search" label="Buscar...."> </v-text-field>
      <v-spacer> </v-spacer>
      <v-btn color="default" @click="nuevo" text class="mx-1"
        >NUEVO INGRESO <v-icon>mdi-plus</v-icon>
      </v-btn>
      <v-btn
        color="success"
        @click="exportar()"
        :loading="loading"
        text
        class="mx-1"
        >EXCEL <v-icon>mdi-file-excel</v-icon>
      </v-btn>
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
      :items="$store.state.bank.list"
      :expanded.sync="expanded"
      :single-expand="singleExpand"
      show-expand
      @click:row="clickRow"
      item-key="id"
      disable-sort
    >
      <template v-slot:[`item.urlarchivo`]="{ item }">
        <v-btn icon color="" @click="verSoport(item.urlarchivo)">
          <v-icon>mdi-file</v-icon>
        </v-btn>
        <v-btn small icon color="info" @click.native="ver(item)">
          <v-icon>mdi-eye</v-icon>
        </v-btn>
        <v-btn small icon color="orange" @click.native="editar(item)">
          <v-icon>mdi-pencil</v-icon>
        </v-btn>
        <v-btn small icon color="red" @click.native="confirmarEliminar(item)">
          <v-icon>mdi-delete</v-icon>
        </v-btn>
      </template>
      <template v-slot:expanded-item="{ item }">
        <td colspan="1"></td>
        <td colspan="16">
          <v-simple-table style="width: 100%">
            <thead>
              <tr>
                <th>Concepto</th>
                <th>Nro Factura</th>
                <th>Nro Serie</th>
                <th>Monto Ingresado (USD)</th>
                <th>Monto Ingresado (M.L)</th>
                <th>Accion</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(i, index) in item.detalle" :key="index">
                <td>{{ i.code_master }}</td>
                <td>{{ i.nro_factura }}</td>
                <td>{{ i.nro_serie }}</td>
                <td>{{ i.montodolar }}</td>
                <td>{{ i.montomonedalocal }}</td>
              </tr>
            </tbody> </v-simple-table
          ><v-simple-table
            style="width: 100%"
            v-if="item.comisionbancaria.length > 0"
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
              <tr v-for="i in item.comisionbancaria" :key="i.id">
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
      <template v-slot:[`item.action`]="{ item }">
        <v-btn x-small icon color="primary" @click="verSoport(item.urlarchivo)">
          <v-icon>mdi-file-cloud-outline</v-icon>
        </v-btn>
        <v-btn x-small icon color="warning" @click.native="editar(item)">
          <v-icon>mdi-pencil</v-icon>
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
            label="Nro Operacion"
            v-model="filtro.nro_operacion"
            clearable
            outlined
            class="mb-2"
            dense
            hide-details
          >
          </v-text-field>
          <v-text-field
            label="Nro Expediente"
            v-model="filtro.nro_exp"
            clearable
            outlined
            class="mb-2"
            dense
            hide-details
          >
          </v-text-field>
          <v-text-field
            type="number"
            label="Monto"
            v-model="filtro.monto"
            clearable
            outlined
            class="mb-2"
            dense
            hide-details
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
        </v-card-text>
        <v-card-actions>
          <v-spacer> </v-spacer>
          <v-btn color="success" @click="filtrar()">Aceptar</v-btn>
          <v-btn color="error" @click="limpiar()">Limpiar </v-btn>
        </v-card-actions>
      </v-card>
    </v-navigation-drawer>
  </v-card>
</template>

<script>
import axios from "@/api/axios-config";
import swal from "sweetalert2";
import moment from "moment";
import { mapActions } from "vuex";
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
        { value: "fechaoperacion", text: "Fecha Operación" }, // text,
        { value: "numerooperacion", text: "Nro Operación" }, // varchar,
        { value: "bancoingreso", text: "Banco de Origen" }, // varchar,
        { value: "nrocuenta", text: "Número de Cuenta Destino" }, // text,
        { value: "cliente", text: "Cliente" }, // text,
        { value: "totaldolar", text: "Total en Dólares" }, // numeric(19,4),
        { value: "totalmonedalocal", text: "Total en Moneda Local" }, // numeric(19,4),
        { value: "tipocambio", text: "Tipo de Cambio" }, // numeric(19,4),
        { value: "monedaregistro", text: "Moneda de Registro" }, // varchar,
        { value: "comentarioadmin", text: "Comentario del Administrador" }, // text,
        { value: "comentariousuario", text: "Comentario del Usuario" }, // text,
        // { value: "nombrearchivo", text: "Nombre del Archivo" }, // varchar,
        { value: "urlarchivo", text: "Acción" }, // varchar,
        // { value: detalle, text: "detalle" }, // json,
        // { value: comisionbancaria, text: "comisionbancaria" }, // json
      ],
      filtro: {
        id_branch: "",
        id_banco_origin: "",
        id_cuenta_destino: "",
        id_cliente: "",
        id_tipoingreso: "",
        id_subtipoingreso: "",
        nro_operacion: "",
        nro_expediente: "",
        monto_factura: "",
        fechadesde: "",
        fechahasta: "",
        operativo: "",
        administrativo: "",
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
    await vm.getRegistroIngresos(this.filtro);
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
    async ver(pago) {
      console.log("pago", pago);
      this.$router.push({
        name: "verPagosPorCliente",
        params: { id: pago.id },
      });
    },
    confirmarEliminar(pago) {
      swal
        .fire({
          icon: "warning",
          title: "Eliminar Registro",
          text: "¿Está seguro que quiere eliminar el registro?",
          showDenyButton: true,
          denyButtonColor: "#263238",
          denyButtonText: "Cancelar",
          confirmButtonText: "Si, Eliminar",
          confirmButtonColor: "red",
          showCloseButton: true,
        })
        .then((res) => {
          if (res.isConfirmed) {
            this.eliminar(pago);
          }
        });
    },
    async eliminar(pago) {
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
      await this.eliminarRegistroIngresos(pago);
      await this.getRegistroIngresos(this.filtro);
    },
    ...mapActions([
      "cargarClientes",
      "_getBanksList",
      "getCargarTipoIngreso",
      "getCargarTipoSubIngreso",
      "validarUsuarioAdmin",
      "_getCoinsList",
      "ActualizarCXC",
      "getRegistroIngresos",
      "eliminarRegistroIngresos",
    ]),
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
        fechaemision: "",
      };
      this.$store.state.pricing.pagina = 1;
      this.$store.state.spiner = true;
      await this.getRegistroIngresos(this.filtro);
      this.dialogFiltro = !this.dialogFiltro;
      this.$store.state.spiner = false;
    },
    async filtrar() {
      this.$store.state.spiner = true;
      await this.getRegistroIngresos(this.filtro);
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

      this.$router.push({
        name: "editarPagosPorCliente",
        params: { id: item.id },
      });
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
