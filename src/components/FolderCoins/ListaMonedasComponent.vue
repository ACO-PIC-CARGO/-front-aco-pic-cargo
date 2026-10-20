<script setup lang="ts">
import { onMounted, ref, useTemplateRef, watch } from "vue";
import Swal from "sweetalert2";
import { useAppStore } from "@/stores/app";
import { useCoinsStore } from "@/stores/coins";
import type { FiltroMonedas, FormMoneda, Moneda } from "@/types/catalogos";
import { sessionBranchId } from "@/utils/sesion";

const coinsStore = useCoinsStore();
const appStore = useAppStore();

const headers = [
  { title: "Código", align: "start", key: "code" },
  { title: "Símbolo", key: "symbol" },
  { title: "Acrónimo", key: "acronym" },
  { title: "Nombre", key: "name" },
  { title: "Descripción", key: "description" },
  { title: "Estado", key: "status" },
  { title: "Creación", key: "created_at" },

  { title: "Última Actualización", key: "updated_at" },
  { title: "Acciones", key: "action" },
] as const;
const loading = ref(true);
const loading_as = ref(true);
const search = ref("");
const records = ref<FiltroMonedas>({
  code: "",
  symbol: "",
  acronym: "",
  name: "",
  description: "",
  status: 1,
});
const record = ref<FormMoneda>({
  id_branch: sessionBranchId(),
  code: "",
  symbol: "",
  acronym: "",
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
  () => coinsStore.record,
  (newRecord) => {
    if (newRecord && Object.keys(newRecord).length > 0) {
      const { code, symbol, name, description, acronym, status } = newRecord;
      record.value = { code, symbol, name, description, acronym, status };
      loading_as.value = false;
    }
  },
  { immediate: true },
);
watch(
  () => coinsStore.loading,
  (newList) => {
    loading.value = newList == true ? false : true;
  },
  { immediate: true },
);

const originalRecord = ref<FormMoneda>({ ...record.value });
const originalRecords = ref<FiltroMonedas>({ ...records.value });

onMounted(async () => {
  await coinsStore.fetchDataCoins(records.value);
  appStore.mainTitle = `Monedas`;
});

function updateStatus(newValue: unknown) {
  record.value.status = newValue ? 1 : 0;
}
async function resetRecord(option?: string) {
  if (option == "filter") {
    records.value = { ...originalRecords.value };
  } else {
    record.value = { ...originalRecord.value };
  }
  await coinsStore.fetchDataCoins(records.value);
  showFilterDrawer.value = false;
}
// eslint-disable-next-line @typescript-eslint/no-unused-vars
async function reset_records() {
  resetRecord("filter");
  submit_filter();
}
// eslint-disable-next-line @typescript-eslint/no-unused-vars
async function switch_status(item: Moneda) {
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
      await coinsStore.updateCoins(item);
    }
  });
}
function resetForms() {
  if (formNew.value) formNew.value.reset();
  if (form.value) form.value.reset();
}
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function open_new() {
  resetRecord();
  resetForms();
  showFilterDrawerNew.value = !showFilterDrawerNew.value;
}
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function open_filter() {
  showFilterDrawer.value = !showFilterDrawer.value;
}
async function open_read(itemId: number) {
  loading_as.value = true;
  showFilterDrawerRead.value = !showFilterDrawerRead.value;
  await coinsStore.readCoins(itemId);
}
async function open_update(itemId: number) {
  loading_as.value = true;
  resetRecord();
  resetForms();
  showFilterDrawerUpdate.value = !showFilterDrawerUpdate.value;
  await coinsStore.readCoins(itemId);
  id.value = itemId;
}
async function submit_insert() {
  if ((await formNew.value!.validate()).valid) {
    resetRecord("filter");
    await coinsStore.insertCoins(record.value);
  }
}
async function submit_update() {
  if ((await form.value!.validate()).valid) {
    const data = {
      id: id.value as number,
      symbol: record.value.symbol,
      acronym: record.value.acronym,
      name: record.value.name,
      description: record.value.description,
      status: record.value.status,
    };
    resetRecord("filter");
    await coinsStore.updateCoins(data);
  }
}
async function submit_filter() {
  const data = { ...records.value };
  data.status = data.status == "null" ? "" : data.status;

  if (data.code === null) data.code = "";
  if (data.symbol === null) data.symbol = "";
  if (data.acronym === null) data.acronym = "";
  if (data.description === null) data.description = "";

  await coinsStore.fetchDataCoins(data);
  showFilterDrawer.value = false;
}
function validateSymbol(v: string | null) {
  if (!v) {
    return "El símbolo es requerido";
  }
  if (v.length > 255) {
    return "El símbolo permite hasta 255 caracteres";
  }
  return true;
}
function validateAcronym(v: string | null) {
  if (!v) {
    return "El acrónimo es requerido";
  }
  if (v.length > 255) {
    return "El acrónimo permite hasta 255 caracteres";
  }
  return true;
}
function validateName(v: string | null) {
  if (!v) {
    return "El nombre es requerido";
  }
  if (v.length > 255) {
    return "El nombre permite hasta 255 caracteres";
  }
  return true;
}
function validateDescription(v: string | null) {
  if (!v) {
    return true;
  }
  if (v.length > 255) {
    return "La descripción permite hasta 255 caracteres";
  }
  return true;
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
        <!-- <v-btn small color="success" @click="open_new()"> Nuevo </v-btn> -->
        <!-- <v-btn small class="mx-1" color="#2962FF" @click="open_filter()">
          Fitrar
        </v-btn>
        <v-btn small class="mx-1" color="#004D40"> Exportar </v-btn> -->
      </v-card-title>

      <v-data-table
        v-if="!loading"
        class="elevation-1"
        :headers="headers"
        :items="coinsStore.list"
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

          <!-- <v-btn icon>
            <v-btn
              icon
              color="red"
              @click="switch_status(item)"
              v-if="item.status"
            >
              <v-icon>mdi-delete</v-icon>
            </v-btn>
          </v-btn> -->
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
          Nueva Moneda
        </v-list-item-title>
      </v-list-item>

      <v-spacer />

      <v-container>
        <v-card-text>
          <v-form ref="formNew">
            <v-row>
              <v-text-field
                type="text"
                label="Símbolo (*)"
                v-model="record.symbol"
                :rules="[(v) => validateSymbol(v)]"
                clearable
              />
            </v-row>
            <v-row>
              <v-text-field
                type="text"
                label="Acrónimo (*)"
                v-model="record.acronym"
                :rules="[(v) => validateAcronym(v)]"
                clearable
              />
            </v-row>
            <v-row>
              <v-text-field
                type="text"
                label="Nombre (*)"
                v-model="record.name"
                :rules="[(v) => validateName(v)]"
                clearable
              />
            </v-row>
            <v-row>
              <v-text-field
                type="text"
                label="Descripción"
                v-model="record.description"
                :rules="[(v) => validateDescription(v)]"
                clearable
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
            Ver: {{ coinsStore.record.name }}
          </v-list-item-title>
        </v-list-item>

        <v-spacer />
        <v-card-text>
          <v-row>
            <v-text-field
              label="Código"
              readonly
              :model-value="coinsStore.record.code"
            />
          </v-row>
          <v-row>
            <v-text-field
              label="Símbolo"
              readonly
              :model-value="coinsStore.record.symbol"
            />
          </v-row>
          <v-row>
            <v-text-field
              label="Acrónimo"
              readonly
              :model-value="coinsStore.record.acronym"
            />
          </v-row>
          <v-row>
            <v-text-field
              label="Nombre"
              readonly
              :model-value="coinsStore.record.name"
            />
          </v-row>
          <v-row>
            <v-text-field
              label="Descripción"
              readonly
              :model-value="coinsStore.record.description"
            />
          </v-row>
          <v-row>
            <v-switch
              readonly
              :label="`Estado: ${
                !!coinsStore.record.status ? 'Activo' : 'Inactivo'
              }`"
              color="success"
              v-model="coinsStore.record.status"
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
            Modificar: {{ coinsStore.record.name }}
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
                label="Símbolo (*)"
                v-model="record.symbol"
                :rules="[(v) => validateSymbol(v)]"
                clearable
              />
            </v-row>
            <v-row>
              <v-text-field
                type="text"
                label="Acrónimo (*)"
                v-model="record.acronym"
                :rules="[(v) => validateAcronym(v)]"
                clearable
              />
            </v-row>
            <v-row>
              <v-text-field
                type="text"
                label="Nombre (*)"
                v-model="record.name"
                :rules="[(v) => validateName(v)]"
                clearable
              />
            </v-row>
            <v-row>
              <v-text-field
                type="text"
                label="Descripción"
                v-model="record.description"
                :rules="[(v) => validateDescription(v)]"
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
              label="Símbolo"
              v-model="records.symbol"
              clearable
            />
          </v-row>
          <v-row>
            <v-text-field
              label="Acrónimo"
              v-model="records.acronym"
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
