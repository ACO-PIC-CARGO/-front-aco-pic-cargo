<template>
  <v-container fluid>
    <v-row class="mt-5 centrar-items">
      <v-col cols="4" class="px-5">
        <v-card class="cards" elevation="10">
          <div class="cuerpoMembresia">
            <p class="pt-5 centrado">
              <span class="title text-h6"> ACO Por Módulo</span>
            </p>
            <p class="mt-2 mb-0 centrado subtitle">
              75.<span class="decimales">00</span> $/mes
            </p>
            <p class="mt-2 mb-0 centrado subtitle">
              765.<span class="decimales">00</span> $/año
            </p>
            <p class="mt-2 mb-0 centrado subtitle">
              <span class="decimales">¡Ahorra $135.00</span>!
            </p>
            <div class="mt-15">
              <ul>
                <li>
                  <v-icon color="green">mdi-check-bold</v-icon> Acceso completo
                  al módulo seleccionado
                </li>
                <li>
                  <v-icon color="green">mdi-check-bold</v-icon> Reportes
                  ilimitados del módulo seleccionado
                </li>
                <li>
                  <v-icon color="green">mdi-check-bold</v-icon> Hasta 3 usuarios
                  activos
                </li>
                <li>
                  <v-icon color="green">mdi-check-bold</v-icon> 3 hrs. de
                  Soporte gratis/ mes
                </li>
              </ul>
            </div>
          </div>
          <div class="col-12 centrado">
            <v-btn @click="abrirPorModulo()" color="#2749C1" dark
              >Contratar</v-btn
            >
          </div>
        </v-card>
      </v-col>
      <v-col cols="4" class="px-5">
        <v-card class="cards" elevation="10">
          <div class="cuerpoMembresia">
            <section class="centrado">
              <span class="flotante">RECOMENDADO</span>
            </section>
            <p class="mt-5 centrado">
              <span class="title text-h6"> ACO FULL</span>
            </p>
            <p class="mt-2 mb-0 centrado subtitle">
              180.<span class="decimales">00</span> $/mes
            </p>
            <p class="mt-2 mb-0 centrado subtitle">
              1836.<span class="decimales">00</span> $/año
            </p>

            <p class="mt-2 mb-0 centrado subtitle">
              <span class="decimales">¡Ahorra $324.00!</span>
            </p>
            <div class="mt-5">
              <p class="mx-5">Acceso completo a</p>
              <ul>
                <li><v-icon color="green">mdi-check-bold</v-icon> Pricing</li>
                <li>
                  <v-icon color="green">mdi-check-bold</v-icon> Operaciones
                </li>
                <li><v-icon color="green">mdi-check-bold</v-icon> Finanzas</li>
                <li>
                  <v-icon color="green">mdi-check-bold</v-icon> Reportes
                  ilimitados
                </li>
                <li>
                  <v-icon color="green">mdi-check-bold</v-icon> Hasta 3 usuarios
                  activos
                </li>
                <li>
                  <v-icon color="green">mdi-check-bold</v-icon>Soporte
                  ilimitados
                </li>
              </ul>
            </div>
          </div>
          <div class="col-12 centrado">
            <v-btn @click="abrirFull()" color="#2749C1" dark>Contratar</v-btn>
          </div>
        </v-card>
      </v-col>
      <v-col cols="4" class="px-5">
        <v-card class="cards" elevation="10">
          <div class="cuerpoMembresia">
            <p class="pt-5 centrado">
              <span class="title text-h6"> ACO Dos Módulos</span>
            </p>
            <p class="mt-2 mb-0 centrado subtitle">
              130.<span class="decimales">00</span> $/mes
            </p>
            <p class="mt-2 mb-0 centrado subtitle">
              1326.<span class="decimales">00</span> $/mes
            </p>
            <p class="mt-2 mb-0 centrado subtitle">
              <span class="decimales">¡Ahorra $234.00!</span>
            </p>
            <div class="mt-15">
              <ul>
                <li>
                  <v-icon color="green">mdi-check-bold</v-icon> Acceso completo
                  a los módulos seleccionados
                </li>
                <li>
                  <v-icon color="green">mdi-check-bold</v-icon> Reportes
                  ilimitados de los módulos seleccionados
                </li>
                <li>
                  <v-icon color="green">mdi-check-bold</v-icon> Hasta 3 usuarios
                  activos
                </li>
                <li>
                  <v-icon color="green">mdi-check-bold</v-icon> 7 hrs. de
                  Soporte gratis/ mes
                </li>
              </ul>
            </div>
          </div>
          <div class="col-12 centrado">
            <v-btn @click="abrirDosModulos()" color="#2749C1" dark
              >Contratar</v-btn
            >
          </div>
        </v-card>
      </v-col>
    </v-row>
    <!-- MODALES  -->
    <v-dialog v-model="dialogPorModulo" scrollable persistent max-width="60%">
      <v-card> </v-card>
    </v-dialog>
    <v-dialog v-model="dialogFull" scrollable persistent max-width="50%">
      <v-card>
        <AcoFull :modules="modules" />
      </v-card>
    </v-dialog>
    <v-dialog v-model="dialogDosModulos" scrollable persistent max-width="80%">
      <v-card> dialogDosModulos </v-card>
    </v-dialog>
  </v-container>
</template>

<script>
import { defineAsyncComponent } from "vue";
export default {
  components: {
    AcoFull: defineAsyncComponent(() => import("../Membresia/AcoFull.vue")),
  },
  data() {
    return {
      dialogPorModulo: false,
      dialogFull: false,
      dialogDosModulos: false,
      modules: [
        { id: 1, name: "ACO Pricing" },
        { id: 2, name: "ACO Operaciones" },
        { id: 3, name: "ACO Finanzas" },
      ],
    };
  },
  methods: {
    abrirPorModulo() {
      this.dialogPorModulo = true;
    },
    abrirFull() {
      this.dialogFull = true;
    },
    abrirDosModulos() {
      this.dialogDosModulos = true;
    },
  },
};
</script>

<style scope>
.decimales {
  font-size: 1rem;
}
.centrado {
  align-content: center;
  text-align: center;
}
.title {
  color: #800b0b !important;
  /* font-size: 2rem; */
  font-weight: bold;
}
.subtitle {
  color: #2749c1 !important;
  font-size: 1.5rem;
  font-weight: bold;
}

ul {
  text-decoration: none !important;
  list-style: none;
  /* list-style-image: url('/img/png/check.png'); */
}
section {
  position: relative;
}
.flotante {
  /* border: 1px solid #000; */
  position: absolute;
  border-radius: 5px;
  background: #e8a250 !important;
  color: #fff !important;

  padding: 7px 15px !important;
  top: -20px;
  left: 20%;
}
.cards {
  min-height: 450px !important;
  max-width: 300px;
}
.centrar-items {
  /* border: 1px solid red; */
  margin: auto !important;
  width: 1000px;
}
.cuerpoMembresia {
  height: 400px !important;
}
@media only screen and (max-width: 1200px) {
  .flotante {
    /* border: 1px solid #000; */
    position: absolute;
    border-radius: 5px;
    background: #e8a250 !important;
    color: #fff !important;

    padding: 7px 15px !important;
    top: -20px;
    left: 10%;
  }
}
@media only screen and (min-width: 1800px) {
  .flotante {
    position: absolute;
    border-radius: 5px;
    background: #e8a250 !important;
    color: #fff !important;

    padding: 7px 15px !important;
    top: -20px;
    left: 27%;
  }
}
</style>
