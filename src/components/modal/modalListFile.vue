<template>
  <div>
    <v-dialog :model-value="dialog" width="1400">
      <v-card>
        <v-card-title class="text-h5 bg-grey-lighten-2">
          SELECCIONE UN HOUSE
        </v-card-title>

        <v-card-text>
          <listHouse statusList="2" />
        </v-card-text>

        <v-divider></v-divider>

        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="primary" variant="text" @click="dialog = false"> Cerrar </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script>
import listHouse from "@/components/folderHouse/listHouse.vue";
export default {
  name: "modalListFile",
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
