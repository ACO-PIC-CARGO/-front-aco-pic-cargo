<script setup lang="ts">
import { computed, ref, useTemplateRef, watch } from "vue";
import { useAppStore } from "@/stores/app";
import { useTownStore } from "@/stores/town";
import { useUserStore } from "@/stores/user";
import type { FormUsuario } from "@/types/seguridad";

const appStore = useAppStore();
const userStore = useUserStore();
const townStore = useTownStore();

const loading = ref(false);
const model = ref<FormUsuario>({});
const frmDML = useTemplateRef("frmDML");

const drawer = computed(() => userStore.drawer);

watch(drawer, () => {
  model.value = { ...userStore.model };
  frmDML.value!.resetValidation();
});

function getName() {
  // if (this.$store.state.user.tipo == "filter") {
  return "Filtrar Registros";
  // }
}

async function Filtrar() {
  loading.value = true;
  await userStore.GetListUsers();
  loading.value = false;
  userStore.drawer = !userStore.drawer;
}
async function Limpiar() {
  userStore.filtros = {
    users: "",
    nombrecompleto: "",
    id_document: "",
    document: "",
    phone: "",
    email: "",
    status: "1",
  };
  loading.value = true;
  await userStore.GetListUsers();

  loading.value = false;
  userStore.drawer = !userStore.drawer;
}
async function Aceptar() {
  if (userStore.tipo == "nuevo") {
    if ((await frmDML.value!.validate()).valid) {
      loading.value = true;
      await townStore.setTown();
      await userStore.GetListUsers();
      loading.value = false;
    }
  }
  if (userStore.tipo == "editar") {
    loading.value = true;
    await townStore.ActualizarTown();
    await userStore.GetListUsers();
    loading.value = false;
  }
  if (userStore.tipo == "ver") {
    userStore.drawer = !userStore.drawer;
  }
}
</script>

<template>
  <v-card>
    <v-card-title
      class="d-flex align-center flex-wrap"
      primary-title
    >
      {{ getName() }}
      <v-spacer />
      <v-btn
        variant="text"
        icon
        color="default"
        @click="userStore.drawer = !userStore.drawer"
      >
        <v-icon>mdi-close</v-icon>
      </v-btn>
    </v-card-title>
    <v-form ref="frmDML">
      <v-card-text>
        <v-col
          cols="12"
          class="py-1"
        >
          <v-autocomplete
            label="Tipo Documento"
            :items="appStore.itemsDocumentsPais"
            v-model="userStore.filtros.id_document"
            item-title="name"
            item-value="id"
            clearable
          />
        </v-col>

        <v-col
          cols="12"
          class="py-1"
        >
          <v-text-field
            v-model="userStore.filtros.document"
            label="Nro Documento"
            clearable
          />
        </v-col>
        <v-col
          cols="12"
          class="py-1"
        >
          <v-text-field
            v-model="userStore.filtros.users"
            label="Nombre de usuario"
            clearable
          />
        </v-col>
        <v-col
          cols="12"
          class="py-1"
        >
          <v-text-field
            v-model="userStore.filtros.nombrecompleto"
            label="Nombre Completo"
            clearable
          />
        </v-col>
        <v-col
          cols="12"
          class="py-1"
        >
          <v-text-field
            v-model="userStore.filtros.phone"
            label="Teléfono"
            :clearable="userStore.tipo != 'ver'"
          />
        </v-col>
        <v-col
          cols="12"
          class="py-1"
        >
          <v-text-field
            v-model="userStore.filtros.email"
            label="Email"
          />
        </v-col>
        <v-col
          cols="12"
          class="py-1"
        >
          <span> Estado</span>
          <v-radio-group
            v-model="userStore.filtros.status"
            inline
            density="compact"
          >
            <v-radio
              label="Activo"
              color="green"
              value="1"
            />
            <v-radio
              label="Inactivo"
              color="red"
              value="0"
            />
            <v-radio
              label="Todos"
              color="blue"
              value="null"
            />
          </v-radio-group>
        </v-col>
      </v-card-text>
    </v-form>

    <v-card-actions>
      <v-spacer />
      <v-btn
        class="mx-1"
        color="success"
        v-if="userStore.tipo == 'filter'"
        @click="Filtrar()"
        :loading="loading"
      >
        Aceptar
      </v-btn>
      <v-btn
        class="mx-1"
        color="default"
        v-if="userStore.tipo == 'filter'"
        @click="Limpiar()"
        :loading="loading"
      >
        Limpiar
      </v-btn>
      <v-btn
        class="mx-1"
        color="success"
        v-if="userStore.tipo != 'filter' && userStore.tipo != 'ver'"
        @click="Aceptar()"
        :loading="loading"
      >
        Aceptar
      </v-btn>
      <v-btn
        class="mx-1"
        color="warning"
        @click="userStore.drawer = !userStore.drawer"
        :loading="loading"
      >
        Cerrar
      </v-btn>
    </v-card-actions>
  </v-card>
</template>

<style></style>
