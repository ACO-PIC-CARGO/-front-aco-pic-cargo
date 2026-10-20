<script setup lang="ts">
import { onMounted, ref, watch } from "vue";
import { useRouter } from "vue-router";
import { useAppStore } from "@/stores/app";
import Swal from "sweetalert2";
import { useEnterprisesStore } from "@/stores/enterprises";
import { useSecuritysStore } from "@/stores/securitys";
import type { EmpresaListado, FiltroEmpresa } from "@/types/empresas";
import { sessionBranchId } from "@/utils/sesion";

const router = useRouter();
const appStore = useAppStore();
const enterprisesStore = useEnterprisesStore();
const securitysStore = useSecuritysStore();

const idPrincipales = ["1", "2", 1, 2];
const headers = [
  // { text: "Código", align: "start", value: "code" },
  { title: "Tipo de Documento", key: "td_name" },
  { title: "Nro. Documento", key: "document" },
  { title: "Nombre Comercial", key: "trade_name" },
  { title: "Nombre Negocio", key: "business_name" },
  { title: "País", key: "lp_name" },
  { title: "Región", key: "ls_name" },
  { title: "Provincia", key: "lc_name" },
  { title: "Distrito", key: "lt_name" },
  { title: "Dirección", key: "address" },
  { title: "Teléfono", key: "phone" },
  { title: "Estado", key: "status" },
  { title: "Creación", key: "created_at" },

  { title: "Última Actualización", key: "updated_at" },
  { title: "Acciones", key: "action" },
] as const;
const showFilterDrawer = ref(false);
const search = ref("");
const enterprise = ref<FiltroEmpresa>({
  id_branch: sessionBranchId(),
  id: "",
  slogan: "",
  document: "",
  trade_name: "",
  business_name: "",
  address: "",
  status: 1,
  id_pais: "",
  id_state: "",
  id_city: "",
  id_town: "",
  id_document: "",
  id_logo: "",
  ic: "",
});
const loading = ref(true);
const id_pais = ref<number>();

watch(
  () => enterprisesStore.loading,
  (newList) => {
    loading.value = newList == true ? false : true;
  },
  { immediate: true },
);

const originalenterprise = ref<FiltroEmpresa>({ ...enterprise.value });

onMounted(async () => {
  appStore.spiner = false;
  await enterprisesStore.fetchDataEnterprise(enterprise.value);
  appStore.mainTitle = `EMPRESAS`;
  await appStore._getDocumentsPais();
  await appStore._getPais();
  await _callState();
});

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function updateStatus(newValue: string | number | null) {
  enterprise.value.status = newValue ? 1 : 0;
}
function readEnterprise(id: number) {
  router.push({ name: "readEnterprise", params: { id: id } });
}
async function _callState() {
  // Kept: id_pais has never been declared here, so the branch below has always been skipped.
  if (id_pais.value! > 0) {
    await appStore._getState(id_pais.value);
  }
}
function volver() {
  router.go(-1);
}
async function filtar() {
  enterprise.value.status = enterprise.value.status == "null" ? "" : enterprise.value.status;
  if (enterprise.value.slogan === null) enterprise.value.slogan = "";
  if (enterprise.value.document === null) enterprise.value.document = "";
  if (enterprise.value.trade_name === null) enterprise.value.trade_name = "";
  if (enterprise.value.business_name === null) enterprise.value.business_name = "";
  if (enterprise.value.address === null) enterprise.value.address = "";
  if (enterprise.value.status === null) enterprise.value.status = "";
  if (enterprise.value.id_pais === null) enterprise.value.id_pais = "";
  if (enterprise.value.id_state === null) enterprise.value.id_state = "";
  if (enterprise.value.id_city === null) enterprise.value.id_city = "";
  if (enterprise.value.id_town === null) enterprise.value.id_town = "";
  if (enterprise.value.id_document === null) enterprise.value.id_document = "";
  if (enterprise.value.id_logo === null) enterprise.value.id_logo = "";
  if (enterprise.value.ic === null) enterprise.value.ic = "";

  await enterprisesStore.fetchDataEnterprise(enterprise.value);
  showFilterDrawer.value = false;
}
function updateEnterpriseRoute(id: number) {
  router.push({ name: "updateEnterprise", params: { id: id } });
}
function clear() {
  Object.assign(enterprise.value, originalenterprise.value);
}
async function reset_records() {
  clear();
}
async function switch_status(item: EmpresaListado) {
  let val = true;
  let msg = "";

  await Swal.fire({
    title: "Ingrese sus datos Administrador",
    html:
      '<input id="swal-input1" class="swal2-input" placeholder="Nombre">' +
      '<input id="swal-input2" type="password" class="swal2-input" placeholder="Clave">',
    focusConfirm: false,
    showCancelButton: true,
    confirmButtonText: "Aceptar",
    cancelButtonText: "Cancelar",
    preConfirm: () => {
      const input1 = (document.getElementById("swal-input1") as HTMLInputElement).value.trim();
      const input2 = (document.getElementById("swal-input2") as HTMLInputElement).value.trim();
      if (!input1 || !input2) {
        Swal.showValidationMessage("Por favor, complete ambos campos");
        return false;
      }
      return { usuario: input1, clave: input2 };
    },
  }).then(async (result) => {
    if (!result.isConfirmed) {
      // Usuario canceló
      val = false;
      msg = "Operación cancelada";
      return;
    }

    if (result.value) {
      const res = await securitysStore.validarUsuarioAdmin({
        usuario: result.value.usuario,
        clave: result.value.clave,
      });

      if (res && res.estadoflag) {
        val = true;
      } else {
        val = false;
        msg = res?.mensaje || "Credenciales incorrectas";
      }
    } else {
      val = false;
      msg = "Debe ingresar las credenciales";
    }
  });

  if (!val) {
    // @ts-expect-error Kept: swal has never been defined here, so this call has always thrown a ReferenceError.
    await swal.fire({
      icon: "error",
      text: msg,
    });
    return false;
  }
  await eliminar(item);
}

async function eliminar(item: EmpresaListado) {
  Swal.fire({
    title: "¿Estás seguro?",
    text: `La eliminación será definitiva, y no se podrá recupear la sucursal`,
    confirmButtonColor: "red",
    icon: "warning",
    showCancelButton: true,
    confirmButtonText: "Sí, inactivar",
    cancelButtonColor: "orange",
    cancelButtonText: "Cancelar",
  }).then(async (result) => {
    if (result.isConfirmed) {
      item.status = 0;
      clear();
      await enterprisesStore.eliminarBranch(item);
    }
  });
}
function open_filter() {
  showFilterDrawer.value = !showFilterDrawer.value;
}
</script>

<template>
  <v-card class="px-5">
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

        <!-- <v-btn
          small
          color="success"
          @click="$router.push({ name: 'newEnterprise' })"
        >
          Nuevo
        </v-btn> -->
        <v-btn
          size="small"
          class="mx-1"
          color="#2962FF"
          @click="open_filter()"
        >
          Filtrar
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
        :items="enterprisesStore.list"
        item-value="id"
        :search="search"
        density="compact"
      >
        <template #[`item.status`]="{ item }">
          {{ item.status == 1 ? "Activo" : "Inactivo" }}
        </template>
        <template #[`item.action`]="{ item }">
          <v-btn
            variant="text"
            icon
          >
            <v-icon
              color="warning"
              @click="updateEnterpriseRoute(item.id)"
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
              @click="readEnterprise(item.id)"
            >
              mdi-eye
            </v-icon>
          </v-btn>
          <v-btn
            variant="text"
            icon
            color="red"
            @click="switch_status(item)"
            v-if="item.status && !idPrincipales.includes(item.id)"
          >
            <v-icon>mdi-delete</v-icon>
          </v-btn>
        </template>
      </v-data-table>
    </v-card>

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

      <v-container fluid>
        <v-card-text>
          <v-row>
            <v-autocomplete
              label="Tipo de Documento"
              v-model="enterprise.id_document"
              :items="appStore.itemsDocumentsPais"
              item-title="description"
              item-value="id"
              clearable
            />
          </v-row>
          <v-row>
            <v-text-field
              type="text"
              label="N° de Documento"
              clearable
              v-model="enterprise.document"
            />
          </v-row>
          <v-row>
            <v-text-field
              label="Nombre Comercial"
              clearable
              v-model="enterprise.trade_name"
            />
          </v-row>
          <v-row>
            <v-text-field
              label="Nombre Negocio"
              clearable
              v-model="enterprise.business_name"
            />
          </v-row>
          <v-row>
            <v-autocomplete
              label="País"
              :items="appStore.itemsPais"
              item-value="id"
              item-title="name"
              v-model="enterprise.id_pais"
              @update:model-value="appStore._getState(enterprise.id_pais)"
            />
          </v-row>
          <v-row>
            <v-autocomplete
              label="Región"
              :items="appStore.itemsState"
              clearable
              item-value="id"
              item-title="name"
              v-model="enterprise.id_state"
              @update:model-value="appStore._getCity(enterprise.id_state)"
            />
          </v-row>
          <v-row>
            <v-autocomplete
              label="Provincia"
              :items="appStore.itemsCity"
              clearable
              item-value="id"
              item-title="name"
              v-model="enterprise.id_city"
              @update:model-value="appStore._getTown(enterprise.id_city)"
            />
          </v-row>
          <v-row>
            <v-autocomplete
              label="Distrito"
              v-model="enterprise.id_town"
              clearable
              :items="appStore.itemsTown"
              item-value="id"
              item-title="name"
            />
          </v-row>
          <v-row>
            <v-text-field
              label="Dirección"
              v-model="enterprise.address"
              clearable
            />
          </v-row>
          <v-row>
            <v-radio-group
              v-model="enterprise.status"
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
      <v-card-actions class="justify-end mt-3">
        <v-btn
          class="mx-1"
          color="success"
          @click="filtar()"
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
          @click="volver()"
        >
          Cerrar
        </v-btn>
      </v-card-actions>
    </v-navigation-drawer>
  </v-card>
</template>
