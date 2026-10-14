<template>
  <v-container fluid>
    <v-card>
      <v-card-title class="d-flex align-center flex-wrap">
        Datos Principales:
        <v-spacer></v-spacer>
        <b :style="{ fontSize: textSize }">{{ totalfinal }} USD</b>
      </v-card-title>
      <v-card-text>
        <v-col cols="12">
          <v-form ref="frmProyeccion">
            <v-row>
              <v-col cols="12" md="2">
                <v-select
                  :items="$store.state.month"
                  v-model="id_month"
                  label="Mes"
                  density="compact"
                  item-title="description"
                  item-value="id"
                  :rules="[(v) => !!v || 'Dato requerido']"
                ></v-select>
              </v-col>

              <v-col cols="12" md="2">
                <v-select
                  :items="Array.isArray($store.state.year) ? $store.state.year : []"
                  v-model="id_year"
                  label="Año"
                  density="compact"
                  item-title="description"
                  item-value="id"
                  :rules="[(v) => !!v || 'Dato requerido']"
                ></v-select>
              </v-col>

              <v-col cols="12" md="2">
                <v-text-field
                  v-model="tipocambio"
                  label="Tipo Cambio"
                  density="compact"
                  v-on:blur="calcularTotalTipoCambio()"
                  :rules="[(v) => !!v || 'Dato requerido']"
                ></v-text-field>
              </v-col>
              <v-col cols="12" md="3">
                <v-text-field
                  v-model="totalmonlocal"
                  :label="`Total Proyectado(${monExt})`"
                  density="compact"
                  readonly
                ></v-text-field>
              </v-col>
              <v-col cols="12" md="3">
                <v-text-field
                  v-model="montoconversiondolar"
                  label="Conversión a Dolares(USD)"
                  density="compact"
                  readonly
                ></v-text-field>
              </v-col>
              <v-col cols="12" md="3" offset-md="9">
                <v-text-field
                  v-model="totaldolar"
                  label="Gastos(USD)"
                  density="compact"
                  readonly
                ></v-text-field>
              </v-col>

              <v-col cols="12" md="3" offset-md="9">
                <v-text-field
                  v-model="totalfinal"
                  :label="`Total Proyectado(${monExt})`"
                  density="compact"
                  readonly
                ></v-text-field>
              </v-col>
            </v-row>
          </v-form>
        </v-col>
        <v-col cols="12" v-if="!!tipocambio">
          <v-data-table
            :headers="headers"
            :items="items"
            class="elevation-1"
            item-value="index"
            disable-sort
          >
            <template v-slot:[`item.gasto`]="{ item }">
              <v-select
                :items="
                  $store.state.balances.tipogastos.filter((v) => v.id != 0)
                "
                placeholder="Tipo de Gasto"
                v-model="item.id_gasto"
                density="compact"
                item-title="description"
                item-value="id"
                :error-messages="item.errgasto"
              ></v-select>
            </template>
            <template v-slot:[`item.subgasto`]="{ item }">
              <v-select
                :items="
                  $store.state.balances.tiposubgastos.filter(
                    (subgasto) => subgasto.id_gasto === item.id_gasto
                  )
                "
                v-model="item.id_tiposubgasto"
                density="compact"
                placeholder="Subtipo de Gasto"
                item-title="description"
                item-value="id"
                :disabled="!item.id_gasto"
                :error-messages="item.errsubgasto"
              ></v-select>
            </template>
            <template v-slot:[`item.proveedor`]="{ item }">
              <v-autocomplete
                :items="$store.state.itemsProveedorList"
                v-model="item.id_entitie"
                item-title="namelong"
                placeholder="Proveedor"
                item-value="id"
                density="compact"
                :error-messages="item.errproveedor"
              ></v-autocomplete>
            </template>
            <template v-slot:[`item.descripcion`]="{ item }">
              <v-textarea
                density="compact"
                placeholder="Descripcion"
                v-model="item.description"
                rows="1"
              ></v-textarea>
            </template>
            <template v-slot:[`item.montomonoriginal`]="{ item }">
              <v-text-field
                placeholder="Monto Moneda Local"
                v-model="item.monto_monlocal"
                type="number"
                :disabled="!item.id_coin"
                @keydown.enter="agregarFila(item)"
                v-on:blur="calcularMontoFinal(item)"
                :error-messages="item.errmontomonoriginal"
              ></v-text-field>
            </template>
            <template v-slot:[`item.moneda`]="{ item }">
              <v-select
                :items="$store.state.itemsCoinsList"
                item-title="symbol"
                v-model="item.id_coin"
                label="Moneda"
                item-value="id"
                @update:model-value="calcularMontoFinal(item)"
                :disabled="!item.id_entitie"
                :error-messages="item.errmoneda"
              ></v-select>
            </template>
            <template v-slot:[`item.montofinaldolar`]="{ item }">
              {{ item.monto_monext }}
            </template>
            <template v-slot:[`item.diavencimiento`]="{ item }">
              <v-select item-title="text"
                :items="dias"
                v-model="item.nrodias"
                label="Día de vencimiento"
                :error-messages="item.errrnodias"
              ></v-select>
            </template>
            <template v-slot:[`item.action`]="{ item }">
              <v-btn icon color="red" @click="eliminarfila(item)">
                <v-icon>mdi-delete</v-icon>
              </v-btn>
            </template>
          </v-data-table>
        </v-col>
      </v-card-text>
    </v-card>
    <v-card-actions>
      <v-spacer></v-spacer>
      <v-btn size="small" class="mx-1" color="success" @click="registrar()" rounded
        >Registrar</v-btn
      >
      <v-btn size="small" class="mx-1" color="red" @click="volver()" rounded
        >Cancelar</v-btn
      >
      <!-- <v-btn small class="mx-1" color="info" rounded>APROBAR</v-btn> -->
    </v-card-actions>
  </v-container>
</template>

<script>
import { mapActions } from "vuex";
export default {
  data() {
    return {
      monExt: "",
      textSize: "2rem",
      headers: [
        { title: "Tipo de Gasto", key: "gasto", width: "10%" },
        { title: "Tipo de Subgasto", key: "subgasto", width: "10%" },
        { title: "Proveedor", key: "proveedor", width: "10%" },
        { title: "Descripción", key: "descripcion", width: "10%" },
        { title: "Día Vencimiento", key: "diavencimiento", width: "10%" },
        { title: "Moneda", key: "moneda", width: "10%" },
        {
          title: "Monto Moneda Original",
          key: "montomonoriginal",
          width: "10%",
        },
        { title: "Monto Final en USD", key: "montofinaldolar", width: "10%" },
        { title: "Acciones", key: "action", width: "10%" },
      ],
      dias: [
        { value: 1, text: "01" },
        { value: 2, text: "02" },
        { value: 3, text: "03" },
        { value: 4, text: "04" },
        { value: 5, text: "05" },
        { value: 6, text: "06" },
        { value: 7, text: "07" },
        { value: 8, text: "08" },
        { value: 9, text: "09" },
        { value: 10, text: "10" },
        { value: 11, text: "11" },
        { value: 12, text: "12" },
        { value: 13, text: "13" },
        { value: 14, text: "14" },
        { value: 15, text: "15" },
        { value: 16, text: "16" },
        { value: 17, text: "17" },
        { value: 18, text: "18" },
        { value: 19, text: "19" },
        { value: 20, text: "20" },
        { value: 21, text: "21" },
        { value: 22, text: "22" },
        { value: 23, text: "23" },
        { value: 24, text: "24" },
        { value: 25, text: "25" },
        { value: 26, text: "26" },
        { value: 27, text: "27" },
        { value: 28, text: "28" },
      ],
      items: [],
      mes: [],
      anio: [],
      moneda: [],
      id_month: "",
      id_year: "",
      id_coin: "",
      tipocambio: "",
      totalmonlocal: 0.0,
      montoconversiondolar: 0.0,
      totaldolar: 0.0,
      totalfinal: 0.0,
    };
  },
  methods: {
    ...mapActions([
      "_getCoinsList",
      "_getProveedor",
      "getCargarTipoGastos",
      "getCargarTipoSubGastos",
      "_getChargeMonth",
      "_getChargeYear",
      "setProyeccion",
    ]),
    agregarFila(item) {
      let data = {
        id_gasto: "",
        id_tiposubgasto: "",
        id_entitie: "",
        id_coin: "",
        description: "",
        monto_monlocal: 0.0,
        monto_monext: 0.0,
      };
      this.items.push(data);

      this.calcularMontoFinal(item);
      this.calcularTotales(item);
    },

    calcularMontoFinal(item) {
      let symbol = this.$store.state.itemsCoinsList.filter(
        (v) => v.id == item.id_coin
      )[0].symbol;
      if (symbol != "USD") {
        item.monto_monext = parseFloat(
          item.monto_monlocal / this.tipocambio
        ).toFixed(2);
      } else {
        item.monto_monext = parseFloat(item.monto_monlocal).toFixed(2);
      }
      this.calcularTotales();
    },

    calcularTotales() {
      let monto_monext = 0;
      let montolocal = 0;
      let totalmonlocal = 0;
      let totalfinal = 0;
      let id_dolar = this.$store.state.itemsCoinsList.filter(
        (v) => v.symbol == "USD"
      )[0].id;
      this.items
        .filter((v) => v.id_coin == id_dolar)
        .forEach((element) => {
          monto_monext += parseFloat(element.monto_monext);
        });
      this.items
        .filter((v) => v.id_coin != id_dolar)
        .forEach((element) => {
          montolocal += parseFloat(element.monto_monext);
          totalmonlocal += parseFloat(element.monto_monlocal);
        });
      this.items.forEach((element) => {
        totalfinal += parseFloat(element.monto_monext);
      });
      this.totaldolar = parseFloat(monto_monext).toFixed(2);
      this.montoconversiondolar = parseFloat(montolocal).toFixed(2);
      this.totalmonlocal = parseFloat(totalmonlocal).toFixed(2);
      this.totalfinal = parseFloat(totalfinal).toFixed(2);
    },
    calcularTotalTipoCambio() {
      let symbol = "";
      this.items.forEach((item) => {
        if (item.id_coin) {
          symbol = this.$store.state.itemsCoinsList.filter(
            (v) => v.id == item.id_coin
          )[0].symbol;
          if (symbol != "USD") {
            item.monto_monext = parseFloat(
              item.monto_monlocal / this.tipocambio
            ).toFixed(2);
          } else {
            item.monto_monext = parseFloat(item.monto_monlocal).toFixed(2);
          }
        }
      });

      this.calcularTotales();
    },
    eliminarfila(item) {
      const index = this.items.indexOf(item);
      if (index > 0) {
        this.items.splice(index, 1);
      }
      if (index == 0) {
        this.items[0].id_gasto = "";
        this.items[0].id_tiposubgasto = "";
        this.items[0].id_entitie = "";
        this.items[0].id_coin = "";
        this.items[0].description = "";
        this.items[0].monto_monlocal = "";
        this.items[0].monto_monext = "";
      }
      this.calcularTotales();
    },
    async registrar() {
      let validaciondetails = true;
      let data = {};
      if ((await this.$refs.frmProyeccion.validate()).valid) {
        this.items.forEach((item) => {
          if (!item.id_gasto) {
            item.errgasto = ["Dato Requerido"];
            validaciondetails = false;
          } else {
            item.errgasto = "";
          }
          if (!item.id_tiposubgasto) {
            item.errsubgasto = ["Dato Requerido"];
            validaciondetails = false;
          } else {
            item.errsubgasto = "";
          }
          if (!item.id_entitie) {
            item.errproveedor = ["Dato Requerido"];
            validaciondetails = false;
          } else {
            item.errproveedor = "";
          }
          if (!item.id_coin) {
            item.errmoneda = ["Dato Requerido"];
            validaciondetails = false;
          } else {
            item.errmoneda = "";
          }
          if (!item.monto_monlocal) {
            item.errmontomonoriginal = ["Dato Requerido"];
            validaciondetails = false;
          } else {
            item.errmontomonoriginal = "";
          }
          if (!item.nrodias) {
            item.errrnodias = ["Dato Requerido"];
            validaciondetails = false;
          } else {
            item.errrnodias = "";
          }
        });
      }
      this.$forceUpdate();
      if (!!validaciondetails) {
        let vm = this;
        data = {
          id_branch: JSON.parse(sessionStorage.getItem("dataUser"))[0]
            .id_branch,
          id_month: vm.id_month,
          id_year: vm.id_year,
          id_user: JSON.parse(sessionStorage.getItem("dataUser"))[0].id_user,
          tipocambio: vm.tipocambio,
          total_monlocal: vm.totalmonlocal,
          total_conversionext: vm.montoconversiondolar,
          total_monext: vm.totaldolar,
          total_proyectado_ext: vm.totalfinal,

          details: vm.items,
        };
        await vm.setProyeccion(data);
      }
    },
    volver() {
      this.$router.go(-1);
    },
  },

  async mounted() {
    this.monExt = this.moneda = JSON.parse(
      sessionStorage.getItem("dataBranch")
    )[0].moneda[0].symbol;
    this.$store.state.spiner = true;
    if (this.items.length == 0) {
      let data = {
        id_gasto: "",
        id_tiposubgasto: "",
        id_entitie: "",
        id_coin: "",
        description: "",
        monto_monlocal: 0,
        monto_monext: 0.0,
      };
      this.items.push(data);
    }
    await this._getCoinsList();
    await this._getProveedor();
    await this.getCargarTipoGastos();
    await this.getCargarTipoSubGastos();
    await this._getChargeYear();
    await this._getChargeMonth();
    this.$store.state.spiner = false;
    this.$store.state.drawer = false;
  },
};
</script>

<style scoped>
.importante {
  font-size: 10rem;
}
</style>
