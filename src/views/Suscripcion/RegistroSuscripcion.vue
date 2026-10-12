<template>
  <v-card>
    <v-container>
      <v-row>
        <v-col cols="12"> <h3>Registro de Suscripción</h3> </v-col>
        <v-col cols="12" md="4">
          Nombre:
          <v-text-field variant="solo" density="compact"></v-text-field>
        </v-col>
        <v-col cols="12" md="8">
          Descripcion:
          <v-textarea variant="solo" rows="1" density="compact"></v-textarea>
        </v-col>
        <v-col cols="12" class="pt-0">
          <v-tabs v-model="tab" color="primary" align-tabs="center" slider-color="primary">
            <v-tab key="usuarios"> Usuarios </v-tab>
            <v-tab key="Detalles"> Detalles </v-tab>
          </v-tabs>
          <v-tabs-items v-model="tab">
            <v-tab-item key="usuarios">dddd </v-tab-item>
            <v-tab-item key="Detalles"> aaa</v-tab-item>
          </v-tabs-items>
        </v-col>
      </v-row>
    </v-container>
  </v-card>
</template>

<script>
export default {
  data() {
    return {
      tab: "usuarios",
      lstUsuario: [
        {
          id: 1,
          Descripcion:
            "Nutritious and hearty pasta made from whole wheat flour.",
          Cantidad: 7095,
          Estado: false,
        },
        {
          id: 2,
          Descripcion:
            "Frozen smoothie blend with berries for a quick and healthy breakfast.",
          Cantidad: 3161,
          Estado: true,
        },
        {
          id: 3,
          Descripcion:
            "Reusable silicone lids for covering food in bowls and storage containers.",
          Cantidad: 3868,
          Estado: true,
        },
        {
          id: 4,
          Descripcion: "Designed for comfort and performance during workouts.",
          Cantidad: 968,
          Estado: true,
        },
        {
          id: 5,
          Descripcion: "Passive noise reduction headphones for focus.",
          Cantidad: 8690,
          Estado: false,
        },
        {
          id: 6,
          Descripcion:
            "Retro-style graphic tee with a soft wash for a vintage feel.",
          Cantidad: 8240,
          Estado: false,
        },
        {
          id: 7,
          Descripcion:
            "A flavorful spread made with roasted garlic and creamy butter.",
          Cantidad: 6525,
          Estado: true,
        },
        {
          id: 8,
          Descripcion: "Savory sauce for vegetable and meat stir-fries.",
          Cantidad: 7696,
          Estado: true,
        },
        {
          id: 9,
          Descripcion: "Flavorful lentil soup, perfect for a quick meal.",
          Cantidad: 1568,
          Estado: false,
        },
        {
          id: 10,
          Descripcion:
            "Jump rope that counts your jumps for tracking workouts.",
          Cantidad: 5161,
          Estado: true,
        },
      ],
    };
  },
};
</script>

<style></style>
