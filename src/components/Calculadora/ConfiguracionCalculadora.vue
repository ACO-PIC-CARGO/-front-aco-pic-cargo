<script setup lang="ts">
import { nextTick, onMounted, ref } from "vue";
import Swal from "sweetalert2";
import { useCalculadorasStore } from "@/stores/calculadoras";
import type { ConfiguracionCalculadora } from "@/types/calculadora";

const calculadorasStore = useCalculadorasStore();

const config = ref<Partial<ConfiguracionCalculadora>>({});
const headers = [
  { title: "codigo", key: "codigo", width: "10%" },
  { title: "descripcion", key: "descripcion", width: "20%" },
  { title: "texto", key: "texto", width: "30%" },
  // { text: "valorjson", value: "valorjson", width: "10%" },
  // { text: "numero", value: "numero", width: "15%" },
  // { text: "fecha", value: "fecha", width: "15%" },
  { title: "", key: "action", width: "5%" },
];

onMounted(() => {
  calculadorasStore.getConfiguración({});
});
// eslint-disable-next-line @typescript-eslint/no-unused-vars
async function guardarCambios(item: ConfiguracionCalculadora, index: number) {
  await calculadorasStore.ActualizarConfig(item);
  item.editarflag = false;
  nextTick(() => {
    // document.getElementById(`texto${index}`).focus();
    // document.getElementById(`texto${index}`).select();
  });
}
function activarEditar(item: ConfiguracionCalculadora, index: number) {
  const val = calculadorasStore.config.some(
    (v) => v.editarflag && v.id != item.id,
  );
  if (val) {
    Swal.fire({
      icon: "error",
      title: "Error Al Editar",
      text: "Tiene una configuración para  editar, guarde para editar otro.",
    });
    return;
  }
  item.editarflag = true;
  config.value = item;
  nextTick(() => {
    document.getElementById(`texto${index}`)!.focus();
    (document.getElementById(`texto${index}`) as HTMLTextAreaElement).select();
  });
}
</script>

<template>
  <v-container>
    <v-data-table
      :headers="headers"
      :items="calculadorasStore.config"
      item-value="id"
    >
      <template #[`item.texto`]="{ item, index }">
        <div class="d-flex align-center">
          <v-textarea
            :id="`texto${index}`"
            variant="outlined"
            v-model="item.texto"
            :disabled="!item.editarflag"
            class="custom-field-sizing"
          />
        </div>
      </template>
      <template #[`item.action`]="{ item, index }">
        <v-btn
          v-if="!item.editarflag"
          @click="activarEditar(item, index)"
          color="#FFD600"
          size="small"
        >
          <v-icon size="small">
            mdi-square-edit-outline
          </v-icon>
        </v-btn>
        <v-btn
          v-else
          color="#004D40"
          size="small"
          @click="guardarCambios(item, index)"
        >
          <v-icon size="small">
            mdi-content-save-all
          </v-icon>
        </v-btn>
      </template>
    </v-data-table>
  </v-container>
</template>

<style scoped>
.custom-field-sizing {
  field-sizing: content !important;
}
</style>
