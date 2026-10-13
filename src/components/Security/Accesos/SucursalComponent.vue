<template>
  <div class="formulario">
    <v-form ref="Login" autocomplete="off">
      <div class="title text-h6">
        <h1 class="_title__logo my-3">ACO</h1>
        <h3 class="text-white my-5">Selección de Sucursal</h3>
      </div>
      <!-- <p class="white--text">
          Sistema para Agencia de Carga y Operadores Logísticos
        </p> -->
      <v-divider color="white"></v-divider>
      <div class="input_contenedor">
        <v-select
          :items="$store.state.securitys.lstSucursal"
          v-model="$store.state.securitys.frmLogin.id_sucursal"
          item-title="trade_name"
          item-value="id"
          density="compact"
          placeholder="Sucursal"
          label="Sucursal"
          :rules="[(v) => !!v || 'Dato Requerido']"
        ></v-select>
        <!-- <span class="red--text"> {{ errorUsuario }}</span> -->
      </div>

      <div class="">
        <v-btn
          :loading="loading"
          class="buttonSuccess"
          @click="guardarSucursal()"
          >Acceder</v-btn
        >

        <v-btn :loading="loading" class="buttonCancel" @click="cancelar()">
          Cancelar
        </v-btn>
      </div>
    </v-form>
  </div>
</template>

<script>
import { mapActions } from "vuex";
export default {
  data() {
    return {
      verClave: false,
      usuario: "",
      clave: "",
      listSucursalXUsuario: [],
      loading: false,
      id_sucursal: "",
    };
  },
  mounted() {
    if (this.usuario) {
      this.$refs.Login.querySelector(".usuario-label").classList.add("active");
    }
    if (this.clave) {
      this.$refs.Login.querySelector(".clave-label").classList.add("active");
    }
  },
  methods: {
    ...mapActions([
      "ListProgrammedPayment",
      "_getMenuItem",
      "ObtenerDatosConfig",
    ]),
    async guardarSucursal() {
      if ((await this.$refs.Login.validate()).valid) {
        this.loading = true;
        // --------------------------------------------
        let dataBranch = this.$store.state.securitys.lstSucursal.filter(
          (v) => v.id == this.$store.state.securitys.frmLogin.id_sucursal
        );
        sessionStorage.setItem("dataBranch", JSON.stringify(dataBranch));
        localStorage.setItem("dataBranch", JSON.stringify(dataBranch));
        // --------------------------------------------
        let datos = JSON.parse(sessionStorage.getItem("dataUser"));
        datos[0].id_branch = this.$store.state.securitys.frmLogin.id_sucursal;

        sessionStorage.setItem("dataUser", JSON.stringify(datos));
        localStorage.setItem("dataUser", JSON.stringify(datos));
        sessionStorage.setItem("iso_pais", dataBranch[0].iso_pais);
        localStorage.setItem("iso_pais", dataBranch[0].iso_pais);
        sessionStorage.setItem("dataBranch", JSON.stringify(dataBranch));
        localStorage.setItem("dataBranch", JSON.stringify(dataBranch));
        //-------------------------------------
        await this._getMenuItem();
        this.$store.state.lstMenu = JSON.parse(sessionStorage.getItem("menu"));
        // await this.ListProgrammedPayment();
        await this.ObtenerDatosConfig();
        setTimeout(() => {
          this.$router.push({ name: "Main" }, () => {});
          this.loading = false;
        }, 1000 * 2);
      }
    },
    cancelar() {
      this.$store.state.securitys.MostrarLogin =
        !this.$store.state.securitys.MostrarLogin;
      this.$store.state.securitys.MostrarSucursal =
        !this.$store.state.securitys.MostrarSucursal;
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
