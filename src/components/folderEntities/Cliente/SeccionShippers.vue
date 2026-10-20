<script setup lang="ts">
import { computed, ref, useTemplateRef } from "vue";
import { useAppStore } from "@/stores/app";
import Swal from "sweetalert2";
import { useEntitiesStore } from "@/stores/entities";
import type { ProveedorShipper } from "@/types/entidades";

const appStore = useAppStore();
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

async function mostrarDialogShippers() {
  dialogShippers.value = !dialogShippers.value;

  loading.value = true;
  await appStore._getProveedorRolShipper();
  loading.value = false;
}
function eliminarShipper(index: number) {
  entitiesStore.lstShippers.splice(index, 1);
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
    entitiesStore.isReadonly = false;
    entitiesStore.isEdit = true;
    Swal.fire({
      icon: "info",
      text: "Ahora puede modificar los campos",
    });
    return;
  }

  appStore.spiner = true;
  await entitiesStore.actualizarCliente();
  appStore.spiner = false;
  appStore.recargarClienteFlag =
    !appStore.recargarClienteFlag;
  appStore.modalEntitie = false;

  entitiesStore.isReadonly = true;
  entitiesStore.isEdit = false;
}
</script>

<template>
  <div>
    <v-card>
      <v-card-title class="px-2 container-narrow d-flex align-center flex-wrap">
        <v-spacer />
        <v-btn
          v-if="!showNavigationButtons"
          color="light-blue-darken-2"
          class="ma-2"
          size="small"
          @click="modificarCliente"
        >
          <v-icon
            start
            size="small"
          >
            mdi-account-edit
          </v-icon>
          {{ isFormReadonly ? "EDITAR CLIENTE" : "GUARDAR CAMBIOS" }}
        </v-btn>
      </v-card-title>
      <v-card-text class="px-2">
        <div class="container-narrow">
          <v-list-subheader class="px-0">
            <b>Shippers</b>

            <template v-if="showFormActions">
              <v-btn
                color="primary"
                rounded
                size="small"
                class="ml-auto"
                @click="mostrarDialogShippers"
              >
                AGREGAR SHIPPER
              </v-btn>
            </template>
          </v-list-subheader>
          <v-row>
            <v-col cols="12">
              <v-form
                ref="formShippers"
                :readonly="isFormReadonly"
              >
                <v-data-table
                  :headers="headersShippers"
                  :items="entitiesStore.lstShippers"
                  class="elevation-5"
                  item-value="index"
                  disable-sort
                >
                  <template #[`item.correlativo`]="{ item }">
                    PR-{{ item.correlativo }}
                  </template>
                  <template
                    #[`item.action`]="{ index }"
                    v-if="showFormActions"
                  >
                    <v-btn
                      variant="text"
                      icon
                      color="red"
                      @click="eliminarShipper(index)"
                    >
                      <v-icon>mdi-delete</v-icon>
                    </v-btn>
                  </template>
                </v-data-table>
              </v-form>
            </v-col>
          </v-row>
        </div>
      </v-card-text>
      <v-card-actions v-if="showNavigationButtons">
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
      </v-card-actions>
    </v-card>

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
