<script setup lang="ts">
import { onMounted } from "vue";
import { useStore } from "vuex";
import controlEntitiesCom from "@/components/folderEntities/ControlEntities.vue";

const rootStore = useStore();

onMounted(() => {
  rootStore.state.mainTitle = "Datos Generales de la Entidad";
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
