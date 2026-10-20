<script setup lang="ts">
import { computed, onMounted, ref, watch } from "vue";
import { useStore } from "vuex";
import Swal from "sweetalert2";
import axios from "@/api/http";
import moment from "moment";
import type { CuentaFlujoCaja } from "@/types/requests";

const rootStore = useStore();

const itemsCpp = ref<CuentaFlujoCaja[]>([]);
const itemsCpc = ref<CuentaFlujoCaja[]>([]);
const search = ref("");
const searchc = ref("");
const expanded = ref<CuentaFlujoCaja[]>([]);
const date = ref<string[]>(["", ""]);
const radio = ref<number | string>(1);
const menu = ref(false);
const dateOnOpen = ref<string[] | null>(null);
const radiopdf = ref<number | string>("");
const dialogPdf = ref(false);
const dataList = ref(false);
const headersdbp = ref([
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
]);
const headersdbc = ref([
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
]);

const dateRange = computed(() => {
  return date.value.join(" ~ ");
});

function setDateRange(value: string[]) {
  date.value = value.map((date) => moment(date).format("YYYY-MM-DD"));
}
function viewPDF() {
  dialogPdf.value = true;
}
function _cleanFilter() {
  // eslint-disable-next-line @typescript-eslint/no-unused-expressions
  (date.value = ["", ""]), (radio.value = "");
}
function editControl(id: number, control: number, id_orders: number, code_control: string) {
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
    // @ts-expect-error window.open takes three arguments
    "menubar=no",
    "location=no",
    "resizable=no"
  );
}
function sumField(key: string) {
  // sum data in give key (property)
  return itemsCpp.value.reduce((a, b) => a + parseFloat(String(b[key] || 0)), 0);
}
function sumFieldc(key: string) {
  // sum data in give key (property)
  return itemsCpc.value.reduce((a, b) => a + parseFloat(String(b[key] || 0)), 0);
}
function clickRow(item: CuentaFlujoCaja, event: Event & { isExpanded?: boolean }) {
  if (event.isExpanded) {
    const index = expanded.value.findIndex((i) => i === item);
    expanded.value.splice(index, 1);
  } else {
    expanded.value.push(item);
  }
}
async function _exportPdf() {
  Swal.fire({
    icon: "info",
    title: "Generando PDF",
    text: "Espere... ",
  });

  let statusLetra: string | undefined;
  if (radio.value == "") {
    statusLetra = "Todos";
  } else if (radio.value == 1) {
    statusLetra = "Vencidas";
  } else if (radio.value == 0) {
    statusLetra = "No Vencidas";
  }

  const data = {
    itemsCpp: itemsCpp.value,
    total_pagar: Intl.NumberFormat().format(
      sumField("total_pagar").toFixed(2) as unknown as number
    ),
    total_pagado: Intl.NumberFormat().format(
      sumField("total_pagado").toFixed(2) as unknown as number
    ),
    total_restante: Intl.NumberFormat().format(
      sumField("restante_pagar").toFixed(2) as unknown as number
    ),
    total_pagar_llegada: Intl.NumberFormat().format(
      sumField("total_pagar_llegada").toFixed(2) as unknown as number
    ),
    total_pagado_llegada: Intl.NumberFormat().format(
      sumField("total_pagado_llegada").toFixed(2) as unknown as number
    ),
    total_restante_llegada: Intl.NumberFormat().format(
      sumField("restante_llegada").toFixed(2) as unknown as number
    ),
    total_pagar_no_llegada: Intl.NumberFormat().format(
      sumField("total_pagar_no_llegada").toFixed(2) as unknown as number
    ),
    total_pagado_no_llegada: Intl.NumberFormat().format(
      sumField("total_pagado_no_llegado").toFixed(2) as unknown as number
    ),
    total_restante_no_llegada: Intl.NumberFormat().format(
      sumField("restante_pagar_no_llegada").toFixed(2) as unknown as number
    ),
    fecha: new Date(Date.now() - new Date().getTimezoneOffset() * 60000)
      .toISOString()
      .substr(0, 10),
    dateRange: dateRange.value,
    status: statusLetra,
  };

  let urlLong: string | undefined;
  if (radiopdf.value == 1) {
    urlLong = "pdfcxp";
  } else if (radiopdf.value == 2) {
    urlLong = "pdfcxpD";
  }
  const config = {
    method: "post",
    url: import.meta.env.VITE_URL_MAIN + (urlLong as string),

    headers: {

      "Content-Type": "application/json",
    },
    data: data,
  };
  await axios(config)
    .then(function (response) {
      Swal.fire({
        icon: "success",
        title: "PDF Generado",
        text: "El PDF se descargará automaticamente",
      });

      dialogPdf.value = false;
      window.open(
        import.meta.env.VITE_URL_MAIN + response.data.path,
        "_blank"
      );
    })
    .catch(function (error) {
      console.error(error);
    });
}
async function _getDebsToPay() {
  dataList.value = false;
  const config = {
    method: "post",
    url: import.meta.env.VITE_URL_MAIN + "getDebsToPay",

    headers: {

      "Content-Type": "application/json",
    },
  };
  await axios(config)
    .then(function (response) {
      itemsCpp.value = response.data.data;
      dataList.value = true;
      rootStore.state.drawer = false;
    })
    .catch(function (error) {
      console.error(error);
    });
}
async function _getDebsToPayc() {
  dataList.value = false;
  const config = {
    method: "post",
    url: import.meta.env.VITE_URL_MAIN + "getReportAccounts",

    headers: {

      "Content-Type": "application/json",
    },
  };
  await axios(config)
    .then(function (response) {
      itemsCpc.value = response.data.data;
      dataList.value = true;
      rootStore.state.drawer = false;
    })
    .catch(function (error) {
      console.error(error);
    });
}
async function _getDebsToPayFilter() {
  dataList.value = false;

  const data = {
    date_begin: date.value[0],
    date_end: date.value[1],
  };
  const config = {
    method: "post",
    url: import.meta.env.VITE_URL_MAIN + "getDebsToPayFilter",

    headers: {

      "Content-Type": "application/json",
    },
    data: data,
  };
  await axios(config)
    .then(function (response) {
      itemsCpp.value = response.data.data;
      dataList.value = true;
      rootStore.state.drawer = false;
    })
    .catch(function (error) {
      console.error(error);
    });
}

watch(menu, (open) => {
  if (open) dateOnOpen.value = date.value;
  else date.value = dateOnOpen.value as string[];
});

onMounted(() => {
  _getDebsToPay();
  _getDebsToPayc();
});
</script>

<template>
  <div>
    <v-container fluid>
      <v-card elevation="0">
        <v-card-title class="d-flex align-center flex-wrap">
          Flujo de Caja

          <v-spacer />
          <v-menu
            v-model="menu"
            :close-on-content-click="false"
            transition="scale-transition"
            min-width="auto"
          >
            <template #activator="{ props }">
              <v-text-field
                v-model="dateRange"
                label="Rango de Fechas"
                prepend-icon="mdi-calendar"
                readonly

                v-bind="props"
              />
            </template>
            <v-locale-provider locale="es">
              <v-date-picker
                :model-value="date.filter(Boolean)"
                @update:model-value="setDateRange"
                multiple="range"
              >
                <template #actions>
                  <v-spacer />
                  <v-btn
                    variant="text"
                    color="primary"
                    @click="menu = false"
                  >
                    Cancel
                  </v-btn>
                  <v-btn
                    variant="text"
                    color="primary"
                    @click="dateOnOpen = date; menu = false"
                  >
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
          >
            Buscar
          </v-btn>
          <v-btn
            class="ml-5"
            color="orange"
            @click="_cleanFilter()"
            elevation="0"
          >
            Limpiar
          </v-btn>
          <v-btn
            class="ml-5"
            color="orange"
            @click="viewPDF()"
            elevation="0"
          >
            EXPORTAR A PDF
          </v-btn>
        </v-card-title>
        <v-card-text>
          <v-container
            v-if="!dataList"
            style="height: 400px"
          >
            <v-row class="fill-height align-content-center justify-center">
              <v-col
                class="text-body-large text-center"
                cols="12"
              >
                Cargando información...
              </v-col>
              <v-col cols="6">
                <v-progress-linear
                  color="deep-purple-accent-4"
                  indeterminate
                  rounded
                  height="6"
                />
              </v-col>
            </v-row>
          </v-container>
          <v-row>
            <v-col
              cols="12"
              md="6"
            >
              <v-data-table
                v-if="dataList"
                :headers="headersdbp"
                :items="itemsCpp"
                :search="search"
                item-value="nameproveedor"
                @click:row="(event: Event, { item }: { item: CuentaFlujoCaja }) => clickRow(item, event)"
              >
                <template #body.prepend>
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

                <template #expanded-row="{ item }">
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
                              >
                                mdi-eye
                              </v-icon>
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

                <template #body.append>
                  <tr style="">
                    <th style="font-size: 18px; background: #e9e9e9">
                      TOTALES
                    </th>

                    <th style="font-size: 18px; background: #c3fbef">
                      {{
                        Intl.NumberFormat().format(
                          sumField("total_pagar_llegada").toFixed(2) as unknown as number
                        )
                      }}
                      USD
                    </th>

                    <th style="font-size: 18px; background: #fbc3c3">
                      {{
                        Intl.NumberFormat().format(
                          sumField("total_pagar_no_llegada").toFixed(2) as unknown as number
                        )
                      }}
                      USD
                    </th>

                    <th style="font-size: 18px; background: #e9e9e9">
                      {{
                        Intl.NumberFormat().format(
                          sumField("total_pagar").toFixed(2) as unknown as number
                        )
                      }}
                      USD
                    </th>
                  </tr>
                </template>
              </v-data-table>
            </v-col>
            <v-col
              cols="12"
              md="6"
            >
              <v-data-table
                v-if="dataList"
                :headers="headersdbc"
                :items="itemsCpc"
                :search="searchc"
                item-value="nameproveedor"
              >
                <template #body.prepend>
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

                <template #expanded-row="{ item }">
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
                              >
                                mdi-eye
                              </v-icon>
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

                <template #body.append>
                  <tr style="">
                    <th style="font-size: 18px; background: #e9e9e9">
                      TOTALES
                    </th>

                    <th style="font-size: 18px; background: #c3fbef">
                      {{
                        Intl.NumberFormat().format(
                          sumFieldc("total_pagar_llegada").toFixed(2) as unknown as number
                        )
                      }}
                      USD
                    </th>

                    <th style="font-size: 18px; background: #fbc3c3">
                      {{
                        Intl.NumberFormat().format(
                          sumFieldc("total_pagar_no_llegada").toFixed(2) as unknown as number
                        )
                      }}
                      USD
                    </th>

                    <th style="font-size: 18px; background: #e9e9e9">
                      {{
                        Intl.NumberFormat().format(
                          sumFieldc("total_pagar").toFixed(2) as unknown as number
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

    <v-dialog
      max-width="400"
      v-model="dialogPdf"
    >
      <v-card>
        <v-card-title> Opción de PDF </v-card-title>
        <v-card-text>
          <v-radio-group v-model="radiopdf">
            <v-radio
              value="1"
              label="Reporte Simple"
            />
            <v-radio
              value="2"
              label="Reporte Detallado"
            />
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
          <v-spacer />
          <v-btn
            color="red"
            @click="dialogPdf = false"
            variant="outlined"
          >
            Cerrar
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<style lang="scss">
.v-data-table > .v-table__wrapper tbody tr.v-data-table__tr:has(> .v-data-table__td--expanded-row .mdi-chevron-up),
.v-data-table > .v-table__wrapper tbody tr.v-data-table__tr:has(> .v-data-table__td--expanded-row .mdi-chevron-up) + tr {
  background: #ffccab;
}
</style>
