<script setup lang="ts">
import { computed, ref } from "vue";
import { useRoute } from "vue-router";
import { useStore } from "vuex";
import { useHousesStore } from "@/stores/houses";

const rootStore = useStore();
const route = useRoute();
const housesStore = useHousesStore();

const activeTab = ref(0);

const houseComments = computed(() => {
  const houseId = route.params.id;
  if (!houseId) return [];
  
  if (housesStore && housesStore.house && housesStore.house.list_comentarios) {
    return housesStore.house.list_comentarios;
  }
  
  if (rootStore.state.itemsHouseList) {
    const houseItem = rootStore.state.itemsHouseList.find((h: { id: number | string }) => h.id == houseId);
    return houseItem && houseItem.list_comentarios ? houseItem.list_comentarios : [];
  }
  
  return [];
});

function getIncotermName(item: {
  incoterm?: string;
  nameincoterm?: string;
  incoterms?: string;
  name_incoterm?: string;
  id_incoterms?: number;
}) {
  if (item.incoterm) return item.incoterm;
  if (item.nameincoterm) return item.nameincoterm;
  if (item.incoterms) return item.incoterms;
  if (item.name_incoterm) return item.name_incoterm;
  if (item.id_incoterms) {
    const incoterms = rootStore.state.itemsIncoterms || [];
    const found = incoterms.find(function(inc: { id: number; name: string }) { return inc.id == item.id_incoterms; });
    if (found) return found.name;
  }
  return '-';
}
</script>

<template>
  <div>
    <v-card class="mx-auto">
      <v-card-text>
        <v-tabs
          v-model="activeTab"
          bg-color="transparent"
          color="primary"
        >
          <v-tab key="houses">
            <v-icon start>
              mdi-home-group
            </v-icon>
            Lista de House
          </v-tab>
          <v-tab key="comments">
            <v-icon start>
              mdi-comment-text-multiple
            </v-icon>
            Comentarios
          </v-tab>
        </v-tabs>

        <v-tabs-window v-model="activeTab">
          <v-tabs-window-item key="houses">
            <v-table density="compact">
              <template #default>
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Código</th>
                    <th>Cliente</th>
                    <th>Incoterm</th>
                    <th>Peso</th>
                    <th>Volumen</th>
                  </tr>
                </thead>
                <tbody>
                  <tr
                    v-for="(item, index) in rootStore.state.itemsHouseList"
                    :key="index"
                  >
                    <td>{{ (index as number) + 1 }}</td>
                    <td>{{ item.nro_hbl || item.code_house || '-' }}</td>
                    <td>{{ item.nameconsigner || item.cliente_nombre || item.cliente || '-' }}</td>
                    <td>{{ getIncotermName(item) }}</td>
                    <td>{{ item.peso || 0 }} Kg</td>
                    <td>{{ item.volumen || 0 }} m3</td>
                  </tr>
                </tbody>
              </template>
            </v-table>
          </v-tabs-window-item>

          <v-tabs-window-item key="comments">
            <v-table v-if="houseComments && houseComments.length > 0">
              <thead>
                <tr>
                  <th>Fecha</th>
                  <th>Ejecutivo</th>
                  <th>Comentario</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="(comment, index) in houseComments"
                  :key="index"
                  class="bg-comentarios"
                >
                  <td class="bg-comentarios">
                    {{ comment.fecha }}
                  </td>
                  <td class="bg-comentarios">
                    {{ comment.ejecutivo }}
                  </td>
                  <td class="bg-comentarios">
                    {{ comment.comentario }}
                  </td>
                </tr>
              </tbody>
            </v-table>
            <v-alert
              v-else
              type="info"
              variant="tonal"
            >
              No hay comentarios disponibles
            </v-alert>
          </v-tabs-window-item>
        </v-tabs-window>
      </v-card-text>
    </v-card>
  </div>
</template>


