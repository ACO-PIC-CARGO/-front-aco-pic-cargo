import { request } from "@/api/subscriptionPackages";

export const fetchLegalPage = (slug) =>
  request({ method: "get", url: `public/legal_pages/${slug}` });

export const fetchLegalPages = () =>
  request({ method: "get", url: "legal_pages" });

export const saveLegalPage = (slug, payload) =>
  request({ method: "put", url: `legal_pages/${slug}`, data: payload });
