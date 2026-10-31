<script setup lang="ts">
import { onMounted } from "vue";
import Editor from "@/components/comun/EditorHtml.vue";
import { useConfigAvisoStore } from "@/stores/configAviso";

const configAvisoStore = useConfigAvisoStore();

onMounted(() => configAvisoStore.obtenerConfigAviso());

function reset() {
  configAvisoStore.configAviso.aviso_llegada = configAvisoStore.configAviso.aviso_llegada_original;
}

function guardarContenido() {
  return configAvisoStore.actualizarConfigAviso(configAvisoStore.configAviso);
}
</script>

<template>
  <v-container fluid>
    <v-card :loading="configAvisoStore.loading">
      <v-card-text>
        <v-alert
          v-if="configAvisoStore.loadError"
          type="error"
          variant="tonal"
          class="mb-4"
          :text="configAvisoStore.loadError"
        >
          <template #append>
            <v-btn
              variant="text"
              @click="configAvisoStore.obtenerConfigAviso()"
            >
              Reintentar
            </v-btn>
          </template>
        </v-alert>
        <Editor />
      </v-card-text>
      <v-card-actions>
        <v-btn
          color="success"
          :loading="configAvisoStore.saving"
          :disabled="configAvisoStore.loading || Boolean(configAvisoStore.loadError)"
          @click="guardarContenido"
        >
          Guardar contenido
        </v-btn>
        <v-btn
          color="warning"
          :disabled="configAvisoStore.loading || configAvisoStore.saving"
          @click="reset"
        >
          Resetear al Original
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-container>
</template>
