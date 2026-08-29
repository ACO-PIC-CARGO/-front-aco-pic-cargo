<template>
  <div>
    <v-container fluid>
      <v-row>
        <v-col md="8" cols="12">
          <controlAccountReceivable tipo="nuevo" />
        </v-col>
      </v-row>
    </v-container>
  </div>
</template>
<script>
import controlAccountReceivable from "@/components/folderModulesPays/controlAccountReceivable.vue";
export default {
  components: {
    controlAccountReceivable,
  },
  name: "controlAccountReceivableNew",
   mounted() {
    this.$store.state.mainTitle = "NUEVA CUENTA POR COBRAR";
    this.$nextTick(() => {
      this.$store.state.drawer = false;
    });
  },
};
</script>
