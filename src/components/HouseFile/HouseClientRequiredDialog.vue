<script setup lang="ts">
import { ref, watch } from "vue";
import Swal from "sweetalert2";
import { useAppStore } from "@/stores/app";
import { useHousesStore } from "@/stores/houses";
import { useHouseEditStore } from "@/stores/houseEdit";

const open = defineModel<boolean>({ required: true });
const emit = defineEmits<{ saved: [] }>();

const appStore = useAppStore();
const housesStore = useHousesStore();
const houseEdit = useHouseEditStore();
const clientId = ref<number | null>(null);
const error = ref("");

watch(
  () => appStore.modalEntitie,
  (creating) => {
    if (!creating) appStore.cargarClientes();
  },
);

function createClient() {
  appStore.id_role_actual = 11;
  appStore.modalEntitie = true;
}

async function save() {
  error.value = "";
  const reason = await houseEdit.saveClient(housesStore.house, clientId.value);
  if (reason) {
    error.value = reason;
    return;
  }
  await Swal.fire({
    icon: "success",
    title: "Excelente",
    text: "House actualizado éxitosamente",
    allowEnterKey: false,
    allowOutsideClick: false,
    allowEscapeKey: false,
  });
  open.value = false;
  emit("saved");
}
</script>

<template>
  <v-dialog
    v-model="open"
    max-width="520"
    persistent
  >
    <v-card>
      <v-card-title class="text-wrap">
        Es Necesario que registre un cliente para continuar:
      </v-card-title>
      <v-card-text>
        <v-autocomplete
          v-model="clientId"
          :items="appStore.clientes"
          item-title="namelong"
          item-value="id"
          label="Cliente HBL"
          :loading="houseEdit.loadingLists"
          :error-messages="error"
          :readonly="false"
        >
          <template #append-inner>
            <v-icon
              color="primary"
              aria-label="Registrar cliente"
              @mousedown.stop
              @click.stop="createClient"
            >
              mdi-plus
            </v-icon>
          </template>
        </v-autocomplete>
      </v-card-text>
      <v-card-actions>
        <v-btn
          color="success"
          :loading="houseEdit.saving"
          @click="save"
        >
          Guardar
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>
