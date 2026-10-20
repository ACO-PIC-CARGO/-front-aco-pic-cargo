<script setup lang="ts">
import { onMounted, ref } from "vue";
import { useStore } from "vuex";
import moment from "moment";
import { useBalancesStore } from "@/stores/balances";
import type {
  CostoFlujoMes,
  DescripcionFlujoMes,
  FiltroFlujoMes,
  RegistroFlujoMes,
  SubtipoFlujoMes,
  TipoFlujoMes,
} from "@/types/estadoGanancias";

const rootStore = useStore();
const balancesStore = useBalancesStore();

const cantidadmes = ref(0);
const items = ref<TipoFlujoMes[]>([]);
const fechas = ref<string[]>([]);
const flujo = ref<RegistroFlujoMes[]>([]);
const filtroFlag = ref(false);
const filtro = ref<FiltroFlujoMes>({
  id_proveedor: "",
  id_cliente: "",
  nro_expediente: "",
});
//

function formatearData() {
  flujo.value = balancesStore.lstFlujoOperacionesMes[0]!.flujo as RegistroFlujoMes[];
  fechas.value = balancesStore.lstFlujoOperacionesMes[0]!.fechahasta as string[];

  let tipos = flujo.value.map((element) => {
    return element.tipo;
  });
  tipos = tipos.filter((item, index) => {
    return tipos.indexOf(item) === index;
  });

  // ------------------------------
  const subtipos = flujo.value
    .map((item) => ({
      tipo: item.tipo,
      subtipo: item.subtipo,
      informacion: item.informacion,
    })) // Extraer tipo y subtipo
    .filter(
      (item, index, arr) =>
        index ===
        arr.findIndex(
          (obj) => obj.tipo === item.tipo && obj.subtipo === item.subtipo
        )
    );
  // -----------------------
  const descripcion = flujo.value
    .map((item) => ({
      tipo: item.tipo,
      subtipo: item.subtipo,
      informacion: item.informacion,
      descripcion: item.descripcion,
    })) // Extraer tipo y subtipo
    .filter(
      (item, index, arr) =>
        index ===
        arr.findIndex(
          (obj) =>
            obj.tipo === item.tipo &&
            obj.subtipo === item.subtipo &&
            obj.descripcion === item.descripcion
        )
    );

  const costosTipo: TipoFlujoMes[] = [];
  tipos.forEach((tipo) => {
    const costosSubTipo: SubtipoFlujoMes[] = [];
    let totalTipo = 0;
    subtipos
      .filter((v) => v.tipo == tipo)
      .forEach((subtipo) => {
        let totalSubTipo = 0;

        const descripciones: DescripcionFlujoMes[] = [];
        descripcion
          .filter((v) => v.subtipo == subtipo.subtipo && v.tipo == tipo)
          .forEach((des) => {
            let totalDescripcion = 0;
            const c: CostoFlujoMes[] = [];
            flujo.value
              .filter(
                (v) =>
                  v.subtipo == subtipo.subtipo &&
                  v.tipo == tipo &&
                  des.descripcion == v.descripcion
              )
              .forEach((element) => {
                totalTipo += parseFloat(element.monto as string);
                totalSubTipo += parseFloat(element.monto as string);
                totalDescripcion += parseFloat(element.monto as string);
                c.push({
                  descripcion: element.descripcion,
                  persona: element.persona,
                  costo: element.monto,
                  semana: element.semana,
                });
              });
            descripciones.push({
              subtipo: subtipo.subtipo,
              costo: c,
              descripcion: des.descripcion,
              costoflag: false,
              totalDescripcion: totalDescripcion,
            });
          });

       
        costosSubTipo.push({
          subtipo: subtipo.subtipo,
          descripcion: descripciones, //costo
          descripcionflag: false,
          totalSubTipo: totalSubTipo,
          informacion: subtipo.informacion,
        });
      });
    costosTipo.push({
      tipo: tipo,
      subtipo: costosSubTipo,
      subtipoflag: false,
      totalTipo: totalTipo,
    });
  });

  
  items.value = costosTipo;
}
async function previous() {
  rootStore.state.spiner = true;
  items.value = [];
  cantidadmes.value--;
  const data = {
    cantidadmes: cantidadmes.value,
    id_proveedor: filtro.value.id_proveedor,
    id_cliente: filtro.value.id_cliente,
    nro_expediente: filtro.value.nro_expediente,
  };
  await balancesStore.getListFlujoOperacionMes(data);
  formatearData();
  rootStore.state.spiner = false;
}
async function next() {
  rootStore.state.spiner = true;
  items.value = [];
  cantidadmes.value++;
  const data = {
    cantidadmes: cantidadmes.value,
    id_proveedor: filtro.value.id_proveedor,
    id_cliente: filtro.value.id_cliente,
    nro_expediente: filtro.value.nro_expediente,
  };
  await balancesStore.getListFlujoOperacionMes(data);
  formatearData();
  rootStore.state.spiner = false;
}
async function Filtrar() {
  rootStore.state.spiner = true;
  items.value = [];
  const data = {
    cantidadmes: cantidadmes.value,
    id_proveedor: filtro.value.id_proveedor,
    id_cliente: filtro.value.id_cliente,
    nro_expediente: filtro.value.nro_expediente,
  };
  await balancesStore.getListFlujoOperacionMes(data);
  formatearData();
  rootStore.state.spiner = false;
  filtroFlag.value = !filtroFlag.value;
}
async function Formatear() {
  rootStore.state.spiner = true;
  items.value = [];
  cantidadmes.value = 0;
  filtro.value.id_proveedor = "";
  filtro.value.id_cliente = "";
  filtro.value.nro_expediente = "";
  const data = {
    cantidadmes: cantidadmes.value,
    id_proveedor: filtro.value.id_proveedor,
    id_cliente: filtro.value.id_cliente,
    nro_expediente: filtro.value.nro_expediente,
  };
  await balancesStore.getListFlujoOperacionMes(data);
  formatearData();
  filtroFlag.value = !filtroFlag.value;
  rootStore.state.spiner = false;
}
function calcularTotalDescripcion({
  tipo = "",
  subtipo = "",
  semana = 0,
  descripcion = "",
}) {
  const total = flujo.value
    .filter(
      (v) =>
        v.semana == semana &&
        v.tipo == tipo &&
        v.subtipo == subtipo &&
        v.descripcion == descripcion
    )
    .reduce((total, costo) => {
      return total + parseFloat(costo.monto as string);
    }, 0);

  return parseFloat(String(total)).toFixed(2);
}
function calcularTotalSubTipo({ tipo = "", subtipo = "", semana = 0 }) {
  const total = flujo.value
    .filter(
      (v) => v.semana == semana && v.tipo == tipo && v.subtipo == subtipo
    )
    .reduce((total, costo) => {
      return total + parseFloat(costo.monto as string);
    }, 0);

  return parseFloat(String(total)).toFixed(2);
}
function calcularTotalTipo({ tipo = "", semana = 0 }) {
  const total = flujo.value
    .filter((v) => v.semana == semana && v.tipo == tipo)
    .reduce((total, costo) => {
      return total + parseFloat(costo.monto as string);
    }, 0);

  return parseFloat(String(total)).toFixed(2);
}
function getColumnWidth(proportion: number) {
  // Calcula el ancho de las columnas en función de la cantidad de fechas y la proporción deseada
  const defaultWidth = 5; // Anchura por defecto de las columnas con fechas
  const totalWidth = fechas.value.length * defaultWidth + 35; // 35 es la suma de los anchos fijos de las primeras 4 columnas + 4 botones (2 en cada extremo)

  // Calcula el ancho de cada columna en función de la proporción deseada
  return `width: ${(proportion / totalWidth) * 100}%;`;
}
function calcularTotales({ semana = 0 }) {
  let total = 0;
  flujo.value
    .filter((v) => v.semana == semana)
    .forEach((element) => {
      if (element.ingresoflag) {
        total += parseFloat(element.monto as string);
      }
      if (element.gastoflag) {
        total -= parseFloat(element.monto as string);
      }
      if (element.proyeccionflag) {
        total -= parseFloat(element.monto as string);
      }
      // if (element.ingresoflag) {
      // }
    });

  return parseFloat(String(total)).toFixed(2);
}
function calcularTotal() {
  let total = 0;
  flujo.value.forEach((element) => {
    if (element.ingresoflag) {
      total += parseFloat(element.monto as string);
    }
    if (element.gastoflag) {
      total -= parseFloat(element.monto as string);
    }
    if (element.proyeccionflag) {
      total -= parseFloat(element.monto as string);
    }
    // if (element.ingresoflag) {
    // }
  });
  return parseFloat(String(total)).toFixed(2);
}
function getFechaNombreMes({ fecha = "" }) {
  moment.locale("es");
  const fechaLetra = moment(fecha).format("LL");

  return fechaLetra;
}

onMounted(async () => {
  rootStore.state.spiner = true;
  await rootStore.dispatch("cargarClientes");
  await rootStore.dispatch("cargarProveedores");
  const data = {
    cantidadmes: cantidadmes.value,
    id_proveedor: filtro.value.id_proveedor,
    id_cliente: filtro.value.id_cliente,
    nro_expediente: filtro.value.nro_expediente,
  };
  await balancesStore.getListFlujoOperacionMes(data);
  formatearData();
  rootStore.state.spiner = false;
});
</script>

<template>
  <v-container fluid>
    <v-navigation-drawer
      v-model="filtroFlag"
      location="right"
      temporary
      
      width="20%"
    >
      <v-card min-height="80vh">
        <v-card-title
          class="d-flex align-center flex-wrap"
          primary-title
        >
          Filtrar Flujo <v-spacer />
          <v-btn
            variant="text"
            icon
            color="default"
            @click="filtroFlag = !filtroFlag"
          >
            <v-icon>mdi-close</v-icon>
          </v-btn>
        </v-card-title>
        <v-card-text>
          <v-autocomplete
            :items="rootStore.state.provedores"
            v-model="filtro.id_proveedor"
            item-title="namelong"
            item-value="id"
            clearable
            label="Proveedor"
          />
          <v-autocomplete
            :items="rootStore.state.clientes"
            v-model="filtro.id_cliente"
            item-title="namelong"
            item-value="id"
            clearable
            label="Cliente"
          />
          <v-text-field
            label="Nro. Expediente"
            id="id"
            v-model="filtro.nro_expediente"
            clearable
          />
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn
            color="success"
            @click="Filtrar()"
          >
            Filtrar
          </v-btn>
          <v-btn
            color="warning"
            @click="Formatear()"
          >
            Limpiar
          </v-btn>
          <v-btn
            color="error"
            @click="filtroFlag = !filtroFlag"
          >
            Cerrar
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-navigation-drawer>
    <v-row>
      <v-col cols="1">
        <b>Desde:</b>
      </v-col>
      <v-col cols="1">
        {{
          getFechaNombreMes({
            fecha: balancesStore.lstFlujoOperacionesMes[0]!.fecha_inicio,
          })
        }}
      </v-col>
      <v-col cols="1">
        <b>Hasta:</b>
      </v-col>
      <v-col cols="1">
        {{
          getFechaNombreMes({
            fecha: balancesStore.lstFlujoOperacionesMes[0]!.fecha_fin,
          })
        }}
      </v-col>
      <v-col offset="5">
        <v-btn
          class="mx-1"
          color="info"
          @click="filtroFlag = !filtroFlag"
        >
          Filtrar
        </v-btn>
      </v-col>
    </v-row>
    <v-row>
      <v-col cols="12">
        <v-table>
          <thead>
            <tr class="thead">
              <th :style="getColumnWidth(7)">
                CATEGORÍA
              </th>
              <th :style="getColumnWidth(10)">
                TIPO
              </th>
              <th :style="getColumnWidth(7)">
                DESCRIPCIÓN
              </th>
              <th :style="getColumnWidth(7)">
                CLIENTE/ PROVEEDOR
              </th>

              <th width="2%">
                <v-btn
                  variant="text"
                  color="default"
                  @click="previous()"
                  icon
                >
                  <v-icon size="x-large">
                    mdi-chevron-left
                  </v-icon>
                </v-btn>
              </th>
              <th
                :style="getColumnWidth(5)"
                v-for="(f, index) in fechas"
                :key="index"
              >
                {{ f }}
              </th>
              <th>TOTALES</th>
              <th width="2%">
                <v-btn
                  variant="text"
                  icon
                  color="default"
                  @click="next()"
                >
                  <v-icon size="x-large">
                    mdi-chevron-right
                  </v-icon>
                </v-btn>
              </th>
            </tr>
          </thead>
          <tbody>
            <template
              v-for="(item, index) in items"
              :key="'row-' + index"
            >
              <tr
                class="tipo"
                @dblclick="item.subtipoflag = !item.subtipoflag"
              >
                <td :colspan="5">
                  <v-btn
                    variant="text"
                    icon
                    color="default"
                    @click="item.subtipoflag = !item.subtipoflag"
                  >
                    <v-icon v-if="!item.subtipoflag">
                      mdi-plus
                    </v-icon>
                    <v-icon v-else>
                      mdi-minus-thick
                    </v-icon>
                  </v-btn>
                  {{ item.tipo }}
                </td>
                <td
                  v-for="i in balancesStore.lstFlujoOperacionesMes[0]!
                    .cantidad_semanas"
                  :key="i"
                >
                  <center>
                    {{
                      calcularTotalTipo({
                        tipo: item.tipo,
                        semana: i,
                      })
                    }}
                  </center>
                </td>
                <td>{{ parseFloat(String(item.totalTipo)).toFixed(2) }}</td>
                <td />
              </tr>
              <template
                v-for="(stipo, subIndex) in item.subtipo"
                :key="'subdetail-' + index + '-' + subIndex"
              >
                <!-- -->
                <tr
                  class="subtipo"
                  v-if="item.subtipoflag"
                  @dblclick="stipo.descripcionflag = !stipo.descripcionflag"
                >
                  <td :colspan="1" />
                  <td :colspan="4">
                    <v-btn
                      variant="text"
                      icon
                      color="default"
                      @click="stipo.descripcionflag = !stipo.descripcionflag"
                    >
                      <v-icon v-if="!stipo.descripcionflag">
                        mdi-plus
                      </v-icon>
                      <v-icon v-else>
                        mdi-minus-thick
                      </v-icon>
                    </v-btn>
                    <v-tooltip
                      location="right"
                      color="primary"
                    >
                      <template #activator="{ props }">
                        <span v-bind="props">
                          {{ stipo.subtipo }}
                        </span>
                      </template>
                      <span>
                        <!-- eslint-disable-next-line vue/no-v-html -->
                        <div v-html="stipo.informacion" />
                        <!-- {{  }} -->
                      </span>
                    </v-tooltip>
                  </td>
                  <td
                    v-for="i in balancesStore.lstFlujoOperacionesMes[0]!
                      .cantidad_semanas"
                    :key="i"
                  >
                    <center>
                      {{
                        calcularTotalSubTipo({
                          tipo: item.tipo,
                          subtipo: stipo.subtipo,
                          semana: i,
                        })
                      }}
                    </center>
                  </td>
                  <td>{{ parseFloat(String(stipo.totalSubTipo)).toFixed(2) }}</td>
                  <td>
                    <!-- {{ stipo.descripcion }} -->
                  </td>
                </tr>
                <template
                  v-for="(desc, IndexCost) in stipo.descripcion"
                  :key="'subdetail-' + index + '-' + subIndex + '-' + IndexCost"
                >
                  <tr
                    v-if="stipo.descripcionflag && item.subtipoflag"
                    class="descripcion"
                  >
                    <td colspan="2" />
                    <td colspan="2">
                      <v-btn
                        variant="text"
                        icon
                        color="default"
                        @click="desc.costoflag = !desc.costoflag"
                      >
                        <v-icon v-if="!desc.costoflag">
                          mdi-plus
                        </v-icon>
                        <v-icon v-else>
                          mdi-minus-thick
                        </v-icon>
                      </v-btn>

                      {{ desc.descripcion }}
                    </td>
                    <td />
                    <td
                      v-for="i in balancesStore
                        .lstFlujoOperacionesMes[0]!.cantidad_semanas"
                      :key="i"
                    >
                      <center>
                        {{
                          calcularTotalDescripcion({
                            tipo: item.tipo,
                            subtipo: stipo.subtipo,
                            descripcion: desc.descripcion,
                            semana: i,
                          })
                        }}
                      </center>
                    </td>
                    <td>{{ parseFloat(String(desc.totalDescripcion)).toFixed(2) }}</td>
                    <td />
                  </tr>
                  <template
                    v-for="(cost, IndexCosto) in desc.costo"
                    :key="'subdetail-' + index + '-' + subIndex + '-' + IndexCosto"
                  >
                    <tr
                      v-if="
                        stipo.descripcionflag &&
                          desc.costoflag &&
                          item.subtipoflag
                      "
                      class="details"
                    >
                      <td colspan="3" />
                      <!-- <td>{{ cost.descripcion }}</td> -->
                      <td>{{ cost.persona }}</td>
                      <td />
                      <td
                        v-for="i in balancesStore
                          .lstFlujoOperacionesMes[0]!.cantidad_semanas"
                        :key="i"
                      >
                        <center>
                          {{ cost.semana == i ? parseFloat(String(cost.costo)).toFixed(2) : "0" }}
                        </center>
                      </td>
                      <td>{{ parseFloat(String(cost.costo)).toFixed(2) }}</td>
                      <td />
                    </tr>
                  </template>
                </template>
              </template>
            </template>
            <tr class="totales">
              <td colspan="5">
                SALDOS
              </td>
              <td
                v-for="i in balancesStore.lstFlujoOperacionesMes[0]!
                  .cantidad_semanas"
                :key="i"
              >
                <center>{{ calcularTotales({ semana: i }) }}</center>
              </td>
              <td>
                {{ calcularTotal() }}
              </td>
              <td />
            </tr>
          </tbody>
        </v-table>
      </v-col>
    </v-row>
    <!-- <td
                v-for="i in balancesStore.lstFlujoOperacionesMes[0]
                  .cantidad_semanas"
                :key="i"
              >
                <center>{{ item.semana == i ? item.monto : "0" }}</center>
              </td> -->
  </v-container>
</template>

<style scoped>
.headerType {
  background: rgb(254, 255, 192);
}
.subtipo {
  background: #ffecb3 !important;
}
.tipo {
  background: #c8e6c9 !important;
}
.descripcion {
  background: #fbe3cc !important;
}
.details {
  background: #e6ffe6 !important;
  color: #333333 !important;
}
.thead th {
  font-size: 1rem;
  text-align: center;
  align-content: center;
  color: #fff !important;
  background: #009688;
}
.totales {
  background: #d7ccc8 !important;
}
</style>
