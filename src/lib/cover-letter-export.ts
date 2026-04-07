export const COVER_LETTER_EXPORT_STORAGE_KEY_PREFIX = 'ai_job_assist_cover_letter_export_';

export interface CoverLetterPrintExportPayload {
  coverLetter: string;
}

export function openCoverLetterPrintExport(payload: CoverLetterPrintExportPayload) {
  const exportId = crypto.randomUUID();
  const storageKey = `${COVER_LETTER_EXPORT_STORAGE_KEY_PREFIX}${exportId}`;
  localStorage.setItem(storageKey, JSON.stringify(payload));
  window.open(`/cover-letter/print?exportId=${encodeURIComponent(exportId)}`, '_blank');
}

export function readCoverLetterPrintExport(exportId: string): CoverLetterPrintExportPayload | null {
  const storageKey = `${COVER_LETTER_EXPORT_STORAGE_KEY_PREFIX}${exportId}`;
  const rawPayload = localStorage.getItem(storageKey) ?? sessionStorage.getItem(storageKey);
  if (!rawPayload) {
    return null;
  }

  return JSON.parse(rawPayload) as CoverLetterPrintExportPayload;
}

export function clearCoverLetterPrintExport(exportId: string) {
  const storageKey = `${COVER_LETTER_EXPORT_STORAGE_KEY_PREFIX}${exportId}`;
  localStorage.removeItem(storageKey);
  sessionStorage.removeItem(storageKey);
}
