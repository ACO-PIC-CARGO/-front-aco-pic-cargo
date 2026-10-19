export interface LegalSection {
  heading: string;
  paragraphs: string[];
}

export interface LegalPage {
  slug: string;
  title: string;
  sections: LegalSection[];
  updated_at: string | null;
}

export interface LegalPagePayload {
  title: string;
  sections: LegalSection[];
}

export interface LegalSectionDraft {
  key: string;
  heading: string;
  text: string;
}

export interface LegalDraft {
  title: string;
  sections: LegalSectionDraft[];
}

export interface LegalSectionErrors {
  heading: string;
  text: string;
}

export interface LegalDraftErrors {
  size: string;
  title: string;
  sections: string;
  items: LegalSectionErrors[];
}

export interface LegalLimits {
  title: number;
  sections: number;
  heading: number;
  paragraphs: number;
  text: number;
  requestBytes: number;
}
