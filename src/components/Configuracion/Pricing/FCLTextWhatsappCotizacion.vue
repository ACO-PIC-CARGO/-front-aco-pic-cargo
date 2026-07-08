<template>
  <v-container>
    <v-row v-for="(text, index) in listadoTextoFCL" :key="index" class="py-1">
      <v-col cols="12">
        <div class="d-flex align-center my-2">
          <v-divider></v-divider>
          <span
            class="mx-3 grey--text"
            style="font-size: 1.2em; font-weight: bold"
          >
            {{ text.name }}
          </span>
          <v-divider></v-divider>
        </div>
      </v-col>

      <v-col cols="12" md="6" class="py-1">
        <p style="font-size: 1.2em; font-weight: bold">
          Texto para envío de PDF - {{ text.name }}
        </p>
        <vTextarea
          v-model="text.texto.pdf"
          :label="`Texto para envío de PDF - ${text.name}`"
          auto-grow
          outlined
          hide-details
        >
          <template #label>
            <span> </span>
          </template>
        </vTextarea>
      </v-col>
      <v-col cols="12" md="6" class="py-1">
        <p style="font-size: 1.2em; font-weight: bold">
          Texto para envío de Link de Descarga - {{ text.name }}
        </p>
        <vTextarea
          v-model="text.texto.link"
          :label="`Texto para envío de Link de Descarga - ${text.name}`"
          auto-grow
          outlined
          hide-details
        >
          <template #label>
            <span> </span>
          </template>
        </vTextarea>
      </v-col>
    </v-row>
    <v-row>
      <v-col cols="12" class="d-flex justify-end">
        <v-btn color="success" @click="guardar">Guardar</v-btn>
      </v-col>
    </v-row>
  </v-container>
</template>

<script>
import { mapActions, mapState } from "vuex";

export default {
  data() {
    return {
      textoWhasappFCL: [],
    };
  },
  mounted() {},
  methods: {
    ...mapActions("configuracion", ["setTextoWhatsappFCL"]),
    guardar() {
      // Lógica para guardar los textos
      this.setTextoWhatsappFCL({
        fcl: this.listadoTextoFCL,
      });
    },
  },
  computed: {
    ...mapState(["itemsContainers"]),
    ...mapState("configuracion", ["fcl"]),
    listadoTextoFCL() {
      if (Object.keys(this.fcl).length > 0) {
        return this.itemsContainers.map((container) => ({
          id_container: container.id,
          name: container.name,
          texto: this.fcl.some((v) => v.id_container == container.id)
            ? this.fcl.find((v) => v.id_container == container.id).texto
            : {
                pdf: "",
                link: "",
              },
        }));
      } else {
        return this.itemsContainers.map((container) => ({
          id_container: container.id,
          name: container.name,
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
