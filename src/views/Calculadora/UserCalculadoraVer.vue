<template>
  <v-card>
    <v-container>
      <v-tabs
        v-model="model"
        align-tabs="center"
        bg-color="teal-darken-3"
        slider-color="teal-lighten-3"
        show-arrows
      >
        <v-tab key="principal">Datos Principales</v-tab>
        <v-tab key="xxx">Costos</v-tab>
      </v-tabs>
      <v-tabs-window v-model="model" class="mt-3">
        <v-tabs-window-item key="principal">
          <v-row>
            <v-col cols="6">
              <v-text-field
                name="Cliente"
                label="Cliente"
                variant="outlined"
                density="compact"
              ></v-text-field>
            </v-col>
            <v-col cols="6">
              <v-text-field
                name="Teléfono"
                label="Teléfono"
                variant="outlined"
                density="compact"
              ></v-text-field>
            </v-col>
            <v-col cols="6">
              <v-text-field
                name="Email"
                label="Email"
                variant="outlined"
                density="compact"
              ></v-text-field>
            </v-col>
            <v-col cols="6">
              <v-text-field
                name="Origen"
                label="Origen"
                variant="outlined"
                density="compact"
              ></v-text-field>
            </v-col>
            <v-col cols="6">
              <v-text-field
                name="Destino"
                label="Destino"
                variant="outlined"
                density="compact"
              ></v-text-field>
            </v-col>
            <v-col cols="6">
              <v-text-field
                name="Peso"
                label="Peso"
                variant="outlined"
                density="compact"
              ></v-text-field>
            </v-col>
            <v-col cols="6">
              <v-text-field
                name="Volumen"
                label="Volumen"
                variant="outlined"
                density="compact"
              ></v-text-field>
            </v-col>
            <v-col cols="6">
              <v-text-field
                name="ValorMercancia"
                label="Valor Mercancia"
                variant="outlined"
                density="compact"
              ></v-text-field>
            </v-col>
            <v-col cols="6">
              <v-text-field
                name="Profit"
                label="Profit"
                variant="outlined"
                density="compact"
              ></v-text-field>
            </v-col>
          </v-row>
        </v-tabs-window-item>
        <v-tabs-window-item key="costos"> Costos </v-tabs-window-item>
      </v-tabs-window>
    </v-container>
  </v-card>
</template>

<script>
export default {
  data() {
    return {
      model: "principal",
      cotizacion: {},
    };
  },
};
</script>

<style></style>
