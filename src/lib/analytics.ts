export type AnalyticsEventName =
  | 'prepare_viewed'
  | 'build_viewed'
  | 'continue_to_build'
  | 'fit_summary_generated'
  | 'resume_generated'
  | 'cover_letter_generated'
  | 'answers_generated'
  | 'create_everything_clicked'
  | 'create_everything_completed'
  | 'coach_opened'
  | 'coach_prompt_used'
  | 'job_url_import_success'
  | 'job_url_import_failed'
  | 'application_saved'
  | 'new_job_started'
  | 'tracker_viewed'
  | 'application_status_changed'
  | 'resume_printed'
  | 'cover_letter_printed';

export type AnalyticsPrimitive = string | number | boolean | null;
export type AnalyticsMetadata = Record<string, AnalyticsPrimitive>;

export interface AnalyticsEventInput {
  eventName: AnalyticsEventName;
  userId: string;
  userEmail?: string | null;
  route: string;
  sessionId: string;
  metadata?: AnalyticsMetadata;
}

export interface AnalyticsEventRecord extends AnalyticsEventInput {
  id: string;
  createdAt: Date | null;
}

const ANALYTICS_SESSION_KEY = 'ai_job_assist_analytics_session_id';

export function getAnalyticsSessionId() {
  if (typeof window === 'undefined') {
    return 'server-session';
  }

  const existingId = window.sessionStorage.getItem(ANALYTICS_SESSION_KEY);
  if (existingId) {
    return existingId;
  }

  const nextId = crypto.randomUUID();
  window.sessionStorage.setItem(ANALYTICS_SESSION_KEY, nextId);
  return nextId;
}

export function getOwnerUids() {
  return (process.env.NEXT_PUBLIC_OWNER_UIDS || '')
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean);
}

export function isOwnerUid(uid?: string | null) {
  if (!uid) {
    return false;
  }

  return getOwnerUids().includes(uid);
}

export function getAnalyticsEventLabel(eventName: AnalyticsEventName) {
  switch (eventName) {
    case 'prepare_viewed':
      return 'Prepare Viewed';
    case 'build_viewed':
      return 'Build Viewed';
    case 'continue_to_build':
      return 'Continue To Build';
    case 'fit_summary_generated':
      return 'Fit Summary Generated';
    case 'resume_generated':
      return 'Resume Generated';
    case 'cover_letter_generated':
      return 'Cover Letter Generated';
    case 'answers_generated':
      return 'Answers Generated';
    case 'create_everything_clicked':
      return 'Create Everything Clicked';
    case 'create_everything_completed':
      return 'Create Everything Completed';
    case 'coach_opened':
      return 'Coach Opened';
    case 'coach_prompt_used':
      return 'Coach Prompt Used';
    case 'job_url_import_success':
      return 'Job URL Import Success';
    case 'job_url_import_failed':
      return 'Job URL Import Failed';
    case 'application_saved':
      return 'Application Saved';
    case 'new_job_started':
      return 'New Job Started';
    case 'tracker_viewed':
      return 'Tracker Viewed';
    case 'application_status_changed':
      return 'Application Status Changed';
    case 'resume_printed':
      return 'Resume Printed';
    case 'cover_letter_printed':
      return 'Cover Letter Printed';
    default:
      return eventName;
  }
}
