<script setup lang="ts">
import { onMounted, ref, watch } from "vue";
import { useStore } from "vuex";

const rootStore = useStore();

const dialog = ref(false);
// props: {
//   dialog: {
//     type: Boolean,
//     default: false,
//   },
// },

onMounted(() => {
  rootStore.dispatch("getModality");
  rootStore.dispatch("getShipment");
});

watch(dialog, () => {
  if (dialog.value) {
    console.log("sss");
  }
});
</script>

<template>
  <v-container>
    sss
    <v-dialog
      v-model="dialog"
      persistent
      max-width="70%"
      class="px-5"
      style="background: red !important"
    >
      <v-card class="px-5">
        <v-row>
          <v-col
            class="pb-0"
            cols="12"
          >
            Nuevo Estado House
          </v-col>
          <v-col
            class="py-0"
            cols="4"
          >
            <v-text-field label="Descripción" />
          </v-col>
        </v-row>
        <v-row>
          <v-col cols="6">
            <h4>Modalidad</h4>
            <v-row no-gutters>
              <v-checkbox
                v-for="(modalidad, index) in rootStore.state.pricing.listModality"
                v-model="modalidad.selected"
                :key="index"
                :label="`${modalidad.name}`"
                row
              />
            </v-row>
          </v-col>
          <v-col cols="6" />
        </v-row>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<style></style>
