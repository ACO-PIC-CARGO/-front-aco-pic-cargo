<script setup lang="ts">
import { nextTick, onMounted, ref, useTemplateRef, watch } from "vue";
import Swal from "sweetalert2";
import { useAppStore } from "@/stores/app";
import axios from "@/api/http";
import { useGastosStore } from "@/stores/gastos";
import type { ApiResponse } from "@/types/api";
import type { FiltroGastoIngreso, FormGasto, TipoGasto } from "@/types/catalogos";
import { sessionBranchId } from "@/utils/sesion";

const gastosStore = useGastosStore();
const appStore = useAppStore();

const headers = [
  { title: "Código", align: "start", key: "code" },
  { title: "Descripción", key: "description" },
  { title: "Calculado en Reportes", key: "calculoflag" },
  { title: "Estado", key: "status" },
  { title: "Creación", key: "created_at" },

  { title: "Última Actualización", key: "updated_at" },
  { title: "Acciones", key: "action" },
] as const;
const loading = ref(true);
const loading_as = ref(true);
const search = ref("");
const records = ref<FiltroGastoIngreso>({
  code: "",
  description: "",
  calculoflag: "",
  status: true,
});
const record = ref<FormGasto>({
  id_branch: sessionBranchId(),
  code: "",
  description: "",
  calculoflag: "",
  status: true,
});
const showFilterDrawerNew = ref(false);
const showFilterDrawerRead = ref(false);
const showFilterDrawerUpdate = ref(false);
const showFilterDrawer = ref(false);
const id = ref<number | "">("");
const errorCode = ref<string | null>(null);
const formNew = useTemplateRef("formNew");
const form = useTemplateRef("form");

watch(
  () => gastosStore.record,
  (newRecord) => {
    if (newRecord && Object.keys(newRecord).length > 0) {
      const { code, description, calculoflag, status } = newRecord;
      record.value = { code, description, calculoflag, status };
      loading_as.value = false;
    }
  },
  { immediate: true },
);
watch(
  () => gastosStore.loading,
  (newList) => {
    loading.value = newList == true ? false : true;
  },
  { immediate: true },
);

const originalRecord = ref<FormGasto>({ ...record.value });
const originalRecords = ref<FiltroGastoIngreso>({ ...records.value });

onMounted(async () => {
  await gastosStore.fetchDataGasto(records.value);
  appStore.mainTitle = `Tipo de Gasto`;
});

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function updateStatus(newValue: unknown) {
  record.value.status = newValue ? 1 : 0;
}
async function resetRecord(option?: string) {
  if (option == "filter") {
    records.value = { ...originalRecords.value };
  } else {
    record.value = { ...originalRecord.value };
  }
  await gastosStore.fetchDataGasto(records.value);
  showFilterDrawer.value = false;
}
async function reset_records() {
  resetRecord("filter");
}
async function switch_status(item: TipoGasto) {
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
      await gastosStore.updateGasto(item);
    }
  });
}
function resetForms() {
  errorCode.value = null;
  if (formNew.value) formNew.value.reset();
  if (form.value) form.value.reset();
}
function open_new() {
  resetRecord();
  resetForms();
  showFilterDrawerNew.value = !showFilterDrawerNew.value;
  nextTick(() => {
    record.value.calculoflag = true;
  });
}
function open_filter() {
  showFilterDrawer.value = !showFilterDrawer.value;
}
async function open_read(itemId: number) {
  loading_as.value = true;
  showFilterDrawerRead.value = !showFilterDrawerRead.value;
  await gastosStore.readGasto(itemId);
}
async function open_update(itemId: number) {
  loading_as.value = true;
  resetRecord();
  resetForms();
  showFilterDrawerUpdate.value = !showFilterDrawerUpdate.value;
  await gastosStore.readGasto(itemId);
  id.value = itemId;
}
async function submit_insert() {
  validate_nuevo_code();
  if ((await formNew.value!.validate()).valid && errorCode.value == null) {
    resetRecord("filter");
    await gastosStore.insertGasto(record.value);
  }
}
async function submit_update() {
  if ((await form.value!.validate()).valid && errorCode.value == null) {
    const data = {
      id: id.value as number,
      description: record.value.description,
      calculoflag: record.value.calculoflag,
      status: record.value.status,
    };
    resetRecord("filter");
    await gastosStore.updateGasto(data);
  }
}
async function submit_filter() {
  const data = { ...records.value };
  data.status = data.status == "null" ? "" : data.status;
  if (data.code === null) data.code = "";
  if (data.description === null) data.description = "";
  await gastosStore.fetchDataGasto(data);
  showFilterDrawer.value = false;
}
function validateCode(v: string | null) {
  if (!v) {
    return "El código es requerido";
  }
  if (v.length !== 5) {
    return "El código debe tener exactamente 5 caracteres";
  }
  return true;
}
function validateDescription(v: string | null) {
  if (!v) {
    return "La descripción es requerida";
  }
  if (v.length > 255) {
    return "La descripción permite hasta 255 caracteres";
  }
  return true;
}
async function validate_nuevo_code() {
  errorCode.value = null;

  const config = {
    method: "get",
    url:
      import.meta.env.VITE_URL_MAIN +
      `validar_nuevo_codigo_gasto?` +
      `id_branch=${record.value.id_branch}` +
      `&code=${encodeURIComponent(String(record.value.code))}`,
    headers: {
      "Content-Type": "application/json",
    },
  };

  await axios<ApiResponse>(config)
    .then((response) => {
      const data = response.data;
      errorCode.value = data.estadoflag ? null : data.mensaje;
      if (!data.estadoflag) record.value.code = "";
    })
    .catch((error) => {
      console.log("Error al obtener los datos:", error);
    });
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
        :items="gastosStore.list"
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
    </v-card>

    <v-navigation-drawer
      v-model="showFilterDrawerNew"
      location="right"
      temporary
      
      width="30%"
    >
      <v-list-item>
        <v-list-item-title class="text-headline-small">
          Nuevo Tipo de Gasto
        </v-list-item-title>
      </v-list-item>

      <v-spacer />

      <v-container>
        <v-card-text>
          <v-form ref="formNew">
            <v-row>
              <v-text-field
                type="text"
                label="Código (*)"
                v-model="record.code"
                @blur="validate_nuevo_code()"
                :rules="[(v) => validateCode(v)]"
                :error-messages="errorCode"
                clearable
              />
            </v-row>
            <v-row>
              <v-text-field
                type="text"
                label="Descripción (*)"
                v-model="record.description"
                :rules="[(v) => validateDescription(v)]"
                clearable
              />
            </v-row>
            <v-row>
              <v-checkbox
                label="Se calcula en Reportes"
                v-model="record.calculoflag"
                :value-comparator="(value, checked) => Boolean(value) === checked"
              />
            </v-row>
          </v-form>
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
        </v-card-text>
      </v-container>

      <v-container>
        <v-card-actions class="justify-end mt-3">
          <v-btn
            class="mx-1"
            color="success"
            @click="submit_insert()"
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
            Ver: {{ gastosStore.record.description }}
          </v-list-item-title>
        </v-list-item>

        <v-spacer />
        <v-card-text>
          <v-row>
            <v-text-field
              label="Código"
              readonly
              :model-value="gastosStore.record.code"
            />
          </v-row>
          <v-row>
            <v-text-field
              label="Descripción"
              readonly
              :model-value="gastosStore.record.description"
            />
          </v-row>
          <v-row>
            <v-checkbox
              label="Se calcula en Reportes"
              readonly
              v-model="gastosStore.record.calculoflag"
              :value-comparator="(value, checked) => Boolean(value) === checked"
            />
          </v-row>
          <v-row>
            <v-switch
              readonly
              :label="`Estado: ${
                !!gastosStore.record.status ? 'Activo' : 'Inactivo'
              }`"
              color="success"
              v-model="gastosStore.record.status"
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
            Modificar: {{ gastosStore.record.description }}
          </v-list-item-title>
        </v-list-item>

        <v-spacer />

        <v-card-text>
          <v-row>
            <v-text-field
              type="text"
              label="Código"
              v-model="record.code"
              readonly
            />
          </v-row>

          <v-form ref="form">
            <v-row>
              <v-text-field
                type="text"
                label="Descripción (*)"
                v-model="record.description"
                :rules="[(v) => validateDescription(v)]"
                clearable
              />
            </v-row>
            <v-row>
              <v-checkbox
                label="Se calcula en Reportes"
                v-model="record.calculoflag"
                :value-comparator="(value, checked) => Boolean(value) === checked"
              />
            </v-row>
          </v-form>

          <v-row>
            <v-switch
              :label="`Estado: ${record.status ? 'Activo' : 'Inactivo'}`"
              v-model="record.status"
              :value-comparator="(value, checked) => Boolean(value) === checked"
              color="success"
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
              v-model="records.code"
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
            <v-col class="px-0 py-0">
              <v-list-item-title> Se calcula en Reportes </v-list-item-title>
              <v-radio-group v-model="records.calculoflag">
                <v-radio
                  label="Sí"
                  :value="true"
                />
                <v-radio
                  label="No"
                  :value="false"
                />
              </v-radio-group>
            </v-col>
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
                :value="true"
              />
              <v-radio
                label="Inactivo"
                color="red"
                :value="false"
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
