<script setup lang="ts">
import { onMounted, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import Swal from "sweetalert2";
import { request } from "@/utils/request";
import { passwordResetProblem } from "@/utils/passwordReset";

const route = useRoute();
const router = useRouter();

const esClave = true;
const email = ref("");
const clave = ref("");
const confirmaclave = ref("");

const irAlLogin = () => router.push("/");

const avisarError = (text: string) =>
  Swal.fire({
    icon: "error",
    title: "No pudimos cambiar tu contraseña",
    text,
    allowEnterKey: false,
    allowOutsideClick: false,
  });

onMounted(async () => {
  const res = await request({
    method: "get",
    url: `${import.meta.env.VITE_URL_MAIN}validar_token_recuperar_clave`,
    params: { token: route.params.token },
  });
  if (!res.estadoflag) {
    const rs = await avisarError(res.mensaje);
    if (rs.isConfirmed) irAlLogin();
  }
});

async function reestablecerClave() {
  const problema = passwordResetProblem({ email: email.value, clave: clave.value, confirmaclave: confirmaclave.value });
  if (problema) {
    avisarError(problema);
    return;
  }
  const res = await request({
    method: "put",
    url: `${import.meta.env.VITE_URL_MAIN}reestablecer_clave`,
    data: { email: email.value, clave: clave.value, token: route.params.token },
  });
  if (!res.estadoflag) {
    avisarError(res.mensaje);
    return;
  }
  const rs = await Swal.fire({
    icon: "success",
    title: "Contraseña actualizada",
    text: "Ya puedes iniciar sesión con tu nueva contraseña.",
    allowEnterKey: false,
    allowOutsideClick: false,
  });
  if (rs.isConfirmed) irAlLogin();
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
                  @click="irAlLogin()"
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
