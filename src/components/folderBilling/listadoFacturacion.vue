<template>
  <div class="">
    <v-data-table
      :headers="headers"
      :items="lstFac"
      item-key="id"
      loading="true"
      :search="search"
      ><template v-slot:top>
        <v-text-field
          v-model="search"
          label="Buscar...."
          class="mx-4"
        ></v-text-field>
      </template>
      <template v-slot:[`item.url`]="{ item }">
        <v-btn color="red" @click="verFactura(item.url)" icon>
          <v-icon>mdi-file-pdf-box</v-icon></v-btn
        >
        <v-btn
          color="red"
          @click="eliminar(item)"
          icon
          v-if="item.estatus == 1"
        >
          <v-icon>mdi-cancel</v-icon></v-btn
        >
      </template>
    </v-data-table>
  </div>
</template>

<script>
import axios from '@/api/axios-config';;
import { mapActions } from 'vuex';
export default {
  name: "lstFacturacionComponent",
  data() {
    return {
      search: "",
      lstFac: [],
      headers: [
        {
          text: "Correlativo",
          value: "correlativo",
          align: "start",
          sortable: false,
        },

        {
          text: "Expediente",
          value: "nro_master",
          align: "start",
          sortable: true,
        },
        { text: "Cliente", value: "cliente", align: "start", sortable: true },
        {
          text: "Origen",
          value: "pais_origen",
          align: "start",
          sortable: true,
        },
        {
          text: "Destino",
          value: "pais_destino",
          align: "start",
          sortable: true,
        },

        {
          text: "Shipment",
          value: "shipment",
          align: "start",
          sortable: true,
        },
        {
          text: "Moneda",
          value: "symbol",
          align: "start",
          sortable: true,
        },
        {
          text: "Monto",
          value: "total_monto",
          align: "start",
          sortable: false,
        },
        {
          text: "IGV",
          value: "total_igv",
          align: "start",
          sortable: false,
        },
        { text: "Total", value: "total", align: "start", sortable: false },
        { text: "Estado", value: "estado", align: "start", sortable: false },
        { text: "Acciones", value: "url", align: "start", sortable: false },
      ],
    };
  },
  async mounted() {
    await this.listadoFacturacion();
    await this.obtenerImpuestoXEmpresa();
    this.headers[8].text = this.$store.state.enterprises.impuesto.nombre_impuesto
  },
  methods: {
    ...mapActions(["obtenerImpuestoXEmpresa"]),
    async listadoFacturacion() {
      let data = {
        id_branch: JSON.parse(sessionStorage.getItem("dataUser"))[0].id_branch,
      };
      let vm = this;
      var config = {
        method: "get",
        url:
          process.env.VUE_APP_URL_MAIN +
          "listar_Factura/" +
          JSON.parse(sessionStorage.getItem("dataUser"))[0].id_branch,

        headers: {
         
          "Content-Type": "application/json",
        },
        data: data,
      };
      await axios(config).then((response) => {
        vm.lstFac = response.data.data;
      });
    },

    verFactura(url) {
      window.open(url);
    },
    filterOnlyCapsText(value, search) {
      let text = search ? search.toLocaleUpperCase() : null;
      return (
        value != null &&
        search != null &&
        typeof value === "string" &&
        value.toString().toLocaleUpperCase().indexOf(text) !== -1
      );
    },

    async eliminar(data) {
      let vm = this;

      vm.$swal({
        icon: "question",
        title: "ADVERTENCIA",
        html: `Deseas <b>ANULAR</b> el correlativo con número <b>${data.correlativo}</b> perteneciente al cliente <b> ${data.cliente} </b>`,
        showConfirmButton: true,
        showCancelButton: true,
        confirmButtonText: "Eliminar",
      }).then((result) => {
        if (result.isConfirmed) {
          let datos = {
            id: data.id,
          };
          var config = {
            method: "put",
            url: process.env.VUE_APP_URL_MAIN + "anular_factura",

            headers: {
             
              "Content-Type": "application/json",
            },
            data: datos,
          };
          axios(config).then((response) => {
            vm.$swal("Deleted!", "Factura Anulada.", "success");
            vm.listadoFacturacion();
          });
        }
      });
    },
  },
};
</script>

<style></style>
