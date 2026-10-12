<template>
  <v-container fluid>
    <v-dialog v-model="filtrar" persistent width="50%">
      <v-card>
        <v-card-title primary-title class="text-h6">
          Filtrar Ingresos/ Gastos - Anteriores/Posteriores
        </v-card-title>
        <v-card-text>
          <v-row>
            <!-- ingresosflag -->
            <v-col cols="6">
              <v-switch
                dense
                v-model="filtro.ingresosflag"
                label="Ingresos"
                hide-details
              ></v-switch>
            </v-col>
            <!-- gastoflag -->
            <v-col cols="6">
              <v-switch
                dense
                v-model="filtro.gastoflag"
                label="Gastos"
                hide-details
              ></v-switch>
            </v-col>
          </v-row>
          <v-divider></v-divider>
          <v-row>
            <!-- anteriorflag -->
            <v-col cols="6">
              <v-switch
                dense
                color="orange darken-3"
                v-model="filtro.anteriorflag"
                label="Anteriores"
                hide-details
              ></v-switch>
            </v-col>
            <!-- posterioflag -->
            <v-col cols="6">
              <v-switch
                dense
                color="orange darken-3"
                v-model="filtro.posterioflag"
                label="Posteriores"
                hide-details
              ></v-switch>
            </v-col>
            <v-col cols="6" class="py-1 my-1">
              <v-text-field
                label="Expediente"
                v-model="filtro.expediente"
                clearable
                dense
                step="1"
              ></v-text-field>
            </v-col>
            <v-col cols="6" class="py-1 my-1">
              <v-text-field
                type="number"
                label="Monto"
                v-model="filtro.monto"
                clearable
                dense
                step="0.01"
              ></v-text-field>
            </v-col>
            <v-col cols="12" class="py-1 my-1">
              <v-autocomplete
                label="Proveedor"
                :items="$store.state.entities.persona"
                v-model="filtro.id_persona"
                auto-select-first
                clearable
                dense
                item-text="namelong"
                item-value="id"
              ></v-autocomplete>
            </v-col>
          </v-row>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn small color="success" @click="filtraFlujo()">Aceptar</v-btn>
          <v-btn small dark color="red" @click="filtrar = !filtrar"
            >Cerrar</v-btn
          >
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-card>
      <v-card-title>
        <v-spacer></v-spacer>
        <v-btn small color="#00789D" dark @click="filtrar = !filtrar"
          >Filtrar</v-btn
        >
      </v-card-title>
      <v-card-text>
        <v-simple-table>
          <template v-slot:default>
            <thead>
              <tr>
                <th width="15%"><center>CATEGORÍA</center></th>
                <th width="15%"><center>TIPO</center></th>
                <th width="10%"><center>MES FILTRO</center></th>
                <th width="10%"><center>MES (PRE/POST)</center></th>
                <th width="10%"><center>AÑO (PRE/POST)</center></th>
                <th width="15%"><center>EXPEDIENTE</center></th>
                <th width="15%"><center>CLIENTE/ PROVEEDOR</center></th>
                <th width="10%">
                  <center>MONTO (USD)</center>
                </th>
              </tr>
            </thead>
            <tbody>
              <template v-for="(item, index) in dataTable" :key="'row-' + index">
                <tr class="categoria">
                  <td colspan="7">
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
                </tr>
                <template v-for="(t, subIndex) in item.tipo">
                  <tr
                    class="tipo"
                    v-if="item.tipoflag"
                    :key="'subdetail-' + index + '-' + subIndex"
                  >
                    <td></td>
                    <td colspan="6">
                      <v-btn
                        icon
                        color="default"
                        @click="t.costoflag = !t.costoflag"
                      >
                        <v-icon v-if="!t.costoflag">mdi-plus</v-icon>
                        <v-icon v-else>mdi-minus-thick</v-icon> </v-btn
                      >{{ t.tipo }}
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
                      <td colspan="2"></td>
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
                <td colspan="7">Total</td>
                <td>
                  <center>{{ parseFloat(totales).toFixed(2) }}</center>
                </td>
              </tr>
            </tbody>
          </template>
        </v-simple-table>
      </v-card-text>
      <!--  -->
    </v-card>
  </v-container>
</template>

<script>
import moment from "moment";
import { mapActions } from "vuex";
export default {
  props: ["year", "month"],
  data: () => ({
    filtrar: false,
    dataTable: [],
    totales: 0,
    filtro: {
      year: "",
      month: "",
      ingresosflag: true,
      gastoflag: true,
      anteriorflag: true,
      posterioflag: true,
      mes: "06,07,08,09",
      anio: "2023",
      expediente: "",
      id_persona: "",
      monto: "",
    },
    items: [],
  }),
  async mounted() {
    // let data = {
    //   year: this.year,
    //   month: this.meses,
    // };
    this.filtro.year = this.year;
    this.filtro.month = this.month;
    // this.$store.state.spiner = true;
    // await this.getFlujoPrePostMes(this.filtro);
    this.items = this.$store.state.balances.flujoprepostmes;
    this.generarData();
    // this.$store.state.spiner = false;
  },

  methods: {
    ...mapActions(["getFlujoPrePostMes"]),
    async filtraFlujo() {
      let vm = this;
      vm.$store.state.spiner = true;
      await vm.getFlujoPrePostMes(vm.filtro);
    
      vm.items = vm.$store.state.balances.flujoprepostmes;
      vm.generarData();
      vm.filtrar = false;
      vm.$store.state.spiner = false;
    },
    generarData() {
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
      let costosFlujo = [];
      categoria.forEach((cat) => {
        let costosTipo = [];
        tipo
          .filter((v) => v.categoria == cat)
          .forEach((t) => {
            let c = [];
            this.items
              .filter((v) => v.tipo == t.tipo && v.categoria == cat)
              .forEach((element) => {
                //   Detalle Final

                if (element.ingresoflag == true) {
                  this.totales =
                    parseFloat(this.totales) + parseFloat(element.monto);
                }
                if (element.gastoflag == true) {
                  this.totales =
                    parseFloat(this.totales) - parseFloat(element.monto);
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
              monto: parseFloat(
                c.reduce((total, costo) => {
                  return total + parseFloat(costo.monto);
                }, 0)
              ).toFixed(2),
              costos: c,
            });
          });
        costosFlujo.push({
          categoria: cat,
          tipo: costosTipo,
          tipoflag: false,
          monto: parseFloat(
            costosTipo.reduce((total, costo) => {
              return total + parseFloat(costo.monto);
            }, 0)
          ).toFixed(2),
        });
      });
      this.dataTable = costosFlujo;
    },
    nombreMes(mes) {
      moment.locale("es");
      let nombreMes = moment(mes, "MM").format("MMMM");
      nombreMes = nombreMes.charAt(0).toUpperCase() + nombreMes.slice(1);
      return nombreMes;
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
.drawer-oculto {
  visibility: hidden;
}
.totales[data-v-10da2a35] {
  background: #bdbdbd !important;
  font-weight: bold;
  /* color: #fff !important; */
}
.text-red {
  color: red !important;
}
.text-red[data-v-10da2a35] {
  color: red !important;
}
thead {
  text-align: center;
}
</style>
