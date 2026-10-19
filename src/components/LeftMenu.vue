<script setup lang="ts">
import { onMounted } from "vue";

onMounted(() => {
  // this._getEntitiesModule();
});
</script>

<template>
  <div class="_container__menu" />
</template>

<style lang="scss" scoped>
._container__menu {
  text-align: center;
  width: 60px;
  height: 100vh;
  background: #313d48;
  padding: 15px 0px;
  float: left;

  ._module__menu {
    text-decoration: none;
    cursor: pointer;

    p {
      color: white;
      font-size: 12px;

      @media (max-width: 800px) {
        font-size: 12px;
      }
    }

    ._divider {
      height: 2px;
      border-radius: 25px;
      width: 80%;
      margin: auto;
      background: #98a5b1;
      margin-bottom: 10px;
    }
  }
}
</style>
