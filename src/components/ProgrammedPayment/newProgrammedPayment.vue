<template>
  <v-card elevation="2">
    <v-card-title primary-title> REGISTRO DE NUEVA PROGRAMACIÓN </v-card-title>
    <v-card-text>
      <div class="col-12" v-if="listado.length > 0">
        <v-card-title primary-title>
          Ya existe(n) programación(es):
        </v-card-title>
        <v-card-subtitle primary-title>
          Desea asociar a alguna fecha de programación, seleccione una, sino
          puede seleccionar su propia fecha.
        </v-card-subtitle>
        <v-data-table
          :headers="headers"
          :items="listado"
          class="elevation-1"
          item-key="id"
          :single-select="true"
          show-select
          v-model="selected"
          :items-per-page="5"
          @input="validarSeleccionado()"
        >
        </v-data-table>
      </div>
      <div class="col-4">
        <v-text-field
          label="Fecha de programación"
          v-model="fecha"
          type="date"
        ></v-text-field>
      </div>
    </v-card-text>
    <v-card-actions>
      <v-btn color="success" @click="guardar">Registrar</v-btn>
      <v-btn color="warning" @click="cerrarModal">CancelarSH</v-btn>
    </v-card-actions>
  </v-card>
</template>

<script>
import axios from '@/api/axios-config';
import moment from "moment";
export default {
  props: ["id", "tipo", "id_master", "id_proveedor"],
  name: "newProgrammedPayment",
  data: () => ({
    headers: [
      {
        text: "Correlativo",
        value: "correlativo",
      },
      {
        text: "Fecha Programada",
        value: "fecha",
      },
    ],
    listado: [],
    selected: [],
    fecha: moment(new Date()).add(7, "days").format("YYYY-MM-DD"),
  }),
  //   data: () => ({}),
  async mounted() {
    this.$store.state.spiner = true;
    await this.ListProgrammedPayment();
    this.$store.state.spiner = false;
  },
  methods: {
    async ListProgrammedPayment() {
      let data = {
        id_branch: JSON.parse(sessionStorage.getItem("dataUser"))[0].id_branch,
      };
      var vm = this;
      var config = {
        method: "get",
        url: process.env.VUE_APP_URL_MAIN + "ListProgrammedPayment",

        headers: {
          "auth-token": sessionStorage.getItem("auth-token"),
          "Content-Type": "application/json",
        },
        data: data,
      };
      await axios(config)
        .then(function (response) {
          vm.listado = response.data.data;
        })
        .catch(function (error) {
          console.log(error);
        });
    },

    validarSeleccionado() {
      this.fecha = this.selected[0].fecha;
    },

    cerrarModal() {
      let vm = this;
      vm.$emit("cerrar", false);
    },
    async guardar() {
      var vm = this;
      let data = {
        id: this.selected.length > 0 ? this.selected[0].id : 0,
        nuevoflag: this.selected.length > 0 ? false : true,
        id_detailspayinvoicecxp: vm.tipo == 0 ? vm.id : null,
        id_controlgastosegresos: vm.tipo == 1 ? vm.id : null,
        fecha: vm.fecha,
        controlgastoegreso: vm.tipo == 1 ? true : false,
        id_master: vm.id_master,
        id_proveedor: vm.id_proveedor,
        STATUS: true,
        id_branch: JSON.parse(sessionStorage.getItem("dataUser"))[0].id_branch,
      };
      var config = {
        method: "post",
        url: process.env.VUE_APP_URL_MAIN + "setProgrammedPayment",
        headers: {
          "auth-token": sessionStorage.getItem("auth-token"),
          "Content-Type": "application/json",
        },
        data: data,
      };
      await axios(config)
        .then(function (response) {
          vm.ListProgrammedPayment();
          vm.$store.state.refreshReport = !vm.$store.state.refreshReport;
          vm.$swal("Registro Correcto");
          vm.$emit("cerrar", false);
        })
        .catch(function (error) {
          console.log(error);
        });
    },
  },
  watch: {
    id: function () {
      this.ListProgrammedPayment();
      this.selected = [];
    },
  },
};
</script>

<style></style>
