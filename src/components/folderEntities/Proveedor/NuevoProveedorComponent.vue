<script setup lang="ts">
import { useAppStore } from "@/stores/app";
import ProveedorFicha from "./ProveedorFicha.vue";

// Inside a quote's cost dialog (`isPricing`), picking an existing provider hands its id to the quote.
withDefaults(defineProps<{ isPricing?: boolean }>(), { isPricing: false });
const emit = defineEmits<{ GuardarProveedorExiste: [val: number] }>();

const appStore = useAppStore();
</script>

<template>
  <div>
    <v-overlay
      :model-value="appStore.spiner"
      class="align-center justify-center"
    >
      <v-row class="fill-height align-content-center justify-center">
        <v-col
          class="text-body-large text-center"
          cols="12"
        >
          Cargando Datos, espere un momento por favor...
        </v-col>
        <v-col cols="6">
          <v-progress-linear
            color="deep-purple-accent-4"
            indeterminate
            rounded
            height="6"
          />
        </v-col>
      </v-row>
    </v-overlay>
    <ProveedorFicha
      mode="nuevo"
      :is-pricing="isPricing"
      @guardar-proveedor-existe="emit('GuardarProveedorExiste', $event)"
    />
  </div>
</template>
