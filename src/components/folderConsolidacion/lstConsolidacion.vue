<template>
  <div>
    <v-btn @click="nueva()" color="success" variant="text">Nueva</v-btn>
  </div>
</template>

<script>
export default {
  methods: {
    nueva() {
      this.$router.push({
        name: "newConsolidation",
      });
    },
  },
};
</script>

<style></style>
