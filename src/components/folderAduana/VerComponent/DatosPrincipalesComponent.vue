<script setup lang="ts">
import { computed, ref, useTemplateRef, watch } from "vue";
import { useAppStore } from "@/stores/app";
import { useEntitiesStore } from "@/stores/entities";
import { usePricingStore } from "@/stores/pricing";
import { useAduanaStore } from "@/stores/aduana";

const appStore = useAppStore();
const aduanaStore = useAduanaStore();
const pricingStore = usePricingStore();
const entitiesStore = useEntitiesStore();

const buscarClienteDialog = ref(false);
const form = useTemplateRef("form");

const registroClienteFlag = computed(() => appStore.registroClienteFlag);

//  itemsEntities

// eslint-disable-next-line @typescript-eslint/no-unused-vars
async function changeShipment() {
  if (aduanaStore.datosPrincipales.idtipocarga) {
    appStore.spiner = true;
    // @ts-expect-error the store action destructures its argument, so the call without one throws
    await pricingStore.getPortBegin();
    // @ts-expect-error the store action destructures its argument, so the call without one throws
    await pricingStore.getPortEnd();
    appStore.spiner = false;
  }
}
// eslint-disable-next-line @typescript-eslint/no-unused-vars
async function aceptar() {
  if ((await form.value!.validate()).valid) {
    aduanaStore.step2 = true;
  }
}
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function guardarCliente(e: unknown, { item }: { item: { id: number; namelong: string; phone: string } }) {
  aduanaStore.datosPrincipales.id_entitie = item.id;
  aduanaStore.datosPrincipales.nombre = item.namelong;
  aduanaStore.datosPrincipales.telefono = item.phone;
  buscarClienteDialog.value = false;
}
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function registrarNuevoCliente() {
  appStore.modalEntitie = true;
}
function mostrarProveedorFlag() {
  const exw = aduanaStore.listIncoterms.filter(
    (v) =>
      v.id == aduanaStore.datosPrincipales.idincoterms &&
      v.name == "EXW"
  );

  return exw.length > 0 ? true : false;
}

watch(registroClienteFlag, async () => {
  appStore.spiner = true;
  await appStore._getEntities();
  appStore.spiner = false;
  if (entitiesStore.id) {
    const cliente = appStore.itemsEntities.filter(
      (v: { id: number }) => v.id == entitiesStore.id
    )[0]!;

    aduanaStore.datosPrincipales.id_entitie = cliente.id;
    aduanaStore.datosPrincipales.nombre = cliente.namelong;
    aduanaStore.datosPrincipales.telefono = cliente.phone;
  }
  buscarClienteDialog.value = false;
});
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
            v-model="aduanaStore.datosPrincipales.id_marketing"
            readonly
          />
          <v-autocomplete
            label="Estado de la cotización"
            variant="outlined"
            density="compact"
            class="my-1"
            :items="pricingStore.listQuoteStatus"
            item-title="name"
            item-value="id"
            v-model="aduanaStore.datosPrincipales.id_status"
            readonly
          />
          <v-autocomplete
            label="Ejecutivo"
            variant="outlined"
            density="compact"
            class="my-1"
            :items="pricingStore.listEjecutivo"
            item-title="name"
            item-value="id_entitie"
            v-model="aduanaStore.datosPrincipales.id_vendedor"
            readonly
          />

          <v-autocomplete
            label="Pricing"
            variant="outlined"
            density="compact"
            class="my-1"
            :items="pricingStore.listEjecutivo"
            item-title="name"
            item-value="id_entitie"
            v-model="aduanaStore.datosPrincipales.id_pricing"
            readonly
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
            v-model="aduanaStore.datosPrincipales.nombre"
            readonly
          />
          <v-text-field
            label="Teléfono"
            variant="outlined"
            placeholder="Teléfono..."
            density="compact"
            readonly
            v-model="aduanaStore.datosPrincipales.telefono"
          />

          <v-autocomplete
            label="Sentido"
            variant="outlined"
            density="compact"
            class="my-1"
            :items="aduanaStore.listModality"
            item-title="name"
            item-value="id"
            v-model="aduanaStore.datosPrincipales.idsentido"
            readonly
          />
          <!-- @vue-expect-error return-object writes the row into the id-or-row field -->
          <v-autocomplete
            label="Tipo de Embarque"
            variant="outlined"
            density="compact"
            class="my-1"
            :items="aduanaStore.listShipment"
            item-title="embarque"
            item-value="id"
            v-model="aduanaStore.datosPrincipales.idtipocarga"
            return-object
            readonly
          />
          <v-autocomplete
            label="Incoterms"
            variant="outlined"
            density="compact"
            class="my-1"
            :items="aduanaStore.listIncoterms"
            item-title="name"
            item-value="id"
            v-model="aduanaStore.datosPrincipales.idincoterms"
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
            v-model="aduanaStore.datosPrincipales.proveedor"
            density="compact"
            variant="outlined"
            readonly
            v-if="mostrarProveedorFlag()"
          />

          <v-text-field
            name="Teléfono"
            label="Teléfono del proveedor"
            v-model="aduanaStore.datosPrincipales.telefonoproveedor"
            density="compact"
            variant="outlined"
            readonly
            v-if="mostrarProveedorFlag()"
          />

          <v-text-field
            label="Dirección del proveedor"
            v-model="aduanaStore.datosPrincipales.direccionproveedor"
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
