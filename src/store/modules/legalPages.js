import Swal from "sweetalert2";
import moment from "moment";
import { hasFailed, notifySuccess, request } from "@/store/request";

const LEGAL_LIMITS = {
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

const splitParagraphs = (text) =>
  text
    .split(/\n\s*\n/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);

const textLength = (text) =>
  splitParagraphs(text).reduce(
    (total, paragraph) => total + paragraph.length,
    0
  );

const emptySection = () => ({ key: nextKey(), heading: "", text: "" });

const toDraft = (page) => ({
  title: page.title,
  sections: page.sections.map((section) => ({
    key: nextKey(),
    heading: section.heading,
    text: section.paragraphs.join("\n\n"),
  })),
});

const toPayload = (draft) => ({
  title: draft.title.trim(),
  sections: draft.sections.map((section) => ({
    heading: section.heading.trim(),
    paragraphs: splitParagraphs(section.text),
  })),
});

const hasLength = (value, max) => value.length >= 1 && value.length <= max;

const requestBytes = (payload) =>
  new TextEncoder().encode(JSON.stringify(payload)).length;

const validateDraft = (draft) => {
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

const hasErrors = (errors) =>
  Boolean(
    errors.size ||
      errors.title ||
      errors.sections ||
      errors.items.some((item) => item.heading || item.text)
  );

const isDirty = (draft, page) =>
  JSON.stringify(toPayload(draft)) !== JSON.stringify(toPayload(toDraft(page)));

const findPlaceholders = (draft) => {
  const text = [
    draft.title,
    ...draft.sections.flatMap((section) => [section.heading, section.text]),
  ].join("\n");
  return [...new Set(text.match(PLACEHOLDER) || [])];
};

const moveSection = (sections, index, offset) => {
  const target = index + offset;
  if (target < 0 || target >= sections.length) return sections;
  const moved = sections.slice();
  [moved[index], moved[target]] = [moved[target], moved[index]];
  return moved;
};

const formatUpdatedAt = (value) =>
  value ? moment(value).locale("es").format("D [de] MMMM [de] YYYY") : "";

const state = {
  page: null,
  pages: [],
  drafts: {},
};

const getters = {
  limits: () => LEGAL_LIMITS,
  formatUpdatedAt: () => formatUpdatedAt,
  textLength: () => textLength,
  draftErrors: (state) => (slug) => validateDraft(state.drafts[slug]),
  hasDraftErrors: (state) => (slug) =>
    hasErrors(validateDraft(state.drafts[slug])),
  dirtySlugs: (state) =>
    state.pages
      .filter((page) => isDirty(state.drafts[page.slug], page))
      .map((page) => page.slug),
  placeholders: (state) => (slug) => findPlaceholders(state.drafts[slug]),
};

const mutations = {
  SET_PAGE(state, page) {
    state.page = page;
  },
  SET_PAGES(state, pages) {
    state.pages = pages;
    state.drafts = Object.fromEntries(
      pages.map((page) => [page.slug, toDraft(page)])
    );
  },
  SET_SAVED_PAGE(state, { slug, page }) {
    state.pages = state.pages.map((item) => (item.slug === slug ? page : item));
    state.drafts[slug] = toDraft(page);
  },
  RESET_DRAFT(state, slug) {
    state.drafts[slug] = toDraft(
      state.pages.find((page) => page.slug === slug)
    );
  },
  SET_DRAFT_TITLE(state, { slug, title }) {
    state.drafts[slug].title = title;
  },
  ADD_SECTION(state, slug) {
    state.drafts[slug].sections.push(emptySection());
  },
  SET_SECTION(state, { slug, index, section }) {
    state.drafts[slug].sections.splice(index, 1, section);
  },
  MOVE_SECTION(state, { slug, index, offset }) {
    state.drafts[slug].sections = moveSection(
      state.drafts[slug].sections,
      index,
      offset
    );
  },
  REMOVE_SECTION(state, { slug, index }) {
    state.drafts[slug].sections.splice(index, 1);
  },
};

const actions = {
  loadPage(_, slug) {
    return request({ method: "get", url: `public/legal_pages/${slug}` });
  },
  async loadPages({ commit }) {
    const response = await request({ method: "get", url: "legal_pages" });
    if (hasFailed(response)) return response.mensaje;
    commit("SET_PAGES", response.data);
    return null;
  },
  async savePage({ state, commit }, slug) {
    const response = await request({
      method: "put",
      url: `legal_pages/${slug}`,
      data: toPayload(state.drafts[slug]),
    });
    if (!response.estadoflag) {
      Swal.fire({
        icon: response.tipomensaje === "TMSGADV" ? "warning" : "error",
        text: response.mensaje,
      });
      return false;
    }
    commit("SET_SAVED_PAGE", { slug, page: response.data[0] });
    notifySuccess(response.mensaje);
    return true;
  },
};

export default {
  namespaced: true,
  state,
  getters,
  mutations,
  actions,
};
