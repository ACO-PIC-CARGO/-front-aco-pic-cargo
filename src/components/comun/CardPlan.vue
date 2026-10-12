<template>
  <v-container class="clsContenedor">
    <div class="clsname">
      <h2>{{ plan.name }}</h2>
      <p>{{ plan.description }}</p>
    </div>

    <div class="clsprecioMes">
      $ <span>{{ plan.precioMes }}</span> / mes
    </div>
    <div class=""><v-btn color="info" size="small" block>Seleccionar Plan</v-btn></div>
    <div class="clsmaximoContactos">
      <p>Hasta {{ plan.maximoContactos }} usuario</p>
    </div>
    <h3>Qué Incluye:</h3>
    <div class="clsCaracteristicas">
      <p
        v-for="(car, index) in plan.caracteristicas"
        :key="index"
        class="py-0 my-0"
      >
        <v-icon v-if="car.estado" color="success"
          >mdi-check-circle-outline</v-icon
        >
        <v-icon v-else color="error">mdi-close-circle-outline</v-icon>
        <span :class="car.estado ? 'activo' : 'tachado'">{{ car.name }}</span>
      </p>
    </div>
    <v-btn class="mt-5" color="success" block>Escoger Plan</v-btn>
  </v-container>
</template>

<script>
export default {
  props: {
    plan: {
      type: Object,
      default: {},
    },
    index: {
      type: Number,
      default: 0,
    },
  },
};
</script>

<style scoped>
.clsContenedor {
  border: 1px solid #000000;
  border-radius: 25px;
  padding: 5% 10%;
  min-height: 250px;
  background: #ffffff;
  height: 800px;
  width: 100%;
}
.clsname {
  align-content: center;
  align-items: center;
  text-align: center;
  max-height: 80px !important;
  height: 80px !important;
  /* background-color: lightblue;
  border: 1px solid red; */
}

.clsprecioMes {
  text-align: center;
}
.clsprecioMes > span {
  font-weight: bold;
}
.clsmaximoContactos {
  margin: 10% auto;
  text-align: center !important;
}
.tachado {
  text-decoration: line-through;
  color: #bdbdbd;
}
</style>
