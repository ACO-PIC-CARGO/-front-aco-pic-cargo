<script setup lang="ts">
import { computed, onMounted, ref, useTemplateRef, watch } from "vue";
import { useRouter } from "vue-router";
import { useStore } from "vuex";
import Swal from "sweetalert2";
import CustomAutocomplete from "../CustomAutocomplete.vue";
import { useEntitiesStore } from "@/stores/entities";
import { useMasterusuariosStore } from "@/stores/masterusuarios";
import { usePricingStore } from "@/stores/pricing";
import type { DocumentoPais, Pais } from "@/types/catalogos";
import type { TipoTransaccion } from "@/types/entidades";
import { useFilesStore } from "@/stores/files";

const props = withDefaults(defineProps<{ isPricing?: boolean }>(), { isPricing: false });

const router = useRouter();
const rootStore = useStore();
const filesStore = useFilesStore();
const pricingStore = usePricingStore();
const entitiesStore = useEntitiesStore();
const masterusuariosStore = useMasterusuariosStore();

const showNombreCompleto = ref(true);
const correoErrors = "";
const correoConvenioActualErrors = "";
const fileinput = ref<File | File[] | null>(null);
const isFileLoading = ref(false);
const isNombreLoading = ref(false);
const isDocumentoLoading = ref(false);
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
const filteredDocumentsPais = computed(() => {
  const all: DocumentoPais[] = rootStore.state.itemsDocumentsPais || [];
  const tipoPersona = masterusuariosStore.lstTipoPersona.find(
    (v) => v.id == entitiesStore.cliente.id_tipopersona,
  );

  if (!tipoPersona) return all;

  const norm = (s: string | null | undefined) => (s || "").toString().trim().toUpperCase();

  const isNatural = tipoPersona.descripcion === "Persona Natural";
  const isEmpresa = tipoPersona.descripcion === "Empresa";

  if (isNatural) {
    const naturalAllowed = new Set([
      "DNI",
      "CEDULA",
      "CÉDULA",
      "PASAPORTE",
      "TELEFONO",
      "TELÉFONO",
      "CARNET DE EXTRANJERIA",
      "CARNET DE EXTRANJERÍA",
      "CARNET DIPLOMATICO",
      "CARNET DIPLOMÁTICO",
    ]);
    return all.filter(
      (it) =>
        naturalAllowed.has(norm(it.name)) ||
        naturalAllowed.has(norm(it.description)),
    );
  }

  if (isEmpresa) {
    const isCombined = (it: DocumentoPais) => {
      const d = norm(it.description);
      const n = norm(it.name);
      return (
        d.includes("REGISTRO UNICO DE CONTRIBUYENTE") ||
        d.includes("REGISTRO ÚNICO DE CONTRIBUYENTE") ||
        n === "RUC/RIF" ||
        n === "RUC / RIF"
      );
    };

    const telefonoMatch = (it: DocumentoPais) => {
      const d = norm(it.description);
      const n = norm(it.name);
      return (
        n === "TELEFONO" ||
        n === "TELÉFONO" ||
        d === "TELEFONO" ||
        d === "TELÉFONO"
      );
    };

    const combinedItems = all.filter(isCombined);
    if (combinedItems.length) {
      return all
        .filter((it) => isCombined(it) || telefonoMatch(it))
        .map((it) =>
          isCombined(it)
            ? {
                ...it,
                description: "REGISTRO ÚNICO DE CONTRIBUYENTE (RUC/RIF)",
              }
            : it,
        );
    }

    // Fallback to RUC/RIF separate entries if combined not present
    const isRucOrRif = (it: DocumentoPais) => {
      const n = norm(it.name);
      const d = norm(it.description);
      return n === "RUC" || n === "RIF" || d === "RUC" || d === "RIF";
    };
    return all
      .filter((it) => isRucOrRif(it) || telefonoMatch(it))
      .map((it) =>
        isRucOrRif(it)
          ? {
              ...it,
              description: "REGISTRO ÚNICO DE CONTRIBUYENTE (RUC/RIF)",
            }
          : it,
      );
  }

  return all;
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

function setDocumentoFiscalByDefault(criterio = "") {
  const tipoDocumento = getIDTipoDocumento(criterio);
  if (tipoDocumento) {
    entitiesStore.cliente.id_tipodocumento = tipoDocumento;
  }
}
function getIDTipoDocumento(criterio = "") {
  let id = null;

  const tipoDocumentoData = (rootStore.state.itemsDocumentsPais as DocumentoPais[]).find(
    (v) => v.name.toUpperCase() == criterio.toUpperCase(),
  );
  if (tipoDocumentoData) {
    id = tipoDocumentoData.id;
  }

  return id;
}
function toggleNombre() {
  const tipoPersonaData =
    masterusuariosStore.lstTipoPersona.find(
      (v) => v.id == entitiesStore.cliente.id_tipopersona,
    );
  if (tipoPersonaData) {
    if (tipoPersonaData.descripcion == "Persona Natural") {
      showNombreCompleto.value = true;
      setDocumentoFiscalByDefault("DNI");
    } else if (tipoPersonaData.descripcion == "Empresa") {
      showNombreCompleto.value = false;
      setDocumentoFiscalByDefault("RUC");
    }
  }
}
async function handleNombre(val: string) {
  entitiesStore.lstProveedores_x_nombre = [];
  entitiesStore.cliente.nombrecompleto = val;
  if (entitiesStore.cliente.nombrecompleto) {
    isNombreLoading.value = true;
    // await this.validarNombreCliente();
    isNombreLoading.value = false;
  }
}
async function handleDocumento(val: string) {
  entitiesStore.lstProveedores_x_documento = [];
  entitiesStore.cliente.nro_documento = val;
  if (entitiesStore.cliente.nro_documento) {
    isDocumentoLoading.value = true;
    await entitiesStore.validarDocumentoCliente();
    isDocumentoLoading.value = false;
  }
}
async function handleEditarCliente(val: number) {
  if (val) {
    if (!props.isPricing) {
      Swal.fire({
        icon: "question",
        html: "<b>¿Desea cargar los datos del cliente seleccionado?</b>",
        showCancelButton: true,
        confirmButtonColor: "#3085d6",
        cancelButtonColor: "#d33",
        confirmButtonText: "Si",
        cancelButtonText: "No",
      }).then((result) => {
        if (result.isConfirmed) {
          router.push({
            name: "editarCliente",
            params: { id: val },
          });

          setTimeout(() => window.location.reload(), 10);
        }
      });
    } else {
      Swal.fire({
        icon: "question",
        html: "<b>¿Desea cargar los datos del cliente seleccionado?</b>",
        showCancelButton: true,
        confirmButtonColor: "#3085d6",
        cancelButtonColor: "#d33",
        confirmButtonText: "Si",
        cancelButtonText: "No",
      }).then((result) => {
        if (result.isConfirmed) {
          const item =
            entitiesStore.lstProveedores_x_nombre.filter(
              (v) => v.id == val,
            )[0]!;
          pricingStore.datosPrincipales.id_entitie = item.id;
          pricingStore.datosPrincipales.nombre =
            item.nombrecompleto;
          pricingStore.datosPrincipales.telefono =
            item.telefono;
          rootStore.state.modalEntitie = false;
          rootStore.state.registroClienteFlag =
            !rootStore.state.registroClienteFlag;
          // setTimeout(() => window.location.reload(), 10);
        }
      });
    }
  }
}
function validarCorreoElectronico(v: string) {
  if (
    v &&
    !/^(([^<>()[\]\\.,;:\s@']+(\.[^<>()\\[\]\\.,;:\s@']+)*)|('.+'))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/.test(
      v,
    )
  ) {
    return "Debe ingresar un correo electrónico válido";
  }

  return true;
}
function validarConvenioActual() {
  const { convenioActual } = entitiesStore.cliente;
  if (convenioActual.dias_credito > 0) {
    if (!convenioActual.fecha) {
      Swal.fire({
        icon: "info",
        text: "Si desea agregar como convenio actual, es necesario llenar la fecha del convenio",
      });
    } else {
      if (
        entitiesStore.lstConvenios.indexOf(convenioActual) === -1
      ) {
        entitiesStore.lstConvenios.push(convenioActual);
      }
    }
  }
}
function validarTelefonoActual() {
  const { telefonoActual } = entitiesStore.cliente;
  if (telefonoActual.id_tipotelefono && telefonoActual.telefono) {
    const index = entitiesStore.lstTelefonos.findIndex(
      (v) =>
        v.id_tipotelefono == telefonoActual.id_tipotelefono &&
        v.telefono == telefonoActual.telefono,
    );
    if (index === -1) {
      entitiesStore.lstTelefonos.push(telefonoActual);
    }
  }
}
function validarContactoActual() {
  const { contactoActual } = entitiesStore.cliente;
  if (
    contactoActual.nombre &&
    contactoActual.id_tipotelefono &&
    contactoActual.telefono
  ) {
    const index = entitiesStore.lstContactos.findIndex(
      (v) =>
        v.nombre == contactoActual.nombre &&
        v.id_tipotelefono == contactoActual.id_tipotelefono &&
        v.telefono == contactoActual.telefono,
    );
    if (index === -1) {
      entitiesStore.lstContactos.push(contactoActual);
    }
  }
}
async function subirArchivoConvenio() {
  if (fileinput.value) {
    isFileLoading.value = true;
    await filesStore._uploadFile(fileinput.value as File);
    isFileLoading.value = false;

    if (filesStore.payPath) {
      Swal.fire({
        icon: "success",
        text: "Archivo cargado",
      });

      entitiesStore.lstConvenios.map((item) => {
        if (item.id == entitiesStore.cliente.convenioActual.id) {
          item["id_path"] = filesStore.payPath;
        }

        return item;
      });
    } else {
      Swal.fire({
        icon: "error",
        text: "Comuníquese con el administrador",
      });
    }
  }
}
async function validarFormulario() {
  if ((await formDatosCliente.value!.validate()).valid) {
    validarConvenioActual();
    validarTelefonoActual();
    validarContactoActual();

    entitiesStore.stepper = 2;
  }
}
function isClienteInternacional() {
  const val = masterusuariosStore.lstTipoTransaccion.some(
    (v: TipoTransaccion) => {
      return (
        v.codigo == "02" &&
        v.id == entitiesStore.cliente.id_tipotransaccion
      );
    },
  );
  return val;
}
async function modificarCliente() {
  // Si está en modo solo lectura, pasar a modo edición y no guardar todavía
  if (isFormReadonly.value) {
    entitiesStore.isReadonly = false;
    entitiesStore.isEdit = true;
    Swal.fire({
      icon: "info",
      text: "Ahora puede modificar los datos del cliente",
    });
    return;
  }

  entitiesStore.isStep1Valid = true;
  entitiesStore.isStep2Valid = true;
  entitiesStore.isStep3Valid = true;
  entitiesStore.isStep4Valid = true;
  entitiesStore.isStep5Valid = true;
  entitiesStore.isStep6Valid = true;

  let okStep1 = true;
  if (entitiesStore.cliente) {
    if (!entitiesStore.cliente.id_tipopersona) {
      okStep1 = false;
    }
    if (!entitiesStore.cliente.nombrecompleto) {
      okStep1 = false;
    }
    if (!entitiesStore.cliente.id_tipotransaccion) {
      okStep1 = false;
    }
    if (!entitiesStore.cliente.id_pais) {
      okStep1 = false;
    }
    if (
      entitiesStore.cliente.emailaddress &&
       
      !/^(([^<>()\[\]\\.,;:\s@']+(\.[^<>()\\\[\\]\\.,;:\s@']+)*)|('.+'))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/.test(
        entitiesStore.cliente.emailaddress,
      )
    ) {
      okStep1 = false;
    }
  }

  let okStep2_1 = true;
  if (entitiesStore.lstTelefonos.length > 0) {
    entitiesStore.lstTelefonos.map((v) => {
      if (!v.id_tipotelefono) {
        okStep2_1 = false;
      }
      if (!v.telefono) {
        okStep2_1 = false;
      }
    });
  }

  let okStep2_2 = true;
  if (entitiesStore.lstContactos.length > 0) {
    entitiesStore.lstContactos.map((v) => {
      if (!v.nombre) {
        okStep2_2 = false;
      }
      if (!v.id_tipotelefono) {
        okStep2_2 = false;
      }
      if (!v.telefono) {
        okStep2_2 = false;
      }
    });
  }

  let okStep3_1 = true;
  if (entitiesStore.lstConvenios.length > 0) {
    entitiesStore.lstConvenios.map((v) => {
      if (!v.fecha) {
        okStep3_1 = false;
      }
      if (v.dias_credito < 0) {
        okStep3_1 = false;
      }
      if (
        v.email_soporte &&
         
        !/^(([^<>()\[\]\\.,;:\s@']+(\.[^<>()\\\[\\]\\.,;:\s@']+)*)|('.+'))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/.test(
          v.email_soporte,
        )
      ) {
        okStep3_1 = false;
      }
    });
  }

  let okStep3_2 = true;
  if (entitiesStore.lstTarifas.length > 0) {
    entitiesStore.lstTarifas.map((v) => {
      if (!v.fecha) {
        okStep3_2 = false;
      }
      if (!v.codigo) {
        okStep3_2 = false;
      }
      if (
        v.email_soporte &&
         
        !/^(([^<>()\[\]\\.,;:\s@']+(\.[^<>()\\\[\\]\\.,;:\s@']+)*)|('.+'))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/.test(
          v.email_soporte,
        )
      ) {
        okStep3_2 = false;
      }
      if (v.tarifa < 0) {
        okStep3_2 = false;
      }
    });
  }

  let okStep4 = true;
  if (entitiesStore.lstInformacionBancaria.length > 0) {
    entitiesStore.lstInformacionBancaria.map((v) => {
      if (!v.nro_cuenta) {
        okStep4 = false;
      }
      if (!v.cci) {
        okStep4 = false;
      }
      if (!v.id_banco) {
        okStep4 = false;
      }
      if (!v.id_coins) {
        okStep4 = false;
      }
      if (isClienteInternacional()) {
        if (!v.nro_swift) {
          okStep4 = false;
        }
        if (!v.id_intermediario) {
          okStep4 = false;
        }
        if (!v.nro_cuenta_intermediario) {
          okStep4 = false;
        }
      }
    });
  }

  if (!okStep1) {
    entitiesStore.isStep1Valid =
      !entitiesStore.isStep1Valid;
  } else if (!okStep2_1 || !okStep2_2) {
    entitiesStore.isStep2Valid =
      !entitiesStore.isStep2Valid;
  } else if (!okStep3_1 || !okStep3_2) {
    entitiesStore.isStep3Valid =
      !entitiesStore.isStep3Valid;
  } else if (!okStep4) {
    entitiesStore.isStep4Valid =
      !entitiesStore.isStep4Valid;
  } else {
    rootStore.state.spiner = true;
    await entitiesStore.actualizarCliente();
    rootStore.state.spiner = false;
    rootStore.state.recargarClienteFlag =
      !rootStore.state.recargarClienteFlag;
    rootStore.state.modalEntitie = false;

    // Volver a modo solo lectura después de guardar correctamente
    entitiesStore.isReadonly = true;
    entitiesStore.isEdit = false;
  }
}
function getPrefix() {
  const pais = (rootStore.state.itemsPais as Pais[]).find(
    (v) => v.id == entitiesStore.cliente.id_pais,
  );
  if (pais) {
    return   pais.phoneprefix ;
  }
  return "+xx";
}
function obtenerFlag() {
  const pais = (rootStore.state.itemsPais as Pais[]).find(
    (v) => v.id == entitiesStore.cliente.id_pais,
  );
  let flag = "";
  if (pais) {
    flag = `https://flagcdn.com/w40/${pais.codigo_iso!.toLowerCase()}.png`;
  }
  return flag;
}

onMounted(async () => {
  await rootStore.dispatch("cargarClientes");
});

// Stray component option that Vue never called; kept as dead code.
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function isPricingOption() {
  console.log("isPricing", props.isPricing);
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
              <!-- @vue-expect-error Kept: showNombreFiscal is undefined, so the row never shows. -->
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
                    :items="rootStore.state.itemsPais"
                    label="País"
                    :rules="[(v) => !!v || 'Dato Requerido']"
                    v-model="entitiesStore.cliente.id_pais"
                    @update:model-value="rootStore.dispatch('_getState', entitiesStore.cliente.id_pais)"
                  />
                </v-col>
                <v-col
                  cols="12"
                  md="6"
                >
                  <v-autocomplete
                    density="compact"
                    variant="outlined"
                    :items="rootStore.state.itemsState"
                    item-title="name"
                    item-value="id"
                    label="Región / Estado"
                    v-model="entitiesStore.cliente.id_ciudad"
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
                    :error-messages="
                      !entitiesStore.cliente.telefonoActual
                        .id_tipotelefono
                        ? 'Dato Requerido'
                        : ''
                    "
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
                    :error-messages="
                      !entitiesStore.cliente.telefonoActual.telefono
                        ? 'Dato Requerido'
                        : ''
                    "
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
      v-if="!showNavigationButtons"
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
