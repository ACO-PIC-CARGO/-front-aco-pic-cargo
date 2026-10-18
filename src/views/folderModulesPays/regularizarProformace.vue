<template>
  <div>
    <v-container fluid>
      <v-card elevation="0">
        <v-card-title> Regularizar Proformace </v-card-title>
        <v-card-text>
          <RegularizarFacturaCom type="tipo"/>
        </v-card-text>
      </v-card>
    </v-container>
  </div>
</template>
<script>
import RegularizarFacturaCom from "@/components/folderModulesPays/regularizarProformace.vue";

export default {
  components: {
    RegularizarFacturaCom,
  },
  name: "regularizarProformace",
};
</script>