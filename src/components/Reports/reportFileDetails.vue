<template>
  <div>
    <v-dialog persistent max-width="600" v-model="dialogDate">
      <v-card :disabled="!dataList" :loading="!dataList">
        <v-card-title> Seleccione fecha </v-card-title>
        <v-card-text>
          <v-container fluid>
            <v-row>
              <v-col>
                <v-menu
                  v-model="menuDesde"
                  :close-on-content-click="false"
                  transition="scale-transition"
                  min-width="auto"
                >
                  <template v-slot:activator="{ props }">
                    <v-text-field
                      v-model="dateDesde"
                      label="Fecha desde"
                      prepend-icon="mdi-calendar"
                      readonly
                     
                      v-bind="props"
                    ></v-text-field>
                  </template>
                  <v-date-picker
                    :model-value="dateDesde"
                    @update:model-value="setDesde"
                    hide-header
                  >
                    <template #actions>
                      <v-spacer></v-spacer>
                      <v-btn variant="text" color="primary" @click="menuDesde = false">
                        Cancel
                      </v-btn>
                      <v-btn variant="text" color="primary" @click="dateDesdeOnOpen = dateDesde; menuDesde = false">
                        OK
                      </v-btn>
                    </template>
                  </v-date-picker>
                </v-menu>
              </v-col>
              <v-col>
                <v-menu
                  v-model="menuHasta"
                  :close-on-content-click="false"
                  transition="scale-transition"
                  min-width="auto"
                >
                  <template v-slot:activator="{ props }">
                    <v-text-field
                      v-model="dateHasta"
                      label="Fecha Hasta"
                      prepend-icon="mdi-calendar"
                      readonly
                     
                      v-bind="props"
                    ></v-text-field>
                  </template>
                  <v-date-picker
                    :model-value="dateHasta"
                    @update:model-value="setHasta"
                    hide-header
                  >
                    <template #actions>
                      <v-spacer></v-spacer>
                      <v-btn variant="text" color="primary" @click="menuHasta = false">
                        Cancel
                      </v-btn>
                      <v-btn variant="text" color="primary" @click="dateHastaOnOpen = dateHasta; menuHasta = false">
                        OK
                      </v-btn>
                    </template>
                  </v-date-picker>
                </v-menu>
              </v-col>
            </v-row>
          </v-container>
        </v-card-text>
        <v-card-actions>
          <v-btn color="primary" elevation="0" @click="getFileDetails()"
            >Buscar</v-btn
          >
          <v-spacer></v-spacer>
          <v-btn color="red" variant="outlined" elevation="0" @click="dialogDate = false"
            >Cerrar</v-btn
          >
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-card elevation="0">
      <v-card-title class="d-flex align-center flex-wrap">
        REPORTE DE CONTROL DE FILE DETALLADO <v-spacer></v-spacer>
        <v-btn variant="outlined" @click="dialogDate = true" color="primary" class="mr-5"
          >BUSCAR NUEVA FECHA</v-btn
        >
        <v-btn @click="_exportPdf()" color="primary" elevation="0"
          >EXPORTAR PDF</v-btn
        >
      </v-card-title>
      <v-container fluid>
        <v-row>
          <v-col cols="12" md="12">
            <v-table>
              <tbody>
                <tr style="background: #ddd; font-weight: bold">
                  <td>
                    EXPEDIENTES:
                    {{ itemsDetails.length }}
                  </td>
                  <td>
                    GANANCIA PR:
                    {{ parseFloat(gananciaPr).toFixed(2) }}
                    USD
                  </td>
                  <td>
                    GANANCIA OP:
                    {{ parseFloat(gananciaOp).toFixed(2) }}
                    USD
                  </td>
                  <td>
                    COBRADO:

                    {{ parseFloat(cobrado).toFixed(2) }}

                    USD
                  </td>
                  <td>
                    POR COBRAR:
                    {{ parseFloat(porCobrar).toFixed(2) }}
                    USD
                  </td>
                  <td>
                    POR PAGAR:
                    {{ parseFloat(porPagar).toFixed(2) }}
                    USD
                  </td>
                </tr>
              </tbody>
            </v-table>
          </v-col>
        </v-row>
      </v-container>
      <v-card-text>
        <v-container v-if="!dataList" style="height: 400px">
          <v-row class="fill-height align-content-center justify-center">
            <v-col class="text-body-large text-center" cols="12">
              Cargando informacíon
            </v-col>
            <v-col cols="6">
              <v-progress-linear
                color="deep-purple-accent-4"
                indeterminate
                rounded
                height="6"
              ></v-progress-linear>
            </v-col>
          </v-row>
        </v-container>
        <v-data-table
          v-if="dataList"
          :headers="dessertHeaders"
          :items="itemsDetails"
          v-model:expanded="expanded"
          item-value="id_master"
          show-expand
          expand-on-click
          class="elevation-0"
        >
          <template v-slot:[`item.ganancia_pr`]="{ item }">
            {{
              parseFloat(
                parseFloat(item.ingresos_pr) - parseFloat(item.egresos_pr)
              ).toFixed(2)
            }}
          </template>
          <template v-slot:[`item.ganancia_op`]="{ item }">
            {{
              parseFloat(
                parseFloat(item.ingresos_op) - parseFloat(item.egresos_op)
              ).toFixed(2)
            }}
          </template>
          <template v-slot:[`item.porcobrar`]="{ item }">
            {{
              parseFloat(
                parseFloat(
                  item.ingresos_op != 0 ? item.ingresos_op : item.ingresos_pr
                ) - parseFloat(item.ingesos_pagado)
              ).toFixed(2)
            }}
          </template>
          <template v-slot:expanded-row="{ item }">
            <tr>
              <td colspan="1"></td>
              <td :colspan="dessertHeaders.length">
                <v-table style="width: 100%">
                  <thead>
                    <tr style="background: #b2dfdb">
                      <th>Cliente</th>
                      <th>Facturado Pr</th>
                      <th>Facturado Op</th>
                      <th>Por Cobrar</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr
                      style="background: #e0f2f1"
                      v-for="house in item.listhouse"
                      :key="house.id"
                    >
                      <td>{{ house.cliente }}</td>
                      <td>{{ parseFloat(house.monto_pr).toFixed(2) }}</td>
                      <td>{{ parseFloat(house.monto_op).toFixed(2) }}</td>
                      <td>
                        {{
                          parseFloat(
                            parseFloat(
                              house.monto_op != 0
                                ? house.monto_op
                                : house.monto_pr
                            ) - parseFloat(house.ingresos_pagado)
                          ).toFixed(2)
                        }}
                      </td>
                    </tr>
                  </tbody>
                </v-table>
                <v-table style="width: 100%">
                  <thead>
                    <tr style="background: #ffccbc">
                      <th>Proveedor</th>
                      <th>Documento</th>
                      <th>Facturado Pr</th>
                      <th>Facturado Op</th>
                      <th>Por Pagar</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr
                      style="background: #fbe9e7"
                      v-for="(proveedor, index) in item.listproveedor"
                      :key="index"
                    >
                      <td>{{ proveedor.proveedor }}</td>
                      <td>
                        {{ getTipo(proveedor.type_pago) }}
                      </td>
                      <td>{{ parseFloat(proveedor.monto_pr).toFixed(2) }}</td>
                      <td>{{ parseFloat(proveedor.monto_op).toFixed(2) }}</td>
                      <td>
                        {{
                          parseFloat(
                            parseFloat(
                              proveedor.monto_op != 0
                                ? proveedor.monto_op
                                : proveedor.monto_pr
                            ) - parseFloat(proveedor.egresos_pagado)
                          ).toFixed(2)
                        }}
                      </td>
                    </tr>
                  </tbody>
                </v-table>
                <!-- <v-simple-table style="width: 100%">
                  <thead>
                    <tr style="background: #fff1cf">
                      <th>Proveedor</th>
                      <th>Total Pagar</th>
                      <th>Origen Monto</th>
                      <th>Por Pagar</th>
                      <th>Documento</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr
                      style="background: #fff1cf"
                      v-for="child of item.dataegresos"
                      :key="child.id"
                    >
                      <td>
                    <v-icon
                      @click="
                        editControl(
                          child.id_control,
                          child.id_house,
                          child.id_orders,
                          child.code_control
                        )
                      "
                      >mdi-eye</v-icon
                    >
                  </td>
                      <td>
                        {{ child.nameproveedor }}
                      </td>
                      <td>{{ child.total_p }}</td>
                      <td>{{ child.type_tota }}</td>
                      <td>
                        {{ child.restante }}
                      </td>
                      <td>
                        {{ child.type_pago == 1 ? "FACTURA" : "" }}
                        {{ child.type_pago == 2 ? "PROFORMACE" : "" }}
                        {{ child.type_pago == 3 ? "OTRO" : "" }}
                        {{ child.type_pago == null ? "SIN CARGAR" : "" }}
                        {{ child.type_pago == 0 ? "SIN CARGAR" : "" }}
                      </td>
                    </tr>
                  </tbody>
                </v-simple-table> -->
              </td>
            </tr>
          </template>
        </v-data-table>
      </v-card-text>
    </v-card>
  </div>
</template>

<script>
import axios from '@/api/http';
import Swal from "sweetalert2";
import moment from "moment";
import mixins from "../mixins/funciones.js";
export default {
  mixins: [mixins],
  name: "reportFileDetails",
  data: () => ({
    dateDesde: moment().startOf("month").format("YYYY-MM-DD"),
    menuDesde: false,
    dateDesdeOnOpen: null,
    dateHasta: moment().endOf("month").format("YYYY-MM-DD"),
    menuHasta: false,
    dateHastaOnOpen: null,
    expanded: [],
    singleExpand: false,
    dataList: true,
    dialogDate: true,
    gananciaOp: 0,
    gananciaPr: 0,
    cobrado: 0,
    porCobrar: 0,
    porPagar: 0,
    dessertHeaders: [
      { title: "NRO MASTER", key: "nro_master" },
      { title: "MASTER", key: "code_master" },
      { title: "FECHA DISPONIBILIDAD", key: "fecha_disponibilidad" },
      { title: "GANANCIA PR", key: "ganancia_pr" },
      { title: "GANANCIA OP", key: "ganancia_op" },
      { title: "FACTURADO PR", key: "ingresos_pr" },
      { title: "FACTURADO OP", key: "ingresos_op" },
      { title: "POR COBRAR", key: "porcobrar" },
      // { text: "VER INSTRUCTIVO", value: "ver_instructivo" },
    ],
    dateRange: "",
    itemsDetails: [],
  }),
  mounted() {
    //this.getFileDetails();
  },
  watch: {
    menuDesde(open) {
      if (open) this.dateDesdeOnOpen = this.dateDesde;
      else this.dateDesde = this.dateDesdeOnOpen;
    },
    menuHasta(open) {
      if (open) this.dateHastaOnOpen = this.dateHasta;
      else this.dateHasta = this.dateHastaOnOpen;
    },
  },
  methods: {
    sumField(key) {
      return this.itemsDetails.reduce((a, b) => a + parseFloat(b[key] || 0), 0);
    },
    setDesde(value) {
      this.dateDesde = moment(value).format("YYYY-MM-DD");
    },
    setHasta(value) {
      this.dateHasta = moment(value).format("YYYY-MM-DD");
    },

    getFileDetails() {
      var vm = this;
      vm.dataList = false;

      var config = {
        method: "get",
        url:
          import.meta.env.VITE_URL_MAIN +
          `getReportFileDetails?id_branch=${
            JSON.parse(sessionStorage.getItem("dataUser"))[0].id_branch
          }&desde=${vm.dateDesde ? vm.dateDesde : ""}&hasta=${
            vm.dateHasta ? vm.dateHasta : ""
          }`,
        headers: {
         
          "Content-Type": "application/json",
        },
      };
      axios(config)
        .then(function (response) {
          let data = response.data;

          if (data.estadoflag == true) {
            vm.itemsDetails = data.data;

            vm.gananciaPr = data.data.reduce((total, item) => {
              return (
                parseFloat(total) +
                (parseFloat(item.ingresos_pr||0) - parseFloat(item.egresos_pr||0))
              );
            }, 0);
            vm.gananciaOp = data.data.reduce((total, item) => {
              return (
                parseFloat(total) +
                (parseFloat(item.ingresos_op) - parseFloat(item.egresos_op))
              );
            }, 0);
            vm.cobrado = data.data.reduce((total, item) => {
              return parseFloat(total) + parseFloat(item.ingesos_pagado);
            }, 0);
            vm.porCobrar = data.data.reduce((total, item) => {
              return (
                parseFloat(total) +
                (parseFloat(
                  item.ingresos_op != 0 ? item.ingresos_op : item.ingresos_pr
                ) -
                  parseFloat(item.ingesos_pagado))
              );
            }, 0);
            vm.porPagar = data.data.reduce((total, item) => {
              return (
                parseFloat(total) +
                (parseFloat(
                  item.egresos_op != 0 ? item.egresos_op : item.egresos_pr
                ) -
                  parseFloat(item.egresos_pagado))
              );
            }, 0);

            vm.dataList = true;
            vm.dialogDate = false;
          } else {
            vm.itemsDetails = [];
            vm.dataList = true;
            vm.dialogDate = false;
            Swal.fire({
              icon: "error",
              text: data.mensaje,
            });
          }
        })
        .catch(function (error) {
          console.error(error);
        });
    },
    getTipo(tipo) {
      switch (tipo) {
        case 1:
          return "FACTURA";
        case 2:
          return "PROFORMACE";
        case 3:
          return "OTRO";
        default:
          return "SIN CARGAR";
      }
    },

    async _exportPdf() {
      if (this.itemsDetails.length == 0) {
        Swal.fire({
          icon: "error",
          text: "No se encontraron registros",
        });
        return false;
      }
      var vm = this;
      vm.$swal({
        icon: "info",
        title: "Generando PDF",
        text: "Espere... ",
      });

      var data = {
        id_branch: JSON.parse(sessionStorage.getItem("dataUser"))[0].id_branch,
        desde: this.dateDesde,
        hasta: this.dateHasta,
      };
      var config = {
        method: "post",
        url: import.meta.env.VITE_URL_MAIN + "pdfFD",

        headers: {
         
          "Content-Type": "application/json",
        },
        data: data,
      };
      axios(config)
        .then(function (response) {
          vm.$swal({
            icon: "success",
            title: "PDF Generado",
            text: "El PDF se descargará automaticamente",
          });
          window.open(
            import.meta.env.VITE_URL_MAIN + response.data.path,
            "_blank"
          );
        })
        .catch(function (error) {
          console.error(error);
        });
    },
  },
};
</script>

<style lang="scss">
.style-1 {
  background-color: rgb(252, 143, 143);
}
.style-2 {
  background-color: white;
}
</style>
