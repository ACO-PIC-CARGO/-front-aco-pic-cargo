<template>
  <div class="">
    <v-card fluid class="px-5">
      <v-row>
        <v-col cols="4">
          <v-text-field
            label="Buscar"
            placeholder="Buscar"
            v-model="search"
            clearable
            append-icon="mdi-magnify"
          ></v-text-field>
        </v-col>
        <v-col cols="4" offset="4" class="text-right my-auto">
          <v-btn small color="success" :loading="loadingNuevo" @click="nuevo()"
            >NUEVO</v-btn
          >
          <v-btn
            small
            class="mx-1"
            :loading="loadingFiltrar"
            color="#2962FF"
            @click="filtrar()"
            dark
            >FILTRAR</v-btn
          >
          <v-btn small class="mx-1" color="#004D40" dark>EXPORTAR</v-btn>
        </v-col>
        <v-col cols="12">
          <v-data-table
            :headers="headers"
            :items="$store.state.user.lstUsers"
            class="elevation-1"
            item-key="port_beginend_id"
            :loading="loading"
            :search="search"
          >
            <template v-slot:[`item.status`]="{ item }">
              {{ !!item.status == 1 ? "Activo" : "Inactivo" }}
            </template>
            <template v-slot:[`item.statuscalls`]="{ item }">
              <v-chip color="green" v-if="item.status_calls == 1" dark
                >Si</v-chip
              >
              <v-chip color="red" v-else dark>No</v-chip>
            </template>
            <template v-slot:[`item.statuscalls_all`]="{ item }">
              <v-chip color="green" v-if="item.status_calls_all == 1" dark
                >Si</v-chip
              >
              <v-chip color="red" v-else dark>No</v-chip>
            </template>
            <template v-slot:[`item.permiso`]="{ item }">
              <tr v-for="(position, index) in item.json_position" :key="index">
               
                <td width="100%">
                  {{ index + 1 }}.{{ position.name }}
                </td>
              </tr>
            </template>
            <template v-slot:[`item.modulo`]="{ item }">
              <tr v-for="(menu, index) in item.json_menu" :key="index">
                
                <td width="100%">
                  {{ index + 1 }}.-{{ menu.name }}
                </td>
              </tr>
            </template>
            <template v-slot:[`item.action`]="{ item }">
              <v-tooltip bottom>
                <template v-slot:activator="{ on, attrs }">
                  <v-icon
                    color="primary"
                    dark
                    v-bind="attrs"
                    v-on="on"
                    @click="ver(item)"
                  >
                    mdi-eye
                  </v-icon>
                </template>
                <span>Ver</span>
              </v-tooltip>
              <v-tooltip bottom>
                <template v-slot:activator="{ on, attrs }">
                  <v-icon
                    color="warning"
                    dark
                    v-bind="attrs"
                    v-on="on"
                    @click="editar(item)"
                  >
                    mdi-pencil
                  </v-icon>
                </template>
                <span>Editar</span>
              </v-tooltip>
              <v-tooltip bottom v-if="item.status == 1">
                <template v-slot:activator="{ on, attrs }">
                  <v-icon
                    color="error"
                    dark
                    v-bind="attrs"
                    v-on="on"
                    @click="eliminar(item)"
                  >
                    mdi-delete
                  </v-icon>
                </template>
                <span>Eliminar</span>
              </v-tooltip>
            </template>
          </v-data-table>
        </v-col>
      </v-row>
    </v-card>
  </div>
</template>

<script>
import { mapActions } from "vuex";
import Swal from "sweetalert2";
import { canAddUsers, userLimitNotice } from "@/views/MyPlan/planAccess";
import { reloadPlanAccess } from "@/views/MyPlan/planAccessStore";
import { promptPlanUpgrade } from "@/views/MyPlan/promptPlanUpgrade";
export default {
  data() {
    return {
      search: "",
      loading: false,
      loadingNuevo: false,
      loadingFiltrar: false,
      headers: [
        { text: "Nombre Completo", value: "nombrecompleto" },
        { text: "Nombre de usuario", value: "users" },
        { text: "Perfil", value: "permiso" },
        { text: "Modulos", value: "modulo" },
        // { text: "Tip. Doc.", value: "type_document" },
        // { text: "Documento", value: "document" },
        { text: "Telefono", value: "phone" },
        // { text: "Correo", value: "email" },
        { text: "Estado", value: "status" },
        // { text: "Creación", value: "created_at" },
        { text: "Acciones", value: "action" },
      ],
    };
  },
  methods: {
    ...mapActions([
      "GetListUsers",
      "_getPais",
      "cambiarEstadoUsers",
      "_getState",
      "_getCity",
      "_getDocumentsPais",
    ]),
    async filtrar() {
      this.loadingFiltrar = !this.loadingFiltrar;
      this.$store.state.user.tipo = "filter";
      this.$store.state.user.drawer = !this.$store.state.user.drawer;
      this.loadingFiltrar = !this.loadingFiltrar;
    },
    async ver(item) {
      this.$router.push({
        name: "verUser",
        params: {
          id: item.id,
        },
      });
    },
    async editar(item) {
      this.$router.push({
        name: "editarUser",
        params: {
          id: item.id,
        },
      });
    },
    async nuevo() {
      this.loadingNuevo = true;
      const access = await reloadPlanAccess();
      this.loadingNuevo = false;
      if (!canAddUsers(access)) {
        promptPlanUpgrade(this.$router, userLimitNotice(access));
        return;
      }
      this.$router.push({ name: "registroUser" });
    },
    async eliminar(item) {
      Swal.fire({
        icon: "question",
        title: "¿Estás seguro?",
        text: `Si inactiva el registro, éste no aparecerá disponible en otros formularios ¿Está seguro de que desea inactivarlo?`,
        allowOutsideClick: false,
        confirmButtonText: "Si, inactivar",
        confirmButtonColor: "red",
        cancelButtonText: "Cancelar",
        cancelButtonColor: "orange",
        showCancelButton: true,
      }).then(async (res) => {
        if (res.isConfirmed) {
          item.status = 0;
          this.$store.state.user.model = item;
          this.loading = true;
          await this.cambiarEstadoUsers();
          await this.GetListUsers();
          this.loading = false;
        }
      });
    },
  },
  async mounted() {
    this.loading = !this.loading;
    await this.GetListUsers();
    this.loading = !this.loading;
    await this._getDocumentsPais();
  },
};
</script>

<style></style>
