<script setup lang="ts">
import ListRequestPaymentComponent from "../../components/folderRequests/ListRequestPaymentComponent.vue";
</script>

<template>
  <div>
    <v-container fluid>
      <v-row>
        <v-col
          cols="12"
          md="12"
        >
          <ListRequestPaymentComponent filtrar-flag="false" />
        </v-col>
      </v-row>
    </v-container>
  </div>
</template>
