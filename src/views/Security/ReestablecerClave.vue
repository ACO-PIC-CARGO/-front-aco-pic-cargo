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
                outlined
                v-model="email"
                dense
              ></v-text-field>
            </v-col>
            <v-col cols="12" class="py-0">
              <v-text-field
                outlined
                label="Clave"
                :type="esClave ? 'password' : 'text'"
                id="id"
                v-model="clave"
                dense
              ></v-text-field>
            </v-col>
            <v-col cols="12" class="py-0">
              <v-text-field
                outlined
                label="Confirmar Clave"
                :type="esClave ? 'password' : 'text'"
                id="id"
                v-model="confirmaclave"
                dense
              ></v-text-field>
            </v-col>
            <v-col cols="12" class="py-0">
              <v-btn
                color="success"
                x-small
                class="mx-1"
                @click="reestablecerClave()"
              >
                Reestablecer Clave
              </v-btn>
              <v-btn color="error" x-small class="mx-1"> Ir al Login </v-btn>
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
    console.log(this.$route.params.token);
    await axios({
      method: "get",
      url: `${process.env.VUE_APP_URL_MAIN}validar_token_recuperar_clave?token=${this.$route.params.token}`,
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
        console.log(error);
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
        .put(`${process.env.VUE_APP_URL_MAIN}reestablecer_clave`, {
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
          console.log(error);
        });
    },
  },
};
</script>

<style></style>
