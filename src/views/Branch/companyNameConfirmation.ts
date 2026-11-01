const normalized = (name: string) => name.trim().replace(/\s+/g, " ").toLocaleUpperCase("es");

export const confirmsCompanyName = (typed: string, companyName: string) =>
  normalized(typed) !== "" && normalized(typed) === normalized(companyName);
