<template>
  <div>
    <v-container fluid>
      <v-row>
        <v-col md="8" cols="12">
          <controlAccountPaysCom tipo="nuevo" />
        </v-col>
      </v-row>
    </v-container>
  </div>
</template>

<script>
import controlAccountPaysCom from "@/components/folderModulesPays/controlAccountPays";
export default {
  name: "controlAccountPays",
  components: {
    controlAccountPaysCom,
  },
  mounted() {
    this.$store.state.mainTitle = "NUEVA CUENTA POR PAGAR";
    this.$nextTick(() => {
      this.$store.state.drawer = false;
    });
  },
};
</script>
