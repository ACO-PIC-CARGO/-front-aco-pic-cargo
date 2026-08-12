<template>
  <v-menu
    v-model="menu"
    offset-y
    :close-on-content-click="false"
    transition="scale-transition"
    min-width="290"
  >
    <!-- INPUT QUE ACTÚA COMO EL SELECT -->
    <template v-slot:activator="{ on, attrs }">
      <v-text-field
        :value="selectedLabel"
        :label="label"
        :placeholder="placeholder"
        :outlined="outlined"
        :dense="dense"
        :rules="rules"
        :disabled="disabled"
        readonly
        clearable
        hide-details
        append-icon="mdi-chevron-down"
        v-bind="attrs"
        v-on="on"
        @click:clear="clearSelection"
      ></v-text-field>
    </template>

    <!-- CAJA DESPLEGABLE CON EL ÁRBOL -->
    <v-card>
      <!-- Buscador -->
      <div class="pa-2" v-if="searchNested">
        <v-text-field
          v-model="search"
          label=""
          dense
          outlined
          hide-details
        ></v-text-field>
      </div>
      <v-divider v-if="searchNested"></v-divider>

      <!-- Árbol de Vuetify -->
      <v-card-text class="pa-0" style="max-height: 300px; overflow-y: auto">
        <v-treeview
          :items="options"
          :search="search"
          :item-text="itemText"
          :item-key="itemValue"
          activatable
          hoverable
          dense
          :open.sync="openNodes"
          :active="activeNodes"
          @update:active="onNodeSelect"
        ></v-treeview>
      </v-card-text>
    </v-card>
  </v-menu>
</template>

<script>
export default {
  name: "VTreeSelect",
  props: {
    value: {
      type: [String, Number],
      default: null,
    },
    options: {
      type: Array,
      required: true,
    },
    label: String,
    placeholder: String,
    outlined: Boolean,
    dense: Boolean,
    disabled: Boolean,
    rules: Array,
    searchNested: {
      type: Boolean,
      default: false,
    },
    disableBranchNodes: {
      type: Boolean,
      default: true,
    },

    itemText: {
      type: String,
      default: "label",
    },
    itemValue: {
      type: String,
      default: "id",
    },
  },
  data() {
    return {
      menu: false,
      search: "",
      openNodes: [],
    };
  },
  computed: {
    internalValue: {
      get() {
        return this.value;
      },
      set(val) {
        this.$emit("input", val);
      },
    },
    activeNodes() {
      return this.internalValue !== null &&
        this.internalValue !== undefined &&
        this.internalValue !== ""
        ? [this.internalValue]
        : [];
    },
    selectedLabel() {
      if (
        this.internalValue === null ||
        this.internalValue === undefined ||
        this.internalValue === ""
      ) {
        return "";
      }

      const node = this.findNode(this.options, this.internalValue);
      return node ? node[this.itemText] : "";
    },
  },
  methods: {
    findNode(items, id) {
      if (!items || items.length === 0) return null;
      for (const item of items) {
        if (String(item[this.itemValue]) === String(id)) {
          return item;
        }
        if (item.children && item.children.length > 0) {
          const found = this.findNode(item.children, id);
          if (found) return found;
        }
      }
      return null;
    },

    onNodeSelect(activeArray) {
      if (!activeArray || activeArray.length === 0) {
        this.internalValue = null;
        return;
      }
      const selectedKey = activeArray[0];
      const node = this.findNode(this.options, selectedKey);

      if (
        this.disableBranchNodes &&
        node &&
        node.children &&
        node.children.length > 0
      ) {
        return;
      }

      this.internalValue = selectedKey;
      this.menu = false;
      this.search = "";
    },

    clearSelection() {
      this.internalValue = null;
    },
    findPath(items, targetId) {
      if (!items || items.length === 0) return null;

      for (const item of items) {
        if (String(item[this.itemValue]) === String(targetId)) {
          return [];
        }

        if (item.children && item.children.length > 0) {
          const childPath = this.findPath(item.children, targetId);

          if (childPath !== null) {
            return [item[this.itemValue], ...childPath];
          }
        }
      }
      return null;
    },
  },
  watch: {
    internalValue: {
      handler(newVal) {
        if (newVal !== null && newVal !== undefined && newVal !== "") {
          // Si hay un valor, calculamos la ruta para llegar a él
          const path = this.findPath(this.options, newVal);
          this.openNodes = path || [];
        } else {
          this.openNodes = [];
        }
      },
      immediate: true,
    },
  },
};
</script>
