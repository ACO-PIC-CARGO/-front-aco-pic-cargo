<template>
  <v-container>
    <v-container v-if="loading_as" style="height: 400px">
      <v-row class="fill-height align-content-center justify-center">
        <v-col class="text-subtitle-1 text-center" cols="6">
          Cargando información ....
        </v-col>
        <v-col cols="6">
          <v-progress-linear
            color="deep-purple-accent-4"
            indeterminate
            rounded
            height="6"
          ></v-progress-linear>
        </v-col>
      </v-row>
    </v-container>

    <v-card class="py-10 px-10">
      <v-card-title class="d-flex align-center flex-wrap" v-if="!loading_as">
        Ver: {{ $store.state.enterprises.record.business_name }}
        <v-spacer></v-spacer>

        <v-card-text class="px-0">
          <v-row>
            <v-col cols="6">
              <v-text-field
                label="Tipo de Documento"
                readonly
                density="compact"
                :model-value="$store.state.enterprises.record.td_name"
              ></v-text-field>
            </v-col>
            <v-col cols="6">
              <v-text-field
                label="N° de Documento"
                readonly
                density="compact"
                :model-value="$store.state.enterprises.record.document"
              ></v-text-field>
            </v-col>
            <v-col cols="6">
              <v-text-field
                label="Nombre Comercial"
                readonly
                density="compact"
                :model-value="$store.state.enterprises.record.trade_name"
              ></v-text-field>
            </v-col>
            <v-col cols="6">
              <v-text-field
                label="Nombre Negocio"
                readonly
                density="compact"
                :model-value="$store.state.enterprises.record.business_name"
              ></v-text-field>
            </v-col>
            <v-col cols="6">
              <v-text-field
                label="Slogan"
                readonly
                density="compact"
                :model-value="$store.state.enterprises.record.slogan"
              ></v-text-field>
            </v-col>
            <v-col cols="6">
              <v-text-field
                label="IC"
                readonly
                density="compact"
                :model-value="$store.state.enterprises.record.ic"
              ></v-text-field>
            </v-col>
            <v-col cols="6">
              <v-text-field
                label="Logo"
                readonly
                density="compact"
                :model-value="$store.state.enterprises.record.name_file"
              ></v-text-field>
              <!-- <div>
                <label for="image">Logo</label>
                <v-img
                    v-if="$store.state.enterprises.record.path"
                    :src="$store.state.enterprises.record.path"
                    height="200">
                </v-img>
              </div> -->
            </v-col>
            <v-col cols="6">
              <v-text-field
                label="País"
                readonly
                density="compact"
                :model-value="$store.state.enterprises.record.lp_name"
              ></v-text-field>
            </v-col>
            <v-col cols="6">
              <v-text-field
                label="Región"
                readonly
                density="compact"
                :model-value="$store.state.enterprises.record.ls_name"
              ></v-text-field>
            </v-col>
            <v-col cols="6">
              <v-text-field
                label="Provincia"
                readonly
                density="compact"
                :model-value="$store.state.enterprises.record.lc_name"
              ></v-text-field>
            </v-col>
            <v-col cols="6">
              <v-text-field
                label="Distrito"
                readonly
                density="compact"
                :model-value="$store.state.enterprises.record.lt_name"
              ></v-text-field>
            </v-col>
            <v-col cols="6">
              <v-text-field
                label="Dirección"
                readonly
                density="compact"
                :model-value="$store.state.enterprises.record.address"
              ></v-text-field>
            </v-col>
            <v-col cols="6">
              <v-text-field
                label="Estado"
                readonly
                density="compact"
                :model-value="
                  $store.state.enterprises.record.status == 1
                    ? 'Activo'
                    : 'Inactivo'
                "
              ></v-text-field>
            </v-col>
            <v-col cols="6">
              <v-autocomplete
                label="Impuestos a las Ventas en tu País"
                :items="$store.state.masterusuarios.lstImpRenta"
                item-value="id"
                item-title="descripcion"
                readonly
                density="compact"
                v-model="$store.state.enterprises.record.tipoimpuesto"
              >
                <template v-slot:selection="data">
                  <span v-if="data.item">{{ data.item.codigo }}</span>
                </template>
              </v-autocomplete>
            </v-col>
            <v-col cols="6">
              <v-text-field
                type="number"
                label="Porcentaje"
                step="0.1"
                suffix="%"
                readonly
                density="compact"
                hide-details
                v-model="$store.state.enterprises.record.impuesto"
              ></v-text-field>
            </v-col>
          </v-row>
        </v-card-text>
      </v-card-title>
      <v-card-actions v-if="!loading_as" class="justify-end mt-3">
        <v-btn size="small" class="mx-1" color="red" @click="volver()" rounded>
          Aceptar</v-btn
        >
      </v-card-actions>
    </v-card>
  </v-container>
</template>

<script>
import { mapState, mapActions } from "vuex";
export default {
  name: "ReadEnterpriseComponent",
  data() {
    return {
      loading_as: true,
    };
  },
  async mounted() {
    await this.cargarImpuestoRenta();
    await this.readEnterprise(this.$route.params.id);
  },
  methods: {
    ...mapActions(["readEnterprise", "cargarImpuestoRenta"]),
    volver() {
      this.$router.go(-1);
    },
  },
  watch: {
    "$store.state.enterprises.record": {
      handler(newRecord, oldRecord) {
        if (newRecord && Object.keys(newRecord).length > 0) {
          this.loading_as = false;
        }
      },
      immediate: true,
    },
  },
  computed: {
    ...mapState(["record"]),
  },
};
</script>
