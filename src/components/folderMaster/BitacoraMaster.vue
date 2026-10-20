<script setup lang="ts">
import { useStore } from "vuex";

const rootStore = useStore();
</script>

<template>
  <div>
    <h3>Estatus del embarque</h3>

    <v-expansion-panels class="mt-3">
      <v-expansion-panel
        v-for="items in rootStore.state.itemsBitacoraList"
        :key="items"
      >
        <v-expansion-panel-title>
          {{ items.namegroupservice }}
        </v-expansion-panel-title>
        <v-expansion-panel-text>
          <v-list lines="three">
            <v-list-item
              v-for="child in items.groupservice"
              :key="child"
            >
              <template #prepend>
                <v-checkbox />
              </template>

              
              <v-list-item-title>
                {{
                  child.namebitacora
                }}
              </v-list-item-title>
              <v-list-item-subtitle>
                <v-text-field
                  label="Comentario"
                  type="text"
                /><v-text-field
                  label="Fecha"
                  type="date"
                />
              </v-list-item-subtitle>
            </v-list-item>
          </v-list>
        </v-expansion-panel-text>
      </v-expansion-panel>
    </v-expansion-panels>
  </div>
</template>

<style lang="scss" scoped></style>
