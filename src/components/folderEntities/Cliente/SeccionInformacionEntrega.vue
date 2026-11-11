<script setup lang="ts">
import { computed } from "vue";
import { useAppStore } from "@/stores/app";
import Swal from "sweetalert2";
import { useEntitiesStore } from "@/stores/entities";
import type { Pais } from "@/types/catalogos";
import { entityEditAllowed } from "@/components/folderEntities/entityEditAllowed";
import ClienteCard from "./ClienteCard.vue";
import "./clienteCards.css";

// Inside Ver Cliente the screen's header holds the Editar/Guardar buttons, so `embedded` hides this section's own.
const props = withDefaults(defineProps<{ embedded?: boolean }>(), { embedded: false });

const TEXT_FIELDS = [
  { key: "destinatario", label: "Destinatario", icon: "mdi-account-outline", placeholder: "Ej. Juan Pérez" },
  { key: "dni_destinatario", label: "DNI o RUC", icon: "mdi-card-account-details-outline", placeholder: "Ej. 12345678" },
  { key: "receptor", label: "Persona que Recoge", icon: "mdi-account-arrow-left-outline", placeholder: "Ej. Juan Pérez" },
  { key: "dni_receptor", label: "DNI", icon: "mdi-card-account-details-outline", placeholder: "Ej. 12345678" },
] as const;

const appStore = useAppStore();
const editAllowed = entityEditAllowed("listClientes");
const entitiesStore = useEntitiesStore();

const isFormReadonly = computed(() => {
  return entitiesStore.isReadonly;
});
const editing = computed(() => !entitiesStore.isReadonly);
const showNavigationButtons = computed(() => {
  return !(
    entitiesStore.isEdit ||
    entitiesStore.isReadonly
  );
});
const showOwnEditButton = computed(() => !props.embedded && !showNavigationButtons.value && editAllowed);

function placeName(places: unknown, id: unknown) {
  return (places as { id: number; name: string }[]).find((place) => place.id == id)?.name ?? "—";
}

function validarTelefono(v: string) {
  if (v && !/^\+?\d+$/.test(v)) {
    return "Debe ingresar un teléfono válido";
  }

  return true;
}
function getPrefix() {
  const pais = (appStore.itemsPais as Pais[]).find(
    (v) => v.id == entitiesStore.cliente.id_pais,
  );
  if (pais) {
    return pais.phoneprefix;
  }
  return "+xx";
}
function obtenerFlag() {
  const pais = (appStore.itemsPais as Pais[]).find(
    (v) => v.id == entitiesStore.cliente.id_pais,
  );
  let flag = "";
  if (pais) {
    flag = `https://flagcdn.com/w40/${pais.codigo_iso!.toLowerCase()}.png`;
  }
  return flag;
}
async function modificarCliente() {
  if (isFormReadonly.value) {
    if (!(await entitiesStore.approveClientEdit(entitiesStore.cliente.id!))) return;
    entitiesStore.isReadonly = false;
    entitiesStore.isEdit = true;
    Swal.fire({
      icon: "info",
      text: "Ahora puede modificar los campos",
    });
    return;
  }

  appStore.spiner = true;
  const saved = await entitiesStore.actualizarCliente();
  appStore.spiner = false;
  if (!saved) return;
  appStore.recargarClienteFlag =
    !appStore.recargarClienteFlag;
  appStore.modalEntitie = false;

  entitiesStore.isReadonly = true;
  entitiesStore.isEdit = false;
}
</script>

<template>
  <div class="cli-section">
    <ClienteCard
      title="Datos para el Rótulo de Entrega"
      subtitle="Información para el envío de la mercancía por agencia o entrega directa."
      icon="mdi-package-variant-closed"
    >
      <template
        v-if="showOwnEditButton"
        #actions
      >
        <v-btn
          class="cli-add-btn"
          variant="outlined"
          prepend-icon="mdi-pencil-outline"
          @click="modificarCliente"
        >
          {{ isFormReadonly ? "Editar Cliente" : "Guardar Cambios" }}
        </v-btn>
      </template>
      <v-form
        ref="formInformacionEntrega"
        :readonly="isFormReadonly"
      >
        <div class="cli-rows py-2">
          <template
            v-for="field in TEXT_FIELDS"
            :key="field.key"
          >
            <label
              class="cli-rows__label"
              :for="`entrega-${field.key}`"
            >{{ field.label }}</label>
            <v-text-field
              v-if="editing"
              :id="`entrega-${field.key}`"
              v-model="entitiesStore.informacionEntrega[field.key]"
              :prepend-inner-icon="field.icon"
              :placeholder="field.placeholder"
              density="compact"
              variant="outlined"
              hide-details="auto"
            />
            <div
              v-else
              class="cli-field__value"
            >
              <v-icon
                :icon="field.icon"
                color="#1a5fd0"
                size="20"
              />
              {{ entitiesStore.informacionEntrega[field.key] || "—" }}
            </div>
          </template>

          <label
            class="cli-rows__label"
            for="entrega-departamento"
          >Departamento</label>
          <v-autocomplete
            v-if="editing"
            id="entrega-departamento"
            v-model="entitiesStore.informacionEntrega.id_departamento"
            :items="appStore.itemsState"
            item-title="name"
            item-value="id"
            prepend-inner-icon="mdi-map-outline"
            density="compact"
            variant="outlined"
            hide-details="auto"
            @update:model-value="appStore._getCity(entitiesStore.informacionEntrega.id_departamento)"
          />
          <div
            v-else
            class="cli-field__value"
          >
            <v-icon
              icon="mdi-map-outline"
              color="#1a5fd0"
              size="20"
            />
            {{ placeName(appStore.itemsState, entitiesStore.informacionEntrega.id_departamento) }}
          </div>

          <label
            class="cli-rows__label"
            for="entrega-provincia"
          >Provincia</label>
          <v-autocomplete
            v-if="editing"
            id="entrega-provincia"
            v-model="entitiesStore.informacionEntrega.id_provincia"
            :items="appStore.itemsCity"
            item-title="name"
            item-value="id"
            prepend-inner-icon="mdi-map-marker-radius-outline"
            density="compact"
            variant="outlined"
            hide-details="auto"
            @update:model-value="appStore._getTown(entitiesStore.informacionEntrega.id_provincia)"
          />
          <div
            v-else
            class="cli-field__value"
          >
            <v-icon
              icon="mdi-map-marker-radius-outline"
              color="#1a5fd0"
              size="20"
            />
            {{ placeName(appStore.itemsCity, entitiesStore.informacionEntrega.id_provincia) }}
          </div>

          <label
            class="cli-rows__label"
            for="entrega-distrito"
          >Distrito</label>
          <v-autocomplete
            v-if="editing"
            id="entrega-distrito"
            v-model="entitiesStore.informacionEntrega.id_distrito"
            :items="appStore.itemsTown"
            item-title="name"
            item-value="id"
            prepend-inner-icon="mdi-map-marker-outline"
            density="compact"
            variant="outlined"
            hide-details="auto"
          />
          <div
            v-else
            class="cli-field__value"
          >
            <v-icon
              icon="mdi-map-marker-outline"
              color="#1a5fd0"
              size="20"
            />
            {{ placeName(appStore.itemsTown, entitiesStore.informacionEntrega.id_distrito) }}
          </div>

          <label
            class="cli-rows__label"
            for="entrega-agencia"
          >Agencia que Recibe <small>(si aplica)</small></label>
          <v-text-field
            v-if="editing"
            id="entrega-agencia"
            v-model="entitiesStore.informacionEntrega.agencia"
            prepend-inner-icon="mdi-truck-outline"
            placeholder="Nombre de la agencia"
            density="compact"
            variant="outlined"
            hide-details="auto"
          />
          <div
            v-else
            class="cli-field__value"
          >
            <v-icon
              icon="mdi-truck-outline"
              color="#1a5fd0"
              size="20"
            />
            {{ entitiesStore.informacionEntrega.agencia || "—" }}
          </div>

          <label
            class="cli-rows__label"
            for="entrega-celular"
          >Celular de Contacto</label>
          <v-text-field
            v-if="editing"
            id="entrega-celular"
            v-model="entitiesStore.informacionEntrega.celular_agencia"
            class="cli-phone"
            prepend-inner-icon="mdi-phone-outline"
            :prefix="getPrefix()"
            :rules="[(v) => validarTelefono(v)]"
            placeholder="987 654 321"
            density="compact"
            variant="outlined"
            hide-details="auto"
          />
          <div
            v-else
            class="cli-field__value"
          >
            <v-icon
              icon="mdi-phone-outline"
              color="#1a5fd0"
              size="20"
            />
            <img
              v-if="obtenerFlag()"
              :src="obtenerFlag()"
              alt=""
              class="cli-flag"
            >
            <template v-if="entitiesStore.informacionEntrega.celular_agencia">
              {{ getPrefix() }} {{ entitiesStore.informacionEntrega.celular_agencia }}
            </template>
            <template v-else>
              —
            </template>
          </div>

          <span class="cli-rows__label">Cliente</span>
          <div class="cli-field__value">
            <v-icon
              icon="mdi-account-outline"
              color="#1a5fd0"
              size="20"
            />
            {{ entitiesStore.cliente.nombrecompleto || "—" }}
          </div>
        </div>
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
    </div>
  </div>
</template>

<style>
.container-narrow {
  max-width: 1100px;
  margin: 0 auto;
}
</style>

<style scoped>
.cli-flag {
  width: 22px;
  height: 15px;
  object-fit: cover;
  border-radius: 2px;
}

.cli-phone {
  max-width: 360px;
}
</style>
