<script setup lang="ts">
import { onMounted } from "vue";
import { useRoute } from "vue-router";
import { useStore } from "vuex";
import axios from '@/api/http';
import type { ApiResponse } from "@/types/api";
import { sessionBranchId } from "@/utils/sesion";

const rootStore = useStore();
const route = useRoute();

onMounted(() => {
  _validaData();
});

 
function _deleteServices(id: number) {
  const data = {
    id: id,
  };
  const config = {
    method: "post",
    url: import.meta.env.VITE_URL_MAIN + "deleteServices",
    headers: {
     
      "Content-Type": "application/json",
    },
    data: data,
  };
  axios<ApiResponse>(config)
    .then(function (response) {
      if (response.data.status == 200) {
        _validaData();
      }
    })
    .catch(function (error) {
      console.error(error);
    });
}
function _validaData() {
  if (route.params.id_house) {
    rootStore.state.house_Id_get = route.params.id_house;
    const data = {
      id: route.params.id_house,
      id_branch: sessionBranchId(),
    };
    const config = {
      method: "post",
      url: import.meta.env.VITE_URL_MAIN + "getHouseServices",
      headers: {
       
        "Content-Type": "application/json",
      },
      data: data,
    };
    axios<ApiResponse>(config)
      .then(function (response) {
        rootStore.state.itemsHouseServices = response.data.data;
      })
      .catch(function (error) {
        console.error(error);
      });
  }
}
</script>

<template>
  <div>
    <v-table density="compact">
      <template v-slot:default>
        <thead>
          <tr>
            <th class="text-left">Servicio</th>
            <th class="text-left">Status</th>
          </tr>
        </thead>
        <tbody>
          <tr
            :style="`background:${item.color}`"
            v-for="item in rootStore.state.itemsHouseServices"
            :key="item.id"
          >
            <td>{{ item.nameservice }}</td>
            <td>
              {{ item.status ? "SI" : "NO" }}
            </td>
          </tr>
        </tbody>
      </template>
    </v-table>
  </div>
</template>

<style lang="scss" scoped>
.listMain {
  padding: 0px;
}

.btn_add {
  cursor: pointer;
}


</style>
