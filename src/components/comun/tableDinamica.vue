<template>
  <div>
    <v-table>
      <template v-slot:default>
        <thead>
          <tr>
            <th width="7%"><center>TIPO</center></th>
            <th width="21%"><center>INGRESO/ GASTO</center></th>
            <th width="21%"><center>SUBCATEGORÍA</center></th>
            <th width="21%"><center>PROVEEDOR</center></th>
            <th width="10%">
              <center>MOVIMIENTOS DEL MES {{ mes }}</center>
            </th>
            <th width="10%"><center>PROYECCIÓN</center></th>
            <th width="10%"><center>RESULTADOS DEL MES</center></th>
          </tr>
        </thead>
        <tbody>
          <template v-for="(item, index) in dataTable" :key="'row-' + index">
            <tr
              :class="{
                categoria: true,
                'text-red': item.diferencia < 0,
              }"
            >
              <td colspan="4">
                <v-btn
                  icon
                  color="default"
                  @click="item.tipoflag = !item.tipoflag"
                >
                  <v-icon v-if="!item.tipoflag">mdi-plus</v-icon>
                  <v-icon v-else>mdi-minus-thick</v-icon>
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
                :class="{ tipo: true, 'text-red': subItem.diferenciaTipo < 0 }"
              >
                <td></td>
                <td>
                  <v-btn
                    icon
                    color="default"
                    @click="subItem.subtipoflag = !subItem.subtipoflag"
                  >
                    <v-icon v-if="!subItem.subtipoflag">mdi-plus</v-icon>
                    <v-icon v-else>mdi-minus-thick</v-icon>
                  </v-btn>
                  {{ subItem.tipo }}
                </td>
                <td colspan="2"></td>
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
                    'text-red': stipo.diferenciaSubTipo < 0,
                  }"
                  :key="
                    'subdetail-' + index + '-' + subIndex + '-' + subIndexTipo
                  "
                >
                  <td colspan="2"></td>
                  <td>
                    <v-btn
                      icon
                      color="default"
                      @click="stipo.costoflag = !stipo.costoflag"
                    >
                      <v-icon v-if="!stipo.costoflag">mdi-plus</v-icon>
                      <v-icon v-else>mdi-minus-thick</v-icon>
                    </v-btn>
                    {{ stipo.subtipo }}
                  </td>
                  <td></td>
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
                    <td colspan="3"></td>
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
                      <center>{{ parseFloat(cost.result).toFixed(2) }}</center>
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
            <td colspan="4">TOTALES</td>
            <td>
              <center>
                {{ parseFloat(calculateMonto()).toFixed(2) }}
              </center>
            </td>
            <td></td>
            <td>
              <center>
                {{ parseFloat(calculateDiferencia()).toFixed(2) }}
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

<script>
export default {
  props: ["items", "mes"],
  data: () => ({
    headers: [
      { text: "categoria", value: "categoria" },
      { text: "tipo", value: "tipo" },
      { text: "subtipo", value: "subtipo" },
      { text: "proveedor", value: "proveedor" },
      { text: "monto", value: "monto" },
      { text: "proyeccion", value: "proyeccion" },
      { text: "Resultado Mes", value: "result" },
    ],

    dataTable: [],
  }),
  mounted() {
    this.formatearDatos();
  },
  methods: {
    formatearDatos() {
      let categoria = this.items.map((element) => {
        return element.categoria;
      });
      categoria = categoria.filter((item, index) => {
        return categoria.indexOf(item) === index;
      });
      /**----------------------------------------- */
      let tipo = this.items
        .map((item) => ({ tipo: item.tipo, categoria: item.categoria })) // Extraer tipo y subtipo
        .filter(
          (item, index, arr) =>
            index ===
            arr.findIndex(
              (obj) =>
                obj.tipo === item.tipo && obj.categoria === item.categoria
            )
        );

      /**----------------------------------------- */
      let subtipo = this.items
        .map((item) => ({ tipo: item.tipo, subtipo: item.subtipo })) // Extraer tipo y subtipo
        .filter(
          (item, index, arr) =>
            index ===
            arr.findIndex(
              (obj) => obj.tipo === item.tipo && obj.subtipo === item.subtipo
            )
        );

      /**----------------------------------------- */

      let costosCategoria = [];

      categoria.forEach((element) => {
        let costosTipo = [];
        tipo
          .filter((v) => v.categoria == element)
          .forEach((t) => {
            let costosSubTipo = [];

            subtipo
              .filter((v) => v.tipo == t.tipo)
              .forEach((st) => {
                let c = [];
                this.items
                  .filter((v) => v.subtipo == st.subtipo)
                  .forEach((element) => {
                    //   Detalle Final
                    c.push({
                      proveedor: element.proveedor,
                      monto: parseFloat(element.monto).toFixed(2),
                      proyeccion: parseFloat(element.proyeccion).toFixed(2),
                      result: !!element.ingresoflag
                        ? parseFloat(element.monto) -
                          parseFloat(element.proyeccion)
                        : parseFloat(element.proyeccion) -
                          parseFloat(element.monto),
                    });
                  });
                costosSubTipo.push({
                  subtipo: st.subtipo,
                  costo: c,
                  costoflag: false,
                  // montoSubTipo: parseFloat(montoSubTipo).toFixed(2),
                  montoSubTipo: parseFloat(
                    c.reduce((total, costo) => {
                      return total + parseFloat(costo.monto);
                    }, 0)
                  ).toFixed(2),
                  proyeccionSubTipo: parseFloat(
                    c.reduce((total, costo) => {
                      return total + parseFloat(costo.proyeccion);
                    }, 0)
                  ).toFixed(2),

                  diferenciaSubTipo: parseFloat(
                    c.reduce((total, costo) => {
                      return total + parseFloat(costo.result);
                    }, 0)
                  ).toFixed(2),
                });
              });
            costosTipo.push({
              tipo: t.tipo,
              subtipo: costosSubTipo,
              subtipoflag: false,
              montoTipo: parseFloat(
                costosSubTipo.reduce((total, costo) => {
                  return total + parseFloat(costo.montoSubTipo);
                }, 0)
              ).toFixed(2),
              proyeccionTipo: parseFloat(
                costosSubTipo.reduce((total, costo) => {
                  return total + parseFloat(costo.proyeccionSubTipo);
                }, 0)
              ).toFixed(2),
              diferenciaTipo: parseFloat(
                costosSubTipo.reduce((total, costo) => {
                  return total + parseFloat(costo.diferenciaSubTipo);
                }, 0)
              ).toFixed(2),
            });
          });
        costosCategoria.push({
          categoria: element,
          tipo: costosTipo,
          tipoflag: false,
          monto: parseFloat(
            costosTipo.reduce((total, costo) => {
              return total + parseFloat(costo.montoTipo);
            }, 0)
          ).toFixed(2),
          proyeccion: parseFloat(
            costosTipo.reduce((total, costo) => {
              return total + parseFloat(costo.proyeccionTipo);
            }, 0)
          ).toFixed(2),
          diferencia: parseFloat(
            costosTipo.reduce((total, costo) => {
              return total + parseFloat(costo.diferenciaTipo);
            }, 0)
          ).toFixed(2),
        });
      });
      this.dataTable = costosCategoria;
    },
    calculateMonto() {
      let monto = 0;
      this.dataTable.forEach((element) => {
        switch (element.categoria) {
          case "INGRESO":
            monto += parseFloat(element.monto);
            break;
          case "GASTO":
            monto -= parseFloat(element.monto);
            break;

          default:
            break;
        }
      });
      return monto;
    },
    calculateProyeccion() {
      let monto = 0;
      this.dataTable.forEach((element) => {
        switch (element.categoria) {
          case "INGRESO":
            monto += parseFloat(element.proyeccion);
            break;
          case "GASTO":
            monto -= parseFloat(element.proyeccion);
            break;

          default:
            break;
        }
      });
      return monto;
    },
    calculateDiferencia() {
      let monto = 0;
      this.dataTable.forEach((element) => {
        switch (element.categoria) {
          case "INGRESO":
            monto += parseFloat(element.diferencia);
            break;
          case "GASTO":
            monto -= parseFloat(element.diferencia);
            break;

          default:
            break;
        }
      });
      return monto;
    },
  },
  watch: {
    items() {
      this.formatearDatos();
    },
  },
};
</script>

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
.totales[data-v-a30aadea] {
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
.text-red[data-v-a30aadea] {
  color: red !important;
}
</style>
