<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, useTemplateRef } from "vue";
import { useRouter } from "vue-router";
import CboPais from "@/components/comun/CboPais.vue";
import { useEnterprisesStore } from "@/stores/enterprises";
import { useSecuritysStore } from "@/stores/securitys";
import type { PaisSeleccionado } from "@/types/empresas";

const router = useRouter();
const enterprisesStore = useEnterprisesStore();
const securitysStore = useSecuritysStore();

const numero = "51998146389";
const errorEmail = ref("");
const enviarCodigo = ref(true);
const snackbarEmail = ref(false);
const timeLeft = ref(3 * 60); // 5 minutos en segundos
const intervalId = ref<ReturnType<typeof setInterval> | null>(null);
const dialogRegistrandoEmpresa = ref(false);
const confirmRegistro = ref(false);
const model = ref(0);
const reenviarCodigo = ref(true);
const snackbarText = ref("");
const colorSnakBar = ref("");
const icon = ref("");
const timeout = 2000;
const multiLine = true;
const mostrarAdvertencia = ref(false);
const typePassword = ref(true);
const errortrade_name = ref("");
const errornames = ref("");
const errorsurname = ref("");
const errorsecond_surname = ref("");
const errorClave = ref("");
const errorPais = ref("");
const errorPhone = ref("");
const textCarrusel = [
  { urlImg: "MENSAJE-1.png" },
  {
    urlImg: "MENSAJE-4.png",
  },
  {
    urlImg: "MENSAJE-5.png",
  },
  { urlImg: "MENSAJE-6.png" },
];
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const passwordRules = [
  (v: string) => !!v || "El campo es requerido",
  (v: string) => v.length >= 8 || "Debe tener al menos 8 caracteres",
  (v: string) => /[a-zA-Z]/.test(v) || "Debe contener al menos una letra",
  (v: string) => /[0-9]/.test(v) || "Debe contener al menos un número",
];
const validandoCorreo = ref(false);
const frmRegistro = useTemplateRef("frmRegistro");

// Calcula los minutos restantes
const minutes = computed(() => {
  return Math.floor(timeLeft.value / 60);
});
// Calcula los segundos restantes y formatea el valor (si es menor a 10, añade un 0 delante)
const secondsFormatted = computed(() => {
  const seconds = timeLeft.value % 60;
  return seconds < 10 ? "0" + seconds : seconds;
});

// "_getPais",
onMounted(() => {
  // Inicia el temporizador cuando el componente es montado
  // this.startTimer();
});

function abriChat() {
  const text = `https://api.whatsapp.com/send/?phone=${numero}&text=Hola, ACO. Me gustaría contactar con alguien&type=phone_number&app_absent=0`;
  window.open(text);
}
function handlePaisSeleccionado(paisId: PaisSeleccionado) {
  enterprisesStore.data.id_pais = paisId;
  errorPais.value = "";
}
async function validarCorreoExiste() {
  validandoCorreo.value = true;
  errorEmail.value = "";
  const res = await enterprisesStore.validarCorreoRegistro();
  validandoCorreo.value = false;
  if (res!.estadoflag) {
    errorEmail.value = res!.mensaje;
  }
}
function startTimer() {
  intervalId.value = setInterval(() => {
    if (timeLeft.value > 0) {
      timeLeft.value--;
    } else {
      reenviarCodigo.value = false;
      clearInterval(intervalId.value!);
    }
  }, 1000);
}
async function iniciarConfiguración() {
  await securitysStore._getMenuItem();
  router.push({ name: "ConfiguracionInicial" });
}
async function enviarCorreo() {
  errorPais.value = "";
  const res = await enterprisesStore.validarCorreoRegistro();
  if (res!.estadoflag) {
    errorEmail.value = res!.mensaje;
    return false;
  }

  const valDatos = validarDatos();
  if (!valDatos) {
    return false;
  }
  if (validarCorreo() && !res!.estadoflag) {
    if (enterprisesStore.data.email && enterprisesStore.data.emailconfirmacion) {
      if (!enterprisesStore.data.id_pais) {
        errorPais.value = "Dato Requerido";
        return false;
      }
      mostrarAdvertencia.value = true;
      timeLeft.value = 3 * 60;
      // this.startTimer();
      const val = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(enterprisesStore.data.email);
      if (val) {
        enterprisesStore.enviarCorreoValidacion().catch((e) => {
          console.error(e);
        });
        reenviarCodigo.value = false;
        enviarCodigo.value = false;
        startTimer();
      } else {
        snackbarEmail.value = !val;
        colorSnakBar.value = "orange-darken-2";
        snackbarText.value = "Ingrese un correo valido.";
        icon.value = "alert";
      }
    }
  } else {
    // this.errorEmail = !this.errorEmail ?"Los correos no coinciden.";
    if (!enterprisesStore.data.id_pais) {
      errorPais.value = "Dato Requerido";
      return false;
    }
  }
}
function validarCorreo() {
  errorEmail.value = "";
  if (enterprisesStore.data.email && enterprisesStore.data.emailconfirmacion) {
    if (enterprisesStore.data.email != enterprisesStore.data.emailconfirmacion) {
      errorEmail.value = "Los Correos no coinciden";
      return false;
    }
  }
  return true;
}
async function crearNuevaEmpresa() {
  errorPais.value = "";
  const res = await enterprisesStore.validarCorreoRegistro();
  if (res!.estadoflag) {
    errorEmail.value = res!.mensaje;
    return false;
  }
  if (
    (await frmRegistro.value!.validate()).valid &&
    enterprisesStore.data.id_pais &&
    validarCorreo() &&
    !res!.estadoflag
  ) {
    const res = await enterprisesStore.validarCodigoVerificacion(true);
    if (res.estadoflag) {
      dialogRegistrandoEmpresa.value = true;

      await enterprisesStore.RegistroNuevaEmpresa();

      dialogRegistrandoEmpresa.value = false;

      confirmRegistro.value = true;
    } else {
      snackbarEmail.value = true;
      colorSnakBar.value = "orange-darken-2";
      snackbarText.value = res.mensaje!;
      icon.value = "alert";
    }
  } else {
    if (!enterprisesStore.data.id_pais) {
      errorPais.value = "Dato Requerido";
    }
  }
}
function validarDatos() {
  let val = true;
  errortrade_name.value = "";
  errornames.value = "";
  errorsurname.value = "";
  errorsecond_surname.value = "";
  errorEmail.value = "";
  errorClave.value = "";
  errorPais.value = "";
  errorPhone.value = "";
  if (!enterprisesStore.data.trade_name) {
    errortrade_name.value = "Dato Requerido";
    val = false;
  }
  if (!enterprisesStore.data.names) {
    errornames.value = "Dato Requerido";
    val = false;
  }
  if (!enterprisesStore.data.surname) {
    errorsurname.value = "Dato Requerido";
    val = false;
  }
  /* if (!this.$store.state.enterprises.data.second_surname) {
        this.errorsecond_surname = "Dato Requerido";
        val = false;
      }*/
  if (!enterprisesStore.data.email) {
    errorEmail.value = "Dato Requerido";
    val = false;
  }
  if (!enterprisesStore.data.clave) {
    errorClave.value = "Dato Requerido";
    val = false;
  }

  if (enterprisesStore.data.clave) {
    if (enterprisesStore.data.clave.length < 8) {
      errorClave.value = "Debe tener al menos 8 caracteres";
      val = false;
    } else if (!/[a-zA-Z]/.test(enterprisesStore.data.clave)) {
      errorClave.value = "Debe contener al menos una letra";
      val = false;
    } else if (!/[0-9]/.test(enterprisesStore.data.clave)) {
      errorClave.value = "Debe contener al menos una número";
      val = false;
    }
  }

  if (!enterprisesStore.data.id_pais) {
    errorPais.value = "Dato Requerido";
    val = false;
  }

  if (!enterprisesStore.data.phone) {
    errorPhone.value = "Dato Requerido";
    val = false;
  }
  return val;
}
function irALogin() {
  router.push({ name: "Login" });
}

onBeforeUnmount(() => {
  // Asegúrate de limpiar el intervalo si el componente es destruido
  clearInterval(intervalId.value!);
});
</script>

<template>
  <v-main>
    <v-container
      fluid
      class="fill-height"
    >
      <v-row>
        <v-col
          class="py-0 my-0"
          lg="6"
          md="6"
          sm="12"
        >
          <v-form
            class="frmRegistro"
            ref="frmRegistro"
          >
            <span class="centrado">
              <h1>Comienza ya con</h1>
            </span>
            <div style="text-align: center">
              <img
                src="../../../public/img/login/logo-aco.png"
                alt="logo"
                width="350px"
              >
            </div>
            <v-row>
              <v-col
                class="py-2 my-0"
                cols="12"
              >
                <v-text-field
                  label="Nombre Empresa"
                  id="id"
                  variant="outlined"
                  persistent-placeholder
                  density="compact"
                  prepend-inner-icon="mdi-domain"
                  :hide-details="!errortrade_name"
                  v-model="enterprisesStore.data.trade_name"
                  autocomplete="off"
                  :error-messages="errortrade_name"
                  @update:model-value="errortrade_name = ''"
                  class="textUppercase"
                />
              </v-col>
              <v-col
                class="py-2 my-0"
                cols="12"
              >
                <b>Persona de contacto (Administrador del sistema) </b>
              </v-col>
              <v-col
                class="py-2 my-0"
                cols="12"
                lg="4"
                xl="4"
              >
                <v-text-field
                  label="Nombre*"
                  variant="outlined"
                  persistent-placeholder
                  density="compact"
                  prepend-inner-icon="mdi-account"
                  :hide-details="!errornames"
                  v-model="enterprisesStore.data.names"
                  :error-messages="errornames"
                  @update:model-value="errornames = ''"
                  class="textUppercase"
                />
              </v-col>

              <v-col
                class="py-2 my-0"
                cols="12"
                lg="4"
                xl="4"
              >
                <v-text-field
                  label="Apellidos*"
                  placeholder=""
                  variant="outlined"
                  persistent-placeholder
                  density="compact"
                  prepend-inner-icon="mdi-account"
                  :hide-details="!errorsurname"
                  v-model="enterprisesStore.data.surname"
                  :error-messages="errorsurname"
                  @update:model-value="errorsurname = ''"
                  class="textUppercase"
                />
              </v-col>
              <v-col
                class="py-2 my-0"
                cols="12"
                lg="4"
                xl="4"
              >
                <v-text-field
                  label="Apellido Materno*"
                  placeholder=""
                  variant="outlined"
                  persistent-placeholder
                  density="compact"
                  prepend-inner-icon="mdi-account"
                  :hide-details="!errorsecond_surname"
                  v-model="enterprisesStore.data.second_surname"
                  :error-messages="errorsecond_surname"
                  @update:model-value="errorsecond_surname = ''"
                  class="textUppercase"
                />
              </v-col>

              <v-col
                class="py-2 my-0"
                cols="12"
                lg="6"
                xl="6"
              >
                <v-text-field
                  label="Email*"
                  variant="outlined"
                  persistent-placeholder
                  density="compact"
                  prepend-inner-icon="mdi-email"
                  :hide-details="!errorEmail"
                  v-model="enterprisesStore.data.email"
                  @change="validarCorreoExiste()"
                  @update:model-value="validarCorreoExiste()"
                  @blur="validarCorreoExiste()"
                  :error-messages="errorEmail"
                  id="Email"
                  placeholder="Ingresa tu email."
                  :loading="validandoCorreo"
                />
              </v-col>
              <v-col
                class="py-2 my-0"
                cols="12"
                lg="6"
                xl="6"
              >
                <v-text-field
                  label="Email Confirmación*"
                  variant="outlined"
                  persistent-placeholder
                  density="compact"
                  prepend-inner-icon="mdi-email-check-outline"
                  v-model="enterprisesStore.data.emailconfirmacion"
                  :error-messages="errorEmail"
                  id="EmailConfirmación"
                  placeholder="Confirme su correo."
                  :hide-details="!errorEmail"
                />
              </v-col>
              <v-col>
                <p
                  v-if="enterprisesStore.data.email"
                  class="my-0 py-0"
                  style="color: red; font-weight: bold; padding: 0 5%"
                >
                  **Deberás tener acceso.**
                </p>
              </v-col>
              <v-col
                class="py-2 my-0"
                cols="12"
                lg="6"
                xl="6"
              >
                <v-text-field
                  variant="outlined"
                  density="compact"
                  v-model="enterprisesStore.data.clave"
                  :error-messages="errorClave"
                  :type="typePassword ? 'password' : 'text'"
                  label="Contraseña"
                  prepend-inner-icon="mdi-lock"
                  :append-inner-icon="typePassword ? 'mdi-eye' : 'mdi-eye-off'"
                  @click:append-inner="typePassword = !typePassword"
                  autocomplete="new-password"
                  class="my-0"
                  :hide-details="!errorClave"
                  @update:model-value="errorClave = ''"
                />
              </v-col>
              <!-- :rules="passwordRules" -->
              <v-col
                class="py-2 my-0"
                cols="12"
                lg="6"
                xl="6"
              >
                <CboPais
                  @pais-seleccionado="handlePaisSeleccionado"
                  outlined
                  persistent-placeholder
                  dense
                  :error-pais="errorPais"
                />
              </v-col>
              <v-col
                class="py-2 my-0"
                cols="12"
                lg="6"
                xl="6"
              >
                <v-text-field
                  label="Teléfono*"
                  variant="outlined"
                  persistent-placeholder
                  density="compact"
                  prepend-inner-icon="mdi-phone"
                  v-model="enterprisesStore.data.phone"
                  :error-messages="errorPhone"
                  :hide-details="!errorPhone"
                  @update:model-value="errorPhone = ''"
                />
                <p
                  v-if="enterprisesStore.data.phone"
                  class="my-0 py-0"
                  style="color: red; font-weight: bold; padding: 0 5%"
                >
                  **Deberás tener acceso.**
                </p>
              </v-col>
              <v-col
                class="py-2 my-0"
                cols="12"
              >
                <v-btn
                  color="info"
                  v-if="enviarCodigo"
                  @click="enviarCorreo()"
                >
                  <v-icon start>
                    mdi-email-arrow-right-outline
                  </v-icon>
                  Enviar Código
                </v-btn>
                <p v-if="mostrarAdvertencia">
                  Ingresa el código de 4 dígitos enviado a tu correo.

                  <v-alert
                    variant="outlined"
                    icon="mdi-email-alert-outline"
                    density="compact"
                    color="red"
                  >
                    <p class="my-0 py-0 text--black">
                      Se le ha enviado un email, el mismo puede tardar
                      <span class="text--red">1 minuto</span><br>
                      <span class="text--red">
                        REVISAR TU BANDEJA DE SPAM / NO DESEADOS.
                      </span>
                    </p>
                  </v-alert>
                </p>
                <v-snackbar
                  v-model="snackbarEmail"
                  :min-height="multiLine ? '68' : undefined"
                  :color="colorSnakBar"
                  :timeout="timeout"
                >
                  <v-icon class="mx-1">
                    mdi-{{ icon }}
                  </v-icon>
                  {{ snackbarText }}
                </v-snackbar>
              </v-col>
              <v-col
                class="py-2 my-0"
                cols="12"
                lg="4"
                xl="4"
              >
                <v-text-field
                  label="Código de acceso*"
                  variant="outlined"
                  persistent-placeholder
                  density="compact"
                  hide-details
                  prepend-inner-icon="mdi-shield-key-outline"
                  v-model="enterprisesStore.data.codigo"
                />
              </v-col>
              <v-col
                class="py-2 my-0 centrado"
                cols="6"
                v-if="!reenviarCodigo && timeLeft > 0"
              >
                Puedes Solicitar un Nuevo código en {{ minutes }}:{{
                  secondsFormatted
                }}
              </v-col>
              <v-col
                class="py-2 my-0"
                cols="6"
              >
                <a
                  class="text-primary"
                  @click="enviarCorreo()"
                  v-if="!enviarCodigo && timeLeft <= 0"
                >Reenviar Código</a>
              </v-col>
              <v-col
                class="py-2 my-0 centrado"
                cols="12"
              >
                <v-btn
                  color="#1A237E"
                  class="custom-button"
                  @click="crearNuevaEmpresa()"
                  block
                >
                  <v-icon start>
                    mdi-rocket-launch
                  </v-icon>
                  Iniciar tu PRUEBA GRATUITA por 30 días
                </v-btn>
              </v-col>
              <v-col
                class="py-2 my-0 centrado"
                cols="12"
              >
                <v-btn
                  color="#1E88E5"
                  class="custom-button"
                  @click="irALogin()"
                  block
                >
                  <v-icon start>
                    mdi-login
                  </v-icon>
                  Ya Tengo una cuenta
                </v-btn>
              </v-col>
            </v-row>
          </v-form>
        </v-col>
        <!-- v-show="$vuetify.breakpoint.lg" -->
        <v-col
          class="py-2 my-0 centrado Slider ocultarMovil"
          cols="6"
        >
          <v-carousel
            v-model="model"
            :cycle="true"
            continuous
            :show-arrows="false"
            reverse-transition="fade-transition"
            transition="fade-transition"
            hide-delimiter-background
            class="px-0"
          >
            <v-carousel-item
              v-for="(text, i) in textCarrusel"
              :key="i"
            >
              <v-img :src="`img/png/${text.urlImg}`" />
            </v-carousel-item>
          </v-carousel>
          <div class="divBtnWhasapp">
            <v-btn
              color="success"
              class="btnWhasapp"
              @click="abriChat()"
            >
              <v-icon class="mx-1">
                mdi-whatsapp
              </v-icon> CHATEA CON
              NOSOTROS
            </v-btn>
          </div>
        </v-col>
      </v-row>
      <v-dialog
        v-model="dialogRegistrandoEmpresa"
        max-width="30%"
      >
        <v-card class="py-5 px-5">
          <center>
            <v-img
              max-width="100px"
              src="img/png/Tiempo de espera.svg"
            />
          </center>
          <h1 class="py-2 txtRegistro">
            ESTAMOS CREANDO TU EMPRESA y LOS ACCESOS A TODOS LOS MODULSO
          </h1>
          <h2
            class="py-2"
            style="text-align: center"
          >
            Esto tardara aproximadamente 1 minutos o menos
          </h2>
        </v-card>
      </v-dialog>
      <v-dialog
        v-model="confirmRegistro"
        scrollable
        max-width="30%"
      >
        <v-card>
          <div class="centrado modalConfirm">
            <center>
              <v-img
                max-width="100px"
                src="img/png/Cuenta creada con exito.svg"
              />
            </center>
            <h1 class="txtRegistro">
              ¡TU ACCESO HA SIDO CREADO CON ÉXITO!
            </h1>

            <h3 class="">
              Hemos enviados estos datos a tu correo, guárdalos para futuros
              ingresos.
            </h3>
            <v-btn
              color="info"
              @click="iniciarConfiguración()"
              size="x-large"
            >
              Continuar
            </v-btn>
          </div>
        </v-card>
      </v-dialog>
    </v-container>
  </v-main>
</template>

<style>
.textUppercase input {
  text-transform: uppercase;
}
</style>
<style scoped>
.fill-height {
  height: 120vh;
  padding-bottom: 50px !important;
}

.centrado {
  align-content: center;
  text-align: center;
}
.frmRegistro {
  /* border: 1px solid red; */
  padding: 2% 15%;
  box-shadow: inset;
  /* padding: 10% 0 !important; */
}
.Slider {
  color: #fff;
  background-image: url("../../../public/img/login/Slider.png");
  background-size: cover;
  background-position: center;
  min-height: 100vh;
  min-width: 45%;
}
.subTitle-Slider {
  font-size: 2rem !important;
}
.title-Slider {
  font-size: 3rem !important;
  font-family: Arial, Helvetica, sans-serif;
  font-weight: bold;
}
.modalConfirm {
  padding: 20px 20px;
  font-weight: bold;
  font-size: 1.2rem;
}
.details {
  font-size: 1rem;
}
.sheetSlider {
  /* padding: 0 auto; */
  color: #fff;
  /* max-width: 700px; */
}

.transparent-background {
  background-color: transparent !important;
}
.divBtnWhasapp {
  /* margin: 10% 0; */
  align-content: end !important;
  text-align: end !important;
}
.btnWhasapp {
  margin: 100px 0 0 0;
  min-width: 300px !important;
  border: 2px solid #fff !important;
}
.text--black {
  color: #000 !important;
}
.text--red {
  color: red !important;
  font-weight: bold;
}
.custom-button {
  text-transform: none;
}
.txtRegistro {
  color: #0c3ba1 !important;
  text-align: center;
}

@media (max-width: 1000px) {
  img {
    width: 350px;
  }
}
@media (min-width: 1600px) {
  img {
    width: 600px !important;
    padding: 0 auto 0 0 !important;
  }
  .frmRegistro {
    /* border: 1px solid red; */
    /* padding: 0 5%; */
    box-shadow: inset;
    padding: 5% 10% !important;
  }
  .Slider {
    padding: 0 10% !important;
    /* border: 1px solid red; */
    /* padding: 0 auto; */
  }
  .btnWhasapp {
    padding: 20px 0 !important;
    margin: 100px 0 0 100px;
    min-width: 400px !important;
  }
}
</style>
