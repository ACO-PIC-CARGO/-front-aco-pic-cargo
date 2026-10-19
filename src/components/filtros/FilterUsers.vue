<template>
  <v-card>
    <v-card-title class="d-flex align-center flex-wrap" primary-title>
      {{ getName() }}
      <v-spacer></v-spacer>
      <v-btn variant="text"
        icon
        color="default"
        @click="userStore.drawer = !userStore.drawer"
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
            v-model="userStore.filtros.id_document"
            item-title="name"
            item-value="id"
            clearable
          >
          </v-autocomplete>
        </div>

        <div class="col-12 py-1">
          <v-text-field
            v-model="userStore.filtros.document"
            label="Nro Documento"
            clearable
          ></v-text-field>
        </div>
        <div class="col-12 py-1">
          <v-text-field
            v-model="userStore.filtros.users"
            label="Nombre de usuario"
            clearable
          ></v-text-field>
        </div>
        <div class="col-12 py-1">
          <v-text-field
            v-model="userStore.filtros.nombrecompleto"
            label="Nombre Completo"
            clearable
          ></v-text-field>
        </div>
        <div class="col-12 py-1">
          <v-text-field
            v-model="userStore.filtros.phone"
            label="Teléfono"
            :clearable="userStore.tipo != 'ver'"
          ></v-text-field>
        </div>
        <div class="col-12 py-1">
          <v-text-field
            v-model="userStore.filtros.email"
            label="Email"
          ></v-text-field>
        </div>
        <div class="col-12 py-1">
          <span> Estado</span>
          <v-radio-group v-model="userStore.filtros.status" inline density="compact">
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
        v-if="userStore.tipo == 'filter'"
        @click="Filtrar()"
        :loading="loading"
        >Aceptar</v-btn
      >
      <v-btn
        class="mx-1"
        color="default"
        v-if="userStore.tipo == 'filter'"
        @click="Limpiar()"
        :loading="loading"
        >Limpiar</v-btn
      >
      <v-btn
        class="mx-1"
        color="success"
        v-if="userStore.tipo != 'filter' && userStore.tipo != 'ver'"
        @click="Aceptar()"
        :loading="loading"
        >Aceptar</v-btn
      >
      <v-btn
        class="mx-1"
        color="warning"
        @click="userStore.drawer = !userStore.drawer"
        :loading="loading"
        >Cerrar</v-btn
      >
    </v-card-actions>
  </v-card>
</template>
<script>
import { mapActions } from "vuex";
import { mapActions as mapPiniaActions, mapStores } from "pinia";
import { useTownStore } from "@/stores/town";
import { useUserStore } from "@/stores/user";
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
      "_getPais",
      "_getState",
      "_getCity",
    ]),
    ...mapPiniaActions(useUserStore, ["GetListUsers"]),
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
      this.userStore.drawer = !this.userStore.drawer;
    },
    async Limpiar() {
      this.userStore.filtros = {
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
      this.userStore.drawer = !this.userStore.drawer;
    },
    async Aceptar() {
      if (this.userStore.tipo == "nuevo") {
        if ((await this.$refs.frmDML.validate()).valid) {
          this.loading = true;
          await this.setTown();
          await this.GetListUsers();
          this.loading = false;
        }
      }
      if (this.userStore.tipo == "editar") {
        this.loading = true;
        await this.ActualizarTown();
        await this.GetListUsers();
        this.loading = false;
      }
      if (this.userStore.tipo == "ver") {
        this.userStore.drawer = !this.userStore.drawer;
      }
    },
  },
  computed: {
    ...mapStores(useUserStore),
    drawer: {
      get() {
        return this.userStore.drawer;
      },
      set(val) {
        return (this.userStore.drawer = drawer);
      },
    },
  },
  watch: {
    drawer() {
      this.model = { ...this.userStore.model };
      this.$refs.frmDML.resetValidation();
    },
  },
};
</script>

<style></style>
