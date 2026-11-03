<script setup lang="ts">
import { onMounted, ref } from "vue";
import Swal from "sweetalert2";
import { useBranchStore } from "@/stores/branch";
import { usePermissions } from "@/composables/usePermissions";
import type { SucursalListado } from "@/types/seguridad";
import { askAdminCredentials } from "@/utils/adminCredentials";
import { confirmsCompanyName } from "./companyNameConfirmation";

const branchStore = useBranchStore();
const { can } = usePermissions();

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

async function confirmThen(text: string, confirmButtonText: string, change: () => Promise<boolean>) {
  const { isConfirmed } = await Swal.fire({
    icon: "warning",
    text,
    showCancelButton: true,
    confirmButtonText,
    cancelButtonText: "Cancelar",
  });
  if (isConfirmed && (await change())) {
    await branchStore.ListadoSucursal();
  }
}

const inactivar = (id: number) =>
  confirmThen(
    "¿Inactivar esta empresa? Sus usuarios no podrán iniciar sesión hasta que la reactives.",
    "Sí, inactivar",
    () => branchStore.inactivarSucursal(id),
  );
const reactivar = (id: number) =>
  confirmThen(
    "¿Reactivar esta empresa? Sus usuarios podrán volver a iniciar sesión.",
    "Sí, reactivar",
    () => branchStore.reactivarSucursal(id),
  );

async function eliminar(company: SucursalListado) {
  const admin = await askAdminCredentials("Para eliminar una empresa, escribe el usuario y la clave de un administrador.");
  if (!admin) return;
  const { isConfirmed } = await Swal.fire({
    icon: "warning",
    title: "Eliminar empresa",
    text: `Se borrarán para siempre ${company.trade_name} y todos sus datos, usuarios incluidos. No se puede deshacer. Escribe el nombre de la empresa para confirmar.`,
    input: "text",
    inputPlaceholder: company.trade_name,
    showCancelButton: true,
    confirmButtonText: "Eliminar para siempre",
    cancelButtonText: "Cancelar",
    inputValidator: (typed) =>
      confirmsCompanyName(typed, company.trade_name) ? null : "Escribe el nombre exacto de la empresa para eliminarla.",
  });
  if (isConfirmed && (await branchStore.eliminarSucursal(company.id, admin))) {
    await branchStore.ListadoSucursal();
  }
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
              <v-btn
                v-if="item.status == 1 && can('lstEnterpriseRegister', 'ELIMINAR')"
                variant="text"
                icon="mdi-cancel"
                color="red"
                aria-label="Inactivar empresa"
                @click="inactivar(item.id)"
              />
              <template v-else>
                <v-btn
                  v-if="can('lstEnterpriseRegister', 'MODIFICAR')"
                  variant="text"
                  icon="mdi-restore"
                  color="green"
                  aria-label="Reactivar empresa"
                  @click="reactivar(item.id)"
                />
                <v-btn
                  variant="text"
                  icon="mdi-delete"
                  color="red"
                  aria-label="Eliminar empresa"
                  @click="eliminar(item)"
                />
              </template>
            </template>
          </v-data-table>
        </v-col>
      </v-row>
    </v-container>
  </v-card>
</template>

<style></style>
