<template>
  <v-card min-height="80vh">
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
      :items="listado"
      :expanded.sync="expanded"
      :single-expand="singleExpand"
      show-expand
      @click:row="clickRow"
      item-key="index"
      dense
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
        </td></template
      >
      <template v-slot:[`item.action`]="{ item }">
        <v-btn x-small icon color="primary" @click="verSoport(item.soporte)">
          <v-icon>mdi-file-cloud-outline</v-icon>
        </v-btn>
        <v-btn x-small icon color="warning" @click.native="editar(item)">
          <v-icon>mdi-pencil</v-icon>
        </v-btn>
      </template>
    </v-data-table>
    <!--  -->
    <v-dialog
      v-model="dialogInvoice"
      scrollable
      persistent
      max-width="60%"
      transition="dialog-transition"
    >
      <v-card>
        <v-card-title primary-title>
          {{ verflag ? "Ver " : "Editar" }}
          <v-spacer> </v-spacer>
          <v-btn icon color="default" @click="dialogInvoice = !dialogInvoice">
            <v-icon>mdi-close</v-icon>
          </v-btn>
        </v-card-title>
        <v-card-text>
          <v-form ref="formInvoice">
            <v-select
              :items="$store.state.provedores"
              v-model="dato.id_proveedor"
              label="Consignatario"
              item-text="namelong"
              item-value="id"
              readonly
            >
            </v-select>
            <v-text-field
              label="Nro Operacion"
              type="number"
              v-model="dato.nro_operacion"
              :rules="[(v) => !!v || 'Datos Requerido']"
            >
            </v-text-field>
            <v-text-field
              label="Monto "
              v-model="dato.monto"
              :rules="[(v) => !!v || 'Datos Requerido']"
            >
            </v-text-field>
            <v-text-field
              type="date"
              label="Fecha Operacion"
              v-model="dato.fecha"
              :rules="[(v) => !!v || 'Datos Requerido']"
            >
            </v-text-field>
            <v-select
              :items="$store.state.itemsDataBanksList"
              v-model="dato.id_banco_origen"
              label="Banco Origen"
              item-text="acronym"
              item-value="id"
              :rules="[(v) => !!v || 'Datos Requerido']"
            >
            </v-select>
            <v-select
              :items="cuentas"
              v-model="dato.id_cuenta_pic"
              label="Cuenta Bancaria Destino (PIC)"
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
            >
          </v-form>
        </v-card-text>
        <v-card-actions>
          <v-spacer> </v-spacer>
          <v-btn color="success" text @click="actualizarInvoice()"
            >Guardar</v-btn
          >
          <v-btn color="warning" text @click="dialogInvoice = !dialogInvoice"
            >Cancelar</v-btn
          >
        </v-card-actions>
      </v-card>
    </v-dialog>
    <!--  -->
    <v-dialog
      v-model="dialogPayDebsClient"
      scrollable
      persistent
      max-width="60%"
      transition="dialog-transition"
    >
      <v-card>
        <v-card-title primary-title>
          {{ verflag ? "Ver " : "Editar" }}
          <v-spacer> </v-spacer>
          <v-btn
            icon
            color="default"
            @click="dialogPayDebsClient = !dialogPayDebsClient"
          >
            <v-icon>mdi-close</v-icon>
          </v-btn>
        </v-card-title>
        <v-card-text>
          <v-form ref="formInvoice">
            <v-select
              :items="$store.state.provedores"
              v-model="dato.id_proveedor"
              label="Consignatario"
              item-text="namelong"
              item-value="id"
              readonly
            >
            </v-select>
            <v-text-field
              label="Nro Operacion"
              type="number"
              v-model="dato.nro_operacion"
              :rules="[(v) => !!v || 'Datos Requerido']"
            >
            </v-text-field>
            <v-text-field
              label="Monto "
              v-model="dato.monto"
              :rules="[(v) => !!v || 'Datos Requerido']"
            >
            </v-text-field>
            <v-text-field
              type="date"
              label="Fecha Operacion"
              v-model="dato.fecha"
              :rules="[(v) => !!v || 'Datos Requerido']"
            >
            </v-text-field>
            <v-select
              :items="$store.state.itemsDataBanksList"
              v-model="dato.id_banco_origen"
              label="Banco Origen"
              item-text="acronym"
              item-value="id"
              :rules="[(v) => !!v || 'Datos Requerido']"
            >
            </v-select>
            <v-select
              :items="cuentas"
              v-model="dato.id_cuenta_pic"
              label="Cuenta Bancaria Destino (PIC)"
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
          <v-btn color="success" text @click="actualizarDebs()">Guardar</v-btn>
          <v-btn
            color="warning"
            text
            @click="dialogPayDebsClient = !dialogPayDebsClient"
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
            dense
            label="Banco Origen"
            item-text="acronym"
            item-value="id"
            clearable
          >
          </v-select>
          <v-select
            :items="cuentas"
            v-model="filtro.id_cuenta"
            dense
            label="Cuenta Bancaria Destino (PIC)"
            item-text="label"
            item-value="id"
            clearable
          >
          </v-select>
          <v-autocomplete
            :items="$store.state.clientes"
            v-model="filtro.id_consigner"
            dense
            label="Consignatario"
            item-text="namelong"
            item-value="id"
            clearable
          >
          </v-autocomplete>
          <v-autocomplete
            label="Tipo de Ingreso"
            :items="$store.state.balances.tipoingreso"
            v-model="filtro.tipoingreso"
            auto-select-first
            clearable
            dense
            item-text="description"
            item-value="id"
          ></v-autocomplete>

          <v-autocomplete
            label="Subtipo de Ingreso"
            :items="tiposubingresoFilter"
            dense
            v-model="filtro.tiposubingreso"
            auto-select-first
            clearable
            item-text="description"
            item-value="id"
          ></v-autocomplete>

          <v-text-field
            clearable
            label="Nro Operacion"
            v-model="filtro.nro_operacion"
            dense
          >
          </v-text-field>
          <v-text-field
            clearable
            label="Tipo de Pago (Nro Expediente)"
            v-model="filtro.nro_exp"
            dense
          >
          </v-text-field>
          <v-text-field
            clearable
            type="number"
            label="Monto"
            v-model="filtro.monto"
            dense
          >
          </v-text-field>
          <v-text-field
            v-model="filtro.fechadesde"
            dense
            label="Fecha Desde"
            type="date"
          >
          </v-text-field>
          <v-text-field
            v-model="filtro.fechahasta"
            dense
            label="Fecha Hasta"
            type="date"
          >
          </v-text-field>
          <v-checkbox
            v-model="filtro.operativo"
            dense
            label="Operativo"
          ></v-checkbox>
          <v-checkbox
            v-model="filtro.administrativo"
            dense
            label="Administrativo"
          ></v-checkbox>
        </v-card-text>
        <v-card-actions>
          <v-spacer> </v-spacer>
          <v-btn color="success" @click="filtrar()" text>Aceptar</v-btn>
          <v-btn color="warning" @click="limpiar()" text>Limpiar </v-btn>
        </v-card-actions>
      </v-card>
    </v-navigation-drawer>

    <v-dialog
      v-model="EditarIngresoFlag"
      persistent
      :overlay="false"
      max-width="80%"
      transition="dialog-transition"
    >
      <v-card>
        <v-card-title primary-title>
          Editar Ingreso <v-spacer></v-spacer>
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
                  <b>Cliente: </b> {{ Ingreso.name_consigner }}
                </v-col>
                <v-col cols="12">
                  <v-simple-table>
                    <thead>
                      <tr>
                        <th>House</th>
                        <th>Sub Ingreso</th>
                        <th>Monto Dolar</th>
                        <th>Monto ML</th>
                        <th>Moneda</th>
                        <th>Tipo Cambio</th>
                        <th></th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr v-for="(detalle, index) in detalles" :key="index">
                        <td>{{ detalle.tipo_gasto }}</td>
                        <td>{{ detalle.subtipo_ingreso }}</td>
                        <td>
                          <v-text-field
                            type="number"
                            v-model="detalle.monto"
                          ></v-text-field>
                        </td>
                        <td>
                          <v-text-field
                            type="number"
                            v-model="detalle.monto_destino"
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
                <v-col cols="4">
                  <v-select
                    :items="cuentas"
                    v-model="Ingreso.id_cuenta"
                    label="Banco Origen"
                    item-text="label"
                    item-value="id"
                    dense
                    outlined
                    :rules="[(v) => !!v || 'Datos Requerido']"
                  >
                  </v-select>
                </v-col>
                <v-col cols="4">
                  <v-select
                    :items="$store.state.itemsDataBanksList"
                    v-model="Ingreso.id_banco_salida"
                    label="Banco Destino"
                    item-text="acronym"
                    item-value="id"
                    dense
                    outlined
                    :rules="[(v) => !!v || 'Datos Requerido']"
                  >
                  </v-select>
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
        // { text: "Tipo de Cambio	", value: "tipocambio", with: "5%" },
        // { text: "concepto	", value: "concepto", with: "20%" },
        // { text: "Nro Factura", value: "factura", with: "5%" },
        // { text: "Nro Serie", value: "serie", with: "5%" },
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
    this.filtro.fechadesde = moment().startOf("month").format("YYYY-MM-DD");
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
          `getListarPayForCustomer?id_branch=${
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
          "auth-token": sessionStorage.getItem("auth-token"),
          "Content-Type": "application/json",
        },
        data: data,
      };
      await axios(config)
        .then(function (response) {
          let data = response.data.data;
          vm.listado = data.map((element, index) => ({ ...element, index }));
          vm.dataList = true;
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
        url: process.env.VUE_APP_URL_MAIN + "ver_ingresos_debscliente?id=" + id,

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
          "auth-token": sessionStorage.getItem("auth-token"),
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
              "DD_MM_YYYY_h_mm_ss"
            )} .xlsx`
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
            (v) => v.id_ingreso == this.filtro.tipoingreso
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
