<template>
  <v-container fluid class="contenedor-scroll">
    <v-row>
      <v-col cols="12">
        <v-row align="center">
          <v-col cols="6">
            <v-text-field
              label="Buscar...."
              v-model="search"
              hide-details
            ></v-text-field>
          </v-col>
          <v-spacer></v-spacer>
          <v-col cols="auto">
            <v-btn small color="info" class="mr-2" @click="abrirFiltro">
              <v-icon small>mdi-filter</v-icon> Filtrar</v-btn
            >
            <v-btn small color="default" @click="Limpiar">
              <v-icon small>mdi-close</v-icon> Limpiar</v-btn
            >
          </v-col>
        </v-row>
      </v-col>
      <v-col cols="12">
        <v-data-table
          :search="search"
          :headers="headersCabecera"
          :items="$store.state.reportes.listDetalle"
        >
          <template v-slot:[`item.action`]="{ item }">
            <v-btn
              v-if="!!item.urlfile"
              icon
              :href="item.urlfile"
              target="_blank"
            >
              <v-icon>mdi-file</v-icon>
            </v-btn>
          </template>
        </v-data-table>
      </v-col>
    </v-row>

    <v-navigation-drawer
      absolute
      permanent
      temporary
      right
      width="20%"
      v-if="dialogFiltro"
    >
      <v-card height="100%" elevation="10">
        <v-card-title primary-title> Filtrar Gastos </v-card-title>
        <v-card-text>
          <v-select
            :items="cuentas"
            v-model="filtro.id_cuenta"
            label="Cuenta Bancaria (PIC)"
            item-text="label"
            item-value="id"
            clearable
          >
          </v-select>
          <v-autocomplete
            :items="$store.state.provedores"
            v-model="filtro.id_proveedor"
            label="Proveedor"
            item-text="namelong"
            item-value="id"
            clearable
          >
          </v-autocomplete>

          <v-text-field
            clearable
            label="Nro Operacion"
            v-model="filtro.nro_operacion"
          >
          </v-text-field>

          <v-text-field
            clearable
            label="Nro Expediente"
            v-model="filtro.nro_exp"
          >
          </v-text-field>
          <v-text-field
            clearable
            type="number"
            label="Monto"
            v-model="filtro.monto"
          >
          </v-text-field>
          <FormatFecha id="filtroDesde" v-model="filtro.desde" />
          <FormatFecha id="filtroHasta" v-model="filtro.hasta" />
          <!-- <v-text-field v-model="filtro.hasta" label="Fecha Hasta" type="date">
          </v-text-field> -->
          <v-checkbox v-model="filtro.operativo" label="Operativo"></v-checkbox>
          <v-checkbox
            v-model="filtro.administrativo"
            label="Administrativo"
          ></v-checkbox>
        </v-card-text>
        <v-card-actions>
          <v-spacer> </v-spacer>
          <v-btn color="success" @click="filtrar()" text>Aceptar</v-btn>
          <v-btn color="red" @click="dialogFiltro = !dialogFiltro" text
            >Cancelar</v-btn
          >
        </v-card-actions>
      </v-card>
    </v-navigation-drawer>
  </v-container>
</template>

<script>
import moment from "moment";
import { mapActions } from "vuex";
import FormatFecha from "../comun/FormatFecha.vue";
import axios from "axios";
export default {
  components: {
    FormatFecha,
  },
  data() {
    return {
      search: "",
      headersCabecera: [
        { text: "F. Reg.", value: "create_at" },
        { text: "F. Op.", value: "fecha_pago" },
        { text: "Nro Operación", value: "nro_operacion" },
        { text: "Tipo", value: "tipo_pago" },
        { text: "Tipo", value: "tipo_pago" },
        { text: "Exp/ Tipo Gasto", value: "tipo_gasto" },
        { text: "Exp/ SubTipo Gasto", value: "subtipo_gasto" },
        { text: "Cuenta Salida", value: "banco" },
        { text: "Proveedor	", value: "name_proveedor" },
        { text: "Monto (USD)	", value: "monto_dolar" },
        { text: "Monto	", value: "monto_mon_ex" },
        { text: "Moneda	", value: "moneda_simbolo" },
        { text: "Comentarios", value: "comentarios" },
        { text: "Accion", value: "action" },
      ],
      list: [],
      dialogFiltro: false,
      filtro: {
        desde: "",
        hasta: "",
        nro_operacion: "",
        id_cuenta: "",
        id_proveedor: "",
        monto: "",
        id_moneda: "",
        nro_exp: "",
        nro_factura: "",
        nro_serie: "",
        tipogastos: "",
        tiposubgastos: "",
        operativo: true,
        administrativo: true,
      },
      cuentas: [],
    };
  },
  async mounted() {
    this.filtro.desde = moment().startOf("month").format("YYYY-MM-DD");
    this.filtro.hasta = moment().format("YYYY-MM-DD");

    await this.getListarBancosgastosDetalles(this.filtro);
    await this.getListBanksDetailsCargar();
  },
  methods: {
    ...mapActions(["getListarBancosgastosDetalles"]),
    async getListBanksDetailsCargar() {
      let vm = this;
      var config = {
        method: "get",
        url: process.env.VUE_APP_URL_MAIN + "getListBanksDetailsCargar",
        params: {
          id_branch: JSON.parse(sessionStorage.getItem("dataUser"))[0]
            .id_branch,
        },
        headers: {
          "auth-token": sessionStorage.getItem("auth-token"),
          "Content-Type": "application/json",
        },
      };
      await axios(config)
        .then(function (response) {
          vm.cuentas = response.data.data;
        })
        .catch(function (error) {
          console.log(error);
        });
    },
    abrirFiltro() {
      this.dialogFiltro = true;
    },
    async filtrar() {
      await this.getListarBancosgastosDetalles(this.filtro);
      this.dialogFiltro = false;
    },
    async Limpiar() {
      this.filtro = {
        desde: "",
        hasta: "",
        nro_operacion: "",
        id_cuenta: "",
        id_proveedor: "",
        monto: "",
        id_moneda: "",
        nro_factura: "",
        nro_serie: "",
        tipogastos: "",
        tiposubgastos: "",
        nro_exp: "",
        operativo: true,
        administrativo: true,
      };
      await this.getListarBancosgastosDetalles(this.filtro);
      this.dialogFiltro = false;
    },
  },
};
</script>

<style></style>
