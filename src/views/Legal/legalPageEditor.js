export const LEGAL_LIMITS = {
  title: 120,
  sections: 40,
  heading: 150,
  paragraphs: 20,
  text: 6000,
  // The API rejects JSON bodies over 100 KB.
  requestBytes: 90000,
};

export const LEGAL_MESSAGES = {
  title: "Escribe un título de hasta 120 caracteres.",
  sections: "Agrega entre 1 y 40 secciones.",
  heading: "Cada sección necesita un título de hasta 150 caracteres.",
  text: "Cada sección necesita texto: hasta 20 párrafos y 6000 caracteres.",
  size: "La página es demasiado larga para guardarla. Acórtala a unos 90 000 caracteres en total.",
};

const PLACEHOLDER = /\[[^\]\n]{1,60}\]/g;
let lastKey = 0;
const nextKey = () => `section-${(lastKey += 1)}`;

export const splitParagraphs = (text) =>
  text
    .split(/\n\s*\n/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);

export const textLength = (text) =>
  splitParagraphs(text).reduce(
    (total, paragraph) => total + paragraph.length,
    0
  );

export const emptySection = () => ({ key: nextKey(), heading: "", text: "" });

export const toDraft = (page) => ({
  title: page.title,
  sections: page.sections.map((section) => ({
    key: nextKey(),
    heading: section.heading,
    text: section.paragraphs.join("\n\n"),
  })),
});

export const toPayload = (draft) => ({
  title: draft.title.trim(),
  sections: draft.sections.map((section) => ({
    heading: section.heading.trim(),
    paragraphs: splitParagraphs(section.text),
  })),
});

const hasLength = (value, max) => value.length >= 1 && value.length <= max;

const requestBytes = (payload) =>
  new TextEncoder().encode(JSON.stringify(payload)).length;

export const validateDraft = (draft) => {
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

export const hasErrors = (errors) =>
  Boolean(
    errors.size ||
      errors.title ||
      errors.sections ||
      errors.items.some((item) => item.heading || item.text)
  );

export const isDirty = (draft, page) =>
  JSON.stringify(toPayload(draft)) !== JSON.stringify(toPayload(toDraft(page)));

export const findPlaceholders = (draft) => {
  const text = [
    draft.title,
    ...draft.sections.flatMap((section) => [section.heading, section.text]),
  ].join("\n");
  return [...new Set(text.match(PLACEHOLDER) || [])];
};

export const moveSection = (sections, index, offset) => {
  const target = index + offset;
  if (target < 0 || target >= sections.length) return sections;
  const moved = sections.slice();
  [moved[index], moved[target]] = [moved[target], moved[index]];
  return moved;
};

export const formatUpdatedAt = (value) =>
  value
    ? new Date(value).toLocaleDateString("es", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : "";
