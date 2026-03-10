<template>
  <div>
    <v-card elevation="10">
      <v-card-title>
        <v-btn
          color="primary"
          elevation="0"
          dark
          rounded
          class="mb-2 ml-5"
          @click.native="statusDialog = !statusDialog"
        >
          NUEVO CONTROL
        </v-btn>
        <v-spacer></v-spacer>

        <v-text-field
          v-model="search"
          append-icon="mdi-magnify"
          label="Buscar"
          single-line
          hide-details
        ></v-text-field>
      </v-card-title>
      <v-container v-if="!$store.state.dataGastos" style="height: 400px">
        <v-row class="fill-height" align-content="center" justify="center">
          <v-col class="text-subtitle-1 text-center" cols="12">
            Cargando informacíon
          </v-col>
          <v-col cols="6">
            <v-progress-linear
              color="deep-purple accent-4"
              indeterminate
              rounded
              height="6"
            ></v-progress-linear>
          </v-col>
        </v-row>
      </v-container>
      <v-data-table
        v-if="$store.state.dataGastos"
        :headers="headers"
        :items="itemsDataControlList"
        :search="search"
      >
        <template v-slot:[`item.actions`]="{ item }">
          <v-icon
            large
            color="blue"
            class="mr-2"
            @click="verControlGasto(item)"
          >
            mdi-eye
          </v-icon>
          <v-icon
            large
            color="#FFD600"
            class="mr-2"
            @click="abrirCaperta(item)"
          >
            mdi-folder
          </v-icon>
          <v-icon
            large
            color="orange"
            class="mr-2"
            @click="editControlGasto(item)"
          >
            mdi-pencil
          </v-icon>
        </template>
      </v-data-table>
      <v-container>
        <v-row>
          <v-col>
            <v-btn v-if="statusReport" color="primary" elevation="0"
              >GENERAR REPORTE</v-btn
            >
          </v-col>
        </v-row>
      </v-container>
    </v-card>

    <modalListHouse :dialog="statusDialog" />
    <GuardarUrlMaster
      :dialogUrl="dialogUrl"
      :masterEditar="masterEditar"
      @cerrar="cerrarDialog"
    />
  </div>
</template>
<script>
import { mapState, mapActions } from "vuex";
import modalListHouse from "@/components/modal/modalListFile";
import GuardarUrlMaster from "../comun/GuardarUrlMaster.vue";
import Swal from "sweetalert2";
export default {
  name: "listMasterCom",
  components: {
    modalListHouse,
    GuardarUrlMaster,
  },
  props: {
    statusReport: Boolean,
  },
  data() {
    return {
      dialogUrl: false,
      url_folderonedrive: "",
      search: "",
      masterEditar: {},
      statusDialog: false,

      headers: [
        { text: "Master", value: "code_master" },
        // {
        //   text: "Codigo",
        //   align: "start",
        //   value: "code_control",
        // },

        { text: "Versión", value: "posicion" },
        { text: "Sentido", value: "namemodality" },
        { text: "Embarque", value: "nameshipment" },
        { text: "Origen", value: "nameportbegin" },
        { text: "Destino", value: "nameportend" },

        { text: "Consignatario", value: "nameconsigner" },

        { text: "Acciones", value: "actions" },
      ],
    };
  },
  mounted() {
    this._getControlList();
  },
  computed: {
    ...mapState(["itemsDataControlList"]),
  },
  methods: {
    ...mapActions(["_getControlList"]),
    async cerrarDialog() {
      this.dialogUrl = false;
      this.$store.state.spiner = true;
      await this._getControlList();
      this.$store.state.spiner = false;
    },
    abrirCaperta(item) {
      console.log("item:", item);
      this.masterEditar = { ...item };
      this.url_folderonedrive = "";
      this.dialogUrl = true;
      // window.open(url, "_blank");
    },
    editControlGasto(master) {
      if (
        !(
          master.id_branch ==
          JSON.parse(sessionStorage.getItem("dataUser"))[0].id_branch
        )
      ) {
        Swal.fire({
          icon: "error",
          text: "El expediente pertenece a otra sucursal, por favor logueese con la otra sucursal.",
        });
        return;
      }
      this.$router.push({
        name: "editControlGasto",
        params: {
          id: master.id,
          id_branch: master.id_branch,
        },
      });
    },
    verControlGasto(master) {
      this.$router.push({
        name: "verControlGasto",
        params: {
          id: master.id,
          id_branch: master.id_branch,
        },
      });
    },
  },
};
</script>
