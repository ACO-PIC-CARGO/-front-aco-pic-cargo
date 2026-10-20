<script setup lang="ts">
import { onMounted, ref, useTemplateRef } from "vue";
import { useRoute } from "vue-router";
import { useAppStore } from "@/stores/app";
import Swal from "sweetalert2";
import { usePositionStore } from "@/stores/position";
import { useSecuritysStore } from "@/stores/securitys";
import { useUserStore } from "@/stores/user";
import type { PosicionListado } from "@/types/seguridad";
import type { SucursalSesion } from "@/types/sesion";

const route = useRoute();
const appStore = useAppStore();
const userStore = useUserStore();
const positionStore = usePositionStore();
const securitysStore = useSecuritysStore();

const tab = ref("datos");
const headersPosition = [
  { title: "Código", key: "code" },
  { title: "Posición", key: "name" },
  // { text: "Acción", value: "action" },
] as const;

const headersSucursal = [
  { title: "Documento", key: "document" },
  { title: "Nombre", key: "trade_name" },
  // { text: "Acción", value: "action" },
] as const;

const itemPositon = ref<PosicionListado | "">("");
const errPosition = ref("");
const errUsers = ref("");
const errEmail = ref("");
const itemSucursal = ref<SucursalSesion | "">("");
const errSucursal = ref("");
const loadingEstado = ref(false);
const loadingCity = ref(false);
const loadingDistrito = ref(false);
const snackbar = ref(false);
const frmDatos = useTemplateRef("frmDatos");
// Not bound to the template, as in the old code.
const frmPosicion = ref<{ validate: () => Promise<{ valid: boolean }> } | null>(null);
const frmSucursal = ref<{ validate: () => Promise<{ valid: boolean }> } | null>(null);

onMounted(async () => {
  userStore.model.id = route.params.id as string;
  await userStore.GetVerUsers();
  appStore.spiner = true;
  await appStore._getDocumentsPais();
  await appStore._getPais();
  await appStore._getSex();
  await positionStore.cargarPosition();
  await securitysStore.CargarBranch();
  await appStore._getState(userStore.model.id_pais);
  await appStore._getCity(userStore.model.id_state);
  await appStore._getTown(userStore.model.id_city);
  appStore.spiner = false;
});

// 10705871171

// eslint-disable-next-line @typescript-eslint/no-unused-vars
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

// eslint-disable-next-line @typescript-eslint/no-unused-vars
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

// eslint-disable-next-line @typescript-eslint/no-unused-vars
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


// eslint-disable-next-line @typescript-eslint/no-unused-vars
async function agregarSucursal() {
  errSucursal.value = "";
  if ((await frmSucursal.value!.validate()).valid) {
    if (userStore.sucursales.some((v) => v.id == (itemSucursal.value as SucursalSesion).id)) {
      errSucursal.value = "La sucursal ya se encuentra asignada.";
    } else {
      userStore.sucursales.push(itemSucursal.value as SucursalSesion);
    }
  }
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
async function agregarPosicion() {
  errPosition.value = "";
  if ((await frmPosicion.value!.validate()).valid) {
    if (userStore.positions.some((v) => v.id == (itemPositon.value as PosicionListado).id)) {
      errPosition.value = "La posición ya se encuentra asignada.";
    } else {
      userStore.positions.push(itemPositon.value as PosicionListado);
    }
  }
}


async function ObtenerEstados(id_pais: number | string | undefined) {
  loadingEstado.value = true;
  await appStore._getState(id_pais);

  loadingEstado.value = false;
}

async function ObtenerCity(id_state: number | string | undefined) {
  loadingCity.value = true;
  await appStore._getCity(id_state);
  loadingCity.value = false;
}

async function ObtenerDistrito(id_city: number | string | undefined) {
  loadingDistrito.value = true;
  await appStore._getTown(id_city);
  loadingDistrito.value = false;
}


// eslint-disable-next-line @typescript-eslint/no-unused-vars
async function guardarUsuario() {
  console.log(appStore.itemsDocumentsPais);
  if ((await frmDatos.value!.validate()).valid) {
    if (userStore.positions.filter((v) => !!v.status).length == 0) {
      errPosition.value = "Es necesario asignar al menos una Position, al usuario";
      tab.value = "posicion";
      return false;
    }
    if (userStore.sucursales.filter((v) => !!v.status).length == 0) {
      errSucursal.value = "Es necesario asignar al menos una Sucursal, al usuario";
      tab.value = "sucursal";
      return false;
    }
    // await this.setUsers();
  } else {
    tab.value = "datos";
  }
}
</script>

<template>
  <v-card class="cardDatos pa-4">
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
        Datos del Usuario
      </v-tab>

      <v-tab
        base-color="rgba(255, 255, 255, 0.6)"
        value="posicion"
      >
        Módulos a Usar
      </v-tab>

      <!-- <v-tab base-color="rgba(255, 255, 255, 0.6)" value="sucursal"> Sucursal </v-tab> -->
    </v-tabs>
    <v-tabs-window v-model="tab">
      <v-tabs-window-item
        value="datos"
        class="px-5 items"
      >
        <v-form ref="frmDatos">
          <v-row>
            <v-col cols="4">
              <v-text-field
                label="Nombre Usuario"
                id="users"
                v-model="userStore.model.users"
                :error-messages="errUsers"
                readonly
              />
            </v-col>
          </v-row>
          <v-row class="align-sm-center">
            <v-col cols="4">
              <v-autocomplete
                :items="appStore.itemsDocumentsPais"
                item-title="description"
                item-value="id"
                label="Tipo de Documento"
                v-model="userStore.model.id_document"
                readonly
              />
            </v-col>
            <v-col cols="4">
              <v-text-field
                label="Documento"
                v-model="userStore.model.document"
                readonly
              />
            </v-col>
          </v-row>
          <v-row>
            <v-col cols="4">
              <v-text-field
                v-model="userStore.model.names"
                label="Nombres"
                readonly
              />
            </v-col>
            <v-col cols="4">
              <v-text-field
                v-model="userStore.model.surname"
                label="Apellido Paterno"
                readonly
              />
            </v-col>
            <v-col cols="4">
              <v-text-field
                v-model="userStore.model.second_surname"
                label="Apellido Materno"
                readonly
              />
            </v-col>
            <v-col cols="4">
              <v-text-field
                label="Teléfono"
                v-model="userStore.model.phone"
                readonly
              />
            </v-col>
            <v-col cols="4">
              <v-text-field
                label="Correo"
                v-model="userStore.model.email"
                readonly
              />
            </v-col>
            <v-col cols="4">
              <v-text-field
                type="date"
                label="Fecha Nacimiento"
                v-model="userStore.model.birthday"
                readonly
              />
            </v-col>
          </v-row>
          <v-row>
            <v-col cols="4">
              <v-autocomplete
                :items="appStore.itemsSex"
                item-title="name"
                item-value="id"
                label="Sexo *"
                :item-props="(item) => ({ disabled: item.status != 1 })"
                v-model="userStore.model.id_sex"
                readonly
              />
            </v-col>
            <v-col cols="4">
              <!-- @vue-expect-error the root state items are untyped until the Vuex store is typed -->
              <v-autocomplete
                label="Pais"
                :items="appStore.itemsPais"
                v-model="userStore.model.id_pais"
                item-title="name"
                item-value="id"
                @update:model-value="ObtenerEstados(userStore.model.id_pais)"
                readonly
                :item-props="(item) => ({ disabled: item.status != 1 })"
              />
            </v-col>
            <v-col
              cols="4"
              v-if="userStore.model.id_pais"
            >
              <v-autocomplete
                label="Estado (Región)"
                :items="appStore.itemsState"
                v-model="userStore.model.id_state"
                item-title="name"
                item-value="id"
                :loading="loadingEstado"
                @update:model-value="ObtenerCity(userStore.model.id_state)"
                readonly
                :item-props="(item) => ({ disabled: item.status != 1 })"
              />
            </v-col>
            <v-col
              cols="4"
              v-if="userStore.model.id_state"
            >
              <v-autocomplete
                label="Ciudad"
                :items="appStore.itemsCity"
                v-model="userStore.model.id_city"
                item-title="name"
                item-value="id"
                :loading="loadingEstado"
                @update:model-value="ObtenerDistrito(userStore.model.id_city)"
                readonly
                :item-props="(item) => ({ disabled: item.status != 1 })"
              />
            </v-col>
            <v-col
              cols="4"
              v-if="userStore.model.id_city"
            >
              <v-autocomplete
                label="Distrito "
                :items="appStore.itemsTown"
                v-model="userStore.model.id_town"
                item-title="name"
                item-value="id"
                :loading="loadingDistrito"
                :item-props="(item) => ({ disabled: item.status != 1 })"
                readonly
              />
            </v-col>
            <v-col cols="4">
              <v-text-field
                v-model="userStore.model.address"
                label="Dirección"
                readonly
              />
            </v-col>
            <!-- <v-col cols="4">
              <v-text-field
                v-model="$store.state.user.model.socialprincipal"
                readonly
                label="URL Red Social Principal"
              ></v-text-field>
            </v-col>
            <v-col cols="4">
              <v-text-field
                v-model="$store.state.user.model.socialsecundary"
                readonly
                label="URL Red Social Alternativa"
              ></v-text-field>
            </v-col> -->
            <!-- <v-col cols="6">
              Departamento
              <v-icon small @click="snackbar = true" class="iconDepartamento"
                >mdi-information-slab-circle-outline</v-icon
              >
              <v-radio-group
                v-model="$store.state.user.model.departamento"
                readonly
              >
                <v-radio label="Operativo" :value="1"></v-radio>
                <v-radio label="Administrativo" :value="2"></v-radio>
              </v-radio-group>
            </v-col> -->
            <v-col
              cols="12"
              class="d-flex align-center"
            >
              <span class="mr-4">Activo/ Inactivo</span>
              <v-switch
                hide-details
                :label="
                  userStore.model.status == 1 ? 'Activo' : 'Inactivo'
                "
                v-model="userStore.model.status"
                :value-comparator="(value, checked) => Boolean(value) === checked"
              />
            </v-col>
          </v-row>
        </v-form>
      </v-tabs-window-item>
      <v-tabs-window-item
        value="posicion"
        class="px-5 items"
      >
        <!-- <v-form ref="frmPosicion">
          <v-row>
            <v-col cols="4" class="my-auto">
              <v-autocomplete
                :items="$store.state.position.lstPosition"
                item-text="name"
                item-value="id"
                v-model="itemPositon"
                return-object
                label="Posición"
                placeholder="Posición"
                
                :error-messages="errPosition"
                :item-props="(item) => ({ disabled: !item.estado })"
              />
            </v-col>
            <v-col cols="4" class="my-auto">
              <v-btn @click="agregarPosicion()" small color="success"
                >Agregar</v-btn
              >
            </v-col>
          </v-row>
        </v-form> -->
        <v-row>
          <v-col cols="12">
            <v-data-table
              :headers="headersPosition"
              :items="userStore.positions.filter((v) => !!v.status)"
              item-value="id"
            >
              <template #[`item.action`]="{ item }">
                <v-btn
                  variant="text"
                  icon
                  color="red"
                  @click="item.status = !item.status"
                >
                  <v-icon>mdi-delete</v-icon>
                </v-btn>
              </template>
            </v-data-table>
          </v-col>
          <v-col cols="12">
            <v-col cols="12">
              <p class="py-2">
                Departamento
              </p>

              <v-radio-group
                :rules="[(v) => !!v || 'Dato Requerido']"
                v-model="userStore.model.departamento"
              >
                <v-radio
                  label="Pricing"
                  :value="1"
                />
                <v-radio
                  label="Operativo"
                  :value="2"
                />
              </v-radio-group>
            </v-col>
            <v-col cols="12">
              <p class="justify">
                ** Nota Importante **
              </p>
            </v-col>
            <v-col cols="12">
              <p class="justify">
                Está acción permitirá al usuario ajustar los montos dentro de
                la liquidación de costos operativos (Control de Gastos). Es
                necesario porque, aunque inicialmente se cotizan ciertos
                valores, pueden surgir pequeños ajustes durante la operación
                que requieren modificación
              </p>
            </v-col>
          </v-col>
        </v-row>
      </v-tabs-window-item>
      <v-tabs-window-item
        value="sucursal"
        class="px-5 py-5 items"
      >
        <!-- <v-form ref="frmSucursal">
          <v-row>
            <v-col cols="4" class="my-auto">
              <v-autocomplete
                :items="$store.state.securitys.lstSucursal"
                v-model="itemSucursal"
                item-text="trade_name"
                item-value="id"
                dense
                placeholder="Sucursal"
                label="Sucursal"
                
                return-object
                :error-messages="errSucursal"
                :item-props="(item) => ({ disabled: !item.status })"
              ></v-autocomplete>
            </v-col>
            <v-col cols="4" class="my-auto">
              <v-btn @click="agregarSucursal()" small color="success"
                >Agregar</v-btn
              >
            </v-col>
          </v-row>
        </v-form> -->
        <v-row>
          <v-col cols="12">
            <v-data-table
              :headers="headersSucursal"
              :items="userStore.sucursales.filter((v) => !!v.status)"
              item-value="id"
            >
              <template #[`item.action`]="{ item }">
                <v-btn
                  variant="text"
                  icon
                  color="red"
                  @click="item.status = !item.status"
                >
                  <v-icon>mdi-delete</v-icon>
                </v-btn>
              </template>
            </v-data-table>
          </v-col>
        </v-row>
      </v-tabs-window-item>
    </v-tabs-window>

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
  </v-card>
</template>

<style scoped>
.cardDatos {
  width: 100%;
  max-width: 100%;
}
.items {
  min-height: 60vh !important;
}
.iconDepartamento {
  cursor: pointer;
}
@media (max-width: 1000px) {
  .cardDatos {
    width: 100% !important;
  }
  .items {
    min-height: auto !important;
  }
}
</style>
