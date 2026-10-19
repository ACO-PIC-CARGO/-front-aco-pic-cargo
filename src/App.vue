<script setup lang="ts">
import { defineAsyncComponent, onBeforeMount, onMounted, ref, useTemplateRef } from "vue";
import { io } from "socket.io-client";
import { useRoute } from "vue-router";
import { useDisplay } from "vuetify";
import { useStore } from "vuex";
import axios from "@/api/http";
import { useEntitiesStore } from "@/stores/entities";
import type { ApiResponse } from "@/types/api";
import type { VersionSistema } from "@/types/version";

const ControlServices = defineAsyncComponent(
  () => import("@/components/ServicesControl.vue"),
);
const NuevoCliente = defineAsyncComponent(
  () =>
    import("@/components/folderEntities/Cliente/NuevoClienteComponent.vue"),
);
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const listEntitie = defineAsyncComponent(
  () => import("@/components/folderEntities/ListEntities.vue"),
);
const EditarCliente = defineAsyncComponent(
  () =>
    import("@/components/folderEntities/Cliente/EditarClienteComponent.vue"),
);

const route = useRoute();
const rootStore = useStore();
const entitiesStore = useEntitiesStore();
const { smAndDown } = useDisplay();

const socket = io(import.meta.env.VITE_URL_MAIN, {
  transports: ["polling"],
});
socket.on("connect_error", (err) => {
  console.error("Error al conectar con Socket.IO:", err);
});

const registration = ref<ServiceWorkerRegistration | null>(null);
const listAgente = ref(false);
const dialogWelcome = ref(false);
const dialogVersion = ref(false);
const dialogExito = ref(false);
const cargando = ref(false);
const dialogPower = ref(false);
const id = ref<string | string[]>("");
const newquote = false;
const guardarClienteFlag = ref(false);
const isPricing = ref(false);
const formContenedor = useTemplateRef("formContenedor");

onMounted(async () => {
  rootStore.state.security = JSON.parse(sessionStorage.getItem("security") as string);
  setTimeout(() => {
    rootStore.state.lstMenu = JSON.parse(sessionStorage.getItem("menu") as string);
    _getVersion();
  }, 10);

  socket.on("version-actualizada", (data: VersionSistema) => {
    if (data.modulo === "operativo") {
      if (data.power == 0) {
        dialogPower.value = true;
        return;
      }
      if (data.power == 1) {
        dialogPower.value = false;
      }
      if (data.version != import.meta.env.VITE_VERSION) {
        dialogVersion.value = true;
      }
    }
  });

  window.addEventListener("sw-updated", (event) => {
    registration.value = (event as CustomEvent<ServiceWorkerRegistration>).detail;
    dialogVersion.value = true; // Muestra tu diálogo actual
  });

  rootStore.state.drawer = false;

  if (route.params.id) {
    id.value = route.params.id;
  }
  const urlPricing = ["newQuote", "verQuote", "editQuote"];
  if (urlPricing.includes(route.name as string)) {
    isPricing.value = true;
  }
  if (localStorage.getItem("actualizando") === "1") {
    localStorage.removeItem("actualizando");
    dialogVersion.value = false;
    dialogExito.value = true;
  }
});
onBeforeMount(async () => {
  sessionStorage.removeItem("hasReloaded");
  sessionStorage.setItem("version", import.meta.env.VITE_VERSION);
  localStorage.setItem("version", import.meta.env.VITE_VERSION);
});

async function actualizar() {
  cargando.value = true;
  localStorage.setItem("actualizando", "1");

  if (window.caches) {
    const cacheNames = await caches.keys();
    await Promise.all(cacheNames.map((name) => caches.delete(name)));
  }

  if (registration.value && registration.value.waiting) {
    registration.value.waiting.postMessage({ type: "SKIP_WAITING" });
  }

  setTimeout(() => {
    const url = window.location.origin + window.location.pathname;
    window.location.href = `${url}?v=${new Date().getTime()}`;
  }, 5000); // espera 5 segundos
}
async function registrarCliente() {
  rootStore.state.spiner = true;
  await entitiesStore.guardarCliente();
  rootStore.state.spiner = false;
}
async function modificarCliente() {
  rootStore.state.spiner = true;
  await entitiesStore.actualizarCliente();
  rootStore.state.modalEntitie = false;
  rootStore.state.recargarClienteFlag =
    !rootStore.state.recargarClienteFlag;
  rootStore.state.spiner = false;
}
function closeWelcome() {
  sessionStorage.setItem("welcome", "1");
  dialogWelcome.value = false;
}
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function _validaWelcome() {
  if (sessionStorage.getItem("welcome")) {
    dialogWelcome.value = false;
  } else {
    dialogWelcome.value = true;
  }
}
async function _setDataContainers(
  id: number,
  name: string,
  nrocontainer: string,
  nroprecinto: string,
  cantidad: number | string,
) {
  if ((await formContenedor.value!.validate()).valid) {
    rootStore.state.master_itemsContainers.push({
      id_container: id,
      name: name,
      nro_container: nrocontainer,
      nro_precinto: nroprecinto,
      cantidad: cantidad,
    });

    rootStore.state.modalContainers = false;

    rootStore.state.master_id_containers = "";
    rootStore.state.master_nro_containers = "";
    rootStore.state.master_nro_precinto = "";
    rootStore.state.master_cantidad = "";
  }
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function cleanData() {
  rootStore.state.accountIdTypeAccount = "";
  rootStore.state.accountIdBanks = "";
  rootStore.state.accountIdCoins = "";
  rootStore.state.accountNumer = "";
}

async function _getVersion() {
  const data = {
    modulo: "operativo",
  };
  const config = {
    method: "post",
    url: import.meta.env.VITE_URL_MAIN + "getVersion",
    headers: {
      "Content-Type": "application/json",
    },
    data: data,
  };

  try {
    await axios<ApiResponse<VersionSistema[]>>(config)
      .then(function (response) {
        const serverVersion = response.data.data[0]!.version;
        const currentVersion = sessionStorage.getItem("version");
        if (
          !!currentVersion &&
          serverVersion != currentVersion
        ) {
          dialogVersion.value = true;
        } else {
          dialogVersion.value = false;
        }

        if (response.data.data[0]!.power != 1) {
          dialogPower.value = true;
        } else {
          dialogPower.value = false;
        }
      })
      .catch(function (error) {
        console.error(error);
      });
  } catch (error) {
    console.error(error);
  }
}

async function _delAccount(id: number) {
  const config = {
    method: "post",
    url: import.meta.env.VITE_URL_MAIN + "delAccount/" + id,
    headers: {
      "Content-Type": "application/json",
    },
  };
  await axios(config)
    .then(function () {
      _getAccountsNumber();
    })
    .catch(function (error) {
      console.error(error);
    });
}

async function _getAccountsNumber() {
  const data = {
    id_branch: JSON.parse(sessionStorage.getItem("dataUser") as string)[0].id_branch,
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

async function _setAccounts() {
  const data = {
    id_entities: route.params.id,
    id_account: rootStore.state.accountIdTypeAccount,
    id_banks: rootStore.state.accountIdBanks,
    id_coins: rootStore.state.accountIdCoins,
    accountNumber: rootStore.state.accountNumer,
    status: rootStore.state.accountStatus,
    id_branch: JSON.parse(sessionStorage.getItem("dataUser") as string)[0].id_branch,
  };
  const config = {
    method: "post",
    url: import.meta.env.VITE_URL_MAIN + "setAccount",
    headers: {
      "Content-Type": "application/json",
    },
    data: data,
  };
  await axios(config)
    .then(function () {
      _getAccountsNumber();
    })
    .catch(function (error) {
      console.error(error);
    });
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function _delContainers(index: number) {
  rootStore.state.master_itemsContainers.splice(index, 1);
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function _nextListAgents() {
  rootStore.dispatch("_getEntities", 1);

  listAgente.value = !listAgente.value;
}

function _deletePhones(index: number) {
  rootStore.state.itemsListPhone.splice(index, 1);
}

function _deleteContacts(i: number | string) {
  rootStore.state.itemsListContact.splice(i, 1);
}

function mostrarBtnGuardar() {
  if (!entitiesStore.cliente.id_tipopersona) {
    return false;
  }
  if (!entitiesStore.cliente.nombrecompleto) {
    return false;
  }
  if (!entitiesStore.cliente.id_tipotransaccion) {
    return false;
  }
  if (!entitiesStore.cliente.id_pais) {
    return false;
  }
  if (!entitiesStore.cliente.telefonoActual.telefono) {
    return false;
  }
  // @ts-expect-error Kept: the entities module never had house_id_consigner, so this read is always undefined.
  if (entitiesStore.house_id_consigner) {
    return false;
  }
  return true;
}
</script>

<template>
  <v-app>
    <router-view />
    <v-overlay
      :model-value="rootStore.state.spiner"
      class="align-center justify-center"
    >
      <v-row class="fill-height align-content-center justify-center">
        <v-col
          class="text-body-large text-center"
          cols="12"
        >
          Cargando Datos, espere un momento por favor...
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
    </v-overlay>
    <v-dialog
      persistent
      width="600"
      v-model="dialogWelcome"
    >
      <v-card>
        <v-card-title> Bienvenido </v-card-title>
        <v-card-text>
          <p style="font-size: 18px">
            Hola querido usuario <br><br>
            Te informamos que, a partir de este momento, cada vez que exista una
            nueva actualización por parte de nuestro proveedor, el sistema
            permanecerá bloqueado hasta que usted lo actualice presionando las
            teclas CTRL + F5. <br>
            <br>
            En el caso de dispositivo movil, tendra que salir del sistema e
            ingresar hasta que ya el mensaje no aparezca. <br><br>
            Cuando el mensaje de la actualización desaparezca, quiere decir que
            el sistema ya se encuentra actualizado. Saludos
          </p>
        </v-card-text>
        <v-card-actions>
          <v-btn
            @click="closeWelcome()"
            color="primary"
          >
            Entendido
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog
      v-if="dialogVersion"
      persistent
      v-model="dialogVersion"
      :width="smAndDown ? '100%' : '25%'"
    >
      <v-card
        class="px-1 py-2 text-center align-center"
        elevation="2"
      >
        <v-icon
          color="success"
          style="font-size: 6em"
        >
          mdi-check-circle-outline
        </v-icon>
        <h2 class="my-2">
          Hemos mejorado ACO para ti
        </h2>
        <div v-if="!cargando">
          Actualiza y Activa las nuevas funciones
          <v-btn
            class="my-2"
            color="success"
            @click="actualizar"
          >
            Actualizar Ahora
          </v-btn>
          <p class="my-2">
            <v-icon>mdi-clock</v-icon> Solo tomará 5 segundos
          </p>
        </div>
        <div v-else>
          <v-progress-circular
            indeterminate
            color="primary"
            size="40"
            class="my-3"
          />
          <p class="my-2">
            Actualizando... Por favor espera
          </p>
        </div>
      </v-card>
    </v-dialog>

    <v-dialog
      v-model="dialogExito"
      max-width="400"
    >
      <v-card class="text-center align-center pa-4">
        <v-icon
          color="success"
          style="font-size: 5em"
        >
          mdi-thumb-up
        </v-icon>
        <h3 class="my-2">
          ¡Gracias!
        </h3>
        <p>¡Ya tienes la última versión de ACO!</p>
        <v-btn
          color="primary"
          class="mt-4"
          @click="dialogExito = false"
        >
          Aceptar
        </v-btn>
      </v-card>
    </v-dialog>

    <v-dialog
      persistent
      width="650"
      v-model="dialogPower"
    >
      <v-card class="rounded-lg elevation-4">
        <!-- Barra superior de advertencia -->
        <v-card-title
          class="text-headline-medium bg-error text-white py-3 px-4 d-flex align-center"
        >
          <v-icon
            start
            size="large"
            class="mr-2"
          >
            mdi-power-plug-off
          </v-icon>
          <span class="font-weight-bold">SISTEMA EN MANTENIMIENTO</span>
        </v-card-title>

        <v-card-text class="pt-4 pb-4">
          <v-container fluid>
            <v-row class="align-center justify-center">
              <!-- Columna del ícono -->
              <v-col
                cols="4"
                class="text-center"
              >
                <v-img
                  class="mx-auto"
                  max-width="110"
                  src="../public/img/svg/power.svg"
                  alt="Sistema Apagado"
                />
              </v-col>

              <!-- Columna del mensaje -->
              <v-col cols="8">
                <div class="text-body-large text-grey-darken-3">
                  <p
                    class="font-weight-bold mb-2"
                    style="font-size: 17px"
                  >
                    Estimado usuario:
                  </p>
                  <p
                    class="mb-3"
                    style="line-height: 1.5"
                  >
                    En este momento el proveedor se encuentra realizando
                    actualizaciones y mantenimientos en el sistema. Por
                    seguridad, el acceso permanecerá
                    <b>suspendido temporalmente</b>.
                  </p>
                  <p
                    class="text-body-small text-grey-darken-1 mb-0 font-italic"
                  >
                    Agradecemos su comprensión y paciencia. Estaremos operando
                    con normalidad en breve.
                  </p>
                </div>
              </v-col>
            </v-row>
          </v-container>
        </v-card-text>
      </v-card>
    </v-dialog>

    <v-dialog
      v-model="rootStore.state.modalEntitie"
      v-if="rootStore.state.modalEntitie"
      width="90%"
    >
      <v-card>
        <v-card-title class="text-headline-medium d-flex align-center flex-wrap">
          Ficha de Clientes <v-spacer />
          <v-btn
            variant="text"
            icon
            color="red"
            @click="rootStore.state.modalEntitie = !rootStore.state.modalEntitie"
          >
            <v-icon>mdi-close</v-icon>
          </v-btn>
        </v-card-title>
        <v-card-text>
          <EditarCliente
            v-if="rootStore.state.house_id_consigner"
            @btn-guardar="guardarClienteFlag = $event"
            :is-pricing="isPricing"
            :house-id-consigner="rootStore.state.house_id_consigner"
          />
          <NuevoCliente
            @btn-guardar="guardarClienteFlag = $event"
            :is-pricing="isPricing"
          />
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn
            v-if="mostrarBtnGuardar()"
            color="success"
            @click="registrarCliente"
            class="px-10"
          >
            Guardar
          </v-btn>
          <v-btn
            v-if="rootStore.state.house_id_consigner"
            color="success"
            @click="modificarCliente"
            class="px-10"
          >
            Guardar
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog
      v-model="rootStore.state.modalvelocidad"
      max-width="1200"
    >
      <v-card>
        <!-- <v-card-title class="text-h5"> Test de velocidad </v-card-title> -->
        <v-card-text>
          <iframe
            width="100%"
            height="650px"
            frameborder="0"
            src="https://pic-cargo.speedtestcustom.com"
          />
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn
            color="green-darken-1"
            variant="text"
            @click="rootStore.state.modalvelocidad = false"
          >
            Cerrar
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog
      v-model="rootStore.state.modalContainers"
      max-width="390"
    >
      <v-card>
        <v-card-title class="text-headline-medium">
          Control de Contenedores
        </v-card-title>
        <v-card-text>
          <v-form ref="formContenedor">
            <v-container>
              <v-row>
                <v-col cols="12">
                  <v-autocomplete
                    :items="rootStore.state.itemsContainers"
                    item-title="name"
                    item-value="id"
                    return-object
                    label="Tipo de contenedor"
                    v-model="rootStore.state.master_id_containers"
                    :rules="[(v) => !!v || 'Dato Requerido']"
                  />
                </v-col>
                <v-col cols="12">
                  <v-text-field
                    v-model="rootStore.state.master_nro_containers"
                    label="Nro. Contenedor"
                  />
                </v-col>
                <v-col cols="12">
                  <v-text-field
                    v-model="rootStore.state.master_nro_precinto"
                    label="Nro. Precinto"
                  />
                </v-col>
                <v-col cols="12">
                  <v-text-field
                    type="number"
                    v-model="rootStore.state.master_cantidad"
                    label="Cant."
                    :rules="[
                      (v) => !!v || 'Dato Requerido',
                      (v) => v >= 0 || 'Debe ser un número positivo',
                    ]"
                  />
                </v-col>
                <v-col>
                  <v-btn
                    @click="
                      _setDataContainers(
                        rootStore.state.master_id_containers.id,
                        rootStore.state.master_id_containers.name,
                        rootStore.state.master_nro_containers,
                        rootStore.state.master_nro_precinto,
                        rootStore.state.master_cantidad,
                      )
                    "
                    block
                    color="primary"
                  >
                    AGREGAR CONTENEDOR
                  </v-btn>
                </v-col>
              </v-row>
            </v-container>
          </v-form>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn
            color="green-darken-1"
            variant="text"
            @click="rootStore.state.modalContainers = false"
          >
            Cerrar
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog
      v-model="rootStore.state.modalPhones"
      max-width="550"
    >
      <v-card>
        <v-card-title class="text-headline-medium">
          Teléfono
        </v-card-title>
        <v-card-text>
          <v-row>
            <v-col cols="4">
              <v-autocomplete
                :items="rootStore.state.itemsPhone"
                item-title="name"
                item-value="id"
                label="Tipo de Teléfono"
                return-object
                v-model="rootStore.state.phone_id"
              />
            </v-col>
            <v-col cols="6">
              <v-text-field
                v-model="rootStore.state.phone_number"
                label="N°. Teléfono"
              />
            </v-col>
            <v-col cols="2">
              <v-btn
                v-if="
                  rootStore.state.phone_id != '' && rootStore.state.phone_number != ''
                "
                class="mx-2"
                icon
                color="teal-darken-1"
                elevation="0"
                @click="rootStore.dispatch('_addPhones', route.params.id)"
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
                    Tipo
                  </th>
                  <th class="text-left">
                    N°. Teléfono
                  </th>
                  <th class="text-left">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="item of rootStore.state.itemsListPhone"
                  :key="item.id"
                >
                  <td>{{ item.name }}</td>
                  <td>
                    {{ item.number }}
                  </td>

                  <td>
                    <v-btn
                      @click="_deletePhones(item.id)"
                      icon
                      size="x-small"
                      elevation="0"
                    >
                      <v-icon color="red">
                        mdi-delete
                      </v-icon>
                    </v-btn>
                    <a
                      v-if="item.id == 2"
                      fab
                      x-small
                      elevation="0"
                      color="green"
                      dark
                      class="ml-5"
                      target="_blank"
                      style="text-decoration: none"
                      :href="`https://wa.me/51${item.number}`"
                    ><v-icon color="green">mdi-whatsapp</v-icon></a>
                    <a
                      fab
                      x-small
                      elevation="0"
                      dark
                      class="ml-5"
                      style="text-decoration: none"
                      :href="`tel:+${item.number}`"
                    ><v-icon color="blue-grey-darken-3">mdi-phone</v-icon></a>
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
            @click="rootStore.state.modalPhones = false"
          >
            Cerrar
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog
      v-model="rootStore.state.modalPhonesEdit"
      max-width="550"
    >
      <v-card>
        <v-card-title class="text-headline-medium">
          Teléfonos
        </v-card-title>
        <v-card-text>
          <v-table density="compact">
            <template #default>
              <thead>
                <tr>
                  <th class="text-left">
                    Tipo
                  </th>
                  <th class="text-left">
                    N°. Teléfono
                  </th>
                  <th class="text-left">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="item of rootStore.state.itemsListPhoneEdit"
                  :key="item.id"
                >
                  <td>{{ item.tipo_phone }}</td>
                  <td>
                    {{ item.phone }}
                  </td>

                  <td>
                    <!--  <v-btn
                      @click="_deletePhones(index)"
                      fab
                      x-small
                      elevation="0"
                      ><v-icon color="red">mdi-delete</v-icon></v-btn
                    > -->
                    <a
                      v-if="item.tipo_phone == 'Celular'"
                      fab
                      x-small
                      elevation="0"
                      color="green"
                      dark
                      class="ml-5"
                      target="_blank"
                      style="text-decoration: none"
                      :href="`https://wa.me/51${item.number}`"
                    ><v-icon color="green">mdi-whatsapp</v-icon></a>
                    <a
                      fab
                      x-small
                      elevation="0"
                      dark
                      class="ml-5"
                      style="text-decoration: none"
                      :href="`tel:+${item.number}`"
                    ><v-icon color="blue-grey-darken-3">mdi-phone</v-icon></a>
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
            @click="rootStore.state.modalPhonesEdit = false"
          >
            Cerrar
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog
      v-model="rootStore.state.modalContacts"
      max-width="750"
    >
      <v-card>
        <v-card-title class="text-headline-medium">
          Contactos
        </v-card-title>
        <v-card-text>
          <v-row>
            <v-col cols="7">
              <v-text-field
                label="Nombre Completo"
                v-model="rootStore.state.contact_name"
              />
            </v-col>

            <v-col cols="3">
              <v-text-field
                v-model="rootStore.state.contact_number"
                label="N°. Teléfono"
              />
            </v-col>
            <v-col cols="2">
              <v-btn
                v-if="
                  rootStore.state.contact_name != '' &&
                    rootStore.state.contact_number != ''
                "
                class="mx-2"
                icon
                color="teal-darken-1"
                elevation="0"
                @click="rootStore.dispatch('_addContacts')"
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
                    Nombre Completo
                  </th>
                  <th class="text-left">
                    N°. Teléfono
                  </th>
                  <th class="text-left">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="(item, i) of rootStore.state.itemsListContact"
                  :key="item.id"
                >
                  <td>{{ item.name }}</td>
                  <td>{{ item.number }}</td>
                  <td>
                    <v-btn
                      @click="_deleteContacts(i)"
                      icon
                      size="x-small"
                      elevation="0"
                    >
                      <v-icon color="red">
                        mdi-delete
                      </v-icon>
                    </v-btn>
                    <a
                      fab
                      x-small
                      elevation="0"
                      color="green"
                      dark
                      class="ml-5"
                      target="_blank"
                      style="text-decoration: none"
                      :href="`https://wa.me/51${item.number}`"
                    ><v-icon color="green">mdi-whatsapp</v-icon></a>
                    <a
                      fab
                      x-small
                      elevation="0"
                      dark
                      class="ml-5"
                      style="text-decoration: none"
                      :href="`tel:+${item.number}`"
                    ><v-icon color="blue-grey-darken-3">mdi-phone</v-icon></a>
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
            @click="rootStore.state.modalContacts = false"
          >
            Cerrar
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog
      v-model="rootStore.state.modalCuentas"
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
                  v-for="item of rootStore.state.itemsDataAccountsNumberList"
                  :key="item.id"
                >
                  <td>{{ item.nameaccount }}</td>
                  <td>{{ item.namebanks }}</td>
                  <td>{{ item.namecoins }}</td>
                  <td>{{ item.accountnumber }}</td>
                  <td>
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
            @click="rootStore.state.modalCuentas = false"
          >
            Cerrar
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog
      v-model="rootStore.state.modalContactsEdit"
      max-width="750"
    >
      <v-card>
        <v-card-title class="text-headline-medium">
          Contactos
        </v-card-title>
        <v-card-text>
          <v-row>
            <v-col cols="7">
              <v-text-field
                label="Nombre Completo"
                v-model="rootStore.state.contact_name"
              />
            </v-col>

            <v-col cols="5">
              <v-text-field
                v-model="rootStore.state.contact_number"
                label="N°. Teléfono"
              />
            </v-col>
            <!-- <v-col cols="2">
              <v-btn
                v-if="
                  $store.state.contact_name != '' &&
                  $store.state.contact_number != ''
                "
                class="mx-2"
                fab
                color="teal darken-1
"
                dark
                elevation="0"
                @click="_addContacts()"
                ><v-icon x-large>mdi-plus</v-icon></v-btn
              >
            </v-col> -->
          </v-row>
          <v-table density="compact">
            <template #default>
              <thead>
                <tr>
                  <th class="text-left">
                    Nombre Completo
                  </th>
                  <th class="text-left">
                    N°. Teléfono
                  </th>
                  <th class="text-left">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="item of rootStore.state.itemsListContactEdit"
                  :key="item.id"
                >
                  <td>{{ item.name }}</td>
                  <td>{{ item.number }}</td>
                  <td>
                    <!-- <v-btn @click="_deleteContacts(i)" fab x-small elevation="0"
                      ><v-icon color="red">mdi-delete</v-icon></v-btn
                    > -->
                    <a
                      fab
                      x-small
                      elevation="0"
                      color="green"
                      dark
                      class="ml-5"
                      target="_blank"
                      style="text-decoration: none"
                      :href="`https://wa.me/51${item.number}`"
                    ><v-icon color="green">mdi-whatsapp</v-icon></a>
                    <a
                      fab
                      x-small
                      elevation="0"
                      dark
                      class="ml-5"
                      style="text-decoration: none"
                      :href="`tel:+${item.number}`"
                    ><v-icon color="blue-grey-darken-3">mdi-phone</v-icon></a>
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
            @click="rootStore.state.modalContactsEdit = false"
          >
            Cerrar
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog
      v-model="rootStore.state.modalServices"
      max-width="400"
    >
      <v-card>
        <v-card-title class="text-headline-medium d-flex align-center flex-wrap">
          Control de Servicios <v-spacer />
          <v-btn
            variant="text"
            icon
            color="red"
            @click="rootStore.state.modalServices = !rootStore.state.modalServices"
          >
            <v-icon>mdi-close</v-icon>
          </v-btn>
        </v-card-title>
        <v-card-text>
          <ControlServices />
        </v-card-text>
      </v-card>
    </v-dialog>

    <audio
      v-if="newquote"
      src="../public/sound/Messenger Tono de Mensaje - Sonido.mp3"
      autoplay
      loop
      controls
    />
  </v-app>
</template>

<style lang="scss">
@import url("https://fonts.googleapis.com/css2?family=Roboto:ital,wght@0,100;0,300;0,400;0,500;0,700;0,900;1,100;1,300;1,400;1,500;1,700;1,900&display=swap");
* {
  font-family: "Roboto", sans-serif;
}

.v-application__wrap {
  min-height: 85vh !important;
}
.title {
  font-size: 2rem;
}
.ocultar {
  display: none !important;
}
</style>
<style>
/* Oculta en móviles (menos de 992px) */
@media screen and (max-width: 1024px) and (orientation: portrait) {
  .ocultarMovil {
    display: none !important;
  }

  .wrap-text-btn {
    white-space: normal !important;
    text-align: center;
    line-height: 1.3;
    word-break: break-word;
    display: inline-flex !important;
    flex-wrap: wrap !important;
    justify-content: center;
    align-items: center;
  }
}

.contenedor-scroll {
  height: 100vh;

  overflow-y: auto;
}
</style>
