<template>
  <div>
    <v-container>
      <v-row>
        <v-col cols="12" md="6">
          <v-card>
            <v-card-text>
              <controlEntitiesCom dataClien="1" />
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>
    </v-container>
  </div>
</template>
<script>
import controlEntitiesCom from "@/components/folderEntities/controlEntities.vue";
export default {
  name: "controlEntities",
  components: {
    controlEntitiesCom,
  },
  mounted() {
    this.$store.state.mainTitle = "Datos Generales de la Entidad";
  },
};
</script>
