<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { useRouter } from "vue-router";
import { useStore } from "vuex";
import moment from "moment";
import Swal from "sweetalert2";
import FormatFecha from "../comun/FormatFecha.vue";
import { useReportesStore } from "@/stores/reportes";
import type {
  ExpedienteMasterReporte,
  FiltroControlFile,
  ResumenOperador,
} from "@/types/reportes";

defineProps<{
  // statusReport: Boolean,
  statusList?: string;
}>();

const rootStore = useStore();
const appRouter = useRouter();
const reportesStore = useReportesStore();

const itemsReportFileAll = computed<ExpedienteMasterReporte[]>(
  () => rootStore.state.itemsReportFileAll,
);

const filterFlag = ref(false);
const filtro = ref<FiltroControlFile>({
  status_op: "0",
  status_admin: "",
  sentido: "",
  desde: "",
  id_operativo: "",
  hasta: "",
  salidaflag: null,
  llegadaflag: null,
  disponibilidadflag: null,
});
const itemsStatusExpedientes = [
  { id: "0", name: "Abierto" },
  { id: "1", name: "Cerrado" },
  { id: "", name: "Todos" },
];
const itemsSentido = [
  { id: "1", name: "Importación" },
  { id: "2", name: "Exportación" },
  { id: "", name: "Todos" },
];

const headers = [
  { title: "EXP MASTER", key: "datos_expedientes" },
  {
    title: "GENERALES EMBARQUE",
    align: "start",
    key: "datos_embarque",
  },

  { title: "Telex", key: "house_telex" },
  { title: "OPERADOR / FECHAS", key: "datos_operador" },
] as const;
const loading = ref(false);
const resumenOperador = ref<Record<string, ResumenOperador> | never[]>([]);

// created() {
//   this._getOperador();
// },

onMounted(async () => {
  loading.value = true;
  await rootStore.dispatch("_getOperador");
  await rootStore.dispatch("_getControlFileAll", filtro.value);
  await getResumen();
  loading.value = false;
});

function getFecha(fecha: string): string {
  moment.locale("es");
  return moment(fecha).format("DD-MMM-YYYY");
}

function getResumen(): void {
  const data: ExpedienteMasterReporte[] = rootStore.state.itemsReportFileAll;
  const operadoresInfo: Record<string, ResumenOperador> = {};

  // Itera sobre las etiquetas
  data.forEach((etiqueta) => {
    const operador = etiqueta.operador;
    if (!operadoresInfo[operador]) {
      operadoresInfo[operador] = {
        operador: operador,
        totalAbiertas: 0,
        totalCerradas: 0,
        totalFiles: 0,
      };
    }

    operadoresInfo[operador]!.totalFiles++;

    if (etiqueta.statuslock === 1) {
      operadoresInfo[operador]!.totalAbiertas++;
    } else if (etiqueta.statuslock === 0) {
      operadoresInfo[operador]!.totalCerradas++;
    }
  });
  resumenOperador.value = operadoresInfo;
}
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function selectHouse(id: number): void {
  appRouter.push("/home/folderBilling/billControlGastos/" + id);
}
async function refreshReport(): Promise<void> {
  loading.value = true;
  filterFlag.value = true;
  await rootStore.dispatch("_getControlFileAll", filtro.value);
  await getResumen();
  rootStore.state.reportsDialog = false;
  filterFlag.value = false;
  loading.value = false;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function getRowBackground(item: { background: string }): string {
  const backgroundValue = item.background;
  return `background-color: ${backgroundValue};`;
}

async function _generatePDF(): Promise<boolean | undefined> {
  if (rootStore.state.itemsReportFileAll.length == 0) {
    Swal.fire({
      icon: "error",
      text: "No se encontraron registros",
    });
    return false;
  }

  await reportesStore.exportReporteFile(filtro.value as unknown as Record<string, unknown>);
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function getColor(color: string): string {
  return `${color} !important`;
}
</script>

<template>
  <div>
    <v-dialog
      v-model="rootStore.state.reportsDialog"
      width="600"
      persistent
    >
      <v-card>
        <v-card-title class="text-headline-medium bg-grey-lighten-2">
          Filtros Generales
        </v-card-title>

        <v-card-text class="mt-5">
          <v-autocomplete
            :items="itemsStatusExpedientes"
            v-model="filtro.status_op"
            item-value="id"
            item-title="name"
            label="Estado de Expediente Operativo"
            density="compact"
          />
          <v-autocomplete
            :items="itemsStatusExpedientes"
            v-model="filtro.status_admin"
            item-value="id"
            item-title="name"
            label="Estado de Expediente Administrativo"
            density="compact"
          />
          <v-autocomplete
            :items="itemsSentido"
            item-value="id"
            item-title="name"
            label="Sentido"
            v-model="filtro.sentido"
            density="compact"
          />
          <p class="my-0 py-0">
            Confirmación Salida
          </p>
          <v-radio-group
            v-model="filtro.salidaflag"
            inline
            density="compact"
          >
            <v-radio
              label="Si"
              :value="true"
            />
            <v-radio
              label="No"
              :value="false"
            />
            <v-radio
              label="Todos"
              :value="null"
            />
          </v-radio-group>
          <p class="my-0 py-0">
            Confirmación Llegada
          </p>
          <v-radio-group
            v-model="filtro.llegadaflag"
            inline
            density="compact"
          >
            <v-radio
              label="Si"
              :value="true"
            />
            <v-radio
              label="No"
              :value="false"
            />
            <v-radio
              label="Todos"
              :value="null"
            />
          </v-radio-group>
          <p class="my-0 py-0">
            Confirmación Disponibilidad
          </p>
          <v-radio-group
            v-model="filtro.disponibilidadflag"
            inline
            density="compact"
          >
            <v-radio
              label="Si"
              :value="true"
            />
            <v-radio
              label="No"
              :value="false"
            />
            <v-radio
              label="Todos"
              :value="null"
            />
          </v-radio-group>
          <v-autocomplete
            :items="rootStore.state.itemsOperadorList"
            item-value="id"
            item-title="namelong"
            label="Operador"
            v-model="filtro.id_operativo"
            clearable
            density="compact"
          />
          <p>Fecha de Disponibilidad</p>
          <FormatFecha
            :dense="true"
            label="Fecha Desde"
            id="filtroDesde"
            v-model="filtro.desde"
          />
          <FormatFecha
            :dense="true"
            label="Fecha Hasta"
            id="filtroHasta"
            v-model="filtro.hasta"
          />
          <!-- <v-text-field v-model="filtro.desde" type="date" label="Fecha Inicio">
          </v-text-field>
          <v-text-field v-model="filtro.hasta" type="date" label="Fecha Final">
          </v-text-field> -->
        </v-card-text>

        <v-divider />

        <v-card-actions>
          <v-spacer />
          <v-btn
            color="primary"
            :loading="loading"
            variant="text"
            @click="refreshReport()"
          >
            BUSCAR
          </v-btn>
          <v-btn
            color="error"
            :loading="loading"
            variant="text"
            @click="rootStore.state.reportsDialog = !rootStore.state.reportsDialog"
          >
            Cerrar
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
    <v-card elevation="0">
      <v-card-title class="d-flex align-center flex-wrap">
        LISTA DE EXPEDIENTES MASTER's
        <v-btn
          @click="rootStore.state.reportsDialog = !rootStore.state.reportsDialog"
          class="ml-4"
          rounded
          elevation="0"
          color="primary"
          :loading="loading"
        >
          FILTRAR
        </v-btn><v-btn
          @click="_generatePDF()"
          class="ml-4"
          rounded
          elevation="0"
          color="success"
          :loading="loading"
        >
          GENERAR PDF
        </v-btn>
        <v-spacer />
        - Leyenda
        <span
          style="
            background: #00ea80;
            width: 20px;
            height: 20px;
            border-radius: 250px;
            margin-left: 10px;
            margin-right: 20px;
          "
        />
        Cargas Llegadas |
        <span
          style="
            background: #fddd0c;
            width: 20px;
            height: 20px;
            border-radius: 250px;
            margin-left: 10px;
            margin-right: 20px;
          "
        />
        Cargas a 5 días de llegar
      </v-card-title>

      <v-data-table
        :headers="headers"
        :items="itemsReportFileAll"
        item-value="index"
        :loading="loading"
        :items-per-page="-1"
        fixed-header
        disable-sort
        hide-default-footer
        class="div_table__Main"
        height="650"
        density="compact"
      >
        <template #item="{ item }">
          <tr :style="{ backgroundColor: item.background }">
            <td width="25%">
              <p class="ma-0">
                <b>{{ item.code_master }}</b>

                <!-- <b></b> -->
              </p>
              <p class="ma-0">
                {{ item.modality }} {{ item.shipment }}
              </p>
              <p class="ma-0">
                {{ item.port_begin }}
              </p>
              <p class="ma-0">
                {{ item.port_end }}
              </p>
              <p class="ma-0">
                Salida: {{ getFecha(item.fecha_eta) }}
              </p>
              <p class="ma-0">
                Llegada: {{ getFecha(item.fecha_etd) }}
              </p>
              <p class="ma-0">
                Disponibilidad:{{ getFecha(item.fecha_disponibilidad) }}
              </p>
              <p class="ma-0">
                Incoterms: {{ item.incoterms }}
              </p>
            </td>
            <td width="25%">
              <p class="ma-0">
                Cliente: {{ item.listhouse }}
              </p>
              <p class="ma-0">
                <b>Comentarios:</b>
              </p>
              <p
                class="ma-0"
                v-for="(i, index) in item.comentario"
                :key="index"
              >
                {{ i.fecha }} ({{ i.namelong }}) :
                {{ i.comentario }}
              </p>
            </td>
            <td width="25%">
              <table width="100%">
                <tr
                  v-for="(telex, index) in item.house_telex"
                  :key="index"
                >
                  <td width="80%">
                    {{ telex.nombrecompleto }}
                  </td>
                  <td width="10%">
                    {{ telex.fechaconfirmaciontelex }}
                  </td>
                </tr>
              </table>
              <p />
            </td>
            <td width="25%">
              <p class="ma-0">
                <b>Operador:</b> {{ item.operador }}
              </p>

              <p class="ma-0">
                <b>Fecha Registro:</b> {{ getFecha(item.created) }}
              </p>
              <!-- <p>Ejecutivo de Ventas</p> -->
              <p> <b>N° Manifiesto: </b> {{ item.nro_manifiesto || 'Sin Nro Manifesto' }}</p>
              <!-- <p>Declaración Aduana</p> -->
              <p>
                <b>Canal:</b>
                <span>
                  {{ item.color ? item.color : "N/A" }}
                </span>
              </p>
              <!-- <p class="ma-0">
                Status Expediente Op.:{{
                  item.statuslock == 0 ? "Abierto" : "Cerrado"
                }}
              </p>
              <p class="ma-0">
                Status Expediente Adm.:{{
                  item.statuslockadm == 0 ? "Abierto" : "Cerrado"
                }}
              </p> -->
            </td>
            <v-divider />
          </tr>
        </template>
      </v-data-table>

      <!-- este es el pie de pagina -->
      <v-container class="div__total">
        <v-row>
          <v-col
            cols="12"
            md="3"
          >
            <p>
              Total de Expedientes Master:
              {{ rootStore.state.itemsReportFileAll.length }}
            </p>
          </v-col>

          <v-col
            cols="12"
            md="2"
          >
            <p>
              Total Llegados:
              {{
                itemsReportFileAll.filter((v) => v.orden == 1)
                  .length
              }}
            </p>
            <p>
              Total por Llegar:
              {{
                itemsReportFileAll.filter((v) => v.orden == 2)
                  .length
              }}
            </p>
            <p>
              Total de Otras:
              {{
                itemsReportFileAll.filter((v) => v.orden == 3)
                  .length
              }}
            </p>
          </v-col>

          <v-col
            cols="12"
            md="5"
          >
            <v-table density="compact">
              <template #default>
                <thead>
                  <tr>
                    <th class="text-left">
                      Operador
                    </th>
                    <th class="text-left">
                      Cerradas
                    </th>
                    <th class="text-left">
                      Abiertas
                    </th>
                    <th class="text-left">
                      Total
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr
                    v-for="(item, index) in resumenOperador"
                    :key="index"
                  >
                    <td>{{ item.operador }}</td>
                    <td>{{ item.totalAbiertas }}</td>
                    <td>{{ item.totalCerradas }}</td>
                    <td>{{ item.totalFiles }}</td>
                  </tr>
                </tbody>
              </template>
            </v-table>
          </v-col>
        </v-row>
      </v-container>
    </v-card>
  </div>
</template>

<style lang="scss" scoped>
.div_table__Main p {
  margin: 0px;
  font-size: 13px;
}

.div__total {
  box-shadow: -1px -49px 26px -46px rgba(191, 191, 191, 1);
}

.div__total p {
  margin: 0px;
}
.custom-data-table tbody tr:nth-child(odd) {
  background-color: #e6f7ff; /* Establece el color de fondo azul para las filas impares */
}
.table-data[data-v-02d9b950] {
  background: red;
}
</style>
