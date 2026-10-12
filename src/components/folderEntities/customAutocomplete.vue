<template>
  <div class="customAutocomplete-container" v-click-outside="clickOutsideList">
    <v-text-field 
      density="compact" 
      v-model="search" 
      :label="label" 
      :loading="loading" 
      :rules="rules" 
      :disabled="disabled"
      @focus="showList"
    ></v-text-field>

    <v-list density="compact" class="customAutocomplete elevation-1" v-show="showOptionsList">
      <template v-for="(item, index) in items" v-if="items.length > 0 && !loading">
        <v-list-item-group>
          <v-list-item :key="index" @click="selectItem(item.id)">
            
              <v-list-item-title>
                {{ item.telefono ? item.nombrecompleto.concat(" - ", item.telefono) : item.nombrecompleto }}
              </v-list-item-title>
            
          </v-list-item>
        </v-list-item-group>

        <!--<v-divider v-if="index < items.length - 1"></v-divider>-->
      </template>
    </v-list>
  </div>
</template>

<script>
export default {
  name: "CustomAutocomplete",
  props: {
    items: Array,
    loading: Boolean,
    label: String,
    value: String,
    rules: Array,
    disabled: Boolean
  },
  data() {
    return {
      showOptionsList: true,
    }
  },
  computed: {
    search: {
      get() {
        return this.value;
      },
      set(newValue) {
        this.$emit('search', newValue);
      }
    },
  },
  methods: {
    showList(e) {
      this.showOptionsList = true;
    },
    hideList(e) {
      this.showOptionsList = false;
    },
    clickOutsideList() {
      this.hideList();
    },
    selectItem(id) {
      this.$emit("id", id);
    }
  },
}
</script>

<style>
.customAutocomplete-container {
  position: relative;
}

.customAutocomplete {
  position: absolute;
  z-index: 99;
  right: 0;
  left: 0;
  padding-top: 0;
  padding-bottom: 0;
  margin-top: -17px;
  max-height: 350px;
  overflow-y: auto;
}
</style>