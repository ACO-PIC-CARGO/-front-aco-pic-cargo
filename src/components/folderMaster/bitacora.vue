<template>
  <div>
    <h3>Estatus del embarque</h3>

    <v-expansion-panels class="mt-3">
      <v-expansion-panel
        v-for="items in $store.state.itemsBitacoraList"
        :key="items"
      >
        <v-expansion-panel-title>
          {{ items.namegroupservice }}
        </v-expansion-panel-title>
        <v-expansion-panel-text>
          <v-list lines="three">
            <v-list-item v-for="child in items.groupservice" :key="child">
              <v-list-item-avatar>
                <v-checkbox></v-checkbox>
              </v-list-item-avatar>

              
                <v-list-item-title>{{
                  child.namebitacora
                }}</v-list-item-title>
                <v-list-item-subtitle>
                  <v-text-field label="Comentario" type="text"></v-text-field
                  ><v-text-field label="Fecha" type="date"></v-text-field
                ></v-list-item-subtitle>
              
            </v-list-item>
          </v-list>
        </v-expansion-panel-text>
      </v-expansion-panel>
    </v-expansion-panels>
  </div>
</template>

<script>
export default {
  name: "bitacora",
};
</script>

<style lang="scss" scoped></style>
