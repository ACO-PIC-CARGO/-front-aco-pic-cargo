<script setup lang="ts">
import { computed, nextTick, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useStore } from "vuex";
import Swal from "sweetalert2";
import { usePricingStore } from "@/stores/pricing";
import { useAduanaStore } from "@/stores/aduana";

const route = useRoute();
const router = useRouter();
const rootStore = useStore();
const aduanaStore = useAduanaStore();
const pricingStore = usePricingStore();

const id_quote = ref("");

const unificarflag = computed(() => {
  const codeServide = [10, 13, 6, 14];
  if (
    pricingStore.listServices.some(
      (v) =>
        codeServide.includes(v.codegroupservices as number) &&
        (v.status == 1 || v.status == true),
    )
  ) {
    return true;
  }

  if (pricingStore.opcionCostos.filter((v) => v.selected).length == 1) {
    return false;
  }

  return true;
});

async function unificar() {
  const data = {
    id_quote: route.params.id,
    id_aduana: id_quote.value,
  };
  await aduanaStore.unificarQuoteAduana(data);
  if (aduanaStore.nro_quote) {
    Swal.fire({
      icon: "success",
      title: "Aviso",
      text: aduanaStore.mensaje,
      confirmButtonText: "Ir a la cotización",
      showConfirmButton: true,
    }).then(async (result) => {
      if (result.isConfirmed) {
        await router.push({
          name: "verQuote",
          params: {
            id: aduanaStore.IdQuote,
          },
        });
        nextTick(() => {
          window.location.reload();
        });
      }
      if (result.isDismissed) {
        router.push({
          name: "lstQuote",
        });
      }
    });
    rootStore.state.spiner = false;
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
        cols="12"
        lg="2"
        xl="2"
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
          opción activa. O tengas los servicios Aduanas desactivados
        </v-alert>
      </v-col>
    </v-row>
  </v-container>
</template>

<style></style>
