<template>
  <div>
    <v-container fluid>
      <v-row>
        <v-col md="6" cols="12" class="_col__rigth">
          <formWelcome />
        </v-col>
        <v-col md="6" cols="12"> </v-col>
      </v-row>
    </v-container>
  </div>
</template>
<script>
import formWelcome from "@/components/formWelcome.vue";
export default {
  name: "home",
  components: {
    formWelcome,
  },
};
</script>
<style lang="scss" scoped>
._col__rigth {
  text-align: center;
}
</style>
