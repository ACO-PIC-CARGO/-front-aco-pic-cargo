import { defineStore } from "pinia";
import { ref } from "vue";
import { notifySuccess, request } from "@/utils/request";
import type { EmailLanguage, ProviderQuoteEmailTemplate } from "@/types/providerQuoteEmailTemplate";

const TEMPLATES_URL = "provider_quote_email_templates";

export const TEMPLATE_NOT_FOUND =
  "No encontramos la plantilla del correo para el tipo de embarque de esta cotización. Revisa que ese tipo de embarque esté activo o cierra este diálogo y vuelve a abrirlo.";

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

  const isFor = (template: ProviderQuoteEmailTemplate, shipmentId: number, language: EmailLanguage) =>
    template.id_shipment === shipmentId && template.language === language;

  const templateFor = (shipmentId: number, language: EmailLanguage): ProviderQuoteEmailTemplate | null =>
    templates.value.find((template) => isFor(template, shipmentId, language)) ?? null;

  async function save(template: ProviderQuoteEmailTemplate): Promise<string | null> {
    const { id_shipment, language, intro_html, closing_html, table_header, table_rows } = template;
    saving.value = true;
    const response = await request({
      method: "put",
      url: `${TEMPLATES_URL}/${id_shipment}/${language}`,
      data: { intro_html, closing_html, table_header, table_rows },
    });
    saving.value = false;
    if (!response.estadoflag) return response.mensaje;
    templates.value = templates.value.map((saved) => (isFor(saved, id_shipment, language) ? { ...template } : saved));
    notifySuccess(response.mensaje);
    return null;
  }

  return { templates, loading, saving, load, templateFor, save };
});
