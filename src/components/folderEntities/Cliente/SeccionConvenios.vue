<script setup lang="ts">
import { computed, ref, useTemplateRef, watch } from "vue";
import { useAppStore } from "@/stores/app";
import Swal from "sweetalert2";
import moment from "moment";
import { useEntitiesStore } from "@/stores/entities";
import type { ConvenioEntidad, TarifaEntidad } from "@/types/entidades";
import { useFilesStore } from "@/stores/files";

const appStore = useAppStore();
const filesStore = useFilesStore();
const entitiesStore = useEntitiesStore();

const headersConvenios = [
  { title: "Fecha", key: "fecha", width: "20%" },
  { title: "Días para Crédito", key: "dias_credito", width: "30%" },
  { title: "Email Soporte", key: "email_soporte", width: "40%" },
  { title: "Acciones", key: "action", width: "10%" },
] as const;
const headersTarifas = [
  { title: "Fecha", key: "fecha", width: "20%" },
  { title: "Código", key: "codigo", width: "20%" },
  { title: "Email Soporte", key: "email_soporte", width: "30%" },
  { title: "Tarifa", key: "tarifa", width: "20%" },
  { title: "Acciones", key: "action", width: "10%" },
] as const;
const fileinput = ref<File | File[] | null>(null);
const isFileLoading = ref(false);
const formConvenios = useTemplateRef("formConvenios");
const formTarifas = useTemplateRef("formTarifas");

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
  () => entitiesStore.isStep3Valid,
  async (newValue) => {
    if (!newValue) {
      await formConvenios.value!.validate();
      await formTarifas.value!.validate();
    }
  },
  { immediate: true },
);
watch(
  () => entitiesStore.lstConvenios,
  (newValue) => {
    if (newValue[0]) {
      entitiesStore.cliente.convenioActual = newValue[0];
    }
  },
  { deep: true },
);

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
function agregarConvenio() {
  entitiesStore.lstConvenios.push({
    fecha: moment().format("YYYY-MM-DD"),
    dias_credito: 0,
    email_soporte: "",
    id_path: "",
  });
}
function eliminarConvenio(index: number) {
  entitiesStore.lstConvenios.splice(index, 1);
}
function generarCodigoTarifa() {
  let codigoMaximo = 0;
  entitiesStore.lstTarifas.filter((v) => {
    const codigoParseado = v.codigo!.includes("T")
      ? parseInt(v.codigo!.slice(1))
      : parseInt(v.codigo!);

    if (codigoMaximo < codigoParseado) {
      codigoMaximo = codigoParseado;
    }
  });

  const codigo = (parseInt(String(codigoMaximo)) + 1).toString().padStart(5, "0");

  return "T".concat(codigo);
}
function agregarTarifa() {
  entitiesStore.lstTarifas.push({
    fecha: moment().format("YYYY-MM-DD"),
    codigo: generarCodigoTarifa(),
    email_soporte: "",
    tarifa: 0,
    id_path: "",
  });
}
function eliminarTarifa(index: number) {
  entitiesStore.lstTarifas.splice(index, 1);
}
async function subirArchivoConvenio(item: Partial<ConvenioEntidad> = {}) {
  if (fileinput.value) {
    isFileLoading.value = true;
    await filesStore._uploadFile(fileinput.value as File);
    isFileLoading.value = false;

    if (filesStore.payPath) {
      Swal.fire({
        icon: "success",
        text: "Archivo cargado",
      });

      entitiesStore.lstConvenios.map((itemConvenio) => {
        if (itemConvenio.id == item.id) {
          itemConvenio["id_path"] = filesStore.payPath;
        }

        return itemConvenio;
      });
    } else {
      Swal.fire({
        icon: "error",
        text: "Comuníquese con el administrador",
      });
    }
  }
}
async function subirArchivoTarifa(item: Partial<TarifaEntidad> = {}) {
  if (fileinput.value) {
    isFileLoading.value = true;
    await filesStore._uploadFile(fileinput.value as File);
    isFileLoading.value = false;

    if (filesStore.payPath) {
      Swal.fire({
        icon: "success",
        text: "Archivo cargado",
      });

      entitiesStore.lstTarifas.map((itemTarifa) => {
        if (itemTarifa.id == item.id) {
          itemTarifa["id_path"] = filesStore.payPath;
        }

        return itemTarifa;
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
  let ok1 = true;
  if (entitiesStore.lstConvenios.length > 0) {
    if (!(await formConvenios.value!.validate()).valid) {
      ok1 = false;
    }
  }

  let ok2 = true;
  if (entitiesStore.lstTarifas.length > 0) {
    if (!(await formTarifas.value!.validate()).valid) {
      ok2 = false;
    }
  }

  if (ok1 && ok2) {
    entitiesStore.stepper = 4;
  }
}
async function modificarCliente() {
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

  let okStep3_1 = true;
  if (entitiesStore.lstConvenios.length > 0) {
    entitiesStore.lstConvenios.map((v) => {
      if (!v.fecha || v.dias_credito < 0) {
        okStep3_1 = false;
      }
    });
  }

  let okStep3_2 = true;
  if (entitiesStore.lstTarifas.length > 0) {
    entitiesStore.lstTarifas.map((v) => {
      if (!v.fecha || !v.codigo || v.tarifa < 0) {
        okStep3_2 = false;
      }
    });
  }

  if (!okStep3_1 || !okStep3_2) {
    entitiesStore.isStep3Valid = false;
    Swal.fire({
      icon: "warning",
      text: "Por favor complete todos los campos requeridos en Convenios y Tarifas",
    });
  } else {
    appStore.spiner = true;
    await entitiesStore.actualizarCliente();
    appStore.spiner = false;
    appStore.recargarClienteFlag =
      !appStore.recargarClienteFlag;
    appStore.modalEntitie = false;

    // Volver a modo solo lectura después de guardar correctamente
    entitiesStore.isReadonly = true;
    entitiesStore.isEdit = false;
  }
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
    <v-card-text class="px-2">
      <div class="container-narrow">
        <!-- ===== CONVENIOS ===== -->
        <v-list-subheader class="px-0">
          <b>Convenios</b>

          <template v-if="showFormActions">
            <v-btn
              color="primary"
              rounded
              size="small"
              class="ml-auto"
              @click="agregarConvenio()"
            >
              AGREGAR CONVENIO
            </v-btn>
          </template>
        </v-list-subheader>
        <v-row>
          <v-col cols="12">
            <v-form
              ref="formConvenios"
              :readonly="isFormReadonly"
            >
              <v-data-table
                :headers="headersConvenios"
                :items="entitiesStore.lstConvenios"
                class="elevation-5"
                item-value="index"
                disable-sort
              >
                <template #[`item.fecha`]="{ item }">
                  <v-text-field
                    type="date"
                    v-model="item.fecha"
                    :rules="[(v) => !!v || 'Dato Requerido']"
                  />
                </template>

                <template #[`item.dias_credito`]="{ item }">
                  <v-text-field
                    type="number"
                    suffix="días"
                    v-model="item.dias_credito"
                    :rules="[
                      (v) =>
                        v >= 0 ||
                        'Es necesario que ponga un número entero positivo',
                    ]"
                  />
                </template>

                <template #[`item.email_soporte`]="{ item }">
                  <div class="d-flex">
                    <v-text-field
                      v-model="item.email_soporte"
                      :rules="[(v) => validarCorreoElectronico(v)]"
                    />
                    <v-file-input
                      v-if="showFormActions"
                      accept=".xlsx,.xls,.doc,.docx,.ppt,.pptx,.txt,.pdf,.gif,.jpg,.jpeg,.png"
                      label="Adjuntar Archivo"
                      hide-input
                      class="customFile"
                      v-model="fileinput"
                      @update:model-value="subirArchivoConvenio(item)"
                    />
                  </div>
                </template>

                <template
                  #[`item.action`]="{ index }"
                  v-if="showFormActions"
                >
                  <v-btn
                    variant="text"
                    icon
                    color="red"
                    @click="eliminarConvenio(index)"
                  >
                    <v-icon>mdi-delete</v-icon>
                  </v-btn>
                </template>
              </v-data-table>
            </v-form>
          </v-col>
        </v-row>

        <br>

        <!-- ===== TARIFAS ===== -->
        <v-list-subheader class="px-0">
          <b>Tarifas</b>

          <template v-if="showFormActions">
            <v-btn
              color="primary"
              rounded
              size="small"
              class="ml-auto"
              @click="agregarTarifa()"
            >
              AGREGAR TARIFA
            </v-btn>
          </template>
        </v-list-subheader>
        <v-row>
          <v-col cols="12">
            <v-form
              ref="formTarifas"
              :readonly="isFormReadonly"
            >
              <v-data-table
                :headers="headersTarifas"
                :items="entitiesStore.lstTarifas"
                class="elevation-5"
                item-value="index"
                disable-sort
              >
                <template #[`item.fecha`]="{ item }">
                  <v-text-field
                    type="date"
                    v-model="item.fecha"
                    :rules="[(v) => !!v || 'Dato Requerido']"
                  />
                </template>

                <template #[`item.codigo`]="{ item }">
                  <v-text-field
                    v-model="item.codigo"
                    :rules="[(v) => !!v || 'Dato Requerido']"
                  />
                </template>

                <template #[`item.email_soporte`]="{ item }">
                  <div class="d-flex">
                    <v-text-field
                      v-model="item.email_soporte"
                      :rules="[(v) => validarCorreoElectronico(v)]"
                    />
                    <v-file-input
                      v-if="showFormActions"
                      accept=".xlsx,.xls,.doc,.docx,.ppt,.pptx,.txt,.pdf,.gif,.jpg,.jpeg,.png"
                      label="Adjuntar Archivo"
                      hide-input
                      class="customFile"
                      v-model="fileinput"
                      @update:model-value="subirArchivoTarifa(item)"
                    />
                  </div>
                </template>

                <template #[`item.tarifa`]="{ item }">
                  <v-text-field v-model="item.tarifa" />
                </template>

                <template
                  #[`item.action`]="{ index }"
                  v-if="showFormActions"
                >
                  <v-btn
                    variant="text"
                    icon
                    color="red"
                    @click="eliminarTarifa(index)"
                  >
                    <v-icon>mdi-delete</v-icon>
                  </v-btn>
                </template>
              </v-data-table>
            </v-form>
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
.customFile {
  flex-grow: 0 !important;
  flex-direction: row-reverse !important;
}
.customFile .v-input__prepend {
  margin-right: 0;
}
</style>
