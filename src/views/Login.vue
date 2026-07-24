<template>
  <v-container fluid class="containerLogin">
    <button id="add-to-home" style="display:none;">Añadir a la pantalla de inicio</button>
    <v-row>
      <v-col cols="6" class="btnRegistro ocultarMovil">
        <span class="spanRegistro"> COMIENZA GRATIS TU PRUEBA DE 30 DÍAS </span>
      </v-col>
      <v-col cols="12" lg="6" xl="6">
        <div class="carousel">
          <div
            class="carousel-container"
            :style="{ transform: `translateX(-${currentSlide * 100}%)` }"
          >
            <section class="carousel-slide">
              <v-card class="cardLogin" elevation="5">
                <p>Bienvenido a ACO</p>
                <h1>Iniciar Sesión</h1>
                <v-form>
                  <div class="my-2">
                    <p>Ingresa Tu Usuario o Email</p>
                    <v-text-field
                      outlined
                      prepend-inner-icon="mdi-account"
                      v-model="$store.state.securitys.frmLogin.user"
                      type="text"
                      placeholder="Usuario o Email"
                      dense
                      :loading="loading"
                      autocomplete="username"
                      @keyup.enter="acceder()"
                    />
                  </div>
                  <div class="my-2">
                    <p>Ingresa tu clave</p>
                    <v-text-field
                      autocomplete="current-password"
                      outlined
                      dense
                      v-model="$store.state.securitys.frmLogin.password"
                      :type="verClave == false ? 'password' : 'text'"
                      placeholder="Contraseña"
                      prepend-inner-icon="mdi-lock"
                      :append-icon="!verClave ? 'mdi-eye' : 'mdi-eye-off'"
                      @click:append="verClave = !verClave"
                      :loading="loading"
                      @keyup.enter="acceder()"
                    />
                  </div>
                </v-form>
                <span class="red--text">
                  {{ $store.state.securitys.errorClave }}</span
                >
                <p class="rigth my-2">
                  <a @click="ReEstablecerContrasenia()"><v-icon small class="mr-1">mdi-lock-reset</v-icon> Olvidé Contraseña</a>
                </p>
                <v-btn class="my-5" block color="info" @click="acceder()">
                  <v-icon left>mdi-login</v-icon>
                  Iniciar Sesión
                </v-btn>
                <p class="center my-2">O</p>
                <v-btn
                  class="my-5"
                  block
                  color="default"
                  @click="registroEmpresa()"
                >
                  <v-icon left>mdi-account-plus</v-icon>
                  Registrate</v-btn
                >
              </v-card>
            </section>
            <section class="carousel-slide">
              <v-card class="cardLogin" elevation="5">
                <p>Bienvenido a ACO</p>
                <h1>SUCURSAL</h1>
                <v-select
                  :items="$store.state.securitys.lstSucursal"
                  item-text="trade_name"
                  item-value="id"
                  dense
                  placeholder="Sucursal"
                  v-model="$store.state.securitys.frmLogin.id_sucursal"
                  label="Sucursal"
                  outlined
                  :rules="[(v) => !!v || 'Dato Requerido']"
                  :error-messages="errorSucursal"
                  :loading="loading"
                ></v-select>
                <v-btn
                  class="my-5"
                  block
                  color="info"
                  @click="iraHome()"
                  :loading="loading"
                >
                  <v-icon left>mdi-arrow-right</v-icon>
                  Continuar</v-btn
                >
                <v-btn class="my-5" block color="red" dark @click="cancelar()">
                  <v-icon left>mdi-close</v-icon>
                  Cancelar</v-btn
                >
              </v-card>
            </section>
          </div>
        </div>
      </v-col>
    </v-row>
  </v-container>
</template>

<script>
import { mapActions } from "vuex";
export default {
  data() {
    return {
      frmUsuario: "ddd",
      frmClave: "ddd",
      currentSlide: 0,
      verClave: false,
      loading: false,
      errorSucursal: "",
      btnRegistro: true,
    };
  },
  async mounted() {
    let dataBranch = JSON.parse(sessionStorage.getItem("dataBranch"));
    
    // if (val.estadoflag && dataBranch && !dataBranch[0].esnuevoflag) {
    //   this.$router.push({ name: "Main" }, () => {});
    // }
  },
  methods: {
    ...mapActions([
      "singin",
      
      "_getMenuItem",
      "ReEstablecerContrasenia",

      "ObtenerDatosConfig",
    ]),
    async acceder() {
      this.loading = true;
      let res = await this.singin();
      if (res.estadoflag) {
        this.currentSlide = 1;
      }
      this.loading = false;
    },
    cancelar() {
      this.currentSlide = 0;
    },
    async iraHome() {
      this.errorSucursal = "";
      if (!this.$store.state.securitys.frmLogin.id_sucursal) {
        this.errorSucursal = "Dato Requerido";
        return;
      }
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
      sessionStorage.setItem("iso_pais", dataBranch[0].iso_pais);
      sessionStorage.setItem("dataBranch", JSON.stringify(dataBranch));
      localStorage.setItem("dataBranch", JSON.stringify(dataBranch));
     
      //-------------------------------------
      await this._getMenuItem();
      this.$store.state.lstMenu = JSON.parse(sessionStorage.getItem("menu"));
      // await this.ListProgrammedPayment();
      setTimeout(() => {
        this.$router.push({ name: "Main" }, () => {});
        this.loading = false;
      }, 1000 * 2);
      this.ObtenerDatosConfig();
    },
    registroEmpresa() {
      this.$router.push({
        name: "RegistroEmpresa",
      });
    },
  },
};
//
</script>

<style scoped>
.containerLogin {
  /* min-height: 100vh; */
  background-image: url("../../public/img/login/Composición Logística.png");
  height: 100vh;
  background-size: cover;
  background-position: center;
  /* background: cover; */
}
section {
  /* background: whitesmoke; */
  min-height: 97vh;
  display: grid;
  place-items: center;
  min-width: 100%;
  /* background-image: url("../../public/img/login/Group.png"); */
  /* border: 1px solid red; */
  /* border-left: 1px solid blue; */
}
.cardLogin {
  padding: 25px 25px;
  border-radius: 25px;
  /* height: 550px; */
  width: 380px;
  min-height: 400px;
}
.frmInput {
  min-width: 21vw;
  border: 1px solid blue;
  border-radius: 5px;
  padding: 5px 20px;
  background: #fff;
}
.rigth {
  align-content: right;
  text-align: right;
}
.center {
  align-content: center;
  text-align: center;
}
h1 {
  font-size: 3rem;
}
.carousel {
  overflow: hidden;
  position: relative;
}

.carousel-container {
  display: flex;
  transition: transform 0.5s ease-in-out; /* Transición suave */
}

.carousel-slide {
  min-width: 100%; /* Cada slide ocupa el 100% del contenedor */
  box-sizing: border-box;
}
.btnRegistro {
  align-content: center;
  align-items: center;
  text-align: center;
  padding: 5%;
}
.btnRegistro > .spanRegistro {
  color: #fff !important;
  font-size: 3rem;
  font-weight: bold;
}
</style>
