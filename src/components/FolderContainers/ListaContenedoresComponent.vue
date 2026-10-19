<script setup lang="ts">
import { onMounted, ref, useTemplateRef, watch } from "vue";
import Swal from "sweetalert2";
import { useStore } from "vuex";
import { useContainersStore } from "@/stores/containers";
import type { FiltroCatalogo, TipoContenedor } from "@/types/catalogos";
import { sessionBranchId } from "@/utils/sesion";

type FormContenedor = Partial<TipoContenedor> & { id_branch?: number };

const containersStore = useContainersStore();
const rootStore = useStore();

const headers = [
  { title: "Código", align: "start", key: "code" },
  { title: "Nombre", key: "name" },
  { title: "Descripción", key: "description" },
  { title: "Largo", key: "long" },
  { title: "Ancho", key: "width" },
  { title: "Altura", key: "height" },
  { title: "Peso Máximo", key: "maximumweight" },
  { title: "Volumen Máximo", key: "maximunvolumen" },
  { title: "Estado", key: "status" },
  { title: "Creación", key: "created_at" },

  { title: "Última Actualización", key: "updated_at" },
  { title: "Acciones", key: "action" },
] as const;
const loading = ref(true);
const loading_as = ref(true);
const search = ref("");
const records = ref<FiltroCatalogo>({
  code: "",
  name: "",
  description: "",
  status: 1,
});
const record = ref<FormContenedor>({
  id_branch: sessionBranchId(),
  name: "",
  description: "",
  long: null,
  width: null,
  height: null,
  maximumweight: null,
  maximunvolumen: null,
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
  () => containersStore.record,
  (newRecord) => {
    if (newRecord && Object.keys(newRecord).length > 0) {
      const {
        name,
        description,
        long,
        width,
        height,
        maximumweight,
        maximunvolumen,
        status,
      } = newRecord;
      record.value = {
        name,
        description,
        long,
        width,
        height,
        maximumweight,
        maximunvolumen,
        status,
      };
      loading_as.value = false;
    }
  },
  { immediate: true },
);
watch(
  () => containersStore.loading,
  (newList) => {
    loading.value = newList == true ? false : true;
  },
  { immediate: true },
);

const originalRecord = ref<FormContenedor>({ ...record.value });
const originalRecords = ref<FiltroCatalogo>({ ...records.value });

onMounted(async () => {
  await containersStore.fetchDataContainers(records.value);
  rootStore.state.mainTitle = `Tipo de Contenedor`;
});

function updateStatus(newValue: unknown) {
  record.value.status = newValue ? 1 : 0;
}
async function resetRecord(option?: string) {
  if (option == "filter") {
    records.value = { ...originalRecords.value };
    await containersStore.fetchDataContainers(records.value);
    showFilterDrawer.value = false;
  } else {
    record.value = { ...originalRecord.value };
  }
  await containersStore.fetchDataContainers(records.value);
  showFilterDrawer.value = false;
}
async function reset_records() {
  resetRecord("filter");
  submit_filter();
}
async function switch_status(item: TipoContenedor) {
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
      resetRecord("filter");
      await containersStore.updateContainers(item);
      await reset_records();
    }
  });
}
function resetForms() {
  if (formNew.value) formNew.value.reset();
  if (form.value) form.value.reset();
}
function open_new() {
  resetRecord();
  resetForms();
  showFilterDrawerNew.value = !showFilterDrawerNew.value;
}
function open_filter() {
  showFilterDrawer.value = !showFilterDrawer.value;
}
async function open_read(itemId: number) {
  loading_as.value = true;
  showFilterDrawerRead.value = !showFilterDrawerRead.value;
  await containersStore.readContainers(itemId);
}
async function open_update(itemId: number) {
  loading_as.value = true;
  resetRecord();
  resetForms();
  showFilterDrawerUpdate.value = !showFilterDrawerUpdate.value;
  await containersStore.readContainers(itemId);
  id.value = itemId;
}
async function submit_insert() {
  if ((await formNew.value!.validate()).valid) {
    resetRecord("filter");
    await containersStore.insertContainers(record.value);
  }
}
async function submit_update() {
  if ((await form.value!.validate()).valid) {
    const data = {
      id: id.value as number,
      name: record.value.name,
      description: record.value.description,
      long: record.value.long,
      width: record.value.width,
      height: record.value.height,
      maximumweight: record.value.maximumweight,
      maximunvolumen: record.value.maximunvolumen,
      status: record.value.status,
    };
    resetRecord("filter");
    await containersStore.updateContainers(data);
  }
}
async function submit_filter() {
  const data = { ...records.value };
  data.status = data.status == "null" ? "" : data.status;

  if (data.code === null) data.code = "";
  if (data.name === null) data.name = "";
  if (data.description === null) data.description = "";

  await containersStore.fetchDataContainers(data);
  showFilterDrawer.value = false;
}
function validateNumber(value: string) {
  const regex = /^(0|[1-9]\d*)(\.\d{1,2})?$/;
  if (!value) {
    return "El campo es requerido";
  }
  if (!regex.test(value)) {
    return "El campo debe ser un número positivo de hasta 2 decimales.";
  }
  return true;
}
function validateFieldTextInForm(v: string | null, length: number, isOptional: boolean, condition: string) {
  if (!v && !isOptional) {
    return "El campo es requerido";
  }
  if (condition == "max" && v && v.length > length) {
    return `El campo permite hasta ${length} caracteres`;
  }
  if (condition == "equal" && v && v.length !== length) {
    return `El campo debe tener ${length} caracteres`;
  }
  return true;
}
</script>

<template>
  <v-card
    fluid
    class="px-5"
  >
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
            height="6"
          />
        </v-col>
      </v-row>
    </v-container>

    <v-card-title
      class="d-flex align-center flex-wrap"
      v-if="!loading"
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
        @click="open_new()"
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
      :items="containersStore.list"
      item-value="id"
      :search="search"
    >
      <template #[`item.calculoflag`]="{ item }">
        {{ !!item.calculoflag ? "Sí" : "No" }}
      </template>
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

    <v-navigation-drawer
      v-model="showFilterDrawerNew"
      location="right"
      temporary
      
      width="30%"
    >
      <v-list-item>
        <v-list-item-title class="text-headline-small">
          Nuevo Contenedor
        </v-list-item-title>
      </v-list-item>

      <v-spacer />

      <v-container>
        <v-card-text>
          <v-form ref="formNew">
            <v-row>
              <v-text-field
                type="text"
                label="Nombre (*)"
                v-model="record.name"
                :rules="[(v) => validateFieldTextInForm(v, 50, false, 'max')]"
                clearable
              />
            </v-row>
            <v-row>
              <v-text-field
                type="text"
                label="Descripción"
                v-model="record.description"
                :rules="[(v) => validateFieldTextInForm(v, 50, true, 'max')]"
                clearable
              />
            </v-row>
            <v-row>
              <v-text-field
                type="number"
                label="Largo (*)"
                v-model="record.long"
                :rules="[(v) => validateNumber(v)]"
                clearable
              />
            </v-row>
            <v-row>
              <v-text-field
                type="number"
                label="Ancho (*)"
                v-model="record.width"
                :rules="[(v) => validateNumber(v)]"
                clearable
              />
            </v-row>
            <v-row>
              <v-text-field
                type="number"
                label="Altura (*)"
                v-model="record.height"
                :rules="[(v) => validateNumber(v)]"
                clearable
              />
            </v-row>
            <v-row>
              <v-text-field
                type="number"
                label="Peso Máximo (*)"
                v-model="record.maximumweight"
                :rules="[(v) => validateNumber(v)]"
                clearable
              />
            </v-row>
            <v-row>
              <v-text-field
                type="number"
                label="Volumen Máximo (*)"
                v-model="record.maximunvolumen"
                :rules="[(v) => validateNumber(v)]"
                clearable
              />
            </v-row>
          </v-form>
          <v-row>
            <v-switch
              density="compact"
              :label="`Estado: ${!!record.status ? 'Activo' : 'Inactivo'}`"
              v-model="record.status"
              :value-comparator="(value, checked) => Boolean(value) === checked"
              hide-details
              color="success"
              @update:model-value="updateStatus"
            />
          </v-row>
        </v-card-text>
      </v-container>

      <v-container>
        <v-card-actions class="justify-end mt-3">
          <v-btn
            size="small"
            class="mx-1"
            color="success"
            @click="submit_insert()"
          >
            Aceptar
          </v-btn>
          <v-btn
            size="small"
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
            Ver: {{ containersStore.record.name }}
          </v-list-item-title>
        </v-list-item>

        <v-spacer />
        <v-card-text>
          <v-row>
            <v-text-field
              label="Código"
              readonly
              :model-value="containersStore.record.code"
            />
          </v-row>
          <v-row>
            <v-text-field
              label="Nombre"
              readonly
              :model-value="containersStore.record.name"
            />
          </v-row>
          <v-row>
            <v-text-field
              label="Descripción"
              readonly
              :model-value="containersStore.record.description"
            />
          </v-row>
          <v-row>
            <v-text-field
              label="Largo"
              readonly
              :model-value="containersStore.record.long"
            />
          </v-row>
          <v-row>
            <v-text-field
              label="Ancho"
              readonly
              :model-value="containersStore.record.width"
            />
          </v-row>
          <v-row>
            <v-text-field
              label="Altura"
              readonly
              :model-value="containersStore.record.height"
            />
          </v-row>
          <v-row>
            <v-text-field
              label="Peso Máximo"
              readonly
              :model-value="containersStore.record.maximumweight"
            />
          </v-row>
          <v-row>
            <v-text-field
              label="Volumen Máximo"
              readonly
              :model-value="containersStore.record.maximunvolumen"
            />
          </v-row>
          <v-row>
            <v-switch
              readonly
              :label="`Estado: ${
                !!containersStore.record.status ? 'Activo' : 'Inactivo'
              }`"
              color="success"
              v-model="containersStore.record.status"
              :value-comparator="(value, checked) => Boolean(value) === checked"
            />
          </v-row>
        </v-card-text>
        <v-card-actions class="justify-end mt-3">
          <v-btn
            size="small"
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
            Modificar: {{ containersStore.record.name }}
          </v-list-item-title>
        </v-list-item>

        <v-spacer />

        <v-card-text>
          <v-row>
            <v-text-field
              type="text"
              label="Código"
              v-model="containersStore.record.code"
              readonly
            />
          </v-row>

          <v-form ref="form">
            <v-row>
              <v-text-field
                type="text"
                label="Nombre (*)"
                v-model="record.name"
                :rules="[(v) => validateFieldTextInForm(v, 50, false, 'max')]"
                clearable
              />
            </v-row>
            <v-row>
              <v-text-field
                type="text"
                label="Descripción"
                v-model="record.description"
                :rules="[(v) => validateFieldTextInForm(v, 50, true, 'max')]"
                clearable
              />
            </v-row>
            <v-row>
              <v-text-field
                type="number"
                label="Largo (*)"
                v-model="record.long"
                :rules="[(v) => validateNumber(v)]"
                clearable
              />
            </v-row>
            <v-row>
              <v-text-field
                type="number"
                label="Ancho (*)"
                v-model="record.width"
                :rules="[(v) => validateNumber(v)]"
                clearable
              />
            </v-row>
            <v-row>
              <v-text-field
                type="number"
                label="Altura (*)"
                v-model="record.height"
                :rules="[(v) => validateNumber(v)]"
                clearable
              />
            </v-row>
            <v-row>
              <v-text-field
                type="number"
                label="Peso Máximo (*)"
                v-model="record.maximumweight"
                :rules="[(v) => validateNumber(v)]"
                clearable
              />
            </v-row>
            <v-row>
              <v-text-field
                type="number"
                label="Volumen Máximo (*)"
                v-model="record.maximunvolumen"
                :rules="[(v) => validateNumber(v)]"
                clearable
              />
            </v-row>
          </v-form>

          <v-row>
            <v-switch
              :label="`Estado: ${record.status ? 'Activo' : 'Inactivo'}`"
              v-model="record.status"
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
            @click="submit_update"
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
              v-model="records.code"
              clearable
            />
          </v-row>
          <v-row>
            <v-text-field
              label="Nombre"
              v-model="records.name"
              clearable
            />
          </v-row>
          <v-row>
            <v-text-field
              label="Descripción"
              v-model="records.description"
              clearable
            />
          </v-row>
          <v-row>
            <v-radio-group
              v-model="records.status"
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
            @click="submit_filter()"
          >
            Aceptar
          </v-btn>
          <v-btn
            class="mx-1"
            color="ligth"
            @click="resetRecord('filter')"
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
