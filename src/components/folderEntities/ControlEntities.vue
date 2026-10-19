<script setup lang="ts">
import { computed, onMounted, ref, useTemplateRef } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useStore } from "vuex";
import Swal from "sweetalert2";
import axios from "@/api/http";
import { useEntitiesStore } from "@/stores/entities";
import { useMasterusuariosStore } from "@/stores/masterusuarios";
import type { ApiResponse } from "@/types/api";
import type { CuentaEntidadNueva, EntidadControl, OpcionCuentaBancaria } from "@/types/entidades";
import type { Moneda } from "@/types/catalogos";
import { sessionBranchId } from "@/utils/sesion";

const route = useRoute();
const router = useRouter();
const rootStore = useStore();
const entitiesStore = useEntitiesStore();
const masterusuariosStore = useMasterusuariosStore();

// props: {
//   dataClien: 1,
// },
const cuentas = ref<CuentaEntidadNueva[]>([]);
const modalCuentas = ref(false);
const id_documents = ref<number | string>("");
const n_documents = ref("");
const names = ref("");
const surname = ref("");
const second_surname = ref("");
const tradename = ref("");
const business_name = ref("");
const id_pais = ref<number | string>("");
const id_state = ref<number | string>("");
const id_city = ref<number | string>("");
const id_town = ref<number | string>("");
const id_sex = ref<number | string>("");
const address = ref("");
const notes = ref("");
const statusData = ref(1);
const id_entitie = ref<number | string>("");
const id_role = ref<number | string>("");
const dataList = ref(true);
const diascredito = ref(0);
const diasdeuda = ref(0);
//id_role: this.$route.params.id_role,

const date = ref(
  new Date(Date.now() - new Date().getTimezoneOffset() * 60000)
    .toISOString()
    .substr(0, 10),
);
const id_tipo_proveedor = ref<number | string | null>(null);
const frmData = useTemplateRef("frmData");

const itemsDocumentsPais = computed(() => rootStore.state.itemsDocumentsPais);
const itemsPais = computed(() => rootStore.state.itemsPais);
const itemsState = computed(() => rootStore.state.itemsState);
const itemsCity = computed(() => rootStore.state.itemsCity);
const itemsTown = computed(() => rootStore.state.itemsTown);
const itemsSex = computed(() => rootStore.state.itemsSex);

onMounted(async () => {
  rootStore.state.spiner = true;
  await rootStore.dispatch("_getDocumentsPais");
  await rootStore.dispatch("_getPais");
  await rootStore.dispatch("_getRole");
  await _callState();
  await rootStore.dispatch("_getSex");
  await _validatyDocuments();
  await masterusuariosStore.cargarMasterDetalleTipoProveedor();
  if (route.params.id) {
    await _getAccountsNumber();
  }
  id_pais.value = JSON.parse(
    sessionStorage.getItem("dataBranch") as string,
  )[0].id_PaisBrach;
  if (route.params.id_role) {
    rootStore.state.id_role_actual = route.params.id_role;
  }
  await _validaData();
  rootStore.state.spiner = false;
});

function _validatyDocuments() {
  if (
    JSON.parse(sessionStorage.getItem("dataBranch") as string)[0].id_PaisBrach == 139
  ) {
    id_documents.value = 2;
  }
}

function _callState() {
  if ((id_pais.value as number) > 0) {
    rootStore.dispatch("_getState", id_pais.value);
  }
}

async function _getAccountsNumber() {
  const data = {
    id_branch: sessionBranchId(),
  };
  const config = {
    method: "post",
    url:
      import.meta.env.VITE_URL_MAIN +
      "getAccountsNumber/" +
      route.params.id,
    headers: {
      "Content-Type": "application/json",
    },
    data: data,
  };
  await axios<ApiResponse>(config)
    .then(function (response) {
      rootStore.state.itemsDataAccountsNumberList = response.data.data;
    })
    .catch(function (error) {
      console.error(error);
    });
}

function clenData() {
  names.value = "";
  surname.value = "";
  second_surname.value = "";
  tradename.value = "";
  business_name.value = "";
  date.value = "";
  n_documents.value = "";
  address.value = "";
  notes.value = "";
  id_tipo_proveedor.value = "";
}
function getPhone() {
  rootStore.dispatch("ListarPhones", route.params.id);
  rootStore.state.modalPhones = !rootStore.state.modalPhones;
}
function _validaDocumento() {
  if (n_documents.value) {
    const data = {
      ic: id_documents.value + n_documents.value,
      id_branch: sessionBranchId(),
    };

    const config = {
      method: "post",
      url: import.meta.env.VITE_URL_MAIN + "getEntitiesListIc",
      headers: {
        "Content-Type": "application/json",
      },
      data: data,
    };
    axios<ApiResponse<EntidadControl[]>>(config)
      .then(function (response) {
        if (response.data.estadoflag == true) {
          Swal.fire({
            icon: "warning",
            title: "Lo sentimos",
            text: "Este documento ya existe en la base de datos",
            showDenyButton: true,
            confirmButtonText: "Modificar datos existentes",
            denyButtonText: `Cancelar registro`,
          }).then((result) => {
            /* Read more about isConfirmed, isDenied below */
            if (result.isConfirmed) {
              router.push(
                "/home/folderEntities/control/edit/" +
                  response.data.data[0]!.id,
              );
              _validaData();
            } else if (result.isDenied) {
              Swal.fire("Registro cancelado", "", "info");
            }
          });
          statusData.value = 2;
        }
      })
      .catch(function (error) {
        console.error(error);
      });
  }
}

function _validaData() {
  if (route.params.id) {
    dataList.value = false;
    rootStore.state.house_Id_get = route.params.id;
    const data = {
      id: route.params.id,
      id_branch: sessionBranchId(),
    };
    const config = {
      method: "post",
      url: import.meta.env.VITE_URL_MAIN + "getEntitiesListId",
      headers: {
        "Content-Type": "application/json",
      },
      data: data,
    };
    axios<ApiResponse<EntidadControl[]>>(config)
      .then(function (response) {
        names.value = response.data.data[0]!.names!;
        surname.value = response.data.data[0]!.surname!;
        second_surname.value = response.data.data[0]!.second_surname!;
        tradename.value = response.data.data[0]!.tradename!;
        business_name.value = response.data.data[0]!.business_name!;
        date.value = response.data.data[0]!.birthday!;
        n_documents.value = response.data.data[0]!.document!;
        address.value = response.data.data[0]!.address!;
        notes.value = response.data.data[0]!.notes!;
        id_pais.value = response.data.data[0]!.id_pais!;
        id_state.value = response.data.data[0]!.id_state!;
        rootStore.dispatch("_getCity", response.data.data[0]!.id_state);
        id_city.value = response.data.data[0]!.id_city!;
        rootStore.dispatch("_getTown", response.data.data[0]!.id_city);
        id_town.value = response.data.data[0]!.id_town!;
        id_sex.value = response.data.data[0]!.id_sex!;
        id_documents.value = response.data.data[0]!.id_document!;
        statusData.value = 2;
        id_entitie.value = response.data.data[0]!.id;
        id_role.value = response.data.data[0]!.id_role!;
        diascredito.value = response.data.data[0]!.diascredito!;
        diasdeuda.value = response.data.data[0]!.diasdeuda!;
        id_tipo_proveedor.value = response.data.data[0]!.id_tipo_proveedor!;
        dataList.value = true;
      })
      .catch(function (error) {
        console.error(error);
      });
  }
}

async function _postEntitie() {
  if ((await frmData.value!.validate()).valid) {
    const dataEntitie = {
      names: !names.value || names.value == "" ? null : names.value,
      surname: !surname.value || surname.value == "" ? null : surname.value,
      second_surname:
        !second_surname.value || second_surname.value == ""
          ? null
          : second_surname.value,
      tradename: !tradename.value || tradename.value == "" ? null : tradename.value,
      business_name:
        !business_name.value || business_name.value == ""
          ? null
          : business_name.value,
      birthday: !date.value || date.value == "" ? null : date.value,
      document:
        !n_documents.value || n_documents.value == "" ? null : n_documents.value,
      address: !address.value || address.value == "" ? null : address.value,
      notes: !notes.value || notes.value == "" ? null : notes.value,
      status: 1,
      id_pais: !id_pais.value || id_pais.value == "" ? null : id_pais.value,
      id_state: id_state.value ? id_state.value : null,
      id_city: id_city.value ? id_city.value : null,
      id_town: id_town.value ? id_town.value : null,
      id_sex: id_sex.value ? id_sex.value : null,
      id_document: id_documents.value ? id_documents.value : null,
      id_branch: sessionBranchId(),
      dataPhones: rootStore.state.itemsListPhone,
      dataContacts: rootStore.state.itemsListContact,
      accounts: cuentas.value,
      id_role: rootStore.state.data_id_role,
      diascredito: diascredito.value,
      diasdeuda: diasdeuda.value,
      id_tipo_proveedor: id_tipo_proveedor.value,
    };
    const config = {
      method: "post",
      url: import.meta.env.VITE_URL_MAIN + "addEntities",
      headers: {
        "Content-Type": "application/json",
      },
      data: dataEntitie,
    };
    await axios<ApiResponse<{ insertid: number }[]>>(config)
      .then(function (response) {
        if (response.data.status == 200) {
          const idInsert = response.data.data[0]!.insertid;
          _postRoleEntitie(idInsert);
        } else {
          Swal.fire({
            icon: "error",
            title: "Lo sentimos",
            text: "Ha ocurrido un error en el proceso",
          });
        }
      })
      .catch(function (error) {
        console.error(error);
        Swal.fire({
          icon: "error",
          title: "Lo sentimos",
          text: "Ha ocurrido un error en el proceso " + error,
        });
      });
  }
}

function cambiarRole() {
  const data = {
    id_role: rootStore.state.data_id_role,
  };
  const config = {
    method: "post",
    url: import.meta.env.VITE_URL_MAIN + "editRole/" + route.params.id,
    headers: {
      "Content-Type": "application/json",
    },
    data: data,
  };
  axios<ApiResponse>(config)
    .then(function (response) {
      if (response.data.status == 200) {
        Swal.fire({
          icon: "success",
          title: "Excelente",
          text: "Role actualizada con éxito",
        });
        if (route.params.id) {
          // vm._getEntities(vm.id_role);
          router.back();
        }
      } else {
        Swal.fire({
          icon: "error",
          title: "Lo sentimos",
          text: "Ha ocurrido un error en el proceso",
        });
      }
    })
    .catch(function (error) {
      console.error(error);
    });
}

async function _updatetEntitie() {
  if ((await frmData.value!.validate()).valid) {
    const dataEntitie = {
      names: names.value,
      surname: surname.value,
      second_surname: second_surname.value,
      tradename: tradename.value,
      business_name: business_name.value,
      birthday: date.value,
      document: n_documents.value,
      address: address.value,
      notes: notes.value,
      id_pais: id_pais.value,
      id_state: id_state.value,
      id_city: id_city.value,
      id_town: id_town.value,
      id_sex: id_sex.value,
      id_document: id_documents.value,
      id_branch: sessionBranchId(),
      telefono: rootStore.state.itemsListPhone,
      diascredito: diascredito.value,
      diasdeuda: diasdeuda.value,
      id_tipo_proveedor: id_tipo_proveedor.value,
    };
    const config = {
      method: "post",
      url: import.meta.env.VITE_URL_MAIN + "editEntitie/" + id_entitie.value,
      headers: {
        "Content-Type": "application/json",
      },
      data: dataEntitie,
    };
    await axios<ApiResponse>(config)
      .then(function (response) {
        if (response.data.status == 200) {
          Swal.fire({
            icon: "success",
            title: "Excelente",
            text: "Entidad actualizada con éxito",
          });
          if (route.params.id) {
            router.back();
          }
        } else {
          Swal.fire({
            icon: "error",
            title: "Lo sentimos",
            text: "Ha ocurrido un error en el proceso",
          });
        }
      })
      .catch(function (error) {
        Swal.fire({
          icon: "error",
          title: "Lo sentimos",
          text: "Ha ocurrido un error en el proceso " + error,
        });
      });
  }
}

async function _postRoleEntitie(id_entitie: number) {
  const dataEntitie = {
    id_entities: id_entitie,
    id_role: rootStore.state.id_role_actual,
  };
  const config = {
    method: "post",
    url: import.meta.env.VITE_URL_MAIN + "addRoleEntitie",
    headers: {
      "Content-Type": "application/json",
    },
    data: dataEntitie,
  };
  await axios<ApiResponse>(config)
    .then(function (response) {
      if (response.data.status == 200) {
        if (rootStore.state.id_role_actual == 1) {
          rootStore.dispatch("_getAgents");
          clenData();
          rootStore.state.modalAgente = false;
        } else if (rootStore.state.id_role_actual == 11) {
          rootStore.dispatch("_getConsigners");
          rootStore.dispatch("_getNotify");

          clenData();
          rootStore.state.modalEntitie = false;
        } else if (rootStore.state.id_role_actual == 17) {
          rootStore.dispatch("_getColoaders");
          clenData();
          rootStore.state.modalColoader = false;
        } else if (rootStore.state.id_role_actual == 2) {
          rootStore.dispatch("_getNavieras");
          clenData();
          rootStore.state.modalNaviera = false;
        }

        Swal.fire({
          icon: "success",
          title: "Excelente",
          text: "Proceso éxitoso",
        });
        if (rootStore.state.modalEntitie == false) {
          rootStore.state.registroClienteFlag =
            !rootStore.state.registroClienteFlag;
          entitiesStore.id = id_entitie;
          rootStore.state.modalEntitie = false;
        } else {
          router.back();
        }
      } else {
        Swal.fire({
          icon: "error",
          title: "Lo sentimos",
          text: "Ha ocurrido un error en el proceso",
        });
      }
    })
    .catch(function (error) {
      Swal.fire({
        icon: "error",
        title: "Lo sentimos",
        text: "Ha ocurrido un error en el proceso " + error,
      });
    });
}
function _setAccounts() {
  cuentas.value.push({
    accountIdTypeAccount: rootStore.state.accountIdTypeAccount,
    nameaccount: rootStore.state.itemsDataAccountList.filter(
      (v: OpcionCuentaBancaria) => v.id == rootStore.state.accountIdTypeAccount,
    )[0].name,
    accountIdBanks: rootStore.state.accountIdBanks,
    namebanks: rootStore.state.itemsDataBanksList.filter(
      (v: OpcionCuentaBancaria) => v.id == rootStore.state.accountIdBanks,
    )[0].name,
    accountIdCoins: rootStore.state.accountIdCoins,
    namecoins: rootStore.state.itemsCoinsList.filter(
      (v: Moneda) => v.id == rootStore.state.accountIdCoins,
    )[0].acronym,
    accountnumber: rootStore.state.accountNumer,
  });
  rootStore.state.accountIdTypeAccount = "";
  rootStore.state.accountIdBanks = "";
  rootStore.state.accountIdCoins = "";
  rootStore.state.accountNumer = "";
}
</script>

<template>
  <div>
    <v-container fluid>
      <v-row>
        <v-col cols="10">
          <v-form ref="frmData">
            <v-row density="compact">
              <v-col
                cols="12"
                md="6"
              >
                <v-autocomplete
                  :items="itemsDocumentsPais"
                  item-title="description"
                  item-value="id"
                  label="Tipo de Documento Fiscal"
                  v-model="id_documents"
                  @update:model-value="_validaDocumento()"
                  :rules="[(v) => !!v || 'Dato Requerido']"
                />
              </v-col>
              <v-col
                cols="12"
                md="6"
              >
                <v-text-field
                  v-model="n_documents"
                  type="text"
                  label="N° de Documento Fiscal"
                  @focusout="_validaDocumento()"
                  :rules="[(v) => !!v || 'Dato Requerido']"
                />
              </v-col>
              <v-col
                cols="12"
                md="6"
              >
                <v-autocomplete
                  :items="masterusuariosStore.lstTipoProveedor"
                  item-title="descripcion"
                  item-value="id"
                  label="Tipo de Proveedor"
                  v-model="id_tipo_proveedor"
                />
              </v-col>
              <v-col
                v-if="id_documents != 2"
                cols="12"
                md="12"
              >
                <v-text-field
                  v-model="names"
                  label="Nombres"
                  :rules="[(v) => !!v || 'Dato Requerido']"
                />
              </v-col>
              <v-col
                v-if="id_documents != 2"
                cols="12"
                md="6"
              >
                <v-text-field
                  v-model="surname"
                  label="Primer Apellido"
                  :rules="[(v) => !!v || 'Dato Requerido']"
                />
              </v-col>
              <v-col
                v-if="id_documents != 2"
                cols="12"
                md="6"
              >
                <v-text-field
                  v-model="second_surname"
                  label="Segundo Apellido"
                  :rules="[(v) => !!v || 'Dato Requerido']"
                />
              </v-col>
              <v-col
                v-if="id_documents == 2"
                cols="12"
                md="6"
              >
                <v-text-field
                  v-model="tradename"
                  label="Nombre Comercial"
                  :rules="[(v) => !!v || 'Dato Requerido']"
                />
              </v-col>
              <v-col
                v-if="id_documents == 2"
                cols="12"
                md="6"
              >
                <v-text-field
                  v-model="business_name"
                  label="Razón Social"
                  :rules="[(v) => !!v || 'Dato Requerido']"
                />
              </v-col>
              <v-col
                cols="12"
                md="6"
              >
                <v-autocomplete
                  item-title="name"
                  item-value="id"
                  :items="itemsPais"
                  label="País"
                  v-model="id_pais"
                  @update:model-value="rootStore.dispatch('_getState', id_pais)"
                  :rules="[(v) => !!v || 'Dato Requerido']"
                />
              </v-col>
              <v-col
                cols="12"
                md="6"
              >
                <v-autocomplete
                  :items="itemsState"
                  item-title="name"
                  item-value="id"
                  v-model="id_state"
                  @update:model-value="rootStore.dispatch('_getCity', id_state)"
                  label="Departamento"
                />
              </v-col>
              <v-col
                cols="12"
                md="6"
              >
                <v-autocomplete
                  :items="itemsCity"
                  item-title="name"
                  item-value="id"
                  v-model="id_city"
                  @update:model-value="rootStore.dispatch('_getTown', id_city)"
                  label="Provincia"
                />
              </v-col>
              <v-col
                cols="12"
                md="6"
              >
                <v-autocomplete
                  :items="itemsTown"
                  item-title="name"
                  item-value="id"
                  label="Distrito"
                  v-model="id_town"
                />
              </v-col>
              <v-col
                v-if="id_documents != 2"
                cols="12"
                md="6"
              >
                <v-autocomplete
                  :items="itemsSex"
                  item-title="name"
                  item-value="id"
                  v-model="id_sex"
                  label="Sexo"
                  :rules="[(v) => !!v || 'Dato Requerido']"
                />
              </v-col>
              <v-col
                cols="12"
                md="6"
              >
                <v-text-field
                  type="number"
                  step="1"
                  label="Días de Crédito para que nos paguen"
                  v-model="diascredito"
                  :rules="[(v) => v >= 0 || 'Dato Requerido']"
                />
              </v-col>
              <v-col
                cols="12"
                md="6"
              >
                <v-text-field
                  type="number"
                  step="1"
                  label="Días de Crédito para nosotros pagar"
                  v-model="diasdeuda"
                  :rules="[(v) => v >= 0 || 'Dato Requerido']"
                />
              </v-col>
              <v-col
                v-if="id_documents != 2"
                cols="12"
                md="6"
              >
                <v-text-field
                  type="date"
                  v-model="date"
                  label="Fecha de Nacimiento"
                />
              </v-col>
            </v-row>
            <v-row density="compact">
              <v-col
                cols="12"
                md="6"
              >
                <v-textarea
                  rows="3"
                  v-model="address"
                  label="Dirección"
                />
              </v-col>
              <v-col
                cols="12"
                md="6"
              >
                <v-textarea
                  rows="3"
                  v-model="notes"
                  label="Notas Importantes"
                />
              </v-col>

              <v-col
                cols="12"
                md="12"
              >
                <v-btn
                  v-if="statusData == 1"
                  @click="_postEntitie()"
                  color="success"
                  class="mr-2"
                  elevation="0"
                >
                  Guardar
                </v-btn>
                <v-btn
                  v-if="statusData == 2"
                  @click="_updatetEntitie()"
                  color="success"
                  class="mr-2"
                  elevation="0"
                >
                  Actualizar
                </v-btn>
                <v-btn
                  color="error"
                  elevation="0"
                >
                  Cancelar
                </v-btn>
              </v-col>

              <v-col cols="8">
                <v-autocomplete
                  v-model="rootStore.state.data_id_role"
                  :items="rootStore.state.itemsDataRoleList"
                  item-title="name"
                  item-value="id"
                  label="Cambiar Tipo de Role"
                />
              </v-col>
              <v-col cols="4">
                <v-btn
                  @click="cambiarRole()"
                  size="x-large"
                  block
                >
                  CAMBIAR
                </v-btn>
              </v-col>
            </v-row>
          </v-form>
        </v-col>
        <v-col cols="2">
          <v-tooltip location="top">
            <template #activator="{ props }">
              <v-btn
                class="mx-2 mt-5"
                icon
                elevation="0"
                size="large"
               
                v-bind="props"
                @click="getPhone()"
                color="blue-grey-darken-3"
              >
                <v-icon> mdi-phone </v-icon>
              </v-btn>
            </template>
            <span>Teléfonos</span>
          </v-tooltip>
          <v-tooltip location="bottom">
            <template #activator="{ props }">
              <v-btn
                class="mx-2 mt-5"
                icon
                elevation="0"
                size="large"
               
                v-bind="props"
                @click="
                  rootStore.state.modalContacts = !rootStore.state.modalContacts
                "
                color="blue-grey-darken-3"
              >
                <v-icon> mdi-account-multiple </v-icon>
              </v-btn>
            </template>
            <span>Contactos</span>
          </v-tooltip>

          <v-tooltip
            v-if="$route.params.id"
            location="bottom"
          >
            <template #activator="{ props }">
              <v-btn
                class="mx-2 mt-5"
                icon
                elevation="0"
                size="large"
               
                v-bind="props"
                @click="rootStore.state.modalCuentas = !rootStore.state.modalCuentas"
                color="blue-grey-darken-3"
              >
                <v-icon> mdi-bank </v-icon>
              </v-btn>
            </template>
            <span>Cuentas</span>
          </v-tooltip>
          <v-tooltip
            v-else
            location="bottom"
          >
            <template #activator="{ props }">
              <v-btn
                class="mx-2 mt-5"
                icon
                elevation="0"
                size="large"
               
                v-bind="props"
                @click="modalCuentas = !modalCuentas"
                color="blue-grey-darken-3"
              >
                <v-icon> mdi-bank </v-icon>
              </v-btn>
            </template>
            <span>Cuentas</span>
          </v-tooltip>
        </v-col>
      </v-row>
    </v-container>
    <v-dialog
      v-model="modalCuentas"
      max-width="750"
    >
      <v-card>
        <v-card-title class="text-headline-medium">
          Cuentas
        </v-card-title>
        <v-card-text>
          <v-row>
            <v-col cols="2">
              <v-autocomplete
                v-model="rootStore.state.accountIdTypeAccount"
                :items="rootStore.state.itemsDataAccountList"
                item-title="name"
                item-value="id"
                label="Cuenta"
              />
            </v-col>

            <v-col cols="2">
              <v-autocomplete
                v-model="rootStore.state.accountIdBanks"
                :items="rootStore.state.itemsDataBanksList"
                item-title="acronym"
                item-value="id"
                label="Banco"
              />
            </v-col>

            <v-col cols="2">
              <v-autocomplete
                v-model="rootStore.state.accountIdCoins"
                :items="rootStore.state.itemsCoinsList"
                item-title="acronym"
                item-value="id"
                label="Moneda"
              />
            </v-col>

            <v-col cols="4">
              <v-text-field
                type="number"
                label="N°. Cuenta"
                v-model="rootStore.state.accountNumer"
              />
            </v-col>

            <v-col cols="1">
              <v-btn
                v-if="rootStore.state.accountNumer != ''"
                class="mx-2"
                icon
                color="teal-darken-1"
                elevation="0"
                @click="_setAccounts()"
              >
                <v-icon size="x-large">
                  mdi-plus
                </v-icon>
              </v-btn>
            </v-col>
          </v-row>
          <v-table density="compact">
            <template #default>
              <thead>
                <tr>
                  <th class="text-left">
                    Cuenta
                  </th>
                  <th class="text-left">
                    Banco
                  </th>
                  <th class="text-left">
                    Moneda
                  </th>
                  <th class="text-left">
                    Número de cuenta
                  </th>
                  <th class="text-left">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="item of cuentas"
                  :key="item.id"
                >
                  <td>{{ item.nameaccount }}</td>
                  <td>{{ item.namebanks }}</td>
                  <td>{{ item.namecoins }}</td>
                  <td>{{ item.accountnumber }}</td>
                  <td>
                    <!-- @vue-expect-error Kept: _delAccount was never defined in this component, so this click has always thrown. -->
                    <v-btn
                      @click="_delAccount(item.id)"
                      color="white"
                      elevation="0"
                    >
                      <v-icon color="error">
                        mdi-delete
                      </v-icon>
                    </v-btn>
                  </td>
                </tr>
              </tbody>
            </template>
          </v-table>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn
            color="green-darken-1"
            variant="text"
            @click="modalCuentas = false"
          >
            Cerrar
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>
