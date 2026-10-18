<template>
  <v-card>
    <v-tabs v-model="tab" slider-color="primary" align-tabs="center">
      <v-tab value="lcl">
        <span style="font-size: 1.3em; font-weight: bold">LCL</span>
      </v-tab>
      <v-tab value="fcl">
        <span style="font-size: 1.3em; font-weight: bold">FCL</span>
      </v-tab>
    </v-tabs>

    <v-tabs-window v-model="tab">
      <v-tabs-window-item value="lcl" class="px-10">
        <LCLTextWhatsappCotizacion />
      </v-tabs-window-item>
      <v-tabs-window-item value="fcl" class="px-10">
        <FCLTextWhatsappCotizacion />
      </v-tabs-window-item>
    </v-tabs-window>
  </v-card>
</template>

<script>
import { defineAsyncComponent } from "vue";
import { mapActions } from "vuex";

export default {
  components: {
    LCLTextWhatsappCotizacion: defineAsyncComponent(() =>
      import(
        "@/components/Configuracion/Pricing/LCLTextWhatsappCotizacion.vue"
      )),
    FCLTextWhatsappCotizacion: defineAsyncComponent(() =>
      import(
        "@/components/Configuracion/Pricing/FCLTextWhatsappCotizacion.vue"
      )),
  },
  data() {
    return {
      tab: "lcl",
    };
  },
  methods: {
    ...mapActions("configuracion", ["getTextWhatsapp"]),
    ...mapActions(["_getContainers"]),
  },
  async mounted() {
    Promise.all([this.getTextWhatsapp(), this._getContainers()]).catch(
      (error) => {
        console.error("Error al cargar los datos:", error);
      },
    );
    this.$store.state.mainTitle =
      "Actualizar Texto Para Envío de Cotización por WSP";
  },
  computed: {},
};
</script>

<style></style>
