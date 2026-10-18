<template>
  <hello-world />
</template>

<script>
import HelloWorld from "../components/HelloWorld.vue";

export default {
  name: "Home",

  mounted(){
    this.$store.state.dataControl_id_user = JSON.parse(sessionStorage.getItem("dataUser"))[0].id
  },

  components: {
    HelloWorld,
  },
};
</script>
