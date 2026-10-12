<template>
  <v-container>
    <v-data-table
      :headers="headers"
      :items="$store.state.calculadoras.config"
      item-key="id"
    >
      <template v-slot:[`item.texto`]="{ item, index }">
        <div class="d-flex align-center">
          <v-textarea
            :id="`texto${index}`"
            variant="outlined"
            v-model="item.texto"
            :disabled="!item.editarflag"
            class="custom-field-sizing"
          ></v-textarea>
        </div>
      </template>
      <template v-slot:[`item.action`]="{ item, index }">
        <v-btn
          v-if="!item.editarflag"
          @click="activarEditar(item, index)"
          color="#FFD600"
          size="small"
        >
          <v-icon size="small">mdi-square-edit-outline</v-icon>
        </v-btn>
        <v-btn
          v-else
          color="#004D40"
          dark
          size="small"
          @click="guardarCambios(item, index)"
        >
          <v-icon size="small">mdi-content-save-all</v-icon></v-btn
        >
      </template>
    </v-data-table>
  </v-container>
</template>

<script>
import { mapActions } from "vuex";

export default {
  data() {
    return {
      config: {},
      headers: [
        { text: "codigo", value: "codigo", width: "10%" },
        { text: "descripcion", value: "descripcion", width: "20%" },
        { text: "texto", value: "texto", width: "30%" },
        // { text: "valorjson", value: "valorjson", width: "10%" },
        // { text: "numero", value: "numero", width: "15%" },
        // { text: "fecha", value: "fecha", width: "15%" },
        { text: "", value: "action", width: "5%" },
      ],
    };
  },
  mounted() {
    this.getConfiguración({});
  },
  methods: {
    ...mapActions(["getConfiguración", "ActualizarConfig"]),
    async guardarCambios(item, index) {
      await this.ActualizarConfig(item);
      item.editarflag = false;
      this.$nextTick(() => {
        // document.getElementById(`texto${index}`).focus();
        // document.getElementById(`texto${index}`).select();
      });
    },
    activarEditar(item, index) {
      let val = this.$store.state.calculadoras.config.some(
        (v) => v.editarflag && v.id != item.id,
      );
      if (val) {
        this.$swal.fire({
          icon: "error",
          title: "Error Al Editar",
          text: "Tiene una configuración para  editar, guarde para editar otro.",
        });
        return;
      }
      item.editarflag = true;
      this.config = item;
      this.$nextTick(() => {
        document.getElementById(`texto${index}`).focus();
        document.getElementById(`texto${index}`).select();
      });
    },
  },
};
</script>

<style scoped>
.custom-field-sizing {
  field-sizing: content !important;
}
</style>
