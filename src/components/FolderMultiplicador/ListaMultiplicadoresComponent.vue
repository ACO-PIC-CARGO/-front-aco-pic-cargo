<script setup lang="ts">
import { onMounted, ref, useTemplateRef, watch } from "vue";
import Swal from "sweetalert2";
import { useAppStore } from "@/stores/app";
import { useMultiplicadorStore } from "@/stores/multiplicador";
import type { FiltroMultiplicador, TipoContenedor } from "@/types/catalogos";
import type { Multiplicador } from "@/types/cotizacion";

const multiplicadorStore = useMultiplicadorStore();
const appStore = useAppStore();

const headers = [
  { title: "Tipo de Carga", align: "start", key: "type_carga" },
  // { text: "Código", value: "code" },
  { title: "Nombre", key: "name" },
  // { text: "Descripción", value: "description" },
  { title: "Valor", key: "valor" },
  { title: "Estado", key: "status" },
  { title: "Creación", key: "created_at" },

  { title: "Última Actualización", key: "updated_at" },
  { title: "Acciones", key: "action" },
] as const;
const loading = ref(true);
const loading_as = ref(true);
const search = ref("");
const records = ref<FiltroMultiplicador>({
  code: "",
  name: "",
  description: "",
  id_shipment: "",
  status: 1,
});
const record = ref<Multiplicador>({
  id: "",
  name: "",
  description: "",
  id_shipment: "",
  valor: "",
  status: 1,
});
const showFilterDrawerRead = ref(false);
const showFilterDrawerUpdate = ref(false);
const showFilterDrawer = ref(false);
const id = ref<Multiplicador["id"]>("");
const form = useTemplateRef("form");

watch(
  () => multiplicadorStore.record,
  (newRecord) => {
    if (newRecord && Object.keys(newRecord).length > 0) {
      const { id, name, description, id_shipment, valor, status } = newRecord;
      record.value = { id, name, description, id_shipment, valor, status };
      loading_as.value = false;
    }
  },
  { immediate: true },
);
watch(
  () => multiplicadorStore.record.id_containers,
  (newRecord) => {
    if (newRecord) {
      const container = appStore.itemsContainers.find((v: TipoContenedor) => v.id == newRecord)!;
      multiplicadorStore.record.name = container.name;
    } else {
      multiplicadorStore.record.name = "";
    }
  },
);
watch(
  () => multiplicadorStore.loading,
  (newList) => {
    loading.value = newList == true ? false : true;
  },
  { immediate: true },
);

const originalRecord = ref<Multiplicador>({ ...record.value });
const originalRecords = ref<FiltroMultiplicador>({ ...records.value });

onMounted(async () => {
  Promise.all([
    multiplicadorStore.fetchDataMultiplicador(records.value),
    multiplicadorStore.fetchDataCargarShipment(),
    appStore._getContainers(),
  ]);
  appStore.mainTitle = `Multiplicadores`;
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
  await multiplicadorStore.fetchDataMultiplicador(records.value);
  showFilterDrawer.value = false;
}
async function reset_records() {
  resetRecord("filter");
}
async function switch_status(item: Multiplicador) {
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
      await multiplicadorStore.updateMultiplicador(item);
    }
  });
}
async function open_new() {
  showFilterDrawerUpdate.value = !showFilterDrawerUpdate.value;
  loading_as.value = false;
  multiplicadorStore.record = {};
  setTimeout(() => {
    form.value!.reset();
  }, 100);
}
async function open_read(item: Multiplicador) {
  showFilterDrawerRead.value = !showFilterDrawerRead.value;
  loading_as.value = false;
  multiplicadorStore.record = { ...item };
}
async function open_update(item: Multiplicador) {
  showFilterDrawerUpdate.value = !showFilterDrawerUpdate.value;
  loading_as.value = false;
  multiplicadorStore.record = { ...item };
  id.value = item.id;
}
async function btnNuevo() {
  const containers = multiplicadorStore.list.map((v) => {
    if (v.id_containers) {
      return v.id_containers;
    }
  });
  // Kept: the store has no id_containers, so this checks whether any row lacks one.
  if (containers.includes(undefined)) {
    Swal.fire({
      icon: "error",
      title: "Contenedor",
      text: "Ya Existe un contenedor asociado a un Multiplicador, elimine primero ese multiplicador.",
    });
    return;
  }
  if ((await form.value!.validate()).valid) {
    resetRecord("filter");
    await multiplicadorStore.nuevoMultiplicador(multiplicadorStore.record);
  }
}
async function btnUpdate() {
  if ((await form.value!.validate()).valid) {
    resetRecord("filter");
    await multiplicadorStore.updateMultiplicador(multiplicadorStore.record);
  }
}
function open_filter() {
  showFilterDrawer.value = !showFilterDrawer.value;
}
async function filter() {
  const data = { ...records.value };
  data.status = data.status == "null" ? "" : data.status;
  if (data.code === null) data.code = "";
  if (data.name === null) data.name = "";
  if (data.description === null) data.description = "";
  if (data.id_shipment === null) data.id_shipment = "";

  await multiplicadorStore.fetchDataMultiplicador(data);
  showFilterDrawer.value = false;
}
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function resetForms() {
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
function validateNumber(value: string | number | null | undefined) {
  const regex = /^(0(\.\d{0,2})?|1(\.0{0,2})?)$|^(0\.\d{0,2}|[0-1])$/;
  if (!value) {
    return "El campo es requerido";
  }
  if (!regex.test(String(value))) {
    return "El campo debe ser un número positivo de hasta 2 decimales, desde 0 hasta 1.";
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
        <v-btn
          size="small"
          class="mx-1"
          color="success"
          @click="open_new()"
        >
          Nuevo
        </v-btn>
        <v-btn
          size="small"
          class="mx-1"
          color="info"
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
        :items="multiplicadorStore.list"
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
              @click="open_read(item)"
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
              @click="open_update(item)"
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
      v-model="showFilterDrawerRead"
      location="right"
      temporary
      
      width="30%"
    >
      <v-list-item>
        <v-list-item-title class="text-headline-small">
          Ver: {{ multiplicadorStore.record.name }}
        </v-list-item-title>
      </v-list-item>

      <v-container v-if="!loading_as">
        <v-card-text>
          <v-row>
            <v-text-field
              label="Código"
              readonly
              :model-value="multiplicadorStore.record.code"
            />
          </v-row>
          <v-row>
            <v-text-field
              label="Nombre"
              readonly
              :model-value="multiplicadorStore.record.name"
            />
          </v-row>
          <v-row>
            <v-text-field
              label="Descripción"
              readonly
              :model-value="multiplicadorStore.record.description"
            />
          </v-row>
          <v-row>
            <v-text-field
              label="Tipo de Carga"
              readonly
              :model-value="multiplicadorStore.record.type_carga"
            />
          </v-row>
          <v-row>
            <v-text-field
              label="Valor"
              readonly
              :model-value="multiplicadorStore.record.valor"
            />
          </v-row>
          <v-row>
            <v-switch
              readonly
              :label="`Estado: ${
                !!multiplicadorStore.record.status
                  ? 'Activo'
                  : 'Inactivo'
              }`"
              color="success"
              v-model="multiplicadorStore.record.status"
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
            {{
              multiplicadorStore.record.id
                ? "Modificar"
                : "Nuevo Registro"
            }}
            {{ multiplicadorStore.record.name }}
          </v-list-item-title>
        </v-list-item>

        <v-spacer />

        <v-card-text>
          <v-row>
            <v-autocomplete
              label="Tipo de Carga (*)"
              v-model="multiplicadorStore.record.type_carga"
              :items="multiplicadorStore.shipments"
              item-title="name"
              item-value="name"
              :rules="[(v) => !!v || 'Dato requerido']"
            />
          </v-row>
          <v-row v-if="multiplicadorStore.record.type_carga == 'FCL'">
            <v-autocomplete
              label="Contenedor Asociado"
              clearable
              v-model="multiplicadorStore.record.id_containers"
              :items="appStore.itemsContainers"
              item-title="name"
              item-value="id"
            />
          </v-row>
          <v-form ref="form">
            <v-row>
              <v-text-field
                type="text"
                label="Nombre (*)"
                v-model="multiplicadorStore.record.name"
                :rules="[(v) => validateFieldTextInForm(v, 50, false, 'max')]"
                clearable
                v-if="!multiplicadorStore.record.id_containers"
              />
            </v-row>
            <!-- <v-row>
              <v-text-field
                type="text"
                label="Descripción"
                v-model="record.description"
                :rules="[(v) => validateFieldTextInForm(v, 255, true, 'max')]"
                clearable
              >
              </v-text-field>
            </v-row> -->

            <v-row>
              <v-text-field
                type="number"
                label="Valor (*)"
                v-model="multiplicadorStore.record.valor"
                :rules="[(v) => validateNumber(v)]"
                clearable
              />
            </v-row>
          </v-form>
          <v-row>
            <v-switch
              :label="`Estado: ${
                multiplicadorStore.record.status ? 'Activo' : 'Inactivo'
              }`"
              v-model="multiplicadorStore.record.status"
              :value-comparator="(value, checked) => Boolean(value) === checked"
              color="success"
              @update:model-value="updateStatus"
            />
          </v-row>
        </v-card-text>

        <v-card-actions class="justify-end mt-3">
          <v-btn
            class="mx-1"
            v-if="!multiplicadorStore.record.id"
            color="success"
            @click="btnNuevo"
          >
            Nuevo
          </v-btn>
          <v-btn
            class="mx-1"
            v-if="multiplicadorStore.record.id"
            color="success"
            @click="btnUpdate"
          >
            Actualizar
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
            <v-autocomplete
              label="Tipo de Carga"
              clearable
              v-model="records.id_shipment"
              :items="multiplicadorStore.shipments"
              item-title="name"
              item-value="id"
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
