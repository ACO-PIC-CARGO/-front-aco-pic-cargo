<script setup lang="ts">
import { onMounted, ref } from "vue";
import moment from "moment";
import { useStore } from "vuex";
import { useEntitiesStore } from "@/stores/entities";
import type { FlujoPrePostMovimiento } from "@/types/balances";

interface FlujoCosto {
  mesfiltro?: number | string;
  mes?: number | string;
  anio?: number | string;
  persona?: string;
  expediente?: string;
  monto?: number | string | null;
}

interface FlujoTipo {
  tipo?: string;
  costoflag: boolean;
  monto: string;
  costos: FlujoCosto[];
}

interface FlujoCategoria {
  categoria?: string;
  tipo: FlujoTipo[];
  tipoflag: boolean;
  monto: string;
}

const props = defineProps<{ year?: number | string; month?: string | string[] }>();

const rootStore = useStore();
const entitiesStore = useEntitiesStore();

const filtrar = ref(false);
const dataTable = ref<FlujoCategoria[]>([]);
const totales = ref(0);
const filtro = ref({
  year: "" as number | string | undefined,
  month: "" as string | string[] | undefined,
  ingresosflag: true,
  gastoflag: true,
  anteriorflag: true,
  posterioflag: true,
  mes: "06,07,08,09",
  anio: "2023",
  expediente: "",
  id_persona: "",
  monto: "" as number | string,
});
const items = ref<FlujoPrePostMovimiento[]>([]);

const num = (valor: unknown) => parseFloat(String(valor));

async function filtraFlujo() {
  rootStore.state.spiner = true;
  await rootStore.dispatch("getFlujoPrePostMes", filtro.value);

  items.value = rootStore.state.balances.flujoprepostmes;
  generarData();
  filtrar.value = false;
  rootStore.state.spiner = false;
}
function generarData() {
  let categoria = items.value.map((element) => {
    return element.categoria;
  });
  categoria = categoria.filter((item, index) => {
    return categoria.indexOf(item) === index;
  });
  /**----------------------------------------- */
  const tipo = items.value
    .map((item) => ({ tipo: item.tipo, categoria: item.categoria })) // Extraer tipo y subtipo
    .filter(
      (item, index, arr) =>
        index === arr.findIndex((obj) => obj.tipo === item.tipo && obj.categoria === item.categoria),
    );
  const costosFlujo: FlujoCategoria[] = [];
  categoria.forEach((cat) => {
    const costosTipo: FlujoTipo[] = [];
    tipo
      .filter((v) => v.categoria == cat)
      .forEach((t) => {
        const c: FlujoCosto[] = [];
        items.value
          .filter((v) => v.tipo == t.tipo && v.categoria == cat)
          .forEach((element) => {
            //   Detalle Final

            if (element.ingresoflag == true) {
              totales.value = num(totales.value) + num(element.monto);
            }
            if (element.gastoflag == true) {
              totales.value = num(totales.value) - num(element.monto);
            }
            c.push({
              mesfiltro: element.mesfiltro,
              mes: element.mes,
              anio: element.anio,
              persona: element.persona,
              expediente: element.expediente,
              monto: element.monto,
            });
          });
        costosTipo.push({
          tipo: t.tipo,
          costoflag: false,
          monto: num(
            c.reduce((total, costo) => {
              return total + num(costo.monto);
            }, 0),
          ).toFixed(2),
          costos: c,
        });
      });
    costosFlujo.push({
      categoria: cat,
      tipo: costosTipo,
      tipoflag: false,
      monto: num(
        costosTipo.reduce((total, costo) => {
          return total + num(costo.monto);
        }, 0),
      ).toFixed(2),
    });
  });
  dataTable.value = costosFlujo;
}
function nombreMes(mes: number | string | undefined) {
  moment.locale("es");
  let nombreMes = moment(mes, "MM").format("MMMM");
  nombreMes = nombreMes.charAt(0).toUpperCase() + nombreMes.slice(1);
  return nombreMes;
}

onMounted(() => {
  // let data = {
  //   year: this.year,
  //   month: this.meses,
  // };
  filtro.value.year = props.year;
  filtro.value.month = props.month;
  // this.$store.state.spiner = true;
  // await this.getFlujoPrePostMes(this.filtro);
  items.value = rootStore.state.balances.flujoprepostmes;
  generarData();
  // this.$store.state.spiner = false;
});
</script>

<template>
  <v-container fluid>
    <v-dialog
      v-model="filtrar"
      persistent
      width="50%"
    >
      <v-card>
        <v-card-title
          primary-title
          class="text-headline-small"
        >
          Filtrar Ingresos/ Gastos - Anteriores/Posteriores
        </v-card-title>
        <v-card-text>
          <v-row>
            <!-- ingresosflag -->
            <v-col cols="6">
              <v-switch
                density="compact"
                v-model="filtro.ingresosflag"
                label="Ingresos"
                hide-details
              />
            </v-col>
            <!-- gastoflag -->
            <v-col cols="6">
              <v-switch
                density="compact"
                v-model="filtro.gastoflag"
                label="Gastos"
                hide-details
              />
            </v-col>
          </v-row>
          <v-divider />
          <v-row>
            <!-- anteriorflag -->
            <v-col cols="6">
              <v-switch
                density="compact"
                color="orange-darken-3"
                v-model="filtro.anteriorflag"
                label="Anteriores"
                hide-details
              />
            </v-col>
            <!-- posterioflag -->
            <v-col cols="6">
              <v-switch
                density="compact"
                color="orange-darken-3"
                v-model="filtro.posterioflag"
                label="Posteriores"
                hide-details
              />
            </v-col>
            <v-col
              cols="6"
              class="py-1 my-1"
            >
              <v-text-field
                label="Expediente"
                v-model="filtro.expediente"
                clearable
                density="compact"
                step="1"
              />
            </v-col>
            <v-col
              cols="6"
              class="py-1 my-1"
            >
              <v-text-field
                type="number"
                label="Monto"
                v-model="filtro.monto"
                clearable
                density="compact"
                step="0.01"
              />
            </v-col>
            <v-col
              cols="12"
              class="py-1 my-1"
            >
              <v-autocomplete
                label="Proveedor"
                :items="entitiesStore.persona"
                v-model="filtro.id_persona"
                auto-select-first
                clearable
                density="compact"
                item-title="namelong"
                item-value="id"
              />
            </v-col>
          </v-row>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn
            size="small"
            color="success"
            @click="filtraFlujo()"
          >
            Aceptar
          </v-btn>
          <v-btn
            size="small"
            color="red"
            @click="filtrar = !filtrar"
          >
            Cerrar
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-card>
      <v-card-title class="d-flex align-center flex-wrap">
        <v-spacer />
        <v-btn
          size="small"
          color="#00789D"
          @click="filtrar = !filtrar"
        >
          Filtrar
        </v-btn>
      </v-card-title>
      <v-card-text>
        <v-table>
          <template #default>
            <thead>
              <tr>
                <th width="15%">
                  <center>CATEGORÍA</center>
                </th>
                <th width="15%">
                  <center>TIPO</center>
                </th>
                <th width="10%">
                  <center>MES FILTRO</center>
                </th>
                <th width="10%">
                  <center>MES (PRE/POST)</center>
                </th>
                <th width="10%">
                  <center>AÑO (PRE/POST)</center>
                </th>
                <th width="15%">
                  <center>EXPEDIENTE</center>
                </th>
                <th width="15%">
                  <center>CLIENTE/ PROVEEDOR</center>
                </th>
                <th width="10%">
                  <center>MONTO (USD)</center>
                </th>
              </tr>
            </thead>
            <tbody>
              <template
                v-for="(item, index) in dataTable"
                :key="'row-' + index"
              >
                <tr class="categoria">
                  <td colspan="7">
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
                </tr>
                <template v-for="(t, subIndex) in item.tipo">
                  <tr
                    class="tipo"
                    v-if="item.tipoflag"
                    :key="'subdetail-' + index + '-' + subIndex"
                  >
                    <td />
                    <td colspan="6">
                      <v-btn
                        variant="text"
                        icon
                        color="default"
                        @click="t.costoflag = !t.costoflag"
                      >
                        <v-icon v-if="!t.costoflag">
                          mdi-plus
                        </v-icon>
                        <v-icon v-else>
                          mdi-minus-thick
                        </v-icon>
                      </v-btn>{{ t.tipo }}
                    </td>
                    <td>
                      <center>{{ t.monto }}</center>
                    </td>
                  </tr>
                  <template v-for="(c, subIndexTipo) in t.costos">
                    <!-- -->
                    <tr
                      class="costo"
                      v-if="item.tipoflag && t.costoflag"
                      :key="
                        'subdetail-' +
                          index +
                          '-' +
                          subIndex +
                          '-' +
                          subIndexTipo
                      "
                    >
                      <td colspan="2" />
                      <td>
                        <center>{{ nombreMes(c.mesfiltro) }}</center>
                      </td>
                      <td>
                        <center>{{ nombreMes(c.mes) }}</center>
                      </td>
                      <td>
                        <center>{{ c.anio }}</center>
                      </td>
                      <td>
                        <center>{{ c.expediente }}</center>
                      </td>
                      <td>{{ c.persona }}</td>
                      <td>
                        <center>{{ c.monto }}</center>
                      </td>
                    </tr>
                  </template>
                </template>
              </template>
              <tr
                :class="{
                  totales: true,
                  'text-red': totales < 0,
                }"
              >
                <td colspan="7">
                  Total
                </td>
                <td>
                  <center>{{ parseFloat(String(totales)).toFixed(2) }}</center>
                </td>
              </tr>
            </tbody>
          </template>
        </v-table>
      </v-card-text>
      <!--  -->
    </v-card>
  </v-container>
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
.drawer-oculto {
  visibility: hidden;
}
.totales {
  background: #bdbdbd !important;
  font-weight: bold;
  /* color: #fff !important; */
}
.text-red {
  color: red !important;
}
thead {
  text-align: center;
}
</style>
