<template>
  <div class="_container__menu">
    
  </div>
</template>
<script>
import axios from '@/api/axios-config';
import { mapActions } from "vuex";
export default {
  name: "leftMenu",
  data() {
    return {
      itemsModule: [],
    };
  },
  mounted() {
    // this._getEntitiesModule();
  },
  methods: {
    ...mapActions(["_getGroupList"]),

    _getEntitiesModule() {
      var dataUser = JSON.parse(sessionStorage.getItem("dataUser"));
      var vm = this;
      var data = JSON.stringify({
        id_entitie: dataUser[0].id,
      });

      var config = {
        method: "post",
        url: process.env.VUE_APP_URL_MAIN + "getEntitieModules",
        headers: {
         
          "Content-Type": "application/json",
        },
        data: data,
      };

      axios(config)
        .then(function (response) {
          vm.itemsModule = response.data.data;
          sessionStorage.setItem(
            "idMenu",
            JSON.parse(JSON.stringify(vm.itemsModule))[0].id
          );
          sessionStorage.setItem(
            "idMenuName",
            JSON.parse(JSON.stringify(vm.itemsModule))[0].name
          );
          vm._getGroupList();
        })
        .catch(function (error) {
          console.log(error);
        });
    },
    _setidMenu(idMenu, name) {
      this.$store.state.dataList = false;
      sessionStorage.setItem("idMenu", idMenu);
      sessionStorage.setItem("idMenuName", name);

      this._getGroupList();
    },
  },
};
</script>

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
