<script setup lang="ts">
import { computed, ref, watch } from "vue";
import Swal from "sweetalert2";
import moment from "moment";
import type { Numerico } from "@/types/cotizacion";
import type { DetalleControlFile } from "@/types/reportes";
import { hasFailed, request } from "@/utils/request";
import { downloadPdf } from "@/utils/pdfDownload";

const dateDesde = ref(moment().startOf("month").format("YYYY-MM-DD"));
const menuDesde = ref(false);
const dateDesdeOnOpen = ref<string | null>(null);
const dateHasta = ref(moment().endOf("month").format("YYYY-MM-DD"));
const menuHasta = ref(false);
const dateHastaOnOpen = ref<string | null>(null);
const expanded = ref<string[]>([]);
const dataList = ref(true);
const dialogDate = ref(true);
const dessertHeaders = [
  { title: "NRO MASTER", key: "nro_master" },
  { title: "MASTER", key: "code_master" },
  { title: "FECHA DISPONIBILIDAD", key: "fecha_disponibilidad" },
  { title: "GANANCIA PR", key: "ganancia_pr" },
  { title: "GANANCIA OP", key: "ganancia_op" },
  { title: "FACTURADO PR", key: "ingresos_pr" },
  { title: "FACTURADO OP", key: "ingresos_op" },
  { title: "POR COBRAR", key: "porcobrar" },
  // { text: "VER INSTRUCTIVO", value: "ver_instructivo" },
];
const itemsDetails = ref<DetalleControlFile[]>([]);
const amount = (value: unknown): number => parseFloat(String(value || 0));
const sumDetails = (value: (item: DetalleControlFile) => number) =>
  computed(() => itemsDetails.value.reduce((total, item) => total + value(item), 0));
const gananciaPr = sumDetails((item) => amount(item.ingresos_pr) - amount(item.egresos_pr));
const gananciaOp = sumDetails((item) => amount(item.ingresos_op) - amount(item.egresos_op));
const cobrado = sumDetails((item) => amount(item.ingesos_pagado));
const porCobrar = sumDetails(
  (item) => amount(item.ingresos_op != 0 ? item.ingresos_op : item.ingresos_pr) - amount(item.ingesos_pagado),
);
const porPagar = sumDetails(
  (item) => amount(item.egresos_op != 0 ? item.egresos_op : item.egresos_pr) - amount(item.egresos_pagado),
);

//this.getFileDetails();

watch(menuDesde, (open) => {
  if (open) dateDesdeOnOpen.value = dateDesde.value;
  else dateDesde.value = dateDesdeOnOpen.value!;
});
watch(menuHasta, (open) => {
  if (open) dateHastaOnOpen.value = dateHasta.value;
  else dateHasta.value = dateHastaOnOpen.value!;
});

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function sumField(key: string): number {
  return itemsDetails.value.reduce((a, b) => a + parseFloat(String(b[key] || 0)), 0);
}
function setDesde(value: unknown): void {
  dateDesde.value = moment(value as moment.MomentInput).format("YYYY-MM-DD");
}
function setHasta(value: unknown): void {
  dateHasta.value = moment(value as moment.MomentInput).format("YYYY-MM-DD");
}

async function getFileDetails(): Promise<void> {
  dataList.value = false;
  const answer = await request<DetalleControlFile>({
    method: "get",
    url: import.meta.env.VITE_URL_MAIN + "getReportFileDetails",
    params: { desde: dateDesde.value, hasta: dateHasta.value },
  });
  dataList.value = true;
  itemsDetails.value = answer.estadoflag ? answer.data : [];
  if (answer.estadoflag) {
    dialogDate.value = false;
    return;
  }
  Swal.fire({ icon: hasFailed(answer) ? "error" : "info", text: answer.mensaje });
}
function getTipo(tipo: Numerico): string {
  switch (tipo) {
    case 1:
      return "FACTURA";
    case 2:
      return "PROFORMA";
    case 3:
      return "OTRO";
    default:
      return "SIN CARGAR";
  }
}

async function _exportPdf(): Promise<boolean | undefined> {
  if (itemsDetails.value.length == 0) {
    Swal.fire({
      icon: "info",
      text: "No hay expedientes para exportar. Busca otro rango de fechas primero.",
    });
    return false;
  }
  await downloadPdf(
    {
      method: "post",
      url: import.meta.env.VITE_URL_MAIN + "pdfFD",
      data: { desde: dateDesde.value, hasta: dateHasta.value },
    },
    `REPORTE_FILES_DETALLADO_${dateDesde.value}_${dateHasta.value}.pdf`,
  );
}
</script>

<template>
  <div>
    <v-dialog
      persistent
      max-width="600"
      v-model="dialogDate"
    >
      <v-card
        :disabled="!dataList"
        :loading="!dataList"
      >
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
                  <template #activator="{ props }">
                    <v-text-field
                      v-model="dateDesde"
                      label="Fecha desde"
                      prepend-icon="mdi-calendar"
                      readonly
                     
                      v-bind="props"
                    />
                  </template>
                  <v-date-picker
                    :model-value="dateDesde"
                    @update:model-value="setDesde"
                    hide-header
                  >
                    <template #actions>
                      <v-spacer />
                      <v-btn
                        variant="text"
                        color="primary"
                        @click="menuDesde = false"
                      >
                        Cancel
                      </v-btn>
                      <v-btn
                        variant="text"
                        color="primary"
                        @click="dateDesdeOnOpen = dateDesde; menuDesde = false"
                      >
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
                  <template #activator="{ props }">
                    <v-text-field
                      v-model="dateHasta"
                      label="Fecha Hasta"
                      prepend-icon="mdi-calendar"
                      readonly
                     
                      v-bind="props"
                    />
                  </template>
                  <v-date-picker
                    :model-value="dateHasta"
                    @update:model-value="setHasta"
                    hide-header
                  >
                    <template #actions>
                      <v-spacer />
                      <v-btn
                        variant="text"
                        color="primary"
                        @click="menuHasta = false"
                      >
                        Cancel
                      </v-btn>
                      <v-btn
                        variant="text"
                        color="primary"
                        @click="dateHastaOnOpen = dateHasta; menuHasta = false"
                      >
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
          <v-btn
            color="primary"
            elevation="0"
            @click="getFileDetails()"
          >
            Buscar
          </v-btn>
          <v-spacer />
          <v-btn
            color="red"
            variant="outlined"
            elevation="0"
            @click="dialogDate = false"
          >
            Cerrar
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-card elevation="0">
      <v-card-title class="d-flex align-center flex-wrap">
        REPORTE DE CONTROL DE FILE DETALLADO <v-spacer />
        <v-btn
          variant="outlined"
          @click="dialogDate = true"
          color="primary"
          class="mr-5"
        >
          BUSCAR NUEVA FECHA
        </v-btn>
        <v-btn
          @click="_exportPdf()"
          color="primary"
          elevation="0"
        >
          EXPORTAR PDF
        </v-btn>
      </v-card-title>
      <v-container fluid>
        <v-row>
          <v-col
            cols="12"
            md="12"
          >
            <v-table>
              <tbody>
                <tr style="background: #ddd; font-weight: bold">
                  <td>
                    EXPEDIENTES:
                    {{ itemsDetails.length }}
                  </td>
                  <td>
                    GANANCIA PR:
                    {{ parseFloat(String(gananciaPr)).toFixed(2) }}
                    USD
                  </td>
                  <td>
                    GANANCIA OP:
                    {{ parseFloat(String(gananciaOp)).toFixed(2) }}
                    USD
                  </td>
                  <td>
                    COBRADO:

                    {{ parseFloat(String(cobrado)).toFixed(2) }}

                    USD
                  </td>
                  <td>
                    POR COBRAR:
                    {{ parseFloat(String(porCobrar)).toFixed(2) }}
                    USD
                  </td>
                  <td>
                    POR PAGAR:
                    {{ parseFloat(String(porPagar)).toFixed(2) }}
                    USD
                  </td>
                </tr>
              </tbody>
            </v-table>
          </v-col>
        </v-row>
      </v-container>
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
              Cargando información
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
          <template #[`item.ganancia_pr`]="{ item }">
            {{
              parseFloat(
                String(parseFloat(String(item.ingresos_pr)) - parseFloat(String(item.egresos_pr)))
              ).toFixed(2)
            }}
          </template>
          <template #[`item.ganancia_op`]="{ item }">
            {{
              parseFloat(
                String(parseFloat(String(item.ingresos_op)) - parseFloat(String(item.egresos_op)))
              ).toFixed(2)
            }}
          </template>
          <template #[`item.porcobrar`]="{ item }">
            {{
              parseFloat(
                String(parseFloat(
                  String(item.ingresos_op != 0 ? item.ingresos_op : item.ingresos_pr)
                ) - parseFloat(String(item.ingesos_pagado)))
              ).toFixed(2)
            }}
          </template>
          <template #expanded-row="{ item }">
            <tr>
              <td colspan="1" />
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
                      <td>{{ parseFloat(String(house.monto_pr)).toFixed(2) }}</td>
                      <td>{{ parseFloat(String(house.monto_op)).toFixed(2) }}</td>
                      <td>
                        {{
                          parseFloat(
                            String(parseFloat(
                              String(house.monto_op != 0
                                ? house.monto_op
                                : house.monto_pr)
                            ) - parseFloat(String(house.ingresos_pagado)))
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
                      <td>{{ parseFloat(String(proveedor.monto_pr)).toFixed(2) }}</td>
                      <td>{{ parseFloat(String(proveedor.monto_op)).toFixed(2) }}</td>
                      <td>
                        {{
                          parseFloat(
                            String(parseFloat(
                              String(proveedor.monto_op != 0
                                ? proveedor.monto_op
                                : proveedor.monto_pr)
                            ) - parseFloat(String(proveedor.egresos_pagado)))
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
                        {{ child.type_pago == 2 ? "PROFORMA" : "" }}
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

<style lang="scss">
.style-1 {
  background-color: rgb(252, 143, 143);
}
.style-2 {
  background-color: white;
}
</style>
