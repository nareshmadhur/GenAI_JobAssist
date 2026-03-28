import type { CvOutput } from '@/lib/schemas';

export const CV_EXPORT_SESSION_KEY_PREFIX = 'ai_job_assist_cv_export_';

export function openCvPrintExport(cvData: CvOutput) {
  const exportId = crypto.randomUUID();
  const storageKey = `${CV_EXPORT_SESSION_KEY_PREFIX}${exportId}`;
  sessionStorage.setItem(storageKey, JSON.stringify(cvData));
  window.open(`/cv/print?exportId=${encodeURIComponent(exportId)}`, '_blank');
}

export function readCvPrintExport(exportId: string): CvOutput | null {
  const storageKey = `${CV_EXPORT_SESSION_KEY_PREFIX}${exportId}`;
  const rawPayload = sessionStorage.getItem(storageKey);
  if (!rawPayload) {
    return null;
  }

  sessionStorage.removeItem(storageKey);
  return JSON.parse(rawPayload) as CvOutput;
}
