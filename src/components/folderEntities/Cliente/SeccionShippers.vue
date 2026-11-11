<script setup lang="ts">
import { computed, ref, useTemplateRef } from "vue";
import { useAppStore } from "@/stores/app";
import Swal from "sweetalert2";
import { useEntitiesStore } from "@/stores/entities";
import type { ProveedorShipper, ShipperCliente } from "@/types/entidades";
import { removeRow } from "../removeRow";
import { entityEditAllowed } from "@/components/folderEntities/entityEditAllowed";
import ClienteCard from "./ClienteCard.vue";
import "./clienteCards.css";

// Inside Ver Cliente the screen's header holds the Editar/Guardar buttons, so `embedded` hides this section's own.
const props = withDefaults(defineProps<{ embedded?: boolean }>(), { embedded: false });

const appStore = useAppStore();
const editAllowed = entityEditAllowed("listClientes");
const entitiesStore = useEntitiesStore();

const loading = ref(false);
const headersShippers = [
  { title: "Código", key: "correlativo", width: "20%" },
  { title: "Shipper", key: "nombrecompleto", width: "40%" },
  { title: "Producto que vende", key: "producto", width: "30%" },
  { title: "Acciones", key: "action", width: "10%" },
] as const;
const headersProveedoresRolShipper = [
  {
    title: "Razón Social/Nombre Comercial",
    key: "namelong",
    width: "35%",
  },
  { title: "Teléfono", key: "telefono", width: "30%" },
  { title: "Producto que vende", key: "producto", width: "35%" },
] as const;
const search = ref("");
const dialogShippers = ref(false);
const lstSelectedShippers = ref<ProveedorShipper[]>([]);
const formShippers = useTemplateRef("formShippers");

const isFormReadonly = computed(() => {
  return entitiesStore.isReadonly;
});
const showFormActions = computed(() => {
  return !entitiesStore.isReadonly;
});
const showNavigationButtons = computed(() => {
  return !(
    entitiesStore.isEdit ||
    entitiesStore.isReadonly
  );
});
const showOwnEditButton = computed(() => !props.embedded && !showNavigationButtons.value && editAllowed);
// Acciones only holds the delete button, which exists while editing.
const visibleHeaders = computed(() =>
  showFormActions.value ? headersShippers : headersShippers.filter((header) => header.key !== "action"),
);

async function mostrarDialogShippers() {
  dialogShippers.value = !dialogShippers.value;

  loading.value = true;
  await appStore._getProveedorRolShipper();
  loading.value = false;
}
function eliminarShipper(row: ShipperCliente) {
  removeRow(entitiesStore.lstShippers, row);
}
function aceptar() {
  if (lstSelectedShippers.value.length) {
    lstSelectedShippers.value.map((item) => {
      if (
        !entitiesStore.lstShippers.filter(
          (v) => v.id_shipper == item.id,
        ).length
      ) {
        entitiesStore.lstShippers.push({
          id_shipper: item.id,
          correlativo: item.correlativo,
          nombrecompleto: item.namelong,
          producto: item.producto,
        });
      }
    });

    lstSelectedShippers.value.length = 0;
  }

  dialogShippers.value = !dialogShippers.value;
}
function cancelar() {
  lstSelectedShippers.value.length = 0;
  dialogShippers.value = !dialogShippers.value;
}
async function validarFormulario() {
  let ok = true;
  if (entitiesStore.lstShippers.length > 0) {
    if (!(await formShippers.value!.validate()).valid) {
      ok = false;
    }
  }

  if (ok) {
    entitiesStore.stepper = 6;
  }
}
async function modificarCliente() {
  if (isFormReadonly.value) {
    if (!(await entitiesStore.approveClientEdit(entitiesStore.cliente.id!))) return;
    entitiesStore.isReadonly = false;
    entitiesStore.isEdit = true;
    Swal.fire({
      icon: "info",
      text: "Ahora puede modificar los campos",
    });
    return;
  }

  appStore.spiner = true;
  const saved = await entitiesStore.actualizarCliente();
  appStore.spiner = false;
  if (!saved) return;
  appStore.recargarClienteFlag =
    !appStore.recargarClienteFlag;
  appStore.modalEntitie = false;

  entitiesStore.isReadonly = true;
  entitiesStore.isEdit = false;
}

// Inside the client card, its Continuar runs this step's checks (they move on to the next step when they pass).
defineExpose({ validarFormulario });
</script>

<template>
  <div class="cli-section">
    <div
      v-if="showOwnEditButton"
      class="d-flex justify-end mb-3"
    >
      <v-btn
        class="cli-add-btn"
        variant="outlined"
        prepend-icon="mdi-pencil-outline"
        @click="modificarCliente"
      >
        {{ isFormReadonly ? "Editar Cliente" : "Guardar Cambios" }}
      </v-btn>
    </div>

    <ClienteCard
      title="Shippers"
      icon="mdi-ferry"
    >
      <template
        v-if="showFormActions"
        #actions
      >
        <v-btn
          color="#1a5fd0"
          variant="flat"
          prepend-icon="mdi-plus"
          class="text-none font-weight-bold"
          @click="mostrarDialogShippers"
        >
          Agregar Shipper
        </v-btn>
      </template>
      <v-form
        ref="formShippers"
        :readonly="isFormReadonly"
      >
        <v-data-table
          :headers="visibleHeaders"
          :items="entitiesStore.lstShippers"
          class="cli-table"
          item-value="index"
          density="comfortable"
          items-per-page-text="Items por página:"
          no-data-text="Sin shippers registrados."
          disable-sort
        >
          <template #[`item.correlativo`]="{ item }">
            <v-chip
              class="cli-chip-coin"
              size="small"
              variant="flat"
            >
              PR-{{ item.correlativo }}
            </v-chip>
          </template>
          <template #[`item.nombrecompleto`]="{ item }">
            <span class="font-weight-bold">{{ item.nombrecompleto }}</span>
          </template>
          <template #[`item.action`]="{ item }">
            <v-btn
              class="cli-row-delete"
              variant="flat"
              size="small"
              icon="mdi-delete-outline"
              aria-label="Eliminar shipper"
              @click="eliminarShipper(item)"
            />
          </template>
        </v-data-table>
      </v-form>
    </ClienteCard>

    <div
      v-if="showNavigationButtons && !embedded"
      class="d-flex mt-4"
    >
      <v-btn
        color="primary"
        @click="entitiesStore.stepper--"
      >
        Regresar
      </v-btn>
      <v-btn
        color="primary"
        class="ml-auto"
        @click="validarFormulario"
      >
        Continuar
      </v-btn>
    </div>

    <!--DIALOG SHIPPERS-->
    <v-dialog
      v-model="dialogShippers"
      scrollable
      persistent
      max-width="60%"
      transition="dialog-transition"
    >
      <v-card>
        <v-card-title primary-title>
          Seleccionar Shipper
        </v-card-title>
        <v-card-text class="pt-2">
          <v-text-field
            label="Buscar"
            density="compact"
            v-model="search"
          />
          <v-data-table
            :headers="headersProveedoresRolShipper"
            :items="appStore.itemsProveedorRolShipper"
            fixed-header
            class="elevation-1"
            v-model="lstSelectedShippers"
            item-value="id"
            return-object
            show-select
            :search="search"
            :loading="loading"
            @click:row="(event: MouseEvent, { internalItem, toggleSelect }: { internalItem: unknown; toggleSelect: (item: unknown) => void }) => toggleSelect(internalItem)"
          />
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn
            rounded
            color="success"
            @click="aceptar"
          >
            Aceptar
          </v-btn>
          <v-btn
            rounded
            color="error"
            @click="cancelar"
          >
            Cancelar
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<style>
tr.selected {
  background: #ffccab !important;
}
.container-narrow {
  max-width: 1100px;
  margin: 0 auto;
}
</style>
