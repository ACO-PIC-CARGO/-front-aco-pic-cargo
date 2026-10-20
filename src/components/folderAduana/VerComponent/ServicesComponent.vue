<script setup lang="ts">
import { useAduanaStore } from "@/stores/aduana";

const aduanaStore = useAduanaStore();
</script>

<template>
  <v-card elevation="0">
    <v-card-title primary-title>
      SERVICIOS A REALIZAR:
    </v-card-title>
    <v-card-text>
      <v-row>
        <v-col cols="3">
          <h4 class="mb-2">
            ORIGEN
          </h4>
          <v-checkbox
            density="compact"
            v-for="service in aduanaStore.listServices.filter(
              (v) => v.codebegend == 'OR'
            )"
            :key="service.id"
            v-model="service.status"
            :value-comparator="(value, checked) => Boolean(value) === checked"
            readonly
          >
            <template #label>
              {{ service.namegroupservice }}
            </template>
          </v-checkbox>
        </v-col>
        <v-col cols="3">
          <h4 class="mb-2">
            FLETE
          </h4>
          <v-checkbox
            density="compact"
            v-for="service in aduanaStore.listServices.filter(
              (v) => v.codebegend == 'FL'
            )"
            :key="service.id"
            v-model="service.status"
            :value-comparator="(value, checked) => Boolean(value) === checked"
            readonly
          >
            <template #label>
              {{ service.namegroupservice }}
            </template>
          </v-checkbox>
        </v-col>
        <v-col cols="3">
          <h4 class="mb-2">
            DESTINO
          </h4>
          <v-checkbox
            density="compact"
            v-for="service in aduanaStore.listServices.filter(
              (v) => v.codebegend == 'DE'
            )"
            :key="service.id"
            v-model="service.status"
            :value-comparator="(value, checked) => Boolean(value) === checked"
            readonly
          >
            <template #label>
              {{ service.namegroupservice }}
            </template>
          </v-checkbox>
        </v-col>
        <v-col cols="3">
          <h4 class="mb-2">
            OPCIONAL
          </h4>
          <v-checkbox
            density="compact"
            v-for="service in aduanaStore.listServices.filter(
              (v) => v.codebegend == 'OP'
            )"
            :key="service.id"
            v-model="service.status"
            :value-comparator="(value, checked) => Boolean(value) === checked"
            readonly
          >
            <template #label>
              {{ service.namegroupservice }}
            </template>
          </v-checkbox>
          <v-text-field
            prefix="$"
            :error-messages="aduanaStore.errorValorMercancia"
            v-model="aduanaStore.datosPrincipales.amount"
            label="Valor de la mercancia"
            type="number"
            step="0.10"
            min="0"
            placeholder="Valor de la mercancia..."
            autocomplete="off"
            density="compact"
            readonly
          />
          <v-text-field
            v-if="
              (aduanaStore.listServices.filter(
                (v) => v.codegroupservices == 15
              ).length > 0
                ? aduanaStore.listServices.filter(
                  (v) => v.codegroupservices == 15
                )[0]!.status
                : false) ||
                (aduanaStore.listServices.filter(
                  (v) => v.codegroupservices == 2
                ).length > 0
                  ? aduanaStore.listServices.filter(
                    (v) => v.codegroupservices == 2
                  )[0]!.status
                  : false) ||
                (aduanaStore.listServices.filter(
                  (v) => v.codegroupservices == 6
                ).length > 0
                  ? aduanaStore.listServices.filter(
                    (v) => v.codegroupservices == 6
                  )[0]!.status
                  : false)
            "
            v-model="
              aduanaStore.datosPrincipales.descripcioncarga
            "
            label="Descripción de carga"
            placeholder="Descripción de carga"
            autocomplete="off"
            density="compact"
            readonly
          />
        </v-col>
      </v-row>
    </v-card-text>
  </v-card>
</template>

<style></style>
