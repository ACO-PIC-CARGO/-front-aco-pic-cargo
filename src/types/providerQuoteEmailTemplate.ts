export type EmailLanguage = "es" | "en";

export type EmailTableField =
  | "incoterm"
  | "pickup_address"
  | "port_of_loading"
  | "port_of_discharge"
  | "containers"
  | "packages"
  | "weight"
  | "volume"
  | "commodity"
  | "marketing_type"
  | "quote_status"
  | "executive"
  | "pricing_user"
  | "client_name"
  | "client_phone"
  | "direction"
  | "shipment_type"
  | "provider_name"
  | "provider_phone"
  | "provider"
  | "load_type"
  | "import_order";

export interface EmailTableRow {
  field: EmailTableField;
  label: string;
}

export interface ProviderQuoteEmailTemplate {
  language: EmailLanguage;
  intro_html: string;
  closing_html: string;
  table_header: [string, string];
  table_rows: EmailTableRow[];
}
