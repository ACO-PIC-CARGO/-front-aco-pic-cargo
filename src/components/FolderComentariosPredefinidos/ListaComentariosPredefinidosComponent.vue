<script setup lang="ts">
import { onMounted, ref, useTemplateRef, watch } from "vue";
import Swal from "sweetalert2";
import { useAppStore } from "@/stores/app";
import { useComentariosPredefinidosStore } from "@/stores/comentariosPredefinidos";
import type { ComentarioPredefinido, FiltroComentariosPredefinidos, FormComentarioPredefinido } from "@/types/catalogos";
import { sessionBranchId } from "@/utils/sesion";

const comentariosPredefinidosStore = useComentariosPredefinidosStore();
const appStore = useAppStore();

const headers = [
  { title: "Código", align: "start", key: "code", width: "15%" },
  { title: "Comentario", key: "comentario", width: "32.5%" },
  { title: "Estado", key: "status", width: "12.5%" },
  { title: "Creación", key: "created_at", width: "15%" },
  { title: "Última Actualización", key: "updated_at", width: "15%" },
  { title: "Acciones", key: "action", width: "10%" },
] as const;
const loading = false;
const search = ref("");
const record = ref<FormComentarioPredefinido>({
  id_branch: sessionBranchId(),
  code: "",
  comentario: "",
  status: 1,
});
const showFilterDrawerNew = ref(false);
const showFilterDrawerView = ref(false);
const showFilterDrawerEdit = ref(false);
const showFilterDrawer = ref(false);
let showFilterDrawerUpdate = false;
const errorCodigo = null;
const errorComentario = null;
const isDataTableLoading = ref(false);
const isSubmitBtnLoading = ref(false);
const isExportBtnLoading = ref(false);
const isAutoGeneratingCode = ref(false);
const filterData = ref<FiltroComentariosPredefinidos>({
  code: "",
  comentario: "",
  status: 1,
});
const formNewComentarioPredefinido = useTemplateRef("formNewComentarioPredefinido");
const formEditComentarioPredefinido = useTemplateRef("formEditComentarioPredefinido");

watch(
  () => comentariosPredefinidosStore.loading,
  (newValue) => {
    isDataTableLoading.value = newValue;
  },
  { immediate: true },
);

onMounted(async () => {
  await comentariosPredefinidosStore.fetchListadoComentariosPredefinidos(filterData.value);

  appStore.mainTitle = "LISTADO DE COMENTARIOS PREDEFINIDOS DE BITÁCORA";
});

function validateCodigo(v: string | null) {
  if (!v) {
    return "El código es requerido";
  } else if (v.length > 5) {
    return "El código permite hasta 5 caracteres";
  } else {
    return true;
  }
}
function validateComentario(v?: string | null) {
  if (!v) {
    return "El comentario es requerido";
  } else if (v.length > 255) {
    return "El comentario admite hasta 255 caracteres ";
  } else {
    return true;
  }
}
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function createCode() {
  let codigoMaximo = 0;
  comentariosPredefinidosStore.list.filter((v) => {
    if (codigoMaximo < parseInt(v.code)) {
      codigoMaximo = parseInt(v.code);
    }
  });

  const codigo = (codigoMaximo + 1).toString().padStart(5, "0");

  return codigo;
}
async function autogenerateCode() {
  isAutoGeneratingCode.value = true;
  await comentariosPredefinidosStore.fetchMaxCodeListadoComentariosPredefinidos();
  isAutoGeneratingCode.value = false;

  return (parseInt(String(comentariosPredefinidosStore.maxCode)) + 1).toString().padStart(5, "0");
}
async function addComentarioPredefinido() {
  record.value.code = "";
  record.value.comentario = "";
  record.value.status = true;

  formNewComentarioPredefinido.value!.resetValidation();

  showFilterDrawerNew.value = !showFilterDrawerNew.value;

  await autogenerateCode().then((res) => (record.value.code = res));
}
async function saveComentarioPredefinido() {
  if ((await formNewComentarioPredefinido.value!.validate()).valid) {
    isSubmitBtnLoading.value = true;
    await comentariosPredefinidosStore.insertComentarioPredefinido(record.value);
    isSubmitBtnLoading.value = false;

    showFilterDrawerUpdate = !showFilterDrawerUpdate;
  }
}
function viewComentarioPredefinido(item: ComentarioPredefinido) {
  record.value = {
    ...item,
    status: !!item.status,
  };

  showFilterDrawerView.value = !showFilterDrawerView.value;
}
async function editComentarioPredefinido(item: ComentarioPredefinido) {
  record.value = {
    ...item,
    code: item.code ? item.code : "",
    status: !!item.status,
  };

  showFilterDrawerEdit.value = !showFilterDrawerEdit.value;

  if (!record.value.code) {
    await autogenerateCode().then((res) => (record.value.code = res));
  }
}
async function changeStatusComentarioPredefinido(item: ComentarioPredefinido) {
  Swal.fire({
    title: "¿Estás seguro?",
    text: `Si inactiva el registro, éste no aparecerá disponible en otros formularios ¿Está seguro de que desea inactivarlo?`,
    confirmButtonColor: "red",
    icon: "question",
    showCancelButton: true,
    confirmButtonText: "Sí, inactivar",
    cancelButtonColor: "orange",
    cancelButtonText: "Cancelar",
  }).then(async (result) => {
    if (result.isConfirmed) {
      await comentariosPredefinidosStore.deleteComentarioPredefinido(item);
    }
  });
}
async function saveChangesComentarioPredefinido() {
  if ((await formEditComentarioPredefinido.value!.validate()).valid) {
    isSubmitBtnLoading.value = true;
    await comentariosPredefinidosStore.updateComentarioPredefinido(record.value);
    isSubmitBtnLoading.value = false;

    showFilterDrawerUpdate = !showFilterDrawerUpdate;
  }
}
function showFilterComentariosPredefinidos() {
  showFilterDrawer.value = !showFilterDrawer.value;
}
async function filterComentariosPredefinidos() {
  isSubmitBtnLoading.value = true;
  await comentariosPredefinidosStore.fetchListadoComentariosPredefinidos(filterData.value);
  isSubmitBtnLoading.value = false;

  showFilterDrawer.value = !showFilterDrawer.value;
}
async function resetFilterComentariosPredefinidos() {
  filterData.value.code = "";
  filterData.value.comentario = "";
  filterData.value.status = 1;

  await comentariosPredefinidosStore.fetchListadoComentariosPredefinidos(filterData.value);

  showFilterDrawer.value = !showFilterDrawer.value;
}
async function exportToExcel() {
  isExportBtnLoading.value = true;
  await comentariosPredefinidosStore.exportToExcelListadoComentarioPredefinidos();
  isExportBtnLoading.value = false;
}
function getFechaBonita(fecha?: string) {
  if (fecha) {
    return fecha.split("-").reverse().join("-");
  }
  return "";
}
</script>

<template>
  <v-card>
    <v-container fluid>
      <v-container
        v-if="loading"
        style="height: 400px"
      >
        <v-row class="fill-height align-content-center justify-center">
          <v-col
            class="text-body-large text-center"
            cols="12"
          >
            Cargando información ....
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
      </v-container>
    
      <v-card-title
        v-if="!loading"
        class="elevation-0 d-flex align-center flex-wrap"
      >
        <v-text-field
          append-inner-icon="mdi-magnify"
          label="Buscar"
          single-line
          hide-details
          v-model="search"
        />
        <v-spacer />
        <v-btn
          size="small"
          color="success"
          @click="addComentarioPredefinido()"
        >
          Nuevo
        </v-btn>
        <v-btn
          size="small"
          class="ml-1"
          color="#2962FF"
          @click="showFilterComentariosPredefinidos()"
        >
          Filtrar
        </v-btn>
        <v-btn
          size="small"
          class="ml-1"
          color="#004D40"
          @click="exportToExcel"
          :loading="isExportBtnLoading"
        >
          Exportar
        </v-btn>
      </v-card-title>
    
      <v-data-table
        v-if="!loading"
        class="elevation-1"
        :headers="headers"
        :items="comentariosPredefinidosStore.list"
        item-value="id"
        :search="search"
        :loading="isDataTableLoading"
      >
        <template #[`item.status`]="{ item }">
          {{ !!item.status ? "Activo" : "Inactivo" }}
        </template>
        <template #[`item.created_at`]="{ item }">
          {{ getFechaBonita(item.created_at) }}
        </template>
        <template #[`item.updated_at`]="{ item }">
          {{ getFechaBonita(item.updated_at) }}
        </template>
        <template #[`item.action`]="{ item }">            
          <v-btn
            variant="text"
            icon
          >
            <v-icon
              color="warning"
              @click="editComentarioPredefinido(item)"
            >
              mdi-pencil
            </v-icon>
          </v-btn> 
          <v-btn
            variant="text"
            icon
          >
            <v-icon
              color="primary"
              @click="viewComentarioPredefinido(item)"
            >
              mdi-eye
            </v-icon>
          </v-btn>   
          <v-btn
            variant="text"
            icon
            color="red"
            @click="changeStatusComentarioPredefinido(item)"
            v-if="item.status"
          >
            <v-icon>mdi-delete</v-icon>
          </v-btn>
        </template>
      </v-data-table>
    
      <!--ADD NEW RECORD-->
      <v-navigation-drawer
        v-model="showFilterDrawerNew"
        location="right"
        temporary
          
        width="30%"
      >
        <v-list-item>
          <v-list-item-title class="text-headline-small">
            NUEVO COMENTARIO
          </v-list-item-title>
        </v-list-item>
    
        <v-spacer />
    
        <v-container>
          <v-card-text>
            <v-form ref="formNewComentarioPredefinido">
              <v-row>
                <v-text-field
                  type="text"
                  label="Código"
                  v-model="record.code"
                  :rules="[(v) => validateCodigo(v)]"
                  :error-messages="errorCodigo"
                  readonly
                  :loading="isAutoGeneratingCode"
                />
              </v-row>
              <v-row>
                <v-text-field
                  type="text"
                  label="Comentario"
                  v-model="record.comentario"
                  :rules="[(v) => validateComentario(v)]"
                  :error-messages="errorComentario"
                  clearable
                />
              </v-row>
              <v-row>
                <v-switch
                  density="compact"
                  :label="`Estado: ${record.status ? 'Activo' : 'Inactivo'}`"
                  v-model="record.status"
                  :value-comparator="(value, checked) => Boolean(value) === checked"
                  hide-details
                  color="success"
                />
              </v-row>
            </v-form>              
          </v-card-text>
        </v-container>
    
        <v-container>
          <v-card-actions class="justify-end mt-3">
            <v-btn 
              class="mx-1" 
              color="success" 
              @click="saveComentarioPredefinido"
              :loading="isSubmitBtnLoading"
            >
              Aceptar
            </v-btn>
            <v-btn 
              class="mx-1" 
              color="warning" 
              @click="showFilterDrawerNew = !showFilterDrawerNew"
            >
              Cerrar
            </v-btn>
          </v-card-actions>
        </v-container>
      </v-navigation-drawer>
    
      <!--VIEW RECORD-->
      <v-navigation-drawer
        v-model="showFilterDrawerView"
        location="right"
        temporary
          
        width="30%"
      >
        <v-container>
          <v-list-item class="px-0">
            <v-list-item-title class="text-headline-small">
              COMENTARIO {{ record.code ? `[${record.code}]` : "" }} - MODO VISTA
            </v-list-item-title>
          </v-list-item>
    
          <v-spacer />
          <v-card-text>
            <v-row>
              <v-text-field
                label="Código"
                readonly
                :model-value="record.code"
              />
            </v-row>
            <v-row>
              <v-text-field
                label="Comentario"
                readonly
                :model-value="record.comentario"
              />
            </v-row>
            <v-row>
              <v-switch
                readonly
                :label="`Estado: ${
                  record.status ? 'Activo' : 'Inactivo'
                }`"
                color="success"
                v-model="record.status"
                :value-comparator="(value, checked) => Boolean(value) === checked"
              />
            </v-row>
          </v-card-text>
          <v-card-actions class="justify-end mt-3">
            <v-btn
              class="mx-1"
              color="warning"
              @click="showFilterDrawerView = !showFilterDrawerView"
            >
              Cerrar
            </v-btn>
          </v-card-actions>
        </v-container>
      </v-navigation-drawer>
    
      <!--EDIT RECORD-->
      <v-navigation-drawer
        v-model="showFilterDrawerEdit"
        location="right"
        temporary
          
        width="30%"
      >
        <v-container>
          <v-list-item class="px-0">
            <v-list-item-title class="text-headline-small">
              MODIFICAR COMENTARIO: {{ record.code ? `[${record.code}]` : "" }}
            </v-list-item-title>
          </v-list-item>
    
          <v-spacer />
    
          <v-card-text>    
            <v-form ref="formEditComentarioPredefinido">
              <v-row>
                <v-text-field
                  type="text"
                  label="Código"
                  v-model="record.code"
                  readonly
                  :loading="isAutoGeneratingCode"
                />
              </v-row>
              <v-row>
                <v-text-field
                  type="text"
                  label="Comentario"
                  v-model="record.comentario"
                  @blur="validateComentario()"
                  :rules="[(v) => validateComentario(v)]"
                  :error-messages="errorComentario"
                  clearable
                />
              </v-row>
              <v-row>
                <v-switch
                  :label="`Estado: ${record.status ? 'Activo' : 'Inactivo'}`"
                  v-model="record.status"
                  :value-comparator="(value, checked) => Boolean(value) === checked"
                  color="success"
                />
              </v-row>
            </v-form>             
          </v-card-text>
    
          <v-card-actions class="justify-end mt-3">
            <v-btn 
              class="mx-1" 
              color="success" 
              @click="saveChangesComentarioPredefinido"
              :loading="isSubmitBtnLoading"
            >
              Aceptar
            </v-btn>
            <v-btn
              class="mx-1"
              color="warning"
              @click="showFilterDrawerEdit = !showFilterDrawerEdit"
            >
              Cerrar
            </v-btn>
          </v-card-actions>
        </v-container>
      </v-navigation-drawer>
    
      <!--FILTER RECORD-->
      <v-navigation-drawer
        v-model="showFilterDrawer"
        location="right"
        temporary
          
        width="30%"
      >
        <v-list-item>
          <v-list-item-title class="text-headline-small">
            FILTRAR REGISTROS
          </v-list-item-title>
        </v-list-item>
    
        <v-spacer />
    
        <v-container>
          <v-card-text>
            <v-row>
              <v-text-field
                label="Código"
                v-model="filterData.code"
                clearable
              />
            </v-row>
            <v-row>
              <v-text-field
                label="Comentario"
                v-model="filterData.comentario"
                clearable
              />
            </v-row>
            <v-row>
              <v-radio-group
                v-model="filterData.status"
                inline
                density="compact"
              >
                <v-radio
                  label="Activo"
                  color="green"
                  :value="1"
                />
                <v-radio
                  label="Inactivo"
                  color="red"
                  :value="0"
                />
                <v-radio
                  label="Todos"
                  color="blue"
                  value="null"
                />
              </v-radio-group>
            </v-row>
          </v-card-text>
        </v-container>
    
        <v-container>
          <v-card-actions class="justify-end mt-3">
            <v-btn 
              class="mx-1" 
              color="success" 
              @click="filterComentariosPredefinidos"
              :loading="isSubmitBtnLoading"
            >
              Aceptar
            </v-btn>
            <v-btn 
              class="mx-1" 
              color="ligth" 
              @click="resetFilterComentariosPredefinidos"
            >
              Limpiar
            </v-btn>
            <v-btn
              class="mx-1"
              color="warning"
              @click="showFilterDrawer = !showFilterDrawer"
            >
              Cerrar
            </v-btn>
          </v-card-actions>
        </v-container>
      </v-navigation-drawer>
    </v-container>
  </v-card>
</template>
