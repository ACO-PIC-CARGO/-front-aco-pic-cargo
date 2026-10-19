<script setup lang="ts">
import { onMounted, ref, watch } from "vue";
import type { BalanceMovimiento } from "@/types/balances";

interface CostoDetalle {
  proveedor?: string;
  monto: string;
  proyeccion: string;
  result: number;
}

interface SubTipoNodo {
  subtipo?: string;
  costo: CostoDetalle[];
  costoflag: boolean;
  montoSubTipo: string;
  proyeccionSubTipo: string;
  diferenciaSubTipo: string;
}

interface TipoNodo {
  tipo?: string;
  subtipo: SubTipoNodo[];
  subtipoflag: boolean;
  montoTipo: string;
  proyeccionTipo: string;
  diferenciaTipo: string;
}

interface CategoriaNodo {
  categoria?: string;
  tipo: TipoNodo[];
  tipoflag: boolean;
  monto: string;
  proyeccion: string;
  diferencia: string;
}

const props = defineProps<{ items: BalanceMovimiento[]; mes?: string }>();

const dataTable = ref<CategoriaNodo[]>([]);

const num = (valor: unknown) => parseFloat(String(valor));

function formatearDatos() {
  let categoria = props.items.map((element) => {
    return element.categoria;
  });
  categoria = categoria.filter((item, index) => {
    return categoria.indexOf(item) === index;
  });
  /**----------------------------------------- */
  const tipo = props.items
    .map((item) => ({ tipo: item.tipo, categoria: item.categoria })) // Extraer tipo y subtipo
    .filter(
      (item, index, arr) =>
        index === arr.findIndex((obj) => obj.tipo === item.tipo && obj.categoria === item.categoria),
    );

  /**----------------------------------------- */
  const subtipo = props.items
    .map((item) => ({ tipo: item.tipo, subtipo: item.subtipo })) // Extraer tipo y subtipo
    .filter(
      (item, index, arr) =>
        index === arr.findIndex((obj) => obj.tipo === item.tipo && obj.subtipo === item.subtipo),
    );

  /**----------------------------------------- */

  const costosCategoria: CategoriaNodo[] = [];

  categoria.forEach((element) => {
    const costosTipo: TipoNodo[] = [];
    tipo
      .filter((v) => v.categoria == element)
      .forEach((t) => {
        const costosSubTipo: SubTipoNodo[] = [];

        subtipo
          .filter((v) => v.tipo == t.tipo)
          .forEach((st) => {
            const c: CostoDetalle[] = [];
            props.items
              .filter((v) => v.subtipo == st.subtipo)
              .forEach((element) => {
                //   Detalle Final
                c.push({
                  proveedor: element.proveedor,
                  monto: num(element.monto).toFixed(2),
                  proyeccion: num(element.proyeccion).toFixed(2),
                  result: element.ingresoflag
                    ? num(element.monto) - num(element.proyeccion)
                    : num(element.proyeccion) - num(element.monto),
                });
              });
            costosSubTipo.push({
              subtipo: st.subtipo,
              costo: c,
              costoflag: false,
              // montoSubTipo: parseFloat(montoSubTipo).toFixed(2),
              montoSubTipo: num(
                c.reduce((total, costo) => {
                  return total + num(costo.monto);
                }, 0),
              ).toFixed(2),
              proyeccionSubTipo: num(
                c.reduce((total, costo) => {
                  return total + num(costo.proyeccion);
                }, 0),
              ).toFixed(2),

              diferenciaSubTipo: num(
                c.reduce((total, costo) => {
                  return total + num(costo.result);
                }, 0),
              ).toFixed(2),
            });
          });
        costosTipo.push({
          tipo: t.tipo,
          subtipo: costosSubTipo,
          subtipoflag: false,
          montoTipo: num(
            costosSubTipo.reduce((total, costo) => {
              return total + num(costo.montoSubTipo);
            }, 0),
          ).toFixed(2),
          proyeccionTipo: num(
            costosSubTipo.reduce((total, costo) => {
              return total + num(costo.proyeccionSubTipo);
            }, 0),
          ).toFixed(2),
          diferenciaTipo: num(
            costosSubTipo.reduce((total, costo) => {
              return total + num(costo.diferenciaSubTipo);
            }, 0),
          ).toFixed(2),
        });
      });
    costosCategoria.push({
      categoria: element,
      tipo: costosTipo,
      tipoflag: false,
      monto: num(
        costosTipo.reduce((total, costo) => {
          return total + num(costo.montoTipo);
        }, 0),
      ).toFixed(2),
      proyeccion: num(
        costosTipo.reduce((total, costo) => {
          return total + num(costo.proyeccionTipo);
        }, 0),
      ).toFixed(2),
      diferencia: num(
        costosTipo.reduce((total, costo) => {
          return total + num(costo.diferenciaTipo);
        }, 0),
      ).toFixed(2),
    });
  });
  dataTable.value = costosCategoria;
}
function calculateMonto() {
  let monto = 0;
  dataTable.value.forEach((element) => {
    switch (element.categoria) {
      case "INGRESO":
        monto += num(element.monto);
        break;
      case "GASTO":
        monto -= num(element.monto);
        break;

      default:
        break;
    }
  });
  return monto;
}
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function calculateProyeccion() {
  let monto = 0;
  dataTable.value.forEach((element) => {
    switch (element.categoria) {
      case "INGRESO":
        monto += num(element.proyeccion);
        break;
      case "GASTO":
        monto -= num(element.proyeccion);
        break;

      default:
        break;
    }
  });
  return monto;
}
function calculateDiferencia() {
  let monto = 0;
  dataTable.value.forEach((element) => {
    switch (element.categoria) {
      case "INGRESO":
        monto += num(element.diferencia);
        break;
      case "GASTO":
        monto -= num(element.diferencia);
        break;

      default:
        break;
    }
  });
  return monto;
}

onMounted(() => {
  formatearDatos();
});
watch(
  () => props.items,
  () => {
    formatearDatos();
  },
);
</script>

<template>
  <div>
    <v-table>
      <template #default>
        <thead>
          <tr>
            <th width="7%">
              <center>TIPO</center>
            </th>
            <th width="21%">
              <center>INGRESO/ GASTO</center>
            </th>
            <th width="21%">
              <center>SUBCATEGORÍA</center>
            </th>
            <th width="21%">
              <center>PROVEEDOR</center>
            </th>
            <th width="10%">
              <center>MOVIMIENTOS DEL MES {{ mes }}</center>
            </th>
            <th width="10%">
              <center>PROYECCIÓN</center>
            </th>
            <th width="10%">
              <center>RESULTADOS DEL MES</center>
            </th>
          </tr>
        </thead>
        <tbody>
          <template
            v-for="(item, index) in dataTable"
            :key="'row-' + index"
          >
            <tr
              :class="{
                categoria: true,
                'text-red': Number(item.diferencia) < 0,
              }"
            >
              <td colspan="4">
                <v-btn
                  variant="text"
                  icon
                  color="default"
                  @click="item.tipoflag = !item.tipoflag"
                >
                  <v-icon v-if="!item.tipoflag">
                    mdi-plus
                  </v-icon>
                  <v-icon v-else>
                    mdi-minus-thick
                  </v-icon>
                </v-btn>
                {{ item.categoria }}
              </td>
              <td>
                <center>{{ item.monto }}</center>
              </td>
              <td>
                <center>{{ item.proyeccion }}</center>
              </td>
              <td>
                <center>{{ item.diferencia }}</center>
              </td>
            </tr>
            <template v-for="(subItem, subIndex) in item.tipo">
              <!-- -->
              <tr
                v-if="item.tipoflag"
                :key="'subdetail-' + index + '-' + subIndex"
                :class="{ tipo: true, 'text-red': Number(subItem.diferenciaTipo) < 0 }"
              >
                <td />
                <td>
                  <v-btn
                    variant="text"
                    icon
                    color="default"
                    @click="subItem.subtipoflag = !subItem.subtipoflag"
                  >
                    <v-icon v-if="!subItem.subtipoflag">
                      mdi-plus
                    </v-icon>
                    <v-icon v-else>
                      mdi-minus-thick
                    </v-icon>
                  </v-btn>
                  {{ subItem.tipo }}
                </td>
                <td colspan="2" />
                <td>
                  <center>{{ subItem.montoTipo }}</center>
                </td>
                <td>
                  <center>{{ subItem.proyeccionTipo }}</center>
                </td>
                <td>
                  <center>{{ subItem.diferenciaTipo }}</center>
                </td>
              </tr>
              <template v-for="(stipo, subIndexTipo) in subItem.subtipo">
                <!-- -->
                <tr
                  v-if="subItem.subtipoflag && item.tipoflag"
                  :class="{
                    subtipo: true,
                    'text-red': Number(stipo.diferenciaSubTipo) < 0,
                  }"
                  :key="
                    'subdetail-' + index + '-' + subIndex + '-' + subIndexTipo
                  "
                >
                  <td colspan="2" />
                  <td>
                    <v-btn
                      variant="text"
                      icon
                      color="default"
                      @click="stipo.costoflag = !stipo.costoflag"
                    >
                      <v-icon v-if="!stipo.costoflag">
                        mdi-plus
                      </v-icon>
                      <v-icon v-else>
                        mdi-minus-thick
                      </v-icon>
                    </v-btn>
                    {{ stipo.subtipo }}
                  </td>
                  <td />
                  <td>
                    <center>{{ stipo.montoSubTipo }}</center>
                  </td>
                  <td>
                    <center>{{ stipo.proyeccionSubTipo }}</center>
                  </td>
                  <td>
                    <center>{{ stipo.diferenciaSubTipo }}</center>
                  </td>
                </tr>
                <template v-for="(cost, IndexCost) in stipo.costo">
                  <tr
                    v-if="
                      stipo.costoflag && subItem.subtipoflag && item.tipoflag
                    "
                    :class="{ costo: true, 'text-red': cost.result < 0 }"
                    :key="
                      'subdetail-' +
                        index +
                        '-' +
                        subIndex +
                        '-' +
                        subIndexTipo +
                        '-' +
                        IndexCost
                    "
                  >
                    <td colspan="3" />
                    <td>{{ cost.proveedor }}</td>
                    <td>
                      <center>{{ parseFloat(cost.monto).toFixed(2) }}</center>
                    </td>
                    <td>
                      <center>
                        {{ parseFloat(cost.proyeccion).toFixed(2) }}
                      </center>
                    </td>
                    <td>
                      <center>{{ parseFloat(String(cost.result)).toFixed(2) }}</center>
                    </td>
                  </tr>
                </template>
              </template>
            </template>
          </template>
          <tr
            :class="{
              totales: true,
            }"
          >
            <td colspan="4">
              TOTALES
            </td>
            <td>
              <center>
                {{ parseFloat(String(calculateMonto())).toFixed(2) }}
              </center>
            </td>
            <td />
            <td>
              <center>
                {{ parseFloat(String(calculateDiferencia())).toFixed(2) }}
              </center>
            </td>
          </tr>
        </tbody>
      </template>
    </v-table>
    <!-- <v-data-table
      :headers="headers"
      :items="items"
      class="elevation-1"
      item-key="index"
      loading="true"
    >
    </v-data-table> -->
  </div>
</template>

<style scoped>
.costo {
  background: #b2ebf2 !important;
}
.subtipo {
  background: #c8e6c9 !important;
}
.tipo {
  background: #ffecb3 !important;
}
.categoria {
  background: #c5cae9 !important;
}
.totales {
  background: #bdbdbd !important;
  font-weight: bold;
  /* color: #fff !important; */
}
thead {
  text-align: center;
}

th {
  text-align: center;
}
.text-red {
  color: red !important;
}
</style>
