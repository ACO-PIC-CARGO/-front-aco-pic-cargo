<script setup lang="ts">
import { onMounted, ref } from "vue";
import { useAppStore } from "@/stores/app";
import axios from "@/api/http";
import type { ApiResponse } from "@/types/api";
import type { ModuloEntidad } from "@/types/sesion";

const appStore = useAppStore();

const itemsModule = ref<ModuloEntidad[]>([]);

onMounted(() => {
  // this._getEntitiesModule();
});

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function _getEntitiesModule() {
  const dataUser = JSON.parse(sessionStorage.getItem("dataUser") as string);
  const data = JSON.stringify({
    id_entitie: dataUser[0].id,
  });

  const config = {
    method: "post",
    url: import.meta.env.VITE_URL_MAIN + "getEntitieModules",
    headers: {
     
      "Content-Type": "application/json",
    },
    data: data,
  };

  axios<ApiResponse<ModuloEntidad[]>>(config)
    .then(function (response) {
      itemsModule.value = response.data.data;
      sessionStorage.setItem(
        "idMenu",
        JSON.parse(JSON.stringify(itemsModule.value))[0].id
      );
      sessionStorage.setItem(
        "idMenuName",
        JSON.parse(JSON.stringify(itemsModule.value))[0].name
      );
      appStore._getGroupList();
    })
    .catch(function (error) {
      console.error(error);
    });
}
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function _setidMenu(idMenu: number | string, name: string) {
  appStore.dataList = false;
  sessionStorage.setItem("idMenu", String(idMenu));
  sessionStorage.setItem("idMenuName", name);

  appStore._getGroupList();
}
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
