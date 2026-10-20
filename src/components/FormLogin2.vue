<script setup lang="ts">
import { ref } from "vue";
import { useRouter } from "vue-router";
import type { AxiosRequestConfig } from "axios";
import Swal from "sweetalert2";
import { useStore } from "vuex";
import axios from "@/api/http";
import { useSecuritysStore } from "@/stores/securitys";
import type { ApiResponse } from "@/types/api";
import type { LoginSessionRow, ProgrammedPaymentFlag } from "@/types/login";
import type { SucursalSesion } from "@/types/sesion";

const router = useRouter();
const rootStore = useStore();
const securitysStore = useSecuritysStore();
const { _getMenuItem } = securitysStore;

const cargandoBranch = ref(false);
const user = ref("");
const password = ref("");
const show3 = ref(false);
const dataUSer = ref<Record<string, unknown>[]>([]);
const dataBranch = ref<Record<string, unknown>[]>([]);
const lstBranch = ref<SucursalSesion[]>([]);
const branchdialog = ref(false);
const branch = ref<SucursalSesion | null>(null);
const loading = ref(false);
const errorBranch = ref("");

function __getLogin() {
  loading.value = true;
  const data = JSON.stringify({
    user: user.value,
    password: password.value,
  });

  const config: AxiosRequestConfig = {
    method: "post",
    url: import.meta.env.VITE_URL_MAIN + "singin",
    headers: {
      "Content-Type": "application/json",
    },
    data: data,
  };

  axios<ApiResponse<LoginSessionRow[]>>(config)
    .then((response) => {
      if (!!response.data.estadoflag) {
        const row = response.data.data[0]!;
        sessionStorage.setItem("security", String(row.id_secutiry));
        sessionStorage.setItem("auth-token", response.data.token!);
        dataUSer.value = [
          {
            id: row.id_entitie,
            user: row.user,
            // id_security: response.data.data[0].id_secutiry,
            names: row.names,
            surname: row.surname,
            second_surname: row.second_surname,
            birthday: row.birthday,
            ic: row.ic,
            document: row.document,
            id_pais: row.id_pais,
            id_sex: row.id_sex,
            id_document: row.id_document,
            id_branch: row.id_branch,
            path: row.path,
            nameDocuments: row.nameDocuments,
            description: row.description,
            departamento: row.departamento,
            id_user: row.id,
            usuario: row.usuario,
          },
        ];

        rootStore.state.departamentoUser = row.departamento;

        dataBranch.value = [
          {
            trade_name: row.trade_name,
            id_PaisBrach: row.id_PaisBrach,
            id_state: row.id_state,
            namePais: row.namePais,
            nameState: row.nameState,
          },
        ];

        sessionStorage.setItem("dataUser", JSON.stringify(dataUSer.value));
        sessionStorage.setItem("dataBranch", JSON.stringify(dataBranch.value));
        CargarBranch(row.id);
        // @ts-expect-error Kept: _getMenuItem takes no parameters, the id argument is ignored.
        _getMenuItem(row.id);
      } else {
        Swal.fire({
          icon: "error",
          title: "Lo sentimos",
          text: response.data.mensaje,
        });
      }
    })
    .catch((error) => {
      // vm.$swal({
      //   icon: "error",
      //   title: "Lo sentimos",
      //   text: response.data.mensaje,
      // });
      console.error(error);
    });
  loading.value = false;
}

async function CargarBranch(id_usuario: number) {
  const config: AxiosRequestConfig = {
    method: "get",
    url: import.meta.env.VITE_URL_MAIN + "CargarBranch/" + id_usuario,

    headers: {
     
      "Content-Type": "application/json",
    },
  };
  await axios<ApiResponse<SucursalSesion[]>>(config)
    .then((response) => {
      const res = response.data.data;
      lstBranch.value = res;
      branchdialog.value = true;
    })
    .catch((error) => {
      console.error(error);
    });
}

async function ListProgrammedPayment() {
  errorBranch.value = "";
  // this.$refs.formInvoice.validate()
  if (branch.value) {
    const dataBranch = lstBranch.value.filter((v) => v.id == branch.value!.id);
    sessionStorage.setItem("dataBranch", JSON.stringify(dataBranch));

    const datos = JSON.parse(sessionStorage.getItem("dataUser") as string);
    datos[0].id_branch = branch.value.id;
    sessionStorage.setItem("dataUser", JSON.stringify(datos));
    sessionStorage.setItem(
      "iso_pais",
      JSON.stringify(
        lstBranch.value.filter((v) => v.id == branch.value!.id)[0]!.iso_pais
      )
    );
    const config: AxiosRequestConfig = {
      method: "get",
      url: import.meta.env.VITE_URL_MAIN + "ListProgrammedPayment",

      headers: {
       
        "Content-Type": "application/json",
      },
    };
    cargandoBranch.value = !cargandoBranch.value;
    await axios<ApiResponse<ProgrammedPaymentFlag[]>>(config)
      .then((response) => {
        const res = response.data.data;

        if (res.filter((v) => v.totalpendiente == 1).length > 0) {
          Swal.fire({
            icon: "info",
            title: "ADVERTENCIA",
            text: "Existen pagos pendientes por realizar.",
          });
        }
        router.push({ name: "Main" });
      })
      .catch((error) => {
        console.error(error);
      });
    cargandoBranch.value = !cargandoBranch.value;
  } else {
    errorBranch.value = "Dato requerido";
  }
}
</script>
<template>
  <div>
    <div v-if="!branchdialog">
      <v-text-field
        rounded
        variant="filled"
        densed
        v-model="user"
        label="Usuario"
      />
      <v-text-field
        rounded
        densed
        variant="filled"
        v-model="password"
        :type="show3 ? 'text' : 'password'"
        label="Contraseña"
        @click:append-inner="show3 = !show3"
        :append-inner-icon="show3 ? 'mdi-eye' : 'mdi-eye-off'"
      />

      <v-btn
        class="_btn__accept"
        rounded
        size="x-large"
        @click="__getLogin()"
        :loading="loading"
      >
        Ingresar
      </v-btn>
    </div>
    <div v-if="branchdialog">
      <v-card-title primary-title>
        Sucursal:
      </v-card-title>

      <v-form ref="frmSucursal">
        <v-select
          :items="lstBranch"
          v-model="branch"
          item-title="trade_name"
          item-value="id"
          label="Sucursal"
          density="compact"
          required
          :rules="[(v) => !!v || 'Datos Requerido']"
          :error-messages="errorBranch"
          return-object
        />
      </v-form>

      <v-card-actions>
        <v-spacer />
        <v-btn
          rounded
          color="success"
          @click="ListProgrammedPayment()"
          :loading="cargandoBranch"
        >
          Continuar
        </v-btn>
        <v-btn
          rounded
          color="error"
          @click="branchdialog = !branchdialog"
          :loading="cargandoBranch"
        >
          Cancelar
        </v-btn>
      </v-card-actions>
    </div>
  </div>
</template>


<style lang="scss" scoped>
._btn__accept {
  background: #556471;
  float: right;
  width: 15rem;
}
</style>
