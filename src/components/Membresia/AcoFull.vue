<script setup lang="ts">
import { onMounted, ref } from "vue";
import type { ModuloMembresia } from "@/types/membresia";

const props = defineProps<{ modules?: ModuloMembresia[] }>();

const checkbox = ref(true);
const items = [
  { id: 1, label: "1 mes" },
  { id: 2, label: "3 mes" },
  { id: 3, label: "6 mes" },
  { id: 4, label: "1 año" },
];
const idTiempo = ref(1);

onMounted(() => {
  props.modules!.map((item) => {
    item.checkbox = true;
  });
});

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function probar() {
  console.log(props.modules);
}
</script>

<template>
  <v-container fluid>
    <v-row>
      <v-col
        cols="12"
        class="centrado"
      >
        Estás a punto de adquirir ACO Full
      </v-col>
      <v-col
        cols="12"
        class="centrado"
      >
        Tendrás acceso completo a los siguientes módulos:
      </v-col>
      <v-col cols="12">
        <v-checkbox
          class="centradoCheck"
          v-for="modulo in modules"
          :key="modulo.id"
          v-model="checkbox"
          :label="`${modulo.name}`"
          readonly
          density="compact"
        />
      </v-col>
      <v-col cols="12">
        <v-row class="centrado">
          <v-col
            cols="6"
            class="derecha"
          >
            Total: $180.00 por
          </v-col>
          <v-col
            cols="6"
            class="centrarElement"
          >
            <v-select
              :items="items"
              v-model="idTiempo"
              item-title="label"
              item-value="id"
              variant="outlined"
              density="compact"
            />
          </v-col>
        </v-row>
      </v-col>
      <v-col
        cols="12"
        class="centrado centro"
      >
        A partir de la fecha de finalización del tiempo de prueba gratis (no
        perderás tus 15 días de prueba gratis).
      </v-col>
      <v-col
        cols="12"
        class="centrado"
      >
        Disfruta más tiempo de ACO y obtén un descuento exclusivo:
      </v-col>
      <v-col cols="12">
        <v-table class="tableDate">
          <thead>
            <tr>
              <th>Tiempo</th>
              <th>Precio Normal</th>
              <th>Descuento</th>
              <th>Precio Descuento</th>
              <th>Ahorro</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>3 meses</td>
              <td>$540.00</td>
              <td>3 %</td>
              <td>$523.80</td>
              <td>$16.20</td>
            </tr>
            <tr>
              <td>6 meses</td>
              <td>$1080.00</td>
              <td>7 %</td>
              <td>$1004.04</td>
              <td>$75.60</td>
            </tr>
            <tr>
              <td>1 meses</td>
              <td>$2160</td>
              <td>7 %</td>
              <td>$1836.00</td>
              <td>$324.00</td>
            </tr>
          </tbody>
        </v-table>
      </v-col>
      <v-col
        cols="12"
        class="centrado"
      >
        <v-btn
          class="mx-5"
          color="red"
        >
          Regresar
        </v-btn>
        <v-btn
          class="mx-5"
          color="#527AC7"
        >
          Continuar
        </v-btn>
      </v-col>
    </v-row>
  </v-container>
</template>

<style scope>
.centrado {
  align-content: center;
  text-align: center;
}
.derecha {
  align-content: right;
  text-align: right;
}
.centrarElement {
  padding: 0 25% 0 0 !important;
}
.centro {
  background: #6ca551 !important;
}
.tableDate {
  margin: auto !important;
  width: 80%;
  border: 1px solid #000 !important;
  box-shadow: 0px 0px 10px rgba(0, 0, 0, 0.1); /* Esto agrega una sombra */
}
.centradoCheck {
  margin: 0 0 0 25%;
}
</style>
