<template>
  <v-card>
    <v-container fluid>
      <v-row>
        <v-col cols="4">
          <v-text-field v-model="search"></v-text-field>
        </v-col>
        <v-col cols="4"> filtros </v-col>
        <v-col cols="12">
          <v-data-table
            :headers="header"
            :items="$store.state.branch.lstBranch"
            class="elevation-1"
            item-value="id"
            :search="search"
          >
            <template v-slot:[`item.status`]="{ item }">
              <v-chip
                v-if="item.status == 1"
                class="ma-2"
                color="green"
              >
                Activo
              </v-chip>
              <v-chip v-else class="ma-2" color="red">
                Inactivo
              </v-chip>
            </template>

            <template v-slot:[`item.action`]="{ item }">
              <v-icon
                style="cursor: pointer"
                v-if="item.status == 1"
                color="red"
                @click="inactivar(item.id)"
                >mdi-delete</v-icon
              >
            </template>
          </v-data-table>
        </v-col>
      </v-row>
    </v-container>
  </v-card>
</template>

<script>
import { mapActions } from "vuex";
import Swal from "sweetalert2";
export default {
  data() {
    return {
      search: "",
      header: [
        { title: "Empresa", key: "trade_name" },
        { title: "Dirección", key: "address" },
        { title: "País", key: "pais" },
        { title: "Fec. Creación", key: "created_at" },
        // { text: "ultima Actualización", value: "updated_at" },
        { title: "Nombres", key: "nombrecompleto" },
        { title: "Tel.", key: "phone" },
        { title: "Último Login", key: "ultimologin" },
        { title: "Estado", key: "status" },
        { title: "", key: "action" },
      ],
    };
  },
  mounted() {
    this.ListadoSucursal();
  },
  methods: {
    ...mapActions(["ListadoSucursal", "inactivarSucursal"]),
    inactivar(id) {
      Swal.fire({
        icon: "warning",
        text: "¿Desea Inactivar el registro?",
        showCancelButton: true,
        confirmButtonText: "Si eliminar",
        cancelButtonText: "Cancelar",
        allowEnterKey: true,
        allowOutsideClick: true,
      }).then(async (respuesta) => {
        if (respuesta.isConfirmed) {
          await this.inactivarSucursal(id);
          await this.ListadoSucursal();
        }
      });
    },
  },
};
</script>

<style></style>
