<template>
  <v-container fluid>
    <v-navigation-drawer
      v-model="filtroFlag"
      location="right"
      temporary
      
      width="20%"
    >
      <v-card min-height="80vh">
        <v-card-title class="d-flex align-center flex-wrap" primary-title>
          Filtrar Flujo <v-spacer></v-spacer>
          <v-btn variant="text" icon color="default" @click="filtroFlag = !filtroFlag">
            <v-icon>mdi-close</v-icon>
          </v-btn>
        </v-card-title>
        <v-card-text>
          <v-autocomplete
            :items="$store.state.provedores"
            v-model="filtro.id_proveedor"
            item-title="namelong"
            item-value="id"
            clearable
            label="Proveedor"
          ></v-autocomplete>
          <v-autocomplete
            :items="$store.state.clientes"
            v-model="filtro.id_cliente"
            item-title="namelong"
            item-value="id"
            clearable
            label="Cliente"
          ></v-autocomplete>
          <v-text-field
            label="Nro. Expediente"
            id="id"
            v-model="filtro.nro_expediente"
            clearable
          ></v-text-field>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="success" @click="Filtrar()">Filtrar</v-btn>
          <v-btn color="warning" @click="Formatear()">Limpiar</v-btn>
          <v-btn color="error" @click="filtroFlag = !filtroFlag">Cerrar</v-btn>
        </v-card-actions>
      </v-card>
    </v-navigation-drawer>
    <v-row>
      <v-col cols="1"> <b>Desde:</b> </v-col>
      <v-col cols="1">
        {{
          getFechaNombreMes({
            fecha: balancesStore.lstFlujoOperacionesMes[0].fecha_inicio,
          })
        }}
      </v-col>
      <v-col cols="1"> <b>Hasta:</b> </v-col>
      <v-col cols="1">
        {{
          getFechaNombreMes({
            fecha: balancesStore.lstFlujoOperacionesMes[0].fecha_fin,
          })
        }}
      </v-col>
      <v-col offset="5">
        <v-btn class="mx-1" color="info" @click="filtroFlag = !filtroFlag"
          >Filtrar</v-btn
        >
      </v-col>
    </v-row>
    <v-row>
      <v-col cols="12">
        <v-table>
          <thead>
            <tr class="thead">
              <th :style="getColumnWidth(7)">CATEGORÍA</th>
              <th :style="getColumnWidth(10)">TIPO</th>
              <th :style="getColumnWidth(7)">DESCRIPCIÓN</th>
              <th :style="getColumnWidth(7)">CLIENTE/ PROVEEDOR</th>

              <th width="2%">
                <v-btn variant="text" color="default" @click="previous()" icon>
                  <v-icon size="x-large">mdi-chevron-left</v-icon>
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
                <v-btn variant="text" icon color="default" @click="next()">
                  <v-icon size="x-large">mdi-chevron-right</v-icon>
                </v-btn>
              </th>
            </tr>
          </thead>
          <tbody>
            <template v-for="(item, index) in items" :key="'row-' + index">
              <tr
                class="tipo"
                @dblclick="item.subtipoflag = !item.subtipoflag"
              >
                <td :colspan="5">
                  <v-btn variant="text"
                    icon
                    color="default"
                    @click="item.subtipoflag = !item.subtipoflag"
                  >
                    <v-icon v-if="!item.subtipoflag">mdi-plus</v-icon>
                    <v-icon v-else>mdi-minus-thick</v-icon>
                  </v-btn>
                  {{ item.tipo }}
                </td>
                <td
                  v-for="i in balancesStore.lstFlujoOperacionesMes[0]
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
                <td>{{ parseFloat(item.totalTipo).toFixed(2) }}</td>
                <td></td>
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
                  <td :colspan="1"></td>
                  <td :colspan="4">
                    <v-btn variant="text"
                      icon
                      color="default"
                      @click="stipo.descripcionflag = !stipo.descripcionflag"
                    >
                      <v-icon v-if="!stipo.descripcionflag">mdi-plus</v-icon>
                      <v-icon v-else>mdi-minus-thick</v-icon>
                    </v-btn>
                    <v-tooltip location="right" color="primary">
                      <template v-slot:activator="{ props }">
                        <span v-bind="props">
                          {{ stipo.subtipo }}
                        </span>
                      </template>
                      <span>
                        <div v-html="stipo.informacion"></div>
                        <!-- {{  }} -->
                      </span>
                    </v-tooltip>
                  </td>
                  <td
                    v-for="i in balancesStore.lstFlujoOperacionesMes[0]
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
                  <td>{{ parseFloat(stipo.totalSubTipo).toFixed(2) }}</td>
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
                    <td colspan="2"></td>
                    <td colspan="2">
                      <v-btn variant="text"
                        icon
                        color="default"
                        @click="desc.costoflag = !desc.costoflag"
                      >
                        <v-icon v-if="!desc.costoflag">mdi-plus</v-icon>
                        <v-icon v-else>mdi-minus-thick</v-icon>
                      </v-btn>

                      {{ desc.descripcion }}
                    </td>
                    <td></td>
                    <td
                      v-for="i in balancesStore
                        .lstFlujoOperacionesMes[0].cantidad_semanas"
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
                    <td>{{ parseFloat(desc.totalDescripcion).toFixed(2) }}</td>
                    <td></td>
                  </tr>
                  <template
                    v-for="(cost, IndexCost) in desc.costo"
                    :key="'subdetail-' + index + '-' + subIndex + '-' + IndexCost"
                  >
                    <tr
                      v-if="
                        stipo.descripcionflag &&
                        desc.costoflag &&
                        item.subtipoflag
                      "
                      class="details"
                    >
                      <td colspan="3"></td>
                      <!-- <td>{{ cost.descripcion }}</td> -->
                      <td>{{ cost.persona }}</td>
                      <td></td>
                      <td
                        v-for="i in balancesStore
                          .lstFlujoOperacionesMes[0].cantidad_semanas"
                        :key="i"
                      >
                        <center>
                          {{ cost.semana == i ? parseFloat(cost.costo).toFixed(2) : "0" }}
                        </center>
                      </td>
                      <td>{{ parseFloat(cost.costo).toFixed(2) }}</td>
                      <td></td>
                    </tr>
                  </template>
                </template>
              </template>
            </template>
            <tr class="totales">
              <td colspan="5">SALDOS</td>
              <td
                v-for="i in balancesStore.lstFlujoOperacionesMes[0]
                  .cantidad_semanas"
                :key="i"
              >
                <center>{{ calcularTotales({ semana: i }) }}</center>
              </td>
              <td>
                {{ calcularTotal() }}
              </td>
              <td></td>
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

<script>
import { mapActions } from "vuex";
import moment from "moment";
import { mapActions as mapPiniaActions, mapStores } from "pinia";
import { useBalancesStore } from "@/stores/balances";
export default {
  data: () => ({
    cantidadmes: 0,
    items: [],
    fechas: [],
    flujo: [],
    filtroFlag: false,
    items: [],
    filtro: {
      id_proveedor: "",
      id_cliente: "",
      nro_expediente: "",
    },
    //
  }),
  computed: {
    ...mapStores(useBalancesStore),
  },
  methods: {
    ...mapActions([
      "cargarClientes",
      "cargarProveedores",
    ]),
    ...mapPiniaActions(useBalancesStore, ["getListFlujoOperacionMes"]),
    formatearData() {
      let vm = this;
      vm.flujo = this.balancesStore.lstFlujoOperacionesMes[0].flujo;
      vm.fechas = vm.balancesStore.lstFlujoOperacionesMes[0].fechahasta;

      let tipos = this.flujo.map((element) => {
        return element.tipo;
      });
      tipos = tipos.filter((item, index) => {
        return tipos.indexOf(item) === index;
      });

      // ------------------------------
      let subtipos = this.flujo
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
      let descripcion = this.flujo
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

      let costosTipo = [];
      tipos.forEach((tipo) => {
        let costosSubTipo = [];
        let totalTipo = 0;
        subtipos
          .filter((v) => v.tipo == tipo)
          .forEach((subtipo) => {
            let totalSubTipo = 0;

            let descripciones = [];
            descripcion
              .filter((v) => v.subtipo == subtipo.subtipo && v.tipo == tipo)
              .forEach((des) => {
                let totalDescripcion = 0;
                let c = [];
                this.flujo
                  .filter(
                    (v) =>
                      v.subtipo == subtipo.subtipo &&
                      v.tipo == tipo &&
                      des.descripcion == v.descripcion
                  )
                  .forEach((element) => {
                    totalTipo += parseFloat(element.monto);
                    totalSubTipo += parseFloat(element.monto);
                    totalDescripcion += parseFloat(element.monto);
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

      
      this.items = costosTipo;
    },
    async previous() {
      this.$store.state.spiner = true;
      this.items = [];
      this.cantidadmes--;
      let data = {
        cantidadmes: this.cantidadmes,
        id_proveedor: this.filtro.id_proveedor,
        id_cliente: this.filtro.id_cliente,
        nro_expediente: this.filtro.nro_expediente,
      };
      await this.getListFlujoOperacionMes(data);
      this.formatearData();
      this.$store.state.spiner = false;
    },
    async next() {
      this.$store.state.spiner = true;
      this.items = [];
      this.cantidadmes++;
      let data = {
        cantidadmes: this.cantidadmes,
        id_proveedor: this.filtro.id_proveedor,
        id_cliente: this.filtro.id_cliente,
        nro_expediente: this.filtro.nro_expediente,
      };
      await this.getListFlujoOperacionMes(data);
      this.formatearData();
      this.$store.state.spiner = false;
    },

    async Filtrar() {
      this.$store.state.spiner = true;
      this.items = [];
      let data = {
        cantidadmes: this.cantidadmes,
        id_proveedor: this.filtro.id_proveedor,
        id_cliente: this.filtro.id_cliente,
        nro_expediente: this.filtro.nro_expediente,
      };
      await this.getListFlujoOperacionMes(data);
      this.formatearData();
      this.$store.state.spiner = false;
      this.filtroFlag = !this.filtroFlag;
    },
    async Formatear() {
      this.$store.state.spiner = true;
      this.items = [];
      this.cantidadmes = 0;
      this.filtro.id_proveedor = "";
      this.filtro.id_cliente = "";
      this.filtro.nro_expediente = "";
      let data = {
        cantidadmes: this.cantidadmes,
        id_proveedor: this.filtro.id_proveedor,
        id_cliente: this.filtro.id_cliente,
        nro_expediente: this.filtro.nro_expediente,
      };
      await this.getListFlujoOperacionMes(data);
      this.formatearData();
      this.filtroFlag = !this.filtroFlag;
      this.$store.state.spiner = false;
    },

    calcularTotalDescripcion({
      tipo = "",
      subtipo = "",
      semana = 0,
      descripcion = "",
    }) {
      let total = this.flujo
        .filter(
          (v) =>
            v.semana == semana &&
            v.tipo == tipo &&
            v.subtipo == subtipo &&
            v.descripcion == descripcion
        )
        .reduce((total, costo) => {
          return total + parseFloat(costo.monto);
        }, 0);

      return parseFloat(total).toFixed(2);
    },
    calcularTotalSubTipo({ tipo = "", subtipo = "", semana = 0 }) {
      let total = this.flujo
        .filter(
          (v) => v.semana == semana && v.tipo == tipo && v.subtipo == subtipo
        )
        .reduce((total, costo) => {
          return total + parseFloat(costo.monto);
        }, 0);

      return parseFloat(total).toFixed(2);
    },
    calcularTotalTipo({ tipo = "", semana = 0 }) {
      let total = this.flujo
        .filter((v) => v.semana == semana && v.tipo == tipo)
        .reduce((total, costo) => {
          return total + parseFloat(costo.monto);
        }, 0);

      return parseFloat(total).toFixed(2);
    },
    getColumnWidth(proportion) {
      // Calcula el ancho de las columnas en función de la cantidad de fechas y la proporción deseada
      const defaultWidth = 5; // Anchura por defecto de las columnas con fechas
      const totalWidth = this.fechas.length * defaultWidth + 35; // 35 es la suma de los anchos fijos de las primeras 4 columnas + 4 botones (2 en cada extremo)

      // Calcula el ancho de cada columna en función de la proporción deseada
      return `width: ${(proportion / totalWidth) * 100}%;`;
    },
    calcularTotales({ semana = 0 }) {
      let total = 0;
      this.flujo
        .filter((v) => v.semana == semana)
        .forEach((element) => {
          if (element.ingresoflag) {
            total += parseFloat(element.monto);
          }
          if (element.gastoflag) {
            total -= parseFloat(element.monto);
          }
          if (element.proyeccionflag) {
            total -= parseFloat(element.monto);
          }
          // if (element.ingresoflag) {
          // }
        });

      return parseFloat(total).toFixed(2);
    },
    calcularTotal() {
      let total = 0;
      this.flujo.forEach((element) => {
        if (element.ingresoflag) {
          total += parseFloat(element.monto);
        }
        if (element.gastoflag) {
          total -= parseFloat(element.monto);
        }
        if (element.proyeccionflag) {
          total -= parseFloat(element.monto);
        }
        // if (element.ingresoflag) {
        // }
      });
      return parseFloat(total).toFixed(2);
    },
    getFechaNombreMes({ fecha = "" }) {
      moment.locale("es");
      let fechaLetra = moment(fecha).format("LL");

      return fechaLetra;
    },
  },
  async mounted() {
    this.$store.state.spiner = true;
    await this.cargarClientes();
    await this.cargarProveedores();
    let data = {
      cantidadmes: this.cantidadmes,
      id_proveedor: this.filtro.id_proveedor,
      id_cliente: this.filtro.id_cliente,
      nro_expediente: this.filtro.nro_expediente,
    };
    await this.getListFlujoOperacionMes(data);
    this.formatearData();
    this.$store.state.spiner = false;
  },
};
</script>

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
