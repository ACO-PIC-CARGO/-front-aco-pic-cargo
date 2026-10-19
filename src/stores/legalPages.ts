import { defineStore } from "pinia";
import { computed, ref } from "vue";
import Swal from "sweetalert2";
import moment from "moment";
import { hasFailed, notifySuccess, request } from "@/utils/request";
import type { ApiResponse } from "@/types/api";
import type {
  LegalDraft,
  LegalDraftErrors,
  LegalLimits,
  LegalPage,
  LegalPagePayload,
  LegalSectionDraft,
} from "@/types/legal";

const LEGAL_LIMITS: LegalLimits = {
  title: 120,
  sections: 40,
  heading: 150,
  paragraphs: 20,
  text: 6000,
  // The API rejects JSON bodies over 100 KB.
  requestBytes: 90000,
};

const LEGAL_MESSAGES = {
  title: "Escribe un título de hasta 120 caracteres.",
  sections: "Agrega entre 1 y 40 secciones.",
  heading: "Cada sección necesita un título de hasta 150 caracteres.",
  text: "Cada sección necesita texto: hasta 20 párrafos y 6000 caracteres.",
  size: "La página es demasiado larga para guardarla. Acórtala a unos 90 000 caracteres en total.",
};

const PLACEHOLDER = /\[[^\]\n]{1,60}\]/g;
let lastKey = 0;
const nextKey = () => `section-${(lastKey += 1)}`;

const splitParagraphs = (text: string) =>
  text
    .split(/\n\s*\n/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);

const textLength = (text: string): number =>
  splitParagraphs(text).reduce(
    (total, paragraph) => total + paragraph.length,
    0
  );

const emptySection = (): LegalSectionDraft => ({ key: nextKey(), heading: "", text: "" });

const toDraft = (page: LegalPage): LegalDraft => ({
  title: page.title,
  sections: page.sections.map((section) => ({
    key: nextKey(),
    heading: section.heading,
    text: section.paragraphs.join("\n\n"),
  })),
});

const toPayload = (draft: LegalDraft): LegalPagePayload => ({
  title: draft.title.trim(),
  sections: draft.sections.map((section) => ({
    heading: section.heading.trim(),
    paragraphs: splitParagraphs(section.text),
  })),
});

const hasLength = (value: string | unknown[], max: number) => value.length >= 1 && value.length <= max;

const requestBytes = (payload: LegalPagePayload) =>
  new TextEncoder().encode(JSON.stringify(payload)).length;

const validateDraft = (draft: LegalDraft): LegalDraftErrors => {
  const payload = toPayload(draft);
  const { title, sections } = payload;
  return {
    size:
      requestBytes(payload) <= LEGAL_LIMITS.requestBytes
        ? ""
        : LEGAL_MESSAGES.size,
    title: hasLength(title, LEGAL_LIMITS.title) ? "" : LEGAL_MESSAGES.title,
    sections: hasLength(sections, LEGAL_LIMITS.sections)
      ? ""
      : LEGAL_MESSAGES.sections,
    items: sections.map((section) => ({
      heading: hasLength(section.heading, LEGAL_LIMITS.heading)
        ? ""
        : LEGAL_MESSAGES.heading,
      text:
        hasLength(section.paragraphs, LEGAL_LIMITS.paragraphs) &&
        section.paragraphs.join("").length <= LEGAL_LIMITS.text
          ? ""
          : LEGAL_MESSAGES.text,
    })),
  };
};

const hasErrors = (errors: LegalDraftErrors) =>
  Boolean(
    errors.size ||
      errors.title ||
      errors.sections ||
      errors.items.some((item) => item.heading || item.text)
  );

const isDirty = (draft: LegalDraft, page: LegalPage) =>
  JSON.stringify(toPayload(draft)) !== JSON.stringify(toPayload(toDraft(page)));

const findPlaceholders = (draft: LegalDraft) => {
  const text = [
    draft.title,
    ...draft.sections.flatMap((section) => [section.heading, section.text]),
  ].join("\n");
  return [...new Set(text.match(PLACEHOLDER) || [])];
};

const swappedSections = (sections: LegalSectionDraft[], index: number, offset: number) => {
  const target = index + offset;
  if (target < 0 || target >= sections.length) return sections;
  const moved = sections.slice();
  [moved[index], moved[target]] = [moved[target]!, moved[index]!];
  return moved;
};

const formatUpdatedAt = (value: string | null | undefined): string =>
  value ? moment(value).locale("es").format("D [de] MMMM [de] YYYY") : "";

export const useLegalPagesStore = defineStore("legalPages", () => {
  const page = ref<LegalPage | null>(null);
  const pages = ref<LegalPage[]>([]);
  const drafts = ref<Record<string, LegalDraft>>({});

  const limits = computed(() => LEGAL_LIMITS);
  const dirtySlugs = computed(() =>
    pages.value
      .filter((item) => isDirty(drafts.value[item.slug]!, item))
      .map((item) => item.slug),
  );

  function draftErrors(slug: string): LegalDraftErrors {
    return validateDraft(drafts.value[slug]!);
  }

  function hasDraftErrors(slug: string): boolean {
    return hasErrors(validateDraft(drafts.value[slug]!));
  }

  function placeholders(slug: string): string[] {
    return findPlaceholders(drafts.value[slug]!);
  }

  function resetSession(): void {
    page.value = null;
    pages.value = [];
    drafts.value = {};
  }

  function loadPage(slug: string): Promise<ApiResponse<LegalPage[]>> {
    return request<LegalPage>({ method: "get", url: `public/legal_pages/${slug}` });
  }

  async function loadPages(): Promise<string | null> {
    const response = await request<LegalPage>({ method: "get", url: "legal_pages" });
    if (hasFailed(response)) return response.mensaje;
    pages.value = response.data;
    drafts.value = Object.fromEntries(
      response.data.map((item) => [item.slug, toDraft(item)])
    );
    return null;
  }

  async function savePage(slug: string): Promise<boolean> {
    const response = await request<LegalPage>({
      method: "put",
      url: `legal_pages/${slug}`,
      data: toPayload(drafts.value[slug]!),
    });
    if (!response.estadoflag) {
      Swal.fire({
        icon: response.tipomensaje === "TMSGADV" ? "warning" : "error",
        text: response.mensaje,
      });
      return false;
    }
    const saved = response.data[0]!;
    pages.value = pages.value.map((item) => (item.slug === slug ? saved : item));
    drafts.value[slug] = toDraft(saved);
    notifySuccess(response.mensaje);
    return true;
  }

  function addSection(slug: string): void {
    drafts.value[slug]!.sections.push(emptySection());
  }

  function moveSection({ slug, index, offset }: { slug: string; index: number; offset: number }): void {
    drafts.value[slug]!.sections = swappedSections(
      drafts.value[slug]!.sections,
      index,
      offset
    );
  }

  function resetDraft(slug: string): void {
    drafts.value[slug] = toDraft(
      pages.value.find((item) => item.slug === slug)!
    );
  }

  return {
    page,
    pages,
    drafts,
    limits,
    formatUpdatedAt,
    textLength,
    draftErrors,
    hasDraftErrors,
    dirtySlugs,
    placeholders,
    resetSession,
    loadPage,
    loadPages,
    savePage,
    addSection,
    moveSection,
    resetDraft,
  };
});
