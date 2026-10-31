export interface AccountConceptInput {
  id?: number | null;
  concepto: string;
  monto: number | string | null;
  afecto: unknown;
  status?: number | string;
}

export interface AccountConcept {
  id: number | null;
  concepto: string;
  monto: number | string;
  igv: number;
  total: number;
  montodolar: number;
  igvdolar: number;
  totaldolar: number;
  afecto: 0 | 1;
  status: number;
}

export interface AccountTotals {
  monto: number;
  igv: number;
  total: number;
  montodolar: number;
  igvdolar: number;
  totaldolar: number;
}

const TAXED_VALUES: unknown[] = [true, 1, "1", "true"];

const roundMoney = (value: number) => Math.round((value + Number.EPSILON) * 100) / 100;

export const isTaxed = (afecto: unknown): boolean => TAXED_VALUES.includes(afecto);

export function priceConcept(concept: AccountConceptInput, exchangeRate: number | string, taxRate: number): AccountConcept {
  const amount = Number(concept.monto) || 0;
  const rate = Number(exchangeRate) || 1;
  const taxed = isTaxed(concept.afecto);
  const tax = taxed ? (amount * taxRate) / 100 : 0;
  return {
    id: concept.id ?? null,
    concepto: concept.concepto,
    monto: amount,
    igv: roundMoney(tax),
    total: roundMoney(amount + tax),
    montodolar: roundMoney(amount / rate),
    igvdolar: roundMoney(tax / rate),
    totaldolar: roundMoney((amount + tax) / rate),
    afecto: taxed ? 1 : 0,
    status: Number(concept.status ?? 1),
  };
}

export const activeConcepts = <T extends { status?: number | string }>(concepts: T[]): T[] =>
  concepts.filter((concept) => concept.status == 1);

export const repriceConcepts = (concepts: AccountConceptInput[], exchangeRate: number | string, taxRate: number) =>
  concepts.map((concept) => priceConcept(concept, exchangeRate, taxRate));

export const repriceConcept = (
  concepts: AccountConcept[],
  target: AccountConcept,
  exchangeRate: number | string,
  taxRate: number,
) => concepts.map((concept) => (concept === target ? priceConcept(concept, exchangeRate, taxRate) : concept));

export function conceptTotals(concepts: AccountConcept[]): AccountTotals {
  const sum = (field: keyof AccountTotals) =>
    roundMoney(activeConcepts(concepts).reduce((total, concept) => total + Number(concept[field]), 0));
  return {
    monto: sum("monto"),
    igv: sum("igv"),
    total: sum("total"),
    montodolar: sum("montodolar"),
    igvdolar: sum("igvdolar"),
    totaldolar: sum("totaldolar"),
  };
}
