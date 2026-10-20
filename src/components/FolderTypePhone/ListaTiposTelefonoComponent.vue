<script setup lang="ts">
import { onMounted, ref, watch } from "vue";
import { useRouter } from "vue-router";
import Swal from "sweetalert2";
import { useAppStore } from "@/stores/app";
import { useTypePhoneStore } from "@/stores/type_phone";
import type { FormTipoTelefono, TipoTelefono } from "@/types/catalogos";
import { sessionBranchId } from "@/utils/sesion";

const typePhoneStore = useTypePhoneStore();
const appStore = useAppStore();
const router = useRouter();

const headers = [
  { title: "Código", align: "start", key: "code" },
  { title: "Nombre", key: "name" },
  { title: "Estado", key: "estado" },
  { title: "Creación", key: "created_at" },

  { title: "Última Actualización", key: "updated_at" },
  { title: "Acciones", key: "action" },
] as const;
const loading = ref(true);
const loading_as = ref(true);
const selectedItem = ref("");
const search = ref("");
const types = ref<FormTipoTelefono>({
  id_branch: sessionBranchId(),
  code: "",
  name: "",
  status: 1,
});
const type = ref<FormTipoTelefono>({
  id_branch: sessionBranchId(),
  code: "",
  name: "",
  status: 1,
});
const showFilterDrawerNew = ref(false);
const showFilterDrawerRead = ref(false);
const showFilterDrawerUpdate = ref(false);
const showFilterDrawer = ref(false);
const id = ref<number | "">("");
const rulesPassed = ref(false);

watch(
  () => typePhoneStore.record,
  (newRecord) => {
    if (newRecord && Object.keys(newRecord).length > 0) {
      console.log(newRecord);
      loading_as.value = false;
      type.value.code = newRecord.code;
      type.value.name = newRecord.name;
      type.value.status = newRecord.status;
    }
  },
  { immediate: true },
);
watch(
  () => typePhoneStore.list,
  (newList) => {
    if (newList && newList.length > 0) {
      loading.value = false;
    }
  },
  { immediate: true },
);

const originalType = ref<FormTipoTelefono>({ ...type.value });

onMounted(async () => {
  await typePhoneStore.fetchDataTypePhone(types.value);
  appStore.mainTitle = `Tipo de Teléfono`;
});

function volver() {
  router.go(-1);
  resetType();
}
function updateStatus(newValue: unknown) {
  type.value.status = newValue ? 1 : 0;
}
function insert() {
  typePhoneStore.insertTypePhone(type.value);
}
function resetType() {
  Object.assign(type.value, originalType.value);
}
function inactive(row: TipoTelefono) {
  Swal.fire({
    title: "¿Estás seguro?",
    text: `Si inactiva el registro, éste no aparecerá disponible en otros formularios ¿Está seguro de que desea inactivarlo?`,
    icon: "warning",
    showCancelButton: true,
    confirmButtonText: "Sí",
    cancelButtonText: "Cancelar",
  }).then((result) => {
    if (result.isConfirmed) {
      typePhoneStore.inactiveTypePhone({ id: row.id });
    } else {
      // Kept: item is an empty string, so this write has always thrown.
      const target = selectedItem.value as unknown as { status: number };
      target.status = target.status === 1 ? 0 : 1;
    }
  });
}
function read(itemId: number) {
  showFilterDrawerRead.value = !showFilterDrawerRead.value;
  typePhoneStore.readTypePhone(itemId);
}
function update(itemId: number) {
  showFilterDrawerUpdate.value = !showFilterDrawerUpdate.value;
  typePhoneStore.readTypePhone(itemId);
  id.value = itemId;
}
function btnUpdate() {
  const data = {
    id: id.value as number,
    name: type.value.name,
    status: type.value.status,
  };
  typePhoneStore.updateTypePhone(data);
}
function filter() {
  typePhoneStore.fetchDataTypePhone(type.value);
  showFilterDrawer.value = false;
}
function validateCode(v: string | null | undefined) {
  if (!v) {
    rulesPassed.value = false;
    return "Dato requerido";
  }
  if (v.length > 3) {
    rulesPassed.value = false;
    return "Hasta 3 caracteres permitidos";
  }
  rulesPassed.value = true;
  return true;
}
function validateName(v: string | null | undefined) {
  if (!v) {
    rulesPassed.value = false;
    return "Dato requerido";
  }
  if (v.length > 50) {
    rulesPassed.value = false;
    return "Hasta 50 caracteres permitidos";
  }
  rulesPassed.value = true;
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
          color="success"
          @click="showFilterDrawerNew = !showFilterDrawerNew"
        >
          Nuevo
        </v-btn>
        <v-btn
          size="small"
          color="success"
          @click="showFilterDrawer = !showFilterDrawer"
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
        :items="typePhoneStore.list"
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
              color="warning"
              @click="update(item.id)"
            >
              mdi-pencil
            </v-icon>
          </v-btn>
          <v-btn
            variant="text"
            icon
          >
            <v-icon
              color="success"
              @click="read(item.id)"
            >
              mdi-eye
            </v-icon>
          </v-btn>
          <v-btn
            variant="text"
            icon
          >
            <v-switch
              v-model="item.status"
              :value-comparator="(value, checked) => Boolean(value) === checked"
              color="success"
              @update:model-value="inactive(item)"
            />
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
      <v-card class="">
        <v-card-title class="d-flex align-center flex-wrap">
          Nuevo Tipo de Teléfono
          <v-spacer />

          <v-card-text>
            <v-row>
              <v-text-field
                type="text"
                label="Código (*)"
                v-model="type.code"
                :rules="[(v) => validateCode(v)]"
              />
            </v-row>
            <v-row>
              <v-text-field
                type="text"
                label="Nombre (*)"
                v-model="type.name"
                :rules="[(v) => validateName(v)]"
              />
            </v-row>
            <v-row>
              <v-switch
                density="compact"
                label="Activo/Inactivo"
                v-model="type.status"
                :value-comparator="(value, checked) => Boolean(value) === checked"
                hide-details
                color="success"
                @update:model-value="updateStatus"
              />
            </v-row>
          </v-card-text>
        </v-card-title>
        <v-card-actions class="justify-end mt-3">
          <v-btn
            size="small"
            class="mx-1"
            color="success"
            @click="insert()"
            rounded
          >
            Registrar
          </v-btn>
          <v-btn
            size="small"
            class="mx-1"
            color="red"
            @click="volver()"
            rounded
          >
            Cancelar
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-navigation-drawer>

    <v-navigation-drawer
      v-model="showFilterDrawerRead"
      location="right"
      temporary
      
      width="30%"
    >
      <v-card class="">
        <v-container v-if="!loading_as">
          <v-card-title class="d-flex align-center flex-wrap">
            Tipo de Teléfono {{ typePhoneStore.record.code }}
            {{ typePhoneStore.record.name }}
            <v-spacer />
            <v-card-text>
              <v-row>
                <v-text-field
                  label="Código"
                  readonly
                  :model-value="typePhoneStore.record.code"
                />
              </v-row>
              <v-row>
                <v-text-field
                  label="Nombre"
                  readonly
                  :model-value="typePhoneStore.record.name"
                />
              </v-row>
              <v-row>
                <v-switch
                  readonly
                  :label="`Estado: ${
                    !!typePhoneStore.record.status
                      ? 'Activo'
                      : 'Inactivo'
                  }`"
                  color="success"
                  v-model="typePhoneStore.record.status"
                  :value-comparator="(value, checked) => Boolean(value) === checked"
                />
              </v-row>
            </v-card-text>
          </v-card-title>
          <v-card-actions class="justify-end mt-3">
            <v-btn
              class="mx-1"
              color="red"
              @click="showFilterDrawerRead = !showFilterDrawerRead"
            >
              Cancelar
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
      </v-card>
    </v-navigation-drawer>

    <v-navigation-drawer
      v-model="showFilterDrawerUpdate"
      location="right"
      temporary
      
      width="30%"
    >
      <v-card class="">
        <v-container v-if="!loading_as">
          <v-card-title class="d-flex align-center flex-wrap">
            Editar Tipo de Teléfono {{ typePhoneStore.record.name }}
            <v-spacer />

            <v-card-text>
              <v-row>
                <v-text-field
                  type="text"
                  label="Código"
                  v-model="type.code"
                  readonly
                />
              </v-row>
              <v-row>
                <v-text-field
                  type="text"
                  label="Nombre (*)"
                  v-model="type.name"
                  :rules="[(v) => validateName(v)]"
                />
              </v-row>
              <v-row>
                <v-switch
                  label="Activo / Inactivo"
                  v-model="type.status"
                  :value-comparator="(value, checked) => Boolean(value) === checked"
                  color="success"
                  @update:model-value="updateStatus"
                />
              </v-row>
            </v-card-text>
          </v-card-title>
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
              color="red"
              @click="showFilterDrawerUpdate = !showFilterDrawerUpdate"
            >
              Cancelar
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
      </v-card>
    </v-navigation-drawer>

    <v-navigation-drawer
      v-model="showFilterDrawer"
      location="right"
      temporary
      
      width="30%"
    >
      <v-card class="">
        <v-card-title class="d-flex align-center flex-wrap">
          Filtrar Tipo de Teléfono
          <v-spacer />

          <v-card-text>
            <v-row>
              <v-text-field
                type="text"
                label="Nombre"
                v-model="type.name"
              />
            </v-row>
            <v-row>
              <v-text-field
                label="Código"
                v-model="type.code"
              />
            </v-row>
            <v-row>
              <v-switch
                density="compact"
                label="Activo/Inactivo"
                v-model="type.status"
                :value-comparator="(value, checked) => Boolean(value) === checked"
                hide-details
                color="success"
                @update:model-value="updateStatus"
              />
            </v-row>
          </v-card-text>
        </v-card-title>
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
            color="red"
            @click="showFilterDrawer = !showFilterDrawer"
          >
            Cancelar
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-navigation-drawer>
  </v-card>
</template>
