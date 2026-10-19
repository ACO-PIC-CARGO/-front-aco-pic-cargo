<script setup lang="ts">
import { computed, useTemplateRef, watch } from "vue";
import { useStore } from "vuex";
import Swal from "sweetalert2";
import { useEntitiesStore } from "@/stores/entities";
import { useMasterusuariosStore } from "@/stores/masterusuarios";
import type { EmailEntidad } from "@/types/entidades";

const rootStore = useStore();
const entitiesStore = useEntitiesStore();
const masterusuariosStore = useMasterusuariosStore();

const headersTelefonos = [
  { title: "Tipo de Teléfono", key: "id_tipotelefono", width: "35%" },
  { title: "Nro Teléfono", key: "nro_telefono", width: "50%" },
  { title: "Acciones", key: "action", width: "15%" },
] as const;
const headersContactos = [
  { title: "Nombres", key: "nombre", width: "35%" },
  { title: "Tipo de Teléfono", key: "id_tipotelefono", width: "25%" },
  { title: "Nro Teléfono", key: "nro_telefono", width: "25%" },
  { title: "Acciones", key: "action", width: "15%" },
] as const;
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const headersEmails = [
  { title: "Descripción", key: "description", width: "35%" },
  { title: "Email", key: "email", width: "25%" },
  // { text: "Nro Teléfono", value: "nro_telefono", width: "25%" },
  { title: "Acciones", key: "action", width: "15%" },
] as const;
const formProv_telefonos = useTemplateRef("formProv_telefonos");
const formProv_contactos = useTemplateRef("formProv_contactos");

const isFormReadonly = computed(() => {
  return entitiesStore.isReadonly;
});
const showFormActions = computed(() => {
  return !entitiesStore.isReadonly;
});
const showNavigationButtons = computed(() => {
  return !(
    entitiesStore.isEdit ||
    entitiesStore.isReadonly
  );
});

watch(
  () => entitiesStore.isStep2Valid,
  async (newValue) => {
    if (!newValue) {
      await formProv_telefonos.value!.validate();
      await formProv_contactos.value!.validate();
    }
  },
  { immediate: true },
);
watch(
  () => entitiesStore.lstTelefonos,
  (newValue) => {
    if (newValue[0]) {
      entitiesStore.proveedor.telefonoActual = newValue[0];
    }
  },
  { deep: true },
);
watch(
  () => entitiesStore.lstContactos,
  (newValue) => {
    if (newValue[0]) {
      entitiesStore.proveedor.contactoActual = newValue[0];
    }
  },
  { deep: true },
);

function agregarTelefono() {
  entitiesStore.lstTelefonos.push({
    id_tipotelefono: "",
    telefono: "",
  });
}
function eliminarTelefono(index: number) {
  entitiesStore.lstTelefonos.splice(index, 1);
}
function agregarContacto() {
  entitiesStore.lstContactos.push({
    nombre: "",
    id_tipotelefono: "",
    telefono: "",
  });
}
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function agregarEmail() {
  entitiesStore.lstEmails.push({
    id: null,
    description: "",
    email: "",
    estado: true,
  });
}
function eliminarContacto(index: number) {
  entitiesStore.lstContactos.splice(index, 1);
}
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function eliminarEmail(item: EmailEntidad) {
  item.estado = false;
}
async function modificarProveedor() {
  // Si está en modo solo lectura, pasar a modo edición y no guardar todavía
  if (isFormReadonly.value) {
    entitiesStore.isReadonly = false;
    entitiesStore.isEdit = true;
    Swal.fire({
      icon: "info",
      text: "Ahora puede modificar los campos",
    });
    return;
  }

  entitiesStore.isStep1Valid = true;
  entitiesStore.isStep2Valid = true;
  entitiesStore.isStep3Valid = true;
  entitiesStore.isStep4Valid = true;

  let okStep2_1 = true;
  if (entitiesStore.lstTelefonos.length > 0) {
    entitiesStore.lstTelefonos.map((v) => {
      if (!v.id_tipotelefono || !v.telefono) {
        okStep2_1 = false;
      }
    });
  }

  let okStep2_2 = true;
  if (entitiesStore.lstContactos.length > 0) {
    entitiesStore.lstContactos.map((v) => {
      if (!v.nombre || !v.id_tipotelefono || !v.telefono) {
        okStep2_2 = false;
      }
    });
  }

  if (!okStep2_1 || !okStep2_2) {
    entitiesStore.isStep2Valid = false;
    Swal.fire({
      icon: "warning",
      text: "Por favor complete todos los campos requeridos en Teléfonos y Contactos",
    });
  } else {
    rootStore.state.spiner = true;
    await entitiesStore.actualizarProveedor();
    rootStore.state.spiner = false;

    // Volver a modo solo lectura después de guardar correctamente
    entitiesStore.isReadonly = true;
    entitiesStore.isEdit = false;
  }
}
async function validarFormulario() {
  if (
    entitiesStore.lstTelefonos.length === 0 ||
    entitiesStore.lstContactos.length === 0
  ) {
    Swal.fire({
      icon: "error",
      text: "Para avanzar al paso 3, es necesario agregar al menos un teléfono y un contacto",
    });

    return;
  }

  if (!(await formProv_telefonos.value!.validate()).valid) {
    return;
  }
  if (!(await formProv_contactos.value!.validate()).valid) {
    return;
  }
  // if (!vm.$refs.formProv_email.validate()) {
  //   return;
  // }

  entitiesStore.stepper = 3;
}
</script>

<template>
  <v-card>
    <v-card-title class="px-2 container-narrow d-flex align-center flex-wrap">
      <v-spacer />
      <v-btn
        v-if="!showNavigationButtons"
        color="light-blue-darken-2"
        class="ma-2"
        size="small"
        @click="modificarProveedor"
      >
        <v-icon
          start
          size="small"
        >
          mdi-account-edit
        </v-icon>
        {{ isFormReadonly ? 'EDITAR PROVEEDOR' : 'GUARDAR CAMBIOS' }}
      </v-btn>
    </v-card-title>
    <v-card-text class="px-2">
      <div class="container-narrow">
        <!-- ===== TELÉFONOS PROVEEDOR ===== -->
        <v-list-subheader class="px-0">
          <b>Teléfonos Proveedor</b>

          <template v-if="showFormActions">
            <v-btn
              color="primary"
              rounded
              size="small"
              class="ml-auto"
              @click="agregarTelefono()"
            >
              Agregar Teléfono
            </v-btn>
          </template>
        </v-list-subheader>
        <v-row>
          <v-col cols="12">
            <v-form
              ref="formProv_telefonos"
              :readonly="isFormReadonly"
            >
              <v-data-table
                :headers="headersTelefonos"
                :items="entitiesStore.lstTelefonos"
                item-value="index"
                class="elevation-5"
              >
                <template #[`item.id_tipotelefono`]="{ item }">
                  <v-autocomplete
                    :items="masterusuariosStore.lstTipoTelefono"
                    item-title="descripcion"
                    item-value="id"
                    v-model="item.id_tipotelefono"
                    :rules="[(v) => !!v || 'Dato Requerido']"
                  />
                </template>
                <template #[`item.nro_telefono`]="{ item }">
                  <v-text-field
                    v-model="item.telefono"
                    prefix="+"
                    :rules="[
                      (v) => !!v || 'Dato Requerido',
                      (v) => /^\d+$/.test(v) || 'Formato de teléfono incorrecto',
                    ]"
                  />
                </template>
                <template
                  #[`item.action`]="{ index }"
                  v-if="showFormActions"
                >
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
            </v-form>
          </v-col>
        </v-row>

        <br>

        <!-- ===== CONTACTOS ===== -->
        <v-list-subheader class="px-0">
          <b>Contactos</b>

          <template v-if="showFormActions">
            <v-btn
              color="primary"
              rounded
              size="small"
              class="ml-auto"
              @click="agregarContacto()"
            >
              Agregar Contacto
            </v-btn>
          </template>
        </v-list-subheader>
        <v-row>
          <v-col cols="12">
            <v-form
              ref="formProv_contactos"
              :readonly="isFormReadonly"
            >
              <v-data-table
                :headers="headersContactos"
                :items="entitiesStore.lstContactos"
                item-value="index"
                class="elevation-5"
              >
                <template #[`item.nombre`]="{ item }">
                  <v-text-field
                    v-model="item.nombre"
                    :rules="[(v) => !!v || 'Dato Requerido']"
                    :error-messages="item.errornombre"
                  />
                </template>
                <template #[`item.id_tipotelefono`]="{ item }">
                  <v-autocomplete
                    :items="masterusuariosStore.lstTipoTelefono"
                    item-title="descripcion"
                    item-value="id"
                    v-model="item.id_tipotelefono"
                    :rules="[(v) => !!v || 'Dato Requerido']"
                    :error-messages="item.errorTipoTelf"
                  />
                </template>
                <template #[`item.nro_telefono`]="{ item }">
                  <v-text-field
                    v-model="item.telefono"
                    prefix="+"
                    :rules="[
                      (v) => !!v || 'Dato Requerido',
                      (v) => /^\d+$/.test(v) || 'Formato de teléfono incorrecto',
                    ]"
                    :error-messages="item.errorTelefono"
                  />
                </template>
                <template
                  #[`item.action`]="{ index }"
                  v-if="showFormActions"
                >
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
            </v-form>

          <!-- <v-list-subheader class="px-0">
            <b>Emails</b>
            <template v-if="showFormActions">
              <v-btn
                color="primary"
                rounded
                small
                class="ml-auto"
                @click="agregarEmail()"
                >Agregar Email</v-btn
              >
            </template>
          </v-list-subheader>

          <v-row>
            <v-col cols="12">
              <v-form ref="formProv_email" :readonly="isFormReadonly">
                <v-data-table
                  :headers="headersEmails"
                  :items="
                    $store.state.entities.lstEmails.filter(
                      (v) => !!v && v.estado
                    )
                  "
                  item-value="index"
                  class="elevation-5"
                >
                  <template v-slot:[`item.description`]="{ item }">
                    <v-text-field
                      v-model="item.description"
                      :rules="[(v) => !!v || 'Dato Requerido']"
                      :error-messages="item.errornombre"
                    ></v-text-field>
                  </template>
                  <template v-slot:[`item.email`]="{ item }">
                    <v-text-field
                      v-model="item.email"
                      :rules="[
                        (v) => !!v || 'Dato Requerido',
                        (v) =>
                          /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$/.test(
                            v
                          ) || 'Email no válido',
                      ]"
                      :error-messages="item.errornombre"
                    ></v-text-field>
                  </template>

                  <template
                    v-slot:[`item.action`]="{ item, index }"
                    v-if="showFormActions"
                  >
                    <v-btn icon color="red" @click="eliminarEmail(item)">
                      <v-icon>mdi-delete</v-icon>
                    </v-btn>
                  </template>
                </v-data-table>
              </v-form>
            </v-col>
          </v-row> -->
          </v-col>
        </v-row>
      </div>
    </v-card-text>
    <v-card-actions v-if="showNavigationButtons">
      <v-btn
        color="primary"
        @click="entitiesStore.stepper--"
      >
        Regresar
      </v-btn>
      <v-btn
        color="primary"
        class="ml-auto"
        @click="validarFormulario"
      >
        Continuar
      </v-btn>
    </v-card-actions>
  </v-card>
</template>

<style>
.container-narrow {
  max-width: 1100px;
  margin: 0 auto;
}
</style>
