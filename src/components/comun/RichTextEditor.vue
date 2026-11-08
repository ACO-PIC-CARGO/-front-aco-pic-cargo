<script setup lang="ts">
import Editor from "@tinymce/tinymce-vue";

defineProps<{ label: string }>();
const html = defineModel<string>({ required: true });

const TINYMCE_API_KEY = "ekgy1sit0k1ooxgcad7shciwqa3oc3ykfrd9mp5hso1ch8r7";
const init = {
  height: 260,
  menubar: false,
  plugins: "lists link",
  toolbar: "undo redo | blocks | bold italic underline | bullist numlist | link",
};
</script>

<template>
  <div>
    <p class="text-body-medium font-weight-medium mb-2">
      {{ label }}
    </p>
    <Editor
      v-model="html"
      :init="init"
      :api-key="TINYMCE_API_KEY"
    />
  </div>
</template>
