<template>
  <v-container fluid>
    <v-card elevation="0">
      <v-card-title>
        <h3>REPORTE DE CUENTAS POR PAGAR</h3>
        <v-spacer></v-spacer>
        <v-btn
          class="ml-5"
          color="primary"
          elevation="0"
          small
          plain
          @click="offcanvas = !offcanvas"
          ><v-icon>mdi-filter-multiple</v-icon> FILTRAR
        </v-btn>

        <v-btn
          color="#1D6F42"
          class="mx-1"
          dark
          @click="exportar"
          :loading="exportando"
          small
          plain
          ><v-icon>mdi-file-excel</v-icon> EXCEL</v-btn
        >
        <v-btn
          class="ml-5"
          color="red"
          :loading="exportandopdf"
          @click="exportarPDF()"
          elevation="0"
          small
          plain
        >
          <v-icon>mdi-file-pdf</v-icon> PDF</v-btn
        >
      </v-card-title>
      <v-card-text>
        <div class="row">
          <div class="col-6 px-10">
            <h5>TOTAL OPERATIVO</h5>
            <v-data-table
              :headers="cabTotalOperativo"
              :items="totalOperativo"
              hide-default-footer
            >
            </v-data-table>
          </div>
          <div class="col-6 px-10">
            <h5>TOTAL ADMINISTRATIVO</h5>
            <v-data-table
              :headers="cabTotalAdministrativo"
              :items="totalAdministrativo"
              hide-default-footer
            >
            </v-data-table>
          </div>
        </div>

        <v-data-table
          v-if="dataList"
          :headers="headersdbp"
          :items="itemsCpp"
          :search="search"
          :expanded.sync="expanded"
          :single-expand="singleExpand"
          item-key="nameproveedor"
          show-expand
          @click:row="clickRow"
        >
          <template v-slot:[`item.nameproveedor`]="{ item }">
            <div class="d-flex">
              <div>{{ item.nameproveedor }}</div>
              <v-btn
                small
                color="primary"
                class="ml-auto"
                @click.stop="mostrarComentariosOp(item)"
              >
                <v-icon small class="mr-1">mdi-comment</v-icon> Comentarios
              </v-btn>
            </div>
          </template>

          <template v-slot:expanded-item="{ item }">
            <td colspan="11">
              <v-simple-table style="width: 100%">
                <thead>
                  <tr style="background: #fff1cf">
                    <th>Expediente</th>
                    <th>Correlativo Factura</th>
                    <th>Correlativo Programación</th>
                    <th>Cliente</th>
                    <th>Facturas</th>
                    <th>Fecha Disponibilidad</th>
                    <th>Total a Pagar</th>
                    <th>Status</th>
                    <!-- <th>Pagado Cliente</th> -->
                  </tr>
                </thead>
                <tbody>
                  <tr
                    style="background: #fff1cf"
                    v-for="(child, index) of item.details"
                    :key="index"
                  >
                    <td>
                      {{ child.nro_master }}
                      <v-icon
                        v-if="child.controlgastoegreso == 1"
                        @click="editControl(child)"
                      >
                        mdi-eye
                      </v-icon>

                      <v-icon
                        v-if="child.programado == 0"
                        @click="
                          nuevaFecha({
                            item: item,
                            tipo: 1,
                          })
                        "
                        >mdi-clock-outline</v-icon
                      >
                    </td>
                    <td>
                      {{ child.code_correlativo }}
                    </td>
                    <td>
                      {{ child.programado_correlativo }}
                    </td>
                    <td>
                      {{ child.nameconsigner }}
                    </td>
                    <td>
                      {{ child.expedientes }}
                    </td>
                    <td>
                      {{ child.fecha_disponibilidad }}
                    </td>
                    <td>
                      {{ child.symbol }}
                      {{ parseFloat(child.total_pagar).toFixed(2) }}
                    </td>
                    <td>
                      {{ child.llegada == 1 ? "LLEGADA" : "NO LLEGADA" }}
                    </td>
                    <!-- <td>
                      {{ child.pagado == 1 ? "SI" : "NO" }}
                    </td> -->
                  </tr>
                </tbody>
              </v-simple-table>
            </td>
          </template>
        </v-data-table>

        <v-card-title primary-title>
          REPORTE DE CUENTAS POR PAGAR ADMINISTRATIVAS
        </v-card-title>

        <v-data-table
          :search="search"
          :headers="headersdbpa"
          :items="itemsCppa"
          :expanded.sync="expandeda"
          :single-expand="singleExpanda"
          item-key="nameconsigner"
          show-expand
          @click:row="clickRowa"
        >
          <template v-slot:[`item.nameconsigner`]="{ item }">
            <div class="d-flex">
              <div>{{ item.nameconsigner }}</div>
              <v-btn
                small
                color="primary"
                class="ml-auto"
                @click.stop="mostrarComentariosAdmin(item)"
              >
                <v-icon small class="mr-1">mdi-comment</v-icon> Comentarios
              </v-btn>
            </div>
          </template>

          <template v-slot:expanded-item="{ item }">
            <td colspan="11">
              <v-simple-table style="width: 100%">
                <thead>
                  <tr style="background: #fff1cf">
                    <th>Acción</th>
                    <th>Factura</th>
                    <th>Fecha Registro</th>
                    <th>Monto</th>
                    <th>
                      {{ $store.state.enterprises.impuesto.nombre_impuesto }}
                    </th>
                    <th>Total</th>
                  </tr>
                </thead>
                <tbody>
                  <tr
                    style="background: #fff1cf"
                    v-for="child of item.details"
                    :key="child.id"
                  >
                    <td>
                      <v-icon
                        v-if="child.programado"
                        @click="nuevaFecha({ item: item, tipo: 2 })"
                        >mdi-clock-outline</v-icon
                      >
                    </td>
                    <td>
                      {{ child.nro_factura }}
                    </td>
                    <td>{{ child.fecha }}</td>
                    <td>{{ child.symbol }} {{ child.monto }}</td>
                    <td>{{ child.symbol }} {{ child.igv }}</td>
                    <td>{{ child.symbol }} {{ child.total }}</td>
                  </tr>
                </tbody>
              </v-simple-table>
            </td>
          </template>
        </v-data-table>
      </v-card-text>
    </v-card>

    <!--COMENTARIOS-->
    <v-dialog v-model="dialogComentarios" persistent width="70%">
      <v-card>
        <v-card-title>
          Estados/Comentarios de la CxP - {{ dataCXP.proveedor }}
          <v-spacer></v-spacer>
          <template v-if="dataCXP.esoperativo">
            <v-btn rounded small color="primary" @click="agregarComentarioOp"
              >Nuevo Comentario</v-btn
            >
          </template>
          <template v-else-if="dataCXP.esadministrativo">
            <v-btn rounded small color="primary" @click="agregarComentarioAdmin"
              >Nuevo Comentario</v-btn
            >
          </template>
        </v-card-title>
        <v-card-text>
          <v-data-table
            :headers="headersLstComentarios"
            :items="lstComentarios"
            class="elevation-1"
            :loading="loadingDataTableComentarios"
          ></v-data-table>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn
            small
            color="error"
            @click="dialogComentarios = !dialogComentarios"
            >Cerrar</v-btn
          >
        </v-card-actions>
      </v-card>
    </v-dialog>
    <!--NUEVO COMENTARIO-->
    <v-dialog v-model="dialogNuevoComentario" persistent width="50%">
      <v-card>
        <v-card-title>
          Registro de Estado/Comentario de la CxP - {{ dataCXP.proveedor }}
          <v-spacer></v-spacer>
          <v-btn
            icon
            color="default"
            @click="dialogNuevoComentario = !dialogNuevoComentario"
          >
            <v-icon>mdi-close</v-icon>
          </v-btn>
        </v-card-title>
        <v-card-text>
          <v-form ref="frmComentario">
            <v-text-field
              dense
              label="Fecha"
              v-model="comentario.fecha"
              type="date"
              readonly
            ></v-text-field>
            <v-autocomplete
              dense
              label="Ejecutivo"
              :items="$store.state.pricing.listEjecutivo"
              item-text="name"
              item-value="id_entitie"
              item-key="id_entitie"
              v-model="comentario.id_ejecutivo"
              :rules="[(v) => !!v || 'Dato requerido']"
              readonly
            ></v-autocomplete>
            <v-textarea
              dense
              label="Estado/Comentario"
              v-model="comentario.texto"
              rows="4"
              auto-grow
              :rules="[(v) => !!v || 'Dato requerido']"
            ></v-textarea>
          </v-form>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn
            small
            color="success"
            @click="guardarComentario"
            :loading="loadingBotonGuardarComentario"
            >Guardar</v-btn
          >
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog max-width="400" v-model="dialogPdf">
      <v-card>
        <v-card-title> Opción de PDF </v-card-title>
        <v-card-text>
          <v-radio-group v-model="radiopdf">
            <v-radio value="1" label="Reporte Simple"></v-radio>
            <v-radio value="2" label="Reporte Detallado"></v-radio>
          </v-radio-group>
        </v-card-text>
        <v-card-actions>
          <v-btn
            v-if="radiopdf != ''"
            color="primary"
            @click="_exportPdf()"
            outlined
          >
            EXPORTAR
          </v-btn>
          <v-spacer></v-spacer>
          <v-btn color="red" @click="dialogPdf = false" outlined>Cerrar</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog v-model="dialogNuevoPago" scrollable persistent max-width="70%">
      <v-card>
        <v-card-title primary-title>
          Programación de Pago del Proveedor {{ nameProveedor }}
          <v-spacer></v-spacer>
          <v-btn
            icon
            color="default"
            @click="dialogNuevoPago = !dialogNuevoPago"
          >
            <v-icon>mdi-close</v-icon>
          </v-btn>
        </v-card-title>
        <v-card-text>
          <v-row>
            <v-col cols="3" v-if="!nuevaFechaFlag">
              <v-autocomplete
                :items="
                  $store.state.programaciones.listProgramacion.filter(
                    (v) => v.programend_id != 0,
                  )
                "
                item-text="programend_fecha"
                item-value="programend_id"
                v-model="programend_id"
              ></v-autocomplete>
            </v-col>

            <v-col cols="3" v-if="nuevaFechaFlag">
              <v-text-field
                type="date"
                v-model="fechaNuevaProgramacion"
              ></v-text-field
            ></v-col>
            <v-col cols="3">
              <v-spacer></v-spacer>
              <v-btn
                color="success"
                @click="enviarProgramacion()"
                :disabled="selected.length == 0"
                >Programar</v-btn
              >
            </v-col>
            <v-col cols="12">
              <v-data-table
                v-model="selected"
                :headers="headerProgramacion"
                :items="details"
                item-key="index"
                show-select
                class="elevation-0"
              >
              </v-data-table>
            </v-col>
          </v-row>
        </v-card-text>
      </v-card>
    </v-dialog>
    <v-navigation-drawer
      v-model="offcanvas"
      v-if="offcanvas"
      absolute
      bottom
      right
      width="20%"
    >
      <v-card>
        <v-card-title primary-title> FILTRO PAGOS </v-card-title>
        <v-card-text>
          <v-row>
            <v-col cols="12" class="py-0 my-0">
              <v-autocomplete
                clearable
                v-model="proveedorOp"
                label="Proveedores"
                :items="provedores"
                item-text="namelong"
                item-value="id"
                multiple
                chips
                outlined
                dense
              ></v-autocomplete
            ></v-col>
            <v-col cols="12" class="py-0 my-0">
              <v-text-field
                name="name"
                label="Nro Expediente"
                v-model="nro_expediente"
                clearable
                outlined
                dense
              ></v-text-field>
            </v-col>
            <v-col cols="12" class="py-0 my-0">
              <v-autocomplete
                clearable
                v-model="gasto"
                label="Gasto"
                :items="$store.state.gastos.list"
                item-text="description"
                item-value="id"
                multiple
                small-chips
                dense
                outlined
              ></v-autocomplete>
            </v-col>
            <v-col cols="12" class="py-0 my-0">
              <v-autocomplete
                clearable
                v-model="subgasto"
                label="Sub Gasto"
                :items="$store.state.subgasto.lstSubGasto"
                item-text="description"
                item-value="id"
                multiple
                small-chips
                dense
                outlined
              ></v-autocomplete>
            </v-col>
            <v-col cols="12" class="py-0 my-0">
              <v-text-field
                label="Fecha Hasta"
                type="date"
                v-model="fechaOp"
                clearable
                outlined
                dense
              ></v-text-field>
            </v-col>
            <v-col cols="12" class="py-0 my-0">
              <p class="py-0 my-0">Estado:</p>
              <v-radio-group dense v-model="llegadaOp" row class="py-0 my-0">
                <v-radio label="Llegada" value="1"></v-radio>

                <v-radio label="No llegada" value="0"></v-radio>
              </v-radio-group>
            </v-col>
          </v-row>
        </v-card-text>
      </v-card>

      <v-card>
        <v-card-actions>
          <v-btn color="success" medium @click="filtrar">Aceptar</v-btn>
          <v-btn color="error" medium @click="limpiar">Limpiar</v-btn>
          <v-btn color="info" medium @click="offcanvas = !offcanvas">
            Cancelar
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-navigation-drawer>
  </v-container>
</template>
<script>
import axios from "axios";
import { mapState, mapActions } from "vuex";
import exportFromJSON from "export-from-json";
import moment from "moment";
import Swal from "sweetalert2";
export default {
  name: "debstoPay",
  components: {
    newProgrammedPayment: () =>
      import("../ProgrammedPayment/newProgrammedPayment.vue"),
  },
  data: () => ({
    moneda: "",
    gasto: "",
    subgasto: "",
    nuevaFechaFlag: false,
    nameProveedor: "",
    proveedorOp: "",
    llegadaOp: "",
    fechaOp: "",
    id_master: "",
    id_proveedor: "",
    nro_expediente: "",
    filtroOp: {
      proveedorOp: "",
      llegadaOp: "",
      fechaOp: "",
    },
    proveedorAd: "",
    llegadaAd: "",
    fechaAd: "",
    filtroAd: {
      proveedorAd: "",
      llegadaAd: "",
      fechaAd: "",
    },
    dialogNuevoPago: false,
    overlay: false,
    tab: null,
    dataCpp: false,
    dataCppa: false,
    itemsCpp: [],
    itemsCppa: [],
    search: "",
    cabTotalOperativo: [
      {
        text: "Operativo",
        value: "moneda",
      },
      {
        text: "Llegados",
        value: "llegada",
      },
      {
        text: "No Llegado",
        value: "no_llegada",
      },
      {
        text: "Total",
        value: "total",
      },
    ],
    totalOperativo: [],
    cabTotalAdministrativo: [
      {
        text: "Administrativo",
        value: "moneda",
      },
      {
        text: "Nonto",
        value: "monto",
      },
      {
        text: "IGV",
        value: "igv",
      },
      {
        text: "Total",
        value: "total",
      },
    ],
    offcanvas: false,
    totalAdministrativo: [],
    expanded: [],
    expandeda: [],
    expand: [],
    expanda: [],

    date: ["", ""],

    value: 0,

    radio: 1,

    menu: false,
    modal: false,
    menu2: false,
    radiopdf: "",
    dialogPdf: false,
    exportando: false,
    exportandopdf: false,
    singleExpand: false,
    singleExpanda: false,
    dataList: false,
    details: [],
    fechaNuevaProgramacion: moment(new Date()).format("YYYY-MM-DD"),
    headersdbp: [
      {
        text: "PROVEEDOR OPERATIVO",
        align: "start",
        sortable: true,
        value: "nameproveedor",
        class: "hProveedor",
      },

      {
        text: "LLEGADAS",
        value: "restante_llegada",
        class: "hLlegada",
        sortable: false,
      },

      {
        text: "NO LLEGADAS",
        value: "restante_no_llegada",
        class: "hNoLlegada",
        sortable: false,
      },

      {
        text: "GENERAL",
        value: "restante_pagar",
        class: "hGeneral",
        sortable: false,
      },
      { text: "", value: "data-table-expand" },
    ],

    headersdbpa: [
      {
        text: "Proveedor",
        align: "start",
        sortable: false,
        value: "nameconsigner",
      },

      {
        text: "Pendiente por Pagar",
        value: "pendiente_pago",
      },

      { text: "", value: "data-table-expand" },
    ],
    headerProgramacion: [
      { text: "Expediente", value: "nro_master" },
      { text: "Consignatario", value: "nameconsigner" },
      { text: "Fecha Disponibilidad", value: "fecha_disponibilidad" },
      { text: "Moneda", value: "symbol" },
      { text: "Monto Pagar", value: "total_pagar" },
    ],
    id: "",
    tipo: "",
    selected: [],
    programend_id: null,
    otro: false,

    loadingBotonGuardarComentario: false,
    loadingDataTableComentarios: false,
    dialogComentarios: false,
    dialogNuevoComentario: false,
    headersLstComentarios: [
      { text: "Fecha", value: "fecha", width: "15%" },
      { text: "Ejecutivo", value: "ejecutivo", width: "30%" },
      { text: "Comentario", value: "comentario", width: "55%" },
    ],
    comentario: {
      fecha: moment().format("YYYY-MM-DD"),
      id_ejecutivo: JSON.parse(sessionStorage.getItem("dataUser"))
        ? JSON.parse(sessionStorage.getItem("dataUser"))[0].id
        : "",
      ejecutivo: JSON.parse(sessionStorage.getItem("dataUser"))
        ? JSON.parse(sessionStorage.getItem("dataUser"))[0].nombrecompleto
        : "",
      texto: "",
      esoperativo: false,
      esadministrativo: false,
    },
    dataCXP: {},
    lstComentarios: [],
  }),
  async mounted() {
    this.moneda = JSON.parse(
      sessionStorage.getItem("dataBranch"),
    )[0].moneda[0].acronym;
    this.offcanvas = false;
    this.$store.state.spiner = true;
    this.cabTotalAdministrativo[2].text =
      this.$store.state.enterprises.impuesto.nombre_impuesto;
    await Promise.all([
      this._getDebsToPay(),
      this._getDebsToPayAdmin(),
      this.getModulesEntities(),
      this.cargarProveedores(),
      this.cargarGasto(),
      this.obtenerImpuestoXEmpresa(),
      this.GetListSubGasto(),
    ]);

    this.$store.state.spiner = false;
    this.programend_id = (
      this.$store.state.programaciones.listProgramacion.filter(
        (v) => v.programend_select == true,
      )[0] || {}
    ).programend_id;
  },
  watch: {
    cerrar() {},
  },
  computed: {
    ...mapState(["provedores", "refreshReport", "listProgramacion"]),
    dateRange() {
      return this.date.join(" ~ ");
    },
  },
  methods: {
    ...mapActions([
      "cargarProveedores",
      "GetTotalCotizacion",
      "getModulesEntities",
      "obtenerImpuestoXEmpresa",
      "cargarGasto",
      "GetListSubGasto",
    ]),
    nuevaFecha({ item = null, tipo = null }) {
      this.$swal({
        icon: "question",
        title:
          "¿Deseas agregar el pago a una programación que ya existe o crear una nueva?",
        confirmButtonText: "Agregar a una programación que ya existe",
        denyButtonText: `Crear una Programación Nueva`,
        showDenyButton: true,
        showCancelButton: true,
      }).then((result) => {
        if (result.isConfirmed) {
          this.programar({ item, tipo });
          this.nuevaFechaFlag = false;
        }
        if (result.isDenied) {
          this.programend_id = 0;
          this.nuevaFechaFlag = true;
          this.programar({ item, tipo });
        }
      });
      // enviarProgramacion
    },
    viewPDF() {
      this.dialogPdf = true;
    },
    _cleanFilter() {
      (this.date = ["", ""]), (this.radio = "");
    },
    editControl(control) {
      window.open(
        `/home/folderBilling/editControlGastos/view/${control.id}/${control.id_branch}`,
        "Instructivo",
        "width=1593,height=1293",
        "menubar=no",
        "location=no",
        "resizable=no",
      );
    },
    sumField(key) {
      return this.itemsCpp.reduce((a, b) => a + parseFloat(b[key] || 0), 0);
    },

    sumFieldA(key) {
      return this.itemsCppa.reduce((a, b) => a + parseFloat(b[key] || 0), 0);
    },

    clickRow(item, event) {
      if (event.isExpanded) {
        const index = this.expanded.findIndex((i) => i === item);
        this.expanded.splice(index, 1);
      } else {
        this.expanded.push(item);
      }
    },
    clickRowa(item, event) {
      if (event.isExpandeda) {
        const index = this.expandeda.findIndex((i) => i === item);
        this.expandeda.splice(index, 1);
      } else {
        this.expandeda.push(item);
      }
    },
    async _exportPdf() {
      var vm = this;
      vm.$swal({
        icon: "info",
        title: "Generando PDF",
        text: "Espere... ",
      });

      let statusLetra;
      if (vm.radio == "") {
        statusLetra = "Todos";
      } else if (vm.radio == 1) {
        statusLetra = "Vencidas";
      } else if (vm.radio == 0) {
        statusLetra = "No Vencidas";
      }

      var data = {
        itemsCpp: vm.itemsCpp,
        total_pagar: Intl.NumberFormat().format(
          vm.sumField("total_pagar").toFixed(2),
        ),
        total_pagado: Intl.NumberFormat().format(
          vm.sumField("total_pagado").toFixed(2),
        ),
        total_restante: Intl.NumberFormat().format(
          vm.sumField("restante_pagar").toFixed(2),
        ),
        total_pagar_llegada: Intl.NumberFormat().format(
          vm.sumField("total_pagar_llegada").toFixed(2),
        ),
        total_pagado_llegada: Intl.NumberFormat().format(
          vm.sumField("total_pagado_llegada").toFixed(2),
        ),
        total_restante_llegada: Intl.NumberFormat().format(
          vm.sumField("restante_llegada").toFixed(2),
        ),
        total_pagar_no_llegada: Intl.NumberFormat().format(
          vm.sumField("total_pagar_no_llegada").toFixed(2),
        ),
        total_pagado_no_llegada: Intl.NumberFormat().format(
          vm.sumField("total_pagado_no_llegado").toFixed(2),
        ),
        total_restante_no_llegada: Intl.NumberFormat().format(
          vm.sumField("restante_pagar_no_llegada").toFixed(2),
        ),
        fecha: new Date(Date.now() - new Date().getTimezoneOffset() * 60000)
          .toISOString()
          .substr(0, 10),
        dateRange: vm.dateRange,
        status: statusLetra,
        totalOperativo: vm.totalOperativo,
        totalAdministrativo: vm.totalAdministrativo,
      };

      let urlLong;
      if (vm.radiopdf == 1) {
        urlLong = "pdfcxp";
      } else if (vm.radiopdf == 2) {
        urlLong = "pdfcxpD";
      }
      var config = {
        method: "post",
        url: process.env.VUE_APP_URL_MAIN + urlLong,

        headers: {
          "auth-token": sessionStorage.getItem("auth-token"),
          "Content-Type": "application/json",
        },
        data: data,
      };
      await axios(config)
        .then(function (response) {
          vm.$swal({
            icon: "success",
            title: "PDF Generado",
            text: "El PDF se descargará automaticamente",
          });

          vm.dialogPdf = false;
          window.open(
            process.env.VUE_APP_URL_MAIN + response.data.path,
            "_blank",
          );
        })
        .catch(function (error) {
          console.log(error);
        });
    },

    async _getDebsToPay() {
      var vm = this;
      vm.overlay = true;
      vm.itemsCpp = [];
      setInterval(() => {
        vm.value = vm.value + 3;
      }, 1000);
      vm.dataList = false;
      var config = {
        method: "get",
        url:
          process.env.VUE_APP_URL_MAIN +
          `getReporteCXP?id_branch=${
            JSON.parse(sessionStorage.getItem("dataUser"))[0].id_branch
          }&id_proveedor=${this.proveedorOp ? this.proveedorOp : ""}&llegada=${
            this.llegadaOp ? this.llegadaOp : ""
          }&desde=&hasta=${this.fechaOp ? this.fechaOp : ""}&nro_expediente=${
            this.nro_expediente
          }`,

        headers: {
          "auth-token": sessionStorage.getItem("auth-token"),
          "Content-Type": "application/json",
        },
      };
      await axios(config)
        .then(function (response) {
          vm.itemsCpp = response.data.data;
          vm.dataList = true;
          vm.calcularTotalOperativo({ data: response.data.data });
        })
        .catch(function (error) {
          console.log(error);
        });
      vm.overlay = false;
    },

    async _getDebsToPayAdmin() {
      var vm = this;
      vm.overlay = true;
      var config = {
        method: "get",
        url:
          process.env.VUE_APP_URL_MAIN +
          `getDebsToPayAdmin?id_branch=${
            JSON.parse(sessionStorage.getItem("dataUser"))[0].id_branch
          }&id_proveedor=${this.proveedorOp ? this.proveedorOp : ""}&llegada=${
            this.llegadaOp ? this.llegadaOp : ""
          }&desde=&hasta=${this.fechaOp ? this.fechaOp : ""}&nro_expediente=${
            this.nro_expediente
          }&id_gasto=${this.gasto ? this.gasto : ""}&id_subgasto=${
            this.subgasto ? this.subgasto : ""
          }`,
        headers: {
          "auth-token": sessionStorage.getItem("auth-token"),
          "Content-Type": "application/json",
        },
      };
      await axios(config)
        .then(function (response) {
          vm.itemsCppa = response.data.data;
          vm.$store.state.drawer = false;
          setTimeout(() => {
            vm.calcularTotalAdministrativo({ data: response.data.data });
          }, 100);
        })
        .catch(function (error) {
          console.log(error);
        });
      vm.overlay = false;
      vm.offcanvas = false;
    },

    async _getDebsToPayFilter() {
      var vm = this;
      vm.dataList = false;

      var data = {
        date_begin: vm.date[0],
        date_end: vm.date[1],
      };
      var config = {
        method: "post",
        url: process.env.VUE_APP_URL_MAIN + "getDebsToPayFilter",

        headers: {
          "auth-token": sessionStorage.getItem("auth-token"),
          "Content-Type": "application/json",
        },
        data: data,
      };
      await axios(config)
        .then(function (response) {
          vm.itemsCpp = response.data.data;
          vm.dataList = true;
          vm.$store.state.drawer = false;
        })
        .catch(function (error) {
          console.log(error);
        });
    },

    calcularTotalOperativo({ data }) {
      this.totalOperativo = [];
      let totalNoLlegadaDolares = 0;
      let totalLlegadaDolares = 0;
      let totalDolares = 0;

      let totalLlegadaSoles = 0;
      let totalNoLlegadaSoles = 0;
      let totalSoles = 0;
      if (data) {
        data.forEach((element) => {
          element.details.forEach((element2) => {
            if (element2.symbol == "USD") {
              if (element2.llegada == 0) {
                totalNoLlegadaDolares += parseFloat(element2.total_pagar);
                totalDolares += parseFloat(element2.total_pagar);
              }
              if (element2.llegada == 1) {
                totalLlegadaDolares += parseFloat(element2.total_pagar);
                totalDolares += parseFloat(element2.total_pagar);
              }
            } else {
              if (element2.llegada == 0) {
                totalNoLlegadaSoles += parseFloat(element2.total_pagar);
                totalSoles += parseFloat(element2.total_pagar);
              }
              if (element2.llegada == 1) {
                totalLlegadaSoles += parseFloat(element2.total_pagar);
                totalSoles += parseFloat(element2.total_pagar);
              }
            }
          });
        });
      }
      this.totalOperativo.push(
        {
          moneda: "USD",
          llegada: parseFloat(totalLlegadaDolares).toFixed(2),
          no_llegada: parseFloat(totalNoLlegadaDolares).toFixed(2),
          total: parseFloat(totalDolares).toFixed(2),
        },
        {
          moneda: this.moneda,
          llegada: parseFloat(totalLlegadaSoles).toFixed(2),
          no_llegada: parseFloat(totalNoLlegadaSoles).toFixed(2),
          total: parseFloat(totalSoles).toFixed(2),
        },
      );
    },

    calcularTotalAdministrativo({ data }) {
      this.totalAdministrativo = [];
      let totalMontoDolares = 0;
      let IgvDolares = 0;
      let totalDolares = 0;

      let totalMontoSoles = 0;
      let IgvSoles = 0;
      let totalSoles = 0;
      if (data) {
        data.forEach((element) => {
          element.details.forEach((element2) => {
            if (element2.symbol == "USD") {
              totalMontoDolares += parseFloat(element2.monto);
              IgvDolares += parseFloat(element2.igv);
              totalDolares += parseFloat(element2.total);
            } else {
              totalMontoSoles += parseFloat(element2.monto);
              IgvSoles += parseFloat(element2.igv);
              totalSoles += parseFloat(element2.total);
            }
          });
        });
      }
      this.totalAdministrativo.push(
        {
          moneda: "USD",
          monto: parseFloat(totalMontoDolares).toFixed(2),
          igv: parseFloat(IgvDolares).toFixed(2),
          total: parseFloat(totalDolares).toFixed(2),
        },
        {
          moneda: this.moneda,
          monto: parseFloat(totalMontoSoles).toFixed(2),
          igv: parseFloat(IgvSoles).toFixed(2),
          total: parseFloat(totalSoles).toFixed(2),
        },
      );
      this.$store.state.spiner = false;
    },
    programar({ item = null, tipo = 1 }) {
      this.selected = [];
      this.tipo = tipo;
      let index = 0;
      switch (tipo) {
        case 1:
          this.headerProgramacion = [
            { text: "Expediente", value: "nro_master" },
            { text: "Consignatario", value: "nameconsigner" },
            { text: "Fecha Disponibilidad", value: "fecha_disponibilidad" },
            { text: "Moneda", value: "symbol" },
            { text: "Monto Pagar", value: "total_pagar" },
          ];
          this.nameProveedor = item.nameproveedor;
          this.details = item.details.filter((v) => v.programado == 0);

          this.details.forEach((element) => {
            element.index = index;
            index++;
          });
          break;
        case 2:
          this.headerProgramacion = [
            { text: "Consignatario", value: "nameconsigner" },
            { text: "Fecha Registro", value: "fecha" },
            { text: "Moneda", value: "symbol" },
            { text: "Monto Pagar", value: "monto" },
          ];
          this.nameProveedor = item.nameconsigner;
          this.details = item.details.filter((v) => v.programado == 1);
          this.details.forEach((element) => {
            element.index = index;
            index++;
          });
        default:
          break;
      }
      this.dialogNuevoPago = true;
    },
    async enviarProgramacion() {
      var vm = this;
      let data = {
        id: vm.programend_id,
        tipo: vm.tipo,
        fecha: vm.fechaNuevaProgramacion,
        details: vm.selected,
        id_branch: JSON.parse(sessionStorage.getItem("dataUser"))[0].id_branch,
      };
      var config = {
        method: "post",
        url: process.env.VUE_APP_URL_MAIN + "setProgrammedPayment",
        headers: {
          "auth-token": sessionStorage.getItem("auth-token"),
          "Content-Type": "application/json",
        },
        data: data,
      };
      await axios(config)
        .then(function (response) {
          vm.$swal({
            icon: "info",
            title: "Aviso",
            text: response.data.mensaje,
          }).then((result) => {
            if (result.isConfirmed) {
              vm.limpiar();
              vm.dialogNuevoPago = false;
            }
          });
        })
        .catch(function (error) {
          console.log(error);
        });
    },
    async filtrar() {
      this.$store.state.spiner = true;
      await this._getDebsToPay();
      await this._getDebsToPayAdmin();
      this.$store.state.spiner = false;
      this.offcanvas = false;
    },
    async limpiar() {
      this.$store.state.spiner = true;
      this.proveedorOp = "";
      this.llegadaOp = "";
      this.fechaOp = "";
      this.nro_expediente = "";
      await this._getDebsToPay();
      await this._getDebsToPayAdmin();
      this.$store.state.spiner = false;
      this.offcanvas = false;
    },
    async exportar() {
      let vm = this;
      vm.exportando = true;
      var config = {
        method: "get",
        url:
          process.env.VUE_APP_URL_MAIN +
          `reportcxpexcel?id_branch=${
            JSON.parse(sessionStorage.getItem("dataUser"))[0].id_branch
          }&id_proveedor=${this.proveedorOp ? this.proveedorOp : ""}&llegada=${
            this.llegadaOp ? this.llegadaOp : ""
          }&desde=&hasta=${this.fechaOp ? this.fechaOp : ""}&nro_expediente=${
            this.nro_expediente
          }&nombre_impuesto=${
            this.$store.state.enterprises.impuesto.nombre_impuesto
          }&moneda=${this.moneda}&id_gasto=${
            this.gasto ? this.gasto : ""
          }&id_subgasto=${this.subgasto ? this.subgasto : ""}`,

        responseType: "blob",
        headers: {
          "auth-token": sessionStorage.getItem("auth-token"),
          "Content-Type": "blob",
        },
      };
      await axios(config)
        .then(function (response) {
          const url = window.URL.createObjectURL(new Blob([response.data]));
          const link = document.createElement("a");
          link.href = url;
          link.setAttribute("download", `Reporte CxP - ${Date.now()}.xlsx`);
          document.body.appendChild(link);
          link.click();
        })
        .catch(function (error) {
          console.log(error);
        });
      vm.exportando = false;
      // exportar_listado_reporte_pagos
    },
    async exportarPDF() {
      Swal.fire({
        icon: "question",
        title: "¿Cómo deseas generar el PDF del reporte?",
        text: "Elige cómo deseas generar el PDF del reporte de cuentas por pagar:",
        showConfirmButton: true,
        confirmButtonText: "Generar",
        showDenyButton: true,
        denyButtonText: "Cancelar",
        allowOutsideClick: false,
        input: "radio",
        inputOptions: {
          1: "Generar PDF por Fecha de Vencimiento",
          2: "Generar PDF por Proveedor",
        },
        inputValidator: (value) => {
          if (!value) {
            return "Debe seleccionar una opción";
          }
        },
      }).then(async (res) => {
        if (res.isConfirmed) {
          let tipoReportePDF = res.value;

          let vm = this;
          vm.exportandopdf = true;

          var config = {
            method: "get",
            url:
              process.env.VUE_APP_URL_MAIN +
              `exportarPDFCXP?id_branch=${
                JSON.parse(sessionStorage.getItem("dataUser"))[0].id_branch
              }&id_proveedor=${
                this.proveedorOp ? this.proveedorOp : ""
              }&llegada=${this.llegadaOp ? this.llegadaOp : ""}&desde=&hasta=${
                this.fechaOp ? this.fechaOp : ""
              }&nro_expediente=${this.nro_expediente}&tipo_reporte=${
                tipoReportePDF ? tipoReportePDF : ""
              }&nombre_impuesto=${
                this.$store.state.enterprises.impuesto.nombre_impuesto
              }&id_gasto=${this.gasto ? this.gasto : ""}&id_subgasto=${
                this.subgasto ? this.subgasto : ""
              }`,
            responseType: "blob",
            headers: {
              "auth-token": sessionStorage.getItem("auth-token"),
              "Content-Type": "blob",
            },
          };

          await axios(config)
            .then(function (response) {
              // console.log(response)

              const url = window.URL.createObjectURL(new Blob([response.data]));
              const link = document.createElement("a");
              link.href = url;
              link.setAttribute("download", `Reporte CxP - ${Date.now()}.pdf`);
              document.body.appendChild(link);
              link.click();
            })
            .catch(function (error) {
              console.log(error);
            });

          vm.exportandopdf = false;
        }
      });
    },
    async mostrarComentariosOp(data = {}) {
      var vm = this;

      vm.dataCXP = {
        ...data,
        proveedor: data.nameproveedor ? data.nameproveedor : "",
        esoperativo: true,
        esadministrativo: false,
      };
      vm.dialogComentarios = !this.dialogComentarios;

      await vm.getComentarios();
    },
    agregarComentarioOp() {
      var vm = this;

      vm.comentario = {
        ...vm.comentario,
        id_proveedor: vm.dataCXP.id ? vm.dataCXP.id : null,
        esoperativo: true,
        esadministrativo: false,
      };

      vm.dialogNuevoComentario = !vm.dialogNuevoComentario;
    },
    async mostrarComentariosAdmin(data = {}) {
      var vm = this;

      vm.dataCXP = {
        ...data,
        id: data.id_proveedor ? data.id_proveedor : null,
        proveedor: data.nameconsigner ? data.nameconsigner : "",
        esoperativo: false,
        esadministrativo: true,
      };
      vm.dialogComentarios = !this.dialogComentarios;

      await vm.getComentarios();
    },
    agregarComentarioAdmin() {
      var vm = this;

      vm.comentario = {
        ...vm.comentario,
        id_proveedor: vm.dataCXP.id ? vm.dataCXP.id : null,
        esoperativo: false,
        esadministrativo: true,
      };

      vm.dialogNuevoComentario = !vm.dialogNuevoComentario;
    },
    async getComentarios() {
      var vm = this;

      vm.lstComentarios = [];
      vm.loadingDataTableComentarios = true;

      var config = {
        method: "get",
        url:
          process.env.VUE_APP_URL_MAIN +
          `listarComentariosCXP?id_proveedor=${vm.dataCXP.id}`,
        headers: {
          "auth-token": sessionStorage.getItem("auth-token"),
          "Content-Type": "application/json",
        },
      };

      await axios(config).then(function (response) {
        sessionStorage.setItem("auth-token", response.data.token);

        if (response.data.status == "401") {
          Swal.fire({
            icon: "error",
            text: response.data.mensaje,
            allowOutsideClick: false,
            allowEscapeKey: false,
            allowEnterKey: false,
          }).then((resSwal) => {
            if (resSwal.isConfirmed) {
              router.push({ name: "Login" });
              setTimeout(() => {
                window.location.reload();
              }, 10);
            }
          });
        } else {
          if (response.data.estadoflag) {
            const comentarios = response.data.data;

            if (vm.dataCXP.esoperativo) {
              vm.lstComentarios = comentarios.filter((v) => !!v.esoperativo);
            } else if (vm.dataCXP.esadministrativo) {
              vm.lstComentarios = comentarios.filter(
                (v) => !!v.esadministrativo,
              );
            }
          } else {
            vm.lstComentarios = [];
          }
        }
      });

      vm.loadingDataTableComentarios = false;
    },
    async guardarComentario() {
      var vm = this;
      if (vm.$refs.frmComentario.validate()) {
        vm.loadingBotonGuardarComentario = true;

        var config = {
          method: "post",
          url: process.env.VUE_APP_URL_MAIN + `insertarComentarioCXP`,
          headers: {
            "auth-token": sessionStorage.getItem("auth-token"),
            "Content-Type": "application/json",
          },
          data: vm.comentario,
        };

        await axios(config).then(async function (response) {
          sessionStorage.setItem("auth-token", response.data.token);

          if (response.data.estadoflag) {
            Swal.fire({
              icon: "success",
              text: response.data.mensaje,
            });

            await vm.getComentarios();
          } else {
            Swal.fire({
              icon: "error",
              text: response.data.mensaje,
              allowOutsideClick: false,
              allowEscapeKey: false,
              allowEnterKey: false,
            }).then((resSwal) => {
              if (resSwal.isConfirmed && response.data.status == "401") {
                router.push({ name: "Login" });
                setTimeout(() => {
                  window.location.reload();
                }, 10);
              }
            });
          }
        });

        vm.loadingBotonGuardarComentario = false;
        vm.dialogNuevoComentario = !vm.dialogNuevoComentario;

        vm.comentario.texto = "";
      }
    },

    // async limpiar() {
    //   this.$store.state.spiner = true;
    //   this.tipo == 1
    //     ? await this._getDebsToPay()
    //     : await this._getDebsToPayAdmin();
    //   this.$store.state.spiner = false;
    // },
  },
};
</script>

<style lang="scss">
.v-data-table
  > .v-data-table__wrapper
  tbody
  tr.v-data-table__expanded__content {
  box-shadow: none !important;
}

.v-data-table > .v-data-table__wrapper tbody tr.v-data-table__expanded {
  background: #ffccab;
}

.hProveedor {
  font-size: 18px;
  text-align: center;
  font: bold;
  background: #a8aee5;
}
.hNoLlegada {
  font-size: 18px;
  text-align: center;
  font: bold;
  background: #c3fbef;
}
.hLlegada {
  font-size: 18px;
  text-align: center;
  font: bold;
  background: #fbc3c3;
}
.hGeneral {
  font-size: 18px;
  text-align: center;
  font: bold;
  background: #e9e9e9;
}
</style>
