<template>
  <v-container>
    <v-row>
      <v-col cols="4" offset="4">
        <v-card elevation="1" class="pa-5">
          <v-row>
            <v-col class="12">
              <img
                src="/img/login/logo-aco.png"
                style="max-width: 350px"
                alt="logo"
              />
            </v-col>
            <v-col class="12">Reestablecer Contraseña</v-col>
            <v-col cols="12" class="py-0">
              <v-text-field
                label="Email"
                variant="outlined"
                v-model="email"
                density="compact"
              ></v-text-field>
            </v-col>
            <v-col cols="12" class="py-0">
              <v-text-field
                variant="outlined"
                label="Clave"
                :type="esClave ? 'password' : 'text'"
                id="id"
                v-model="clave"
                density="compact"
              ></v-text-field>
            </v-col>
            <v-col cols="12" class="py-0">
              <v-text-field
                variant="outlined"
                label="Confirmar Clave"
                :type="esClave ? 'password' : 'text'"
                id="id"
                v-model="confirmaclave"
                density="compact"
              ></v-text-field>
            </v-col>
            <v-col cols="12" class="py-0">
              <v-btn
                color="success"
                size="x-small"
                class="mx-1"
                @click="reestablecerClave()"
              >
                Reestablecer Clave
              </v-btn>
              <v-btn color="error" size="x-small" class="mx-1"> Ir al Login </v-btn>
            </v-col>
          </v-row>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script>
import axios from '@/api/axios-config';
import Swal from "sweetalert2";
export default {
  data() {
    return {
      esClave: true,
      email: "",
      clave: "",
      confirmaclave: "",
    };
  },
  async mounted() {
    
    await axios({
      method: "get",
      url: `${import.meta.env.VUE_APP_URL_MAIN}validar_token_recuperar_clave?token=${this.$route.params.token}`,
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
              this.$router.push("/");
            }
          });
        }
      })
      .catch((error) => {
        console.error(error);
      });
  },
  methods: {
    reestablecerClave() {
      if (this.clave != this.confirmaclave) {
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
        .put(`${import.meta.env.VUE_APP_URL_MAIN}reestablecer_clave`, {
          email: this.email,
          clave: this.clave,
          token: this.$route.params.token,
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
                this.$router.push("/");
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
    },
  },
};
</script>

<style></style>
