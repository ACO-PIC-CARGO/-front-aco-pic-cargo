<script setup lang="ts">
import controlAccountPaysCom from "@/components/folderModulesPays/ControlAccountPaysComponent.vue";
</script>

<template>
  <div>
    <v-container fluid>
      <v-row>
        <v-col
          md="8"
          cols="12"
        >
          <controlAccountPaysCom tipo="editar" />
        </v-col>
      </v-row>
    </v-container>
  </div>
</template>
