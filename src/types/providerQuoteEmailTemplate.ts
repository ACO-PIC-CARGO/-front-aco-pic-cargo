export type EmailLanguage = "es" | "en";

export interface ProviderQuoteEmailTemplate {
  language: EmailLanguage;
  intro_html: string;
  closing_html: string;
}
