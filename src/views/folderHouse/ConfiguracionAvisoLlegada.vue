<template>
  <v-container fluid>
    <v-card>
      <v-card-text>
        <Editor />
      </v-card-text>
      <v-card-actions>
        <v-btn color="success" @click="guardarContenido">
          Guardar contenido
        </v-btn>
        <v-btn color="warning" @click="reset"> Resetear al Original </v-btn>
      </v-card-actions>
    </v-card>
  </v-container>
</template>

<script>
import Editor from "@/components/comun/EditorHtml.vue";
import { mapActions } from "vuex";

export default {
  components: {
    Editor,
  },
  mounted() {

    this.obtenerConfigAviso();
  },
  methods: {
    ...mapActions(["obtenerConfigAviso", "actualizarConfigAviso"]),
    reset() {
      this.$store.state.configAviso.configAviso.aviso_llegada =
        this.$store.state.configAviso.configAviso.aviso_llegada_original;
    },
    async guardarContenido() {
      
      await this.actualizarConfigAviso(this.$store.state.configAviso.configAviso)
    },
  },
};
</script>
