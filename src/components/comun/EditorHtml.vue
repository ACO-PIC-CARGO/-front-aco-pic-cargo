<template>
  <v-container fluid>
    <v-row>
      <v-col cols="12" class="px-5 py-0">
        <v-alert border="left" colored-border type="info" elevation="2" shaped>
          Los valores entre corchetes representan los datos que serán
          reemplazados automáticamente con la información correspondiente al
          house. Por favor, no modifique ni elimine el contenido dentro de los
          corchetes. Si desea que un valor no se muestre, simplemente elimine el
          texto entre los corchetes.
        </v-alert>
      </v-col>
      <v-col cols="6" class="px-5 py-0">
        <!-- Editor TinyMCE -->
        <editor
          v-model="$store.state.configAviso.configAviso.aviso_llegada"
          :init="editorInit"
          api-key="ekgy1sit0k1ooxgcad7shciwqa3oc3ykfrd9mp5hso1ch8r7"
        />
      </v-col>
      <v-col cols="6" class="classPreview">
        <div v-html="$store.state.configAviso.configAviso.aviso_llegada"></div>
      </v-col>
    </v-row>
  </v-container>
</template>

<script>
import Editor from "@tinymce/tinymce-vue";

export default {
  components: {
    Editor,
  },
  props: ["html"],
  data() {
    return {
      editorContent: ``,
      editorInit: {
        height: 920,
        menubar: false,
        plugins: [
          "advlist autolink lists link image charmap print preview anchor",
          "searchreplace visualblocks code fullscreen",
          "insertdatetime media table paste code help wordcount",
        ],
        toolbar:
          "undo redo | formatselect | bold italic | alignleft aligncenter alignright | code | link image",
        placeholder: "Escribe tu contenido aquí...", // Placeholder en el editor
        setup: (editor) => {
          // Aquí puedes asegurarte de que TinyMCE se inicializa correctamente
          editor.on("init", () => {});
        },
      },
    };
  },
  methods: {
    guardarContenido() {
      // Aquí puedes hacer lo que desees con el contenido del editor
    },
  },
};
</script>

<style scoped>
.classPreview {
  padding: 1% 5% !important;
  border: 1px solid #000000;
  border-radius: 25px;
}
</style>
