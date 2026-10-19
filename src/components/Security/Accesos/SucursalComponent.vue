<script setup lang="ts">
import { onMounted, ref, useTemplateRef } from "vue";
import { useRouter } from "vue-router";
import { useStore } from "vuex";
import { useSecuritysStore } from "@/stores/securitys";
import type { UsuarioLogin } from "@/types/sesion";

const router = useRouter();
const rootStore = useStore();
const securitysStore = useSecuritysStore();

const usuario = "";
const clave = "";
const loading = ref(false);
const Login = useTemplateRef("Login");

onMounted(() => {
  if (usuario) {
    (Login.value as unknown as HTMLElement).querySelector(".usuario-label")!.classList.add("active");
  }
  if (clave) {
    (Login.value as unknown as HTMLElement).querySelector(".clave-label")!.classList.add("active");
  }
});

async function guardarSucursal() {
  if ((await Login.value!.validate()).valid) {
    loading.value = true;
    // --------------------------------------------
    const dataBranch = securitysStore.lstSucursal.filter(
      (v) => v.id == securitysStore.frmLogin.id_sucursal
    );
    sessionStorage.setItem("dataBranch", JSON.stringify(dataBranch));
    localStorage.setItem("dataBranch", JSON.stringify(dataBranch));
    // --------------------------------------------
    const datos: UsuarioLogin[] = JSON.parse(sessionStorage.getItem("dataUser") as string);
    datos[0]!.id_branch = securitysStore.frmLogin.id_sucursal;

    sessionStorage.setItem("dataUser", JSON.stringify(datos));
    localStorage.setItem("dataUser", JSON.stringify(datos));
    sessionStorage.setItem("iso_pais", dataBranch[0]!.iso_pais);
    localStorage.setItem("iso_pais", dataBranch[0]!.iso_pais);
    sessionStorage.setItem("dataBranch", JSON.stringify(dataBranch));
    localStorage.setItem("dataBranch", JSON.stringify(dataBranch));
    //-------------------------------------
    await securitysStore._getMenuItem();
    rootStore.state.lstMenu = JSON.parse(sessionStorage.getItem("menu") as string);
    // await this.ListProgrammedPayment();
    await securitysStore.ObtenerDatosConfig();
    setTimeout(() => {
      router.push({ name: "Main" });
      loading.value = false;
    }, 1000 * 2);
  }
}
function cancelar() {
  securitysStore.MostrarLogin =
    !securitysStore.MostrarLogin;
  securitysStore.MostrarSucursal =
    !securitysStore.MostrarSucursal;
}
</script>

<template>
  <div class="formulario">
    <v-form
      ref="Login"
      autocomplete="off"
    >
      <div class="title text-headline-small">
        <h1 class="_title__logo my-3">
          ACO
        </h1>
        <h3 class="text-white my-5">
          Selección de Sucursal
        </h3>
      </div>
      <!-- <p class="white--text">
          Sistema para Agencia de Carga y Operadores Logísticos
        </p> -->
      <v-divider color="white" />
      <div class="input_contenedor">
        <v-select
          :items="securitysStore.lstSucursal"
          v-model="securitysStore.frmLogin.id_sucursal"
          item-title="trade_name"
          item-value="id"
          density="compact"
          placeholder="Sucursal"
          label="Sucursal"
          :rules="[(v) => !!v || 'Dato Requerido']"
        />
        <!-- <span class="red--text"> {{ errorUsuario }}</span> -->
      </div>

      <div class="">
        <v-btn
          :loading="loading"
          class="buttonSuccess"
          @click="guardarSucursal()"
        >
          Acceder
        </v-btn>

        <v-btn
          :loading="loading"
          class="buttonCancel"
          @click="cancelar()"
        >
          Cancelar
        </v-btn>
      </div>
    </v-form>
  </div>
</template>

<style scoped>
.formulario {
  min-height: 50px;
}
.title {
  text-align: center;
}
.input_contenedor {
  position: relative;
  margin: 30px 0;
  width: 300px;
  /* border-bottom: 2px solid #fff; */
}
.input_contenedor {
  position: relative;
  margin: 30px 0;
  width: 300px;
  /* border-bottom: 2px solid #fff; */
}
.input_contenedor label {
  position: absolute;
  top: 50%;
  left: 5px;
  transform: translateY(-50%);
  color: #fff;
  font-size: 1rem;
  pointer-events: none;
  transition: 0.6s;
  font-weight: bold;
}

input:focus ~ label,
input:valid ~ label {
  top: -10px;
}

.input_contenedor input {
  width: 100%;
  height: 50px;
  background-color: transparent !important;
  border: none;
  outline: none;
  font-size: 1rem;
  padding: -35px 0 5px;
  color: #fff;
}

.input_contenedor .icon {
  position: absolute;
  color: #000;
  font-size: 1.6rem;
  top: 19px;
  right: 8px;
}
.input_contenedor input[data-v-501e147f] {
  padding-left: 1rem;
}
input:-webkit-autofill,
input:-webkit-autofill:hover,
input:-webkit-autofill:focus,
input:-webkit-autofill:active {
  -webkit-background-clip: text;
  -webkit-text-fill-color: #ffffff;
  transition: background-color 5000s ease-in-out 0s;
  box-shadow: inset 0 0 20px 20px #23232329;
}
.olvide_clave {
  margin: 15px 0 15px;
  font-size: 0.9em;
  color: #fff;
  display: flex;
  justify-content: right;
}
.olvide_clave label input {
  margin: 3px;
}
.olvide_clave a {
  color: #fff;
  text-decoration: none;
  transition: 0.3s;
  font-size: 0.9em;
}
.olvide_clave a:hover {
  text-decoration: underline;
}
.buttonSuccess {
  width: 100%;
  height: 45px;
  border-radius: 40px;
  border: none;
  font-weight: bold;
  cursor: pointer;
  outline: none;
  font-size: 1rem;
  transition: 0.4s;
}
.buttonSuccess:hover {
  opacity: 0.9;
}
.buttonCancel {
  margin-top: 5px;
  width: 100%;
  height: 45px;
  border-radius: 40px;
  border: none;
  font-weight: bold;
  cursor: pointer;
  outline: none;
  font-size: 1rem;
  transition: 0.4s;
  background: rgb(252, 86, 86) !important;
  color: white;
}
.buttonCancel:hover {
  opacity: 0.9;
}
.mensajeErr {
  margin: 12px 0;
  color: red !important;
  background: #fff;
  border-left: 10px solid red !important;
  border-radius: 0px 10px 10px 0;
  text-align: center;
  font-weight: bold;
  padding: 5px;
}

._title__logo {
  font-size: 3.5rem;
  -webkit-text-stroke: 1px white;
  color: #0c3048;
}
._title__logo span {
  color: #e23023;
}
.icon {
  color: #ffffff !important;
}
</style>
