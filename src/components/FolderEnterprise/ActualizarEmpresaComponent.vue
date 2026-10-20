<script setup lang="ts">
import { computed, nextTick, onMounted, ref, useTemplateRef, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useAppStore } from "@/stores/app";
import axios from "@/api/http";
import { useCoinsStore } from "@/stores/coins";
import { useEnterprisesStore } from "@/stores/enterprises";
import { useMasterusuariosStore } from "@/stores/masterusuarios";
import type { ApiResponse } from "@/types/api";
import type { FormEnterpriseUpdate } from "@/types/empresas";
import { validateLength } from "@/utils/cotizacion";
import { sessionBranchId } from "@/utils/sesion";
import { useFilesStore } from "@/stores/files";
import { useBankStore } from "@/stores/bank";

const route = useRoute();
const router = useRouter();
const appStore = useAppStore();
const bankStore = useBankStore();
const filesStore = useFilesStore();
const coinsStore = useCoinsStore();
const enterprisesStore = useEnterprisesStore();
const masterusuariosStore = useMasterusuariosStore();

const dialogNuevaCuenta = ref(false);
const enterprise = ref<FormEnterpriseUpdate>({
  id_branch: sessionBranchId(),
  id: route.params.id as string,
  id_logo: "",
  document: "",
  trade_name: "",
  business_name: "",
  slogan: "",
  address: "",
  status: "",
  id_pais: "",
  id_state: "",
  id_city: "",
  id_town: null,
  id_document: "",
  phone: "",
  ic: "",
  originalname: "",
  name_file: "",
  impuesto: "",
  tipoimpuesto: "",
});
const loading_as = ref(true);
const errfile = ref("");
const loadingFile = ref(false);
const msgfile = ref("");
const payfile = ref<File | null>(null);
const errorDocument = ref<string | null>(null);
const tab = ref("principal");
const headerCuentas = [
  { title: "Banco", key: "banco" },
  { title: "Abrv.", key: "banco_acronym" },
  { title: "Nro Cuenta", key: "nrocuenta" },
  { title: "CCI", key: "nrocci" },
  { title: "Usar Facturación", key: "esprincipalflag" },
  { title: "Moneda", key: "moneda" },
  { title: "Abrv. Moneda", key: "monedacronym" },
] as const;
const id_bank = ref(0);
const id_coins = ref<number | string>("");
const nro_cuenta = ref("");
const nro_cci = ref("");
const esprincipalflag = ref(false);
const acronymbanco = ref("");
const nombrebanco = ref("");
const id_pais = ref<number>();
const form = useTemplateRef("form");
const frmNuevaCuenta = useTemplateRef("frmNuevaCuenta");

const bloquearEsPrincipal = computed(() => enterprisesStore.lstCuentas.some((v) => v.esprincipalflag));

watch(
  () => enterprisesStore.record,
  (newRecord) => {
    if (newRecord && Object.keys(newRecord).length > 0) {
      const fieldsToCopy = [
        "id_logo",
        "document",
        "trade_name",
        "business_name",
        "slogan",
        "address",
        "status",
        "id_pais",
        "id_state",
        "id_city",
        "id_town",
        "id_document",
        "ic",
        "originalname",
        "name_file",
        "impuesto",
        "tipoimpuesto",
        "phone",
      ];
      appStore._getState(newRecord.id_pais);
      appStore._getCity(newRecord.id_state);
      appStore._getTown(newRecord.id_city);

      const target = enterprise.value as unknown as Record<string, unknown>;
      const source = newRecord as Record<string, unknown>;
      fieldsToCopy.forEach((field) => {
        target[field] = source[field];
      });

      loading_as.value = false;
    }
  },
  { immediate: true },
);
watch(
  () => filesStore.payPath,
  (newRecord) => {
    if (newRecord) {
      enterprise.value.id_logo = newRecord;
    }
  },
  { immediate: true },
);

onMounted(async () => {
  await enterprisesStore.readEnterprise(route.params.id as string);
  await Promise.all([
    masterusuariosStore.cargarImpuestoRenta(),
    appStore._getDocumentsPais(),
    appStore._getPais(),
    enterprisesStore.listarCuentaEmpresa(),
    bankStore.fetchDataBank({
      code: "",
      name: "",
      acronym: "",
      description: "",
      status: "",
    }),
    coinsStore.getCoinsListCargar(),
  ]);
  bankStore.list.unshift({
    id: 0,
    name: "Crear Nuevo Banco",
  });
  appStore.mainTitle = `ACTUALIZAR EMPRESA`;
});

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function _callState() {
  // id_pais is never assigned, so the branch below is always skipped.
  if (id_pais.value! > 0) {
    appStore._getState(id_pais.value);
  }
}
function abrirModalNuevaCuenta() {
  dialogNuevaCuenta.value = true;
  nextTick(() => {
    frmNuevaCuenta.value!.reset();
    setTimeout(() => {
      id_bank.value = 0;
      esprincipalflag.value = false;
    }, 500);
  });
}
function volver() {
  router.go(-1);
}
async function get_state() {
  enterprise.value.id_state = "";
  enterprise.value.id_city = "";
  enterprise.value.id_town = null;
  await appStore._getState(enterprise.value.id_pais);
}
async function get_city() {
  enterprise.value.id_city = "";
  enterprise.value.id_town = null;
  await appStore._getCity(enterprise.value.id_state);
}
async function get_town() {
  enterprise.value.id_town = null;
  await appStore._getTown(enterprise.value.id_city);
}
async function update() {
  if ((await form.value!.validate()).valid) {
    await enterprisesStore.updateEnterprise(enterprise.value);
  }
}
function updateStatus(newValue: string | number | null) {
  enterprise.value.status = newValue ? 1 : 0;
}
async function validateDocument() {
  errorDocument.value = null;

  await axios<ApiResponse>({
    method: "get",
    url:
      import.meta.env.VITE_URL_MAIN +
      `validar_editar_documento_enterprise?` +
      `id=${enterprise.value.id}` +
      `&id_document=${enterprise.value.id_document}` +
      `&id_branch=${enterprise.value.id_branch}` +
      `&document=${encodeURIComponent(enterprise.value.document)}`,
    headers: {
      "Content-Type": "application/json",
    },
  })
    .then((response) => {
      const data = response.data;
      if (!data.estadoflag) {
        errorDocument.value = data.mensaje;
        enterprise.value.document = "";
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
      if (filesStore.payPath) {
        enterprise.value.name_file = "";
      }
    }
  }
}
async function guardarCuenta() {
  if ((await frmNuevaCuenta.value!.validate()).valid) {
    await enterprisesStore.registrarCuentaEmpresa({
      id_banco: id_bank.value,
      id_coins: id_coins.value,
      numerocuenta: nro_cuenta.value,
      cci: nro_cci.value,
      esprincipalflag: esprincipalflag.value,
      acronymbanco: acronymbanco.value,
      nombrebanco: nombrebanco.value,
    });
    dialogNuevaCuenta.value = false;
    await bankStore.fetchDataBank({
      code: "",
      name: "",
      acronym: "",
      description: "",
      status: "",
    });
  }
}
</script>

<template>
  <v-container>
    <v-card class="py-10 px-10">
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
      <v-tabs
        v-model="tab"
        v-else
      >
        <v-tab value="principal">
          Datos Principales
        </v-tab>
        <v-tab value="bancario">
          Datos Bancarios
        </v-tab>
      </v-tabs>
      <v-tabs-window
        v-model="tab"
        v-if="!loading_as"
      >
        <v-tabs-window-item
          value="principal"
          class="px-10"
        >
          <v-card-title>
            <v-card-text>
              <v-row>
                <v-form
                  ref="form"
                  class="my-4"
                >
                  <v-row>
                    <v-col
                      cols="6"
                      class="py-0"
                    >
                      <v-autocomplete
                        label="Tipo de Documento (*)"
                        v-model="enterprise.id_document"
                        :items="appStore.itemsDocumentsPais"
                        item-title="description"
                        item-value="id"
                        :rules="[(v) => !!v || 'Dato requerido']"
                        clearable
                      />
                    </v-col>
                    <v-col
                      cols="6"
                      class="py-0"
                    >
                      <v-text-field
                        type="text"
                        label="N° de Documento (*)"
                        v-model="enterprise.document"
                        @blur="validateDocument"
                        :rules="[
                          (v) => !!v || 'Dato requerido',
                          (v) =>
                            (v && v.length <= 100) ||
                            'Hasta 100 caracteres permitidos',
                        ]"
                        :error-messages="errorDocument"
                        clearable
                      />
                    </v-col>
                    <v-col
                      cols="6"
                      class="py-0"
                    >
                      <v-text-field
                        label="Nombre Comercial (*)"
                        v-model="enterprise.trade_name"
                        :rules="[
                          (v) => !!v || 'Dato requerido',
                          (v) =>
                            (v && v.length <= 255) ||
                            'Hasta 255 caracteres permitidos',
                        ]"
                        clearable
                      />
                    </v-col>
                    <v-col
                      cols="6"
                      class="py-0"
                    >
                      <v-text-field
                        label="Nombre Negocio (*)"
                        v-model="enterprise.business_name"
                        :rules="[
                          (v) => !!v || 'Dato requerido',
                          (v) =>
                            (v && v.length <= 255) ||
                            'Hasta 255 caracteres permitidos',
                        ]"
                        clearable
                      />
                    </v-col>
                    <v-col
                      cols="6"
                      class="py-0"
                    >
                      <v-text-field
                        label="Teléfono"
                        v-model="enterprise.phone"
                      />
                    </v-col>
                    <v-col
                      cols="6"
                      class="py-0"
                    >
                      <v-text-field
                        label="Slogan"
                        v-model="enterprise.slogan"
                        clearable
                        :rules="[(v) => validateLength(v, 255)]"
                      />
                    </v-col>
                    <v-col
                      cols="6"
                      class="py-0 text-left"
                    >
                      <v-text-field
                        label="Logo"
                        readonly
                        :model-value="enterprise.name_file"
                      />

                      <!-- <div>
                    <label for="image">Logo</label>
                    <v-img
                        v-if="$store.state.enterprises.record.path"
                        :src="$store.state.enterprises.record.path"
                        height="200"
                        >
                    </v-img>
                  </div> -->
                    </v-col>
                    <v-col
                      cols="6"
                      class="py-0 text-left"
                    >
                      <v-file-input
                        label="Actualizar logo"
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
                    <v-col
                      cols="6"
                      class="py-0"
                    >
                      <v-text-field
                        label="IC"
                        v-model="enterprise.ic"
                        :rules="[(v) => validateLength(v, 255)]"
                        clearable
                      />
                    </v-col>
                    <v-col
                      cols="6"
                      class="py-0"
                    >
                      <v-autocomplete
                        label="País (*)"
                        :items="appStore.itemsPais"
                        item-value="id"
                        item-title="name"
                        v-model="enterprise.id_pais"
                        @update:model-value="get_state()"
                        :rules="[(v) => !!v || 'Dato requerido']"
                        clearable
                      />
                    </v-col>
                    <v-col
                      cols="6"
                      class="py-0"
                    >
                      <v-autocomplete
                        label="Región (*)"
                        :items="appStore.itemsState"
                        item-value="id"
                        item-title="name"
                        v-model="enterprise.id_state"
                        @update:model-value="get_city()"
                        :disabled="!enterprise.id_pais"
                        clearable
                      />
                    </v-col>
                    <v-col
                      cols="6"
                      class="py-0"
                    >
                      <v-autocomplete
                        label="Provincia (*)"
                        :items="appStore.itemsCity"
                        item-value="id"
                        item-title="name"
                        v-model="enterprise.id_city"
                        @update:model-value="get_town()"
                        :disabled="!enterprise.id_state"
                        clearable
                      />
                    </v-col>
                    <v-col
                      cols="6"
                      class="py-0"
                    >
                      <v-autocomplete
                        label="Distrito (*)"
                        :items="appStore.itemsTown"
                        item-value="id"
                        item-title="name"
                        v-model="enterprise.id_town"
                        :disabled="!enterprise.id_city"
                        clearable
                      />
                    </v-col>
                    <v-col
                      cols="6"
                      class="py-0"
                    >
                      <v-text-field
                        label="Dirección (*)"
                        v-model="enterprise.address"
                        clearable
                        :rules="[(v) => !!v || 'Dato requerido']"
                      />
                    </v-col>

                    <v-col
                      cols="6"
                      class="py-0"
                    >
                      <v-switch
                        label="Activo / Inactivo"
                        v-model="enterprise.status"
                        :value-comparator="(value, checked) => Boolean(value) === checked"
                        color="success"
                        @update:model-value="updateStatus"
                      />
                    </v-col>
                    <v-col cols="6">
                      <v-autocomplete
                        label="Impuestos a las Ventas en tu País"
                        :items="masterusuariosStore.lstImpRenta"
                        item-value="id"
                        item-title="descripcion"
                        density="compact"
                        v-model="enterprise.tipoimpuesto"
                      >
                        <template #selection="data">
                          <span v-if="data.item">{{ data.item.codigo }}</span>
                        </template>
                      </v-autocomplete>
                    </v-col>
                    <v-col cols="6">
                      <v-text-field
                        type="number"
                        label="Porcentaje"
                        step="0.1"
                        suffix="%"
                        density="compact"
                        hide-details
                        v-model="enterprise.impuesto"
                      />
                    </v-col>
                  </v-row>
                </v-form>
              </v-row>
            </v-card-text>
          </v-card-title>
        </v-tabs-window-item>
        <v-tabs-window-item value="bancario">
          <v-row>
            <v-col
              cols="12"
              style="text-align: right"
            >
              <v-btn
                color="success"
                size="small"
                @click="abrirModalNuevaCuenta"
              >
                Nueva Cuenta
              </v-btn>
            </v-col>
            <v-col cols="12">
              <v-data-table
                :headers="headerCuentas"
                :items="enterprisesStore.lstCuentas"
              >
                <template #[`item.esprincipalflag`]="{ item }">
                  <v-chip
                    v-if="item.esprincipalflag"
                    class="ma-2"
                    color="green"
                  >
                    SI
                  </v-chip>
                </template>
              </v-data-table>
            </v-col>
          </v-row>
        </v-tabs-window-item>
      </v-tabs-window>

      <v-card-actions
        v-if="!loading_as"
        class="justify-end mt-3"
      >
        <v-btn
          size="small"
          class="mx-1"
          color="success"
          @click="update()"
          rounded
        >
          Guardar
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
    <v-dialog
      v-model="dialogNuevaCuenta"
      scrollable
      max-width="30%"
    >
      <v-card>
        <v-card-title> Nueva Cuenta </v-card-title>
        <v-card-text>
          <v-form ref="frmNuevaCuenta">
            <v-autocomplete
              :items="bankStore.list"
              item-title="name"
              item-value="id"
              label="Banco"
              v-model="id_bank"
            />
            <v-text-field
              v-if="id_bank == 0"
              :rules="[(v) => !!v || 'Dato Requerido']"
              label="Acrónimo Banco"
              v-model="acronymbanco"
            />
            <v-text-field
              v-if="id_bank == 0"
              :rules="[(v) => !!v || 'Dato Requerido']"
              label="Nombre Banco"
              v-model="nombrebanco"
            />
            <v-autocomplete
              :items="coinsStore.itemsCoinsList"
              item-title="name"
              item-value="id"
              label="Moneda"
              :rules="[(v) => v === '0' || v === 0 || !!v || 'Dato Requerido']"
              v-model="id_coins"
            />
            <v-text-field
              :rules="[(v) => !!v || 'Dato Requerido']"
              v-model="nro_cuenta"
              label="Número Cuenta"
            />
            <v-text-field
              :rules="[(v) => !!v || 'Dato Requerido']"
              v-model="nro_cci"
              label="CCI"
            />
            <v-switch
              v-model="esprincipalflag"
              label="Usar en Facturación"
            />
            <span
              v-if="bloquearEsPrincipal && esprincipalflag"
              class="mt-0"
              style="color: red"
            >
              <p
                class="my-0"
                style="font-size: 0.8rem"
              >
                Ya existe una cuenta configurada para usar en facturación,
              </p>
              <p
                class="my-0"
                style="font-size: 0.8rem"
              >
                Se actualizará el registro
              </p>
            </span>
          </v-form>
          <div
            style="text-align: right"
            class="mt-5"
          >
            <v-spacer />
            <v-btn
              size="small"
              class="mx-1"
              color="success"
              @click="guardarCuenta"
            >
              Guardar
            </v-btn>
            <v-btn
              size="small"
              class="mx-1"
              color="error"
              @click="dialogNuevaCuenta = false"
            >
              Cancelar
            </v-btn>
          </div>
        </v-card-text>
      </v-card>
    </v-dialog>
  </v-container>
</template>
