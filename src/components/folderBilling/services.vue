<template>
  <div>
    <v-simple-table dense>
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
            v-for="item in $store.state.itemsHouseServices"
            :key="item.id"
          >
            <td>{{ item.nameservice }}</td>
            <td>
              {{ item.status ? "SI" : "NO" }}
            </td>
          </tr>
        </tbody>
      </template>
    </v-simple-table>
  </div>
</template>
<script>
import axios from '@/api/axios-config';;
export default {
  name: "services",
  data: () => ({}),
  mounted() {
    this._validaData();
  },
  methods: {
    _deleteServices(id) {
      var vm = this;
      var data = {
        id: id,
      };
      var config = {
        method: "post",
        url: process.env.VUE_APP_URL_MAIN + "deleteServices",
        headers: {
          "auth-token": sessionStorage.getItem("auth-token"),
          "Content-Type": "application/json",
        },
        data: data,
      };
      axios(config)
        .then(function (response) {
          if (response.data.status == 200) {
            vm._validaData();
          }
        })
        .catch(function (error) {
          console.log(error);
        });
    },
    _validaData() {
      var vm = this;

      if (vm.$route.params.id_house) {
        vm.$store.state.house_Id_get = vm.$route.params.id_house;
        var data = {
          id: vm.$route.params.id_house,
          id_branch: JSON.parse(sessionStorage.getItem("dataUser"))[0].id_branch,
        };
        var config = {
          method: "post",
          url: process.env.VUE_APP_URL_MAIN + "getHouseServices",
          headers: {
            "auth-token": sessionStorage.getItem("auth-token"),
            "Content-Type": "application/json",
          },
          data: data,
        };
        axios(config)
          .then(function (response) {
            vm.$store.state.itemsHouseServices = response.data.data;
          })
          .catch(function (error) {
            console.log(error);
          });
      }
    },
  },
};
</script>

<style lang="scss" scoped>
.listMain {
  padding: 0px;
}

.btn_add {
  cursor: pointer;
}


</style>
