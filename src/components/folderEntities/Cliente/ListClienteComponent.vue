<script setup lang="ts">
import { onMounted, ref } from "vue";
import { useRouter } from "vue-router";
import { useStore } from "vuex";
import Swal from "sweetalert2";
import axios from "@/api/http";
import { useEntitiesStore } from "@/stores/entities";
import { useMasterusuariosStore } from "@/stores/masterusuarios";
import type { ApiResponse } from "@/types/api";
import type { EntidadListado } from "@/types/entidades";
import type { UsuarioSesion } from "@/types/sesion";

const router = useRouter();
const rootStore = useStore();
const entitiesStore = useEntitiesStore();
const masterusuariosStore = useMasterusuariosStore();

const dialogAdminAuth = ref(false);
const adminAuthLoading = ref(false);
const adminUser = ref("");
const adminPassword = ref("");
const showAdminPassword = ref(false);
const dialogTelCont = ref(false);
const search = ref("");
const nombrecompleto = ref("");
const id = ref<number | null>(null);
const adminAuthError = ref("");
const msg = ref("");
const headers = [
  { title: "Correlativo", key: "correlativo" },
  { title: "Documento", key: "documento" },
  { title: "Nombre Completo", key: "nombrecompleto" },
  { title: "Ubigeo", key: "ubigeo" },
  { title: "Dirección", key: "address" },
  { title: "Estado", key: "estado" },
  { title: "Acciones", key: "action" },
] as const;
const headersTel = [
  { title: "Tipo de Teléfono", key: "tipotelefono", width: "30%" },
  { title: "Nro Teléfono", key: "nro_telefono", width: "50%" },
] as const;
const headersContact = [
  { title: "Nombres", key: "nombre" },
  { title: "Tipo de Teléfono", key: "tipotelefono" },
  { title: "Nro Teléfono", key: "nro_telefono" },
] as const;

function cambiarRuta({ nameRuta = "", idProveedor = "" }) {
  router.push({
    name: nameRuta,
    // @ts-expect-error Kept: the "paramas" typo has never passed the id to the route.
    paramas: {
      id: idProveedor,
    },
  });
}
async function eliminar(item: EntidadListado) {
  const val = await entitiesStore.validarClienteTieneMovimientos({ id: item.id });
  console.log("validarClienteTieneMovimientos", val);
  if (!val.estadoflag) {
    Swal.fire({
      icon: "error",
      title: "No se puede eliminar el cliente",
      html: val.mensaje,
      allowOutsideClick: false,
      showConfirmButton: true,
      confirmButtonText: "Cerrar",
      confirmButtonColor: "red",
    });
    return;
  }

  Swal.fire({
    icon: "question",
    title: "Eliminar Registro",
    html: `Está seguro que desea eliminar el CLIENTE <br/> CLI-${item.correlativo}`,
    allowOutsideClick: false,
    showConfirmButton: true,
    confirmButtonText: "ELIMINAR",
    showCancelButton: true,
    confirmButtonColor: "red",
    cancelButtonText: "Cerrar",
  }).then(async (res) => {
    if (res.isConfirmed) {
      const data = { id: item.id };
      await entitiesStore.eliminarPersona(data);
      await entitiesStore.getListClientes();
    }
  });
}
async function irAEditar(item: EntidadListado) {
  const val = await entitiesStore.validarClienteTieneMovimientos({ id: item.id });
  console.log("validarClienteTieneMovimientos", val);
  if (!val.estadoflag) {
    id.value = item.id;
    dialogAdminAuth.value = true;
    msg.value = val.mensaje!;
    return;
  } else {
    router.push({
      name: "editarCliente",
      params: { id: item.id },
    });
  }
}
function cerrarDialogAdminAuth() {
  dialogAdminAuth.value = false;
  adminUser.value = "";
  adminPassword.value = "";
  adminAuthError.value = "";
}
async function validarAdminAuth() {
  adminAuthError.value = "";

  if (!adminUser.value || !adminPassword.value) {
    adminAuthError.value = "Ingrese usuario y contraseña";
    return;
  }

  adminAuthLoading.value = true;

  try {
    const config = {
      method: "post",
      url: import.meta.env.VITE_URL_MAIN + "singin",
      headers: {
        "Content-Type": "application/json",
      },
      data: JSON.stringify({
        user: adminUser.value,
        password: adminPassword.value,
      }),
    };

    const response = await axios<ApiResponse<UsuarioSesion[]>>(config);

    if (response.data.estadoflag) {
      const userEmail =
        response.data.data[0]!.user || response.data.data[0]!.usuario;

      if (userEmail && userEmail.toLowerCase() === "cmrg1979a@gmail.com") {
        // Es el admin, permitir edición
        cerrarDialogAdminAuth();
        router.push({
          name: "editarCliente",
          params: { id: id.value! },
        });
      } else {
        adminAuthError.value =
          "Solo el usuario administrador puede editar cotizaciones aprobadas";
      }
    } else {
      adminAuthError.value =
        response.data.mensaje || "Credenciales incorrectas";
    }
  } catch (error) {
    console.error("Error en validación admin:", error);
    adminAuthError.value = "Error al validar credenciales";
  } finally {
    adminAuthLoading.value = false;
  }
}
async function obtenerTelContactoProveedor(item: EntidadListado) {
  rootStore.state.spiner = true;
  nombrecompleto.value = item.nombrecompleto!;
  await entitiesStore.telConctactoProveedor({ id: item.id });
  dialogTelCont.value = true;
  rootStore.state.spiner = false;
}
async function exportCliente() {
  rootStore.state.spiner = true;
  await entitiesStore.exportListClientes();
  rootStore.state.spiner = false;
}

onMounted(async () => {
  entitiesStore.lstProveedor = [];
  rootStore.state.spiner = true;
  await entitiesStore.getListClientes();
  rootStore.state.spiner = false;
  await Promise.all([
    rootStore.dispatch("_getDocumentsPais"),
    masterusuariosStore.cargarMasterDetalleTipoProveedor(),
    rootStore.dispatch("_getPais"),
    rootStore.dispatch("_getRole"),
    masterusuariosStore.cargarTipoTelefono(),
  ]);
});
</script>

<template>
  <v-container fluid>
    <v-row>
      <v-col cols="6">
        <v-btn
          rounded
          size="small"
          class="mx-1"
          color="success"
          @click="cambiarRuta({ nameRuta: 'nuevoClientes' })"
        >
          NUEVO
        </v-btn>
        <v-btn
          rounded
          size="small"
          class="mx-1"
          color="secondary"
          @click="
            entitiesStore.filtrarProveedor =
              !entitiesStore.filtrarProveedor
          "
        >
          FILTRAR
        </v-btn>
        <v-btn
          rounded
          size="small"
          class="mx-1"
          color="warning"
          @click="exportCliente()"
        >
          EXPORTAR
        </v-btn>
      </v-col>
      <v-col cols="6">
        <v-spacer />
        <v-text-field
          name="Buscar"
          label="Buscar"
          v-model="search"
        />
      </v-col>
      <v-col cols="12">
        <v-data-table
          :headers="headers"
          :items="entitiesStore.lstProveedor"
          item-value="id"
          :search="search"
        >
          <template #[`item.documento`]="{ item }">
            {{ item.acronym_document }}-{{ item.document }}
          </template>
          <template #[`item.ubigeo`]="{ item }">
            {{
              item.pais && item.city
                ? item.pais.concat("-", item.city)
                : item.pais || item.city
            }}
          </template>
          <template #[`item.action`]="{ item }">
            <v-btn-toggle>
              <v-btn
                variant="text"
                size="x-small"
                icon
                @click="obtenerTelContactoProveedor(item)"
              >
                <v-icon color="blue-grey-darken-3">
                  mdi-phone
                </v-icon>
              </v-btn>
              <!-- <v-btn x-small icon @click="editar(item.id)">
                <v-icon color="green">mdi-currency-usd</v-icon>
              </v-btn> -->
              <v-btn
                variant="text"
                v-if="item.status == 1"
                size="x-small"
                icon
                @click="irAEditar(item)"
              >
                <v-icon color="#E65100">
                  mdi-pencil
                </v-icon>
              </v-btn>
              <v-btn
                variant="text"
                size="x-small"
                icon
                @click="
                  $router.push({
                    name: 'verCliente',
                    params: { id: item.id },
                  })
                "
              >
                <v-icon color="info">
                  mdi-eye
                </v-icon>
              </v-btn>
              <v-btn
                variant="text"
                size="x-small"
                icon
                v-if="item.status == 1"
              >
                <v-icon
                  color="red"
                  @click="eliminar(item)"
                >
                  mdi-delete
                </v-icon>
              </v-btn>
            </v-btn-toggle>
          </template>
        </v-data-table>
      </v-col>
    </v-row>
    <v-dialog
      v-model="dialogTelCont"
      persistent
      max-width="50%"
      transition="dialog-transition"
      scrollable
    >
      <v-card>
        <v-card-title>
          Teléfonos y Contactos: {{ nombrecompleto }}
        </v-card-title>
        <v-card-text>
          <v-row>
            <v-col cols="10">
              <v-list-subheader> <b>Teléfonos:</b> <br> </v-list-subheader>
            </v-col>

            <v-col cols="12">
              <v-data-table
                :headers="headersTel"
                :items="entitiesStore.lstTelefono"
                item-value="id"
                class="elevation-5"
              >
                <template #[`item.tipotelefono`]="{ item }">
                  <v-autocomplete
                    :items="masterusuariosStore.lstTipoTelefono"
                    item-title="descripcion"
                    item-value="id"
                    label="Tipo de Teléfono"
                    v-model="item.id_tipotelefono"
                    :error-messages="item.errorTipoTelf"
                    readonly
                  />
                </template>
                <template #[`item.nro_telefono`]="{ item }">
                  <v-text-field
                    v-model="item.telefono"
                    prefix="+"
                    :error-messages="item.errorTelefono"
                  />
                </template>
                <template #[`item.action`]="{ index }">
                  <!-- @vue-expect-error Kept: eliminarTelefono was never defined here; the table has no action column, so this button never renders. -->
                  <v-btn
                    variant="text"
                    icon
                    color="red"
                    @click="eliminarTelefono(index)"
                  >
                    <v-icon>mdi-delete</v-icon>
                  </v-btn>
                </template>
              </v-data-table>
            </v-col>

            <!-- -------------------------------- -->
            <v-col cols="10">
              <v-list-subheader><b>Contactos</b></v-list-subheader>
            </v-col>
            <v-col cols="12">
              <v-data-table
                :headers="headersContact"
                :items="entitiesStore.lstContactos"
                item-value="index"
                class="elevation-5"
              >
                <template #[`item.nombre`]="{ item }">
                  <v-text-field
                    v-model="item.nombre"
                    readonly
                    :error-messages="item.errornombre"
                  />
                </template>

                <template #[`item.tipotelefono`]="{ item }">
                  <v-autocomplete
                    :items="masterusuariosStore.lstTipoTelefono"
                    item-title="descripcion"
                    item-value="id"
                    label="Tipo de Teléfono"
                    v-model="item.id_tipotelefono"
                    readonly
                    :error-messages="item.errorTipoTelf"
                  />
                </template>
                <template #[`item.nro_telefono`]="{ item }">
                  <!-- @vue-expect-error Kept: validarFormularioTelefonoContacto was never defined here, so leaving this field has always thrown. -->
                  <v-text-field
                    v-model="item.telefono"
                    prefix="+"
                    :error-messages="item.errorTelefono"
                    @blur="validarFormularioTelefonoContacto()"
                  />
                </template>

                <template #[`item.action`]="{ index }">
                  <!-- @vue-expect-error Kept: eliminarContacto was never defined here; the table has no action column, so this button never renders. -->
                  <v-btn
                    variant="text"
                    icon
                    color="red"
                    @click="eliminarContacto(index)"
                  >
                    <v-icon>mdi-delete</v-icon>
                  </v-btn>
                </template>
              </v-data-table>
            </v-col>
          </v-row>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn
            class="mx-1"
            color="success"
            @click="dialogTelCont = !dialogTelCont"
          >
            Cerrar
          </v-btn>
          <!-- <v-btn class="mx-1" color="red" dark>Cancelar</v-btn> -->
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog
      v-model="dialogAdminAuth"
      max-width="400"
      persistent
    >
      <v-card>
        <v-card-title class="text-headline-medium bg-grey-lighten-2">
          Autenticación Requerida
        </v-card-title>
        <v-card-text class="pt-4">
          <!-- eslint-disable-next-line vue/no-v-html -->
          <div v-html="msg" />
          <p class="mb-4">
            Ingrese las credenciales de administrador para continuar.
          </p>
          <v-text-field
            v-model="adminUser"
            label="Usuario o Email"
            prepend-icon="mdi-account"
            variant="outlined"
            density="compact"
          />
          <v-text-field
            v-model="adminPassword"
            label="Contraseña"
            prepend-icon="mdi-lock"
            :type="showAdminPassword ? 'text' : 'password'"
            :append-inner-icon="showAdminPassword ? 'mdi-eye' : 'mdi-eye-off'"
            @click:append-inner="showAdminPassword = !showAdminPassword"
            variant="outlined"
            density="compact"
          />
          <v-alert
            v-if="adminAuthError"
            type="error"
            density="compact"
            class="mt-2"
          >
            {{ adminAuthError }}
          </v-alert>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn
            color="grey"
            variant="text"
            @click="cerrarDialogAdminAuth()"
          >
            Cancelar
          </v-btn>
          <v-btn
            color="success"
            :loading="adminAuthLoading"
            @click="validarAdminAuth()"
          >
            Ingresar
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<style></style>
