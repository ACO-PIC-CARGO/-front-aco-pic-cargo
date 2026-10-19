<script setup lang="ts">
import { ref } from "vue";

const tab = ref("usuarios");
</script>

<template>
  <v-card>
    <v-container>
      <v-row>
        <v-col cols="12">
          <h3>Registro de Suscripción</h3>
        </v-col>
        <v-col
          cols="12"
          md="4"
        >
          Nombre:
          <v-text-field
            variant="solo"
            density="compact"
          />
        </v-col>
        <v-col
          cols="12"
          md="8"
        >
          Descripcion:
          <v-textarea
            variant="solo"
            rows="1"
            density="compact"
          />
        </v-col>
        <v-col
          cols="12"
          class="pt-0"
        >
          <v-tabs
            v-model="tab"
            color="primary"
            align-tabs="center"
            slider-color="primary"
          >
            <v-tab value="usuarios">
              Usuarios
            </v-tab>
            <v-tab value="Detalles">
              Detalles
            </v-tab>
          </v-tabs>
          <v-tabs-window v-model="tab">
            <v-tabs-window-item value="usuarios">
              dddd
            </v-tabs-window-item>
            <v-tabs-window-item value="Detalles">
              aaa
            </v-tabs-window-item>
          </v-tabs-window>
        </v-col>
      </v-row>
    </v-container>
  </v-card>
</template>

<style></style>
