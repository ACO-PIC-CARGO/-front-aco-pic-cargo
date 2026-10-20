<script setup lang="ts">
import controlAccountReceivable from "@/components/folderModulesPays/ControlAccountReceivableComponent.vue";
</script>

<template>
  <div>
    <v-container fluid>
      <v-row>
        <v-col
          md="8"
          cols="12"
        >
          <controlAccountReceivable tipo="editar" />
        </v-col>
      </v-row>
    </v-container>
  </div>
</template>
