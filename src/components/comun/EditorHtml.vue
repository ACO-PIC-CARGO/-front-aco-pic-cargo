<script setup lang="ts">
import Editor from "@tinymce/tinymce-vue";
import { useStore } from "vuex";

defineProps<{ html?: string }>();

const rootStore = useStore();

const editorInit = {
  height: 920,
  menubar: false,
  plugins:
    "advlist autolink lists link image charmap preview anchor searchreplace visualblocks code fullscreen insertdatetime media table help wordcount",
  toolbar:
    "undo redo | blocks | bold italic | alignleft aligncenter alignright | code | link image",
  placeholder: "Escribe tu contenido aquí...", // Placeholder en el editor
  setup: (editor: { on: (event: string, handler: () => void) => void }) => {
    // Aquí puedes asegurarte de que TinyMCE se inicializa correctamente
    editor.on("init", () => {});
  },
};
</script>

<template>
  <v-container fluid>
    <v-row>
      <v-col
        cols="12"
        class="px-5 py-0"
      >
        <v-alert
          border="start"
          border-color="info"
          type="info"
          elevation="2"
          rounded="shaped"
        >
          Los valores entre corchetes representan los datos que serán
          reemplazados automáticamente con la información correspondiente al
          house. Por favor, no modifique ni elimine el contenido dentro de los
          corchetes. Si desea que un valor no se muestre, simplemente elimine el
          texto entre los corchetes.
        </v-alert>
      </v-col>
      <v-col
        cols="6"
        class="px-5 py-0"
      >
        <!-- Editor TinyMCE -->
        <editor
          v-model="rootStore.state.configAviso.configAviso.aviso_llegada"
          :init="editorInit"
          api-key="ekgy1sit0k1ooxgcad7shciwqa3oc3ykfrd9mp5hso1ch8r7"
        />
      </v-col>
      <v-col
        cols="6"
        class="classPreview"
      >
        <!-- eslint-disable-next-line vue/no-v-html -->
        <div v-html="rootStore.state.configAviso.configAviso.aviso_llegada" />
      </v-col>
    </v-row>
  </v-container>
</template>

<style scoped>
.classPreview {
  padding: 1% 5% !important;
  border: 1px solid #000000;
  border-radius: 25px;
}
</style>
