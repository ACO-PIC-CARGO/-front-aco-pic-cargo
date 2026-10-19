export interface Moneda {
  id: number;
  code: string;
  symbol: string;
  acronym: string;
  name: string;
  description: string | null;
  status: number;
  created_at?: string;
  updated_at?: string;
}
