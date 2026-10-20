<script setup lang="ts">
import { nextTick, onMounted } from "vue";
import { useStore } from "vuex";
import controlAccountPaysCom from "@/components/folderModulesPays/ControlAccountPaysComponent.vue";

const rootStore = useStore();

onMounted(() => {
  rootStore.state.mainTitle = "NUEVA CUENTA POR PAGAR";
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
          <controlAccountPaysCom tipo="nuevo" />
        </v-col>
      </v-row>
    </v-container>
  </div>
</template>
