<template>
  <v-card>
    <v-card-title class="d-flex align-center flex-wrap" primary-title>
      {{ getName() }}
      <v-spacer></v-spacer>
      <v-btn variant="text"
        icon
        color="default"
        @click="$store.state.user.drawer = !$store.state.user.drawer"
      >
        <v-icon>mdi-close</v-icon>
      </v-btn>
    </v-card-title>
    <v-form ref="frmDML">
      <v-card-text>
        <div class="col-12 py-1">
          <v-autocomplete
            label="Tipo Documento"
            :items="$store.state.itemsDocumentsPais"
            v-model="$store.state.user.filtros.id_document"
            item-title="name"
            item-value="id"
            clearable
          >
          </v-autocomplete>
        </div>

        <div class="col-12 py-1">
          <v-text-field
            v-model="$store.state.user.filtros.document"
            label="Nro Documento"
            clearable
          ></v-text-field>
        </div>
        <div class="col-12 py-1">
          <v-text-field
            v-model="$store.state.user.filtros.users"
            label="Nombre de usuario"
            clearable
          ></v-text-field>
        </div>
        <div class="col-12 py-1">
          <v-text-field
            v-model="$store.state.user.filtros.nombrecompleto"
            label="Nombre Completo"
            clearable
          ></v-text-field>
        </div>
        <div class="col-12 py-1">
          <v-text-field
            v-model="$store.state.user.filtros.phone"
            label="Teléfono"
            :clearable="$store.state.user.tipo != 'ver'"
          ></v-text-field>
        </div>
        <div class="col-12 py-1">
          <v-text-field
            v-model="$store.state.user.filtros.email"
            label="Email"
          ></v-text-field>
        </div>
        <div class="col-12 py-1">
          <span> Estado</span>
          <v-radio-group v-model="$store.state.user.filtros.status" inline density="compact">
            <v-radio label="Activo" color="green" value="1"></v-radio>
            <v-radio label="Inactivo" color="red" value="0"></v-radio>
            <v-radio label="Todos" color="blue" value="null"></v-radio>
          </v-radio-group>
        </div>
      </v-card-text>
    </v-form>

    <v-card-actions>
      <v-spacer></v-spacer>
      <v-btn
        class="mx-1"
        color="success"
        v-if="$store.state.user.tipo == 'filter'"
        @click="Filtrar()"
        :loading="loading"
        >Aceptar</v-btn
      >
      <v-btn
        class="mx-1"
        color="default"
        v-if="$store.state.user.tipo == 'filter'"
        @click="Limpiar()"
        :loading="loading"
        >Limpiar</v-btn
      >
      <v-btn
        class="mx-1"
        color="success"
        v-if="$store.state.user.tipo != 'filter' && $store.state.user.tipo != 'ver'"
        @click="Aceptar()"
        :loading="loading"
        >Aceptar</v-btn
      >
      <v-btn
        class="mx-1"
        color="warning"
        @click="$store.state.user.drawer = !$store.state.user.drawer"
        :loading="loading"
        >Cerrar</v-btn
      >
    </v-card-actions>
  </v-card>
</template>
<script>
import { mapActions } from "vuex";
import { mapActions as mapPiniaActions } from "pinia";
import { useTownStore } from "@/stores/town";
export default {
  data() {
    return {
      loading: false,
      loadingEstado: false,
      loadingCity: false,
      model: "",
    };
  },
  methods: {
    ...mapActions([
      "GetListUsers",
      "_getPais",
      "_getState",
      "_getCity",
    ]),
    ...mapPiniaActions(useTownStore, ["setTown", "ActualizarTown"]),
    getName() {
      // if (this.$store.state.user.tipo == "filter") {
      return "Filtrar Registros";
      // }
    },

    async Filtrar() {
      this.loading = true;
      await this.GetListUsers();
      this.loading = false;
      this.$store.state.user.drawer = !this.$store.state.user.drawer;
    },
    async Limpiar() {
      this.$store.state.user.filtros = {
        users: "",
        nombrecompleto: "",
        id_document: "",
        document: "",
        phone: "",
        email: "",
        status: "1",
      };
      this.loading = true;
      await this.GetListUsers();

      this.loading = false;
      this.$store.state.user.drawer = !this.$store.state.user.drawer;
    },
    async Aceptar() {
      if (this.$store.state.user.tipo == "nuevo") {
        if ((await this.$refs.frmDML.validate()).valid) {
          this.loading = true;
          await this.setTown();
          await this.GetListUsers();
          this.loading = false;
        }
      }
      if (this.$store.state.user.tipo == "editar") {
        this.loading = true;
        await this.ActualizarTown();
        await this.GetListUsers();
        this.loading = false;
      }
      if (this.$store.state.user.tipo == "ver") {
        this.$store.state.user.drawer = !this.$store.state.user.drawer;
      }
    },
  },
  computed: {
    drawer: {
      get() {
        return this.$store.state.user.drawer;
      },
      set(val) {
        return (this.$store.state.user.drawer = drawer);
      },
    },
  },
  watch: {
    drawer() {
      this.model = { ...this.$store.state.user.model };
      this.$refs.frmDML.resetValidation();
    },
  },
};
</script>

<style></style>
