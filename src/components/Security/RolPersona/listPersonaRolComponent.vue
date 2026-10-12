<template>
  <v-row>
    <v-dialog
      v-model="dialog"
      persistent
      max-width="30%"
      transition="dialog-transition"
    >
      <v-card>
        <v-card-title primary-title>
          Seleccione ROL DE LAS PERSONAS A EDITAR
        </v-card-title>
        <v-card-text>
          <v-radio-group v-model="rol">
            <v-radio label="Proveedor" value="proveedor"></v-radio>
            <v-radio label="Cliente" value="cliente"></v-radio>
            <v-radio label="Personal" value="personal"></v-radio>
          </v-radio-group>
        </v-card-text>
        <v-card-actions>
          <v-btn color="success" @click="filterPorRol()">Aceptar</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
    <!-- ---------------- -->
    <v-col cols="6">
      <v-text-field
        label="Buscar..."
        v-model="search"
        class="mx-5"
      ></v-text-field>
    </v-col>
    <v-col cols="6">
      <v-btn color="success" class="ml-0" @click="Guardar()">Actualizar</v-btn>
    </v-col>
    <v-col cols="12">
      <v-data-table
        :headers="headers"
        :items="$store.state.entities.lstPersona"
        class="elevation-1"
        pagination.sync="pagination"
        item-key="id"
        loading="true"
        :search="search"
      >
        <template v-slot:[`item.proveedor`]="{ item }">
          <v-checkbox v-model="item.proveedorflag"></v-checkbox>
        </template>
        <template v-slot:[`item.cliente`]="{ item }">
          <v-checkbox v-model="item.clienteflag"></v-checkbox>
        </template>
        <template v-slot:[`item.personal`]="{ item }">
          <v-checkbox v-model="item.personalflag"></v-checkbox>
        </template>
      </v-data-table>
    </v-col>
  </v-row>
</template>

<script>
import { mapActions } from "vuex";
export default {
  data() {
    return {
      search: "",
      dialog: false,
      headers: [
        { title: "Persona", key: "nombrecompleto", width: "70%" },
        { title: "Es Proveedor", key: "proveedor", width: "10%" },
        { title: "Es Cliente", key: "cliente", width: "10%" },
        { title: "Es Personal", key: "personal", width: "10%" },
      ],
      items: [],
      rol: "",
    };
  },
  methods: {
    ...mapActions(["ListarPersonaTipoPersona", "guardarRolProveedor"]),
    filterPorRol() {
      if (this.rol == "proveedor") {
        this.items = this.$store.state.entities.lstPersona.filter(
          (v) => v.proveedorflag == true
        );
      }
      if (this.rol == "cliente") {
        this.items = this.$store.state.entities.lstPersona.filter(
          (v) => v.clienteflag == true
        );
      }
      if (this.rol == "personal") {
        this.items = this.$store.state.entities.lstPersona.filter(
          (v) => v.personalflag == true
        );
      }
      this.dialog = false;
    },
    async Guardar() {
      this.$store.state.spiner = true;
      await this.guardarRolProveedor();
      await this.ListarPersonaTipoPersona();
      this.$store.state.spiner = false;
    },
  },
  async mounted() {
    this.$store.state.spiner = true;
    await this.ListarPersonaTipoPersona();
    this.$store.state.spiner = false;
    // this.dialog = true;
  },

  // :items="$store.state.entities.lstPersona"
};
</script>

<style></style>
