<script setup lang="ts">
import { onMounted, ref, useTemplateRef, watch } from "vue";
import Swal from "sweetalert2";
import { useStore } from "vuex";
import axios from "@/api/http";
import { useYearStore } from "@/stores/year";
import type { ApiResponse } from "@/types/api";
import type { Anio, FiltroAnio, FormAnio } from "@/types/catalogos";
import { sessionBranchId } from "@/utils/sesion";

const yearStore = useYearStore();
const rootStore = useStore();

const headers = [
  { title: "Código", align: "start", key: "description" },
  { title: "Estado", key: "status" },
  { title: "Creación", key: "created_at" },

  { title: "Última Actualización", key: "updated_at" },
  { title: "Acciones", key: "action" },
] as const;
const loading = ref(true);
const loading_as = ref(true);
const search = ref("");
const records = ref<FiltroAnio>({
  description: "",
  status: 1,
});
const record = ref<FormAnio>({
  description: "",
  status: 1,
  id_branch: sessionBranchId(),
});
const showFilterDrawerNew = ref(false);
const showFilterDrawerRead = ref(false);
const showFilterDrawerUpdate = ref(false);
const showFilterDrawer = ref(false);
const id = ref<number | "">("");
const errorCode = ref<string | null>(null);
const form = useTemplateRef("form");

watch(
  () => yearStore.record,
  (newRecord) => {
    if (newRecord && Object.keys(newRecord).length > 0) {
      record.value.description = newRecord.description;
      record.value.status = newRecord.status;
      loading_as.value = false;
    }
  },
  { immediate: true },
);
watch(
  () => yearStore.loading,
  (newList) => {
    loading.value = newList == true ? false : true;
  },
  { immediate: true },
);

const originalRecord = ref<FormAnio>({ ...record.value });
const originalRecords = ref<FiltroAnio>({ ...records.value });

onMounted(async () => {
  await yearStore.fetchDataYear(records.value);
  rootStore.state.mainTitle = `Año`;
});

function updateStatus(newValue: unknown) {
  record.value.status = newValue ? 1 : 0;
}
function submit_insert() {
  validate_code();

  setTimeout(async () => {
    if ((await form.value!.validate()).valid && errorCode.value == null) {
      resetRecord("filter");
      await yearStore.insertYear(record.value);
    }
  }, 500);
}
async function resetRecord(option?: string) {
  if (option == "filter") records.value = { ...originalRecords.value };
  else record.value = { ...originalRecord.value };
  await filter();
  // @ts-expect-error Kept: showFilterDrawer is a boolean, so this call has always thrown.
  showFilterDrawer.value();
}
async function reset_records() {
  resetRecord("filter");
}
async function validate_code() {
  errorCode.value = null;

  await axios<ApiResponse>({
    method: "get",
    url:
      import.meta.env.VITE_URL_MAIN +
      `validar_code_year?` +
      `description=${record.value.description}` +
      `&id_branch=${record.value.id_branch}`,
    headers: {
      "Content-Type": "application/json",
    },
  })
    .then((response) => {
      const data = response.data;
      errorCode.value = data.estadoflag ? null : data.mensaje;
      if (!data.estadoflag) record.value.description = "";
    })
    .catch((error) => {
      console.log("Error al obtener los datos:", error);
    });
}
async function switch_status(item: Anio) {
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
      await yearStore.updateYear(item);
      await reset_records();
    }
  });
}
async function open_read(itemId: number) {
  loading_as.value = true;
  showFilterDrawerRead.value = !showFilterDrawerRead.value;
  await yearStore.readYear(itemId);
}
async function open_update(itemId: number) {
  loading_as.value = true;
  showFilterDrawerUpdate.value = !showFilterDrawerUpdate.value;
  await yearStore.readYear(itemId);
  id.value = itemId;
}
async function submit_update() {
  if ((await form.value!.validate()).valid) {
    const data = {
      id: id.value as number,
      description: record.value.description,
      status: record.value.status,
    };
    resetRecord("filter");
    await yearStore.updateYear(data);
  }
}
function open_new() {
  resetRecord();
  form.value!.reset();
  showFilterDrawerNew.value = !showFilterDrawerNew.value;
}
function open_filter() {
  showFilterDrawer.value = !showFilterDrawer.value;
}
async function filter() {
  const data = { ...records.value };
  data.status = data.status == "null" ? "" : data.status;
  if (data.description === null) data.description = "";
  await yearStore.fetchDataYear(data);
  showFilterDrawer.value = false;
}
function validateCode(v: string | null | undefined) {
  if (!v) {
    return "El código es requerido";
  } else if (!/^\d{4}$/.test(v)) {
    return "El código debe ser numérico de 4 caracteres";
  } else {
    return true;
  }
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
      :items="yearStore.list ?? []"
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
        >
          <v-btn
            variant="text"
            icon
            color="red"
            @click="switch_status(item)"
            v-if="item.status"
          >
            <v-icon>mdi-delete</v-icon>
          </v-btn>
          <!-- <v-switch
              v-model="item.status"
              color="success"
              @change="switch_status(item)"
            ></v-switch> -->
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
          Nuevo Año
        </v-list-item-title>
      </v-list-item>

      <v-spacer />
      <v-container class="">
        <v-card-text>
          <v-form ref="form">
            <v-row>
              <v-text-field
                type="text"
                label="Código (*)"
                v-model="record.description"
                clearable
                :rules="[(v) => validateCode(v)]"
                @blur="validate_code()"
                :error-messages="errorCode"
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
              @update:model-value="updateStatus"
            />
          </v-row>
        </v-card-text>
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
            Ver: {{ yearStore.record?.description }}
          </v-list-item-title>
        </v-list-item>

        <v-spacer />

        <v-card-text>
          <v-row>
            <v-text-field
              label="Código"
              readonly
              :model-value="yearStore.record?.description"
            />
          </v-row>
          <v-row>
            <v-switch
              readonly
              :label="`Estado: ${
                !!yearStore.record?.status ? 'Activo' : 'Inactivo'
              }`"
              color="success"
              :model-value="yearStore.record?.status"
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
            Modificar: {{ yearStore.record?.description }}
          </v-list-item-title>
        </v-list-item>

        <v-spacer />

        <v-card-text>
          <v-row>
            <v-text-field
              readonly
              label="Código"
              v-model="record.description"
            />
          </v-row>
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
      <v-container @click.stop>
        <v-list-item class="px-0">
          <v-list-item-title class="text-headline-small">
            Filtrar Año
          </v-list-item-title>
        </v-list-item>

        <v-spacer />

        <v-card-text>
          <v-row>
            <v-text-field
              label="Código"
              v-model="records.description"
              clearable
            />
          </v-row>
          <v-row>
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
