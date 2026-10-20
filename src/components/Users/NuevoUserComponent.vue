<script setup lang="ts">
import { onMounted, ref, useTemplateRef } from "vue";
import { useAppStore } from "@/stores/app";
import Swal from "sweetalert2";
import { usePositionStore } from "@/stores/position";
import { useSecuritysStore } from "@/stores/securitys";
import { useUserStore } from "@/stores/user";
import type { PosicionListado } from "@/types/seguridad";
import type { SucursalSesion } from "@/types/sesion";

const appStore = useAppStore();
const userStore = useUserStore();
const positionStore = usePositionStore();
const securitysStore = useSecuritysStore();

const verClave = ref(false);
const confirverClave = ref(false);
const mostrarflag = ref(false);
const tab = ref("datos");
const headersPosition = [
  { title: "Código", key: "code" },
  { title: "Módulo", key: "name" },
  { title: "Acción", key: "action" },
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
const frmPosicion = useTemplateRef("frmPosicion");
// Not bound to the template.
const frmSucursal = ref<{ validate: () => Promise<{ valid: boolean }> } | null>(null);

onMounted(async () => {
  appStore.spiner = true;
  await Promise.all([
    appStore._getDocumentsPais(),
    appStore._getPais(),
    appStore._getSex(),
    positionStore.cargarPosition(),
    securitysStore.CargarBranch(),
  ]);
  mostrarflag.value = true;
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
  userStore.sucursales = [];
  userStore.positions = [];
  appStore.spiner = false;
  frmDatos.value!.resetValidation();
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

function eliminarPosicion(index: number) {
  userStore.positions.splice(index, 1);
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function eliminarSucursal(index: number) {
  userStore.sucursales.splice(index, 1);
}
async function continuar(): Promise<boolean | undefined> {
  if (userStore.model.clave && userStore.model.confirmclave && userStore.model.clave != userStore.model.confirmclave) {
    Swal.fire({
      icon: "error",
      title: "Error",
      text: "Las claves no coinciden",
    });
    return false;
  }
  if ((await frmDatos.value!.validate()).valid) {
    if (userStore.positions.length == 0) {
      errPosition.value = "Es necesario asignar al menos una Position, al usuario";
      tab.value = "posicion";
      return false;
    }
    if (userStore.sucursales.length == 0) {
      errSucursal.value = "Es necesario asignar al menos una Sucursal, al usuario";
      tab.value = "sucursal";
      return false;
    }
    if (tab.value == "datos") {
      tab.value = "posicion";
      return true;
    }
    if (tab.value == "posicion") {
      tab.value = "sucursal";
      return true;
    }
  } else {
    tab.value = "datos";
  }
}
async function guardarUsuario() {
  if ((await frmDatos.value!.validate()).valid) {
    if (userStore.positions.length == 0) {
      errPosition.value = "Es necesario asignar al menos una Position, al usuario";
      tab.value = "posicion";
      return false;
    }
    // if (this.$store.state.user.sucursales.length == 0) {
    //   this.errSucursal =
    //     "Es necesario asignar al menos una Sucursal, al usuario";
    //   this.tab = "sucursal";
    //   return false;
    // }
    appStore.spiner = true;
    await userStore.setUsers();
    appStore.spiner = false;
  } else {
    tab.value = "datos";
  }
}


// eslint-disable-next-line @typescript-eslint/no-unused-vars
const vNoSpaces = (el: HTMLElement) => {
  el.addEventListener("input", (event) => {
    const target = event.target as HTMLInputElement;
    const value = target.value;
    const hasSpaces = /\s/.test(value);
    if (hasSpaces) {
      target.value = value.slice(0, -1); // Elimina el último carácter (el espacio)
    }
  });
};
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
    <v-card-actions class="justify-end px-5 pt-4 pb-0">
      <v-btn
        v-if="tab == 'posicion'"
        @click="guardarUsuario()"
        color="success"
        size="small"
      >
        Guardar
      </v-btn>
      <v-btn
        v-else
        @click="continuar()"
        color="success"
        variant="outlined"
        size="small"
      >
        Siguiente
      </v-btn>
    </v-card-actions>
    <v-tabs-window v-model="tab">
      <v-tabs-window-item
        value="datos"
        class="px-5 items"
      >
        <v-form ref="frmDatos">
          <!-- <v-row>
            <v-col cols="4">
              <v-text-field
                label="Alias del Usuario (*)"
                id="users"
                v-model="$store.state.user.model.users"
                v-on:blur="validarUser()"
                :error-messages="errUsers"
                v-no-spaces
                :rules="[
                  (v) => !!v || 'Dato Requerido',
                  (v) =>
                    (!!v && v.length <= 255) ||
                    'El USUARIO no puede exceder los 255 caracteres.',
                ]"
              ></v-text-field>
            </v-col>
          </v-row> -->
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
                :rules="[
                  (v) => !!v || 'Dato Requerido',
                  (v) => /^[0-9]+$/.test(v) || 'Ingrese solo números',
                ]"
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
                label="Fecha Nacimiento"
                v-model="userStore.model.birthday"
              />
            </v-col>
            <v-col cols="4">
              <v-text-field
                :type="verClave == false ? 'password' : 'text'"
                label="Clave*"
                v-model="userStore.model.clave"
                :append-inner-icon="!verClave ? 'mdi-eye' : 'mdi-eye-off'"
                @click:append-inner="verClave = !verClave"
              />
            </v-col>
            <v-col cols="4">
              <v-text-field
                :type="confirverClave == false ? 'password' : 'text'"
                label="Confirmar Clave*"
                v-model="userStore.model.confirmclave"
                :append-inner-icon="!confirverClave ? 'mdi-eye' : 'mdi-eye-off'"
                @click:append-inner="confirverClave = !confirverClave"
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
            <v-col cols="4">
              <!-- @vue-expect-error the Pais type does not declare status -->
              <v-autocomplete
                label="Pais (*)"
                :items="appStore.itemsPais"
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
              <v-autocomplete
                label="Estado (Región)"
                :items="appStore.itemsState"
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
              <v-autocomplete
                label="Ciudad"
                :items="appStore.itemsCity"
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
              <v-autocomplete
                label="Distrito"
                :items="appStore.itemsTown"
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
                :rules="[(v) => !!v || 'Dato Requerido']"
              />
            </v-col>
            <!-- <v-col cols="4">
              <v-text-field
                v-model="$store.state.user.model.socialprincipal"
                label="URL Red Social Principal"
                
              ></v-text-field>
            </v-col>
            <v-col cols="4">
              <v-text-field
                v-model="$store.state.user.model.socialsecundary"
                label="URL Red Social Alternativa"
                
              ></v-text-field>
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
        <v-form ref="frmPosicion">
          <v-row>
            <v-col
              cols="4"
              class="my-auto"
            >
              <!-- @vue-expect-error the value starts as an empty string -->
              <v-autocomplete
                :items="positionStore.lstPosition"
                item-title="name"
                item-value="id"
                v-model="itemPositon"
                return-object
                label="Módulo"
                placeholder="Módulo"
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
          <v-col cols="12">
            <v-data-table
              :headers="headersPosition"
              :items="userStore.positions"
              item-value="id"
            >
              <template #[`item.action`]="{ index }">
                <v-btn
                  variant="text"
                  icon
                  color="red"
                  @click="eliminarPosicion(index)"
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
                  value="1"
                />
                <v-radio
                  label="Operativo"
                  value="2"
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
      <!-- <v-tabs-window-item value="sucursal" class="px-5 py-5 items">
        <v-form ref="frmSucursal">
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
                :rules="[(v) => !!v || 'Dato Requerido']"
                return-object
                :error-messages="errSucursal"
              ></v-autocomplete>
            </v-col>
            <v-col cols="4" class="my-auto">
              <v-btn @click="agregarSucursal()" small color="success"
                >Agregar</v-btn
              >
            </v-col>
          </v-row>
        </v-form>
        <v-row>
          <v-col cols="12">
            <v-data-table
              :headers="headersSucursal"
              :items="$store.state.user.sucursales"
              item-value="id"
            >
              <template v-slot:[`item.action`]="{ index }">
                <v-btn icon color="red" @click="eliminarSucursal(index)">
                  <v-icon>mdi-delete</v-icon>
                </v-btn>
              </template>
            </v-data-table>
          </v-col>
        </v-row>
      </v-tabs-window-item> -->
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
  min-height: 50vh !important;
}
.iconDepartamento {
  cursor: pointer;
}
.justify {
  text-align: justify;
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
