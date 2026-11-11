<script setup lang="ts">
import { computed, useTemplateRef, watch } from "vue";
import { useAppStore } from "@/stores/app";
import CustomAutocomplete from "../CustomAutocomplete.vue";
import { useEntitiesStore } from "@/stores/entities";
import { useMasterusuariosStore } from "@/stores/masterusuarios";
import { entityEditAllowed } from "@/components/folderEntities/entityEditAllowed";
import { useDatosCliente } from "./useDatosCliente";

const props = withDefaults(defineProps<{ isPricing?: boolean }>(), { isPricing: false });

const editAllowed = entityEditAllowed("listClientes");
const appStore = useAppStore();
const entitiesStore = useEntitiesStore();
const masterusuariosStore = useMasterusuariosStore();
const {
  showNombreCompleto,
  fileinput,
  isNombreLoading,
  isDocumentoLoading,
  filteredDocumentsPais,
  toggleNombre,
  handleNombre,
  handleDocumento,
  handleEditarCliente,
  validarCorreoElectronico,
  validarConvenioActual,
  validarTelefonoActual,
  validarContactoActual,
  subirArchivoConvenio,
  modificarCliente,
  getPrefix,
  obtenerFlag,
} = useDatosCliente(() => props.isPricing);

const correoErrors = "";
const correoConvenioActualErrors = "";
const formDatosCliente = useTemplateRef("formDatosCliente");

const isNroDocumentoDisabled = computed(() => {
  return !entitiesStore.cliente.id_tipodocumento;
});
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
  () => entitiesStore.isStep1Valid,
  async (newValue) => {
    if (!newValue) {
      await formDatosCliente.value!.validate();
    }
  },
  { immediate: true },
);

async function validarFormulario() {
  if ((await formDatosCliente.value!.validate()).valid) {
    validarConvenioActual();
    validarTelefonoActual();
    validarContactoActual();

    entitiesStore.stepper = 2;
  }
}
</script>

<template>
  <v-card>
    <v-card-title class="px-2 container-narrow d-flex align-center flex-wrap">
      <v-spacer />
      <v-btn
        v-if="!showNavigationButtons && editAllowed"
        color="light-blue-darken-2"
        class="ma-2"
        size="small"
        @click="modificarCliente"
      >
        <v-icon
          start
          size="small"
        >
          mdi-account-edit
        </v-icon>
        {{ isFormReadonly ? "EDITAR CLIENTE" : "GUARDAR CAMBIOS" }}
      </v-btn>
    </v-card-title>
    <v-card-text>
      <div class="container-narrow">
        <v-form
          ref="formDatosCliente"
          :readonly="isFormReadonly"
        >
          <v-row>
            <v-col cols="12">
              <v-list-subheader class="px-0 font-weight-bold">
                Identificación del Cliente
              </v-list-subheader>
              <v-row>
                <v-col
                  cols="12"
                  md="6"
                >
                  <v-autocomplete
                    density="compact"
                    variant="outlined"
                    :items="masterusuariosStore.lstTipoPersona"
                    item-title="descripcion"
                    item-value="id"
                    label="Persona Natural / Empresa"
                    :rules="[(v) => !!v || 'Dato Requerido']"
                    v-model="entitiesStore.cliente.id_tipopersona"
                    @update:model-value="toggleNombre"
                  />
                </v-col>
                <v-col
                  cols="12"
                  md="6"
                >
                  <v-autocomplete
                    density="compact"
                    variant="outlined"
                    :items="masterusuariosStore.lstTipoTransaccion"
                    item-title="descripcion"
                    item-value="id"
                    label="Nacional / Extranjero"
                    :rules="[(v) => !!v || 'Dato Requerido']"
                    v-model="entitiesStore.cliente.id_tipotransaccion"
                  />
                </v-col>
              </v-row>
              <!--<v-row v-if="showNombreCompleto">
              <v-col cols="12">
                <v-text-field dense label="Nombre Completo" :rules="[(v) => !!v || 'Dato Requerido']"
                  v-model="$store.state.entities.cliente.nombrecompleto" @blur="handleNombre"></v-text-field>                      
              </v-col>
            </v-row>
            <v-row v-if="showNombreFiscal">
              <v-col cols="12">
                <v-text-field dense label="Nombre Fiscal" :rules="[(v) => !!v || 'Dato Requerido']"
                  v-model="$store.state.entities.cliente.nombrecompleto" @blur="handleNombre"></v-text-field>
              </v-col>
            </v-row>-->
              <!-- @vue-expect-error showNombreFiscal is undefined, so the row never shows. -->
              <v-row v-if="showNombreFiscal">
                <v-col cols="12">
                  <v-text-field
                    density="compact"
                    label="Nombre Fiscal"
                    :rules="[(v) => !!v || 'Dato Requerido']"
                    v-model="entitiesStore.cliente.nombrecompleto"
                    @blur="handleNombre"
                  />
                </v-col>
              </v-row>
              <v-row>
                <v-col cols="12">
                  <CustomAutocomplete
                    :items="entitiesStore.lstProveedores_x_nombre"
                    :label="
                      showNombreCompleto ? 'Nombre Completo' : 'Nombre Fiscal'
                    "
                    :value="entitiesStore.cliente.nombrecompleto"
                    @search="handleNombre"
                    @id="handleEditarCliente"
                    :loading="isNombreLoading"
                    :rules="[(v) => !!v || 'Dato Requerido']"
                    :disabled="false"
                  />
                </v-col>
              </v-row>
              <v-list-subheader class="px-0 font-weight-bold mt-2">
                Documento Fiscal
              </v-list-subheader>
              <v-row>
                <v-col
                  cols="12"
                  md="6"
                >
                  <v-autocomplete
                    density="compact"
                    variant="outlined"
                    :items="filteredDocumentsPais"
                    item-title="description"
                    item-value="id"
                    label="Tipo de Documento Fiscal"
                    v-model="entitiesStore.cliente.id_tipodocumento"
                  />
                </v-col>
                <v-col
                  cols="12"
                  md="6"
                >
                  <!--<v-text-field 
                  dense 
                  label="Nro De Documento" 
                  v-model="$store.state.entities.cliente.nro_documento"
                  :disabled="isNroDocumentoDisabled"
                ></v-text-field>-->
                  <CustomAutocomplete
                    :items="entitiesStore.lstProveedores_x_documento"
                    label="Nro De Documento"
                    :value="entitiesStore.cliente.nro_documento"
                    @search="handleDocumento"
                    @id="handleEditarCliente"
                    :loading="isDocumentoLoading"
                    :disabled="isNroDocumentoDisabled"
                  />
                </v-col>
              </v-row>
              <v-list-subheader class="px-0 font-weight-bold mt-2">
                Ubicación y Contacto
              </v-list-subheader>
              <v-row>
                <v-col
                  cols="12"
                  md="6"
                >
                  <v-autocomplete
                    density="compact"
                    variant="outlined"
                    item-title="name"
                    item-value="id"
                    :items="appStore.itemsPais"
                    label="País"
                    :rules="[(v) => !!v || 'Dato Requerido']"
                    v-model="entitiesStore.cliente.id_pais"
                    @update:model-value="appStore._getState(entitiesStore.cliente.id_pais)"
                  />
                </v-col>
                <v-col
                  cols="12"
                  md="6"
                >
                  <v-autocomplete
                    density="compact"
                    variant="outlined"
                    :items="appStore.itemsState"
                    item-title="name"
                    item-value="id"
                    label="Región / Estado"
                    :model-value="entitiesStore.cliente.id_ciudad || null"
                    @update:model-value="(id) => (entitiesStore.cliente.id_ciudad = id)"
                  />
                </v-col>
              </v-row>
              <v-row>
                <v-col
                  cols="12"
                  md="6"
                >
                  <v-text-field
                    density="compact"
                    variant="outlined"
                    label="Dirección"
                    v-model="entitiesStore.cliente.direccion"
                  />
                </v-col>
                <v-col
                  cols="12"
                  md="6"
                >
                  <v-text-field
                    density="compact"
                    variant="outlined"
                    label="Correo Electrónico"
                    v-model="entitiesStore.cliente.emailaddress"
                    :rules="[(v) => validarCorreoElectronico(v)]"
                    :error-messages="correoErrors"
                  />
                </v-col>
              </v-row>
              <!--CONVENIO ACTUAL-->
              <div class="d-flex align-center mt-2">
                <v-list-subheader class="px-0 font-weight-bold">
                  Convenio Actual
                </v-list-subheader>
                <v-spacer />
                <v-file-input
                  v-if="showFormActions"
                  accept=".xlsx,.xls,.doc,.docx,.ppt,.pptx,.txt,.pdf,.gif,.jpg,.jpeg,.png"
                  label="Adjuntar Archivo"
                  hide-input
                  class="customFile"
                  v-model="fileinput"
                  @update:model-value="subirArchivoConvenio"
                />
              </div>
              <v-row>
                <v-col
                  cols="12"
                  md="4"
                >
                  <v-text-field
                    density="compact"
                    variant="outlined"
                    type="number"
                    suffix="días"
                    v-model="
                      entitiesStore.cliente.convenioActual.dias_credito
                    "
                    label="Días de Crédito para el Pago"
                    :rules="[
                      (v) =>
                        v >= 0 ||
                        'Es necesario que ponga un número entero positivo',
                    ]"
                    @change="validarConvenioActual"
                  />
                </v-col>
                <v-col
                  cols="12"
                  md="4"
                >
                  <v-text-field
                    density="compact"
                    variant="outlined"
                    type="date"
                    v-model="entitiesStore.cliente.convenioActual.fecha"
                    label="Fecha Convenio"
                    @change="validarConvenioActual"
                  />
                </v-col>
                <v-col
                  cols="12"
                  md="4"
                >
                  <v-text-field
                    density="compact"
                    variant="outlined"
                    v-model="
                      entitiesStore.cliente.convenioActual.email_soporte
                    "
                    label="Email Soporte"
                    :rules="[(v) => validarCorreoElectronico(v)]"
                    :error-messages="correoConvenioActualErrors"
                    @change="validarConvenioActual"
                  />
                </v-col>
              </v-row>
              <!--TELÉFONO ACTUAL-->
              <v-list-subheader class="px-0 font-weight-bold mt-2">
                Teléfono Principal
              </v-list-subheader>
              <v-row>
                <v-col
                  cols="12"
                  md="6"
                >
                  <v-autocomplete
                    density="compact"
                    variant="outlined"
                    :items="masterusuariosStore.lstTipoTelefono"
                    item-title="descripcion"
                    item-value="id"
                    label="Tipo de Teléfono"
                    v-model="
                      entitiesStore.cliente.telefonoActual
                        .id_tipotelefono
                    "
                    @update:model-value="validarTelefonoActual"
                  />
                </v-col>
                <v-col
                  cols="12"
                  md="6"
                >
                  <v-text-field
                    density="compact"
                    variant="outlined"
                    label="Teléfono"
                    v-model="
                      entitiesStore.cliente.telefonoActual.telefono
                    "
                    @change="validarTelefonoActual"
                    :prefix="getPrefix()"
                    :style="{
                      backgroundImage: `url(${obtenerFlag()})`,
                      backgroundRepeat: 'no-repeat',
                      backgroundSize: '20px 15px',
                      backgroundPosition: '4px center',
                      paddingLeft: '30px',
                    }"
                  />
                </v-col>
              </v-row>
              <!--CONTACTO ACTUAL-->
              <v-list-subheader class="px-0 font-weight-bold mt-2">
                Teléfono Adicional
              </v-list-subheader>
              <v-row>
                <v-col
                  cols="12"
                  md="4"
                >
                  <v-text-field
                    density="compact"
                    variant="outlined"
                    label="Nombre"
                    v-model="
                      entitiesStore.cliente.contactoActual.nombre
                    "
                    :rules="[(v) => !!v || 'Dato Requerido']"
                    @change="validarContactoActual"
                  />
                </v-col>
                <v-col
                  cols="12"
                  md="4"
                >
                  <v-autocomplete
                    density="compact"
                    variant="outlined"
                    :items="masterusuariosStore.lstTipoTelefono"
                    item-title="descripcion"
                    item-value="id"
                    label="Tipo de Teléfono"
                    v-model="
                      entitiesStore.cliente.contactoActual
                        .id_tipotelefono
                    "
                    :rules="[(v) => !!v || 'Dato Requerido']"
                    @update:model-value="validarContactoActual"
                  />
                </v-col>
                <v-col
                  cols="12"
                  md="4"
                >
                  <v-text-field
                    hide-details
                    density="compact"
                    variant="outlined"
                    label="Teléfono"
                    v-model="
                      entitiesStore.cliente.contactoActual.telefono
                    "
                    :rules="[(v) => !!v || 'Dato Requerido']"
                    @change="validarContactoActual"
                    :prefix="getPrefix()"
                    :style="{
                      backgroundImage: `url(${obtenerFlag()})`,
                      backgroundRepeat: 'no-repeat',
                      backgroundSize: '20px 15px',
                      backgroundPosition: '4px center',
                      paddingLeft: '30px',
                    }"
                  />
                </v-col>
              </v-row>
              <!--NOTAS-->
              <v-list-subheader class="px-0 font-weight-bold mt-2">
                Notas
              </v-list-subheader>
              <v-row>
                <v-col cols="12">
                  <v-textarea
                    density="compact"
                    variant="outlined"
                    rows="3"
                    label="Comentarios / Notas Importantes"
                    v-model="entitiesStore.cliente.notas"
                  />
                </v-col>
              </v-row>
            </v-col>
          </v-row>
        </v-form>
      </div>
    </v-card-text>
    <v-card-actions
      v-if="!showNavigationButtons && editAllowed"
      class="px-2 container-narrow"
    >
      <v-spacer />
      <v-btn
        color="light-blue-darken-2"
        class="ma-2"
        size="small"
        @click="modificarCliente"
      >
        <v-icon
          start
          size="small"
        >
          mdi-account-edit
        </v-icon>
        {{ isFormReadonly ? "EDITAR CLIENTE" : "GUARDAR CAMBIOS" }}
      </v-btn>
    </v-card-actions>
    <v-card-actions v-if="showNavigationButtons">
      <v-btn
        color="primary"
        class="ml-auto"
        @click="validarFormulario"
      >
        Agregar Más
      </v-btn>
    </v-card-actions>
  </v-card>
</template>

<style>
.customFile {
  flex-grow: 0 !important;
  flex-direction: row-reverse !important;
}
.customFile .v-input__prepend {
  margin-right: 0;
}
.container-narrow {
  max-width: 1100px;
  margin: 0 auto;
}
</style>
