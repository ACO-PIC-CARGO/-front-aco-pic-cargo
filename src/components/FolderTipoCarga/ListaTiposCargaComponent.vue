<script setup lang="ts">
import { onMounted, ref, useTemplateRef, watch } from "vue";
import Swal from "sweetalert2";
import { useStore } from "vuex";
import { useShipmentStore } from "@/stores/shipment";
import type { FiltroTipoCarga, FormTipoCarga } from "@/types/catalogos";
import type { TipoCarga } from "@/types/cotizacion";
import { sessionBranchId } from "@/utils/sesion";

const shipmentStore = useShipmentStore();
const rootStore = useStore();

const headers = [
  { title: "Código", align: "start", key: "code" },
  { title: "Tipo de Transporte", key: "type_transport" },
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
const records = ref<FiltroTipoCarga>({
  id_transport: "",
  name: "",
  description: "",
  status: 1,
});
const record = ref<FormTipoCarga>({
  code: "",
  name: "",
  description: "",
  id_transport: "",
  status: 1,
  id_branch: sessionBranchId(),
});
const showFilterDrawerNew = ref(false);
const showFilterDrawerRead = ref(false);
const showFilterDrawerUpdate = ref(false);
const showFilterDrawer = ref(false);
const id = ref<TipoCarga["id"] | "">("");
const formNew = useTemplateRef("formNew");
const form = useTemplateRef("form");

watch(
  () => shipmentStore.record,
  (newRecord) => {
    if (newRecord && Object.keys(newRecord).length > 0) {
      const { code, name, description, id_transport, status } = newRecord;
      record.value = { code, name, description, id_transport, status };
      loading_as.value = false;
    }
  },
  { immediate: true },
);
watch(
  () => shipmentStore.loading,
  (newList) => {
    loading.value = newList == true ? false : true;
  },
  { immediate: true },
);

const originalRecord = ref<FormTipoCarga>({ ...record.value });
const originalRecords = ref<FiltroTipoCarga>({ ...records.value });

onMounted(async () => {
  await shipmentStore.fetchDataShipment(records.value);
  await shipmentStore.fetchDataCargarTransport();
  rootStore.state.mainTitle = `Tipos de Carga`;
});

function updateStatus(newValue: unknown) {
  record.value.status = newValue ? 1 : 0;
}
async function insert() {
  if ((await formNew.value!.validate()).valid) {
    resetRecord("filter");
    await shipmentStore.insertShipment(record.value);
  }
}
async function resetRecord(option?: string) {
  if (option == "filter") {
    records.value = { ...originalRecords.value };
  } else {
    record.value = { ...originalRecord.value };
  }
  await shipmentStore.fetchDataShipment(records.value);
  showFilterDrawer.value = false;
}
async function reset_records() {
  resetRecord("filter");
}
async function switch_status(item: TipoCarga) {
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
      await shipmentStore.updateShipment(item);
    }
  });
}
async function open_read(itemId: TipoCarga["id"]) {
  loading_as.value = true;
  resetRecord();
  showFilterDrawerRead.value = !showFilterDrawerRead.value;
  await shipmentStore.readShipment(itemId);
}
async function open_update(itemId: TipoCarga["id"]) {
  loading_as.value = true;
  resetForms();
  showFilterDrawerUpdate.value = !showFilterDrawerUpdate.value;
  await shipmentStore.readShipment(itemId);
  id.value = itemId;
}
async function btnUpdate() {
  const data = {
    id: id.value as number,
    name: record.value.name,
    description: record.value.description,
    id_transport: record.value.id_transport,
    status: record.value.status,
  };
  if ((await form.value!.validate()).valid) {
    resetRecord("filter");
    await shipmentStore.updateShipment(data);
  }
}
function open_new() {
  resetRecord();
  resetForms();
  showFilterDrawerNew.value = !showFilterDrawerNew.value;
}
function open_filter() {
  showFilterDrawer.value = !showFilterDrawer.value;
}
async function filter() {
  const data = { ...records.value };
  data.status = data.status == "null" ? "" : data.status;
  if (data.name === null) data.name = "";
  if (data.description === null) data.description = "";
  if (data.id_transport === null) data.id_transport = "";
  await shipmentStore.fetchDataShipment(data);
  showFilterDrawer.value = false;
}
function resetForms() {
  if (formNew.value) formNew.value.reset();
  if (form.value) form.value.reset();
}
function validateFieldTextInForm(v: string | null | undefined, length: number, isOptional: boolean, condition: string) {
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
      :items="shipmentStore.list"
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

    <v-navigation-drawer
      v-model="showFilterDrawerNew"
      location="right"
      temporary
      
      width="30%"
    >
      <v-list-item>
        <v-list-item-title class="text-headline-small">
          Nuevo Tipo de Carga
        </v-list-item-title>
      </v-list-item>

      <v-spacer />
      <v-container class="">
        <v-card-text>
          <v-form ref="formNew">
            <v-row>
              <v-text-field
                type="text"
                label="Código (*)"
                v-model="record.code"
                :rules="[(v) => validateFieldTextInForm(v, 3, false, 'max')]"
                clearable
              />
            </v-row>
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
              <v-autocomplete
                label="Tipo de Transporte (*)"
                clearable
                v-model="record.id_transport"
                :items="shipmentStore.transports"
                :item-title="(item) => item.code + ' - ' + item.name"
                item-value="id"
                :rules="[(v) => !!v || 'Dato requerido']"
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
      <v-list-item>
        <v-list-item-title class="text-headline-small">
          Ver: {{ shipmentStore.record.name }}
        </v-list-item-title>
      </v-list-item>

      <v-container v-if="!loading_as">
        <v-card-text>
          <v-row>
            <v-text-field
              label="Código"
              readonly
              :model-value="shipmentStore.record.code"
            />
          </v-row>
          <v-row>
            <v-text-field
              label="Nombre"
              readonly
              :model-value="shipmentStore.record.name"
            />
          </v-row>
          <v-row>
            <v-text-field
              label="Descripción"
              readonly
              :model-value="shipmentStore.record.description"
            />
          </v-row>
          <v-row>
            <v-text-field
              label="Tipo de Transporte"
              readonly
              :model-value="`${shipmentStore.record.code_transport} - ${shipmentStore.record.type_transport}`"
            />
          </v-row>
          <v-row>
            <v-switch
              readonly
              :label="`Estado: ${
                !!shipmentStore.record.status ? 'Activo' : 'Inactivo'
              }`"
              color="success"
              v-model="shipmentStore.record.status"
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
            Modificar: {{ shipmentStore.record.name }}
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
              <v-autocomplete
                label="Tipo de Transporte (*)"
                v-model="record.id_transport"
                :items="shipmentStore.transports"
                :item-title="(item) => item.code + ' - ' + item.name"
                item-value="id"
                :rules="[(v) => !!v || 'Dato requerido']"
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
            @click="btnUpdate"
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
      <v-container>
        <v-list-item class="px-0">
          <v-list-item-title class="text-headline-small">
            Filtrar Registros
          </v-list-item-title>
        </v-list-item>

        <v-spacer />

        <v-card-text>
          <v-row>
            <v-autocomplete
              label="Tipo de Transporte"
              clearable
              v-model="records.id_transport"
              :items="shipmentStore.transports"
              :item-title="(item) => item.code + ' - ' + item.name"
              item-value="id"
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
