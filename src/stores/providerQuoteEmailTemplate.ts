import { defineStore } from "pinia";
import { ref } from "vue";
import { notifySuccess, request } from "@/utils/request";
import type { EmailLanguage, ProviderQuoteEmailTemplate } from "@/types/providerQuoteEmailTemplate";

const TEMPLATES_URL = "provider_quote_email_templates";

export const TEMPLATES_NOT_LOADED =
  "Todavía no cargamos la plantilla del correo. Cierra este diálogo y vuelve a abrirlo.";

export const useProviderQuoteEmailTemplateStore = defineStore("providerQuoteEmailTemplate", () => {
  const templates = ref<ProviderQuoteEmailTemplate[]>([]);
  const loading = ref(false);
  const saving = ref(false);

  async function load(): Promise<string | null> {
    loading.value = true;
    const response = await request<ProviderQuoteEmailTemplate>({ method: "get", url: TEMPLATES_URL });
    loading.value = false;
    templates.value = response.estadoflag ? response.data : [];
    return response.estadoflag ? null : response.mensaje;
  }

  const templateFor = (language: EmailLanguage): ProviderQuoteEmailTemplate | null =>
    templates.value.find((template) => template.language === language) ?? null;

  async function save(template: ProviderQuoteEmailTemplate): Promise<string | null> {
    const { language, intro_html, closing_html } = template;
    saving.value = true;
    const response = await request({ method: "put", url: `${TEMPLATES_URL}/${language}`, data: { intro_html, closing_html } });
    saving.value = false;
    if (!response.estadoflag) return response.mensaje;
    templates.value = templates.value.map((saved) => (saved.language === language ? { ...template } : saved));
    notifySuccess(response.mensaje);
    return null;
  }

  return { templates, loading, saving, load, templateFor, save };
});
