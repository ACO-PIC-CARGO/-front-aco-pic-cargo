<template>
  <v-container fluid>
    <v-row v-for="(text, index) in listadoTextoFCL" :key="index" class="py-1">
      <v-col cols="12">
        <div class="d-flex align-center my-2">
          <v-divider></v-divider>
          <span
            class="mx-3 text-grey"
            style="font-size: 1.2em; font-weight: bold"
          >
            {{ text.name }}
          </span>
          <v-divider></v-divider>
        </div>
      </v-col>

      <v-col cols="12" md="6" class="py-1">
        <vTextarea
          v-model="text.texto.pdfindividual"
         
          auto-grow
          variant="outlined"
          hide-details
        >
          <template #label>
            <span> Texto para envío de PDF | {{ text.code }} | INDIVIDUAL </span>
          </template>
        </vTextarea>
      </v-col>
      <v-col cols="12" md="6" class="py-1">
        <vTextarea
          v-model="text.texto.pdfgrupal"
         
          auto-grow
          variant="outlined"
          hide-details
        >
          <template #label>
            <span> Texto para envío de PDF | {{ text.code }} | GRUPAL </span>
          </template>
        </vTextarea>
      </v-col>
      <!-- <v-col cols="12" md="3" class="py-1">
        <vTextarea
          v-model="text.texto.linkindividual"
          auto-grow
          outlined
          hide-details
        >
          <template #label>
            <span> Texto para envío de LINK | {{ text.code }} | INDIVIDUAL </span>
          </template>
        </vTextarea>
      </v-col>
      <v-col cols="12" md="3" class="py-1">
        <vTextarea
          v-model="text.texto.linkgrupal"
          auto-grow
          outlined
          hide-details
        >
          <template #label>
            <span>
              <span> Texto para envío de LINK | {{ text.code }} | GRUPAL </span>
            </span>
          </template>
        </vTextarea>
      </v-col> -->
    </v-row>
    <v-row>
      <v-col cols="12" class="d-flex justify-end">
        <v-btn color="success" @click="guardar" :loading="loading">
          Guardar
        </v-btn>
      </v-col>
    </v-row>
  </v-container>
</template>

<script>
import { mapState } from "vuex";
import { mapActions as mapPiniaActions, mapState as mapPiniaState } from "pinia";
import { useConfiguracionStore } from "@/stores/configuracion";

export default {
  data() {
    return {
      textoWhasappFCL: [],
      loading: false,
    };
  },
  mounted() {},
  methods: {
    ...mapPiniaActions(useConfiguracionStore, ["setTextoWhatsappFCL"]),
    async guardar() {
      this.loading = true;
      await this.setTextoWhatsappFCL({
        fcl: this.listadoTextoFCL,
      });
      this.loading = false;
    },
  },
  computed: {
    ...mapState(["itemsContainers"]),
    ...mapPiniaState(useConfiguracionStore, ["fcl"]),
    listadoTextoFCL() {
      if (Object.keys(this.fcl).length > 0) {
        return this.itemsContainers.map((container) => ({
          id_container: container.id,
          name: container.name,
          texto: this.fcl.some((v) => v.id_container == container.id)
            ? this.fcl.find((v) => v.id_container == container.id).texto
            : {
                pdfindividual: "",
                pdfgrupal: "",
                linkindividual: "",
                linkgrupal: "",
              },
        }));
      } else {
        return this.itemsContainers.map((container) => ({
          ...container,
          id_container: container.id,
          texto: {
            pdf: "",
            link: "",
          },
        }));
      }
    },
  },
};
</script>

<style></style>
