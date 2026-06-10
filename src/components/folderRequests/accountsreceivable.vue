<template>
  <div>
    <v-card elevation="0">
      <v-card-title>
        <h3>REPORTE DE CUENTAS POR COBRAR</h3>
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
          @click="descargarArchivos()"
          :loading="exportando"
          small
          plain
        >
          <v-icon>mdi-file-excel</v-icon>
          EXCEL</v-btn
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
          :headers="headersdbp"
          :items="itemsCpp"
          :search="search"
          :expanded.sync="expanded"
          :single-expand="singleExpand"
          item-key="id_consigner"
          show-expand
          @click:row="clickRow"
        >
          <template v-slot:[`item.nameconsigner`]="{ item }">
            <div class="d-flex">
              <div>{{ item.nameconsigner }}</div>
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
                    <th>Cliente</th>
                    <th>Fecha Disponibilidad</th>
                    <th>Total a Cobrar</th>
                    <th>Status</th>
                    <th>Fecha de Vencimiento</th>
                    <th>Días de atraso</th>
                    <th>Estatus</th>
                  </tr>
                </thead>
                <tbody>
                  <tr
                    style="background: #fff1cf"
                    v-for="child of item.details"
                    :key="child.id"
                  >
                    <td>
                      {{ child.nro_master }}
                      <v-icon
                        v-if="child.operativa == 1"
                        @click="editControl(child)"
                        >mdi-eye</v-icon
                      >
                    </td>
                    <td>
                      {{ child.nameconsigner }}
                    </td>
                    <td>
                      {{ child.fecha_disponibilidad }}
                    </td>
                    <td>{{ child.symbol }} {{ child.total_pagar }}</td>

                    <td>
                      {{ child.llegada == 1 ? "LLEGADA" : "NO LLEGADA" }}
                    </td>
                    <td>{{ child.fechadevencimiento }}</td>
                    <td>{{ child.diasatraso }}</td>
                    <td>{{ child.estatus }}</td>
                  </tr>
                </tbody>
              </v-simple-table>
            </td>
          </template>
        </v-data-table>
      </v-card-text>
      <v-card-text>
        <h3>REPORTE DE CUENTAS POR COBRAR ADMINISTRATIVAS</h3>

        <v-data-table
          :headers="headersdbpa"
          :items="itemsCxcAdmin"
          :search="search"
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
                    <!-- <th>Acción</th> -->
                    <!-- <th>Factura</th> -->
                    <th>Cliente</th>
                    <th>Documento</th>
                    <th>Monto Inicial</th>

                    <th>Deuda Actual</th>
                  </tr>
                </thead>
                <tbody>
                  <tr
                    style="background: #fff1cf"
                    v-for="child of item.details"
                    :key="child.id"
                  >
                    <!-- <td>
                      <v-icon
                        @click="
                          programar({
                            id: child.id,
                            tipo: 0,
                          })
                        "
                        >mdi-clock-outline</v-icon
                      >
                    </td> -->
                    <td>{{ child.nameconsigner }}</td>
                    <td>{{ child.concepto }}</td>
                    <td>{{ child.symbol }} {{ child.monto }}</td>

                    <td>{{ child.symbol }} {{ child.total_pagar }}</td>
                  </tr>
                </tbody>
              </v-simple-table>
            </td>
          </template>
        </v-data-table>
      </v-card-text>
    </v-card>

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
            >EXPORTAR</v-btn
          >
          <v-spacer></v-spacer>
          <v-btn color="red" @click="dialogPdf = false" outlined>Cerrar</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!--COMENTARIOS-->
    <v-dialog v-model="dialogComentarios" persistent width="70%">
      <v-card>
        <v-card-title>
          Estados/Comentarios de la CxC - {{ dataCXC.nameconsigner }}
          <v-spacer></v-spacer>
          <template v-if="dataCXC.esoperativo">
            <v-btn rounded small color="primary" @click="agregarComentarioOp"
              >Nuevo Comentario</v-btn
            >
          </template>
          <template v-else-if="dataCXC.esadministrativo">
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
          Registro de Estado/Comentario de la CxC - {{ dataCXC.nameconsigner }}
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

    <v-navigation-drawer
      v-model="offcanvas"
      v-if="offcanvas"
      absolute
      bottom
      right
      width="20%"
    >
      <v-card elevation="0">
        <h1 class="mx-2 mt-2">FILTRO PAGOS</h1>
        <v-card-text>
          <v-row>
            <v-col cols="12" class="py-0 my-0">
              <v-autocomplete
                clearable
                v-model="proveedorOp"
                label="Clientes"
                :items="clientes"
                item-text="namelong"
                item-value="id"
                multiple
                small-chips
                dense
                outlined
              ></v-autocomplete>
            </v-col>
            <v-col cols="12" class="py-0 my-0">
              <v-text-field
                name="name"
                label="Nro Expediente"
                v-model="nro_expediente"
                clearable
                dense
                outlined
              ></v-text-field>
            </v-col>
            <v-col cols="12" class="py-0 my-0">
              <v-autocomplete
                clearable
                v-model="ingreso"
                label="Ingresos"
                :items="$store.state.ingresos.list"
                item-text="descripcion"
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
                v-model="subingreso"
                label="Sub Ingresos"
                :items="$store.state.subingreso.lstSubIngreso"
                item-text="description"
                item-value="id"
                multiple
                small-chips
                dense
                outlined
              ></v-autocomplete>
            </v-col>
            <v-col cols="12">
              <v-text-field
                label="Fecha Hasta"
                type="date"
                v-model="fechaOp"
                clearable
                outlined
              ></v-text-field
            ></v-col>
            <v-col cols="12" class="py-0 my-0">
              <p>Estado:</p>
              <v-radio-group
                v-model="llegadaOp"
                dense
                row
                outlined
                class="py-0 my-0"
              >
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
  </div>
</template>
<script>
import axios from '@/api/axios-config';
import moment from "moment";
import { mapActions, mapState } from "vuex";
import Swal from "sweetalert2";
export default {
  name: "accountsreceivable",
  data: () => ({
    moneda: "",
    offcanvas: false,
    proveedorOp: "",
    llegadaOp: "",
    fechaOp: "",
    exportandopdf: false,
    nro_expediente: "",
    ingreso: "",
    subingreso: "",
    filtroOp: {
      proveedorOp: "",
      llegadaOp: "",
      fechaOp: "",
    },
    filtroAd: {
      proveedorAd: "",
      llegadaAd: "",
      fechaAd: "",
    },
    tab: null,
    dataCpp: false,
    itemsCpp: [],
    search: "",

    expanded: [],
    expand: [],
    expandeda: [],

    expanda: [],
    date: ["", ""],

    radio: 1,
    value: 0,
    exportando: false,
    menu: false,
    modal: false,
    menu2: false,
    radiopdf: "",
    dialogPdf: false,
    singleExpand: false,
    singleExpanda: false,
    dataList: false,
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
    totalAdministrativo: [],
    headersdbp: [
      {
        text: "Cliente",
        align: "start",
        sortable: true,
        value: "nameconsigner",
        class: "hProveedor",
      },

      {
        text: "LLEGADA",
        value: "total_llegada",
        class: "hLlegada",
        sortable: false,
      },
      {
        text: "NO LLLEGADAS",
        value: "total_no_llegada",
        class: "hNoLlegada",
        sortable: false,
      },
      {
        text: "GENERAL",
        value: "total_pagar_llegada",
        class: "hGeneral",
        sortable: false,
      },

      { text: "", value: "data-table-expand" },
    ],
    headersdbpa: [
      {
        text: "Cliente",
        value: "nameconsigner",
      },

      {
        text: "Total",
        value: "total_pagar",
      },
    ],
    itemsCxcAdmin: [],

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
    dataCXC: {},
    lstComentarios: [],
  }),
  async mounted() {
    this.moneda = JSON.parse(
      sessionStorage.getItem("dataBranch")
    )[0].moneda[0].acronym;
    // console.log(moneda);
    await this.getModulesEntities();
    await this._getDebsToPay();
    await this._getInvoiceAdminCxCAdmin();
    await this.obtenerImpuestoXEmpresa();
    this.$store.state.drawer = false;
    await this.cargarClientes();
    await this.cargarIngreso();
    await this.GetListSubIngreso();
  },
  computed: {
    ...mapState(["clientes"]),

    dateRange() {
      return this.date.join(" ~ ");
    },
  },
  methods: {
    ...mapActions([
      "cargarClientes",
      "getModulesEntities",
      "obtenerImpuestoXEmpresa",
      "cargarIngreso",
      "GetListSubIngreso",
    ]),
    viewPDF() {
      this.dialogPdf = true;
    },
    _cleanFilter() {
      (this.date = ["", ""]), (this.radio = "");
    },
    editControl(control) {
      
      window.open(
        `/home/folderBilling/editControlGastos/view/${control.id_control}/${control.id_branch}`,
        "Instructivo",
        "width=1593,height=1293",
        "menubar=no",
        "location=no",
        "resizable=no"
      );
    },
    sumField(key) {
      // sum data in give key (property)

      return this.itemsCpp.reduce((a, b) => a + parseFloat(b[key] || 0), 0);
    },
    clickRow(item, event) {
      if (event.isExpanded) {
        const index = this.expanded.findIndex((i) => i === item);
        this.expanded.splice(index, 1);
      } else {
        this.expanded.push(item);
      }
    },
    async exportarPDF() {
      Swal.fire({
        icon: "question",
        title: "¿Cómo deseas generar el PDF del reporte?",
        text: "Elige cómo deseas generar el PDF del reporte de cuentas por cobrar:",
        showConfirmButton: true,
        confirmButtonText: "Generar",
        showDenyButton: true,
        denyButtonText: "Cancelar",
        allowOutsideClick: false,
        input: "radio",
        inputOptions: {
          1: "Generar PDF por Fecha de Vencimiento",
          2: "Generar PDF por Cliente",
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
              `exportarPDFCXC?id_branch=${
                JSON.parse(sessionStorage.getItem("dataUser"))[0].id_branch
              }&id_proveedor=${
                this.proveedorOp ? this.proveedorOp : ""
              }&llegada=${this.llegadaOp ? this.llegadaOp : ""}&desde=&hasta=${
                this.fechaOp ? this.fechaOp : ""
              }&nro_expediente=${
                this.nro_expediente ? this.nro_expediente : ""
              }&tipo_reporte=${
                tipoReportePDF ? tipoReportePDF : ""
              }&id_ingreso=${this.ingreso ? this.ingreso : ""}&id_subingreso=${
                this.subingreso ? this.subingreso : ""
              }`,
            responseType: "blob",
            headers: {
             
              "Content-Type": "blob",
            },
          };

          await axios(config)
            .then(function (response) {
              

              const url = window.URL.createObjectURL(new Blob([response.data]));
              const link = document.createElement("a");
              link.href = url;
              link.setAttribute("download", `Reporte CxC - ${Date.now()}.pdf`);
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
    async _getDebsToPay() {
      this.$store.state.spiner = true;
      var vm = this;
      vm.dataList = false;
      var config = {
        method: "get",
        url:
          process.env.VUE_APP_URL_MAIN +
          `getReporteCXC?id_branch=${
            JSON.parse(sessionStorage.getItem("dataUser"))[0].id_branch
          }&id_cliente=${
            vm.filtroOp.proveedorOp ? vm.filtroOp.proveedorOp : ""
          }&llegadaflag=${
            vm.filtroOp.llegadaOp ? vm.filtroOp.llegadaOp : ""
          }&fechahasta=${
            vm.filtroOp.fechaOp ? vm.filtroOp.fechaOp : ""
          }&nro_expediente=${this.nro_expediente}`,
        headers: {
         
          "Content-Type": "application/json",
        },
      };
      await axios(config)
        .then(function (response) {
          vm.itemsCpp = response.data.data ? response.data.data : [];
          vm.dataList = true;
          vm.calcularTotalOperativo({
            data: response.data.data ? response.data.data : [],
          });
        })
        .catch(function (error) {
          console.log(error);
        });
      vm.$store.state.spiner = false;
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
        url: process.env.VUE_APP_URL_MAIN + "getReportAccountsFilter",

        headers: {
         
          "Content-Type": "application/json",
        },
        data: data,
      };
      await axios(config)
        .then(function (response) {
          vm.itemsCpp = response.data.data;
          vm.dataList = true;
          //
        })
        .catch(function (error) {
          console.log(error);
        });
    },
    async _getInvoiceAdminCxCAdmin() {
      var vm = this;
      vm.$store.state.spiner = true;
      var config = {
        method: "get",
        url:
          process.env.VUE_APP_URL_MAIN +
          `getReporteCXCAdmin?id_branch=${
            JSON.parse(sessionStorage.getItem("dataUser"))[0].id_branch
          }&id_cliente=${
            vm.filtroOp.proveedorOp ? vm.filtroOp.proveedorOp : ""
          }&llegadaflag=${
            vm.filtroOp.llegadaOp ? vm.filtroOp.llegadaOp : ""
          }&fechahasta=${
            vm.filtroOp.fechaOp ? vm.filtroOp.fechaOp : ""
          }&nro_expediente=${this.nro_expediente}&id_ingreso=${
            this.ingreso ? this.ingreso : ""
          }&id_subingreso=${this.subingreso ? this.subingreso : ""}`,

        headers: {
         
          "Content-Type": "application/json",
        },
      };
      await axios(config)
        .then(function (response) {
          //vm.dialogListInvoince = true;

          vm.itemsCxcAdmin = response.data.data;
          setTimeout(() => {
            vm.calcularTotalAdministrativo({ data: response.data.data });
          }, 100);
        })
        .catch(function (error) {
          console.log(error);
        });
      vm.$store.state.spiner = false;
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
        }
      );
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
    async filtrar() {
      this.filtroOp.proveedorOp = this.proveedorOp;
      this.filtroOp.llegadaOp = this.llegadaOp;
      this.filtroOp.fechaOp = this.fechaOp;
      this.filtroAd.proveedorAd = this.proveedorAd;
      await this._getDebsToPay();
      await this._getInvoiceAdminCxCAdmin();
      this.offcanvas = false;
    },
    async limpiar() {
      this.filtroOp = {
        proveedorOp: "",
        llegadaOp: "",
        fechaOp: "",
      };
      await this._getDebsToPay();
      await this._getInvoiceAdminCxCAdmin();
      this.proveedorOp = "";
      this.llegadaOp = "";
      this.fechaOp = "";
      this.offcanvas = false;
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
              totalMontoDolares += parseFloat(element2.total_pagar);
              IgvDolares += parseFloat(element2.igv);
              totalDolares +=
                parseFloat(element2.total_pagar) + parseFloat(element2.igv);
            } else {
              totalMontoSoles += parseFloat(element2.total_pagar);
              IgvSoles += parseFloat(element2.igv);
              totalSoles +=
                parseFloat(element2.total_pagar) + parseFloat(element2.igv);
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
        }
      );
      this.$store.state.spiner = false;
    },
    async descargarArchivos() {
      let vm = this;

      if (
        vm.filtroOp.proveedorOp.length > 0 &&
        vm.filtroOp.proveedorOp.length <= 5
      ) {
        Swal.fire({
          icon: "question",
          title: "Factura",
          text: "¿Desea también descargar, las facturas asociadas a estos clientes",
          confirmButtonText: "Descargar Facturas",
          showDenyButton: true,
          denyButtonText: "No descargar Factura",
          showCancelButton: false,
          cancelButtonText: "Cerrar",
        }).then(async (res) => {
          if (res.isConfirmed) {
            await this.download();
            await this.exportar();
          }
          if (res.isDenied) {
            await this.exportar();
          }
        });
      } else {
        await this.exportar();
      }
    },
    async download() {
      this.itemsCpp.forEach((cxc) => {
        cxc.details.forEach((detail) => {
          if (detail.facturas.length > 0) {
            detail.facturas.forEach(async (factura) => {
              await this.downloadFactura(factura);
            });
          }
        });
      });
    },
    async downloadFactura(item) {
      let url = item.url_documento;
      axios({
        url,
        method: "GET",
        responseType: "blob",
      })
        .then((response) => {
          const urlArchivo = URL.createObjectURL(new Blob([response.data]));
          const link = document.createElement("a");
          link.href = urlArchivo;
          link.setAttribute(
            "download",
            `FACTURA Nro - ${item.nro_factura}.pdf`
          );
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
        })
        .catch((error) => {
          console.error("Error al descargar el archivo:", error);
        });
    },
    async exportar() {
      let vm = this;

      vm.exportando = true;
      var config = {
        method: "get",
        url:
          process.env.VUE_APP_URL_MAIN +
          `reportcxcexcel?id_branch=${
            JSON.parse(sessionStorage.getItem("dataUser"))[0].id_branch
          }&id_cliente=${
            vm.filtroOp.proveedorOp ? vm.filtroOp.proveedorOp : ""
          }&llegadaflag=${
            vm.filtroOp.llegadaOp ? vm.filtroOp.llegadaOp : ""
          }&fechahasta=${
            vm.filtroOp.fechaOp ? vm.filtroOp.fechaOp : ""
          }&nro_expediente=${this.nro_expediente}&nombre_impuesto=${
            this.$store.state.enterprises.impuesto.nombre_impuesto
          }&moneda=${this.moneda}&id_ingreso=${
            this.ingreso ? this.ingreso : ""
          }&id_subingreso=${this.subingreso ? this.subingreso : ""}`,

        responseType: "blob",
        headers: {
         
          "Content-Type": "blob",
        },
      };
      await axios(config)
        .then(function (response) {
          const url = window.URL.createObjectURL(new Blob([response.data]));
          const link = document.createElement("a");
          link.href = url;
          link.setAttribute(
            "download",
            `Reporte Cuentas por Cobrar ${moment().format(
              "DD-MM-YYYY hh:mm:ss"
            )}.xlsx`
          );
          document.body.appendChild(link);
          link.click();
        })
        .catch(function (error) {
          console.log(error);
        });

      vm.exportando = false;
    },
    async mostrarComentariosOp(data = {}) {
      var vm = this;

      vm.dataCXC = {
        ...data,
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
        id_cliente: vm.dataCXC.id_consigner ? vm.dataCXC.id_consigner : null,
        esoperativo: true,
        esadministrativo: false,
      };

      vm.dialogNuevoComentario = !vm.dialogNuevoComentario;
    },
    async mostrarComentariosAdmin(data = {}) {
      var vm = this;

      vm.dataCXC = {
        ...data,
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
        id_cliente: vm.dataCXC.id_consigner ? vm.dataCXC.id_consigner : null,
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
          `listarComentariosCXC?id_cliente=${vm.dataCXC.id_consigner}`,
        headers: {
         
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

            if (vm.dataCXC.esoperativo) {
              vm.lstComentarios = comentarios.filter((v) => !!v.esoperativo);
            } else if (vm.dataCXC.esadministrativo) {
              vm.lstComentarios = comentarios.filter(
                (v) => !!v.esadministrativo
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
          url: process.env.VUE_APP_URL_MAIN + `insertarComentarioCXC`,
          headers: {
           
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

.swal2-radio {
  display: flex;
  flex-direction: column !important;
  align-items: flex-start !important;
}
</style>
