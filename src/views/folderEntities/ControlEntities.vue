<script setup lang="ts">
import { onMounted } from "vue";
import { useAppStore } from "@/stores/app";
import controlEntitiesCom from "@/components/folderEntities/ControlEntities.vue";

const appStore = useAppStore();

onMounted(() => {
  appStore.mainTitle = "Datos Generales de la Entidad";
});
</script>

<template>
  <div>
    <v-container>
      <v-row>
        <v-col
          cols="12"
          md="6"
        >
          <v-card>
            <v-card-text>
              <controlEntitiesCom data-clien="1" />
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>
    </v-container>
  </div>
</template>
