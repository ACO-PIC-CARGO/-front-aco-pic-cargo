<template>
  <v-row class="my-2 frmConfigEmpresa">
    <v-col cols="12">
      <center>
        <p class="text-azul">1. CONFIGURA TU EMPRESA</p>
      </center>
    </v-col>
    <v-col cols="12">
      <v-text-field
        variant="outlined"
        label="Nombre de la empresa *"
        hide-details
        density="compact"
        v-model="$store.state.configEmpresa.datoEmpresa.trade_name"
        class="mayuscula"
      ></v-text-field>
    </v-col>
    <v-col cols="12">
      <v-file-input
        ref="fileInput"
        variant="outlined"
        accept="image/png, image/jpeg, image/bmp"
        placeholder="Subir tu logo te ayudará a personalizar tus documentos"
        append-inner-icon="mdi-camera"
        hide-details
        prepend-icon=""
        density="compact"
        v-model="$store.state.configEmpresa.datoEmpresa.img"
        @update:model-value="cargarLogo()"
        @click:append-inner.stop="abrirSelector"
      ></v-file-input>
    </v-col>
    <v-col cols="12">
      <CboPais
        @paisSeleccionado="
          $store.state.configEmpresa.datoEmpresa.id_pais = $event
        "
        :outlined="true"
        :dense="true"
        :hideDetails="true"
        :newId="$store.state.configEmpresa.datoEmpresa.id_pais"
      />
    </v-col>

    <v-col cols="12" lg="8" xl="4">
      <v-autocomplete
        label="Impuestos a las Ventas en tu País"
        :items="$store.state.masterusuarios.lstImpRenta"
        item-value="id"
        item-title="descripcion"
        variant="outlined"
        density="compact"
        :error-messages="errorImp"
        :hide-details="!errorImp"
        v-model="$store.state.configEmpresa.datoEmpresa.tipoimpuesto"
        @update:model-value="errorImp = ''"
        placeholder="Indicanos el Nombre"
        persistent-placeholder
      >
        <template v-slot:selection="data">
          <span v-if="data.item">{{ data.item.codigo }}</span>
        </template>
      </v-autocomplete>
    </v-col>
    <v-col cols="12" lg="4" xl="4">
      <v-text-field
        type="number"
        label="Porcentaje"
        step="0.1"
        suffix="%"
        variant="outlined"
        density="compact"
        hide-details
        v-model="$store.state.configEmpresa.datoEmpresa.impuesto"
      ></v-text-field>
    </v-col>
    <v-col cols="12">
      <p class="my-0 py-0" style="color: red" v-if="mostrarImpOtro()">
        <strong> Nota:</strong> Seleccione esta opción si el impuesto a las
        ventas que necesitas no aparece en la lista
      </p>
      <p
        class="my-0 py-0"
        style="background: #58cced; padding: 5%"
      >
        <strong> Nota:</strong> Esto calculará automáticamente el costo del
        servicio en las ofertas para tus clientes, así como tus propios costos
        operativos y administrativos.
      </p>
    </v-col>

    <v-col cols="12" class="py-0">
      Deseas que Aplique al Calculo de Impuestos de Aduana para tu clientes
      <v-radio-group
        v-model="$store.state.configEmpresa.datoEmpresa.usarclientes"
        inline
      >
        <v-radio label="Si" :value="true" />
        <v-radio label="No" :value="false" />
      </v-radio-group>
      <!-- <v-checkbox
        label="Deseas que Aplique al Calculo de Impuestos de Aduana para tu clientes"
        v-model="$store.state.configEmpresa.datoEmpresa.usarclientes"
        dense
      /> -->
    </v-col>
    <v-col cols="12" class="py-0">
      Deseas que aplique este para tus costos opertivos y administrativos
      <v-radio-group
        v-model="$store.state.configEmpresa.datoEmpresa.usaropadmin"
        inline
      >
        <v-radio label="Si" :value="true" />
        <v-radio label="No" :value="false" />
      </v-radio-group>
      <!-- <v-checkbox
        label=""
        v-model="$store.state.configEmpresa.datoEmpresa.usaropadmin"
        dense
      /> -->
    </v-col>
    <v-col cols="12">
      <v-text-field
        variant="outlined"
        label="Dirección fiscal (Opcional)"
        hide-details
        density="compact"
        v-model="$store.state.configEmpresa.datoEmpresa.address"
      ></v-text-field>
    </v-col>
    <v-col cols="12">
      <p>
        <b>Administrador del Sistema</b>
      </p>
      <p>
        <b>Nombre:</b> {{ $store.state.configEmpresa.dataUsuario.names }}
        {{ $store.state.configEmpresa.dataUsuario.surname }}
        {{ $store.state.configEmpresa.dataUsuario.second_surname }}
      </p>
      <p><b>Teléfono:</b> {{ $store.state.configEmpresa.dataUsuario.phone }}</p>
      <p><b>Email:</b> {{ $store.state.configEmpresa.dataUsuario.email }}</p>
    </v-col>
    <v-col cols="12" style="align-items: center; text-align: center">
      <v-btn class="mx-10" color="#7E7E7E" @click="$emit('omitir')">
        Omitir
      </v-btn>
      <v-btn class="mx-10" color="#1A237E" @click="guardarEmpresa()">
        Guardar y Continuar
      </v-btn>
    </v-col>
  </v-row>
</template>

<script>
import { mapActions } from "vuex";
import CboPais from "@/components/comun/CboPais.vue";
export default {
  components: {
    CboPais,
  },
  emits: ["omitir", "GuardarDatosEmpresa"],
  data() {
    return { datosEmpresa: { id_pais: null }, errorImp: "" };
  },
  watch: {
    "$store.state.configEmpresa.datoEmpresa.impuesto"(newValue) {
      if (newValue === undefined || newValue === null) {
        this.$store.state.configEmpresa.datoEmpresa.impuesto = 0;
      }
    },
  },
  methods: {
    ...mapActions([
      "actualizarDatoEmpresa",
      "_uploadFile",
      "cargarImpuestoRenta",
    ]),
    guardarEmpresa() {
      this.errorImp = "";
      if (!this.$store.state.configEmpresa.datoEmpresa.tipoimpuesto) {
        this.errorImp = "Dato Requerido";
        return false;
      }
      this.$emit("GuardarDatosEmpresa");
    },
    abrirSelector() {
      this.$refs.fileInput.$el.querySelector('input[type="file"]').click();
    },
    async cargarLogo() {
      await this._uploadFile(this.$store.state.configEmpresa.datoEmpresa.img);
      this.$store.state.configEmpresa.datoEmpresa.id_logo =
        this.$store.state.files.datosPath.insertid;
      this.$store.state.configEmpresa.datoEmpresa.logo =
        this.$store.state.files.datosPath.ruta;
      // console.log(this.$store.state.configEmpresa.datoEmpresa);
    },
    mostrarImpOtro() {
      if (this.$store.state.configEmpresa.datoEmpresa.tipoimpuesto) {
        let cod = this.$store.state.masterusuarios.lstImpRenta.filter(
          (v) =>
            v.id == this.$store.state.configEmpresa.datoEmpresa.tipoimpuesto
        )[0].codigo01;
        return cod == "9";
      }
      return false;
    },
  },
  async mounted() {
    await this.cargarImpuestoRenta();
    this.$store.state.configEmpresa.datoEmpresa = JSON.parse(
      sessionStorage.getItem("dataBranch")
    )[0];
    this.$store.state.configEmpresa.dataUsuario = JSON.parse(
      sessionStorage.getItem("dataUser")
    )[0];
  },
};
</script>

<style scoped>
.frmConfigEmpresa {
  margin: 0 30% !important;
}
.text-azul {
  /* background: red; */
  color: #4256be !important;
  font-size: 1.5rem;
  font-weight: bold;
}
.mayuscula {
  text-transform: uppercase !important;
}
@media (max-width: 1000px) {
  .frmConfigEmpresa {
    margin: 0 2% !important;
  }
}
</style>
