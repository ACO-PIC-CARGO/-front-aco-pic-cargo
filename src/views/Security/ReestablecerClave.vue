<script setup lang="ts">
import { onMounted, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import Swal from "sweetalert2";
import axios from '@/api/http';
import type { ApiResponse } from "@/types/api";

const route = useRoute();
const router = useRouter();

const esClave = true;
const email = ref("");
const clave = ref("");
const confirmaclave = ref("");

onMounted(async () => {
    
  await axios<ApiResponse>({
    method: "get",
    url: `${import.meta.env.VITE_URL_MAIN}validar_token_recuperar_clave?token=${route.params.token}`,
  })
    .then((response) => {
      if (!response.data.estadoflag) {
        Swal.fire({
          icon: "error",
          title: "Oops...",
          text: response.data.mensaje,
          allowEnterKey: false,
          allowOutsideClick: false,
        }).then((rs) => {
          if (rs.isConfirmed) {
            router.push("/");
          }
        });
      }
    })
    .catch((error) => {
      console.error(error);
    });
});

function reestablecerClave() {
  if (clave.value != confirmaclave.value) {
    Swal.fire({
      icon: "error",
      title: "Oops...",
      text: "Las claves no coinciden",
      allowEnterKey: false,
      allowOutsideClick: false,
    });
    return;
  }
  axios
    .put<ApiResponse>(`${import.meta.env.VITE_URL_MAIN}reestablecer_clave`, {
      email: email.value,
      clave: clave.value,
      token: route.params.token,
    })
    .then((response) => {
      if (response.data.estadoflag) {
        Swal.fire({
          icon: "success",
          title: "Exito",
          text: response.data.mensaje,
          allowEnterKey: false,
          allowOutsideClick: false,
        }).then((rs) => {
          if (rs.isConfirmed) {
            router.push("/");
          }
        });
      } else {
        Swal.fire({
          icon: "error",
          title: "Oops...",
          text: response.data.mensaje,
          allowEnterKey: false,
          allowOutsideClick: false,
        });
      }
    })
    .catch((error) => {
      console.error(error);
    });
}
</script>

<template>
  <v-main>
    <v-container>
      <v-row>
        <v-col
          cols="4"
          offset="4"
        >
          <v-card
            elevation="1"
            class="pa-5"
          >
            <v-row>
              <v-col class="12">
                <img
                  src="/img/login/logo-aco.png"
                  style="max-width: 350px"
                  alt="logo"
                >
              </v-col>
              <v-col class="12">
                Reestablecer Contraseña
              </v-col>
              <v-col
                cols="12"
                class="py-0"
              >
                <v-text-field
                  label="Email"
                  variant="outlined"
                  v-model="email"
                  density="compact"
                />
              </v-col>
              <v-col
                cols="12"
                class="py-0"
              >
                <v-text-field
                  variant="outlined"
                  label="Clave"
                  :type="esClave ? 'password' : 'text'"
                  v-model="clave"
                  density="compact"
                />
              </v-col>
              <v-col
                cols="12"
                class="py-0"
              >
                <v-text-field
                  variant="outlined"
                  label="Confirmar Clave"
                  :type="esClave ? 'password' : 'text'"
                  v-model="confirmaclave"
                  density="compact"
                />
              </v-col>
              <v-col
                cols="12"
                class="py-0"
              >
                <v-btn
                  color="success"
                  size="x-small"
                  class="mx-1"
                  @click="reestablecerClave()"
                >
                  Reestablecer Clave
                </v-btn>
                <v-btn
                  color="error"
                  size="x-small"
                  class="mx-1"
                >
                  Ir al Login
                </v-btn>
              </v-col>
            </v-row>
          </v-card>
        </v-col>
      </v-row>
    </v-container>
  </v-main>
</template>

<style></style>
