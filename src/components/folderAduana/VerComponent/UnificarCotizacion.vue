<script setup lang="ts">
import { computed, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useAppStore } from "@/stores/app";
import Swal from "sweetalert2";
import { useAduanaStore } from "@/stores/aduana";

const route = useRoute();
const router = useRouter();
const appStore = useAppStore();
const aduanaStore = useAduanaStore();

const id_quote = ref("");

const unificarflag = computed(() => {
  if (
    aduanaStore.opcionCostos.filter((v) => v.selected)
      .length == 1
  ) {
    return false;
  }
  return true;
});

async function unificar() {
  const data = {
    id_quote: id_quote.value,
    id_aduana: route.params.id,
  };
  await aduanaStore.unificarQuoteAduana(data);
  if (aduanaStore.nro_quote) {
    Swal.fire({
      icon: "success",
      title: "Aviso",
      text: aduanaStore.mensaje,
      confirmButtonText: "Ir a la cotización",
      showConfirmButton: true,
    }).then((result) => {
      if (result.isConfirmed) {
        router.push({
          name: "verQuote",
          params: {
            id: aduanaStore.IdQuote,
          },
        });
      }
      if (result.isDismissed) {
        router.push({
          name: "lstQuote",
        });
      }
    });
    appStore.spiner = false;
  }
}
</script>

<template>
  <v-container fluid>
    <v-row>
      <v-col
        cols="12"
        class="py-2"
      >
        Unificar Cotización asociada a:
        {{ aduanaStore.datosPrincipales.nombre }}
      </v-col>
      <v-col
        cols="2"
        class="py-0"
      >
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
        />
      </v-col>
    </v-row>
    <v-row>
      <v-col
        cols="12"
        class="py-2"
      >
        <v-btn
          color="success"
          @click="unificar()"
          :disabled="unificarflag"
        >
          Unificar
        </v-btn>
      </v-col>
      <v-col
        v-if="unificarflag"
        cols="6"
      >
        <v-alert
          density="compact"
          variant="outlined"
          type="error"
        >
          Recuerde que solo se puede unificar, cotizaciones que solo tengan una
          opción activa.
        </v-alert>
      </v-col>
    </v-row>
  </v-container>
</template>

<style></style>
