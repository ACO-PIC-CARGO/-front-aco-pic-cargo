<script setup lang="ts">
import { onMounted } from "vue";
import Editor from "@/components/comun/EditorHtml.vue";
import { useConfigAvisoStore } from "@/stores/configAviso";

const configAvisoStore = useConfigAvisoStore();

onMounted(() => {

  configAvisoStore.obtenerConfigAviso();
});

function reset() {
  configAvisoStore.configAviso.aviso_llegada =
    configAvisoStore.configAviso.aviso_llegada_original;
}
async function guardarContenido() {

  await configAvisoStore.actualizarConfigAviso(configAvisoStore.configAviso)
}
</script>

<template>
  <v-container fluid>
    <v-card>
      <v-card-text>
        <Editor />
      </v-card-text>
      <v-card-actions>
        <v-btn
          color="success"
          @click="guardarContenido"
        >
          Guardar contenido
        </v-btn>
        <v-btn
          color="warning"
          @click="reset"
        >
          Resetear al Original
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-container>
</template>


