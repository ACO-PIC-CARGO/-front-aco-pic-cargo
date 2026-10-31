const cents = (value: unknown) => Math.round((Number(value) || 0) * 100);

export const depositTotal = (payments: unknown[], commission: unknown): number =>
  payments.reduce<number>((sum, payment) => sum + cents(payment), cents(commission)) / 100;

export const depositMatches = (payments: unknown[], commission: unknown, deposit: unknown): boolean =>
  Math.round(depositTotal(payments, commission) * 100) === cents(deposit);
