import type { CvOutput, DeepAnalysisOutput } from '@/lib/schemas';

export const CV_EXPORT_STORAGE_KEY_PREFIX = 'ai_job_assist_cv_export_';

export interface CvPrintExportPayload {
  cvData: CvOutput;
  jobDescription?: string;
  deepAnalysis?: DeepAnalysisOutput | null;
}

export function openCvPrintExport(payload: CvPrintExportPayload) {
  const exportId = crypto.randomUUID();
  const storageKey = `${CV_EXPORT_STORAGE_KEY_PREFIX}${exportId}`;
  localStorage.setItem(storageKey, JSON.stringify(payload));
  window.open(`/cv/print?exportId=${encodeURIComponent(exportId)}`, '_blank');
}

export function readCvPrintExport(exportId: string): CvPrintExportPayload | null {
  const storageKey = `${CV_EXPORT_STORAGE_KEY_PREFIX}${exportId}`;
  const rawPayload = localStorage.getItem(storageKey) ?? sessionStorage.getItem(storageKey);
  if (!rawPayload) {
    return null;
  }

  const parsed = JSON.parse(rawPayload) as CvPrintExportPayload | CvOutput;
  if ('cvData' in parsed) {
    return parsed;
  }

  return { cvData: parsed };
}

export function clearCvPrintExport(exportId: string) {
  const storageKey = `${CV_EXPORT_STORAGE_KEY_PREFIX}${exportId}`;
  localStorage.removeItem(storageKey);
  sessionStorage.removeItem(storageKey);
}
