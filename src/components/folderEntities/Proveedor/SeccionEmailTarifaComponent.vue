<script setup lang="ts">
import { nextTick, onMounted } from "vue";
import { useRoute } from "vue-router";
import axios from "@/api/http";
import Swal from "sweetalert2";
import { useEntitiesStore } from "@/stores/entities";
import type { ApiResponse } from "@/types/api";

withDefaults(
  defineProps<{
    editable?: boolean;
    guardarFlag?: boolean;
  }>(),
  { editable: true, guardarFlag: true },
);

const route = useRoute();
const entitiesStore = useEntitiesStore();

const headers = [
  { title: "#", key: "index" },

  {
    title: "Contacto",
    align: "start",
    sortable: false,
    key: "contacto",
  },
  { title: "Email", key: "email" },
  { title: "Telefono", key: "telefono" },
  { title: "Activo/ Inactivo", key: "action" },
] as const;

async function cargarDatos() {
  if (!route.params.id) {
    return;
  }
  await entitiesStore.cargarDatosTatifasEntite({ id: route.params.id });
  entitiesStore.itemsImportacion =
    entitiesStore.lstDatosTarifas.filter(
      (item) => item.code === "I",
    );
  entitiesStore.itemsExportacion =
    entitiesStore.lstDatosTarifas.filter(
      (item) => item.code === "E",
    );
}
function agregarContactoExportacion() {
  entitiesStore.itemsExportacion.push({
    id: 0,
    code: "E",
    contacto: "",
    email: "",
    telefono: "",
  });
  nextTick(() => {
    const index = entitiesStore.itemsExportacion.length - 1;
    const contactoInput = document.getElementById(`contactoexport${index}`);
    if (contactoInput) {
      contactoInput.focus();
    }
  });
}
function agregarContacto() {
  entitiesStore.itemsImportacion.push({
    id: 0,
    code: "I",
    contacto: "",
    email: "",
    telefono: "",
  });
  nextTick(() => {
    const index = entitiesStore.itemsImportacion.length - 1;
    const contactoInput = document.getElementById(`contactoimport${index}`);
    if (contactoInput) {
      contactoInput.focus();
    }
  });
}
async function guardarContactos() {
  Swal.showLoading();
  const datos = [
    ...entitiesStore.itemsImportacion,
    ...entitiesStore.itemsExportacion,
  ];

  const config = {
    method: "post",
    url: import.meta.env.VITE_URL_MAIN + "entitie/guardar_datos_tarifas",
    headers: {

      "Content-Type": "application/json",
    },
    data: {
      id: route.params.id,
      datos: datos,
      proveedorprincipalflag:
        entitiesStore.proveedor.proveedorprincipalflag,
    },
  };

  await axios<ApiResponse>(config).then((res) => {
    const data = res.data;
    if (data.estadoflag) {
      Swal.fire({
        icon: "success",
        text: data.mensaje,
      });
    }
  });
  Swal.close();
  cargarDatos();
  console.log("Contactos guardados:", datos);
}

onMounted(async () => {
  cargarDatos();
});
</script>

<template>
  <v-container>
    <v-row>
      <v-col
        cols="12"
        class="py-1"
        style="text-transform: uppercase; text-align: right"
      >
        <v-btn
          color="success"
          @click="guardarContactos"
          size="small"
          v-if="guardarFlag"
        >
          Guardar
        </v-btn>
      </v-col>
      <v-col cols="12">
        <v-row>
          <v-checkbox
            v-model="entitiesStore.proveedor.proveedorprincipalflag"
            label="Es principal"
            hide-details
          />

          <v-tooltip
            location="bottom"
            class="my-auto"
          >
            <template #activator="{ props }">
              <v-icon v-bind="props">
                mdi-information
              </v-icon>
            </template>
            <span>
              Al marcar esta opción, este registro se mostrará
              <b>Seleccionado</b> en la lista de correos en el
              <b>Solicitar tarifas.</b>
            </span>
          </v-tooltip>
        </v-row>
      </v-col>
      <v-col
        cols="12"
        class="py-1"
        style="text-transform: uppercase"
      >
        <center>
          <h5>Contactos de Importación</h5>
        </center>
      </v-col>

      <v-col
        cols="12"
        class="py-1"
      >
        <v-btn
          color="info"
          size="x-small"
          @click="agregarContacto"
        >
          Añadir Nuevo Contacto
        </v-btn>
      </v-col>

      <v-col
        cols="12"
        class="py-1"
      >
        <v-data-table
          :headers="headers"
          :items="entitiesStore.itemsImportacion"
          class="elevation-1"
        >
          <template #[`item.index`]="{ index }">
            {{ index + 1 }}
          </template>
          <template #[`item.contacto`]="{ item, index }">
            <v-text-field
              hide-details
              v-model="item.contacto"
              density="compact"
              variant="outlined"
              :disabled="!editable"
              :id="`contactoimport${index}`"
            />
          </template>
          <template #[`item.email`]="{ item }">
            <v-text-field
              hide-details
              v-model="item.email"
              density="compact"
              :disabled="!editable"
              variant="outlined"
            />
          </template>
          <template #[`item.telefono`]="{ item }">
            <v-text-field
              hide-details
              v-model="item.telefono"
              density="compact"
              variant="outlined"
              :disabled="!editable"
            />
          </template>
          <template #[`item.action`]="{ item }">
            <v-switch
              color="#00C853"
              :disabled="!editable"
              v-model="item.estado"
            />
          </template>
        </v-data-table>
      </v-col>
    </v-row>
    <v-row>
      <v-col
        cols="12"
        style="text-transform: uppercase"
      >
        <center>
          <h5>Contactos de Exportación</h5>
        </center>
      </v-col>

      <v-col
        cols="12"
        class="py-1"
      >
        <v-btn
          color="info"
          size="x-small"
          @click="agregarContactoExportacion"
        >
          Añadir Nuevo Contacto
        </v-btn>
      </v-col>

      <v-col
        cols="12"
        class="py-1"
      >
        <v-data-table
          :headers="headers"
          :items="entitiesStore.itemsExportacion"
          class="elevation-1"
        >
          <template #[`item.index`]="{ index }">
            {{ index + 1 }}
          </template>
          <template #[`item.contacto`]="{ item, index }">
            <v-text-field
              hide-details
              v-model="item.contacto"
              density="compact"
              variant="outlined"
              :disabled="!editable"
              :id="`contactoexport${index}`"
            />
          </template>
          <template #[`item.email`]="{ item }">
            <v-text-field
              hide-details
              v-model="item.email"
              density="compact"
              :disabled="!editable"
              variant="outlined"
            />
          </template>
          <template #[`item.telefono`]="{ item }">
            <v-text-field
              hide-details
              v-model="item.telefono"
              density="compact"
              :disabled="!editable"
              variant="outlined"
            />
          </template>
          <template #[`item.action`]="{ item }">
            <v-switch
              color="#00C853"
              :disabled="!editable"
              v-model="item.estado"
            />
          </template>
        </v-data-table>
      </v-col>
    </v-row>
  </v-container>
</template>

<style></style>
