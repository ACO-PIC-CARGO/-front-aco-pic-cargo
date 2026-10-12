<template>
  <v-card class="cardDatos" width="100%">
    <v-tabs
      v-model="tab"
      bg-color="teal darken-4"
      grow
      dark
      stacked
    >
      <v-tabs-slider></v-tabs-slider>

      <v-tab href="#datos"> Datos Principales </v-tab>

      <v-tab href="#permisos"> Permisos y Restricciones </v-tab>

      <v-tab href="#usuarios"> Usuarios </v-tab>
    </v-tabs>
    <v-tabs-items v-model="tab">
      <v-tab-item value="datos" class="px-5 items">
        <v-form ref="frmDatos">
          <v-row>
            <v-col cols="12">
              <v-text-field
                v-model="$store.state.position.model.code"
                label="Código"
                readonly
                id="id"
              ></v-text-field>
            </v-col>
            <v-col cols="12">
              <v-text-field
                v-model="$store.state.position.model.name"
                label="Nombre"
                readonly
                id="id"
              ></v-text-field>
            </v-col>
            <v-col cols="12">
              <v-text-field
                v-model="$store.state.position.model.description"
                label="Descripción"
                readonly
                id="id"
              ></v-text-field>
            </v-col>

            <v-col cols="12">
              <v-switch
                label="Estado"
                v-model="$store.state.position.model.estado"
                readonly
              ></v-switch>
            </v-col>
          </v-row>
        </v-form>
      </v-tab-item>
      <v-tab-item value="permisos" class="px-5 items">
        <v-row class="pa-5">
          <v-col cols="6">
            <p>Módulos</p>
            <v-data-table
              :headers="headersRoles"
              :items="$store.state.position.model.modules_position"
              item-key="id"
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
              :items="$store.state.position.model.button_position"
              item-key="id"
            >
              <template v-slot:[`item.index`]="{ index }">
                {{ index + 1 }}
              </template>
            </v-data-table>
          </v-col>
        </v-row>
      </v-tab-item>

      <v-tab-item value="usuarios" class="px-5 items">
        <v-row>
          <v-col cols="12">
            <v-data-table
              :headers="headersUsuarios"
              :items="$store.state.position.model.user_position"
              class="elevation-1"
              item-key="id"
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
      </v-tab-item>
    </v-tabs-items>
  </v-card>
</template>

<script>
import { mapActions } from "vuex";
export default {
  data() {
    return {
      tab: "datos",
      user: "",
      errUsuario: "",
      guardarFlag: false,
      headersRoles: [
        { text: "#", value: "index" },
        { text: "Nombre", value: "name" },
        { text: "Si/ No", value: "uso" },
      ],
      headersRoles: [
        { text: "#", value: "index" },
        { text: "Nombre", value: "name" },
        { text: "Si/ No", value: "uso" },
      ],
      headersUsuarios: [
        { text: "#", value: "index" },
        { text: "Documento", value: "document" },
        { text: "Nombre", value: "nombrecompleto" },
        { text: "Usuario", value: "users" },
        { text: "Teléfono", value: "phone" },
        { text: "Departamento", value: "departamentos" },
        { text: "Estado", value: "estado" },
        { text: "Creación", value: "created_at" },
        { text: "Última Actualización", value: "updated_at" },
        // { text: "Nombre", value: "Nombre completo" },
      ],
    };
  },
  async mounted() {
    this.$store.state.position.model.id = this.$route.params.id;
    this.$store.state.spiner = true;
    await this.verPosition();
    await this.cargarUsuarioNoAsignadoPosicion();
    this.$store.state.spiner = false;
  },
  methods: {
    ...mapActions([
      "verPosition",
      "cargarUsuarioNoAsignadoPosicion",
      "setPosition",
    ]),
    asignar() {
      this.errUsuario = "";
      if (
        !this.$store.state.position.model.user_position.some(
          (v) => v.users == this.user.users
        )
      ) {
        this.$store.state.position.model.user_position.push(this.user);
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
