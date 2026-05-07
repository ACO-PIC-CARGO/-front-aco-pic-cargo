<template>
  <v-card height="90vh">
    <v-alert type="warning" v-if="mostrarAdvFlag" class="ocultarMovil">
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
    </v-alert>
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
      :items="listado"
      :expanded.sync="expanded"
      :single-expand="singleExpand"
      show-expand
      @click:row="clickRow"
      item-key="index"
      dense
      disable-sort
    >
      <template v-slot:[`item.action`]="{ item }">
        <v-btn icon color="red" @click="verSoport(item.ruta)">
          <v-icon>mdi-file-pdf-box</v-icon>
        </v-btn>
        <v-btn x-small icon color="warning" @click.native="editar(item)">
          <v-icon>mdi-pencil</v-icon>
        </v-btn>
      </template>
      <template v-slot:expanded-item="{ item }">
        <td colspan="1"></td>
        <td colspan="12">
          <v-simple-table style="width: 100%">
            <thead>
              <tr>
                <th>Fecha Registro</th>
                <th>O/A</th>
                <th>Expediente</th>
                <th>Monto (USD)</th>
                <th>Tipo Cambio</th>
                <th>Monto</th>
                <!-- <th>concepto</th> -->
                <th>Factura/ Proforma</th>
                <!-- <th>Nro Serie</th> -->
                <!-- <th>Accion</th> -->
              </tr>
            </thead>
            <tbody>
              <tr v-for="i in item.detalle" :key="i">
                <td>{{ i.create_at }}</td>
                <td>{{ i.tipo }}</td>
                <td>{{ i.tipo_gasto }}</td>
                <td>USD {{ i.monto_dolar }}</td>
                <td>{{ i.tipocambio }}</td>
                <td>{{ i.moneda_simbolo }} {{ i.monto_mon_ex }}</td>
                <!-- <td>{{ i.concepto }}</td> -->
                <!-- <td>{{ i.expedientes }}</td> -->

                <td>
                  <v-btn small color="warning" @click.native="verFactura(i)">
                    VER FACTURAS
                  </v-btn>
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
          >
          </v-select>
          <v-autocomplete
            :items="$store.state.provedores"
            v-model="filtro.id_proveedor"
            label="Proveedor"
            item-text="namelong"
            item-value="id"
            clearable
          >
          </v-autocomplete>

          <!-- <v-autocomplete
            label="Tipo de Gasto"
            :items="$store.state.balances.tipogastos"
            v-model="filtro.tipogastos"
            auto-select-first
            clearable
            dense
            item-text="description"
            item-value="id"
          ></v-autocomplete>

          <v-autocomplete
            label="Subtipo de Gasto"
            :items="tiposubgastosFilter"
            v-model="filtro.tiposubgastos"
            auto-select-first
            clearable
            dense
            item-text="description"
            item-value="id"
          ></v-autocomplete> -->

          <v-text-field
            clearable
            label="Nro Operacion"
            v-model="filtro.nro_operacion"
          >
          </v-text-field>
          <v-text-field
            clearable
            type="number"
            label="Monto"
            v-model="filtro.monto"
          >
          </v-text-field>
          <v-text-field v-model="filtro.desde" label="Fecha Desde" type="date">
          </v-text-field>
          <v-text-field v-model="filtro.hasta" label="Fecha Hasta" type="date">
          </v-text-field>
          <v-checkbox v-model="filtro.operativo" label="Operativo"></v-checkbox>
          <v-checkbox
            v-model="filtro.administrativo"
            label="Administrativo"
          ></v-checkbox>
        </v-card-text>
        <v-card-actions>
          <v-spacer> </v-spacer>
          <v-btn color="success" @click="filtrar()" text>Aceptar</v-btn>
          <v-btn color="red" @click="dialogFiltro = !dialogFiltro" text
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

    <v-dialog
      v-model="EditarIngresoFlag"
      persistent
      :overlay="false"
      max-width="80%"
      transition="dialog-transition"
    >
      <v-card>
        <v-card-title primary-title>
          Editar Salida <v-spacer></v-spacer>
          <v-icon @click="EditarIngresoFlag = !EditarIngresoFlag"
            >mdi-close</v-icon
          >
        </v-card-title>
        <v-stepper v-model="stepEditarIngreso">
          <v-stepper-header>
            <v-stepper-step editable step="1"> Step 1 </v-stepper-step>
            <v-divider></v-divider>
            <v-stepper-step editable step="2"> Step 2 </v-stepper-step>
          </v-stepper-header>
          <v-stepper-items>
            <v-stepper-content step="1">
              <v-row>
                <v-col cols="12">
                  <b>Proveedor: </b> {{ Ingreso.name_proveedor }}
                </v-col>
                <v-col cols="12">
                  <v-simple-table>
                    <thead>
                      <tr>
                        <th>House</th>
                        <th>Sub Ingreso</th>
                        <th>Monto Dolar</th>
                        <th>Monto ML</th>
                        <!-- <th>Moneda</th> -->
                        <th>Tipo Cambio</th>
                        <th></th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr v-for="(detalle, index) in detalles" :key="index">
                        <td>{{ detalle.tipo_gasto }}</td>
                        <td>{{ detalle.subtipo_gasto }}</td>
                        <td>
                          <v-text-field
                            type="number"
                            v-model="detalle.monto_dolar"
                          ></v-text-field>
                        </td>
                        <td>
                          <v-text-field
                            type="number"
                            v-model="detalle.monto_mon_ex"
                          ></v-text-field>
                        </td>
                        <!-- <td>{{ detalle.tipocambio }}</td> -->
                        <td>{{ detalle.tipocambio }}</td>
                        <td>
                          <v-btn
                            color="error"
                            icon
                            @click="detalle.anuladoflag = true"
                            ><v-icon>mdi-delete</v-icon></v-btn
                          >
                        </td>
                      </tr>
                    </tbody>
                  </v-simple-table>
                </v-col>
              </v-row>
            </v-stepper-content>
            <v-stepper-content step="2">
              <v-row>
                <v-col cols="4">
                  <v-text-field
                    outlined
                    dense
                    class="my-1"
                    label="Nro Operación"
                    v-model="Ingreso.nro_operacion"
                    :rules="[(v) => !!v || 'Datos Requerido']"
                  ></v-text-field>
                </v-col>
                <v-col cols="2">
                  <v-text-field
                    type="date"
                    outlined
                    dense
                    class="my-1"
                    label="Fecha Pago"
                    v-model="Ingreso.fecha_pago"
                    :rules="[(v) => !!v || 'Datos Requerido']"
                  ></v-text-field>
                </v-col>
                <v-col cols="2" class="py-auto">
                  Soporte de Pago:
                  <v-icon color="red" @click="abrirPDF(Ingreso.soporte)">
                    mdi-file-pdf-box
                  </v-icon>
                </v-col>
                <v-col cols="3" class="py-auto">
                  <v-file-input
                    @change="_uploadFile()"
                    label="Cambiar Soporte de Pago"
                    show-size
                    truncate-length="50"
                    outlined
                    dense
                    v-model="payfile"
                    :rules="[(v) => !!v || 'Datos Requerido']"
                  />
                </v-col>
                <v-col cols="6">
                  <v-select
                    :items="cuentas"
                    v-model="Ingreso.id_banco_salida"
                    label="Cuenta"
                    item-text="label"
                    item-value="id"
                    dense
                    outlined
                    :rules="[(v) => !!v || 'Datos Requerido']"
                  >
                  </v-select>
                </v-col>
                <v-col cols="6">
                  <v-textarea
                    v-model="Ingreso.comentarios"
                    auto-grow
                    rows="1"
                    label="Comentarios"
                    dense
                    outlined
                  />
                </v-col>
              </v-row>
            </v-stepper-content>
          </v-stepper-items>
          <v-row class="mx-5 mb-5">
            <v-col cols="12">
              <v-spacer></v-spacer>
              <v-btn color="success" @click="ActualizarIngreso()"
                >Actualizar</v-btn
              >
            </v-col>
          </v-row>
        </v-stepper>
      </v-card>
    </v-dialog>
  </v-card>
</template>

<script>
import axios from "axios";
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
        { text: "Fecha Operacion", value: "fecha_pago" },
        // { text: "Fecha Registro", value: "create_at" },
        { text: "Nro Operación	", value: "nro_operacion" },
        { text: "Cuenta Salida", value: "banco" },
        //{ text: "O/A	", value: "tipo" },
        //{ text: "Tipo Gasto	", value: "tipo_gasto" },
        //{ text: "Sub Tipo de Gasto", value: "subtipo_gasto" },
        { text: "Proveedor	", value: "name_proveedor" },
        { text: "Monto (USD)	", value: "monto_dolar" },
        { text: "Monto	", value: "monto_mon_ex" },
        { text: "Moneda	", value: "moneda_simbolo" },
        { text: "Comentarios", value: "comentarios" },
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
    this.filtro.desde = moment().startOf("month").format("YYYY-MM-DD");
    this.filtro.hasta = moment().endOf("month").format("YYYY-MM-DD");
    this.usuario = JSON.parse(sessionStorage.getItem("dataUser"))[0].usuario;

    let vm = this;
    vm.$store.state.spiner = true;
    await vm.getListBanksDetailsCxP();
    vm.$store.state.spiner = false;
    await vm.getListBanksDetailsCargar();
    await vm.getCargarTipoGastos();
    await vm.getCargarTipoSubGastos();
    await vm.cargarProveedores();
    await vm._getBanksList();
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
    ]),
    nuevo() {
      this.$store.state.files.payPath = null;
      this.$router.push({ name: "registroPayForProveedor" });
    },
    async editar(pago) {
      let item = { ...pago };
      let val = false;
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

      let detalles = item.detalle.map((detalle) => {
        return {
          ...detalle,
          anuladoflag: false,
        };
      });

      console.log("detalles", detalles);
      item.detalle = detalles;

      this.Ingreso = item;
      this.EditarIngresoFlag = true;
    },
    async ActualizarIngreso() {
      await this.ActualizarCXP(this.Ingreso);
      this.$store.state.spiner = true;
      await this.getListBanksDetailsCxP();
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

      this.$store.state.spiner = true;
      await this.getListBanksDetailsCxP();
      this.$store.state.spiner = false;
    },
    async filtrar() {
      this.$store.state.spiner = true;
      await this.getListBanksDetailsCxP();
      this.dialogFiltro = !this.dialogFiltro;
      this.$store.state.spiner = false;
    },
    // async editar(item) {
    //   let val = true;
    //   let msg = "";
    //   await swal
    //     .fire({
    //       title: "Ingrese sus datos Administrador",
    //       html:
    //         '<input id="swal-input1" class="swal2-input" placeholder="Nombre">' +
    //         '<input id="swal-input2" type="password" class="swal2-input" placeholder="Apellido">',
    //       focusConfirm: false,
    //       preConfirm: () => {
    //         const input1 = document.getElementById("swal-input1").value;
    //         const input2 = document.getElementById("swal-input2").value;
    //         if (!input1 || !input2) {
    //           Swal.showValidationMessage("Por favor, complete ambos campos");
    //         }
    //         return { usuario: input1, clave: input2 };
    //       },
    //     })
    //     .then(async (result) => {
    //       if (result.isConfirmed) {
    //         let res = await this.validarUsuarioAdmin({
    //           usuario: result.value.usuario,
    //           clave: result.value.clave,
    //         });

    //         val = res.estadoflag;
    //         msg = res.mensaje;
    //         // Aquí puedes manejar los datos ingresados
    //       }
    //     });
    //   if (!val) {
    //     swal.fire({
    //       icon: "error",
    //       text: msg,
    //     });
    //     return false;
    //   }

    //   this.$router.push({
    //     name: "EditarSalida",
    //     params: {
    //       nro_operacion: item.nro_operacion,
    //     },
    //   });
    // },
    async getListBanksDetailsCxP() {
      let vm = this;
      var config = {
        method: "get",
        url:
          process.env.VUE_APP_URL_MAIN +
          `getListBanksDetailsCxP?id_branch=${
            JSON.parse(sessionStorage.getItem("dataUser"))[0].id_branch
          }&desde=${this.filtro.desde ? this.filtro.desde : ""}&hasta=${
            this.filtro.hasta ? this.filtro.hasta : ""
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
          }&tipogastos=${
            this.filtro.tipogastos ? this.filtro.tipogastos : ""
          }&tiposubgastos=${
            this.filtro.tiposubgastos ? this.filtro.tiposubgastos : ""
          }&operativo=${this.filtro.operativo}&administrativo=${
            this.filtro.administrativo
          }`,

        headers: {
          "auth-token": sessionStorage.getItem("auth-token"),
          "Content-Type": "application/json",
        },
      };
      await axios(config)
        .then(function (response) {
          let data = response.data;
          if (data.estadoflag) {
            let data = response.data.data;
            vm.listado = data.map((element, index) => ({ ...element, index }));
          } else {
            vm.listado = [];
            swal.fire({
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
      await vm.getListBanksDetailsCxP();
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
