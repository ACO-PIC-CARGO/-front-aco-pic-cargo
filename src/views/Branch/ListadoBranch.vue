<script setup lang="ts">
import { onMounted, ref } from "vue";
import Swal from "sweetalert2";
import { useBranchStore } from "@/stores/branch";

const branchStore = useBranchStore();

const search = ref("");
const header = [
  { title: "Empresa", key: "trade_name" },
  { title: "Dirección", key: "address" },
  { title: "País", key: "pais" },
  { title: "Fec. Creación", key: "created_at" },
  // { text: "ultima Actualización", value: "updated_at" },
  { title: "Nombres", key: "nombrecompleto" },
  { title: "Tel.", key: "phone" },
  { title: "Último Login", key: "ultimologin" },
  { title: "Estado", key: "status" },
  { title: "", key: "action" },
] as const;

onMounted(() => {
  branchStore.ListadoSucursal();
});

function inactivar(id: number) {
  Swal.fire({
    icon: "warning",
    text: "¿Desea Inactivar el registro?",
    showCancelButton: true,
    confirmButtonText: "Si eliminar",
    cancelButtonText: "Cancelar",
    allowEnterKey: true,
    allowOutsideClick: true,
  }).then(async (respuesta) => {
    if (respuesta.isConfirmed) {
      await branchStore.inactivarSucursal(id);
      await branchStore.ListadoSucursal();
    }
  });
}
</script>

<template>
  <v-card>
    <v-container fluid>
      <v-row>
        <v-col cols="4">
          <v-text-field v-model="search" />
        </v-col>
        <v-col cols="4">
          filtros
        </v-col>
        <v-col cols="12">
          <v-data-table
            :headers="header"
            :items="branchStore.lstBranch"
            class="elevation-1"
            item-value="id"
            :search="search"
          >
            <template #[`item.status`]="{ item }">
              <v-chip
                v-if="item.status == 1"
                class="ma-2"
                color="green"
              >
                Activo
              </v-chip>
              <v-chip
                v-else
                class="ma-2"
                color="red"
              >
                Inactivo
              </v-chip>
            </template>

            <template #[`item.action`]="{ item }">
              <v-icon
                style="cursor: pointer"
                v-if="item.status == 1"
                color="red"
                @click="inactivar(item.id)"
              >
                mdi-delete
              </v-icon>
            </template>
          </v-data-table>
        </v-col>
      </v-row>
    </v-container>
  </v-card>
</template>

<style></style>
