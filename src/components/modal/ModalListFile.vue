<template>
  <div>
    <v-dialog
      :model-value="dialog"
      @update:model-value="$emit('update:dialog', $event)"
      width="1400"
    >
      <v-card>
        <v-card-title class="text-headline-medium bg-grey-lighten-2">
          SELECCIONE UN HOUSE
        </v-card-title>

        <v-card-text>
          <listHouse statusList="2" />
        </v-card-text>

        <v-divider></v-divider>

        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="primary" variant="text" @click="$emit('update:dialog', false)"> Cerrar </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script>
import listHouse from "@/components/folderHouse/ListHouseComponent.vue";
export default {
  name: "modalListFile",
  emits: ["update:dialog"],
  props: {
    dialog: {
      type: Boolean,
      default: false,
    },
  },
  components: {
    listHouse,
  },
};
</script>
