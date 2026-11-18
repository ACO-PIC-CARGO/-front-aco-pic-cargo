export const newNoteToSend = (note: string | null | undefined): string | null => note?.trim() || null;

export const newNoteSaved = ({ estadoflag, notes_saved }: { estadoflag: boolean; notes_saved?: boolean }): boolean =>
  estadoflag && notes_saved !== false;
