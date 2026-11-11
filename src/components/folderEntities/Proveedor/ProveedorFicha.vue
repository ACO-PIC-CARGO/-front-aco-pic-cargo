<script setup lang="ts">
import { computed, onMounted, ref, useTemplateRef, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useAppStore } from "@/stores/app";
import ProveedorDatosContactos from "./ProveedorDatosContactos.vue";
import SeccionConvenios from "./SeccionConvenios.vue";
import SeccionInformacionBancaria from "./SeccionInformacionBancaria.vue";
import SeccionEmailTarifa from "./SeccionEmailTarifaComponent.vue";
import { useDatosProveedor } from "./useDatosProveedor";
import { entityEditAllowed } from "@/components/folderEntities/entityEditAllowed";
import { usePermissions } from "@/composables/usePermissions";
import type { DocumentoPais } from "@/types/catalogos";
import type { TipoTransaccion } from "@/types/entidades";
import { useCoinsStore } from "@/stores/coins";
import { useEntitiesStore } from "@/stores/entities";
import { useMasterusuariosStore } from "@/stores/masterusuarios";
import { useBankStore } from "@/stores/bank";

// Tab values keep the stepper numbering the sections already use (2 was Teléfonos, now part of the first tab).
const TABS = [
  { value: 1, title: "Datos del Proveedor", icon: "mdi-account-outline" },
  { value: 3, title: "Convenios y Tarifas", icon: "mdi-tag-outline" },
  { value: 4, title: "Información Bancaria", icon: "mdi-bank-outline" },
  { value: 5, title: "Correo para Pedir Tarifa", icon: "mdi-email-fast-outline" },
] as const;

// The provider's card, shared by Ver, Editar and Nuevo Proveedor. "editar" opens straight into editing;
// "nuevo" starts an empty provider and walks its tabs in order, checking each one.
// `isPricing`: a new provider inside a quote's dialog, which brings its own Guardar and close buttons.
const props = withDefaults(defineProps<{ mode?: "ver" | "editar" | "nuevo"; isPricing?: boolean }>(), {
  mode: "ver",
  isPricing: false,
});
// Inside a quote, picking an existing provider from the name/document matches hands it to the quote.
const emit = defineEmits<{ guardarProveedorExiste: [id: number] }>();

const route = useRoute();
const router = useRouter();
const appStore = useAppStore();
const bankStore = useBankStore();
const entitiesStore = useEntitiesStore();
const masterusuariosStore = useMasterusuariosStore();
const coinsStore = useCoinsStore();
const editAllowed = entityEditAllowed("listProveedor");
const { can } = usePermissions();
const { modificarProveedor, registrarProveedor } = useDatosProveedor(() => props.isPricing);
const isNuevo = props.mode === "nuevo";

entitiesStore.lstProveedores_x_nombre = [];
entitiesStore.lstProveedores_x_documento = [];

const editing = computed(() => !entitiesStore.isReadonly);
const inDialog = computed(() => isNuevo && props.isPricing);
const showSaveActions = computed(() => editing.value && !inDialog.value);
// A new provider is saved from the last tab, once every step before it passed its checks.
const showGuardar = computed(
  () => showSaveActions.value && (!isNuevo || (entitiesStore.stepper === 5 && can("listProveedor", "NUEVO"))),
);

// A new provider only reaches the tabs it has passed, like the old stepper.
const reachedTab = ref(1);
watch(
  () => entitiesStore.stepper,
  (step) => {
    reachedTab.value = Math.max(reachedTab.value, step);
  },
);
const tabLocked = (value: number) => isNuevo && value > reachedTab.value;

const datosTab = useTemplateRef<{ validarPaso: () => Promise<boolean> }>("datosTab");
const conveniosTab = useTemplateRef<{ validarFormulario: () => Promise<void> }>("conveniosTab");
const bancosTab = useTemplateRef<{ validarFormulario: () => void }>("bancosTab");

// Editar sits in the app bar, next to the title; without that bar (a dialog, a test) it stays above the tabs.
const HEADER_TARGET = "#house-header-actions";
const hasHeaderTarget = ref(Boolean(document.querySelector(HEADER_TARGET)));

// On a full reload the app bar mounts after this view, so wait for its slot.
function waitForHeaderTarget(attempts = 50) {
  if (hasHeaderTarget.value) return;
  if (document.querySelector(HEADER_TARGET)) {
    hasHeaderTarget.value = true;
    return;
  }
  if (attempts > 0) setTimeout(() => waitForHeaderTarget(attempts - 1), 100);
}

function showTitle() {
  // The new provider's view titles itself; inside a quote the app bar belongs to the screen behind.
  if (isNuevo) return;
  appStore.mainTitle = `${editing.value ? "EDITAR" : "VER"} PROVEEDOR: PROV - ${entitiesStore.proveedor.correlativo ?? ""}`;
}
watch(editing, showTitle);

const nextTab = computed(() => {
  const index = TABS.findIndex((tab) => tab.value === entitiesStore.stepper);
  return TABS[index + 1]?.value;
});

// Ver and Editar move freely; a new provider checks the current tab first, and each section's own check moves on.
async function continuar() {
  const next = nextTab.value;
  if (!next) return;
  if (!isNuevo) {
    entitiesStore.stepper = next;
    return;
  }
  if (entitiesStore.stepper === 1) {
    if (await datosTab.value?.validarPaso()) entitiesStore.stepper = next;
  } else if (entitiesStore.stepper === 3) await conveniosTab.value?.validarFormulario();
  else if (entitiesStore.stepper === 4) bancosTab.value?.validarFormulario();
}

function idPorDescripcion<T extends { id?: unknown }>(
  items: T[],
  text: (item: T) => string | undefined,
  criterio: string,
) {
  return items.find((item) => text(item)?.toUpperCase() === criterio)?.id ?? null;
}

// The same blank provider the old Nuevo Proveedor started from: a RUC and WhatsApp phones.
function startNewProvider() {
  const whatsapp = idPorDescripcion(
    masterusuariosStore.lstTipoTelefono,
    (v) => (v as TipoTransaccion).descripcion,
    "WHATSAPP",
  ) as string | number | null;
  Object.assign(entitiesStore.proveedor, {
    nombrecompleto: "",
    id_tipoproveedor: "",
    id_tipotransaccion: "56",
    nro_documento: "",
    id_pais: null,
    id_ciudad: 0,
    direccion: "",
    emailaddress: "",
    producto: "",
    dias_sobreestadia: 0,
    dias_almacenaje: 0,
    notas: "",
    proveedorprincipalflag: false,
    convenioActual: { dias_credito: 0, fecha: "", email_soporte: "", id_path: "" },
    telefonoActual: { id_tipotelefono: whatsapp, telefono: "" },
    contactoActual: { nombre: "", id_tipotelefono: whatsapp, telefono: "" },
    id_tipodocumento: idPorDescripcion(appStore.itemsDocumentsPais as DocumentoPais[], (v) => v.name, "RUC"),
  });
  entitiesStore.lstTelefonos = [];
  entitiesStore.lstContactos = [];
  entitiesStore.lstConvenios = [];
  entitiesStore.lstTarifas = [];
  entitiesStore.lstInformacionBancaria = [];
  entitiesStore.lstShippers = [];
  entitiesStore.lstEmails = [];
  entitiesStore.informacionEntrega = { status: true };
}

async function loadProvider() {
  await entitiesStore.getVerProveedor();
  await appStore._getState(entitiesStore.proveedor.id_pais);
}

async function cancelEdit() {
  if (isNuevo) {
    router.push({ name: "listProveedor" });
    return;
  }
  // Editar Proveedor has no read mode of its own: cancelling goes back to Ver Proveedor.
  if (props.mode === "editar") {
    router.push({ name: "verProveedor", params: { id: route.params.id } });
    return;
  }
  appStore.spiner = true;
  await loadProvider();
  appStore.spiner = false;
  entitiesStore.isReadonly = true;
  entitiesStore.isEdit = false;
}

// Saving flips a step's flag off when its data is incomplete: open that tab so its errors are in sight.
watch(
  () => [entitiesStore.isStep1Valid, entitiesStore.isStep2Valid] as const,
  ([step1, step2]) => {
    if (!step1 || !step2) entitiesStore.stepper = 1;
  },
);
watch(
  () => entitiesStore.isStep3Valid,
  (valid) => {
    if (!valid) entitiesStore.stepper = 3;
  },
);
watch(
  () => entitiesStore.isStep4Valid,
  (valid) => {
    if (!valid) entitiesStore.stepper = 4;
  },
);

onMounted(async () => {
  waitForHeaderTarget();
  entitiesStore.isReadonly = !isNuevo;
  entitiesStore.isStep1Valid = true;
  entitiesStore.isStep2Valid = true;
  entitiesStore.isStep3Valid = true;
  entitiesStore.isStep4Valid = true;
  appStore.spiner = true;
  await Promise.all([
    appStore._getDocumentsPais(),
    masterusuariosStore.cargarMasterDetalleTipoProveedor(),
    appStore._getPais(),
    masterusuariosStore.cargarMasterDetalleTipoTransaccion(),
    masterusuariosStore.cargarTipoTelefono(),
    appStore._getRole(),
    coinsStore.getCoinsListCargar(),
    bankStore.getBanksListCargar(),
    appStore._getSex(),
    masterusuariosStore.cargarTipoPersona(),
    appStore._getProveedorRolShipper(),
    isNuevo ? null : loadProvider(),
  ]);
  appStore.spiner = false;
  entitiesStore.stepper = 1;
  reachedTab.value = 1;
  // The app bar's own "Guardar Proveedor" stays hidden: this card brings its Guardar.
  entitiesStore.showBtnSaveFlag = false;

  if (isNuevo) {
    entitiesStore.isEdit = false;
    entitiesStore.isReadonly = false;
    startNewProvider();
  } else if (props.mode === "editar") {
    entitiesStore.isEdit = true;
    entitiesStore.isReadonly = false;
  } else {
    entitiesStore.isEdit = false;
    entitiesStore.isReadonly = true;
  }

  showTitle();
});
</script>

<template>
  <div class="ver-proveedor">
    <Teleport
      :to="HEADER_TARGET"
      :disabled="!hasHeaderTarget"
      defer
    >
      <v-btn
        v-if="!editing && editAllowed"
        class="ver-proveedor__edit"
        :class="{ 'ma-4 mb-0': !hasHeaderTarget }"
        color="#1a73e8"
        variant="flat"
        prepend-icon="mdi-pencil-outline"
        @click="modificarProveedor"
      >
        Editar
      </v-btn>
    </Teleport>

    <nav
      class="ver-proveedor__tabs"
      role="tablist"
      aria-label="Secciones del proveedor"
    >
      <button
        v-for="tab in TABS"
        :key="tab.value"
        type="button"
        role="tab"
        class="ver-proveedor__tab"
        :class="{ 'ver-proveedor__tab--active': entitiesStore.stepper === tab.value }"
        :aria-selected="entitiesStore.stepper === tab.value"
        :disabled="tabLocked(tab.value)"
        @click="entitiesStore.stepper = tab.value"
      >
        <v-icon
          :icon="tab.icon"
          size="20"
        />
        {{ tab.title }}
      </button>
    </nav>

    <v-window
      v-model="entitiesStore.stepper"
      class="ver-proveedor__content"
    >
      <v-window-item
        :value="1"
        eager
      >
        <ProveedorDatosContactos
          ref="datosTab"
          :is-pricing="isPricing"
          :nuevo="isNuevo"
          @obtener-proveedor="emit('guardarProveedorExiste', $event)"
        />
      </v-window-item>
      <v-window-item
        :value="3"
        eager
      >
        <SeccionConvenios
          ref="conveniosTab"
          embedded
        />
      </v-window-item>
      <v-window-item
        :value="4"
        eager
      >
        <SeccionInformacionBancaria
          ref="bancosTab"
          embedded
        />
      </v-window-item>
      <v-window-item
        :value="5"
        eager
      >
        <SeccionEmailTarifa
          :guardar-flag="!isNuevo"
          :is-new="isNuevo"
        />
      </v-window-item>
    </v-window>

    <footer
      v-if="showSaveActions || nextTab || showGuardar"
      class="ver-proveedor__footer"
    >
      <v-btn
        v-if="showSaveActions"
        class="ver-proveedor__action"
        variant="outlined"
        size="large"
        @click="cancelEdit"
      >
        Cancelar
      </v-btn>
      <v-btn
        v-if="nextTab"
        class="ver-proveedor__action ver-proveedor__action--next"
        variant="outlined"
        size="large"
        prepend-icon="mdi-arrow-right"
        @click="continuar"
      >
        Continuar al siguiente paso
      </v-btn>
      <v-btn
        v-if="showGuardar"
        class="ver-proveedor__action"
        color="#1a5fd0"
        variant="flat"
        size="large"
        prepend-icon="mdi-content-save-outline"
        @click="isNuevo ? registrarProveedor() : modificarProveedor()"
      >
        Guardar
      </v-btn>
    </footer>
  </div>
</template>

<style scoped>
.ver-proveedor {
  background: #fafbfc;
  border-radius: 4px;
  overflow: hidden;
}

.ver-proveedor__edit,
.ver-proveedor__action {
  text-transform: none;
  letter-spacing: normal;
  font-weight: 600;
}

.ver-proveedor__tabs {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 10px;
  padding: 14px 16px 4px;
}

.ver-proveedor__tab {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  min-height: 44px;
  padding: 8px 12px;
  border: 1px solid #dfe6f1;
  border-radius: 10px;
  background: #fff;
  color: #14264e;
  font-weight: 600;
  font-size: 0.92rem;
  transition: background-color 0.15s, color 0.15s;
}

.ver-proveedor__tab:hover {
  background: #f5f7fa;
}

.ver-proveedor__tab:focus-visible {
  outline: 2px solid #1a73e8;
  outline-offset: 2px;
}

.ver-proveedor__tab:disabled {
  cursor: not-allowed;
  opacity: 0.5;
}

.ver-proveedor__tab--active,
.ver-proveedor__tab--active:hover {
  border-color: #1a73e8;
  background: #1a73e8;
  color: #fff;
  box-shadow: 0 2px 8px rgba(26, 115, 232, 0.3);
}

.ver-proveedor__content {
  padding: 14px 16px;
}

.ver-proveedor__footer {
  display: flex;
  justify-content: flex-end;
  flex-wrap: wrap;
  gap: 12px;
  padding: 4px 16px 18px;
}

.ver-proveedor__action--next {
  color: #1a5fd0;
  border-color: #1a5fd0;
}

@media (max-width: 900px) {
  .ver-proveedor__tabs {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
</style>
