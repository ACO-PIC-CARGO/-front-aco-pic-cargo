<script setup lang="ts">
import { ref, watch } from "vue";
import { useStore } from "vuex";
import type { RegistroConUrlCarpeta } from "@/types/archivos";

const props = withDefaults(
  defineProps<{ dialogUrl?: boolean; masterEditar?: RegistroConUrlCarpeta }>(),
  { dialogUrl: false, masterEditar: () => ({}) },
);
const emit = defineEmits<{ cerrar: [] }>();

const rootStore = useStore();

const url_folderonedrive = ref("");
const err = ref("");

function to_link({ url = "" }) {
  window.open(url, "_blank");
}
async function actualizarUrl() {
  err.value = "";
  if (!url_folderonedrive.value) {
    err.value = "Dato requerido";
    return;
  }
  await rootStore.dispatch("actualizarURLEnElMaster", {
    id: props.masterEditar.id,
    url: url_folderonedrive.value,
  });
  // eslint-disable-next-line vue/no-mutating-props
  props.masterEditar.url_folderonedrive = url_folderonedrive.value;
  cerrarDialog();
}
function cerrarDialog() {
  emit("cerrar");
}

watch(
  () => props.dialogUrl,
  () => {
    url_folderonedrive.value = "";
  },
);
watch(url_folderonedrive, () => {
  err.value = "";
  if (url_folderonedrive.value.length == 0) {
    err.value = "Dato requerido";
  }
});
</script>

<template>
  <v-container fluid>
    <v-card>
      <v-dialog
        :model-value="dialogUrl"
        scrollable
        persistent
        max-width="30%"
        transition="dialog-transition"
      >
        <v-card>
          <v-card-title> Actualizar URL Carpeta </v-card-title>
          <v-card-text>
            <v-btn
              color="success"
              size="small"
              :disabled="!masterEditar.url_folderonedrive"
              @click="to_link({ url: masterEditar.url_folderonedrive })"
            >
              Abrir <v-icon class="mx-1">
                mdi-folder-open-outline
              </v-icon>
            </v-btn>
            <v-divider class="my-3" />
            <v-text-field
              label="Nueva URL"
              id="id"
              v-model="url_folderonedrive"
              :error-messages="err"
            />

            <v-card-actions>
              <v-spacer />
              <v-btn
                color="success"
                @click="actualizarUrl"
              >
                <v-icon>mdi-save</v-icon> Guardar
              </v-btn>
              <v-btn
                color="error"
                @click="cerrarDialog"
              >
                Cerrar
              </v-btn>
            </v-card-actions>
          </v-card-text>
        </v-card>
      </v-dialog>
    </v-card>
  </v-container>
</template>
