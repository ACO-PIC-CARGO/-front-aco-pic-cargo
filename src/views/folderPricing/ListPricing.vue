<template>
  <v-container fluid>
    <v-card>
      <v-card-title primary-title class="">
        <v-row>
          DASHBOARD: <v-spacer></v-spacer>
          <v-col
            cols="12"
            lg="2"
            xl="2"
            class="ocultarMovil"
            v-for="(item, index) in $store.state.pricing.listadoResumen"
            :key="index"
          >
            <v-chip
              small
              style="cursor: pointer"
              :color="item.color"
              @click="filtrarCotizaciones(item)"
            >
              {{ item.nombre_estado }}
              Total: {{ item.cantidad }}
            </v-chip>
          </v-col>

          <v-spacer></v-spacer>
          <v-btn color="success" @click="redirect()" small class="ml-auto">
            NUEVA COTIZACIÓN
          </v-btn>
        </v-row>
      </v-card-title>
      <v-row>
        <v-col cols="12">
          <v-tabs color="deep-purple accent-4" right v-model="tabs">
            <v-tab href="#quotes">Cotizaciones</v-tab>
            <v-tab href="#calls">Llamadas</v-tab>
          </v-tabs>
          <v-tabs-items v-model="tabs">
            <v-tab-item value="quotes">
              <ListQuote />
            </v-tab-item>
            <v-tab-item value="calls">
              <ListCall />
            </v-tab-item>
          </v-tabs-items>
        </v-col>
      </v-row>
    </v-card>
    <v-navigation-drawer
      v-model="$store.state.pricing.filtrarQuoteFlag"
      right
      absolute
      bottom
      persistent
      width="20%"
      temporary
    >
      <v-card elevation="10">
        <FiltroQuote />
      </v-card>
    </v-navigation-drawer>
    <v-navigation-drawer
      v-model="$store.state.pricing.filtrarCallsFlag"
      right
      absolute
      bottom
      persistent
      width="20%"
      temporary
    >
      <v-card elevation="10">
        <FiltroCalls />
      </v-card>
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
import { mapActions } from "vuex";

export default {
  name: "ListPricingView",
  components: {
    ListQuote: () =>
      import("@/components/folderPricing/listQuoteComponent.vue"),
    ListCall: () => import("@/components/folderPricing/listCallComponent.vue"),
    FiltroQuote: () => import("@/components/filtros/FiltroQuote.vue"),
    FiltroCalls: () => import("@/components/filtros/FiltroCalls"),
    ConfigCotizacion: () =>
      import("@/components/folderPricing/ConfigCotizacion"),

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
    ]),
    redirect() {
      this.$nextTick(() => {
        this.$router.push({
          name: "newQuote",
        });
      });
    },
    async filtrarCotizaciones(item) {
      this.$store.state.spiner = true;
      
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
