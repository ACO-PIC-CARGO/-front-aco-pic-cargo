<template>
  <v-container fluid>
    <v-card>
      <ListPersonaRol />
    </v-card>
  </v-container>
</template>

<script>
import { defineAsyncComponent } from "vue";
export default {
  components: {
    ListPersonaRol: defineAsyncComponent(() =>
      import(
        "../../../components/Security/RolPersona/listPersonaRolComponent.vue"
      )),
  },
  mounted(){
    this.$store.state.mainTitle = 'ASIGNAR ROLES A PERSONAS'
  }
};
</script>

<style></style>
