<script setup lang="ts">
import { onMounted, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useEnterprisesStore } from "@/stores/enterprises";
import { useMasterusuariosStore } from "@/stores/masterusuarios";

const route = useRoute();
const router = useRouter();
const enterprisesStore = useEnterprisesStore();
const masterusuariosStore = useMasterusuariosStore();

const loading_as = ref(true);

watch(
  () => enterprisesStore.record,
  (newRecord) => {
    if (newRecord && Object.keys(newRecord).length > 0) {
      loading_as.value = false;
    }
  },
  { immediate: true },
);

onMounted(async () => {
  await masterusuariosStore.cargarImpuestoRenta();
  await enterprisesStore.readEnterprise(route.params.id as string);
});

function volver() {
  router.go(-1);
}
</script>

<template>
  <v-container>
    <v-container
      v-if="loading_as"
      style="height: 400px"
    >
      <v-row class="fill-height align-content-center justify-center">
        <v-col
          class="text-body-large text-center"
          cols="6"
        >
          Cargando información ....
        </v-col>
        <v-col cols="6">
          <v-progress-linear
            color="deep-purple-accent-4"
            indeterminate
            rounded
            height="6"
          />
        </v-col>
      </v-row>
    </v-container>

    <v-card class="py-10 px-10">
      <v-card-title
        class="d-flex align-center flex-wrap"
        v-if="!loading_as"
      >
        Ver: {{ enterprisesStore.record.business_name }}
        <v-spacer />

        <v-card-text class="px-0">
          <v-row>
            <v-col cols="6">
              <v-text-field
                label="Tipo de Documento"
                readonly
                density="compact"
                :model-value="enterprisesStore.record.td_name"
              />
            </v-col>
            <v-col cols="6">
              <v-text-field
                label="N° de Documento"
                readonly
                density="compact"
                :model-value="enterprisesStore.record.document"
              />
            </v-col>
            <v-col cols="6">
              <v-text-field
                label="Nombre Comercial"
                readonly
                density="compact"
                :model-value="enterprisesStore.record.trade_name"
              />
            </v-col>
            <v-col cols="6">
              <v-text-field
                label="Nombre Negocio"
                readonly
                density="compact"
                :model-value="enterprisesStore.record.business_name"
              />
            </v-col>
            <v-col cols="6">
              <v-text-field
                label="Slogan"
                readonly
                density="compact"
                :model-value="enterprisesStore.record.slogan"
              />
            </v-col>
            <v-col cols="6">
              <v-text-field
                label="IC"
                readonly
                density="compact"
                :model-value="enterprisesStore.record.ic"
              />
            </v-col>
            <v-col cols="6">
              <v-text-field
                label="Logo"
                readonly
                density="compact"
                :model-value="enterprisesStore.record.name_file"
              />
              <!-- <div>
                <label for="image">Logo</label>
                <v-img
                    v-if="$store.state.enterprises.record.path"
                    :src="$store.state.enterprises.record.path"
                    height="200">
                </v-img>
              </div> -->
            </v-col>
            <v-col cols="6">
              <v-text-field
                label="País"
                readonly
                density="compact"
                :model-value="enterprisesStore.record.lp_name"
              />
            </v-col>
            <v-col cols="6">
              <v-text-field
                label="Región"
                readonly
                density="compact"
                :model-value="enterprisesStore.record.ls_name"
              />
            </v-col>
            <v-col cols="6">
              <v-text-field
                label="Provincia"
                readonly
                density="compact"
                :model-value="enterprisesStore.record.lc_name"
              />
            </v-col>
            <v-col cols="6">
              <v-text-field
                label="Distrito"
                readonly
                density="compact"
                :model-value="enterprisesStore.record.lt_name"
              />
            </v-col>
            <v-col cols="6">
              <v-text-field
                label="Dirección"
                readonly
                density="compact"
                :model-value="enterprisesStore.record.address"
              />
            </v-col>
            <v-col cols="6">
              <v-text-field
                label="Estado"
                readonly
                density="compact"
                :model-value="
                  enterprisesStore.record.status == 1
                    ? 'Activo'
                    : 'Inactivo'
                "
              />
            </v-col>
            <v-col cols="6">
              <v-autocomplete
                label="Impuestos a las Ventas en tu País"
                :items="masterusuariosStore.lstImpRenta"
                item-value="id"
                item-title="descripcion"
                readonly
                density="compact"
                v-model="enterprisesStore.record.tipoimpuesto"
              >
                <template #selection="data">
                  <span v-if="data.item">{{ data.item.codigo }}</span>
                </template>
              </v-autocomplete>
            </v-col>
            <v-col cols="6">
              <v-text-field
                type="number"
                label="Porcentaje"
                step="0.1"
                suffix="%"
                readonly
                density="compact"
                hide-details
                v-model="enterprisesStore.record.impuesto"
              />
            </v-col>
          </v-row>
        </v-card-text>
      </v-card-title>
      <v-card-actions
        v-if="!loading_as"
        class="justify-end mt-3"
      >
        <v-btn
          size="small"
          class="mx-1"
          color="red"
          @click="volver()"
          rounded
        >
          Aceptar
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-container>
</template>
