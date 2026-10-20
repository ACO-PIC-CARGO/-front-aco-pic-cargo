<script setup lang="ts">
import { onMounted, ref, useTemplateRef, watch } from "vue";
import { useRouter } from "vue-router";
import { useAppStore } from "@/stores/app";
import Swal from "sweetalert2";
import axios from "@/api/http";
import { useEnterprisesStore } from "@/stores/enterprises";
import { useUserStore } from "@/stores/user";
import type { ApiResponse } from "@/types/api";
import { validateLength } from "@/utils/cotizacion";
import { sessionBranchId } from "@/utils/sesion";
import { useFilesStore } from "@/stores/files";

const router = useRouter();
const appStore = useAppStore();
const filesStore = useFilesStore();
const enterprisesStore = useEnterprisesStore();
const userStore = useUserStore();

const snackbar = ref(false);
const tab = ref("datos");
const errfile = ref("");
const loadingFile = ref(false);
const msgfile = ref("");
const payfile = ref<File | null>(null);
const errorDocument = ref<string | null>(null);
const errUsers = ref("");
const errEmail = ref("");
const id_pais = ref<number>();
const frmEmpresa = useTemplateRef("frmEmpresa");
const frmDatos = useTemplateRef("frmDatos");
// Not bound to the template.
const frmDML = ref<{ resetValidation: () => void }>();
const form = ref<{ validate: () => Promise<{ valid: boolean }> }>();

watch(
  () => filesStore.payPath,
  (newRecord) => {
    if (newRecord) {
      enterprisesStore.model.id_logo = newRecord;
    }
  },
  { immediate: true },
);

onMounted(async () => {
  appStore.spiner = true;

  appStore.mainTitle = `EMPRESAS`;
  enterprisesStore.model = {
    id_logo: "",
    document: "",
    trade_name: "",
    business_name: "",
    slogan: "",
    address: "",
    status: "1",
    id_pais: "",
    id_state: "",
    id_city: "",
    id_town: "",
    id_document: "",
    ic: "",
  };
  userStore.model = {
    id: "",
    id_entitie: "",
    id_pais: "",
    id_city: "",
    id_state: "",
    id_town: "",
    users: "",
    id_document: "",
    document: "",
    id_sex: "",
    status: "1",
    departamento: "1",
    names: "",
    surname: "",
    second_surname: "",
    socialprincipal: "",
    socialsecundary: "",
    phone: "",
    address: "",
    birthday: "",
    email: "",
  };

  await appStore._getDocumentsPais();
  await appStore._getPais();
  await appStore._getSex();
  await _callState();
  appStore.spiner = false;
  frmDML.value!.resetValidation();
  frmDatos.value!.resetValidation();
});

async function _callState() {
  // id_pais is not declared here, so the branch below is always skipped.
  if (id_pais.value! > 0) {
    await appStore._getState(id_pais.value);
  }
}
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function volver() {
  router.go(-1);
}
async function insert() {
  if (tab.value == "datos") {
    if ((await frmEmpresa.value!.validate()).valid) {
      tab.value = "admin";
      return true;
    }
  }
  if (tab.value == "admin") {
    if (!(await frmEmpresa.value!.validate()).valid) {
      tab.value = "datos";
      return false;
    }
    if ((await frmDatos.value!.validate()).valid) {
      appStore.spiner = true;
      await enterprisesStore.insertEnterprise();
      appStore.spiner = false;
    }
  }
}
async function get_state() {
  enterprisesStore.model.id_state = "";
  enterprisesStore.model.id_city = "";
  enterprisesStore.model.id_town = "";
  await appStore._getState(enterprisesStore.model.id_pais);
}
async function get_city() {
  enterprisesStore.model.id_city = "";
  enterprisesStore.model.id_town = "";
  await appStore._getCity(enterprisesStore.model.id_state);
}
async function get_town() {
  enterprisesStore.model.id_town = "";
  await appStore._getTown(enterprisesStore.model.id_city);
}
// eslint-disable-next-line @typescript-eslint/no-unused-vars
async function update() {
  if ((await form.value!.validate()).valid) {
    await enterprisesStore.updateEnterprise(enterprisesStore.$state);
  }
}
async function validarUser() {
  errUsers.value = "";
  appStore.spiner = true;
  const res = (await userStore.validateUserUsuario())!;
  if (res.estadoflag == true) {
    errUsers.value = res.mensaje;
    userStore.model.users = "";
  }
  appStore.spiner = false;
}
async function validarEmail() {
  errEmail.value = "";
  appStore.spiner = true;
  const res = (await userStore.validateEmailUsuario())!;
  if (res.estadoflag == true) {
    errEmail.value = res.mensaje;
    userStore.model.email = "";
  }
  appStore.spiner = false;
}
async function validarDocument() {
  // this.errUsers = "";
  if (!!userStore.model.id_document && !!userStore.model.document) {
    appStore.spiner = true;
    const res = (await userStore.validateDocumentUsuario())!;
    appStore.spiner = false;

    if (res.estadoflag == true) {
      Swal.fire({
        icon: "question",
        title: "Pregunta",
        text: res.mensaje,
        allowEnterKey: false,
        allowOutsideClick: false,
        confirmButtonText: "Si",
        cancelButtonText: "No",
        showCancelButton: true,
        cancelButtonColor: "red",
        confirmButtonColor: "green",
      }).then(async (respuesta) => {
        if (respuesta.isConfirmed) {
          appStore.spiner = true;
          userStore.model.id_entitie = res.data[0]!.id_entitie;
          userStore.model.address = res.data[0]!.address;
          userStore.model.birthday = res.data[0]!.birthday;
          userStore.model.estadoflag = res.data[0]!.estadoflag;
          userStore.model.id_city = res.data[0]!.id_city;
          userStore.model.id_pais = res.data[0]!.id_pais;
          userStore.model.id_sex = res.data[0]!.id_sex;
          userStore.model.id_state = res.data[0]!.id_state;
          userStore.model.id_town = res.data[0]!.id_town;
          userStore.model.names = res.data[0]!.names;
          userStore.model.second_surname = res.data[0]!.second_surname;
          userStore.model.socialprincipal = res.data[0]!.socialprincipal;
          userStore.model.socialsecundary = res.data[0]!.socialsecundary;
          userStore.model.surname = res.data[0]!.surname;
          await appStore._getState(res.data[0]!.id_pais);
          await appStore._getCity(res.data[0]!.id_state);
          await appStore._getTown(res.data[0]!.id_city);
          appStore.spiner = false;
        }
        if (respuesta.isDismissed) {
          userStore.model.document = "";
        }
      });
    }
    appStore.spiner = false;
  }
  // if (res.estadoflag == true) {
  //   this.errUsers = res.mensaje;
  //   this.$store.state.user.model.users = "";
  // }
}
async function validateDocument() {
  await axios<ApiResponse>({
    method: "get",
    url:
      import.meta.env.VITE_URL_MAIN +
      `validar__nuevo_documento_enterprise?` +
      `id_branch=${sessionBranchId()}` +
      `&id_document=${enterprisesStore.model.id_document}` +
      `&document=${encodeURIComponent(enterprisesStore.model.document)}`,
    headers: {
      "Content-Type": "application/json",
    },
  })
    .then((response) => {
      const data = response.data;
      if (!data.estadoflag) {
        errorDocument.value = data.mensaje;
        enterprisesStore.model.document = "";
      } else {
        errorDocument.value = "";
      }
    })
    .catch((error) => {
      console.log("Error al obtener los datos:", error);
    });
}
async function uploadFile() {
  msgfile.value = "";
  errfile.value = "";
  if (payfile.value) {
    loadingFile.value = true;
    if (payfile.value.size > 2097152) {
      loadingFile.value = false;
      errfile.value = "El archivo es demasiado grande. El tamaño máximo es 2 MB.";
    } else {
      await filesStore._uploadFile(payfile.value);
      loadingFile.value = false;
      if (filesStore.payPath) {
        msgfile.value = "Archivo cargado";
      } else {
        errfile.value = "Comuniquese con el admistrador";
      }
    }
  }
}
function updateStatus(newValue: string | number | null) {
  enterprisesStore.model.status = newValue ? 1 : 0;
}
</script>

<template>
  <v-container fluid>
    <v-card class="py-10 px-10">
      <v-tabs
        v-model="tab"
        bg-color="teal-darken-4"
        color="white"
        grow
        stacked
      >
        <v-tab
          base-color="rgba(255, 255, 255, 0.6)"
          value="datos"
        >
          Datos de la Empresa
        </v-tab>

        <v-tab
          base-color="rgba(255, 255, 255, 0.6)"
          value="admin"
        >
          Administrador Principal SISTEMA
        </v-tab>
      </v-tabs>
      <v-tabs-window v-model="tab">
        <v-tabs-window-item
          value="datos"
          class="px-5 items"
        >
          <v-form ref="frmEmpresa">
            <v-row>
              <v-col cols="4">
                <v-autocomplete
                  label="Tipo de Documento (*)"
                  v-model="enterprisesStore.model.id_document"
                  :items="appStore.itemsDocumentsPais"
                  item-title="description"
                  item-value="id"
                  :rules="[(v) => !!v || 'Dato requerido']"
                />
              </v-col>
              <v-col cols="4">
                <v-text-field
                  type="text"
                  label="N° de Documento (*)"
                  v-model="enterprisesStore.model.document"
                  @blur="validateDocument"
                  :rules="[
                    (v) => !!v || 'Dato requerido',
                    (v) =>
                      (v && v.length <= 100) ||
                      'Hasta 100 caracteres permitidos',
                  ]"
                  :error-messages="errorDocument"
                />
              </v-col>
            </v-row>

            <v-row>
              <v-col cols="4">
                <v-text-field
                  label="Nombre Comercial (*)"
                  v-model="enterprisesStore.model.trade_name"
                  :rules="[
                    (v) => !!v || 'Dato requerido',
                    (v) =>
                      (v && v.length <= 255) ||
                      'Hasta 255 caracteres permitidos',
                  ]"
                />
              </v-col>
              <v-col cols="4">
                <v-text-field
                  label="Nombre Negocio (*)"
                  v-model="enterprisesStore.model.business_name"
                  :rules="[
                    (v) => !!v || 'Dato requerido',
                    (v) =>
                      (v && v.length <= 255) ||
                      'Hasta 255 caracteres permitidos',
                  ]"
                />
              </v-col>
              <v-col cols="4">
                <v-text-field
                  label="Phone"
                  v-model="enterprisesStore.model.phone"
                />
              </v-col>
              <v-col cols="4">
                <v-text-field
                  label="Slogan"
                  v-model="enterprisesStore.model.slogan"
                  :rules="[(v) => validateLength(v, 255)]"
                />
              </v-col>
              <v-col cols="4">
                <v-file-input
                  label="Logo"
                  v-model="payfile"
                  accept=".png"
                  :messages="msgfile"
                  :error-messages="errfile"
                  :loading="loadingFile"
                  show-size
                  prepend-icon="mdi-camera"
                  @update:model-value="uploadFile()"
                />
              </v-col>
              <v-col cols="4">
                <v-text-field
                  label="IC"
                  v-model="enterprisesStore.model.ic"
                  :rules="[(v) => validateLength(v, 255)]"
                />
              </v-col>
            </v-row>
            <v-row>
              <v-col cols="3">
                <v-autocomplete
                  label="País (*)"
                  :items="appStore.itemsPais"
                  item-value="id"
                  item-title="name"
                  v-model="enterprisesStore.model.id_pais"
                  @update:model-value="get_state()"
                  :rules="[(v) => !!v || 'Dato requerido']"
                />
              </v-col>
              <v-col cols="3">
                <v-autocomplete
                  label="Región (*)"
                  :items="appStore.itemsState"
                  item-value="id"
                  item-title="name"
                  v-model="enterprisesStore.model.id_state"
                  @update:model-value="get_city()"
                  :disabled="!enterprisesStore.model.id_pais"
                  :rules="[(v) => !!v || 'Dato requerido']"
                />
              </v-col>
              <v-col cols="3">
                <v-autocomplete
                  label="Provincia (*)"
                  :items="appStore.itemsCity"
                  item-value="id"
                  item-title="name"
                  v-model="enterprisesStore.model.id_city"
                  @update:model-value="get_town()"
                  :disabled="!enterprisesStore.model.id_state"
                  :rules="[(v) => !!v || 'Dato requerido']"
                />
              </v-col>
              <v-col cols="3">
                <v-autocomplete
                  label="Distrito (*)"
                  v-model="enterprisesStore.model.id_town"
                  :items="appStore.itemsTown"
                  item-value="id"
                  item-title="name"
                  :disabled="!enterprisesStore.model.id_city"
                  :rules="[(v) => !!v || 'Dato requerido']"
                />
              </v-col>
              <v-col cols="4">
                <v-text-field
                  label="Dirección (*)"
                  v-model="enterprisesStore.model.address"
                  :rules="[
                    (v) => !!v || 'Dato requerido',
                    (v) =>
                      (v && v.length <= 255) ||
                      'Hasta 255 caracteres permitidos',
                  ]"
                />
              </v-col>
              <v-col cols="4">
                <v-switch
                  density="compact"
                  label="Activo/Inactivo"
                  v-model="enterprisesStore.model.status"
                  :value-comparator="(value, checked) => Boolean(value) === checked"
                  hide-details
                  color="success"
                  @update:model-value="updateStatus"
                />
              </v-col>
            </v-row>
          </v-form>
        </v-tabs-window-item>
        <v-tabs-window-item
          value="admin"
          class="px-5 items"
        >
          <v-form ref="frmDatos">
            <v-row>
              <v-col cols="4">
                <v-text-field
                  label="Nombre Usuario (*)"
                  id="users"
                  v-model="userStore.model.users"
                  @blur="validarUser()"
                  :error-messages="errUsers"
                  :rules="[(v) => !!v || 'Dato Requerido']"
                />
              </v-col>
            </v-row>
            <v-row class="align-sm-center">
              <v-col cols="4">
                <v-autocomplete
                  :items="appStore.itemsDocumentsPais"
                  item-title="description"
                  item-value="id"
                  label="Tipo de Documento (*)"
                  v-model="userStore.model.id_document"
                  @update:model-value="validarDocument()"
                  :rules="[(v) => !!v || 'Dato Requerido']"
                />
              </v-col>
              <v-col cols="4">
                <v-text-field
                  label="Documento (*)"
                  v-model="userStore.model.document"
                  :rules="[(v) => !!v || 'Dato Requerido']"
                  @blur="validarDocument()"
                />
              </v-col>
            </v-row>
            <v-row>
              <v-col cols="4">
                <v-text-field
                  v-model="userStore.model.names"
                  :rules="[(v) => !!v || 'Dato Requerido']"
                  label="Nombres (*)"
                />
              </v-col>
              <v-col cols="4">
                <v-text-field
                  v-model="userStore.model.surname"
                  :rules="[(v) => !!v || 'Dato Requerido']"
                  label="Apellido Paterno (*)"
                />
              </v-col>
              <v-col cols="4">
                <v-text-field
                  v-model="userStore.model.second_surname"
                  :rules="[(v) => !!v || 'Dato Requerido']"
                  label="Apellido Materno (*)"
                />
              </v-col>
              <v-col cols="4">
                <v-text-field
                  label="Teléfono (*)"
                  v-model="userStore.model.phone"
                  :rules="[(v) => !!v || 'Dato Requerido']"
                />
              </v-col>
              <v-col cols="4">
                <v-text-field
                  label="Correo (*)"
                  v-model="userStore.model.email"
                  :rules="[
                    (v) => !!v || 'Dato requerido',
                    (v) =>
                      /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) ||
                      'Debe ser un correo valido',
                  ]"
                  @blur="validarEmail()"
                  :error-messages="errEmail"
                />
              </v-col>
              <v-col cols="4">
                <v-text-field
                  type="date"
                  label="Fecha Nacimiento (*)"
                  v-model="userStore.model.birthday"
                  :rules="[(v) => !!v || 'Dato Requerido']"
                />
              </v-col>
            </v-row>
            <v-row>
              <v-col cols="4">
                <v-autocomplete
                  :items="appStore.itemsSex"
                  item-title="name"
                  item-value="id"
                  label="Sexo (*)"
                  :rules="[(v) => !!v || 'Dato Requerido']"
                  :item-props="(item) => ({ disabled: item.status != 1 })"
                  v-model="userStore.model.id_sex"
                />
              </v-col>
              <!-- <v-col cols="4">
                <v-autocomplete
                  label="Pais"
                  :items="$store.state.itemsPais"
                  v-model="$store.state.user.model.id_pais"
                  item-text="name"
                  item-value="id"
                  @change="ObtenerEstados($store.state.user.model.id_pais)"
                  :item-disabled="(item) => item.status != 1"
                  :rules="[(v) => !!v || 'Dato Requerido']"
                >
                </v-autocomplete>
              </v-col>
              <v-col cols="4" v-if="$store.state.user.model.id_pais">
                <v-autocomplete
                  label="Estado (Región)"
                  :items="$store.state.itemsState"
                  v-model="$store.state.user.model.id_state"
                  item-text="name"
                  item-value="id"
                  :loading="loadingEstado"
                  @change="ObtenerCity($store.state.user.model.id_state)"
                  :item-disabled="(item) => item.status != 1"
                  :rules="[(v) => !!v || 'Dato Requerido']"
                >
                </v-autocomplete>
              </v-col>
              <v-col cols="4" v-if="$store.state.user.model.id_state">
                <v-autocomplete
                  label="Ciudad"
                  :items="$store.state.itemsCity"
                  v-model="$store.state.user.model.id_city"
                  item-text="name"
                  item-value="id"
                  :loading="loadingEstado"
                  @change="ObtenerDistrito($store.state.user.model.id_city)"
                  :item-disabled="(item) => item.status != 1"
                  :rules="[(v) => !!v || 'Dato Requerido']"
                >
                </v-autocomplete>
              </v-col>
              <v-col cols="4" v-if="$store.state.user.model.id_city">
                <v-autocomplete
                  label="Distrito "
                  :items="$store.state.itemsTown"
                  v-model="$store.state.user.model.id_town"
                  item-text="name"
                  item-value="id"
                  :loading="loadingDistrito"
                  :item-disabled="(item) => item.status != 1"
                  :rules="[(v) => !!v || 'Dato Requerido']"
                >
                </v-autocomplete>
              </v-col> -->
              <v-col cols="4">
                <v-text-field
                  v-model="userStore.model.address"
                  label="Dirección (*)"
                  :rules="[(v) => !!v || 'Dato Requerido']"
                />
              </v-col>
              <v-col cols="4">
                <v-text-field
                  v-model="userStore.model.socialprincipal"
                  label="URL Red Social Principal"
                />
              </v-col>
              <v-col cols="4">
                <v-text-field
                  v-model="userStore.model.socialsecundary"
                  label="URL Red Social Alternativa"
                />
              </v-col>
              <v-col cols="6">
                Departamento
                <v-icon
                  size="small"
                  @click="snackbar = true"
                  class="iconDepartamento"
                >
                  mdi-information-slab-circle-outline
                </v-icon>
                <v-radio-group
                  :rules="[(v) => !!v || 'Dato Requerido']"
                  v-model="userStore.model.departamento"
                >
                  <v-radio
                    label="Operativo"
                    value="1"
                  />
                  <v-radio
                    label="Administrativo"
                    value="2"
                  />
                </v-radio-group>
              </v-col>
              <v-col cols="6">
                <v-switch
                  label="Estado"
                  v-model="userStore.model.status"
                  :value-comparator="(value, checked) => Boolean(value) === checked"
                />
              </v-col>
            </v-row>
          </v-form>
        </v-tabs-window-item>
      </v-tabs-window>
      <v-btn
        block
        color="success"
        @click="insert()"
        class="mt-10"
      >
        {{
          tab == "datos" ? "Siguiente" : "Guardar"
        }}
      </v-btn>
      <!-- <v-card-actions class="justify-end mt-3">
        <v-btn small class="mx-1" color="success" @click="insert()" rounded>
          Guardar</v-btn
        >
        <v-btn small class="mx-1" dark color="red" @click="volver()" rounded>
          Cancelar</v-btn
        >
      </v-card-actions> -->
    </v-card>
    <v-snackbar
      v-model="snackbar"
      variant="outlined"
      vertical
      color="info"
    >
      El departamento, define como se comportará el usuario para el llendo de
      montos (Pricing u Operaciones) , en el CONTROL DE GASTOS

      <template #actions>
        <v-btn
          variant="text"
          color="red"
          @click="snackbar = false"
        >
          Close
        </v-btn>
      </template>
    </v-snackbar>
  </v-container>
</template>
