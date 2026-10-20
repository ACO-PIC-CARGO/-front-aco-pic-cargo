<script setup lang="ts">
import { computed, onMounted, ref, useTemplateRef, watch } from "vue";
import { useStore } from "vuex";
import { useEntitiesStore } from "@/stores/entities";
import { usePricingStore } from "@/stores/pricing";

withDefaults(
  defineProps<{
    mostrarmarketing?: boolean;
    mostrarmarestado?: boolean;
    mostrarmarejecutivo?: boolean;
    mostrarmarpricing?: boolean;
  }>(),
  {
    mostrarmarketing: true,
    mostrarmarestado: true,
    mostrarmarejecutivo: true,
    mostrarmarpricing: true,
  },
);

const rootStore = useStore();
const pricingStore = usePricingStore();
const entitiesStore = useEntitiesStore();

const buscarClienteDialog = ref(false);
const form = useTemplateRef("form");

const registroClienteFlag = computed(() => rootStore.state.registroClienteFlag);
const estadoCotizacionItems = computed(() => {
  const list = pricingStore.listQuoteStatus || [];
  const idStatus = pricingStore.datosPrincipales.id_status;
  const nameStatus = pricingStore.datosPrincipales.nameStatusQuote;

  const exists = list.some((v) => v.id == idStatus);
  if (exists || !idStatus || !nameStatus) {
    return list;
  }

  return [
    ...list,
    {
      id: idStatus,
      name: nameStatus,
    },
  ];
});

watch(registroClienteFlag, async () => {
  rootStore.state.spiner = true;
  await rootStore.dispatch("_getEntities");
  rootStore.state.spiner = false;
  if (entitiesStore.id) {
    const cliente = rootStore.state.itemsEntities.filter(
      (v: { id: number }) => v.id == entitiesStore.id,
    )[0];

    pricingStore.datosPrincipales.id_entitie = cliente.id;
    pricingStore.datosPrincipales.nombre = cliente.namelong;
    pricingStore.datosPrincipales.telefono = cliente.phone;
  }
  buscarClienteDialog.value = false;
});

//  itemsEntities
onMounted(() => {
  rootStore.dispatch("_getProveedor");
});

// eslint-disable-next-line @typescript-eslint/no-unused-vars
async function changeShipment() {
  if (pricingStore.datosPrincipales.idtipocarga) {
    rootStore.state.spiner = true;
    // @ts-expect-error Kept: the store action destructures its argument, so the call without one throws
    await pricingStore.getPortBegin();
    // @ts-expect-error Kept: the store action destructures its argument, so the call without one throws
    await pricingStore.getPortEnd();
    rootStore.state.spiner = false;
  }
}
// eslint-disable-next-line @typescript-eslint/no-unused-vars
async function aceptar() {
  if ((await form.value!.validate()).valid) {
    pricingStore.step2 = true;
  }
}
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function guardarCliente(e: unknown, { item }: { item: { id: number; namelong: string; phone: string } }) {
  pricingStore.datosPrincipales.id_entitie = item.id;
  pricingStore.datosPrincipales.nombre = item.namelong;
  pricingStore.datosPrincipales.telefono = item.phone;
  buscarClienteDialog.value = false;
}
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function registrarNuevoCliente() {
  rootStore.state.modalEntitie = true;
}
function mostrarProveedorFlag() {
  const exw = pricingStore.listIncoterms.filter(
    (v) =>
      v.id == pricingStore.datosPrincipales.idincoterms && v.name == "EXW",
  );

  return exw.length > 0 ? true : false;
}
</script>

<template>
  <v-container
    fluid
    class="pa-0"
  >
    <v-card elevation="0">
      <v-card-title primary-title>
        Datos Principales
      </v-card-title>
      <v-card-text>
        <v-form
          class="px-2"
          ref="form"
        >
          <v-autocomplete
            label="Tipo de Marketing"
            variant="outlined"
            density="compact"
            class="my-1"
            :items="pricingStore.listMarketing"
            item-title="name"
            item-value="id"
            v-model="pricingStore.datosPrincipales.id_marketing"
            readonly
            v-if="mostrarmarketing"
          />
          <v-autocomplete
            label="Estado de la cotización"
            variant="outlined"
            density="compact"
            class="my-1"
            :items="estadoCotizacionItems"
            item-title="name"
            item-value="id"
            v-model="pricingStore.datosPrincipales.id_status"
            readonly
            v-if="mostrarmarestado"
          />
          <v-autocomplete
            label="Ejecutivo"
            variant="outlined"
            density="compact"
            class="my-1"
            :items="pricingStore.listEjecutivo"
            item-title="name"
            item-value="id_entitie"
            v-model="pricingStore.datosPrincipales.id_vendedor"
            readonly
            v-if="mostrarmarejecutivo"
          />

          <v-autocomplete
            label="Pricing"
            variant="outlined"
            density="compact"
            class="my-1"
            :items="pricingStore.listEjecutivo"
            item-title="name"
            item-value="id_entitie"
            v-model="pricingStore.datosPrincipales.id_pricing"
            readonly
            v-if="mostrarmarpricing"
          />
          <v-text-field
            label="Nombres"
            variant="outlined"
            placeholder="Nombres..."
            density="compact"
            requerid
            autocomplete="off"
            id="nombre"
            name="nombre"
            v-model="pricingStore.datosPrincipales.nombre"
            readonly
          />
          <v-text-field
            label="Teléfono"
            variant="outlined"
            placeholder="Teléfono..."
            density="compact"
            readonly
            v-model="pricingStore.datosPrincipales.telefono"
          />

          <v-autocomplete
            label="Sentido"
            variant="outlined"
            density="compact"
            class="my-1"
            :items="pricingStore.listModality"
            item-title="name"
            item-value="id"
            v-model="pricingStore.datosPrincipales.idsentido"
            readonly
          />
          <v-autocomplete
            label="Tipo de Embarque"
            variant="outlined"
            density="compact"
            class="my-1"
            :items="pricingStore.listShipment"
            item-title="embarque"
            item-value="id"
            v-model="pricingStore.datosPrincipales.idtipocarga"
            readonly
          />
          <v-autocomplete
            label="Incoterms"
            variant="outlined"
            density="compact"
            class="my-1"
            :items="pricingStore.listIncoterms"
            item-title="name"
            item-value="id"
            v-model="pricingStore.datosPrincipales.idincoterms"
            readonly
          >
            <template #selection="data">
              {{ data.item.name }} - {{ data.item.description }}
            </template>
          </v-autocomplete>

          <v-text-field
            name="name"
            label="Nombre del proveedor"
            id="id"
            v-model="pricingStore.datosPrincipales.proveedor"
            density="compact"
            variant="outlined"
            readonly
            v-if="mostrarProveedorFlag()"
          />

          <v-text-field
            name="Teléfono"
            label="Teléfono del proveedor"
            v-model="pricingStore.datosPrincipales.telefonoproveedor"
            density="compact"
            variant="outlined"
            readonly
            v-if="mostrarProveedorFlag()"
          />

          <v-text-field
            label="Dirección del proveedor"
            v-model="pricingStore.datosPrincipales.direccionproveedor"
            density="compact"
            variant="outlined"
            readonly
            v-if="mostrarProveedorFlag()"
          />
        </v-form>
      </v-card-text>
    </v-card>
  </v-container>
</template>

<style></style>
