<template>
  <v-container fluid>
    <v-card>
      <v-card-title class="d-flex align-center flex-wrap">
        <!-- DASHBOARD
        <v-chip
          style="cursor: pointer"
          class="mx-1 my-0"
          :color="item.color"
          v-for="(item, index) in $store.state.pricing.listadoResumen"
          :key="index"
          @click="filtrarCotizaciones(item)"
        >
          {{ item.nombre_estado }}
          Total: {{ item.cantidad }}
        </v-chip> -->

        <v-spacer></v-spacer>
        <v-btn color="success" @click="redirect()" size="small" class="ml-auto">
          NUEVA COTIZACIÓN
        </v-btn>
      </v-card-title>
      <v-row>
        <v-col cols="12">
          <v-tabs color="deep-purple-accent-4" align-tabs="end" v-model="tabs">
            <v-tab value="quotes">Cotizaciones</v-tab>
            <v-tab value="calls">Llamadas</v-tab>
          </v-tabs>
          <v-tabs-window v-model="tabs">
            <v-tabs-window-item value="quotes">
              <ListQuote />
            </v-tabs-window-item>
            <v-tabs-window-item value="calls">
              <ListCall />
            </v-tabs-window-item>
          </v-tabs-window>
        </v-col>
      </v-row>
    </v-card>
    <v-navigation-drawer
      v-model="$store.state.pricing.filtrarQuoteFlag"
      location="right"
      
      width="20%"
      temporary
    >
      <!-- <v-card elevation="10">
        <FiltroQuote />
      </v-card> -->
    </v-navigation-drawer>
    <v-navigation-drawer
      v-model="$store.state.pricing.filtrarCallsFlag"
      location="right"
      
      width="20%"
      temporary
    >
      <!-- <v-card elevation="10">
        <FiltroCalls />
      </v-card> -->
    </v-navigation-drawer>
    <v-dialog
      v-model="dialog"
      persistent
      max-width="30%"
      transition="dialog-transition"
    >
      <v-card>
        <ConfigCotizacion />
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn class="mx-1" color="success" @click="guardarConfig()">
            Guardar
          </v-btn>
          <!-- <v-btn class="mx-1" color="error">Cancelar</v-btn> -->
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script>
import { defineAsyncComponent } from "vue";
import { mapActions } from "vuex";

export default {
  name: "ListPricingView",
  components: {
    ListQuote: defineAsyncComponent(() =>
      import("@/components/folderAduana/listAduanaComponent.vue")),
    ListCall: defineAsyncComponent(() => import("@/components/folderAduana/listCallComponent.vue")),
    // FiltroQuote: () => import("@/components/filtros/FiltroQuote.vue"),
    // FiltroCalls: () => import("@/components/filtros/FiltroCalls.vue"),
    ConfigCotizacion: defineAsyncComponent(() =>
      import("@/components/folderPricing/ConfigCotizacion.vue")),

    // ListCall: () => import("../folderPricing/comun/listCall.vue"),
  },
  data() {
    return {
      tabs: "quotes",
      dialog: false,
    };
  },
  mounted() {
    this.$store.state.drawer = false;
    this.$store.state.pricing.e1 = 1;
    let val = JSON.parse(sessionStorage.getItem("ConfigEmpresa"));
    this.dialog = !val.existecot;
    this.getResumenPorEstado();
  },
  methods: {
    ...mapActions([
      "GuardarConfiguracionEmpresa",
      "ObtenerDatosConfig",
      "getResumenPorEstado",
      "getListQuoteAduana",
    ]),
    redirect() {
      this.$nextTick(() => {
        this.$router.push({
          name: "newCotizacionAduana",
        });
      });
    },
    async filtrarCotizaciones(item) {
      this.$store.state.spiner = true;
      this.$store.state.pricing.filtro = {
        id_marketing: "",
        id_status: item.id,
        id_entities: "",
        id_modality: "",
        id_shipment: "",
        id_incoterm: "",
        fechainicio: "",
        fechafin: "",
        estado: "activo",
      };
      // await this.getListQuoteAduana();
      this.$store.state.spiner = false;
    },
    async guardarConfig() {
      await this.GuardarConfiguracionEmpresa();
      await this.ObtenerDatosConfig();
      this.dialog = false;
    },
  },
};
</script>

<style></style>
