<template>
  <v-card class="cardDatos" width="100%">
    <v-tabs
      v-model="tab"
      bg-color="teal-darken-4"
      color="white"
      grow
      stacked
    >
      <v-tab base-color="rgba(255, 255, 255, 0.6)" value="datos"> Datos Principales </v-tab>

      <v-tab base-color="rgba(255, 255, 255, 0.6)" value="permisos"> Permisos y Restricciones </v-tab>

      <v-tab base-color="rgba(255, 255, 255, 0.6)" value="usuarios"> Usuarios </v-tab>
    </v-tabs>
    <v-tabs-window v-model="tab">
      <v-tabs-window-item value="datos" class="px-5 items">
        <v-form ref="frmDatos">
          <v-row>
            <v-col cols="12">
              <v-text-field
                v-model="positionStore.model.code"
                label="Código"
                readonly
              ></v-text-field>
            </v-col>
            <v-col cols="12">
              <v-text-field
                v-model="positionStore.model.name"
                label="Nombre"
                readonly
              ></v-text-field>
            </v-col>
            <v-col cols="12">
              <v-text-field
                v-model="positionStore.model.description"
                label="Descripción"
                readonly
              ></v-text-field>
            </v-col>

            <v-col cols="12">
              <v-switch
                label="Estado"
                v-model="positionStore.model.estado"
                readonly
              ></v-switch>
            </v-col>
          </v-row>
        </v-form>
      </v-tabs-window-item>
      <v-tabs-window-item value="permisos" class="px-5 items">
        <v-row class="pa-5">
          <v-col cols="6">
            <p>Módulos</p>
            <v-data-table
              :headers="headersRoles"
              :items="positionStore.model.modules_position"
              item-value="id"
            >
              <template v-slot:[`item.index`]="{ index }">
                {{ index + 1 }}
              </template>
            </v-data-table>
          </v-col>

          <v-col cols="6">
            <p>Permisos</p>
            <v-data-table
              :headers="headersRoles"
              :items="positionStore.model.button_position"
              item-value="id"
            >
              <template v-slot:[`item.index`]="{ index }">
                {{ index + 1 }}
              </template>
            </v-data-table>
          </v-col>
        </v-row>
      </v-tabs-window-item>

      <v-tabs-window-item value="usuarios" class="px-5 items">
        <v-row>
          <v-col cols="12">
            <v-data-table
              :headers="headersUsuarios"
              :items="positionStore.model.user_position"
              class="elevation-1"
              item-value="id"
            >
              <template v-slot:[`item.index`]="{ index }">
                {{ index + 1 }}
              </template>
              <template v-slot:[`item.estado`]="{ item }">
                <v-switch readonly v-model="item.estado" @update:model-value="guardarFlag = true">
                </v-switch>
              </template>
              <template v-slot:[`item.departamentos`]="{ item }">
                {{ item.departamento == "1" ? "Pricing" : "Operativo" }}
              </template>
            </v-data-table>
          </v-col>
        </v-row>
      </v-tabs-window-item>
    </v-tabs-window>
  </v-card>
</template>

<script>
import { mapActions as mapPiniaActions, mapStores } from "pinia";
import { usePositionStore } from "@/stores/position";
export default {
  data() {
    return {
      tab: "datos",
      user: "",
      errUsuario: "",
      guardarFlag: false,
      headersRoles: [
        { title: "#", key: "index" },
        { title: "Nombre", key: "name" },
        { title: "Si/ No", key: "uso" },
      ],
      headersRoles: [
        { title: "#", key: "index" },
        { title: "Nombre", key: "name" },
        { title: "Si/ No", key: "uso" },
      ],
      headersUsuarios: [
        { title: "#", key: "index" },
        { title: "Documento", key: "document" },
        { title: "Nombre", key: "nombrecompleto" },
        { title: "Usuario", key: "users" },
        { title: "Teléfono", key: "phone" },
        { title: "Departamento", key: "departamentos" },
        { title: "Estado", key: "estado" },
        { title: "Creación", key: "created_at" },
        { title: "Última Actualización", key: "updated_at" },
        // { text: "Nombre", value: "Nombre completo" },
      ],
    };
  },
  async mounted() {
    this.positionStore.model.id = this.$route.params.id;
    this.$store.state.spiner = true;
    await this.verPosition();
    await this.cargarUsuarioNoAsignadoPosicion();
    this.$store.state.spiner = false;
  },
  computed: {
    ...mapStores(usePositionStore),
  },
  methods: {
    ...mapPiniaActions(usePositionStore, ["verPosition", "cargarUsuarioNoAsignadoPosicion", "setPosition"]),
    asignar() {
      this.errUsuario = "";
      if (
        !this.positionStore.model.user_position.some(
          (v) => v.users == this.user.users
        )
      ) {
        this.positionStore.model.user_position.push(this.user);
        this.guardarFlag = true;
      } else {
        this.errUsuario = "El usuario ya se encuentra en la lista";
      }
    },
    // async actualizarUsuariosPosicion() {
    //   this.$store.state.spiner = true;
    //   await this.setPosition();
    //   await this.verPosition();
    //   await this.cargarUsuarioNoAsignadoPosicion();
    //   this.$store.state.spiner = false;
    // },
  },
};
</script>

<style scoped>
.cardDatos {
  max-width: 50%;
}
.items {
  min-height: 700px !important;
}
.iconDepartamento {
  cursor: pointer;
}
@media (max-width: 1000px) {
  .cardDatos {
    min-width: 100% !important;
  }
  .items {
    min-height: auto !important;
  }
}
</style>
