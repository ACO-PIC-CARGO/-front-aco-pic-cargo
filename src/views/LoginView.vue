<script setup lang="ts">
import { onMounted, ref } from "vue";
import { useRouter } from "vue-router";
import { useStore } from "vuex";
import LegalLinks from "@/components/Legal/LegalLinks.vue";
import { useSecuritysStore } from "@/stores/securitys";
import type { SucursalSesion, UsuarioLogin } from "@/types/sesion";

const router = useRouter();
const rootStore = useStore();
const securitysStore = useSecuritysStore();

const currentSlide = ref(0);
const verClave = ref(false);
const loading = ref(false);
const errorSucursal = ref("");

onMounted(async () => {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const dataBranch: SucursalSesion[] | null = JSON.parse(sessionStorage.getItem("dataBranch") as string);
    
  // if (val.estadoflag && dataBranch && !dataBranch[0].esnuevoflag) {
  //   this.$router.push({ name: "Main" }, () => {});
  // }
});

async function acceder() {
  loading.value = true;
  const res = await securitysStore.singin();
  if (res.estadoflag) {
    currentSlide.value = 1;
  }
  loading.value = false;
}
function cancelar() {
  currentSlide.value = 0;
}
async function iraHome() {
  errorSucursal.value = "";
  if (!securitysStore.frmLogin.id_sucursal) {
    errorSucursal.value = "Dato Requerido";
    return;
  }
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
  sessionStorage.setItem("iso_pais", dataBranch[0]!.iso_pais);
  sessionStorage.setItem("dataBranch", JSON.stringify(dataBranch));
  localStorage.setItem("dataBranch", JSON.stringify(dataBranch));
 
  //-------------------------------------
  await securitysStore._getMenuItem();
  rootStore.state.lstMenu = JSON.parse(sessionStorage.getItem("menu") as string);
  // await this.ListProgrammedPayment();
  setTimeout(() => {
    router.push({ name: "Main" });
    loading.value = false;
  }, 1000 * 2);
  securitysStore.ObtenerDatosConfig();
}
function registroEmpresa() {
  router.push({
    name: "RegistroEmpresa",
  });
}
//
</script>

<template>
  <v-main>
    <v-container
      fluid
      class="containerLogin"
    >
      <button
        id="add-to-home"
        style="display:none;"
      >
        Añadir a la pantalla de inicio
      </button>
      <v-row>
        <v-col
          cols="6"
          class="btnRegistro ocultarMovil"
        >
          <span class="spanRegistro"> COMIENZA GRATIS TU PRUEBA DE 30 DÍAS </span>
        </v-col>
        <v-col
          cols="12"
          lg="6"
          xl="6"
        >
          <div class="carousel">
            <div
              class="carousel-container"
              :style="{ transform: `translateX(-${currentSlide * 100}%)` }"
            >
              <section class="carousel-slide">
                <v-card
                  class="cardLogin"
                  elevation="5"
                >
                  <p>Bienvenido a ACO</p>
                  <h1>Iniciar Sesión</h1>
                  <v-form>
                    <div class="my-2">
                      <p>Ingresa Tu Usuario o Email</p>
                      <v-text-field
                        variant="outlined"
                        prepend-inner-icon="mdi-account"
                        v-model="securitysStore.frmLogin.user"
                        type="text"
                        placeholder="Usuario o Email"
                        density="compact"
                        :loading="loading"
                        autocomplete="username"
                        @keyup.enter="acceder()"
                      />
                    </div>
                    <div class="my-2">
                      <p>Ingresa tu clave</p>
                      <v-text-field
                        autocomplete="current-password"
                        variant="outlined"
                        density="compact"
                        v-model="securitysStore.frmLogin.password"
                        :type="verClave == false ? 'password' : 'text'"
                        placeholder="Contraseña"
                        prepend-inner-icon="mdi-lock"
                        :append-inner-icon="!verClave ? 'mdi-eye' : 'mdi-eye-off'"
                        @click:append-inner="verClave = !verClave"
                        :loading="loading"
                        @keyup.enter="acceder()"
                      />
                    </div>
                  </v-form>
                  <span class="text-red">
                    {{ securitysStore.errorClave }}</span>
                  <p class="rigth my-2">
                    <a
                      class="text-primary"
                      @click="securitysStore.ReEstablecerContrasenia()"
                    ><v-icon
                      size="small"
                      class="mr-1 text-medium-emphasis"
                    >mdi-lock-reset</v-icon> Olvidé Contraseña</a>
                  </p>
                  <v-btn
                    class="my-5"
                    block
                    color="info"
                    @click="acceder()"
                  >
                    <v-icon start>
                      mdi-login
                    </v-icon>
                    Iniciar Sesión
                  </v-btn>
                  <p class="center my-2">
                    O
                  </p>
                  <v-btn
                    class="my-5"
                    block
                    color="default"
                    @click="registroEmpresa()"
                  >
                    <v-icon start>
                      mdi-account-plus
                    </v-icon>
                    Registrate
                  </v-btn>
                </v-card>
              </section>
              <section class="carousel-slide">
                <v-card
                  class="cardLogin"
                  elevation="5"
                >
                  <p>Bienvenido a ACO</p>
                  <h1>SUCURSAL</h1>
                  <v-select
                    :items="securitysStore.lstSucursal"
                    item-title="trade_name"
                    item-value="id"
                    density="compact"
                    placeholder="Sucursal"
                    v-model="securitysStore.frmLogin.id_sucursal"
                    label="Sucursal"
                    variant="outlined"
                    :rules="[(v) => !!v || 'Dato Requerido']"
                    :error-messages="errorSucursal"
                    :loading="loading"
                  />
                  <v-btn
                    class="my-5"
                    block
                    color="info"
                    @click="iraHome()"
                    :loading="loading"
                  >
                    <v-icon start>
                      mdi-arrow-right
                    </v-icon>
                    Continuar
                  </v-btn>
                  <v-btn
                    class="my-5"
                    block
                    color="red"
                    @click="cancelar()"
                  >
                    <v-icon start>
                      mdi-close
                    </v-icon>
                    Cancelar
                  </v-btn>
                </v-card>
              </section>
            </div>
          </div>
        </v-col>
      </v-row>
      <LegalLinks floating />
    </v-container>
  </v-main>
</template>

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
