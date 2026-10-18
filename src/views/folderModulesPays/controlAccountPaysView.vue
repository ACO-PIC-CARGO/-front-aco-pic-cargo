<template>
  <div>
    <v-container fluid>
      <v-row>
        <v-col md="8" cols="12">
          <controlAccountPaysCom tipo="ver" />
        </v-col>
      </v-row>
    </v-container>
  </div>
</template>

<script>
import controlAccountPaysCom from "@/components/folderModulesPays/controlAccountPays.vue";
export default {
  name: "controlAccountPays",
  components: {
    controlAccountPaysCom,
  },
};
</script>
