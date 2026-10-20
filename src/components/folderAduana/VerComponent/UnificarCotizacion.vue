<template>
  <v-container fluid>
    <v-row>
      <v-col cols="12" class="py-2">
        Unificar Cotización asociada a:
        {{ aduanaStore.datosPrincipales.nombre }}
      </v-col>
      <v-col cols="2" class="py-0">
        <v-select
          density="compact"
          variant="outlined"
          label="Cotización"
          :items="aduanaStore.listQuotes"
          v-model="id_quote"
          item-title="quote"
          item-value="id"
          clearable
          hide-details
        ></v-select>
      </v-col>
    </v-row>
    <v-row>
      <v-col cols="12" class="py-2">
        <v-btn color="success" @click="unificar()" :disabled="unificarflag"
          >Unificar</v-btn
        >
      </v-col>
      <v-col v-if="unificarflag" cols="6">
        <v-alert density="compact" variant="outlined" type="error">
          Recuerde que solo se puede unificar, cotizaciones que solo tengan una
          opción activa.
        </v-alert>
      </v-col>
    </v-row>
  </v-container>
</template>

<script>
import Swal from "sweetalert2";
import { mapActions as mapPiniaActions, mapStores } from "pinia";
import { useAduanaStore } from "@/stores/aduana";
export default {
  data() {
    return {
      id_quote: "",
    };
  },
  methods: {
    ...mapPiniaActions(useAduanaStore, ["unificarQuoteAduana"]),
    async unificar() {
      let data = {
        id_quote: this.id_quote,
        id_aduana: this.$route.params.id,
      };
      await this.unificarQuoteAduana(data);
      if (this.aduanaStore.nro_quote) {
        Swal.fire({
          icon: "success",
          title: "Aviso",
          text: this.aduanaStore.mensaje,
          confirmButtonText: "Ir a la cotización",
          showConfirmButton: true,
        }).then((result) => {
          if (result.isConfirmed) {
            this.$router.push({
              name: "verQuote",
              params: {
                id: this.aduanaStore.IdQuote,
              },
            });
          }
          if (result.isDismissed) {
            this.$router.push({
              name: "lstQuote",
            });
          }
        });
        this.$store.state.spiner = false;
        let vm = this;
      }
    },
  },
  computed: {
    ...mapStores(useAduanaStore),
    unificarflag() {
      if (
        this.aduanaStore.opcionCostos.filter((v) => v.selected)
          .length == 1
      ) {
        return false;
      }
      return true;
    },
  },
};
</script>

<style></style>
