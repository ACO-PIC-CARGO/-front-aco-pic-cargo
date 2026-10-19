<script setup lang="ts">
import { onMounted, ref, useTemplateRef, watch } from "vue";
import Swal from "sweetalert2";
import { useStore } from "vuex";
import { useDocumentStore } from "@/stores/document";
import type { FiltroCatalogo, TipoDocumento } from "@/types/catalogos";
import { sessionBranchId } from "@/utils/sesion";

type FormDocumento = Partial<TipoDocumento> & { id_branch?: number };

const documentStore = useDocumentStore();
const rootStore = useStore();

const headers = [
  { title: "Código", align: "start", key: "code" },
  { title: "Nombre (Descripción Corta)", key: "name" },
  { title: "Descripción Larga", key: "description" },
  { title: "Estado", key: "status" },
  { title: "Creación", key: "created_at" },

  { title: "Última Actualización", key: "updated_at" },
  { title: "Acciones", key: "action" },
] as const;
const loading = ref(true);
const loading_as = ref(true);
const search = ref("");
const documents = ref<FiltroCatalogo>({
  code: "",
  name: "",
  description: "",
  status: 1,
});
const document = ref<FormDocumento>({
  id_branch: sessionBranchId(),
  code: "",
  name: "",
  description: "",
  status: 1,
});
const showFilterDrawerNew = ref(false);
const showFilterDrawerRead = ref(false);
const showFilterDrawerUpdate = ref(false);
const showFilterDrawer = ref(false);
const id = ref<number | "">("");
const formNew = useTemplateRef("formNew");
const form = useTemplateRef("form");

watch(
  () => documentStore.record,
  (newRecord) => {
    if (newRecord && Object.keys(newRecord).length > 0) {
      const { code, name, description, status } = newRecord;
      document.value = { code, name, description, status };
      loading_as.value = false;
    }
  },
  { immediate: true },
);
watch(
  () => documentStore.loading,
  (newList) => {
    loading.value = newList == true ? false : true;
  },
  { immediate: true },
);

const originalDocument = ref<FormDocumento>({ ...document.value });
const originalDocuments = ref<FiltroCatalogo>({ ...documents.value });

onMounted(async () => {
  await documentStore.fetchDataDocument(documents.value);
  rootStore.state.mainTitle = `Tipo de Documentos`;
});

async function clear(option?: string) {
  if (option == "filter") {
    documents.value = { ...originalDocuments.value };
  } else {
    document.value = { ...originalDocument.value };
  }
  await documentStore.fetchDataDocument(documents.value);
  showFilterDrawer.value = false;
}
async function reset_records() {
  clear("filter");
}
function updateStatus(newValue: unknown) {
  document.value.status = newValue ? 1 : 0;
}
async function insert() {
  if ((await formNew.value!.validate()).valid) {
    clear("filter");
    await documentStore.insertDocument(document.value);
  }
}
async function switch_status(item: TipoDocumento) {
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
      item.status = 0;
      clear("filter");
      await documentStore.updateDocument(item);
    }
  });
}
function open_filter() {
  showFilterDrawer.value = !showFilterDrawer.value;
}
function open_insert() {
  resetForms();
  clear();
  showFilterDrawerNew.value = !showFilterDrawerNew.value;
}
async function open_read(itemId: number) {
  loading_as.value = true;
  showFilterDrawerRead.value = !showFilterDrawerRead.value;
  await documentStore.readDocument(itemId);
}
async function open_update(itemId: number) {
  loading_as.value = true;
  resetForms();
  showFilterDrawerUpdate.value = !showFilterDrawerUpdate.value;
  await documentStore.readDocument(itemId);
  id.value = itemId;
}
async function update() {
  if ((await form.value!.validate()).valid) {
    const data = {
      id: id.value as number,
      name: document.value.name,
      description: document.value.description,
      status: document.value.status,
    };
    clear("filter");
    await documentStore.updateDocument(data);
  }
}
async function filter() {
  const data = { ...documents.value };
  data.status = data.status == "null" ? "" : data.status;
  if (data.code === null) data.code = "";
  if (data.name === null) data.name = "";
  if (data.description === null) data.description = "";
  await documentStore.fetchDataDocument(data);
  showFilterDrawer.value = false;
}
function validateName(v: string | null) {
  const length = 255;
  if (!v) {
    return "El nombre es requerido";
  } else if (v.length > length) {
    return `El nombre debe tener un máximo de  ${length} caracteres `;
  } else {
    return true;
  }
}
function validateDescription(v: string | null) {
  const length = 255;
  if (!v) {
    return "La descripción larga es requerida";
  } else if (v.length > length) {
    return `La descripción larga debe tener un máximo de  ${length} caracteres`;
  } else {
    return true;
  }
}
function resetForms() {
  if (formNew.value) formNew.value.reset();
  if (form.value) form.value.reset();
}
</script>

<template>
  <v-card
    fluid
    class="px-5"
  >
    <v-card elevation="0">
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
          @click="open_insert()"
        >
          Nuevo
        </v-btn>
        <v-btn
          size="small"
          class="mx-1"
          color="#2962FF"
          @click="open_filter()"
        >
          Fitrar
        </v-btn>
        <v-btn
          size="small"
          class="mx-1"
          color="#004D40"
        >
          Exportar
        </v-btn>
      </v-card-title>

      <v-data-table
        v-if="!loading"
        class="elevation-1"
        :headers="headers"
        :items="documentStore.list"
        item-value="id"
        :search="search"
      >
        <template #[`item.status`]="{ item }">
          {{ !!item.status ? "Activo" : "Inactivo" }}
        </template>
        <template #[`item.action`]="{ item }">
          <v-btn
            variant="text"
            icon
          >
            <v-icon
              color="primary"
              @click="open_read(item.id)"
            >
              mdi-eye
            </v-icon>
          </v-btn>
          <v-btn
            variant="text"
            icon
          >
            <v-icon
              color="warning"
              @click="open_update(item.id)"
            >
              mdi-pencil
            </v-icon>
          </v-btn>

          <v-btn
            variant="text"
            icon
            color="red"
            @click="switch_status(item)"
            v-if="item.status"
          >
            <v-icon>mdi-delete</v-icon>
          </v-btn>
        </template>
      </v-data-table>
    </v-card>

    <v-navigation-drawer
      v-model="showFilterDrawerNew"
      location="right"
      temporary
      
      width="30%"
    >
      <v-list-item>
        <v-list-item-title class="text-headline-small">
          Nuevo Tipo de Documento
        </v-list-item-title>
      </v-list-item>

      <v-spacer />

      <v-container>
        <v-card-text>
          <v-form ref="formNew">
            <v-row>
              <v-text-field
                type="text"
                label="Nombre (Descripción Corta) (*)"
                v-model="document.name"
                :rules="[(v) => validateName(v)]"
                clearable
              />
            </v-row>
            <v-row>
              <v-text-field
                type="text"
                label="Descripción Larga (*)"
                v-model="document.description"
                :rules="[(v) => validateDescription(v)]"
                clearable
              />
            </v-row>
          </v-form>
          <v-row>
            <v-switch
              density="compact"
              :label="`Estado: ${document.status ? 'Activo' : 'Inactivo'}`"
              v-model="document.status"
              :value-comparator="(value, checked) => Boolean(value) === checked"
              hide-details
              color="success"
              @update:model-value="updateStatus"
            />
          </v-row>
        </v-card-text>

        <v-card-actions class="justify-end mt-3">
          <v-btn
            class="mx-1"
            color="success"
            @click="insert()"
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

    <v-navigation-drawer
      v-model="showFilterDrawerRead"
      location="right"
      temporary
      
      width="30%"
    >
      <v-container v-if="!loading_as">
        <v-list-item class="px-0">
          <v-list-item-title class="text-headline-small">
            Ver: {{ documentStore.record.name }}
          </v-list-item-title>
        </v-list-item>
        <v-spacer />

        <v-card-text>
          <v-row>
            <v-text-field
              label="Código"
              readonly
              :model-value="documentStore.record.code"
            />
          </v-row>
          <v-row>
            <v-text-field
              label="Nombre (Descripción Corta)"
              readonly
              :model-value="documentStore.record.name"
            />
          </v-row>
          <v-row>
            <v-text-field
              label="Descripción Larga"
              readonly
              :model-value="documentStore.record.description"
            />
          </v-row>
          <v-row>
            <v-switch
              readonly
              :label="`Estado: ${
                !!documentStore.record.status ? 'Activo' : 'Inactivo'
              }`"
              color="success"
              v-model="documentStore.record.status"
              :value-comparator="(value, checked) => Boolean(value) === checked"
            />
          </v-row>
        </v-card-text>
        <v-card-actions class="justify-end mt-3">
          <v-btn
            class="mx-1"
            color="warning"
            @click="showFilterDrawerRead = !showFilterDrawerRead"
          >
            Cerrar
          </v-btn>
        </v-card-actions>
      </v-container>

      <v-container
        v-if="loading_as"
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
    </v-navigation-drawer>

    <v-navigation-drawer
      v-model="showFilterDrawerUpdate"
      location="right"
      temporary
      
      width="30%"
    >
      <v-container v-if="!loading_as">
        <v-list-item class="px-0">
          <v-list-item-title class="text-headline-small">
            Modificar: {{ documentStore.record.name }}
          </v-list-item-title>
        </v-list-item>
        <v-spacer />

        <v-card-text>
          <v-row>
            <v-text-field
              type="text"
              label="Código"
              v-model="document.code"
              readonly
            />
          </v-row>
          <v-form ref="form">
            <v-row>
              <v-text-field
                type="text"
                label="Nombre (Descripción Corta) (*)"
                v-model="document.name"
                :rules="[(v) => validateName(v)]"
                clearable
              />
            </v-row>
            <v-row>
              <v-text-field
                type="text"
                label="Descripción Larga (*)"
                v-model="document.description"
                :rules="[(v) => validateDescription(v)]"
                clearable
              />
            </v-row>
          </v-form>
          <v-row>
            <v-switch
              :label="`Estado: ${document.status ? 'Activo' : 'Inactivo'}`"
              v-model="document.status"
              :value-comparator="(value, checked) => Boolean(value) === checked"
              color="success"
              @update:model-value="updateStatus"
            />
          </v-row>
        </v-card-text>

        <v-card-actions class="justify-end mt-3">
          <v-btn
            class="mx-1"
            color="success"
            @click="update"
          >
            Aceptar
          </v-btn>
          <v-btn
            class="mx-1"
            color="warning"
            @click="showFilterDrawerUpdate = !showFilterDrawerUpdate"
          >
            Cerrar
          </v-btn>
        </v-card-actions>
      </v-container>

      <v-container
        v-if="loading_as"
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
    </v-navigation-drawer>

    <v-navigation-drawer
      v-model="showFilterDrawer"
      location="right"
      temporary
      
      width="30%"
    >
      <v-list-item>
        <v-list-item-title class="text-headline-small">
          Filtrar Registros
        </v-list-item-title>
      </v-list-item>

      <v-spacer />

      <v-container>
        <v-card-text>
          <v-row>
            <v-text-field
              label="Código"
              v-model="documents.code"
              clearable
            />
          </v-row>
          <v-row>
            <v-text-field
              type="text"
              label="Nombre (Descripción Corta)"
              clearable
              v-model="documents.name"
            />
          </v-row>
          <v-row>
            <v-text-field
              label="Descripción Larga"
              v-model="documents.description"
              clearable
            />
          </v-row>
          <v-row>
            <v-radio-group
              v-model="documents.status"
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

        <v-card-actions class="justify-end mt-3">
          <v-btn
            class="mx-1"
            color="success"
            @click="filter()"
          >
            Aceptar
          </v-btn>
          <v-btn
            class="mx-1"
            color="ligth"
            @click="reset_records()"
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
  </v-card>
</template>
