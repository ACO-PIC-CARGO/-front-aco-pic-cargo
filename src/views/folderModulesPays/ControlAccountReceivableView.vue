<script setup lang="ts">
import { nextTick, onMounted } from "vue";
import { useStore } from "vuex";
import controlAccountReceivable from "@/components/folderModulesPays/ControlAccountReceivableComponent.vue";

const rootStore = useStore();

onMounted(() => {
  rootStore.state.mainTitle = "NUEVA CUENTA POR COBRAR";
  nextTick(() => {
    rootStore.state.drawer = false;
  });
});
</script>

<template>
  <div>
    <v-container fluid>
      <v-row>
        <v-col
          md="8"
          cols="12"
        >
          <controlAccountReceivable tipo="nuevo" />
        </v-col>
      </v-row>
    </v-container>
  </div>
</template>
