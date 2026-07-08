<template>
  <v-card>
    <v-tabs v-model="tab" slider-color="primary" centered>
      <v-tab href="#lcl">
        <span style="font-size: 1.3em; font-weight: bold">LCL</span>
      </v-tab>
      <v-tab href="#fcl">
        <span style="font-size: 1.3em; font-weight: bold">FCL</span>
      </v-tab>
    </v-tabs>

    <v-tabs-items v-model="tab">
      <v-tab-item value="lcl" class="px-10">
        <LCLTextWhatsappCotizacion />
      </v-tab-item>
      <v-tab-item value="fcl" class="px-10">
        <FCLTextWhatsappCotizacion />
      </v-tab-item>
    </v-tabs-items>
  </v-card>
</template>

<script>
import { mapActions } from "vuex";

export default {
  components: {
    LCLTextWhatsappCotizacion: () =>
      import(
        "@/components/Configuracion/Pricing/LCLTextWhatsappCotizacion.vue"
      ),
    FCLTextWhatsappCotizacion: () =>
      import(
        "@/components/Configuracion/Pricing/FCLTextWhatsappCotizacion.vue"
      ),
  },
  data() {
    return {
      tab: "lcl",
    };
  },
  methods: {
    ...mapActions("configuracion", ["getTextWhatsapp"]),
  },
  async mounted() {
    await this.getTextWhatsapp();
  },
};
</script>

<style></style>
