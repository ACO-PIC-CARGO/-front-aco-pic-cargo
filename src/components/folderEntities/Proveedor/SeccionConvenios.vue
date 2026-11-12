<script setup lang="ts">
import { computed, ref, useTemplateRef, watch } from "vue";
import { useAppStore } from "@/stores/app";
import Swal from "sweetalert2";
import moment from "moment";
import { useEntitiesStore } from "@/stores/entities";
import type { ConvenioEntidad, TarifaEntidad } from "@/types/entidades";
import { useFilesStore } from "@/stores/files";
import { removeRow } from "../removeRow";
import { entityEditAllowed } from "@/components/folderEntities/entityEditAllowed";
import ClienteCard from "../Cliente/ClienteCard.vue";
import "../Cliente/clienteCards.css";

// Inside the provider card, its header and footer hold Editar/Continuar/Guardar, so `embedded` hides this section's own.
const props = withDefaults(defineProps<{ embedded?: boolean }>(), { embedded: false });

const appStore = useAppStore();
const editAllowed = entityEditAllowed("listProveedor");
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
const showOwnEditButton = computed(() => !props.embedded && !showNavigationButtons.value && editAllowed);
// The Acciones column only holds the delete button, which exists while editing.
function visibleHeaders<T extends { key: string }>(headers: readonly T[]) {
  return showFormActions.value ? headers : headers.filter((header) => header.key !== "action");
}

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
      entitiesStore.proveedor.convenioActual = newValue[0];
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
  });
}
function eliminarConvenio(row: ConvenioEntidad) {
  removeRow(entitiesStore.lstConvenios, row);
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
  });
}
function eliminarTarifa(row: TarifaEntidad) {
  removeRow(entitiesStore.lstTarifas, row);
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

      item.id_path = filesStore.payPath;
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

      item.id_path = filesStore.payPath;
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
    const saved = await entitiesStore.actualizarProveedor();
    appStore.spiner = false;
    if (!saved) return;

    // Volver a modo solo lectura después de guardar correctamente
    entitiesStore.isReadonly = true;
    entitiesStore.isEdit = false;
  }
}

// Inside the provider card, its Continuar runs this step's checks (they move on to the next step when they pass).
defineExpose({ validarFormulario });
</script>

<template>
  <div class="cli-section">
    <div
      v-if="showOwnEditButton"
      class="d-flex justify-end mb-3"
    >
      <v-btn
        class="cli-add-btn"
        variant="outlined"
        prepend-icon="mdi-pencil-outline"
        @click="modificarProveedor"
      >
        {{ isFormReadonly ? "Editar Proveedor" : "Guardar Cambios" }}
      </v-btn>
    </div>

    <!-- ===== CONVENIOS ===== -->
    <ClienteCard
      title="Convenios"
      icon="mdi-handshake-outline"
    >
      <template
        v-if="showFormActions"
        #actions
      >
        <v-btn
          class="cli-add-btn"
          variant="outlined"
          prepend-icon="mdi-plus"
          @click="agregarConvenio()"
        >
          Agregar convenio
        </v-btn>
      </template>
      <v-form
        ref="formConvenios"
        :readonly="isFormReadonly"
      >
        <v-data-table
          :headers="visibleHeaders(headersConvenios)"
          :items="entitiesStore.lstConvenios"
          class="cli-table"
          item-value="index"
          density="comfortable"
          items-per-page-text="Filas por página:"
          no-data-text="Sin convenios registrados."
          disable-sort
        >
          <template #[`item.fecha`]="{ item }">
            <v-text-field
              v-if="showFormActions"
              v-model="item.fecha"
              aria-label="Fecha del convenio"
              type="date"
              density="compact"
              variant="outlined"
              hide-details="auto"
              :rules="[(v) => !!v || 'Dato Requerido']"
            />
            <template v-else>
              {{ item.fecha }}
            </template>
          </template>

          <template #[`item.dias_credito`]="{ item }">
            <v-text-field
              v-if="showFormActions"
              v-model="item.dias_credito"
              aria-label="Días para crédito"
              type="number"
              suffix="días"
              density="compact"
              variant="outlined"
              hide-details="auto"
              :rules="[
                (v) =>
                  v >= 0 ||
                  'Es necesario que ponga un número entero positivo',
              ]"
            />
            <template v-else>
              {{ item.dias_credito }} días
            </template>
          </template>

          <template #[`item.email_soporte`]="{ item }">
            <div
              v-if="showFormActions"
              class="d-flex align-center"
            >
              <v-text-field
                v-model="item.email_soporte"
                aria-label="Email soporte del convenio"
                density="compact"
                variant="outlined"
                hide-details="auto"
                :rules="[(v) => validarCorreoElectronico(v)]"
              />
              <v-file-input
                accept=".xlsx,.xls,.doc,.docx,.ppt,.pptx,.txt,.pdf,.gif,.jpg,.jpeg,.png"
                label="Adjuntar Archivo"
                hide-input
                hide-details
                class="customFile"
                v-model="fileinput"
                @update:model-value="subirArchivoConvenio(item)"
              />
            </div>
            <span
              v-else-if="item.email_soporte"
              class="cli-link"
            >
              <v-icon
                icon="mdi-email-outline"
                size="18"
              />
              {{ item.email_soporte }}
            </span>
          </template>

          <template #[`item.action`]="{ item }">
            <v-btn
              class="cli-row-delete"
              variant="flat"
              size="small"
              icon="mdi-delete-outline"
              aria-label="Eliminar convenio"
              @click="eliminarConvenio(item)"
            />
          </template>
        </v-data-table>
      </v-form>
    </ClienteCard>

    <!-- ===== TARIFAS ===== -->
    <ClienteCard
      title="Tarifas"
      icon="mdi-tag-outline"
    >
      <template
        v-if="showFormActions"
        #actions
      >
        <v-btn
          class="cli-add-btn"
          variant="outlined"
          prepend-icon="mdi-plus"
          @click="agregarTarifa()"
        >
          Agregar tarifa
        </v-btn>
      </template>
      <v-form
        ref="formTarifas"
        :readonly="isFormReadonly"
      >
        <v-data-table
          :headers="visibleHeaders(headersTarifas)"
          :items="entitiesStore.lstTarifas"
          class="cli-table"
          item-value="index"
          density="comfortable"
          items-per-page-text="Filas por página:"
          no-data-text="Sin tarifas registradas."
          disable-sort
        >
          <template #[`item.fecha`]="{ item }">
            <v-text-field
              v-if="showFormActions"
              v-model="item.fecha"
              aria-label="Fecha de la tarifa"
              type="date"
              density="compact"
              variant="outlined"
              hide-details="auto"
              :rules="[(v) => !!v || 'Dato Requerido']"
            />
            <template v-else>
              {{ item.fecha }}
            </template>
          </template>

          <template #[`item.codigo`]="{ item }">
            <v-text-field
              v-if="showFormActions"
              v-model="item.codigo"
              aria-label="Código de la tarifa"
              density="compact"
              variant="outlined"
              hide-details="auto"
              :rules="[(v) => !!v || 'Dato Requerido']"
            />
            <template v-else>
              {{ item.codigo }}
            </template>
          </template>

          <template #[`item.email_soporte`]="{ item }">
            <div
              v-if="showFormActions"
              class="d-flex align-center"
            >
              <v-text-field
                v-model="item.email_soporte"
                aria-label="Email soporte de la tarifa"
                density="compact"
                variant="outlined"
                hide-details="auto"
                :rules="[(v) => validarCorreoElectronico(v)]"
              />
              <v-file-input
                accept=".xlsx,.xls,.doc,.docx,.ppt,.pptx,.txt,.pdf,.gif,.jpg,.jpeg,.png"
                label="Adjuntar Archivo"
                hide-input
                hide-details
                class="customFile"
                v-model="fileinput"
                @update:model-value="subirArchivoTarifa(item)"
              />
            </div>
            <span
              v-else-if="item.email_soporte"
              class="cli-link"
            >
              <v-icon
                icon="mdi-email-outline"
                size="18"
              />
              {{ item.email_soporte }}
            </span>
          </template>

          <template #[`item.tarifa`]="{ item }">
            <v-text-field
              v-if="showFormActions"
              v-model="item.tarifa"
              aria-label="Tarifa"
              density="compact"
              variant="outlined"
              hide-details="auto"
            />
            <template v-else>
              {{ item.tarifa }}
            </template>
          </template>

          <template #[`item.action`]="{ item }">
            <v-btn
              class="cli-row-delete"
              variant="flat"
              size="small"
              icon="mdi-delete-outline"
              aria-label="Eliminar tarifa"
              @click="eliminarTarifa(item)"
            />
          </template>
        </v-data-table>
      </v-form>
    </ClienteCard>

    <div
      v-if="showNavigationButtons && !embedded"
      class="d-flex mt-4"
    >
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
    </div>
  </div>
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
