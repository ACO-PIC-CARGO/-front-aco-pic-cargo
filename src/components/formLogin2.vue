<template>
  <div>
    <div v-if="!branchdialog">
      <v-text-field
        rounded
        filled
        densed
        v-model="user"
        label="Usuario"
      ></v-text-field>
      <v-text-field
        rounded
        densed
        filled
        v-model="password"
        :type="show3 ? 'text' : 'password'"
        label="Contraseña"
        @click:append="show3 = !show3"
        :append-icon="show3 ? 'mdi-eye' : 'mdi-eye-off'"
      ></v-text-field>

      <v-btn
        class="_btn__accept"
        rounded
        dark
        x-large
        @click="__getLogin()"
        :loading="loading"
        >Ingresar
      </v-btn>
    </div>
    <div v-if="branchdialog">
      <v-card-title primary-title> Sucursal: </v-card-title>

      <v-form ref="frmSucursal">
        <v-select
          :items="lstBranch"
          v-model="branch"
          item-text="trade_name"
          item-value="id"
          label="Sucursal"
          dense
          required
          :rules="[(v) => !!v || 'Datos Requerido']"
          :error-messages="errorBranch"
          return-object
        ></v-select
      ></v-form>

      <v-card-actions>
        <v-spacer></v-spacer>
        <v-btn
          rounded
          dark
          color="success"
          @click="ListProgrammedPayment()"
          :loading="cargandoBranch"
        >
          Continuar
        </v-btn>
        <v-btn
          rounded
          dark
          color="error"
          @click="branchdialog = !branchdialog"
          :loading="cargandoBranch"
          >Cancelar</v-btn
        >
      </v-card-actions>
    </div>
  </div>
</template>
<script>
import axios from '@/api/axios-config';
import { mapActions } from "vuex";

export default {
  name: "formLogin",
  data() {
    return {
      cargandoBranch: false,
      user: "",
      password: "",
      show3: false,
      dataUSer: [],
      dataBranch: [],
      lstBranch: [],
      branchdialog: false,
      branch: null,
      loading: false,
      errorBranch: "",
    };
  },

  methods: {
    ...mapActions(["_getMenuItem"]),
    __getLogin() {
      var vm = this;
      vm.loading = true;
      var data = JSON.stringify({
        user: vm.user,
        password: vm.password,
      });

      var config = {
        method: "post",
        url: process.env.VUE_APP_URL_MAIN + "singin",
        headers: {
          "Content-Type": "application/json",
        },
        data: data,
      };

      axios(config)
        .then(function (response) {
          if (!!response.data.estadoflag) {
            sessionStorage.setItem("security", response.data.data[0].id_secutiry);
            sessionStorage.setItem("auth-token", response.data.token);
            vm.dataUSer = [
              {
                id: response.data.data[0].id_entitie,
                user: response.data.data[0].user,
                // id_security: response.data.data[0].id_secutiry,
                names: response.data.data[0].names,
                surname: response.data.data[0].surname,
                second_surname: response.data.data[0].second_surname,
                birthday: response.data.data[0].birthday,
                ic: response.data.data[0].ic,
                document: response.data.data[0].document,
                id_pais: response.data.data[0].id_pais,
                id_sex: response.data.data[0].id_sex,
                id_document: response.data.data[0].id_document,
                id_branch: response.data.data[0].id_branch,
                path: response.data.data[0].path,
                nameDocuments: response.data.data[0].nameDocuments,
                description: response.data.data[0].description,
                departamento: response.data.data[0].departamento,
                id_user: response.data.data[0].id,
                usuario: response.data.data[0].usuario,
              },
            ];

            vm.$store.state.departamentoUser =
              response.data.data[0].departamento;

            vm.dataBranch = [
              {
                trade_name: response.data.data[0].trade_name,
                id_PaisBrach: response.data.data[0].id_PaisBrach,
                id_state: response.data.data[0].id_state,
                namePais: response.data.data[0].namePais,
                nameState: response.data.data[0].nameState,
              },
            ];

            sessionStorage.setItem("dataUser", JSON.stringify(vm.dataUSer));
            sessionStorage.setItem("dataBranch", JSON.stringify(vm.dataBranch));
            vm.CargarBranch(response.data.data[0].id);
            vm._getMenuItem(response.data.data[0].id);
          } else {
            vm.$swal({
              icon: "error",
              title: "Lo sentimos",
              text: response.data.mensaje,
            });
          }
        })
        .catch(function (error) {
          // vm.$swal({
          //   icon: "error",
          //   title: "Lo sentimos",
          //   text: response.data.mensaje,
          // });
          console.log(error);
        });
      this.loading = false;
    },

    async CargarBranch(id_usuario) {
      var vm = this;
      var config = {
        method: "get",
        url: process.env.VUE_APP_URL_MAIN + "CargarBranch/" + id_usuario,

        headers: {
          "auth-token": sessionStorage.getItem("auth-token"),
          "Content-Type": "application/json",
        },
      };
      await axios(config)
        .then(function (response) {
          var res = response.data.data;
          vm.lstBranch = res;
          vm.branchdialog = true;
        })
        .catch(function (error) {
          console.log(error);
        });
    },

    async ListProgrammedPayment() {
      this.errorBranch = "";
      // this.$refs.formInvoice.validate()
      if (this.branch) {
        var vm = this;
        let dataBranch = vm.lstBranch.filter((v) => v.id == vm.branch.id);
        sessionStorage.setItem("dataBranch", JSON.stringify(dataBranch));

        let datos = JSON.parse(sessionStorage.getItem("dataUser"));
        datos[0].id_branch = vm.branch.id;
        sessionStorage.setItem("dataUser", JSON.stringify(datos));
        sessionStorage.setItem(
          "iso_pais",
          JSON.stringify(
            vm.lstBranch.filter((v) => v.id == vm.branch.id)[0].iso_pais
          )
        );
        var config = {
          method: "get",
          url: process.env.VUE_APP_URL_MAIN + "ListProgrammedPayment",

          headers: {
            "auth-token": sessionStorage.getItem("auth-token"),
            "Content-Type": "application/json",
          },
        };
        vm.cargandoBranch = !vm.cargandoBranch;
        await axios(config)
          .then(function (response) {
            var res = response.data.data;

            if (res.filter((v) => v.totalpendiente == 1).length > 0) {
              vm.$swal({
                icon: "info",
                title: "ADVERTENCIA",
                text: "Existen pagos pendientes por realizar.",
              });
            }
            vm.$router.push({ name: "Main" });
          })
          .catch(function (error) {
            console.log(error);
          });
        vm.cargandoBranch = !vm.cargandoBranch;
      } else {
        this.errorBranch = "Dato requerido";
      }
    },
  },
};
</script>

<style lang="scss" scoped>
._btn__accept {
  background: #556471;
  float: right;
  width: 15rem;
}
</style>
