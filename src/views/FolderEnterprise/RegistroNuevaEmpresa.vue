<template>
  <v-container fluid class="fill-height">
    <v-row>
      <v-col class="py-0 my-0" lg="6" md="6" sm="12">
        <v-form class="frmRegistro" ref="frmRegistro">
          <span class="centrado">
            <h1>Comienza ya con</h1>
          </span>
          <div style="text-align: center">
            <img
              src="../../../public/img/login/logo-aco.png"
              alt="logo"
              width="350px"
            />
          </div>
          <v-row>
            <v-col class="py-2 my-0" cols="12">
              <v-text-field
                name="name"
                label="Nombre Empresa"
                id="id"
                outlined
                persistent-placeholder
                dense
                prepend-inner-icon="mdi-domain"
                :hide-details="!errortrade_name"
                v-model="$store.state.enterprises.data.trade_name"
                autocomplete="off"
                :error-messages="errortrade_name"
                @input="errortrade_name = ''"
                class="textUppercase"
              ></v-text-field>
            </v-col>
            <v-col class="py-2 my-0" cols="12">
              <b>Persona de contacto (Administrador del sistema) </b>
            </v-col>
            <v-col class="py-2 my-0" cols="12" lg="4" xl="4">
              <v-text-field
                label="Nombre*"
                outlined
                persistent-placeholder
                dense
                prepend-inner-icon="mdi-account"
                :hide-details="!errornames"
                v-model="$store.state.enterprises.data.names"
                :error-messages="errornames"
                @input="errornames = ''"
                class="textUppercase"
              ></v-text-field>
            </v-col>

            <v-col class="py-2 my-0" cols="12" lg="4" xl="4">
              <v-text-field
                name="name"
                label="Apellidos*"
                placeholder=""
                outlined
                persistent-placeholder
                dense
                prepend-inner-icon="mdi-account"
                :hide-details="!errorsurname"
                v-model="$store.state.enterprises.data.surname"
                :error-messages="errorsurname"
                @input="errorsurname = ''"
                class="textUppercase"
              ></v-text-field>
            </v-col>
            <v-col class="py-2 my-0" cols="12" lg="4" xl="4">
              <v-text-field
                name="name"
                label="Apellido Materno*"
                placeholder=""
                outlined
                persistent-placeholder
                dense
                prepend-inner-icon="mdi-account"
                :hide-details="!errorsecond_surname"
                v-model="$store.state.enterprises.data.second_surname"
                :error-messages="errorsecond_surname"
                @input="errorsecond_surname = ''"
                class="textUppercase"
              ></v-text-field>
            </v-col>

            <v-col class="py-2 my-0" cols="12" lg="6" xl="6">
              <v-text-field
                label="Email*"
                outlined
                persistent-placeholder
                dense
                prepend-inner-icon="mdi-email"
                :hide-details="!errorEmail"
                v-model="$store.state.enterprises.data.email"
                @change="validarCorreoExiste()"
                @input="validarCorreoExiste()"
                @blur="validarCorreoExiste()"
                :error-messages="errorEmail"
                id="Email"
                placeholder="Ingresa tu email."
                :loading="validandoCorreo"
              ></v-text-field>
            </v-col>
            <v-col class="py-2 my-0" cols="12" lg="6" xl="6">
              <v-text-field
                label="Email Confirmación*"
                outlined
                persistent-placeholder
                dense
                prepend-inner-icon="mdi-email-check-outline"
                v-model="$store.state.enterprises.data.emailconfirmacion"
                :error-messages="errorEmail"
                id="EmailConfirmación"
                placeholder="Confirme su correo."
                :hide-details="!errorEmail"
              ></v-text-field>
            </v-col>
            <v-col>
              <p
                v-if="$store.state.enterprises.data.email"
                class="my-0 py-0"
                style="color: red; font-weight: bold; padding: 0 5%"
              >
                **Deberás tener acceso.**
              </p>
            </v-col>
            <v-col class="py-2 my-0" cols="12" lg="6" xl="6">
              <v-text-field
                outlined
                dense
                v-model="$store.state.enterprises.data.clave"
                :error-messages="errorClave"
                :type="typePassword ? 'password' : 'text'"
                label="Contraseña"
                prepend-inner-icon="mdi-lock"
                :append-icon="typePassword ? 'mdi-eye' : 'mdi-eye-off'"
                @click:append="typePassword = !typePassword"
                autocomplete="new-password"
                class="my-0"
                :hide-details="!errorClave"
                @input="errorClave = ''"
              ></v-text-field>
            </v-col>
            <!-- :rules="passwordRules" -->
            <v-col class="py-2 my-0" cols="12" lg="6" xl="6">
              <CboPais
                @paisSeleccionado="handlePaisSeleccionado"
                outlined
                persistent-placeholder="true"
                dense
                :errorPais="errorPais"
              />
            </v-col>
            <v-col class="py-2 my-0" cols="12" lg="6" xl="6">
              <v-text-field
                name="name"
                label="Teléfono*"
                outlined
                persistent-placeholder
                dense
                prepend-inner-icon="mdi-phone"
                v-model="$store.state.enterprises.data.phone"
                :error-messages="errorPhone"
                :hide-details="!errorPhone"
                @input="errorPhone = ''"
              ></v-text-field>
              <p
                v-if="$store.state.enterprises.data.phone"
                class="my-0 py-0"
                style="color: red; font-weight: bold; padding: 0 5%"
              >
                **Deberás tener acceso.**
              </p>
            </v-col>
            <v-col class="py-2 my-0" cols="12">
              <v-btn color="info" v-if="enviarCodigo" @click="enviarCorreo()">
                <v-icon left>mdi-email-send-outline</v-icon>
                Enviar Código
              </v-btn>
              <p v-if="mostrarAdvertencia">
                Ingresa el código de 4 dígitos enviado a tu correo.

                <v-alert
                  outlined
                  icon="mdi-email-alert-outline"
                  dense
                  color="red"
                >
                  <p class="my-0 py-0 text--black">
                    Se le ha enviado un email, el mismo puede tardar
                    <span class="text--red">1 minuto</span><br />
                    <span class="text--red">
                      REVISAR TU BANDEJA DE SPAM / NO DESEADOS.
                    </span>
                  </p>
                </v-alert>
              </p>
              <v-snackbar
                v-model="snackbarEmail"
                :multi-line="multiLine"
                :color="colorSnakBar"
                :timeout="timeout"
              >
                <v-icon class="mx-1">mdi-{{ icon }}</v-icon>
                {{ text }}
              </v-snackbar>
            </v-col>
            <v-col class="py-2 my-0" cols="12" lg="4" xl="4">
              <v-text-field
                name="name"
                label="Código de acceso*"
                outlined
                persistent-placeholder
                dense
                hide-details
                prepend-inner-icon="mdi-shield-key-outline"
                v-model="$store.state.enterprises.data.codigo"
              ></v-text-field>
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
            <v-col class="py-2 my-0" cols="6">
              <a @click="enviarCorreo()" v-if="!enviarCodigo && timeLeft <= 0"
                >Reenviar Código</a
              >
            </v-col>
            <v-col class="py-2 my-0 centrado" cols="12">
              <v-btn
                color="#1A237E"
                dark
                class="custom-button"
                @click="crearNuevaEmpresa()"
                block
              >
                <v-icon left>mdi-rocket-launch</v-icon>
                Iniciar tu PRUEBA GRATUITA por 30 días</v-btn
              >
            </v-col>
            <v-col class="py-2 my-0 centrado" cols="12">
              <v-btn
                color="#1E88E5"
                dark
                class="custom-button"
                @click="irALogin()"
                block
              >
                <v-icon left>mdi-login</v-icon>
                Ya Tengo una cuenta
              </v-btn>
            </v-col>
          </v-row>
        </v-form>
      </v-col>
      <!-- v-show="$vuetify.breakpoint.lg" -->
      <v-col class="py-2 my-0 centrado Slider ocultarMovil" cols="6">
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
          <v-carousel-item v-for="(text, i) in textCarrusel" :key="i">
            <v-img :src="`img/png/${text.urlImg}`"> </v-img>
          </v-carousel-item>
        </v-carousel>
        <div class="divBtnWhasapp">
          <v-btn color="success" class="btnWhasapp" @click="abriChat()">
            <v-icon class="mx-1">mdi-whatsapp</v-icon> CHATEA CON
            NOSOTROS</v-btn
          >
        </div>
      </v-col>
    </v-row>
    <v-dialog v-model="dialogRegistrandoEmpresa" max-width="30%">
      <v-card class="py-5 px-5">
        <center>
          <v-img max-width="100px" src="img/png/Tiempo de espera.svg"></v-img>
        </center>
        <h1 class="py-2 txtRegistro">
          ESTAMOS CREANDO TU EMPRESA y LOS ACCESOS A TODOS LOS MODULSO
        </h1>
        <h2 class="py-2" style="text-align: center">
          Esto tardara aproximadamente 1 minutos o menos
        </h2>
      </v-card>
    </v-dialog>
    <v-dialog v-model="confirmRegistro" scrollable max-width="30%">
      <v-card>
        <div class="centrado modalConfirm">
          <center>
            <v-img
              max-width="100px"
              src="img/png/Cuenta creada con exito.svg"
            ></v-img>
          </center>
          <h1 class="txtRegistro">¡TU ACCESO HA SIDO CREADO CON ÉXITO!</h1>

          <h3 class="">
            Hemos enviados estos datos a tu correo, guárdalos para futuros
            ingresos.
          </h3>
          <v-btn color="info" @click="iniciarConfiguración()" x-large>
            Continuar</v-btn
          >
        </div>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script>
import CboPais from "@/components/comun/cboPais.vue";
import { mapActions } from "vuex";
export default {
  components: {
    CboPais,
  },
  data() {
    return {
      numero: "51998146389",
      errorEmail: "",
      enviarCodigo: true,
      snackbarEmail: false,
      timeLeft: 3 * 60, // 5 minutos en segundos
      intervalId: null,
      dialogRegistrandoEmpresa: false,
      confirmRegistro: false,
      model: 0,
      id_pais: null,
      reenviarCodigo: true,
      text: "",
      colorSnakBar: "",
      icon: "",
      snackbarEmail: false,
      timeout: 2000,
      multiLine: true,
      mostrarAdvertencia: false,
      typePassword: true,
      errorMessages: [],
      errortrade_name: "",
      errornames: "",
      errorsurname: "",
      errorsecond_surname: "",
      errorClave: "",
      errorPais: "",
      errorPhone: "",
      textCarrusel: [
        { urlImg: "MENSAJE-1.png" },
        {
          urlImg: "MENSAJE-4.png",
        },
        {
          urlImg: "MENSAJE-5.png",
        },
        { urlImg: "MENSAJE-6.png" },
      ],
      passwordRules: [
        (v) => !!v || "El campo es requerido",
        (v) => v.length >= 8 || "Debe tener al menos 8 caracteres",
        (v) => /[a-zA-Z]/.test(v) || "Debe contener al menos una letra",
        (v) => /[0-9]/.test(v) || "Debe contener al menos un número",
      ],
      errorPais: "",
      validandoCorreo: false,
    };
  },
  computed: {
    // Calcula los minutos restantes
    minutes() {
      return Math.floor(this.timeLeft / 60);
    },
    // Calcula los segundos restantes y formatea el valor (si es menor a 10, añade un 0 delante)
    secondsFormatted() {
      const seconds = this.timeLeft % 60;
      return seconds < 10 ? "0" + seconds : seconds;
    },
  },
  mounted() {

    // Inicia el temporizador cuando el componente es montado
    // this.startTimer();
  },
  methods: {
    ...mapActions([
      // "_getPais",
      "RegistroNuevaEmpresa",
      "enviarCorreoValidacion",
      "validarCodigoVerificacion",
      "_getMenuItem",
      "validarCorreoRegistro",
    ]),
    abriChat() {
      let text = `https://api.whatsapp.com/send/?phone=${this.numero}&text=Hola, ACO. Me gustaría contactar con alguien&type=phone_number&app_absent=0`;
      window.open(text);
    },
    handlePaisSeleccionado(paisId) {
      
      this.$store.state.enterprises.data.id_pais = paisId;
      this.errorPais = "";
    },
    async validarCorreoExiste() {
      this.validandoCorreo = true;
      this.errorEmail = "";
      let res = await this.validarCorreoRegistro();
      this.validandoCorreo = false;
      if (res.estadoflag) {
        this.errorEmail = res.mensaje;
      }
    },
    startTimer() {
      this.intervalId = setInterval(() => {
        if (this.timeLeft > 0) {
          this.timeLeft--;
        } else {
          this.reenviarCodigo = false;
          clearInterval(this.intervalId);
        }
      }, 1000);
    },
    async iniciarConfiguración() {
      await this._getMenuItem();
      this.$router.push({ name: "ConfiguracionInicial" }, () => {});
    },
    async enviarCorreo() {
      this.errorPais = "";
      let res = await this.validarCorreoRegistro();
      if (res.estadoflag) {
        this.errorEmail = res.mensaje;
        return false;
      }

      let valDatos = this.validarDatos();
      if (!valDatos) {
        return false;
      }
      if (this.validarCorreo() && !res.estadoflag) {
        if (
          this.$store.state.enterprises.data.email &&
          this.$store.state.enterprises.data.emailconfirmacion
        ) {
          if (!this.$store.state.enterprises.data.id_pais) {
            this.errorPais = "Dato Requerido";
            return false;
          }
          this.mostrarAdvertencia = true;
          this.timeLeft = 3 * 60;
          // this.startTimer();
          let val = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
            this.$store.state.enterprises.data.email
          );
          if (val) {
            this.loading = true;
            this.loadingRegistro = true;
            this.enviarCorreoValidacion().catch((e) => {
              console.error(e);
            });
            this.reenviarCodigo = false;
            this.enviarCodigo = false;
            this.startTimer();
          } else {
            this.snackbarEmail = !val;
            this.colorSnakBar = "orange darken-2";
            this.text = "Ingrese un correo valido.";
            this.icon = "alert";
          }
        }
      } else {
        // this.errorEmail = !this.errorEmail ?"Los correos no coinciden.";
        if (!this.$store.state.enterprises.data.id_pais) {
          this.errorPais = "Dato Requerido";
          return false;
        }
      }
    },
    validarCorreo() {
      this.errorEmail = "";
      if (
        this.$store.state.enterprises.data.email &&
        this.$store.state.enterprises.data.emailconfirmacion
      ) {
        if (
          this.$store.state.enterprises.data.email !=
          this.$store.state.enterprises.data.emailconfirmacion
        ) {
          this.errorEmail = "Los Correos no coinciden";
          return false;
        }
      }
      return true;
    },
    async crearNuevaEmpresa() {
      this.errorPais = "";
      this.validatedCodigo = "";
      let res = await this.validarCorreoRegistro();
      if (res.estadoflag) {
        this.errorEmail = res.mensaje;
        return false;
      }
      if (
        this.$refs.frmRegistro.validate() &&
        this.$store.state.enterprises.data.id_pais &&
        this.validarCorreo() &&
        !res.estadoflag
      ) {
        let res = await this.validarCodigoVerificacion(true);
        if (res.estadoflag) {
          this.dialogRegistrandoEmpresa = true;

          let res = await this.RegistroNuevaEmpresa();

          this.dialogRegistrandoEmpresa = false;

          this.confirmRegistro = true;
        } else {
          this.validatedCodigo = res.mensaje;
          this.snackbarEmail = true;
          this.colorSnakBar = "orange darken-2";
          this.text = res.mensaje;
          this.icon = "alert";
        }
      } else {
        if (!this.$store.state.enterprises.data.id_pais) {
          this.errorPais = "Dato Requerido";
        }
      }
    },
    validarDatos() {
      let val = true;
      this.errortrade_name = "";
      this.errornames = "";
      this.errorsurname = "";
      this.errorsecond_surname = "";
      this.errorEmail = "";
      this.errorClave = "";
      this.errorPais = "";
      this.errorPhone = "";
      if (!this.$store.state.enterprises.data.trade_name) {
        this.errortrade_name = "Dato Requerido";
        val = false;
      }
      if (!this.$store.state.enterprises.data.names) {
        this.errornames = "Dato Requerido";
        val = false;
      }
      if (!this.$store.state.enterprises.data.surname) {
        this.errorsurname = "Dato Requerido";
        val = false;
      }
      /* if (!this.$store.state.enterprises.data.second_surname) {
        this.errorsecond_surname = "Dato Requerido";
        val = false;
      }*/
      if (!this.$store.state.enterprises.data.email) {
        this.errorEmail = "Dato Requerido";
        val = false;
      }
      if (!this.$store.state.enterprises.data.clave) {
        this.errorClave = "Dato Requerido";
        val = false;
      }

      if (this.$store.state.enterprises.data.clave) {
        if (this.$store.state.enterprises.data.clave.length < 8) {
          this.errorClave = "Debe tener al menos 8 caracteres";
          val = false;
        } else if (!/[a-zA-Z]/.test(this.$store.state.enterprises.data.clave)) {
          this.errorClave = "Debe contener al menos una letra";
          val = false;
        } else if (!/[0-9]/.test(this.$store.state.enterprises.data.clave)) {
          this.errorClave = "Debe contener al menos una número";
          val = false;
        }
      }

      if (!this.$store.state.enterprises.data.id_pais) {
        this.errorPais = "Dato Requerido";
        val = false;
      }

      if (!this.$store.state.enterprises.data.phone) {
        this.errorPhone = "Dato Requerido";
        val = false;
      }
      return val;
    },
    irALogin() {
      this.$router.push({ name: "Login" });
    },
  },
  beforeDestroy() {
    // Asegúrate de limpiar el intervalo si el componente es destruido
    clearInterval(this.intervalId);
  },
};
</script>
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
