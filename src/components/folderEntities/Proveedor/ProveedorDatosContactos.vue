<script setup lang="ts">
import { computed, ref, useTemplateRef, watch } from "vue";
import Swal from "sweetalert2";
import { useAppStore } from "@/stores/app";
import { useEntitiesStore } from "@/stores/entities";
import { useMasterusuariosStore } from "@/stores/masterusuarios";
import type { DocumentoPais } from "@/types/catalogos";
import type { ContactoEntidad, EmailEntidad, RolProveedor, TelefonoEntidad } from "@/types/entidades";
import CustomAutocomplete from "../CustomAutocomplete.vue";
import { removeRow } from "../removeRow";
import ClienteCard from "../Cliente/ClienteCard.vue";
import CampoDato from "../Cliente/CampoDato.vue";
import { useDatosProveedor } from "./useDatosProveedor";
import "../Cliente/clienteCards.css";

type DialogKind = "telefono" | "email" | "contacto";

// First tab of the provider card: its data, phones, e-mails, contacts, product, service conditions and notes.
// `nuevo`: a new provider must add a phone and a contact before moving on, so those cards show as required.
// Inside a quote, picking an existing provider hands its id to the quote instead of opening its edit screen.
const props = withDefaults(defineProps<{ isPricing?: boolean; nuevo?: boolean }>(), {
  isPricing: false,
  nuevo: false,
});
const emit = defineEmits<{ obtenerProveedor: [id: number] }>();

const appStore = useAppStore();
const entitiesStore = useEntitiesStore();
const masterusuariosStore = useMasterusuariosStore();
const {
  isNombreLoading,
  isDocumentoLoading,
  paisProveedor,
  isShipper,
  isNaviera,
  isAlmacen,
  handleNombre,
  handleDocumento,
  handleEditarProveedor,
  validarCorreoElectronico,
  validarProducto,
  validarDiasPositivos,
  obtenerFlag,
} = useDatosProveedor(
  () => props.isPricing,
  (id) => emit("obtenerProveedor", id),
);

const form = useTemplateRef("form");
const editing = computed(() => !entitiesStore.isReadonly);
const required = (v: unknown) => !!v || "Dato Requerido";
// The field already shows the "+": a typed one is dropped when saved, but every other character must be a digit.
const soloDigitos = (v: unknown) =>
  /^\+?\d+$/.test(String(v ?? "").trim()) || "Formato de teléfono incorrecto";
const AVATAR_TONES = ["tone-blue", "tone-violet", "tone-green"];
const DIALOG_TITLES: Record<DialogKind, [string, string]> = {
  telefono: ["Nuevo Teléfono", "Editar Teléfono"],
  email: ["Nuevo Correo", "Editar Correo"],
  contacto: ["Nuevo Contacto", "Editar Contacto"],
};
const DIALOG_ICONS: Record<DialogKind, string> = {
  telefono: "mdi-phone-plus-outline",
  email: "mdi-email-plus-outline",
  contacto: "mdi-account-plus-outline",
};

const proveedor = computed(() => entitiesStore.proveedor);
const tipoProveedor = computed(
  () => (appStore.itemsDataRoleList as RolProveedor[]).find((v) => v.id == proveedor.value.id_tipoproveedor)?.name,
);
const tipoTransaccion = computed(
  () => masterusuariosStore.lstTipoTransaccion.find((v) => v.id == proveedor.value.id_tipotransaccion)?.descripcion,
);
const tipoDocumento = computed(
  () =>
    (appStore.itemsDocumentsPais as DocumentoPais[]).find((v) => v.id == proveedor.value.id_tipodocumento)
      ?.description,
);
const region = computed(
  () =>
    (appStore.itemsState as unknown as { id: number; name: string }[]).find((v) => v.id == proveedor.value.id_ciudad)
      ?.name,
);
const emails = computed(() => entitiesStore.lstEmails.filter((email) => email.estado));
const showCondiciones = computed(() => isNaviera() || isAlmacen());

function tipoTelefono(id: TelefonoEntidad["id_tipotelefono"]) {
  const tipo = masterusuariosStore.lstTipoTelefono.find((v) => v.id == id) as { descripcion?: string } | undefined;
  return tipo?.descripcion ?? "";
}
function phoneIcon(id: TelefonoEntidad["id_tipotelefono"]) {
  return tipoTelefono(id).toLowerCase().includes("whats")
    ? { icon: "mdi-whatsapp", color: "#25a244" }
    : { icon: "mdi-phone-outline", color: "#1a5fd0" };
}
function numero(telefono?: string) {
  if (!telefono) return "—";
  return /^\d/.test(telefono) ? `+${telefono}` : telefono;
}
function initials(nombre = "") {
  return nombre
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase() ?? "")
    .join("");
}
// Rows loaded from an older record can lack data the save checks; flag them while editing.
function telefonoIncompleto(row: TelefonoEntidad) {
  return editing.value && (!row.id_tipotelefono || !row.telefono);
}
function contactoIncompleto(row: ContactoEntidad) {
  return editing.value && (!row.nombre || !row.id_tipotelefono || !row.telefono);
}

// One dialog adds or edits a phone, an e-mail or a contact. `target` is the row being edited, null while adding.
const dialogOpen = ref(false);
const dialogKind = ref<DialogKind>("contacto");
const target = ref<TelefonoEntidad | EmailEntidad | ContactoEntidad | null>(null);
const draftTelefono = ref<TelefonoEntidad>({});
const draftEmail = ref<EmailEntidad>({ id: null, description: "", email: "", estado: true });
const draftContacto = ref<ContactoEntidad>({});
const dialogForm = useTemplateRef<{ validate: () => Promise<{ valid: boolean }> }>("dialogForm");
const dialogTitle = computed(() => DIALOG_TITLES[dialogKind.value][target.value ? 1 : 0]);

function openDialog(kind: DialogKind, row: TelefonoEntidad | EmailEntidad | ContactoEntidad | null = null) {
  dialogKind.value = kind;
  target.value = row;
  if (kind === "telefono") draftTelefono.value = { id_tipotelefono: "", telefono: "", ...(row as TelefonoEntidad) };
  if (kind === "email") {
    draftEmail.value = row ? { ...(row as EmailEntidad) } : { id: null, description: "", email: "", estado: true };
  }
  if (kind === "contacto") {
    draftContacto.value = {
      nombre: "",
      cargo: "",
      email: "",
      id_tipotelefono: "",
      telefono: "",
      ...(row as ContactoEntidad),
    };
  }
  dialogOpen.value = true;
}

const trimmed = (value?: string) => (value ?? "").trim();
const sinMas = (value?: string) => trimmed(value).replace(/^\+/, "");

function draftRow(): TelefonoEntidad | EmailEntidad | ContactoEntidad {
  if (dialogKind.value === "telefono") {
    return { ...draftTelefono.value, telefono: sinMas(draftTelefono.value.telefono) };
  }
  if (dialogKind.value === "email") {
    return {
      ...draftEmail.value,
      description: trimmed(draftEmail.value.description),
      email: trimmed(draftEmail.value.email),
    };
  }
  const contacto = draftContacto.value;
  return {
    ...contacto,
    nombre: trimmed(contacto.nombre),
    cargo: trimmed(contacto.cargo),
    email: trimmed(contacto.email),
    telefono: sinMas(contacto.telefono),
  };
}

async function saveDialog() {
  if (!(await dialogForm.value?.validate())?.valid) return;
  const row = draftRow();
  // Edit in place: the first phone and contact are the same objects as the provider's principal ones.
  if (target.value) Object.assign(target.value, row);
  else if (dialogKind.value === "telefono") entitiesStore.lstTelefonos.push(row as TelefonoEntidad);
  else if (dialogKind.value === "email") entitiesStore.lstEmails.push(row as EmailEntidad);
  else entitiesStore.lstContactos.push(row as ContactoEntidad);
  dialogOpen.value = false;
}

function eliminarTelefono(row: TelefonoEntidad) {
  removeRow(entitiesStore.lstTelefonos, row);
}
function eliminarEmail(item: EmailEntidad) {
  item.estado = false;
}
function eliminarContacto(row: ContactoEntidad) {
  removeRow(entitiesStore.lstContactos, row);
}

// A new provider moves past this tab like the old steps 1 and 2: its required data, plus a phone and a contact.
async function validarPaso(): Promise<boolean> {
  const { valid } = (await form.value?.validate()) ?? { valid: true };
  if (!valid) return false;
  if (!entitiesStore.lstTelefonos.length || !entitiesStore.lstContactos.length) {
    Swal.fire({
      icon: "error",
      text: "Para continuar, es necesario agregar al menos un teléfono y un contacto",
    });
    return false;
  }
  return true;
}
defineExpose({ validarPaso });

// Saving flips these flags off when this tab holds invalid data, so the fields show their errors.
watch(
  () => [entitiesStore.isStep1Valid, entitiesStore.isStep2Valid],
  async ([step1, step2]) => {
    if (!step1 || !step2) await form.value?.validate();
  },
);
// The first phone and contact are the provider's principal ones, which the record also carries when saved.
watch(
  () => entitiesStore.lstTelefonos,
  (telefonos) => {
    if (telefonos[0]) entitiesStore.proveedor.telefonoActual = telefonos[0];
  },
  { deep: true },
);
watch(
  () => entitiesStore.lstContactos,
  (contactos) => {
    if (contactos[0]) entitiesStore.proveedor.contactoActual = contactos[0];
  },
  { deep: true },
);
</script>

<template>
  <v-form
    ref="form"
    :readonly="!editing"
    class="prov-datos"
  >
    <v-row>
      <v-col
        cols="12"
        md="7"
      >
        <ClienteCard
          title="Información del Proveedor"
          icon="mdi-account-outline"
        >
          <div class="cli-grid">
            <CampoDato
              label="Nombre Comercial / Razón Social"
              :value="proveedor.nombrecompleto"
              :editing="editing"
              required
            >
              <CustomAutocomplete
                :items="entitiesStore.lstProveedores_x_nombre"
                :value="entitiesStore.proveedor.nombrecompleto"
                :loading="isNombreLoading"
                :rules="[required]"
                :disabled="false"
                variant="outlined"
                hide-details="auto"
                aria-label="Nombre Comercial o Razón Social"
                @search="handleNombre"
                @id="handleEditarProveedor"
              />
            </CampoDato>
            <CampoDato
              label="Tipo de Proveedor"
              :value="tipoProveedor"
              :editing="editing"
              required
            >
              <v-autocomplete
                v-model="entitiesStore.proveedor.id_tipoproveedor"
                aria-label="Tipo de Proveedor"
                density="compact"
                variant="outlined"
                hide-details="auto"
                :items="appStore.itemsDataRoleList"
                item-title="name"
                item-value="id"
                :rules="[required]"
              />
            </CampoDato>
            <CampoDato
              label="Tipo de Documento Fiscal"
              :value="tipoDocumento"
              :editing="editing"
            >
              <v-autocomplete
                v-model="entitiesStore.proveedor.id_tipodocumento"
                aria-label="Tipo de Documento Fiscal"
                density="compact"
                variant="outlined"
                hide-details="auto"
                :items="appStore.itemsDocumentsPais"
                item-title="description"
                item-value="id"
              />
            </CampoDato>
            <CampoDato
              label="Nro. de Documento"
              :value="proveedor.nro_documento"
              :editing="editing"
            >
              <CustomAutocomplete
                :items="entitiesStore.lstProveedores_x_documento"
                :value="entitiesStore.proveedor.nro_documento"
                :loading="isDocumentoLoading"
                :disabled="!entitiesStore.proveedor.id_tipodocumento"
                variant="outlined"
                hide-details="auto"
                aria-label="Nro De Documento"
                @search="handleDocumento"
                @id="handleEditarProveedor"
              />
            </CampoDato>
            <CampoDato
              label="País"
              :editing="editing"
              required
            >
              <template #value>
                <img
                  v-if="obtenerFlag()"
                  :src="obtenerFlag()"
                  alt=""
                  class="prov-flag"
                >
                {{ paisProveedor?.name ?? "—" }}
              </template>
              <v-autocomplete
                v-model="entitiesStore.proveedor.id_pais"
                aria-label="País"
                density="compact"
                variant="outlined"
                hide-details="auto"
                :items="appStore.itemsPais"
                item-title="name"
                item-value="id"
                :rules="[required]"
                @update:model-value="appStore._getState(entitiesStore.proveedor.id_pais)"
              >
                <template
                  v-if="obtenerFlag()"
                  #prepend-inner
                >
                  <img
                    :src="obtenerFlag()"
                    alt=""
                    class="prov-flag"
                  >
                </template>
              </v-autocomplete>
            </CampoDato>
            <CampoDato
              label="Región / Estado"
              :value="region"
              :editing="editing"
            >
              <v-autocomplete
                aria-label="Región / Estado"
                density="compact"
                variant="outlined"
                hide-details="auto"
                :items="appStore.itemsState"
                item-title="name"
                item-value="id"
                :model-value="entitiesStore.proveedor.id_ciudad || null"
                @update:model-value="(id) => (entitiesStore.proveedor.id_ciudad = id)"
              />
            </CampoDato>
            <CampoDato
              label="Nacional / Extranjero"
              :value="tipoTransaccion"
              :editing="editing"
              required
            >
              <v-autocomplete
                v-model="entitiesStore.proveedor.id_tipotransaccion"
                aria-label="Nacional / Extranjero"
                density="compact"
                variant="outlined"
                hide-details="auto"
                :items="masterusuariosStore.lstTipoTransaccion"
                item-title="descripcion"
                item-value="id"
                :rules="[required]"
              />
            </CampoDato>
            <CampoDato
              label="Correo Electrónico"
              :value="proveedor.emailaddress"
              :editing="editing"
            >
              <v-text-field
                v-model="entitiesStore.proveedor.emailaddress"
                aria-label="Correo Electrónico"
                density="compact"
                variant="outlined"
                hide-details="auto"
                prepend-inner-icon="mdi-email-outline"
                :rules="[validarCorreoElectronico]"
              />
            </CampoDato>
            <CampoDato
              label="Dirección"
              :editing="editing"
              wide
            >
              <template #value>
                <v-icon
                  icon="mdi-map-marker"
                  color="#1a5fd0"
                  size="20"
                />
                {{ proveedor.direccion || "—" }}
              </template>
              <v-text-field
                v-model="entitiesStore.proveedor.direccion"
                aria-label="Dirección"
                density="compact"
                variant="outlined"
                hide-details="auto"
                prepend-inner-icon="mdi-map-marker"
              />
            </CampoDato>
          </div>
        </ClienteCard>
      </v-col>

      <v-col
        cols="12"
        md="5"
      >
        <ClienteCard
          title="Teléfonos Locales / Fijos"
          :required="nuevo"
          icon="mdi-phone-outline"
        >
          <template
            v-if="editing"
            #actions
          >
            <v-btn
              class="cli-add-btn"
              variant="outlined"
              size="small"
              prepend-icon="mdi-plus"
              @click="openDialog('telefono')"
            >
              Agregar
            </v-btn>
          </template>
          <v-table
            class="cli-table"
            density="comfortable"
          >
            <thead>
              <tr>
                <th>Descripción</th>
                <th>Número</th>
                <th v-if="editing" />
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="(telefono, index) in entitiesStore.lstTelefonos"
                :key="index"
                :class="{ 'prov-row--incompleta': telefonoIncompleto(telefono) }"
              >
                <td>
                  <div class="d-flex align-center ga-2">
                    <v-icon
                      v-bind="phoneIcon(telefono.id_tipotelefono)"
                      size="20"
                    />
                    <v-chip
                      size="small"
                      class="cli-chip-coin"
                      variant="flat"
                    >
                      {{ tipoTelefono(telefono.id_tipotelefono) || "—" }}
                    </v-chip>
                  </div>
                </td>
                <td class="font-weight-medium">
                  {{ numero(telefono.telefono) }}
                </td>
                <td
                  v-if="editing"
                  class="text-right"
                >
                  <div class="d-inline-flex ga-1">
                    <v-btn
                      class="cli-row-edit"
                      variant="flat"
                      size="x-small"
                      icon="mdi-pencil-outline"
                      :aria-label="`Editar teléfono ${telefono.telefono}`"
                      @click="openDialog('telefono', telefono)"
                    />
                    <v-btn
                      class="cli-row-delete"
                      variant="flat"
                      size="x-small"
                      icon="mdi-delete-outline"
                      :aria-label="`Eliminar teléfono ${telefono.telefono}`"
                      @click="eliminarTelefono(telefono)"
                    />
                  </div>
                </td>
              </tr>
              <tr v-if="!entitiesStore.lstTelefonos.length">
                <td
                  :colspan="editing ? 3 : 2"
                  class="prov-empty"
                >
                  Sin teléfonos registrados.
                </td>
              </tr>
            </tbody>
          </v-table>
        </ClienteCard>

        <ClienteCard
          title="Correo General"
          icon="mdi-email-outline"
        >
          <template
            v-if="editing"
            #actions
          >
            <v-btn
              class="cli-add-btn"
              variant="outlined"
              size="small"
              prepend-icon="mdi-plus"
              @click="openDialog('email')"
            >
              Agregar
            </v-btn>
          </template>
          <div
            v-for="(email, index) in emails"
            :key="index"
            class="prov-email"
          >
            <v-icon
              icon="mdi-email-outline"
              color="#1a5fd0"
              size="20"
            />
            <span>{{ email.email }}</span>
            <span
              v-if="email.description"
              class="prov-email__description"
            >{{ email.description }}</span>
            <div
              v-if="editing"
              class="d-inline-flex ga-1"
              :class="{ 'ml-auto': !email.description }"
            >
              <v-btn
                class="cli-row-edit"
                variant="flat"
                size="x-small"
                icon="mdi-pencil-outline"
                :aria-label="`Editar correo ${email.email}`"
                @click="openDialog('email', email)"
              />
              <v-btn
                class="cli-row-delete"
                variant="flat"
                size="x-small"
                icon="mdi-delete-outline"
                :aria-label="`Eliminar correo ${email.email}`"
                @click="eliminarEmail(email)"
              />
            </div>
          </div>
          <p
            v-if="!emails.length"
            class="prov-empty"
          >
            Sin correos registrados.
          </p>
        </ClienteCard>
      </v-col>
    </v-row>

    <ClienteCard
      class="mt-4"
      title="Contactos"
      :required="nuevo"
      icon="mdi-account-group-outline"
    >
      <template
        v-if="editing"
        #actions
      >
        <v-btn
          class="cli-add-btn"
          variant="outlined"
          size="small"
          prepend-icon="mdi-plus"
          @click="openDialog('contacto')"
        >
          Agregar Contacto
        </v-btn>
      </template>
      <v-table
        class="cli-table"
        density="comfortable"
      >
        <thead>
          <tr>
            <th>Nombre y Cargo</th>
            <th>Correo Electrónico</th>
            <th>Tipo de Teléfono</th>
            <th>Número</th>
            <th
              v-if="editing"
              class="text-center"
            >
              Acciones
            </th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="(contacto, index) in entitiesStore.lstContactos"
            :key="index"
            :class="{ 'prov-row--incompleta': contactoIncompleto(contacto) }"
          >
            <td>
              <div class="d-flex align-center ga-3 py-1">
                <span
                  class="prov-avatar"
                  :class="AVATAR_TONES[index % AVATAR_TONES.length]"
                >{{ initials(contacto.nombre) }}</span>
                <div>
                  <div class="font-weight-bold">
                    {{ contacto.nombre || "—" }}
                  </div>
                  <div
                    v-if="contacto.cargo"
                    class="prov-muted"
                  >
                    {{ contacto.cargo }}
                  </div>
                </div>
              </div>
            </td>
            <td>
              <span
                v-if="contacto.email"
                class="d-inline-flex align-center ga-2"
              >
                <v-icon
                  icon="mdi-email-outline"
                  color="#1a5fd0"
                  size="18"
                />
                {{ contacto.email }}
              </span>
              <span
                v-else
                class="prov-muted"
              >—</span>
            </td>
            <td>
              <span class="d-inline-flex align-center ga-2">
                <v-icon
                  v-bind="phoneIcon(contacto.id_tipotelefono)"
                  size="18"
                />
                {{ tipoTelefono(contacto.id_tipotelefono) || "—" }}
              </span>
            </td>
            <td class="font-weight-medium">
              {{ numero(contacto.telefono) }}
            </td>
            <td
              v-if="editing"
              class="text-center"
            >
              <div class="d-inline-flex ga-1">
                <v-btn
                  class="cli-row-edit"
                  variant="flat"
                  size="small"
                  icon="mdi-pencil-outline"
                  :aria-label="`Editar contacto ${contacto.nombre}`"
                  @click="openDialog('contacto', contacto)"
                />
                <v-btn
                  class="cli-row-delete"
                  variant="flat"
                  size="small"
                  icon="mdi-delete-outline"
                  :aria-label="`Eliminar contacto ${contacto.nombre}`"
                  @click="eliminarContacto(contacto)"
                />
              </div>
            </td>
          </tr>
          <tr v-if="!entitiesStore.lstContactos.length">
            <td
              :colspan="editing ? 5 : 4"
              class="prov-empty"
            >
              Sin contactos registrados.
            </td>
          </tr>
        </tbody>
      </v-table>
    </ClienteCard>

    <v-row class="mt-1">
      <v-col
        cols="12"
        md="4"
      >
        <ClienteCard
          class="prov-note-card"
          title="Producto que Vende"
          :required="editing && isShipper()"
          icon="mdi-cube-outline"
        >
          <v-textarea
            v-if="editing"
            v-model="entitiesStore.proveedor.producto"
            aria-label="Producto que vende"
            density="compact"
            variant="outlined"
            rows="3"
            auto-grow
            hide-details="auto"
            :rules="[validarProducto]"
          />
          <p
            v-else
            class="prov-note"
            :class="{ 'prov-note--muted': !proveedor.producto }"
          >
            {{ proveedor.producto || "Sin producto registrado." }}
          </p>
        </ClienteCard>
      </v-col>
      <v-col
        cols="12"
        md="4"
      >
        <ClienteCard
          class="prov-note-card"
          title="Condiciones del Servicio"
          icon="mdi-handshake-outline"
        >
          <div
            v-if="showCondiciones"
            class="prov-condiciones"
          >
            <CampoDato
              v-show="isNaviera()"
              label="Días Libres de Sobreestadía"
              :value="proveedor.dias_sobreestadia"
              :editing="editing"
            >
              <v-text-field
                v-model="entitiesStore.proveedor.dias_sobreestadia"
                aria-label="Días Libres de Sobreestadía"
                type="number"
                suffix="días"
                density="compact"
                variant="outlined"
                hide-details="auto"
                :rules="[validarDiasPositivos]"
              />
            </CampoDato>
            <CampoDato
              v-show="isAlmacen()"
              label="Días Libres de Almacenaje"
              :value="proveedor.dias_almacenaje"
              :editing="editing"
            >
              <v-text-field
                v-model="entitiesStore.proveedor.dias_almacenaje"
                aria-label="Días Libres de Almacenaje"
                type="number"
                suffix="días"
                density="compact"
                variant="outlined"
                hide-details="auto"
                :rules="[validarDiasPositivos]"
              />
            </CampoDato>
          </div>
          <p
            v-else
            class="prov-note prov-note--muted"
          >
            Este tipo de proveedor no tiene días libres de sobreestadía ni de almacenaje.
          </p>
        </ClienteCard>
      </v-col>
      <v-col
        cols="12"
        md="4"
      >
        <ClienteCard
          class="prov-note-card"
          title="Notas"
          icon="mdi-note-text-outline"
        >
          <v-textarea
            v-if="editing"
            v-model="entitiesStore.proveedor.notas"
            aria-label="Comentarios / Notas Importantes"
            density="compact"
            variant="outlined"
            rows="3"
            auto-grow
            hide-details="auto"
          />
          <p
            v-else
            class="prov-note"
            :class="{ 'prov-note--muted': !proveedor.notas }"
          >
            {{ proveedor.notas || "Sin notas." }}
          </p>
        </ClienteCard>
      </v-col>
    </v-row>
  </v-form>

  <v-dialog
    v-model="dialogOpen"
    max-width="560"
  >
    <v-card class="prov-dialog">
      <v-form
        ref="dialogForm"
        @submit.prevent="saveDialog"
      >
        <header class="cli-card__header">
          <span class="cli-card__icon">
            <v-icon
              :icon="DIALOG_ICONS[dialogKind]"
              size="22"
            />
          </span>
          <h3 class="cli-card__title">
            {{ dialogTitle }}
          </h3>
          <v-spacer />
          <v-btn
            icon="mdi-close"
            variant="text"
            size="small"
            aria-label="Cerrar"
            @click="dialogOpen = false"
          />
        </header>
        <v-card-text class="pt-5">
          <v-row
            v-if="dialogKind === 'telefono'"
            density="compact"
          >
            <v-col
              cols="12"
              sm="6"
            >
              <v-autocomplete
                v-model="draftTelefono.id_tipotelefono"
                label="Tipo de Teléfono *"
                prepend-inner-icon="mdi-phone-outline"
                density="compact"
                variant="outlined"
                :items="masterusuariosStore.lstTipoTelefono"
                item-title="descripcion"
                item-value="id"
                :rules="[required]"
              />
            </v-col>
            <v-col
              cols="12"
              sm="6"
            >
              <v-text-field
                v-model="draftTelefono.telefono"
                label="Número *"
                density="compact"
                variant="outlined"
                prefix="+"
                :rules="[required, soloDigitos]"
              />
            </v-col>
          </v-row>

          <v-row
            v-else-if="dialogKind === 'email'"
            density="compact"
          >
            <v-col cols="12">
              <v-text-field
                v-model="draftEmail.email"
                label="Correo Electrónico *"
                prepend-inner-icon="mdi-email-outline"
                placeholder="correo@empresa.com"
                density="compact"
                variant="outlined"
                :rules="[required, validarCorreoElectronico]"
              />
            </v-col>
            <v-col cols="12">
              <v-text-field
                v-model="draftEmail.description"
                label="Descripción"
                prepend-inner-icon="mdi-text"
                density="compact"
                variant="outlined"
              />
            </v-col>
          </v-row>

          <v-row
            v-else
            density="compact"
          >
            <v-col
              cols="12"
              sm="6"
            >
              <v-text-field
                v-model="draftContacto.nombre"
                label="Nombre *"
                prepend-inner-icon="mdi-account-outline"
                density="compact"
                variant="outlined"
                :rules="[required]"
              />
            </v-col>
            <v-col
              cols="12"
              sm="6"
            >
              <v-text-field
                v-model="draftContacto.cargo"
                label="Cargo"
                prepend-inner-icon="mdi-briefcase-outline"
                density="compact"
                variant="outlined"
              />
            </v-col>
            <v-col cols="12">
              <v-text-field
                v-model="draftContacto.email"
                label="Correo Electrónico"
                prepend-inner-icon="mdi-email-outline"
                placeholder="correo@empresa.com"
                density="compact"
                variant="outlined"
                :rules="[validarCorreoElectronico]"
              />
            </v-col>
            <v-col
              cols="12"
              sm="6"
            >
              <v-autocomplete
                v-model="draftContacto.id_tipotelefono"
                label="Tipo de Teléfono *"
                prepend-inner-icon="mdi-phone-outline"
                density="compact"
                variant="outlined"
                :items="masterusuariosStore.lstTipoTelefono"
                item-title="descripcion"
                item-value="id"
                :rules="[required]"
              />
            </v-col>
            <v-col
              cols="12"
              sm="6"
            >
              <v-text-field
                v-model="draftContacto.telefono"
                label="Número *"
                density="compact"
                variant="outlined"
                prefix="+"
                :rules="[required, soloDigitos]"
              />
            </v-col>
          </v-row>
        </v-card-text>
        <v-card-actions class="px-6 pb-5">
          <v-spacer />
          <v-btn
            variant="outlined"
            class="text-none"
            @click="dialogOpen = false"
          >
            Cancelar
          </v-btn>
          <v-btn
            type="submit"
            color="#1a5fd0"
            variant="flat"
            class="text-none font-weight-bold"
            :prepend-icon="target ? 'mdi-content-save-outline' : 'mdi-plus'"
          >
            {{ target ? "Guardar" : "Agregar" }}
          </v-btn>
        </v-card-actions>
      </v-form>
    </v-card>
  </v-dialog>
</template>

<style scoped>
.prov-flag {
  width: 22px;
  height: 15px;
  object-fit: cover;
  border-radius: 2px;
}

.prov-email {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  border: 1px solid #e9edf2;
  border-radius: 10px;
}

.prov-email + .prov-email {
  margin-top: 8px;
}

.prov-email__description {
  margin-left: auto;
  font-size: 0.8rem;
  color: #6b7a93;
}

.prov-avatar {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  font-size: 0.85rem;
  font-weight: 700;
  flex-shrink: 0;
}

.tone-blue {
  color: #1a5fd0;
  background: #eef2f8;
}

.tone-violet {
  color: #5b3fc4;
  background: #ece8fb;
}

.tone-green {
  color: #1d8a4e;
  background: #e2f4ea;
}

.prov-muted {
  font-size: 0.8rem;
  color: #6b7a93;
}

.prov-empty {
  color: #8a96ab;
  text-align: center;
  padding: 12px;
  margin: 0;
}

.prov-row--incompleta td {
  background: #fff6f6;
}

.prov-row--incompleta td:first-child {
  box-shadow: inset 3px 0 0 #d32f2f;
}

/* The three bottom cards keep the same height side by side. */
.prov-note-card {
  height: 100%;
}

.prov-note {
  min-height: 72px;
  margin: 0;
  padding: 10px 12px;
  border: 1px solid #e9edf2;
  border-radius: 10px;
  color: #1f2a40;
  white-space: pre-line;
  word-break: break-word;
}

.prov-note--muted {
  color: #8a96ab;
}

.prov-condiciones {
  display: grid;
  gap: 10px;
}

.prov-condiciones :deep(.cli-field__value) {
  font-weight: 700;
}

.prov-datos :deep(.v-table td) {
  padding-top: 6px;
  padding-bottom: 6px;
}

/* Compact, design-sized fields while editing. */
.prov-datos :deep(.v-field) {
  font-size: 0.875rem;
}

.prov-datos :deep(.v-field__input) {
  min-height: 36px;
  padding-top: 6px;
  padding-bottom: 6px;
}

.prov-datos :deep(.customAutocomplete) {
  margin-top: 2px;
}
</style>
