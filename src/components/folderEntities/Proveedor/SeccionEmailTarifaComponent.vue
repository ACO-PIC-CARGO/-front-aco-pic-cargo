<script setup lang="ts">
import { computed, onMounted, ref, useTemplateRef } from "vue";
import { useRoute } from "vue-router";
import Swal from "sweetalert2";
import { useEntitiesStore } from "@/stores/entities";
import type { DatoTarifaProveedor } from "@/types/entidades";
import { request } from "@/utils/request";
import { entityEditAllowed } from "@/components/folderEntities/entityEditAllowed";
import ClienteCard from "../Cliente/ClienteCard.vue";
import "../Cliente/clienteCards.css";

// The contacts that receive the "pedir tarifa" e-mail, split into import ("I") and export ("E").
// `guardarFlag`: a saved provider stores these contacts with this section's own button.
// `isNew`: a new provider starts with none and sends them along with the rest of its record.
const stepProps = withDefaults(
  defineProps<{
    editable?: boolean;
    guardarFlag?: boolean;
    isNew?: boolean;
  }>(),
  { editable: true, guardarFlag: true, isNew: false },
);

type Grupo = "I" | "E";

const route = useRoute();
const editAllowed = entityEditAllowed("listProveedor");
const entitiesStore = useEntitiesStore();

const editing = computed(() => stepProps.editable && !entitiesStore.isReadonly);
const AVATAR_TONES = ["tone-blue", "tone-violet", "tone-green"];
const GRUPOS = [
  {
    code: "I" as Grupo,
    title: "Contactos de Importación",
    subtitle: "Personas de contacto para compras y coordinación de embarques.",
    icon: "mdi-ferry",
  },
  {
    code: "E" as Grupo,
    title: "Contactos de Exportación",
    subtitle: "Personas de contacto para coordinación de carga y embarque.",
    icon: "mdi-airplane-takeoff",
  },
];

function lista(code: Grupo) {
  return code === "I" ? entitiesStore.itemsImportacion : entitiesStore.itemsExportacion;
}
function initials(nombre = "") {
  return nombre
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase() ?? "")
    .join("");
}
const activo = (item: DatoTarifaProveedor) => item.estado !== false;

async function cargarDatos() {
  if (stepProps.isNew || !route.params.id) {
    entitiesStore.itemsImportacion = [];
    entitiesStore.itemsExportacion = [];
    return;
  }
  await entitiesStore.cargarDatosTatifasEntite({ id: route.params.id });
  entitiesStore.itemsImportacion = entitiesStore.lstDatosTarifas.filter((item) => item.code === "I");
  entitiesStore.itemsExportacion = entitiesStore.lstDatosTarifas.filter((item) => item.code === "E");
}

// One dialog adds or edits a contact of either list. `target` is the row being edited, null while adding.
const dialogOpen = ref(false);
const dialogGrupo = ref<Grupo>("I");
const target = ref<DatoTarifaProveedor | null>(null);
const draft = ref<DatoTarifaProveedor>({ contacto: "", email: "", telefono: "", estado: true });
const dialogForm = useTemplateRef<{ validate: () => Promise<{ valid: boolean }> }>("dialogForm");
const dialogTitle = computed(() => {
  const grupo = dialogGrupo.value === "I" ? "Importación" : "Exportación";
  return `${target.value ? "Editar" : "Nuevo"} Contacto de ${grupo}`;
});
const required = (v: unknown) => !!String(v ?? "").trim() || "Dato Requerido";
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const emailValido = (v: unknown) => !v || EMAIL_PATTERN.test(String(v).trim()) || "Email no válido";

function openDialog(code: Grupo, row: DatoTarifaProveedor | null = null) {
  dialogGrupo.value = code;
  target.value = row;
  draft.value = row ? { ...row, estado: activo(row) } : { contacto: "", email: "", telefono: "", estado: true };
  dialogOpen.value = true;
}

async function saveDialog() {
  if (!(await dialogForm.value?.validate())?.valid) return;
  const row = {
    ...draft.value,
    contacto: draft.value.contacto.trim(),
    email: draft.value.email.trim(),
    telefono: (draft.value.telefono ?? "").trim(),
  };
  if (target.value) Object.assign(target.value, row);
  else lista(dialogGrupo.value).push({ ...row, id: 0, code: dialogGrupo.value });
  dialogOpen.value = false;
}

// A contact not saved yet can be removed; a saved one is turned off with its Estado instead.
function eliminar(code: Grupo, item: DatoTarifaProveedor) {
  const items = lista(code);
  const index = items.indexOf(item);
  if (index !== -1) items.splice(index, 1);
}

async function guardarContactos() {
  Swal.showLoading();
  const datos = [...entitiesStore.itemsImportacion, ...entitiesStore.itemsExportacion];

  const response = await request({
    method: "post",
    url: import.meta.env.VITE_URL_MAIN + "entitie/guardar_datos_tarifas",
    data: {
      id: route.params.id,
      datos: datos,
      proveedorprincipalflag: entitiesStore.proveedor.proveedorprincipalflag,
    },
  });
  await Swal.fire({
    icon: response.estadoflag ? "success" : "error",
    text: response.mensaje,
  });
  await cargarDatos();
}

onMounted(async () => {
  cargarDatos();
});
</script>

<template>
  <div class="cli-section prov-tarifas">
    <div class="prov-tarifas__toolbar">
      <div class="prov-tarifas__principal">
        <v-checkbox
          v-model="entitiesStore.proveedor.proveedorprincipalflag"
          class="prov-tarifas__check"
          label="Habilitar para solicitar tarifas"
          density="compact"
          hide-details
          :readonly="!editing"
        />
        <span
          class="prov-tarifas__divider"
          aria-hidden="true"
        />
        <p class="prov-tarifas__hint">
          <v-icon
            icon="mdi-information"
            size="20"
            color="#14264e"
          />
          Marca esta opción para poder solicitar tarifas a este proveedor desde el sistema.
        </p>
      </div>
      <v-btn
        v-if="guardarFlag && editAllowed && editing"
        color="#1a5fd0"
        variant="flat"
        class="text-none font-weight-bold"
        prepend-icon="mdi-content-save-outline"
        @click="guardarContactos"
      >
        Guardar contactos
      </v-btn>
    </div>

    <ClienteCard
      v-for="grupo in GRUPOS"
      :key="grupo.code"
      :title="grupo.title"
      :subtitle="grupo.subtitle"
      :icon="grupo.icon"
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
          @click="openDialog(grupo.code)"
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
            <th class="prov-tarifas__index">
              #
            </th>
            <th>Contacto</th>
            <th>Correo Electrónico</th>
            <th>Teléfono</th>
            <th class="text-center">
              Estado
            </th>
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
            v-for="(item, index) in lista(grupo.code)"
            :key="index"
            :class="{ 'prov-tarifas__row--inactiva': !activo(item) }"
          >
            <td class="prov-tarifas__index">
              {{ index + 1 }}
            </td>
            <td>
              <div class="d-flex align-center ga-3 py-1">
                <span
                  class="prov-avatar"
                  :class="AVATAR_TONES[index % AVATAR_TONES.length]"
                >{{ initials(item.contacto) }}</span>
                <span class="font-weight-bold">{{ item.contacto || "—" }}</span>
              </div>
            </td>
            <td>
              <span
                v-if="item.email"
                class="d-inline-flex align-center ga-2"
              >
                <v-icon
                  icon="mdi-email-outline"
                  color="#1a5fd0"
                  size="18"
                />
                {{ item.email }}
              </span>
              <span
                v-else
                class="prov-muted"
              >—</span>
            </td>
            <td>
              <span
                v-if="item.telefono"
                class="d-inline-flex align-center ga-2"
              >
                <v-icon
                  icon="mdi-phone-outline"
                  color="#1a5fd0"
                  size="18"
                />
                {{ item.telefono }}
              </span>
              <span
                v-else
                class="prov-muted"
              >—</span>
            </td>
            <td class="text-center">
              <v-switch
                v-if="editing"
                :model-value="activo(item)"
                class="d-inline-flex"
                color="#1d8a4e"
                density="compact"
                hide-details
                :aria-label="`Activo: ${item.contacto}`"
                @update:model-value="item.estado = !!$event"
              />
              <span
                v-else
                class="prov-estado"
                :class="activo(item) ? 'prov-estado--activo' : 'prov-estado--inactivo'"
              >{{ activo(item) ? "Activo" : "Inactivo" }}</span>
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
                  :aria-label="`Editar contacto ${item.contacto}`"
                  @click="openDialog(grupo.code, item)"
                />
                <v-btn
                  v-if="!item.id"
                  class="cli-row-delete"
                  variant="flat"
                  size="small"
                  icon="mdi-delete-outline"
                  :aria-label="`Quitar contacto ${item.contacto}`"
                  @click="eliminar(grupo.code, item)"
                />
              </div>
            </td>
          </tr>
          <tr v-if="!lista(grupo.code).length">
            <td
              :colspan="editing ? 6 : 5"
              class="prov-empty"
            >
              Sin contactos registrados.
            </td>
          </tr>
        </tbody>
      </v-table>
    </ClienteCard>
  </div>

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
              icon="mdi-account-plus-outline"
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
          <v-row density="compact">
            <v-col cols="12">
              <v-text-field
                v-model="draft.contacto"
                label="Contacto *"
                prepend-inner-icon="mdi-account-outline"
                density="compact"
                variant="outlined"
                :rules="[required]"
              />
            </v-col>
            <v-col cols="12">
              <v-text-field
                v-model="draft.email"
                label="Correo Electrónico"
                prepend-inner-icon="mdi-email-outline"
                placeholder="correo@empresa.com"
                density="compact"
                variant="outlined"
                :rules="[emailValido]"
              />
            </v-col>
            <v-col
              cols="12"
              sm="8"
            >
              <v-text-field
                v-model="draft.telefono"
                label="Teléfono"
                prepend-inner-icon="mdi-phone-outline"
                density="compact"
                variant="outlined"
              />
            </v-col>
            <v-col
              cols="12"
              sm="4"
            >
              <v-switch
                v-model="draft.estado"
                label="Activo"
                color="#1d8a4e"
                density="compact"
                hide-details
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
            {{ target ? "Aceptar" : "Agregar" }}
          </v-btn>
        </v-card-actions>
      </v-form>
    </v-card>
  </v-dialog>
</template>

<style scoped>
.prov-tarifas__toolbar {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 12px;
  margin-bottom: 16px;
}

/* Yellow banner across the tab: the provider can be picked when requesting rates. */
.prov-tarifas__principal {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px 18px;
  flex: 1 1 520px;
  padding: 6px 18px 6px 10px;
  border: 1px solid #f6e3a6;
  border-radius: 12px;
  background: #fff8dc;
}

.prov-tarifas__check {
  flex: 0 0 auto;
}

.prov-tarifas__check :deep(.v-label) {
  font-size: 1.05rem;
  font-weight: 700;
  color: #14264e;
  opacity: 1;
}

.prov-tarifas__divider {
  align-self: stretch;
  width: 1px;
  margin: 6px 0;
  background: #ecd38a;
}

.prov-tarifas__hint {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  margin: 0;
  font-size: 0.875rem;
  color: #3d4a63;
}

@media (max-width: 700px) {
  .prov-tarifas__divider {
    display: none;
  }
}

.prov-tarifas__index {
  width: 48px;
  color: #3d4a63;
}

.prov-tarifas__row--inactiva td {
  color: #8a96ab;
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

.prov-estado {
  display: inline-block;
  padding: 2px 12px;
  border-radius: 8px;
  font-size: 0.8rem;
  font-weight: 700;
}

.prov-estado--activo {
  color: #1d8a4e;
  background: #e2f4ea;
}

.prov-estado--inactivo {
  color: #6b7a93;
  background: #eef1f5;
}

.prov-muted {
  color: #8a96ab;
}

.prov-empty {
  color: #8a96ab;
  text-align: center;
  padding: 12px;
}

.prov-tarifas :deep(.v-table td) {
  padding-top: 6px;
  padding-bottom: 6px;
}
</style>
