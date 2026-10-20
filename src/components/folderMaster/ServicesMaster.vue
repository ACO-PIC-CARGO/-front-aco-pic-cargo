<script setup lang="ts">
import { useStore } from "vuex";

const rootStore = useStore();
</script>

<template>
  <div>
    <h3>Servicios a Realizar</h3>
    <v-container fluid>
      <v-row class="Services__Main">
        <v-col
          v-for="items in rootStore.state.itemsServicesBegin"
          :key="items"
          cols="12"
          md="6"
        >
          <v-list>
            <v-header>{{ items.namegroupservice }}</v-header>

            <v-list-item
              class="listMain"
              v-for="child in items.groupservice"
              :key="child"
            >
              <template #prepend>
                <v-avatar size="28">
                  <v-icon
                    size="small"
                    class="bg-grey-lighten-1"
                  >
                    mdi-folder
                  </v-icon>
                </v-avatar>
              </template>

              
              <!-- eslint-disable vue/no-v-text-v-html-on-component -->
              <v-list-item-title
                style="font-size: 14px"
                v-text="child.nameservice"
              />
              <!-- eslint-enable vue/no-v-text-v-html-on-component -->
              <!-- 
                <v-list-item-subtitle v-text="asfasf"></v-list-item-subtitle> -->
              

              <v-list-item-action>
                <v-switch
                  v-model="child.id"
                  density="compact"
                />
              </v-list-item-action>
            </v-list-item>
          </v-list>
        </v-col>
      </v-row>
    </v-container>
  </div>
</template>

<style lang="scss" scoped>
.listMain {
  padding: 0px;
}
</style>
