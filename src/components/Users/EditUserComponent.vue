<script setup lang="ts">
import { onMounted, ref, useTemplateRef } from "vue";
import { useRoute } from "vue-router";
import { useStore } from "vuex";
import Swal from "sweetalert2";
import { usePositionStore } from "@/stores/position";
import { useSecuritysStore } from "@/stores/securitys";
import { useUserStore } from "@/stores/user";
import type { PosicionListado } from "@/types/seguridad";
import type { SucursalSesion } from "@/types/sesion";

const route = useRoute();
const rootStore = useStore();
const userStore = useUserStore();
const positionStore = usePositionStore();
const securitysStore = useSecuritysStore();

const tab = ref("datos");
const headersPosition = [
  { title: "Código", key: "code" },
  { title: "Posición", key: "name" },
  { title: "Acción", key: "action" },
] as const;

const headersSucursal = [
  { title: "Documento", key: "document" },
  { title: "Nombre", key: "trade_name" },
  { title: "Acción", key: "action" },
] as const;
const errorClave = ref("");
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
const mostrarposicionesflag = ref(true);
const mostrarsucursal = ref(true);
const mostrarflag = ref(false);
const espassword = ref(true);
const frmDatos = useTemplateRef("frmDatos");
const frmPosicion = useTemplateRef("frmPosicion");
const frmSucursal = useTemplateRef("frmSucursal");

onMounted(async () => {
  userStore.model.id = route.params.id as string;
  rootStore.state.spiner = true;
  await userStore.GetVerUsers();
  await rootStore.dispatch("_getDocumentsPais");
  await rootStore.dispatch("_getPais");
  await rootStore.dispatch("_getSex");
  await positionStore.cargarPosition();
  await securitysStore.CargarBranch();
  await rootStore.dispatch("_getState", userStore.model.id_pais);
  await rootStore.dispatch("_getCity", userStore.model.id_state);
  await rootStore.dispatch("_getTown", userStore.model.id_city);
  rootStore.state.spiner = false;
  mostrarflag.value = true;
});

// 10705871171

// eslint-disable-next-line @typescript-eslint/no-unused-vars
async function validarUser() {
  errUsers.value = "";
  rootStore.state.spiner = true;
  const res = (await userStore.validateUserUsuario())!;
  if (res.estadoflag == true) {
    errUsers.value = res.mensaje;
    userStore.model.users = "";
  }
  rootStore.state.spiner = false;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
async function validarEmail() {
  errEmail.value = "";
  rootStore.state.spiner = true;
  const res = (await userStore.validateEmailUsuario())!;
  if (res.estadoflag == true) {
    errEmail.value = res.mensaje;
    userStore.model.email = "";
  }
  rootStore.state.spiner = false;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
async function validarDocument() {
  // this.errUsers = "";
  if (!!userStore.model.id_document && !!userStore.model.document) {
    rootStore.state.spiner = true;
    const res = (await userStore.validateDocumentUsuario())!;
    rootStore.state.spiner = false;

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
          rootStore.state.spiner = true;
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
          await rootStore.dispatch("_getState", res.data[0]!.id_pais);
          await rootStore.dispatch("_getCity", res.data[0]!.id_state);
          await rootStore.dispatch("_getTown", res.data[0]!.id_city);
          rootStore.state.spiner = false;
        }
        if (respuesta.isDismissed) {
          userStore.model.document = "";
        }
      });
    }
    rootStore.state.spiner = false;
  }
  // if (res.estadoflag == true) {
  //   this.errUsers = res.mensaje;
  //   this.$store.state.user.model.users = "";
  // }
}

async function agregarSucursal() {
  errSucursal.value = "";
  if ((await frmSucursal.value!.validate()).valid) {
    const selected = itemSucursal.value as SucursalSesion;
    if (userStore.sucursales.some((v) => v.id_branch == selected.id)) {
      if (userStore.sucursales.some((v) => v.id_branch == selected.id && !v.status)) {
        userStore.sucursales.filter((v) => v.id_branch == selected.id && !v.status)[0]!.status = true;
      } else {
        errSucursal.value = "La sucursal ya se encuentra asignada.";
      }
    } else {
      userStore.sucursales.push(selected);
    }
    mostrarsucursal.value = false;
    mostrarsucursal.value = true;
  }
}
async function agregarPosicion() {
  errPosition.value = "";

  if ((await frmPosicion.value!.validate()).valid) {
    const selected = itemPositon.value as PosicionListado;
    if (userStore.positions.some((v) => v.id_position == selected.id)) {
      if (userStore.positions.some((v) => v.id_position == selected.id && !v.status)) {
        userStore.positions.filter((v) => v.id_position == selected.id)[0]!.status = true;
      } else {
        errPosition.value = "La posición ya se encuentra asignada.";
      }
    } else {
      selected.id_position = selected.id;
      selected.status = selected.estado;
      userStore.positions.push(selected);
    }
  }
  mostrarposicionesflag.value = false;
  mostrarposicionesflag.value = true;
}

async function ObtenerEstados(id_pais: number | string | undefined) {
  loadingEstado.value = true;
  await rootStore.dispatch("_getState", id_pais);

  loadingEstado.value = false;
}
async function ObtenerCity(id_state: number | string | undefined) {
  loadingCity.value = true;
  await rootStore.dispatch("_getCity", id_state);
  loadingCity.value = false;
}
async function ObtenerDistrito(id_city: number | string | undefined) {
  loadingDistrito.value = true;
  await rootStore.dispatch("_getTown", id_city);
  loadingDistrito.value = false;
}

function eliminarPosition(index: number) {
  userStore.positions[index]!.status = false;
  mostrarposicionesflag.value = false;
  mostrarposicionesflag.value = true;
}
function eliminarbranch(index: number) {
  // @ts-expect-error Kept: the user store has never had lstSucursal, so this call has always thrown.
  userStore.lstSucursal[index].status = false;
  mostrarsucursal.value = false;
  mostrarsucursal.value = true;
}

async function guardarUsuario() {
  console.log(rootStore.state.itemsDocumentsPais);
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

    if (userStore.model.clave != userStore.model.confirmclave) {
      errorClave.value = "Las claves no coinciden";
      return false;
    }
    await userStore.ActualizarUsers();
  } else {
    tab.value = "datos";
  }
}
</script>

<template>
  <v-card
    class="cardDatos pa-4"
    v-if="mostrarflag"
  >
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
    <v-card-actions class="justify-end px-5 pt-4 pb-0">
      <v-btn
        @click="guardarUsuario()"
        color="success"
        size="small"
      >
        Guardar
      </v-btn>
    </v-card-actions>
    <v-tabs-window v-model="tab">
      <v-tabs-window-item
        value="datos"
        class="px-5 items"
      >
        <v-form ref="frmDatos">
          <v-row>
            <!-- <v-col cols="4">
              <v-text-field
                label="Nombre Usuario (*)"
                id="users"
                v-model="$store.state.user.model.users"
                :error-messages="errUsers"
                readonly
              ></v-text-field>
            </v-col> -->
          </v-row>
          <v-row class="align-sm-center">
            <v-col cols="4">
              <v-autocomplete
                :items="rootStore.state.itemsDocumentsPais"
                item-title="description"
                item-value="id"
                label="Tipo de Documento (*)"
                v-model="userStore.model.id_document"
                :rules="[(v) => !!v || 'Dato Requerido']"
              />
            </v-col>
            <v-col cols="4">
              <v-text-field
                label="Documento (*)"
                v-model="userStore.model.document"
              />
            </v-col>
          </v-row>
          <v-row>
            <v-col cols="4">
              <v-text-field
                v-model="userStore.model.names"
                label="Nombres (*)"
                readonly
              />
            </v-col>
            <v-col cols="4">
              <v-text-field
                v-model="userStore.model.surname"
                label="Apellido Paternos (*)"
                readonly
              />
            </v-col>
            <v-col cols="4">
              <v-text-field
                v-model="userStore.model.second_surname"
                label="Apellido Maternos (*)"
                readonly
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
                disabled
              />
            </v-col>
            <v-col cols="4">
              <v-text-field
                type="date"
                label="Fecha Nacimiento"
                v-model="userStore.model.birthday"
              />
            </v-col>
          </v-row>
          <v-row>
            <v-col cols="4">
              <!-- @vue-expect-error the root state items are untyped until the Vuex store is typed -->
              <v-autocomplete
                :items="rootStore.state.itemsSex"
                item-title="name"
                item-value="id"
                label="Sexo (*)"
                :rules="[(v) => !!v || 'Dato Requerido']"
                :item-props="(item) => ({ disabled: item.status != 1 })"
                v-model="userStore.model.id_sex"
              />
            </v-col>
            <v-col cols="4">
              <!-- @vue-expect-error the root state items are untyped until the Vuex store is typed -->
              <v-autocomplete
                label="Pais (*)"
                :items="rootStore.state.itemsPais"
                v-model="userStore.model.id_pais"
                item-title="name"
                item-value="id"
                @update:model-value="ObtenerEstados(userStore.model.id_pais)"
                :item-props="(item) => ({ disabled: item.status != 1 })"
                :rules="[(v) => !!v || 'Dato Requerido']"
              />
            </v-col>
            <v-col
              cols="4"
              v-if="userStore.model.id_pais"
            >
              <!-- @vue-expect-error the root state items are untyped until the Vuex store is typed -->
              <v-autocomplete
                label="Estado (Región) (*)"
                :items="rootStore.state.itemsState"
                v-model="userStore.model.id_state"
                item-title="name"
                item-value="id"
                :loading="loadingEstado"
                @update:model-value="ObtenerCity(userStore.model.id_state)"
                :item-props="(item) => ({ disabled: item.status != 1 })"
              />
            </v-col>
            <v-col
              cols="4"
              v-if="userStore.model.id_state"
            >
              <!-- @vue-expect-error the root state items are untyped until the Vuex store is typed -->
              <v-autocomplete
                label="Ciudad (*)"
                :items="rootStore.state.itemsCity"
                v-model="userStore.model.id_city"
                item-title="name"
                item-value="id"
                :loading="loadingEstado"
                @update:model-value="ObtenerDistrito(userStore.model.id_city)"
                :item-props="(item) => ({ disabled: item.status != 1 })"
              />
            </v-col>
            <v-col
              cols="4"
              v-if="userStore.model.id_city"
            >
              <!-- @vue-expect-error the root state items are untyped until the Vuex store is typed -->
              <v-autocomplete
                label="Distritos (*)"
                :items="rootStore.state.itemsTown"
                v-model="userStore.model.id_town"
                item-title="name"
                item-value="id"
                :loading="loadingDistrito"
                :item-props="(item) => ({ disabled: item.status != 1 })"
              />
            </v-col>
            <v-col cols="4">
              <v-text-field
                v-model="userStore.model.address"
                label="Dirección (*)"
              />
            </v-col>

            <v-col cols="4">
              <v-checkbox
                label="Cambiar clave"
                v-model="userStore.model.cambiarClave"
              />
            </v-col>
            <v-col
              cols="4"
              v-if="userStore.model.cambiarClave"
            >
              <v-text-field
                :type="espassword ? 'password' : 'text '"
                v-model="userStore.model.clave"
                :append-inner-icon="!espassword ? 'mdi-eye' : 'mdi-eye-off'"
                @click:append-inner="espassword = !espassword"
                :rules="[(v) => !!v || 'Dato Requerido']"
                :error-messages="errorClave"
              />
            </v-col>
            <v-col
              cols="4"
              v-if="userStore.model.cambiarClave"
            >
              <v-text-field
                :type="espassword ? 'password' : 'text '"
                :append-inner-icon="!espassword ? 'mdi-eye' : 'mdi-eye-off'"
                v-model="userStore.model.confirmclave"
                @click:append-inner="espassword = !espassword"
                :rules="[(v) => !!v || 'Dato Requerido']"
                :error-messages="errorClave"
              />
            </v-col>

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
        <v-form ref="frmPosicion">
          <v-row>
            <v-col
              cols="4"
              class="my-auto"
            >
              <!-- @vue-expect-error the empty string start value is kept from the old data() -->
              <v-autocomplete
                :items="positionStore.lstPosition"
                item-title="name"
                item-value="id"
                v-model="itemPositon"
                return-object
                label="Posición"
                placeholder="Posición"
                :rules="[(v) => !!v || 'Dato Requerido']"
                :error-messages="errPosition"
                :item-props="(item) => ({ disabled: !item.estado })"
              />
            </v-col>
            <v-col
              cols="4"
              class="my-auto"
            >
              <v-btn
                @click="agregarPosicion()"
                size="small"
                color="success"
              >
                Agregar
              </v-btn>
            </v-col>
          </v-row>
        </v-form>
        <v-row>
          <v-col
            cols="12"
            v-if="mostrarposicionesflag"
          >
            <v-data-table
              :headers="headersPosition"
              :items="userStore.positions.filter((v) => !!v.status)"
              item-value="id"
            >
              <template #[`item.action`]="{ index }">
                <v-btn
                  variant="text"
                  icon
                  color="red"
                  @click="eliminarPosition(index)"
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
        <v-form ref="frmSucursal">
          <v-row>
            <v-col
              cols="4"
              class="my-auto"
            >
              <!-- @vue-expect-error the empty string start value is kept from the old data() -->
              <v-autocomplete
                :items="securitysStore.lstSucursal"
                v-model="itemSucursal"
                item-title="trade_name"
                item-value="id"
                density="compact"
                placeholder="Sucursal"
                label="Sucursal"
                :rules="[(v) => !!v || 'Dato Requerido']"
                return-object
                :error-messages="errSucursal"
                :item-props="(item) => ({ disabled: !item.status })"
              />
            </v-col>
            <v-col
              cols="4"
              class="my-auto"
            >
              <v-btn
                @click="agregarSucursal()"
                size="small"
                color="success"
              >
                Agregar
              </v-btn>
            </v-col>
          </v-row>
        </v-form>
        <v-row>
          <v-col
            cols="12"
            v-if="mostrarsucursal"
          >
            <v-data-table
              :headers="headersSucursal"
              :items="userStore.sucursales.filter((v) => !!v.status)"
              item-value="id"
            >
              <template #[`item.action`]="{ index }">
                <v-btn
                  variant="text"
                  icon
                  color="red"
                  @click="eliminarbranch(index)"
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
