<template>
  <v-card fluid class="px-5">
    <v-card elevation="0">
      <v-container v-if="loading" style="height: 400px">
        <v-row class="fill-height" align-content="center" justify="center">
          <v-col class="text-subtitle-1 text-center" cols="12">
            Cargando información ....
          </v-col>
          <v-col cols="6">
            <v-progress-linear
              color="deep-purple accent-4"
              indeterminate
              rounded
              height="6"
            ></v-progress-linear>
          </v-col>
        </v-row>
      </v-container>

      <v-card-title v-if="!loading" class="elevation-0">
        <v-text-field
          append-icon="mdi-magnify"
          label="Buscar"
          single-line
          hide-details
          v-model="search"
        >
        </v-text-field>
        <v-spacer></v-spacer>
        <v-btn
          small
          color="success"
          @click="showFilterDrawerNew = !showFilterDrawerNew"
        >
          Nuevo
        </v-btn>
        <v-btn
          small
          color="success"
          @click="showFilterDrawer = !showFilterDrawer"
        >
          Fitrar
        </v-btn>
        <v-btn small class="mx-1" color="#004D40" dark> Exportar </v-btn>
      </v-card-title>

      <v-data-table
        v-if="!loading"
        class="elevation-1"
        :headers="headers"
        :items="$store.state.type_phone.list"
        item-key="id"
        :search="search"
      >
        <template v-slot:[`item.status`]="{ item }">
          {{ !!item.status ? "Activo" : "Inactivo" }}
        </template>
        <template v-slot:[`item.action`]="{ item }">
          <v-btn icon>
            <v-icon color="warning" @click="update(item.id)">mdi-pencil</v-icon>
          </v-btn>
          <v-btn icon>
            <v-icon color="success" @click="read(item.id)">mdi-eye</v-icon>
          </v-btn>
          <v-btn icon>
            <v-switch
              v-model="item.status"
              color="success"
              @change="inactive(item)"
            ></v-switch>
          </v-btn>
        </template>
      </v-data-table>
    </v-card>

    <v-navigation-drawer
      v-model="showFilterDrawerNew"
      absolute
      bottom
      temporary
      right
      width="30%"
      height="92vh"
    >
      <v-card class="">
        <v-card-title>
          Nuevo Tipo de Teléfono
          <v-spacer></v-spacer>

          <v-card-text>
            <v-row>
              <v-text-field
                type="text"
                label="Código (*)"
                v-model="type.code"
                :rules="[(v) => validateCode(v)]"
                lazy-validation
              >
              </v-text-field>
            </v-row>
            <v-row>
              <v-text-field
                type="text"
                label="Nombre (*)"
                v-model="type.name"
                :rules="[(v) => validateName(v)]"
                lazy-validation
              >
              </v-text-field>
            </v-row>
            <v-row>
              <v-switch
                dense
                label="Activo/Inactivo"
                v-model="type.status"
                hide-details
                color="success"
                @change="updateStatus"
              ></v-switch>
            </v-row>
          </v-card-text>
        </v-card-title>
        <v-card-actions class="justify-end mt-3">
          <v-btn small class="mx-1" color="success" @click="insert()" rounded>
            Registrar</v-btn
          >
          <v-btn small class="mx-1" dark color="red" @click="volver()" rounded>
            Cancelar</v-btn
          >
        </v-card-actions>
      </v-card>
    </v-navigation-drawer>

    <v-navigation-drawer
      v-model="showFilterDrawerRead"
      height="100vh"
      absolute
      bottom
      temporary
      right
      width="30%"
    >
      <v-card class="">
        <v-container v-if="!loading_as">
          <v-card-title>
            Tipo de Teléfono {{ $store.state.type_phone.record.code }}
            {{ $store.state.type_phone.record.name }}
            <v-spacer></v-spacer>
            <v-card-text>
              <v-row>
                <v-text-field
                  label="Código"
                  readonly
                  :value="$store.state.type_phone.record.code"
                ></v-text-field>
              </v-row>
              <v-row>
                <v-text-field
                  label="Nombre"
                  readonly
                  :value="$store.state.type_phone.record.name"
                ></v-text-field>
              </v-row>
              <v-row>
                <v-switch
                  readonly
                  :label="`Estado: ${
                    !!$store.state.type_phone.record.status
                      ? 'Activo'
                      : 'Inactivo'
                  }`"
                  color="success"
                  v-model="$store.state.type_phone.record.status"
                ></v-switch>
              </v-row>
            </v-card-text>
          </v-card-title>
          <v-card-actions class="justify-end mt-3">
            <v-btn
              class="mx-1"
              dark
              color="red"
              @click="showFilterDrawerRead = !showFilterDrawerRead"
            >
              Cancelar</v-btn
            >
          </v-card-actions>
        </v-container>
        <v-container v-if="loading_as" style="height: 400px">
          <v-row class="fill-height" align-content="center" justify="center">
            <v-col class="text-subtitle-1 text-center" cols="12">
              Cargando información ....
            </v-col>
            <v-col cols="6">
              <v-progress-linear
                color="deep-purple accent-4"
                indeterminate
                rounded
                height="6"
              ></v-progress-linear>
            </v-col>
          </v-row>
        </v-container>
      </v-card>
    </v-navigation-drawer>

    <v-navigation-drawer
      v-model="showFilterDrawerUpdate"
      absolute
      bottom
      temporary
      right
      width="30%"
      height="92vh"
    >
      <v-card class="">
        <v-container v-if="!loading_as">
          <v-card-title>
            Editar Tipo de Teléfono {{ $store.state.type_phone.record.name }}
            <v-spacer></v-spacer>

            <v-card-text>
              <v-row>
                <v-text-field
                  type="text"
                  label="Código"
                  v-model="type.code"
                  readonly
                >
                </v-text-field>
              </v-row>
              <v-row>
                <v-text-field
                  type="text"
                  label="Nombre (*)"
                  v-model="type.name"
                  :rules="[(v) => validateName(v)]"
                  lazy-validation
                >
                </v-text-field>
              </v-row>
              <v-row>
                <v-switch
                  label="Activo / Inactivo"
                  v-model="type.status"
                  color="success"
                  @change="updateStatus"
                ></v-switch>
              </v-row>
            </v-card-text>
          </v-card-title>
          <v-card-actions class="justify-end mt-3">
            <v-btn class="mx-1" color="success" @click="btnUpdate">
              Aceptar</v-btn
            >
            <v-btn
              class="mx-1"
              dark
              color="red"
              @click="showFilterDrawerUpdate = !showFilterDrawerUpdate"
            >
              Cancelar</v-btn
            >
          </v-card-actions>
        </v-container>

        <v-container v-if="loading_as" style="height: 400px">
          <v-row class="fill-height" align-content="center" justify="center">
            <v-col class="text-subtitle-1 text-center" cols="12">
              Cargando información ....
            </v-col>
            <v-col cols="6">
              <v-progress-linear
                color="deep-purple accent-4"
                indeterminate
                rounded
                height="6"
              ></v-progress-linear>
            </v-col>
          </v-row>
        </v-container>
      </v-card>
    </v-navigation-drawer>

    <v-navigation-drawer
      v-model="showFilterDrawer"
      absolute
      bottom
      temporary
      right
      width="30%"
      height="92vh"
    >
      <v-card class="">
        <v-card-title>
          Filtrar Tipo de Teléfono
          <v-spacer></v-spacer>

          <v-card-text>
            <v-row>
              <v-text-field type="text" label="Nombre" v-model="type.name">
              </v-text-field>
            </v-row>
            <v-row>
              <v-text-field label="Código" v-model="type.code"></v-text-field>
            </v-row>
            <v-row>
              <v-switch
                dense
                label="Activo/Inactivo"
                v-model="type.status"
                hide-details
                color="success"
                @change="updateStatus"
              ></v-switch>
            </v-row>
          </v-card-text>
        </v-card-title>
        <v-card-actions class="justify-end mt-3">
          <v-btn class="mx-1" color="success" @click="filter()"> Aceptar</v-btn>
          <v-btn
            class="mx-1"
            dark
            color="red"
            @click="showFilterDrawer = !showFilterDrawer"
          >
            Cancelar</v-btn
          >
        </v-card-actions>
      </v-card>
    </v-navigation-drawer>
  </v-card>
</template>

<script>
import { mapState, mapActions } from "vuex";
import Swal from "sweetalert2";
import axios from '@/api/axios-config';

export default {
  name: "ListTypePhoneComponent",
  data() {
    return {
      headers: [
        { text: "Código", align: "start", value: "code" },
        { text: "Nombre", value: "name" },
                { text: "Estado", value: "estado" },{ text: "Creación", value: "created_at" },

        { text: "Última Actualización", value: "updated_at" },
        { text: "Acciones", value: "action" },
      ],
      loading: true,
      loading_as: true,
      item: "",
      search: "",
      types: {
        id_branch: JSON.parse(sessionStorage.getItem("dataUser"))[0].id_branch,
        code: "",
        name: "",
        status: 1,
      },
      type: {
        id_branch: JSON.parse(sessionStorage.getItem("dataUser"))[0].id_branch,
        code: "",
        name: "",
        status: 1,
      },
      originalType: {},
      showFilterDrawerNew: false,
      showFilterDrawerRead: false,
      showFilterDrawerUpdate: false,
      showFilterDrawer: false,
      id: "",
      rulesPassed: false,
    };
  },
  created() {
    this.originalType = { ...this.type };
  },
  async mounted() {
    await this.fetchDataTypePhone(this.types);
    this.$store.state.mainTitle = `Tipo de Teléfono`;
  },
  methods: {
    ...mapActions([
      "fetchDataTypePhone",
      "inactiveTypePhone",
      "insertTypePhone",
      "readTypePhone",
      "updateTypePhone",
    ]),
    volver() {
      this.$router.go(-1);
      this.resetType();
    },
    updateStatus(newValue) {
      this.type.status = newValue ? 1 : 0;
    },
    insert() {
      this.insertTypePhone(this.type);
    },
    resetType() {
      Object.assign(this.type, this.originalType);
    },
    inactive(item) {
      Swal.fire({
        title: "¿Estás seguro?",
        text: `Si inactiva el registro, éste no aparecerá disponible en otros formularios ¿Está seguro de que desea inactivarlo?`,
        icon: "warning",
        showCancelButton: true,
        confirmButtonText: "Sí",
        cancelButtonText: "Cancelar",
      }).then((result) => {
        if (result.isConfirmed) {
          this.inactiveTypePhone({ id: item.id });
        } else {
          this.item.status = this.item.status === 1 ? 0 : 1;
        }
      });
    },
    read(id) {
      this.showFilterDrawerRead = !this.showFilterDrawerRead;
      this.readTypePhone(id);
    },
    update(id) {
      this.showFilterDrawerUpdate = !this.showFilterDrawerUpdate;
      this.readTypePhone(id);
      this.action = "update";
      this.id = id;
    },
    btnUpdate() {
      let data = {
        id: this.id,
        name: this.type.name,
        status: this.type.status,
      };
      this.updateTypePhone(data);
    },
    filter() {
      this.fetchDataTypePhone(this.type);
      this.showFilterDrawer = false;
    },
    validateCode(v) {
      if (!v) {
        this.rulesPassed = false;
        return "Dato requerido";
      }
      if (v.length > 3) {
        this.rulesPassed = false;
        return "Hasta 3 caracteres permitidos";
      }
      this.rulesPassed = true;
      return true;
    },
    validateName(v) {
      if (!v) {
        this.rulesPassed = false;
        return "Dato requerido";
      }
      if (v.length > 50) {
        this.rulesPassed = false;
        return "Hasta 50 caracteres permitidos";
      }
      this.rulesPassed = true;
      return true;
    },
  },
  computed: {
    ...mapState(["list"]),
  },
  watch: {
    "$store.state.type_phone.record": {
      handler(newRecord, oldRecord) {
        if (newRecord && Object.keys(newRecord).length > 0) {
          console.log(newRecord);
          this.loading_as = false;
          this.type.code = newRecord.code;
          this.type.name = newRecord.name;
          this.type.status = newRecord.status;
        }
      },
      immediate: true,
    },
    "$store.state.type_phone.list": {
      handler(newList, oldList) {
        if (newList && newList.length > 0) {
          this.loading = false;
        }
      },
      immediate: true,
    },
  },
};
</script>
