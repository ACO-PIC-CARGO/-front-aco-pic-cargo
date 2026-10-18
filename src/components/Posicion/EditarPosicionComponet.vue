<template>
  <v-card class="cardDatos">
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
                v-model="$store.state.position.model.code"
                label="Código"
                readonly
              ></v-text-field>
            </v-col>
            <v-col cols="12">
              <v-text-field
                v-model="$store.state.position.model.name"
                label="Nombre"
                readonly
              ></v-text-field>
            </v-col>
            <v-col cols="12">
              <v-text-field
                v-model="$store.state.position.model.description"
                label="Descripción"
                readonly
              ></v-text-field>
            </v-col>

            <v-col cols="12">
              <v-switch
                readonly
                label="Estado"
                v-model="$store.state.position.model.estado"
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
              :items="$store.state.position.model.modules_position"
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
              :items="$store.state.position.model.button_position"
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
            <v-row>
              <v-col cols="4">
                <v-autocomplete
                  :items="$store.state.position.lstUsuarioNoAsignado"
                  item-value="id"
                  item-title="users"
                  label="Usuarios del sistema no asignados"
                  return-object
                  v-model="user"
                  :error-messages="errUsuario"
                />
              </v-col>

              <v-col cols="8" class="my-auto">
                <v-btn class="mx-1" color="info" @click="asignar"
                  >Agregar</v-btn
                >
                <v-btn
                  class="mx-1"
                  color="success"
                  :disabled="!guardarFlag"
                  @click="actualizarUsuariosPosicion()"
                  >Guardar Cambios</v-btn
                >
              </v-col>
            </v-row>
          </v-col>
          <v-col cols="12">
            <v-data-table
              :headers="headersUsuarios"
              :items="$store.state.position.model.user_position"
              class="elevation-1"
              item-value="id"
            >
              <template v-slot:[`item.index`]="{ index }">
                {{ index + 1 }}
              </template>
              <template v-slot:[`item.estado`]="{ item }">
                <v-switch v-model="item.estado" @update:model-value="guardarFlag = true">
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
import { mapActions } from "vuex";
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
      if (!this.user) {
        this.errUsuario = "Es necesario seleccionar un usuario.";
        return false;
      }
      if (
        this.$store.state.position.model.user_position.some(
          (v) => v.users == this.user.users
        )
      ) {
        this.errUsuario = "El usuario ya se encuentra en la lista";
        return false;
      }
      this.$store.state.position.model.user_position.push(this.user);
      this.guardarFlag = true;
    },
    async actualizarUsuariosPosicion() {
      this.errUsuario = "";
      this.$store.state.spiner = true;
      await this.setPosition();
      await this.verPosition();
      await this.cargarUsuarioNoAsignadoPosicion();
      this.user = "";
      this.$store.state.spiner = false;
    },
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
