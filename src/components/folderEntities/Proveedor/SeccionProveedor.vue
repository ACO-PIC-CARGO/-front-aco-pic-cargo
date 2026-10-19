<script setup lang="ts">
import { computed, onMounted, ref, useTemplateRef, watch } from "vue";
import { useRouter } from "vue-router";
import { useStore } from "vuex";
import Swal from "sweetalert2";
import CustomAutocomplete from "../CustomAutocomplete.vue";
import { useEntitiesStore } from "@/stores/entities";
import { useMasterusuariosStore } from "@/stores/masterusuarios";
import type { RolProveedor } from "@/types/entidades";

const props = withDefaults(defineProps<{ isPricing?: boolean }>(), { isPricing: false });
const emit = defineEmits<{ ObtenerProveedor: [id: number] }>();

const router = useRouter();
const rootStore = useStore();
const entitiesStore = useEntitiesStore();
const masterusuariosStore = useMasterusuariosStore();

const correoErrors = "";
const correoConvenioActualErrors = "";
const productoErrors = "";
const fileinput = ref<File | File[] | null>(null);
const isFileLoading = ref(false);
const isNombreLoading = ref(false);
const isDocumentoLoading = ref(false);
const formProv_datosProveedor = useTemplateRef("formProv_datosProveedor");

const isNroDocumentoDisabled = computed(() => {
  return !entitiesStore.proveedor.id_tipodocumento;
});
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const isProductoDisabled = computed(() => {
  return !isShipper();
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
const showDiasSobreestadia = computed(() => {
  return isNaviera();
});
const showDiasAlmacenaje = computed(() => {
  return isAlmacen();
});

watch(
  () => entitiesStore.isStep1Valid,
  async (newValue) => {
    if (!newValue) {
      await formProv_datosProveedor.value!.validate();
    }
  },
  { immediate: true },
);

function isShipper() {
  const val = (rootStore.state.itemsDataRoleList as RolProveedor[]).some((v) => {
    const item = (v.name.split("-")[1] || "").trim().toUpperCase();
    return (
      v.id == entitiesStore.proveedor.id_tipoproveedor &&
      item == "SHIPPER"
    );
  });

  return val;
}
function isNaviera() {
  const val = (rootStore.state.itemsDataRoleList as RolProveedor[]).some((v) => {
    const item = (v.name.split("-")[1] || "").trim().toUpperCase();
    return (
      v.id == entitiesStore.proveedor.id_tipoproveedor &&
      item == "NAVIERA"
    );
  });

  return val;
}
function isAlmacen() {
  const val = (rootStore.state.itemsDataRoleList as RolProveedor[]).some((v) => {
    const item = (v.name.split("-")[1] || "").trim().toUpperCase();
    return (
      v.id == entitiesStore.proveedor.id_tipoproveedor &&
      item == "ALMACEN"
    );
  });

  return val;
}
async function handleNombre(val: string) {
  entitiesStore.lstProveedores_x_nombre = [];
  entitiesStore.proveedor.nombrecompleto = val;
  if (entitiesStore.proveedor.nombrecompleto) {
    isNombreLoading.value = true;
    await entitiesStore.validarNombreProveedor();
    isNombreLoading.value = false;
  }
}
async function handleDocumento(val: string) {
  entitiesStore.lstProveedores_x_documento = [];
  entitiesStore.proveedor.nro_documento = val;
  if (entitiesStore.proveedor.nro_documento) {
    isDocumentoLoading.value = true;
    await entitiesStore.validarDocumentoProveedor();
    isDocumentoLoading.value = false;
  }
}
async function handleEditarProveedor(val: number) {
  if (val) {
    Swal.fire({
      icon: "question",
      html: "<b>¿Desea cargar los datos del proveedor seleccionado?</b>",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: "Si",
      cancelButtonText: "No",
    }).then((result) => {
      if (result.isConfirmed) {
        if (!props.isPricing) {
          router.push({
            name: "editarProveedor",
            params: { id: val },
          });

          setTimeout(() => window.location.reload(), 10);
        } else {
          emit("ObtenerProveedor", val);
        }
      }
    });
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
function validarProducto(v: string) {
  if (isShipper() && !v) {
    return "Dato Requerido";
  }

  return true;
}
function validarConvenioActual() {
  const { convenioActual } = entitiesStore.proveedor;
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
  const { telefonoActual } = entitiesStore.proveedor;
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
  const { contactoActual } = entitiesStore.proveedor;
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
    await rootStore.dispatch("_uploadFile", fileinput.value);
    isFileLoading.value = false;

    if (rootStore.state.files.payPath) {
      Swal.fire({
        icon: "success",
        text: "Archivo cargado",
      });

      entitiesStore.lstConvenios.map((item) => {
        if (
          item.id == entitiesStore.proveedor.convenioActual.id
        ) {
          item["id_path"] = rootStore.state.files.payPath;
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
  if ((await formProv_datosProveedor.value!.validate()).valid) {
    validarConvenioActual();
    validarTelefonoActual();
    validarContactoActual();

    entitiesStore.stepper = 2;
  }
}
function isProveedorInternacional() {
  const val = masterusuariosStore.lstTipoTransaccion.some(
    (v) => {
      return (
        v.codigo == "02" &&
        v.id == entitiesStore.proveedor.id_tipotransaccion
      );
    },
  );
  return val;
}
async function modificarProveedor() {
  // Si está en modo solo lectura, pasar a modo edición y no guardar todavía
  if (isFormReadonly.value) {
    entitiesStore.isReadonly = false;
    entitiesStore.isEdit = true;
    Swal.fire({
      icon: "info",
      text: "Ahora puede modificar los datos del proveedor",
    });
    return;
  }

  entitiesStore.isStep1Valid = true;
  entitiesStore.isStep2Valid = true;
  entitiesStore.isStep3Valid = true;
  entitiesStore.isStep4Valid = true;

  let okStep1 = true;
  if (entitiesStore.proveedor) {
    if (!entitiesStore.proveedor.nombrecompleto) {
      okStep1 = false;
    }
    if (!entitiesStore.proveedor.id_tipoproveedor) {
      okStep1 = false;
    }
    if (!entitiesStore.proveedor.id_tipotransaccion) {
      okStep1 = false;
    }
    if (!entitiesStore.proveedor.id_pais) {
      okStep1 = false;
    }
    if (
      entitiesStore.proveedor.emailaddress &&
      !/^(([^<>()[\]\\.,;:\s@']+(\.[^<>()\\[\]\\.,;:\s@']+)*)|('.+'))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/.test(
        entitiesStore.proveedor.emailaddress,
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
        !/^(([^<>()[\]\\.,;:\s@']+(\.[^<>()\\[\]\\.,;:\s@']+)*)|('.+'))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/.test(
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
        !/^(([^<>()[\]\\.,;:\s@']+(\.[^<>()\\[\]\\.,;:\s@']+)*)|('.+'))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/.test(
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
      if (isProveedorInternacional()) {
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
    await entitiesStore.actualizarProveedor();
    rootStore.state.spiner = false;

    // Volver a modo solo lectura después de guardar correctamente
    entitiesStore.isReadonly = true;
    entitiesStore.isEdit = false;
  }
}

onMounted(async () => {
  await rootStore.dispatch("cargarClientes");
  console.log("isPricing", props.isPricing);
});
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
        {{ isFormReadonly ? "EDITAR PROVEEDOR" : "GUARDAR CAMBIOS" }}
      </v-btn>
    </v-card-title>
    <v-card-text>
      <div class="container-narrow">
        <v-form
          ref="formProv_datosProveedor"
          :readonly="isFormReadonly"
        >
          <v-row>
            <v-col cols="12">
              <!--<v-row>
              <v-col cols="12">
                <v-text-field dense label="Nombre Comercial o Razón Social" :rules="[
                  (v) => !!v || 'Dato Requerido',
                  (v) => (v && v.length >= 3) || 'Debe tener al menos 3 caracteres'
                ]" v-model="$store.state.entities.proveedor.nombrecompleto"></v-text-field>
              </v-col>
            </v-row>-->

              <!--CUSTOM AUTOCOMPLETE-->
              <v-list-subheader class="px-0 font-weight-bold">
                Identificación del Proveedor
              </v-list-subheader>
              <v-row>
                <v-col cols="12">
                  <CustomAutocomplete
                    :items="entitiesStore.lstProveedores_x_nombre"
                    label="Nombre Comercial o Razón Social"
                    :value="entitiesStore.proveedor.nombrecompleto"
                    @search="handleNombre"
                    @id="handleEditarProveedor"
                    :loading="isNombreLoading"
                    :rules="[(v) => !!v || 'Dato Requerido']"
                    :disabled="false"
                  />
                </v-col>
              </v-row>
              <v-row>
                <v-col
                  cols="12"
                  md="6"
                >
                  <v-autocomplete
                    density="compact"
                    variant="outlined"
                    :items="rootStore.state.itemsDataRoleList"
                    item-title="name"
                    item-value="id"
                    label="Tipo de Proveedor"
                    :rules="[(v) => !!v || 'Dato Requerido']"
                    v-model="entitiesStore.proveedor.id_tipoproveedor"
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
                    v-model="entitiesStore.proveedor.id_tipotransaccion"
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
                    :items="rootStore.state.itemsDocumentsPais"
                    item-title="description"
                    item-value="id"
                    label="Tipo de Documento Fiscal"
                    v-model="entitiesStore.proveedor.id_tipodocumento"
                  />
                </v-col>
                <v-col
                  cols="12"
                  md="6"
                >
                  <!--<v-text-field 
                  dense 
                  label="Nro De Documento" 
                  v-model="$store.state.entities.proveedor.nro_documento"
                  :disabled="isNroDocumentoDisabled"
                ></v-text-field>-->
                  <CustomAutocomplete
                    :items="entitiesStore.lstProveedores_x_documento"
                    label="Nro De Documento"
                    :value="entitiesStore.proveedor.nro_documento"
                    @search="handleDocumento"
                    @id="handleEditarProveedor"
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
                    v-model="entitiesStore.proveedor.id_pais"
                    @update:model-value="rootStore.dispatch('_getState', entitiesStore.proveedor.id_pais)"
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
                    v-model="entitiesStore.proveedor.id_ciudad"
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
                    v-model="entitiesStore.proveedor.direccion"
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
                    v-model="entitiesStore.proveedor.emailaddress"
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
                      entitiesStore.proveedor.convenioActual
                        .dias_credito
                    "
                    label="Días de Crédito para el Pago"
                    :rules="[
                      (v) => v >= 0 || 'Debe ser un número entero positivo',
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
                    v-model="
                      entitiesStore.proveedor.convenioActual.fecha
                    "
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
                      entitiesStore.proveedor.convenioActual
                        .email_soporte
                    "
                    label="Email Soporte"
                    :rules="[
                      (v) => !!v || 'Dato Requerido',
                      (v) => validarCorreoElectronico(v),
                    ]"
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
                      entitiesStore.proveedor.telefonoActual
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
                      entitiesStore.proveedor.telefonoActual.telefono
                    "
                    @change="validarTelefonoActual"
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
                      entitiesStore.proveedor.contactoActual.nombre
                    "
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
                      entitiesStore.proveedor.contactoActual
                        .id_tipotelefono
                    "
                    @update:model-value="validarContactoActual"
                  />
                </v-col>
                <v-col
                  cols="12"
                  md="4"
                >
                  <v-text-field
                    density="compact"
                    variant="outlined"
                    label="Teléfono"
                    v-model="
                      entitiesStore.proveedor.contactoActual.telefono
                    "
                    @change="validarContactoActual"
                  />
                </v-col>
              </v-row>

              <!--PRODUCTO QUE VENDE-->
              <v-list-subheader class="px-0 font-weight-bold mt-2">
                Producto
              </v-list-subheader>
              <v-row>
                <v-col cols="12">
                  <v-textarea
                    density="compact"
                    variant="outlined"
                    rows="2"
                    label="Producto que vende"
                    :rules="[(v) => validarProducto(v)]"
                    :error-messages="productoErrors"
                    v-model="entitiesStore.proveedor.producto"
                  />
                </v-col>
              </v-row>

              <!--DÍAS LIBRES DE SOBREESTADÍA-->
              <v-list-subheader class="px-0 font-weight-bold mt-2">
                Condiciones del Servicio
              </v-list-subheader>
              <v-row v-show="showDiasSobreestadia">
                <v-col
                  cols="12"
                  md="6"
                >
                  <v-text-field
                    density="compact"
                    variant="outlined"
                    type="number"
                    label="Días Libres de Sobreestadía"
                    :rules="[
                      (v) => v >= 0 || 'Debe ser un número entero positivo',
                    ]"
                    v-model="entitiesStore.proveedor.dias_sobreestadia"
                  />
                </v-col>
              </v-row>

              <!--DÍAS LIBRES DE ALMACENAJE-->
              <v-row v-show="showDiasAlmacenaje">
                <v-col
                  cols="12"
                  md="6"
                >
                  <v-text-field
                    density="compact"
                    variant="outlined"
                    type="number"
                    label="Días Libres de Almacenaje"
                    :rules="[
                      (v) => v >= 0 || 'Debe ser un número entero positivo',
                    ]"
                    v-model="entitiesStore.proveedor.dias_almacenaje"
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
                    v-model="entitiesStore.proveedor.notas"
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
        @click="modificarProveedor"
      >
        <v-icon
          start
          size="small"
        >
          mdi-account-edit
        </v-icon>
        {{ isFormReadonly ? "EDITAR PROVEEDOR" : "GUARDAR CAMBIOS" }}
      </v-btn>
    </v-card-actions>
    <v-card-actions v-if="showNavigationButtons">
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
