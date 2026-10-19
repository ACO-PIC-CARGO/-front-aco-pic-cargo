<script setup lang="ts">
import { onMounted, ref } from "vue";
import type { UsuarioSesion } from "@/types/sesion";

const nameUser = ref<string | undefined>("");
const acronynO = ref("o");
const imagePath = ref<string | undefined>("");

onMounted(() => {
  _proccessName();
});

function _proccessName() {
  const dataUser: UsuarioSesion[] = JSON.parse(sessionStorage.getItem("dataUser") as string);
  const namelong = dataUser[0]!.names.split(" ");
  nameUser.value = (namelong[0] as unknown as UsuarioSesion).nombrecompleto;
  imagePath.value = dataUser[0]!.path;

  if (dataUser[0]!.id_sex == 1) {
    acronynO.value = "o";
  } else {
    acronynO.value = "a";
  }
}
</script>

<template>
  <div>
    <div class="_main_avatar__login" />
    <p class="_title__User">
      Bienvenid{{ acronynO }} {{ nameUser }}
    </p>
  </div>
</template>

<style lang="scss" scoped>
._main_avatar__login {
  img {
    width: 15vw;
    height: auto;

    @media (max-width: 800px) {
      width: 45vw;
    }
  }
}
._title__User {
  padding-top: 20px;
  font-size: 2.5vw;

  @media (max-width: 800px) {
    font-size: 6vw;
  }
}
</style>
