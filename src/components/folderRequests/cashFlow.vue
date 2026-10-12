<template>
  <div>
    <v-container fluid>
      <v-card elevation="0">
        <v-card-title>
          Flujo de Caja

          <v-spacer></v-spacer>
          <v-menu
            v-model="menu"
            :close-on-content-click="false"
            transition="scale-transition"
            min-width="auto"
          >
            <template v-slot:activator="{ props }">
              <v-text-field
                v-model="dateRange"
                label="Rango de Fechas"
                prepend-icon="mdi-calendar"
                readonly
               
                v-bind="props"
              ></v-text-field>
            </template>
            <v-locale-provider locale="es">
              <v-date-picker
                :model-value="date.filter(Boolean)"
                @update:model-value="setDateRange"
                multiple="range"
              >
                <template #actions>
                  <v-spacer></v-spacer>
                  <v-btn variant="text" color="primary" @click="menu = false"> Cancel </v-btn>
                  <v-btn variant="text" color="primary" @click="menu = false">
                    OK
                  </v-btn>
                </template>
              </v-date-picker>
            </v-locale-provider>
          </v-menu>
          <v-btn
            class="ml-5"
            color="primary"
            @click="_getDebsToPayFilter()"
            elevation="0"
            >Buscar</v-btn
          >
          <v-btn
            class="ml-5"
            color="orange"
            @click="_cleanFilter()"
            elevation="0"
            >Limpiar</v-btn
          >
          <v-btn
            class="ml-5"
            color="orange"
            @click="viewPDF()"
            elevation="0"
            >EXPORTAR A PDF</v-btn
          >
        </v-card-title>
        <v-card-text>
          <v-container v-if="!dataList" style="height: 400px">
            <v-row class="fill-height align-content-center justify-center">
              <v-col class="text-subtitle-1 text-center" cols="12">
                Cargando información...
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
          <v-row>
            <v-col cols="12" md="6">
              <v-data-table
                v-if="dataList"
                :headers="headersdbp"
                :items="itemsCpp"
                :search="search"
                item-value="nameproveedor"
                @click:row="(event, { item }) => clickRow(item, event)"
              >
                <template v-slot:body.prepend>
                  <tr style="">
                    <th style="font-size: 18px; background: #e9e9e9">
                      CUENTAS POR PAGAR
                    </th>

                    <th
                      colspan="1"
                      style="
                        font-size: 18px;
                        text-align: center;
                        background: #c3fbef;
                      "
                    >
                      LLEGADAS
                    </th>
                    <th
                      colspan="1"
                      style="
                        font-size: 18px;
                        text-align: center;
                        background: #fbc3c3;
                      "
                    >
                      NO LLEGADAS
                    </th>
                    <th
                      colspan="1"
                      style="
                        font-size: 18px;
                        text-align: center;
                        background: #e9e9e9;
                      "
                    >
                      GENERAL
                    </th>
                  </tr>
                </template>

                <template v-slot:expanded-row="{ item }">
                  <tr>
                    <td colspan="11">
                      <v-table style="width: 100%">
                        <thead>
                          <tr style="background: #fff1cf">
                            <th>Expediente</th>
                            <th>Cliente</th>
                            <th>Fecha Disponibilidad</th>
                            <th>Total a Pagar</th>
                            <th>Status</th>
                            <!-- <th>Pagado Cliente</th> -->
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
                              {{ child.nameconsigner }}
                            </td>
                            <td>
                              {{ child.fecha_disponibilidad }}
                            </td>
                            <td>{{ child.total_pagar }} USD</td>
                            <td>
                              {{ child.llegada == 1 ? "LLEGADA" : "NO LLEGADA" }}
                            </td>
                            <!-- <td>
                              {{ child.llegada == 1 ? "SI" : "NO" }}
                            </td> -->
                          </tr>
                        </tbody>
                      </v-table>
                    </td>
                  </tr>
                </template>

                <!--  <template v-slot:item="{ item }">
            <tr>
              <td>{{ item.nameproveedor }}</td>
              <td style="background: #e9e9e9">{{ item.total_pagar }}</td>
              <td style="background: #e9e9e9">{{ item.total_pagado }}</td>
              <td style="background: #e9e9e9">{{ item.restante_pagar }}</td>
              <td style="background: #c3fbef">
                {{ item.total_pagar_llegada }}
              </td>
              <td style="background: #c3fbef">
                {{ item.total_pagado_llegada }}
              </td>
              <td style="background: #c3fbef">{{ item.restante_llegada }}</td>
              <td style="background: #fbc3c3">
                {{ item.total_pagar_no_llegada }}
              </td>
              <td style="background: #fbc3c3">
                {{ item.total_pagado_no_llegada }}
              </td>
              <td style="background: #fbc3c3">
                {{ item.restante_no_llegada }}
              </td>
              <td></td>
            </tr>
          </template> -->

                <template v-slot:body.append>
                  <tr style="">
                    <th style="font-size: 18px; background: #e9e9e9">
                      TOTALES
                    </th>

                    <th style="font-size: 18px; background: #c3fbef">
                      {{
                        Intl.NumberFormat().format(
                          sumField("total_pagar_llegada").toFixed(2)
                        )
                      }}
                      USD
                    </th>

                    <th style="font-size: 18px; background: #fbc3c3">
                      {{
                        Intl.NumberFormat().format(
                          sumField("total_pagar_no_llegada").toFixed(2)
                        )
                      }}
                      USD
                    </th>

                    <th style="font-size: 18px; background: #e9e9e9">
                      {{
                        Intl.NumberFormat().format(
                          sumField("total_pagar").toFixed(2)
                        )
                      }}
                      USD
                    </th>
                  </tr>
                </template>
              </v-data-table>
            </v-col>
            <v-col cols="12" md="6">
              <v-data-table
                v-if="dataList"
                :headers="headersdbc"
                :items="itemsCpc"
                :search="searchc"
                item-value="nameproveedor"
              >
                <template v-slot:body.prepend>
                  <tr style="">
                    <th style="font-size: 18px; background: #e9e9e9">
                      CUENTAS POR COBRAR
                    </th>

                    <th
                      colspan="1"
                      style="
                        font-size: 18px;
                        text-align: center;
                        background: #c3fbef;
                      "
                    >
                      LLEGADAS
                    </th>
                    <th
                      colspan="1"
                      style="
                        font-size: 18px;
                        text-align: center;
                        background: #fbc3c3;
                      "
                    >
                      NO LLEGADAS
                    </th>
                    <th
                      colspan="1"
                      style="
                        font-size: 18px;
                        text-align: center;
                        background: #e9e9e9;
                      "
                    >
                      GENERAL
                    </th>
                  </tr>
                </template>

                <template v-slot:expanded-row="{ item }">
                  <tr>
                    <td colspan="11">
                      <v-table style="width: 100%">
                        <thead>
                          <tr style="background: #fff1cf">
                            <th>Expediente</th>
                            <th>Cliente</th>
                            <th>Fecha Disponibilidad</th>
                            <th>Total a Pagar</th>
                            <th>Status</th>
                            <!-- <th>Pagado Cliente</th> -->
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
                              {{ child.nameconsigner }}
                            </td>
                            <td>
                              {{ child.fecha_disponibilidad }}
                            </td>
                            <td>{{ child.total_pagar }} USD</td>
                            <td>
                              {{ child.llegada == 1 ? "LLEGADA" : "NO LLEGADA" }}
                            </td>
                            <!-- <td>
                              {{ child.llegada == 1 ? "SI" : "NO" }}
                            </td> -->
                          </tr>
                        </tbody>
                      </v-table>
                    </td>
                  </tr>
                </template>

                <!--  <template v-slot:item="{ item }">
            <tr>
              <td>{{ item.nameproveedor }}</td>
              <td style="background: #e9e9e9">{{ item.total_pagar }}</td>
              <td style="background: #e9e9e9">{{ item.total_pagado }}</td>
              <td style="background: #e9e9e9">{{ item.restante_pagar }}</td>
              <td style="background: #c3fbef">
                {{ item.total_pagar_llegada }}
              </td>
              <td style="background: #c3fbef">
                {{ item.total_pagado_llegada }}
              </td>
              <td style="background: #c3fbef">{{ item.restante_llegada }}</td>
              <td style="background: #fbc3c3">
                {{ item.total_pagar_no_llegada }}
              </td>
              <td style="background: #fbc3c3">
                {{ item.total_pagado_no_llegada }}
              </td>
              <td style="background: #fbc3c3">
                {{ item.restante_no_llegada }}
              </td>
              <td></td>
            </tr>
          </template> -->

                <template v-slot:body.append>
                  <tr style="">
                    <th style="font-size: 18px; background: #e9e9e9">
                      TOTALES
                    </th>

                    <th style="font-size: 18px; background: #c3fbef">
                      {{
                        Intl.NumberFormat().format(
                          sumFieldc("total_pagar_llegada").toFixed(2)
                        )
                      }}
                      USD
                    </th>

                    <th style="font-size: 18px; background: #fbc3c3">
                      {{
                        Intl.NumberFormat().format(
                          sumFieldc("total_pagar_no_llegada").toFixed(2)
                        )
                      }}
                      USD
                    </th>

                    <th style="font-size: 18px; background: #e9e9e9">
                      {{
                        Intl.NumberFormat().format(
                          sumFieldc("total_pagar").toFixed(2)
                        )
                      }}
                      USD
                    </th>
                  </tr>
                </template>
              </v-data-table>
            </v-col>
          </v-row>
        </v-card-text>
      </v-card>
    </v-container>

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
            >EXPORTAR</v-btn
          >
          <v-spacer></v-spacer>
          <v-btn color="red" @click="dialogPdf = false" variant="outlined">Cerrar</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>
<script>
import axios from '@/api/axios-config';
import moment from "moment";

export default {
  name: "cashflow",
  data: () => ({
    tab: null,
    dataCpp: false,
    dataCpc: false,
    itemsCpp: [],
    itemsCpc: [],
    search: "",
    searchc: "",

    expanded: [],
    expand: [],

    date: ["", ""],

    radio: 1,

    menu: false,
    modal: false,
    menu2: false,
    radiopdf: "",
    dialogPdf: false,

    singleExpand: false,
    dataList: false,

    headersdbp: [
      /* {
        text: "Proveedor",
        align: "start",
        sortable: false,
        value: "nameproveedor",
      },

      {
        text: "Total a Pagar",
        value: "total_pagar_llegada",
      },

      {
        text: "Total a Pagar",
        value: "total_pagar_no_llegada",
      },

      {
        text: "Total a Pagar",
        value: "total_pagar",
      },

      { text: "", value: "data-table-expand" }, */
    ],

    headersdbc: [
      /* {
        text: "Proveedor",
        align: "start",
        sortable: false,
        value: "nameproveedor",
      },

      {
        text: "Total a Pagar",
        value: "total_pagar_llegada",
      },

      {
        text: "Total a Pagar",
        value: "total_pagar_no_llegada",
      },

      {
        text: "Total a Pagar",
        value: "total_pagar",
      },

      { text: "", value: "data-table-expand" }, */
    ],
  }),
  mounted() {
    this._getDebsToPay();
    this._getDebsToPayc();
  },
  computed: {
    dateRange() {
      return this.date.join(" ~ ");
    },
  },
  methods: {
    setDateRange(value) {
      this.date = value.map((date) => moment(date).format("YYYY-MM-DD"));
    },
    viewPDF() {
      this.dialogPdf = true;
    },
    _cleanFilter() {
      (this.date = ["", ""]), (this.radio = "");
    },
    editControl(id, control, id_orders, code_control) {
      window.open(
        "/home/folderBilling/billControlGastos/view/" +
          control +
          "/" +
          id +
          "/" +
          id_orders +
          "/" +
          code_control,
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
    sumFieldc(key) {
      // sum data in give key (property)
      return this.itemsCpc.reduce((a, b) => a + parseFloat(b[key] || 0), 0);
    },

    clickRow(item, event) {
      if (event.isExpanded) {
        const index = this.expanded.findIndex((i) => i === item);
        this.expanded.splice(index, 1);
      } else {
        this.expanded.push(item);
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
          vm.sumField("total_pagar").toFixed(2)
        ),
        total_pagado: Intl.NumberFormat().format(
          vm.sumField("total_pagado").toFixed(2)
        ),
        total_restante: Intl.NumberFormat().format(
          vm.sumField("restante_pagar").toFixed(2)
        ),
        total_pagar_llegada: Intl.NumberFormat().format(
          vm.sumField("total_pagar_llegada").toFixed(2)
        ),
        total_pagado_llegada: Intl.NumberFormat().format(
          vm.sumField("total_pagado_llegada").toFixed(2)
        ),
        total_restante_llegada: Intl.NumberFormat().format(
          vm.sumField("restante_llegada").toFixed(2)
        ),
        total_pagar_no_llegada: Intl.NumberFormat().format(
          vm.sumField("total_pagar_no_llegada").toFixed(2)
        ),
        total_pagado_no_llegada: Intl.NumberFormat().format(
          vm.sumField("total_pagado_no_llegado").toFixed(2)
        ),
        total_restante_no_llegada: Intl.NumberFormat().format(
          vm.sumField("restante_pagar_no_llegada").toFixed(2)
        ),
        fecha: new Date(Date.now() - new Date().getTimezoneOffset() * 60000)
          .toISOString()
          .substr(0, 10),
        dateRange: vm.dateRange,
        status: statusLetra,
      };

      let urlLong;
      if (vm.radiopdf == 1) {
        urlLong = "pdfcxp";
      } else if (vm.radiopdf == 2) {
        urlLong = "pdfcxpD";
      }
      var config = {
        method: "post",
        url: import.meta.env.VUE_APP_URL_MAIN + urlLong,

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
            import.meta.env.VUE_APP_URL_MAIN + response.data.path,
            "_blank"
          );
        })
        .catch(function (error) {
          console.error(error);
        });
    },

    async _getDebsToPay() {
      var vm = this;
      vm.dataList = false;
      var config = {
        method: "post",
        url: import.meta.env.VUE_APP_URL_MAIN + "getDebsToPay",

        headers: {
         
          "Content-Type": "application/json",
        },
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

    async _getDebsToPayc() {
      var vm = this;
      vm.dataList = false;
      var config = {
        method: "post",
        url: import.meta.env.VUE_APP_URL_MAIN + "getReportAccounts",

        headers: {
         
          "Content-Type": "application/json",
        },
      };
      await axios(config)
        .then(function (response) {
          vm.itemsCpc = response.data.data;
          vm.dataList = true;
          vm.$store.state.drawer = false;
        })
        .catch(function (error) {
          console.error(error);
        });
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
        url: import.meta.env.VUE_APP_URL_MAIN + "getDebsToPayFilter",

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
</style>
