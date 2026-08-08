<template>
  <div>
    <div>
      <listMasterCom></listMasterCom>
    </div>
    <v-navigation-drawer
      v-model="$store.state.master_filtrarData"
      right
      absolute
      bottom
      persistent
      width="30%"
      temporary
      v-if="$store.state.master_filtrarData"
    >
      <v-card elevation="0">
        <FiltroMaster />
      </v-card>
    </v-navigation-drawer>
    <v-dialog
      v-model="dialogConfig"
      persistent
      max-width="30%"
      transition="dialog-transition"
    >
      <v-card>
        <ConfigCotizacion />
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn class="mx-1" color="success" @click="guardarConfig()">
            Guardar
          </v-btn>
          <!-- <v-btn class="mx-1" color="error">Cancelar</v-btn> -->
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>
<script>
import { mapActions } from "vuex";
import listMasterCom from "@/components/folderMaster/listMaster.vue";
import FiltroMaster from "@/components/filtros/FiltroMaster.vue";
export default {
  name: "listEntities",
  components: {
    listMasterCom,
    FiltroMaster,
    ConfigCotizacion: () =>
      import("@/components/folderPricing/ConfigExpediente"),
  },
  data() {
    return { dialogConfig: false };
  },
  mounted() {
    this.$store.state.drawer = false;
    this.$store.state.mainTitle = "LISTA DE EXPEDIENTES";
    let val = JSON.parse(sessionStorage.getItem("ConfigEmpresa"));
    this.dialogConfig = !val.existemaster;
  },
  methods: {
    ...mapActions(["GuardarConfiguracionEmpresa", "ObtenerDatosConfig"]),
    async guardarConfig() {
      await this.GuardarConfiguracionEmpresa();
      await this.ObtenerDatosConfig();
      this.dialogConfig = false;
    },
  },
};
</script>
