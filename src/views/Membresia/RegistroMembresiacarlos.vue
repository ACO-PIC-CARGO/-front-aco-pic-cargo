<template>
  <v-container fluid>
    <v-card class="px-5">
      <v-row>
        <v-col cols="12" md="4" offset-md="4">
          <v-text-field
            label="Cantidad"
            type="number"
            v-model="cntUser"
            variant="outlined"
            suffix="Usuarios"
          ></v-text-field>
        </v-col>
      </v-row>
      <v-row class="align-center">
        <v-col v-for="(plan, index) in planes" :key="index" cols="12" md="4">
          <CardPlan :plan="plan" :index="index" />
        </v-col>
      </v-row>
    </v-card>
  </v-container>
</template>

<script>
export default {
  components: { CardPlan: () => import("../../components/comun/CardPlan.vue") },
  data() {
    return {
      cntUser: 1000,
      autoScrollInterval: null,
      planes: [
        {
          name: "Granola Cereal",
          precioMes: 145.63,
          maximoContactos: 1097,
          description: "Neque porro quisquam est",
          selected: false,
          caracteristicas: [
            {
              name: "Applewood Smoked Bacon",
              estado: false,
            },
            {
              name: "Outdoor Portable Fire Pit",
              estado: false,
            },
            {
              name: "Hair Dryer",
              estado: true,
            },
            {
              name: "Organic Coconut Flour",
              estado: false,
            },
            {
              name: "Electric Wine Opener",
              estado: false,
            },
            {
              name: "Surimi Crab Sticks",
              estado: true,
            },
            {
              name: "Compressed Towel Tablets",
              estado: false,
            },
            {
              name: "Wall Art Stickers",
              estado: true,
            },
            {
              name: "Lemon Dill Chicken Skewers",
              estado: false,
            },
            {
              name: "Memory Foam Pillow",
              estado: false,
            },
            {
              name: "Gardening Fairy Figurines",
              estado: true,
            },
            {
              name: "Cookbook",
              estado: true,
            },
            {
              name: "Electric Griddle with Removable Plates",
              estado: false,
            },
            {
              name: "Canned Sardines",
              estado: false,
            },
            {
              name: "Travel Size Toiletry Bottles",
              estado: true,
            },
          ],
        },
        {
          name: "Thermostatic Shower Valve Kit",
          precioMes: 105.72,
          maximoContactos: 1126,
          selected: true,
          description: "Neque porro quisquam est ",
          caracteristicas: [
            {
              name: "Watercolor Brush Pens",
              estado: false,
            },
            {
              name: "Spicy Kimchi",
              estado: false,
            },
            {
              name: "Carrot and Celery Sticks",
              estado: false,
            },
            {
              name: "Fashionable Scarves Set",
              estado: false,
            },
            {
              name: "Peanut Butter Banana Smoothie Mix",
              estado: true,
            },
            {
              name: "Linen Trousers",
              estado: true,
            },
            {
              name: "Scented Candles",
              estado: false,
            },
            {
              name: "Mini Indoor Herb Garden Kit",
              estado: true,
            },
            {
              name: "Cinnamon Apple Sauce",
              estado: false,
            },
            {
              name: "Salsa",
              estado: true,
            },
            {
              name: "Fruit & Nut Trail Mix",
              estado: true,
            },
            {
              name: "Portable Air Pump",
              estado: false,
            },
            {
              name: "Hot Salsa",
              estado: true,
            },
            {
              name: "Chino Shorts",
              estado: true,
            },
            {
              name: "Compact Dishwasher",
              estado: false,
            },
          ],
        },
        {
          name: "Sesame Garlic Stir-Fry Sauce",
          precioMes: 122.47,
          maximoContactos: 1079,
          selected: false,
          description: "Neque porro quisquam est qui dolorem",
          caracteristicas: [
            {
              name: "Nut Mix",
              estado: true,
            },
            {
              name: "Wireless Music Receiver",
              estado: true,
            },
            {
              name: "Gingerbread House Kit",
              estado: false,
            },
            {
              name: "Hummus",
              estado: true,
            },
            {
              name: "Backpacking Tent",
              estado: false,
            },
            {
              name: "Sun Protection Clothing",
              estado: false,
            },
            {
              name: "Sour Cream",
              estado: true,
            },
            {
              name: "Gaming Headset",
              estado: false,
            },
            {
              name: "Cinnamon Raisin Bread",
              estado: true,
            },
            {
              name: "Customizable Name Puzzle",
              estado: false,
            },
            {
              name: "Dog Waste Bag Dispenser",
              estado: false,
            },
            {
              name: "Organic Coconut Yogurt",
              estado: true,
            },
            {
              name: "Spicy Thai Noodles",
              estado: false,
            },
            {
              name: "Leek and Potato Soup",
              estado: false,
            },
            {
              name: "Vegetable Spiralizer",
              estado: true,
            },
          ],
        },
      ],
    };
  },
  mounted() {
    this.startAutoScroll();
  },
  beforeUnmount() {
    clearInterval(this.autoScrollInterval);
  },
  methods: {
    scrollCarrusel() {
      const el = this.$refs.carrusel;
      const scrollAmount = 300; // ajusta según tu diseño
      const maxScrollLeft = el.scrollWidth;

      // Si llegó al final, vuelve al inicio
      if (el.scrollLeft + el.clientWidth >= el.scrollWidth - 5) {
        el.scrollTo({ left: 0, behavior: "smooth" });
      } else {
        el.scrollBy({ left: scrollAmount, behavior: "smooth" });
      }
    },
    startAutoScroll() {
      this.autoScrollInterval = setInterval(() => {
        this.scrollCarrusel();
      }, 4000); // cambia 4000 por los milisegundos deseados
    },
    pauseAutoScroll() {
      clearInterval(this.autoScrollInterval);
    },
    resumeAutoScroll() {
      this.startAutoScroll();
    },
  },
};
</script>

<style scoped></style>
