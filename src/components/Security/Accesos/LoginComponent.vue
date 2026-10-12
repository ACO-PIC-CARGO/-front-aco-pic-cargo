<template>
  <div class="formulario">
    <v-form ref="Login" autocomplete="off">
      <div class="title">
        <h1 class="_title__logo my-3">ACO</h1>
        <h3 class="text-white my-5">Bienvenido</h3>
      </div>
      <!-- <p class="white--text">
        Sistema para Agencia de Carga y Operadores Logísticos
      </p> -->
      <v-divider color="white"></v-divider>
      <div class="input_contenedor">
        <v-icon class="icon">mdi-account-circle</v-icon>
        <!--  -->

        <input
          v-model="$store.state.securitys.frmLogin.user"
          type="text"
          required
          autocomplete="off"
        />
        <label for="">Usuario</label>
        <!-- <span class="red--text"> {{ errorUsuario }}</span> -->
      </div>
      <div class="input_contenedor">
        <v-icon class="icon" @click="verClave = !verClave" v-if="!verClave"
          >mdi-eye-off</v-icon
        >
        <v-icon class="icon" @click="verClave = !verClave" v-if="verClave"
          >mdi-eye-outline</v-icon
        >

        <!-- -->
        <input
          v-model="$store.state.securitys.frmLogin.password"
          :type="verClave == false ? 'password' : 'text'"
          required
          autocomplete="off"
          class="active"
        />
        <label for="">Clave</label>
        <span class="text-red"> {{ $store.state.securitys.errorClave }}</span>
      </div>
      <div class="RecuperarContrasenia">
        <a href="">¿Olvidé Contraseña?</a>
      </div>
      <div class="">
        <v-btn :loading="loading" class="buttonSuccess" @click="acceder()"
          >Acceder</v-btn
        >
      </div>
      <div class="">
        <v-btn
          :loading="loading"
          class="buttonRegistro"
          @click="registroEmpresa()"
          >REGISTRAR</v-btn
        >
      </div>
    </v-form>
  </div>
</template>

<script>
import { mapActions } from "vuex";
export default {
  data() {
    return { verClave: false, errorClave: "", loading: false };
  },
  async mounted() {},
  methods: {
    ...mapActions(["singin"]),
    async acceder() {
      this.loading = true;
      await this.singin();
      this.loading = false;
    },
    registroEmpresa() {
      this.$router.push({
        name: "RegistroEmpresa",
      });
    },
  },
};
</script>

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
  border-bottom: 2px solid #fff;
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
  background: red !important;
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
.RecuperarContrasenia {
  padding: 10px 0;
  text-align: right;
  color: #fff;
}
.RecuperarContrasenia a {
  text-decoration: none;
  color: #fff;
}
.RecuperarContrasenia a:hover {
  font-style: italic;
  text-decoration: underline #fff;
  color: #fff;
  cursor: pointer;
}
.buttonRegistro {
  width: 100%;
  height: 45px;
  border-radius: 40px;
  border: none;
  font-weight: bold;
  cursor: pointer;
  outline: none;
  font-size: 1rem;
  transition: 0.4s;
  background: #3363a2 !important;
  color: #fff !important;
  margin: 5px 0 0 0 !important;
}
.buttonRegistro:hover {
  opacity: 0.9;
}
</style>
