<script setup lang="ts">
import { defineAsyncComponent, onMounted, ref } from "vue";
import { useStore } from "vuex";
import { useSecuritysStore } from "@/stores/securitys";
import listMasterCom from "@/components/folderMaster/ListMasterComponent.vue";
import FiltroMaster from "@/components/filtros/FiltroMaster.vue";
import { useConfigEmpresaStore } from "@/stores/configEmpresa";

const ConfigCotizacion = defineAsyncComponent(() =>
  import("@/components/folderPricing/ConfigExpediente.vue"));

const rootStore = useStore();
const configEmpresaStore = useConfigEmpresaStore();
const securitysStore = useSecuritysStore();

const dialogConfig = ref(false);

onMounted(() => {
  rootStore.state.drawer = false;
  rootStore.state.mainTitle = "LISTA DE EXPEDIENTES";
  const val = JSON.parse(sessionStorage.getItem("ConfigEmpresa") as string);
  dialogConfig.value = !val.existemaster;
});

async function guardarConfig() {
  await configEmpresaStore.GuardarConfiguracionEmpresa();
  await securitysStore.ObtenerDatosConfig();
  dialogConfig.value = false;
}
</script>

<template>
  <div>
    <div>
      <listMasterCom />
    </div>
    <v-navigation-drawer
      v-model="rootStore.state.master_filtrarData"
      location="right"
      
      width="30%"
      temporary
      v-if="rootStore.state.master_filtrarData"
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
          <v-spacer />
          <v-btn
            class="mx-1"
            color="success"
            @click="guardarConfig()"
          >
            Guardar
          </v-btn>
          <!-- <v-btn class="mx-1" color="error">Cancelar</v-btn> -->
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>
