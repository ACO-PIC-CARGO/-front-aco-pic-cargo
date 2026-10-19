<template>
  <v-container fluid>
    <v-card elevation="0">
      <v-card-title class="d-flex align-center flex-wrap">
        <h3>REPORTE DE CUENTAS POR PAGAR</h3>
        <v-spacer></v-spacer>
        <v-btn
          class="ml-5"
          color="primary"
          elevation="0"
          size="small"
          variant="plain"
          @click="offcanvas = !offcanvas"
          ><v-icon>mdi-filter-multiple</v-icon> FILTRAR
        </v-btn>

        <v-btn
          color="#1D6F42"
          class="mx-1"
          @click="exportar"
          :loading="exportando"
          size="small"
          variant="plain"
          ><v-icon>mdi-file-excel</v-icon> EXCEL</v-btn
        >
        <v-btn
          class="ml-5"
          color="red"
          :loading="exportandopdf"
          @click="exportarPDF()"
          elevation="0"
          size="small"
          variant="plain"
        >
          <v-icon>mdi-file-pdf-box</v-icon> PDF</v-btn
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
          v-model:expanded="expanded"
          item-value="nameproveedor"
          show-expand
          expand-on-click
        >
          <template v-slot:[`item.nameproveedor`]="{ item }">
            <div class="d-flex">
              <div>{{ item.nameproveedor }}</div>
              <v-btn
                size="small"
                color="primary"
                class="ml-auto"
                @click.stop="mostrarComentariosOp(item)"
              >
                <v-icon size="small" class="mr-1">mdi-comment</v-icon> Comentarios
              </v-btn>
            </div>
          </template>

          <template v-slot:expanded-row="{ item }">
            <tr>
              <td colspan="11">
                <v-table style="width: 100%">
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
                </v-table>
              </td>
            </tr>
          </template>
        </v-data-table>

        <v-card-title primary-title>
          REPORTE DE CUENTAS POR PAGAR ADMINISTRATIVAS
        </v-card-title>

        <v-data-table
          :search="search"
          :headers="headersdbpa"
          :items="itemsCppa"
          v-model:expanded="expandeda"
          item-value="nameconsigner"
          return-object
          show-expand
          @click:row="(event, { item }) => clickRowa(item, event)"
        >
          <template v-slot:[`item.nameconsigner`]="{ item }">
            <div class="d-flex">
              <div>{{ item.nameconsigner }}</div>
              <v-btn
                size="small"
                color="primary"
                class="ml-auto"
                @click.stop="mostrarComentariosAdmin(item)"
              >
                <v-icon size="small" class="mr-1">mdi-comment</v-icon> Comentarios
              </v-btn>
            </div>
          </template>

          <template v-slot:expanded-row="{ item }">
            <tr>
              <td colspan="11">
                <v-table style="width: 100%">
                  <thead>
                    <tr style="background: #fff1cf">
                      <th>Acción</th>
                      <th>Factura</th>
                      <th>Fecha Registro</th>
                      <th>Monto</th>
                      <th>
                        {{ enterprisesStore.impuesto.nombre_impuesto }}
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
                </v-table>
              </td>
            </tr>
          </template>
        </v-data-table>
      </v-card-text>
    </v-card>

    <!--COMENTARIOS-->
    <v-dialog v-model="dialogComentarios" persistent width="70%">
      <v-card>
        <v-card-title class="d-flex align-center flex-wrap">
          Estados/Comentarios de la CxP - {{ dataCXP.proveedor }}
          <v-spacer></v-spacer>
          <template v-if="dataCXP.esoperativo">
            <v-btn rounded size="small" color="primary" @click="agregarComentarioOp"
              >Nuevo Comentario</v-btn
            >
          </template>
          <template v-else-if="dataCXP.esadministrativo">
            <v-btn rounded size="small" color="primary" @click="agregarComentarioAdmin"
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
            size="small"
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
        <v-card-title class="d-flex align-center flex-wrap">
          Registro de Estado/Comentario de la CxP - {{ dataCXP.proveedor }}
          <v-spacer></v-spacer>
          <v-btn variant="text"
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
              density="compact"
              label="Fecha"
              v-model="comentario.fecha"
              type="date"
              readonly
            ></v-text-field>
            <v-autocomplete
              density="compact"
              label="Ejecutivo"
              :items="$store.state.pricing.listEjecutivo"
              item-title="name"
              item-value="id_entitie"
              v-model="comentario.id_ejecutivo"
              :rules="[(v) => !!v || 'Dato requerido']"
              readonly
            ></v-autocomplete>
            <v-textarea
              density="compact"
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
            size="small"
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
            variant="outlined"
          >
            EXPORTAR
          </v-btn>
          <v-spacer></v-spacer>
          <v-btn color="red" @click="dialogPdf = false" variant="outlined">Cerrar</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog v-model="dialogNuevoPago" scrollable persistent max-width="70%">
      <v-card>
        <v-card-title class="d-flex align-center flex-wrap" primary-title>
          Programación de Pago del Proveedor {{ nameProveedor }}
          <v-spacer></v-spacer>
          <v-btn variant="text"
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
                item-title="programend_fecha"
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
                item-value="index"
                return-object
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
      location="right"
      
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
                item-title="namelong"
                item-value="id"
                multiple
                chips
                variant="outlined"
                density="compact"
              ></v-autocomplete
            ></v-col>
            <v-col cols="12" class="py-0 my-0">
              <v-text-field
                name="name"
                label="Nro Expediente"
                v-model="nro_expediente"
                clearable
                variant="outlined"
                density="compact"
              ></v-text-field>
            </v-col>
            <v-col cols="12" class="py-0 my-0">
              <v-autocomplete
                clearable
                v-model="gasto"
                label="Gasto"
                :items="gastosStore.list"
                item-title="description"
                item-value="id"
                multiple
                chips
                density="compact"
                variant="outlined"
              ></v-autocomplete>
            </v-col>
            <v-col cols="12" class="py-0 my-0">
              <v-autocomplete
                clearable
                v-model="subgasto"
                label="Sub Gasto"
                :items="subgastoStore.lstSubGasto"
                item-title="description"
                item-value="id"
                multiple
                chips
                density="compact"
                variant="outlined"
              ></v-autocomplete>
            </v-col>
            <v-col cols="12" class="py-0 my-0">
              <v-text-field
                label="Fecha Hasta"
                type="date"
                v-model="fechaOp"
                clearable
                variant="outlined"
                density="compact"
              ></v-text-field>
            </v-col>
            <v-col cols="12" class="py-0 my-0">
              <p class="py-0 my-0">Estado:</p>
              <v-radio-group density="compact" v-model="llegadaOp" inline class="py-0 my-0">
                <v-radio label="Llegada" value="1"></v-radio>

                <v-radio label="No llegada" value="0"></v-radio>
              </v-radio-group>
            </v-col>
          </v-row>
        </v-card-text>
      </v-card>

      <v-card>
        <v-card-actions>
          <v-btn color="success" @click="filtrar">Aceptar</v-btn>
          <v-btn color="error" @click="limpiar">Limpiar</v-btn>
          <v-btn color="info" @click="offcanvas = !offcanvas">
            Cancelar
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-navigation-drawer>
  </v-container>
</template>
<script>
import { defineAsyncComponent } from "vue";
import axios from '@/api/http';
import { mapState, mapActions } from "vuex";
import exportFromJSON from "export-from-json";
import moment from "moment";
import Swal from "sweetalert2";
import { mapActions as mapPiniaActions, mapStores } from "pinia";
import { useGastosStore } from "@/stores/gastos";
import { useSubgastoStore } from "@/stores/subgasto";
import { useEnterprisesStore } from "@/stores/enterprises";
export default {
  name: "debstoPay",
  components: {
    newProgrammedPayment: defineAsyncComponent(() =>
      import("../ProgrammedPayment/newProgrammedPayment.vue")),
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
        title: "Operativo",
        key: "moneda",
      },
      {
        title: "Llegados",
        key: "llegada",
      },
      {
        title: "No Llegado",
        key: "no_llegada",
      },
      {
        title: "Total",
        key: "total",
      },
    ],
    totalOperativo: [],
    cabTotalAdministrativo: [
      {
        title: "Administrativo",
        key: "moneda",
      },
      {
        title: "Nonto",
        key: "monto",
      },
      {
        title: "IGV",
        key: "igv",
      },
      {
        title: "Total",
        key: "total",
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
        title: "PROVEEDOR OPERATIVO",
        align: "start",
        sortable: true,
        key: "nameproveedor",
        headerProps: { class: "hProveedor" },
      },

      {
        title: "LLEGADAS",
        key: "restante_llegada",
        headerProps: { class: "hLlegada" },
        sortable: false,
      },

      {
        title: "NO LLEGADAS",
        key: "restante_no_llegada",
        headerProps: { class: "hNoLlegada" },
        sortable: false,
      },

      {
        title: "GENERAL",
        key: "restante_pagar",
        headerProps: { class: "hGeneral" },
        sortable: false,
      },
      { title: "", key: "data-table-expand" },
    ],

    headersdbpa: [
      {
        title: "Proveedor",
        align: "start",
        sortable: false,
        key: "nameconsigner",
      },

      {
        title: "Pendiente por Pagar",
        key: "pendiente_pago",
      },

      { title: "", key: "data-table-expand" },
    ],
    headerProgramacion: [
      { title: "Expediente", key: "nro_master" },
      { title: "Consignatario", key: "nameconsigner" },
      { title: "Fecha Disponibilidad", key: "fecha_disponibilidad" },
      { title: "Moneda", key: "symbol" },
      { title: "Monto Pagar", key: "total_pagar" },
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
      { title: "Fecha", key: "fecha", width: "15%" },
      { title: "Ejecutivo", key: "ejecutivo", width: "30%" },
      { title: "Comentario", key: "comentario", width: "55%" },
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
    this.cabTotalAdministrativo[2].title =
      this.enterprisesStore.impuesto.nombre_impuesto;
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
    ...mapStores(useEnterprisesStore, useSubgastoStore, useGastosStore),
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
    ]),
    ...mapPiniaActions(useEnterprisesStore, ["obtenerImpuestoXEmpresa"]),
    ...mapPiniaActions(useSubgastoStore, ["GetListSubGasto"]),
    ...mapPiniaActions(useGastosStore, ["cargarGasto"]),
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
        url: import.meta.env.VITE_URL_MAIN + urlLong,

        headers: {
         
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
            import.meta.env.VITE_URL_MAIN + response.data.path,
            "_blank",
          );
        })
        .catch(function (error) {
          console.error(error);
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
          import.meta.env.VITE_URL_MAIN +
          `getReporteCXP?id_branch=${
            JSON.parse(sessionStorage.getItem("dataUser"))[0].id_branch
          }&id_proveedor=${this.proveedorOp ? this.proveedorOp : ""}&llegada=${
            this.llegadaOp ? this.llegadaOp : ""
          }&desde=&hasta=${this.fechaOp ? this.fechaOp : ""}&nro_expediente=${
            this.nro_expediente
          }`,

        headers: {
         
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
          console.error(error);
        });
      vm.overlay = false;
    },

    async _getDebsToPayAdmin() {
      var vm = this;
      vm.overlay = true;
      var config = {
        method: "get",
        url:
          import.meta.env.VITE_URL_MAIN +
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
          console.error(error);
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
        url: import.meta.env.VITE_URL_MAIN + "getDebsToPayFilter",

        headers: {
         
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
          console.error(error);
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
            { title: "Expediente", key: "nro_master" },
            { title: "Consignatario", key: "nameconsigner" },
            { title: "Fecha Disponibilidad", key: "fecha_disponibilidad" },
            { title: "Moneda", key: "symbol" },
            { title: "Monto Pagar", key: "total_pagar" },
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
            { title: "Consignatario", key: "nameconsigner" },
            { title: "Fecha Registro", key: "fecha" },
            { title: "Moneda", key: "symbol" },
            { title: "Monto Pagar", key: "monto" },
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
        url: import.meta.env.VITE_URL_MAIN + "setProgrammedPayment",
        headers: {
         
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
          console.error(error);
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
          import.meta.env.VITE_URL_MAIN +
          `reportcxpexcel?id_branch=${
            JSON.parse(sessionStorage.getItem("dataUser"))[0].id_branch
          }&id_proveedor=${this.proveedorOp ? this.proveedorOp : ""}&llegada=${
            this.llegadaOp ? this.llegadaOp : ""
          }&desde=&hasta=${this.fechaOp ? this.fechaOp : ""}&nro_expediente=${
            this.nro_expediente
          }&nombre_impuesto=${
            this.enterprisesStore.impuesto.nombre_impuesto
          }&moneda=${this.moneda}&id_gasto=${
            this.gasto ? this.gasto : ""
          }&id_subgasto=${this.subgasto ? this.subgasto : ""}`,

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
          link.setAttribute("download", `Reporte CxP - ${Date.now()}.xlsx`);
          document.body.appendChild(link);
          link.click();
        })
        .catch(function (error) {
          console.error(error);
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
              import.meta.env.VITE_URL_MAIN +
              `exportarPDFCXP?id_branch=${
                JSON.parse(sessionStorage.getItem("dataUser"))[0].id_branch
              }&id_proveedor=${
                this.proveedorOp ? this.proveedorOp : ""
              }&llegada=${this.llegadaOp ? this.llegadaOp : ""}&desde=&hasta=${
                this.fechaOp ? this.fechaOp : ""
              }&nro_expediente=${this.nro_expediente}&tipo_reporte=${
                tipoReportePDF ? tipoReportePDF : ""
              }&nombre_impuesto=${
                this.enterprisesStore.impuesto.nombre_impuesto
              }&id_gasto=${this.gasto ? this.gasto : ""}&id_subgasto=${
                this.subgasto ? this.subgasto : ""
              }`,
            responseType: "blob",
            headers: {
             
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
              console.error(error);
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
          import.meta.env.VITE_URL_MAIN +
          `listarComentariosCXP?id_proveedor=${vm.dataCXP.id}`,
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
      if ((await vm.$refs.frmComentario.validate()).valid) {
        vm.loadingBotonGuardarComentario = true;

        var config = {
          method: "post",
          url: import.meta.env.VITE_URL_MAIN + `insertarComentarioCXP`,
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
.v-data-table > .v-table__wrapper tbody tr.v-data-table__tr:has(> .v-data-table__td--expanded-row .mdi-chevron-up),
.v-data-table > .v-table__wrapper tbody tr.v-data-table__tr:has(> .v-data-table__td--expanded-row .mdi-chevron-up) + tr {
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
