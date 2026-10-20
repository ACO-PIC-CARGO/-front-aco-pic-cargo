<template>
  <v-container class="pa-0 ma-a container">
    <v-row>
      <v-col
        cols="6"
        class="card-left"
      />
      <v-col
        cols="6"
        class="card-rigth"
      >
        <img
          src="img/png/logo.png"
          alt=""
          srcset=""
          class="imgLogo"
        >
        <div class="centrado">
          <p class="saludo">
            Bienvenido...
          </p>
        </div>
        <div class="formulario">
          <div class="">
            <div class="descripcion">
              Usuario
            </div>
            <div class="">
              <input
                class="frmInput"
                type="text"
                placeholder="Ingrese su usuario"
                autocomplete="off"
              >
            </div>
          </div>
          <div class="">
            <div class="descripcion">
              Contraseña
            </div>
            <div class="">
              <input
                class="frmInput"
                type="password"
                placeholder="Ingrese su contraseña"
              >
            </div>
          </div>
          <div class="">
            <div class="contenedorLink">
              <a
                href="#"
                class="link"
              >¿Has olvidado tu contraseña?</a>
            </div>
            <div class="">
              <button class="btn btn-acceder">
                Iniciar Sesion
              </button>
            </div>
            <div class="">
              <button class="btn btn-registro">
                Registrar
              </button>
            </div>
          </div>
        </div>
      </v-col>
    </v-row>
  </v-container>
</template>

<style scope>
* {
  margin: 0% !important;
}
.card {
  width: 60% !important;
  margin: 0 auto !important;
}
.container {
  min-width: 100%;
  background: #f7fcfc;
}
.card-left {
  background: url("../../public/img/png/background.png");
  min-height: 100vh;
}
.card-rigth {
  background: #263238;
  color: #fff;
}
.formulario {
  border: 2px solid rgba(255, 255, 255, 0.6);
  border-radius: 25px;
  max-width: 50% !important;
  padding: 4%;
  margin: 0 auto !important;
  backdrop-filter: blur(100px);
  transition: opacity 0.5s ease-in-out;
  background: #263136 !important;
}
.centrado {
  align-content: center !important;
  text-align: center !important;
}
.imgLogo {
  height: 120px;
  /* border-radius: 50%; */
}
.saludo {
  font-size: 4rem;
  font-weight: bold;
}
.descripcion {
  font-size: 2rem;
}
.frmInput {
  /* background: red; */
  padding: 1% 5% !important;
  border-radius: 25px;
  width: 100%;
  font-size: 1.2rem;
  border: 2px solid rgba(255, 255, 255, 0.6);
  background: #e0e0e0;
}

.btn {
  min-width: 100%;
  font-size: 1.2rem;
  font-weight: bold;
  padding: 1.5% 5%;
  margin: 5px auto !important;
  border-radius: 25px;
  border: 2px solid rgba(255, 255, 255, 0.6);
}
.btn-acceder {
  background: #1b5e20;
  color: white;
}
.btn-registro {
  background: #004d40;
  color: white;
}
.contenedorLink {
  align-content: right;
  align-items: right;
  text-align: right;
  padding: 2% 0;
}
</style>
