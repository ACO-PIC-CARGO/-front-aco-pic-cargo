<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useStore } from "vuex";
import type { EntidadRolListado } from "@/types/entidades";

const route = useRoute();
const router = useRouter();
const rootStore = useStore();

const search = ref("");
const headers = [
  {
    title: "Documento",
    align: "start",
    key: "documentlong",
  },
  { title: "Nombre Comercial", key: "namelong" },
  { title: "Ubigeo", key: "location" },
  { title: "Dirección", key: "address" },
  { title: "Notas", key: "notes" },
  { title: "Teléfonos", key: "moredata" },
  { title: "Contactos", key: "moredata2" },
  { title: "Acciones", key: "actions" },
] as const;
const btnTitle = ref("");
const itemsEntities = computed<EntidadRolListado[]>(() => rootStore.state.itemsEntities);

onMounted(async () => {
  console.log(route.params.id_role);
  if (Number(route.params.id_role) == 11) {
    rootStore.state.menuName = "CLIENTES";
    btnTitle.value = "CLIENTE";
  } else if (Number(route.params.id_role) == 15) {
    rootStore.state.menuName = "PROVEEDORES";
    btnTitle.value = "PROVEEDOR";
  }
  await rootStore.dispatch("_getEntities", route.params.id_role);
});

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function validData() {
  if (Number(route.params.id_role) == 11) {
    rootStore.state.menuName = "CLIENTES";
    btnTitle.value = "CLIENTE";
  } else if (Number(route.params.id_role) == 15) {
    rootStore.state.menuName = "PROVEEDORES";
    btnTitle.value = "PROVEEDOR";
  }
}

function openPhone(id_entitie: number) {
  rootStore.state.id_entitie_selected = id_entitie;
  rootStore.dispatch("_getPhone");
  rootStore.state.modalPhonesEdit = !rootStore.state.modalPhonesEdit;
}

function openContacts(id_entitie: number) {
  rootStore.state.id_entitie_selected = id_entitie;
  rootStore.dispatch("_getContacts");
  rootStore.state.modalContactsEdit =
    !rootStore.state.modalContactsEdit;
}

function sendData(id: number) {
  rootStore.state.master_id_agente = id;
  rootStore.state.modalAgente = false;
}

function editEntitie(id: number) {
  router.push("/home/folderEntities/control/edit/" + id);
}

function itemRowBackground(item: EntidadRolListado) {
  return item.document === "" || item.document === null
    ? "rowRed"
    : "white";
}
</script>

<template>
  <div>
    <v-card elevation="0">
      <v-card-title class="d-flex align-center flex-wrap">
        <v-btn
          v-if="$route.params.id_role"
          color="primary"
          :to="`/home/folderEntities/control/${$route.params.id_role}`"
          elevation="0"
          rounded
          class="mb-2 ml-5"
          :loading="!rootStore.state.dataList"
        >
          AGREGAR NUEVO
        </v-btn>
        <v-spacer />

        <v-text-field
          v-model="search"
          append-inner-icon="mdi-magnify"
          label="Buscar"
          single-line
          hide-details
        />
      </v-card-title>

      <v-container
        v-if="!rootStore.state.dataList"
        style="height: 400px"
      >
        <v-row class="fill-height align-content-center justify-center">
          <v-col
            class="text-body-large text-center"
            cols="12"
          >
            Cargando informacíon
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

      <v-data-table
        v-if="rootStore.state.dataList"
        :row-props="({ item }) => ({ class: itemRowBackground(item) })"
        :headers="headers"
        :items="itemsEntities"
        :search="search"
      >
        <template #[`item.moredata`]="{ item }">
          <v-tooltip location="top">
            <template #activator="{ props }">
              <v-btn
                class="mx-2"
                icon
                elevation="0"
                size="x-small"
               
                v-bind="props"
                @click="openPhone(item.id)"
                color="blue-grey-darken-3"
              >
                <v-icon> mdi-phone </v-icon>
              </v-btn>
            </template>
            <span>Teléfonos</span>
          </v-tooltip>

          <!--  <v-icon small color="red" @click="deleteItem(item)">
            mdi-delete
          </v-icon> -->
        </template>
        <template #[`item.moredata2`]="{ item }">
          <v-tooltip location="bottom">
            <template #activator="{ props }">
              <v-btn
                class="mx-2"
                icon
                elevation="0"
                size="x-small"
               
                v-bind="props"
                @click="openContacts(item.id)"
                color="blue-grey-darken-3"
              >
                <v-icon> mdi-account-multiple </v-icon>
              </v-btn>
            </template>
            <span>Contactos</span>
          </v-tooltip>
          <!--  <v-icon small color="red" @click="deleteItem(item)">
            mdi-delete
          </v-icon> -->
        </template>
        <template #[`item.actions`]="{ item }">
          <v-icon
            v-if="$route.params.id_role"
            size="28"
            color="orange"
            class="mr-2"
            @click="editEntitie(item.id)"
          >
            mdi-pencil
          </v-icon>
          <v-icon
            v-if="!$route.params.id_role"
            size="28"
            color="primary"
            class="mr-2"
            @click="sendData(item.id)"
          >
            mdi-cursor-default-click
          </v-icon>
          <!--  <v-icon small color="red" @click="deleteItem(item)">
            mdi-delete
          </v-icon> -->
        </template>
      </v-data-table>
    </v-card>

    <v-footer
      color="transparent"
      height="72"
    >
      <div>
        <div class="circle__legends colorRed" />
        Entidad sin documento
      </div>
    </v-footer>
  </div>
</template>

<style lang="scss">
.rowRed {
  background: #ffd6d3;
  color: #540000;
}

.circle__legends {
  height: 20px;
  width: 20px;
  background: #ffd6d3;
  float: left;
  border-radius: 250px;
  margin-right: 10px;
}
</style>
