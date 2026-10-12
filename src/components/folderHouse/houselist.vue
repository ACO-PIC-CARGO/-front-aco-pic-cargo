<template>
  <div>
    <v-card class="mx-auto">
      <v-card-text>
        <v-tabs v-model="activeTab" bg-color="transparent" color="primary">
          <v-tab key="houses">
            <v-icon start>mdi-home-group</v-icon>
            Lista de House
          </v-tab>
          <v-tab key="comments">
            <v-icon start>mdi-comment-text-multiple</v-icon>
            Comentarios
          </v-tab>
        </v-tabs>

        <v-tabs-items v-model="activeTab">
          <v-tab-item key="houses">
        <v-table density="compact">
          <template v-slot:default>
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
                v-for="(item, index) in $store.state.itemsHouseList"
                :key="index"
              >
                <td>{{ index + 1 }}</td>
                <td>{{ item.nro_hbl || item.code_house || '-' }}</td>
                <td>{{ item.nameconsigner || item.cliente_nombre || item.cliente || '-' }}</td>
                <td>{{ getIncotermName(item) }}</td>
                <td>{{ item.peso || 0 }} Kg</td>
                <td>{{ item.volumen || 0 }} m3</td>
              </tr>
            </tbody>
          </template>
        </v-table>
          </v-tab-item>

          <v-tab-item key="comments">
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
                  <td class="bg-comentarios">{{ comment.fecha }}</td>
                  <td class="bg-comentarios">{{ comment.ejecutivo }}</td>
                  <td class="bg-comentarios">{{ comment.comentario }}</td>
                </tr>
              </tbody>
            </v-table>
            <v-alert v-else type="info" text>
              No hay comentarios disponibles
            </v-alert>
          </v-tab-item>
        </v-tabs-items>
      </v-card-text>
    </v-card>
  </div>
</template>

<script>
export default {
  name: "houselist",
  computed: {
    houseComments() {
      const houseId = this.$route.params.id;
      if (!houseId) return [];
      
      if (this.$store.state.houses && this.$store.state.houses.house && this.$store.state.houses.house.list_comentarios) {
        return this.$store.state.houses.house.list_comentarios;
      }
      
      if (this.$store.state.itemsHouseList) {
        const houseItem = this.$store.state.itemsHouseList.find(h => h.id == houseId);
        return houseItem && houseItem.list_comentarios ? houseItem.list_comentarios : [];
      }
      
      return [];
    },
  },
  methods: {
    getIncotermName(item) {
      if (item.incoterm) return item.incoterm;
      if (item.nameincoterm) return item.nameincoterm;
      if (item.incoterms) return item.incoterms;
      if (item.name_incoterm) return item.name_incoterm;
      if (item.id_incoterms) {
        var incoterms = this.$store.state.itemsIncoterms || [];
        var found = incoterms.find(function(inc) { return inc.id == item.id_incoterms; });
        if (found) return found.name;
      }
      return '-';
    },
  },
  data: () => ({
    activeTab: 0, 
    items: [
      { header: "LISTA DE HOUSE" },
      {
        avatar: "https://cdn.vuetifyjs.com/images/lists/1.jpg",
        title: "Brunch this weekend?",
        subtitle: `<span class="text--primary">Ali Connors</span> &mdash; I'll be in your neighborhood doing errands this weekend. Do you want to hang out?`,
      },
      { divider: true, inset: true },
      {
        avatar: "https://cdn.vuetifyjs.com/images/lists/2.jpg",
        title: 'Summer BBQ <span class="grey--text text--lighten-1">4</span>',
        subtitle: `<span class="text--primary">to Alex, Scott, Jennifer</span> &mdash; Wish I could come, but I'm out of town this weekend.`,
      },
      { divider: true, inset: true },
      {
        avatar: "https://cdn.vuetifyjs.com/images/lists/3.jpg",
        title: "Oui oui",
        subtitle:
          '<span class="text--primary">Sandra Adams</span> &mdash; Do you have Paris recommendations? Have you ever been?',
      },
      { divider: true, inset: true },
      {
        avatar: "https://cdn.vuetifyjs.com/images/lists/4.jpg",
        title: "Birthday gift",
        subtitle:
          '<span class="text--primary">Trevor Hansen</span> &mdash; Have any ideas about what we should get Heidi for her birthday?',
      },
      { divider: true, inset: true },
      {
        avatar: "https://cdn.vuetifyjs.com/images/lists/5.jpg",
        title: "Recipe to try",
        subtitle:
          '<span class="text--primary">Britta Holt</span> &mdash; We should eat this: Grate, Squash, Corn, and tomatillo Tacos.',
      },
    ],
  }),
};
</script>
