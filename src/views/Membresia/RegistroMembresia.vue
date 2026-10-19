<script setup lang="ts">
import { defineAsyncComponent, onMounted } from "vue";
import { useStore } from "vuex";

const OpcionesMembresia = defineAsyncComponent(() =>
  import("@/components/Membresia/OpcionesMembresia.vue"));

const rootStore = useStore();

onMounted(() => {
  rootStore.state.drawer = false;
  rootStore.state.mainTitle = "Membresía";
});
</script>

<template>
  <v-container fluid>
    <div class="centrado">
      <h4>¡Selecciona el/los módulos que deseas contratar para tu empresa!</h4>
    </div>
    <OpcionesMembresia />
  </v-container>
</template>

<style scope>
.centrado {
  text-align: center;
  align-content: center;
}
</style>
