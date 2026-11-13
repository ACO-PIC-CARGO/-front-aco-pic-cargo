<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { storeToRefs } from "pinia";
import FolderTabs from "@/components/comun/FolderTabs.vue";
import RichTextEditor from "@/components/comun/RichTextEditor.vue";
import ProviderEmailTableEditor from "@/components/folderPricing/ProviderEmailTableEditor.vue";
import { useAppStore } from "@/stores/app";
import { useProviderQuoteEmailTemplateStore } from "@/stores/providerQuoteEmailTemplate";
import { usePermissions } from "@/composables/usePermissions";
import type { EmailLanguage, ProviderQuoteEmailTemplate } from "@/types/providerQuoteEmailTemplate";

const SCREEN = "providerQuoteEmailTemplate";
const LANGUAGES: { value: EmailLanguage; title: string }[] = [
  { value: "es", title: "Español" },
  { value: "en", title: "Inglés" },
];

const appStore = useAppStore();
const templateStore = useProviderQuoteEmailTemplateStore();
const { loading, saving } = storeToRefs(templateStore);
const { can } = usePermissions();

const shipmentId = ref(0);
const language = ref<EmailLanguage>("es");
const drafts = ref<ProviderQuoteEmailTemplate[]>([]);
const loadError = ref<string | null>(null);
const saveError = ref<string | null>(null);

const shipmentTabs = computed(() =>
  drafts.value
    .filter((draft, index, all) => all.findIndex((other) => other.id_shipment === draft.id_shipment) === index)
    .map((draft) => ({ value: draft.id_shipment, title: draft.shipment_name })),
);
const shipmentDrafts = computed(() => drafts.value.filter((draft) => draft.id_shipment === shipmentId.value));

onMounted(async () => {
  appStore.mainTitle = "Plantilla del correo para solicitar tarifas a proveedores";
  loadError.value = await templateStore.load();
  drafts.value = templateStore.templates.map((template) => ({ ...template }));
  shipmentId.value = drafts.value[0]?.id_shipment ?? 0;
});

async function save(draft: ProviderQuoteEmailTemplate) {
  saveError.value = await templateStore.save({ ...draft });
}
</script>

<template>
  <v-alert
    v-if="loadError"
    type="warning"
    variant="tonal"
    class="ma-4"
  >
    {{ loadError }} Recarga la página para intentarlo de nuevo.
  </v-alert>
  <div v-else>
    <FolderTabs
      v-model="shipmentId"
      :items="shipmentTabs"
    />
    <v-card
      :loading="loading"
      class="mx-4 mb-4 rounded-ts-0"
    >
      <v-tabs
        v-model="language"
        align-tabs="center"
        slider-color="primary"
      >
        <v-tab
          v-for="option in LANGUAGES"
          :key="option.value"
          :value="option.value"
        >
          {{ option.title }}
        </v-tab>
      </v-tabs>
      <v-tabs-window v-model="language">
        <v-tabs-window-item
          v-for="draft in shipmentDrafts"
          :key="`${draft.id_shipment}-${draft.language}`"
          :value="draft.language"
          class="pa-4"
        >
          <RichTextEditor
            v-model="draft.intro_html"
            label="Texto antes de los datos"
          />
          <ProviderEmailTableEditor
            v-model:header="draft.table_header"
            v-model:rows="draft.table_rows"
            :readonly="!can(SCREEN, 'MODIFICAR')"
            class="my-4"
          />
          <RichTextEditor
            v-model="draft.closing_html"
            label="Texto después de los datos"
          />
          <v-alert
            v-if="saveError"
            type="warning"
            variant="tonal"
            class="mt-4"
          >
            {{ saveError }}
          </v-alert>
          <div
            v-if="can(SCREEN, 'MODIFICAR')"
            class="d-flex justify-end mt-4"
          >
            <v-btn
              color="success"
              :loading="saving"
              @click="save(draft)"
            >
              Guardar
            </v-btn>
          </div>
        </v-tabs-window-item>
      </v-tabs-window>
    </v-card>
  </div>
</template>
