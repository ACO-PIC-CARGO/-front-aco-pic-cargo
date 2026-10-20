<script setup lang="ts">
import formWelcome from "@/components/FormWelcome.vue";
</script>

<template>
  <div>
    <v-container fluid>
      <v-row>
        <v-col
          md="6"
          cols="12"
          class="_col__rigth"
        >
          <formWelcome />
        </v-col>
        <v-col
          md="6"
          cols="12"
        />
      </v-row>
    </v-container>
  </div>
</template>
<style lang="scss" scoped>
._col__rigth {
  text-align: center;
}
</style>
