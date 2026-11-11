<script setup lang="ts">
import { computed, onMounted, ref, useTemplateRef, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useAppStore } from "@/stores/app";
import ClienteDatosContactos from "./ClienteDatosContactos.vue";
import SeccionConvenios from "./SeccionConvenios.vue";
import SeccionInformacionBancaria from "./SeccionInformacionBancaria.vue";
import SeccionShippers from "./SeccionShippers.vue";
import SeccionInformacionEntrega from "./SeccionInformacionEntrega.vue";
import { useDatosCliente } from "./useDatosCliente";
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
  { value: 1, title: "Datos y Contactos", icon: "mdi-account-outline" },
  { value: 3, title: "Convenios y Tarifas", icon: "mdi-tag-outline" },
  { value: 4, title: "Información Bancaria", icon: "mdi-bank-outline" },
  { value: 5, title: "Shipper", icon: "mdi-ferry" },
  { value: 6, title: "Destinatario", icon: "mdi-package-variant-closed" },
] as const;

// The client's card, shared by Ver, Editar and Nuevo Cliente. "editar" opens straight into editing once the
// client's edit is approved; "nuevo" starts an empty client and walks its tabs in order, checking each one.
// `houseIdConsigner` loads that client inside the house's dialog instead of the route's.
const props = withDefaults(
  defineProps<{ mode?: "ver" | "editar" | "nuevo"; houseIdConsigner?: number | null; isPricing?: boolean }>(),
  { mode: "ver", houseIdConsigner: null, isPricing: false },
);
// A new client inside a dialog tells it when the last tab is reached, as the old stepper did.
const emit = defineEmits<{ btnGuardar: [value: boolean] }>();

const route = useRoute();
const router = useRouter();
const appStore = useAppStore();
const bankStore = useBankStore();
const entitiesStore = useEntitiesStore();
const masterusuariosStore = useMasterusuariosStore();
const coinsStore = useCoinsStore();
const editAllowed = entityEditAllowed("listClientes");
const { can } = usePermissions();
const { modificarCliente } = useDatosCliente(() => props.isPricing);
const isNuevo = props.mode === "nuevo";

entitiesStore.lstProveedores_x_nombre = [];
entitiesStore.lstProveedores_x_documento = [];

const editing = computed(() => !entitiesStore.isReadonly);
// The house's and the quote's client dialogs bring their own Guardar and close buttons.
const inDialog = computed(() => Boolean(props.houseIdConsigner) || (isNuevo && appStore.modalEntitie));
const showSaveActions = computed(() => editing.value && !inDialog.value);
// A new client is saved from the last tab, once every step before it passed its checks.
const showGuardar = computed(
  () => showSaveActions.value && (!isNuevo || (entitiesStore.stepper === 6 && can("listClientes", "NUEVO"))),
);

// A new client only reaches the tabs it has passed, like the old stepper.
const reachedTab = ref(1);
watch(
  () => entitiesStore.stepper,
  (step) => {
    reachedTab.value = Math.max(reachedTab.value, step);
    if (isNuevo && step === 6) emit("btnGuardar", true);
  },
);
const tabLocked = (value: number) => isNuevo && value > reachedTab.value;

const datosTab = useTemplateRef<{ validarPaso: () => Promise<boolean> }>("datosTab");
const conveniosTab = useTemplateRef<{ validarFormulario: () => Promise<void> }>("conveniosTab");
const bancosTab = useTemplateRef<{ validarFormulario: () => Promise<void> }>("bancosTab");
const shippersTab = useTemplateRef<{ validarFormulario: () => Promise<void> }>("shippersTab");
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
  // Inside a dialog the app bar belongs to the screen behind it; the new client's view titles itself.
  if (inDialog.value || isNuevo) return;
  appStore.mainTitle = `${editing.value ? "EDITAR" : "VER"} CLIENTE: CLI - ${entitiesStore.cliente.correlativo ?? ""}`;
}
watch(editing, showTitle);
const nextTab = computed(() => {
  const index = TABS.findIndex((tab) => tab.value === entitiesStore.stepper);
  return TABS[index + 1]?.value;
});

// Ver and Editar move freely; a new client checks the current tab first, and each section's own check moves on.
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
  else if (entitiesStore.stepper === 4) await bancosTab.value?.validarFormulario();
  else if (entitiesStore.stepper === 5) await shippersTab.value?.validarFormulario();
}

async function registrarCliente() {
  appStore.spiner = true;
  await entitiesStore.guardarCliente();
  appStore.spiner = false;
}

function idPorDescripcion<T extends { id?: unknown }>(items: T[], text: (item: T) => string | undefined, criterio: string) {
  return items.find((item) => text(item)?.toUpperCase() === criterio)?.id ?? null;
}

// The same blank client the old Nuevo Cliente started from: a natural person with a DNI and WhatsApp phones.
function startNewClient() {
  const whatsapp = idPorDescripcion(
    masterusuariosStore.lstTipoTelefono,
    (v) => (v as TipoTransaccion).descripcion,
    "WHATSAPP",
  ) as string | number | null;
  Object.assign(entitiesStore.cliente, {
    nombrecompleto: "",
    id_tipotransaccion: "56",
    nro_documento: "",
    id_pais: null,
    id_ciudad: 0,
    direccion: "",
    emailaddress: "",
    notas: "",
    convenioActual: { dias_credito: 0, fecha: "", email_soporte: "", id_path: "" },
    telefonoActual: { id_tipotelefono: whatsapp, telefono: "" },
    contactoActual: { nombre: "", id_tipotelefono: whatsapp, telefono: "" },
    id_tipopersona: idPorDescripcion(masterusuariosStore.lstTipoPersona, (v) => v.descripcion, "PERSONA NATURAL"),
    id_tipodocumento: idPorDescripcion(appStore.itemsDocumentsPais as DocumentoPais[], (v) => v.name, "DNI"),
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

function loadClientLocation() {
  return Promise.all([
    appStore._getState(entitiesStore.cliente.id_pais),
    appStore._getCity(entitiesStore.informacionEntrega.id_departamento),
    appStore._getTown(entitiesStore.informacionEntrega.id_provincia),
  ]);
}

async function cancelEdit() {
  if (isNuevo) {
    router.push({ name: "listClientes" });
    return;
  }
  // Editar Cliente has no read mode of its own: cancelling goes back to Ver Cliente.
  if (props.mode === "editar" && !props.houseIdConsigner) {
    router.push({ name: "verCliente", params: { id: entitiesStore.cliente.id ?? route.params.id } });
    return;
  }
  appStore.spiner = true;
  await entitiesStore.verCliente(entitiesStore.cliente.id).then(loadClientLocation);
  appStore.spiner = false;
  if (props.mode === "editar") return;
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
    isNuevo ? null : entitiesStore.verCliente(props.houseIdConsigner).then(loadClientLocation),
  ]);
  appStore.spiner = false;
  entitiesStore.stepper = 1;
  reachedTab.value = 1;

  if (isNuevo) {
    entitiesStore.isEdit = false;
    entitiesStore.isReadonly = false;
    entitiesStore.showBtnSaveFlag = false;
    startNewClient();
  } else if (props.mode === "editar") {
    const clientId = Number(route.params.id);
    if (!props.houseIdConsigner && !(await entitiesStore.approveClientEdit(clientId))) {
      router.replace({ name: "verCliente", params: { id: clientId } });
      return;
    }
    entitiesStore.isEdit = true;
    entitiesStore.isReadonly = false;
    entitiesStore.showBtnSaveFlag = true;
  } else {
    entitiesStore.isEdit = false;
    entitiesStore.isReadonly = true;
  }

  showTitle();
});
</script>

<template>
  <div class="ver-cliente">
    <Teleport
      :to="HEADER_TARGET"
      :disabled="!hasHeaderTarget"
      defer
    >
      <v-btn
        v-if="!editing && editAllowed"
        class="ver-cliente__edit"
        :class="{ 'ma-4 mb-0': !hasHeaderTarget }"
        color="#1a73e8"
        variant="flat"
        prepend-icon="mdi-pencil-outline"
        @click="modificarCliente"
      >
        Editar
      </v-btn>
    </Teleport>

    <nav
      class="ver-cliente__tabs"
      role="tablist"
      aria-label="Secciones del cliente"
    >
      <button
        v-for="tab in TABS"
        :key="tab.value"
        type="button"
        role="tab"
        class="ver-cliente__tab"
        :class="{ 'ver-cliente__tab--active': entitiesStore.stepper === tab.value }"
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
      class="ver-cliente__content"
    >
      <v-window-item
        :value="1"
        eager
      >
        <ClienteDatosContactos
          ref="datosTab"
          :is-pricing="isPricing"
          :nuevo="isNuevo"
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
        <SeccionShippers
          ref="shippersTab"
          embedded
        />
      </v-window-item>
      <v-window-item
        :value="6"
        eager
      >
        <SeccionInformacionEntrega embedded />
      </v-window-item>
    </v-window>

    <footer
      v-if="showSaveActions || nextTab || showGuardar"
      class="ver-cliente__footer"
    >
      <v-btn
        v-if="showSaveActions"
        class="ver-cliente__action"
        variant="outlined"
        size="large"
        @click="cancelEdit"
      >
        Cancelar
      </v-btn>
      <v-btn
        v-if="nextTab"
        class="ver-cliente__action ver-cliente__action--next"
        variant="outlined"
        size="large"
        prepend-icon="mdi-arrow-right"
        @click="continuar"
      >
        Continuar al siguiente paso
      </v-btn>
      <v-btn
        v-if="showGuardar"
        class="ver-cliente__action"
        color="#1a5fd0"
        variant="flat"
        size="large"
        prepend-icon="mdi-content-save-outline"
        @click="isNuevo ? registrarCliente() : modificarCliente()"
      >
        Guardar
      </v-btn>
    </footer>
  </div>
</template>

<style scoped>
.ver-cliente {
  background: #fafbfc;
  border-radius: 4px;
  overflow: hidden;
}

.ver-cliente__edit,
.ver-cliente__action {
  text-transform: none;
  letter-spacing: normal;
  font-weight: 600;
}

.ver-cliente__tabs {
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 10px;
  padding: 14px 16px 4px;
}

.ver-cliente__tab {
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

.ver-cliente__tab:hover {
  background: #f5f7fa;
}

.ver-cliente__tab:focus-visible {
  outline: 2px solid #1a73e8;
  outline-offset: 2px;
}

.ver-cliente__tab:disabled {
  cursor: not-allowed;
  opacity: 0.5;
}

.ver-cliente__tab--active,
.ver-cliente__tab--active:hover {
  border-color: #1a73e8;
  background: #1a73e8;
  color: #fff;
  box-shadow: 0 2px 8px rgba(26, 115, 232, 0.3);
}

.ver-cliente__content {
  padding: 14px 16px;
}

.ver-cliente__footer {
  display: flex;
  justify-content: flex-end;
  flex-wrap: wrap;
  gap: 12px;
  padding: 4px 16px 18px;
}

.ver-cliente__action--next {
  color: #1a5fd0;
  border-color: #1a5fd0;
}

@media (max-width: 900px) {
  .ver-cliente__tabs {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
</style>
