<template>
  <v-container fluid>
    <v-form ref="frmDatos">
      <v-row>
        <v-col cols="12" md="2">
          <v-autocomplete
            label="Sentido"
            outlined
            dense
            :rules="[(v) => !!v || 'Dato requerido']"
            class="my-0"
            :items="$store.state.pricing.listModality"
            item-text="name"
            item-key="id"
            item-value="id"
            v-model="$store.state.profitPricing.id_modality"
          ></v-autocomplete>
        </v-col>

        <v-col cols="12" md="2">
          <v-autocomplete
            label="Tipo de Embarque"
            outlined
            dense
            :rules="[(v) => !!v || 'Dato requerido']"
            class="my-0"
            :items="$store.state.pricing.listShipment"
            item-text="embarque"
            item-key="id"
            item-value="id"
            v-model="$store.state.profitPricing.id_shipment"
          ></v-autocomplete>
        </v-col>
        <v-col cols="12" md="2">
          <v-autocomplete
            label="Incoterms"
            outlined
            dense
            :rules="[(v) => !!v || 'Dato requerido']"
            class="my-0"
            :items="incoterms"
            item-text="text"
            item-key="id"
            item-value="id"
            v-model="$store.state.profitPricing.id_incoterms"
          >
            <template slot="selection" slot-scope="data">
              {{ data.item.name }}
            </template>
          </v-autocomplete>
        </v-col>
        <v-col cols="12" md="2" class="d-flex">
          <v-btn class="mx-1" color="info" @click="cargarDatos()"
            >Obtener Ganancias</v-btn
          >
          <v-btn class="mx-1" color="success"> Añadir Concepto </v-btn>
          <v-btn class="mx-1" color="warning" style="color: #000000">
            Actualizar Registros
          </v-btn>
        </v-col>

        <v-col cols="12" icons-and-text>
          <template>
            <v-tabs centered v-model="tab">
              <v-tab>
                Individual
                <v-icon class="mx-1">mdi-account</v-icon>
              </v-tab>
              <v-tab>
                Grupal
                <v-icon class="mx-1">mdi-account-group</v-icon>
              </v-tab>
            </v-tabs>

            <v-tabs-items v-model="tab">
              <v-tab-item>
                <v-data-table :headers="headers" :items="items" item-key="id">
                </v-data-table>
              </v-tab-item>
              <v-tab-item>
                <v-data-table :headers="headers" :items="items" item-key="id">
                </v-data-table>
              </v-tab-item>
            </v-tabs-items>
          </template>
        </v-col>
      </v-row>
    </v-form>
  </v-container>
</template>

<script>
import { mapActions, mapState } from "vuex";

export default {
  data() {
    return {
      tab: 0,
      headers: [
        { value: "concepto", text: "Concepto" },
        { value: "profit", text: "Ganancia" },
      ],
      items: [],
    };
  },
  computed: {
    incoterms() {
      let Icoterms = [];
      [...this.$store.state.pricing.listIncoterms].forEach((element) => {
        element.text = element.name + " - " + element.description;
        Icoterms.push(element);
      });

      return Icoterms;
    },
  },
  methods: {
    ...mapActions("profitPricing", ["getProfitPricing"]),
    async cargarDatos() {
      if (this.$refs.frmDatos.validate()) {
        await this.getProfitPricing();
      }
    },
  },
};
</script>

<style></style>
