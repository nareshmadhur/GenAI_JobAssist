# AI Job Assist

AI Job Assist is a production-oriented job application workspace built with Next.js, Firebase, and Genkit. It helps applicants turn a reusable Work Repository plus a target job description into a tailored application package: fit analysis, resume, cover letter, interview answers, and tracked applications.

## What The Product Does

The product follows a 2-stage journey:

1. `Prepare`
2. `Build Your Application`

In `Prepare`, the user adds:
- a target job description
- a reusable Work Repository
- optional application questions

In `Build Your Application`, the user can:
- open or generate a `Fit Summary`
- build a `Resume`
- write a `Cover Letter`
- prepare `Answers`
- use the inline `AI Coach` to decide what to do next or close specific gaps

The app also includes an `Application Tracker` with Kanban and list views, guest local saving, account-backed sync via Firebase, and a print-friendly resume export flow.

## Current Product Capabilities

### Build Flow
- Retrieval-first behavior: if a result already exists, opening it does not regenerate it
- `Create Everything for Me` only fills missing sections
- Regeneration is explicit and happens inside the selected result view
- Build page includes an inline AI Coach entry plus the global coach trigger

### Fit Summary
- Applicant-facing fit snapshot
- grouped requirement analysis by category
- collapsible accordions, folded by default
- direct AI Coach handoff for important gaps

### AI Coach
- contextual coaching based on the active job description and Work Repository
- can advise, update fields, and trigger generation flows
- unread reply badge on the floating trigger
- shortened visible prompts for gap coaching, with structured hidden context behind the scenes

### Application Tracker
- Kanban view with four visible stages:
  - `Drafts`
  - `Applied`
  - `In Process`
  - `Accepted / Rejected`
- drag-and-drop movement in Kanban
- list view fallback
- deep-linking back into the build flow via `jobId`

### Resume Export
- browser-print based export
- dedicated print template
- session-backed export payloads instead of large query-string payloads

## Tech Stack

- `Next.js 14` with App Router
- `React 18`
- `TypeScript`
- `Tailwind CSS`
- `Firebase Auth`
- `Firestore`
- `Genkit`
- `Google Gemini`
- `Radix UI`
- `dnd-kit`
- `Jest` + `Testing Library`

## Key Routes

| Route | Purpose |
|---|---|
| `/` | Landing page |
| `/job-matcher` | Main prepare/build workflow |
| `/admin` | Application Tracker |
| `/cv/print` | Print-optimized resume export route |
| `/login` | Authentication |

Deep links:
- `/job-matcher?jobId=<id>` loads a saved application into the build flow
- `/admin?from=build&jobId=<id>` preserves return context back to the active application

## Architecture Overview

```text
src/
├── app/
│   ├── page.tsx
│   ├── job-matcher/page.tsx
│   ├── admin/page.tsx
│   ├── cv/print/page.tsx
│   ├── login/page.tsx
│   ├── actions.ts
│   ├── layout.tsx
│   └── globals.css
├── ai/
│   ├── genkit.ts
│   ├── dev.ts
│   ├── flows/
│   └── tools/
├── components/
├── context/
│   └── app-context.tsx
└── lib/
    ├── schemas.ts
    ├── firestore-service.ts
    ├── firebase.ts
    └── cv-export.ts
```

Important runtime responsibilities:
- `src/app/job-matcher/page.tsx`: main product journey and generation orchestration
- `src/components/output-view.tsx`: result rendering, fit analysis, revision UI
- `src/context/app-context.tsx`: auth, saved jobs, coach state, unread coach count
- `src/app/admin/page.tsx`: tracker, drag/drop, contextual back navigation

## AI Flows

Core flows live in `src/ai/flows/` and are invoked through `src/app/actions.ts`.

Primary flows:
- `generate-deep-analysis.ts`
- `generate-cv.ts`
- `generate-cover-letter.ts`
- `generate-q-and-a.ts`
- `generate-interview-prep.ts`
- `revise-response.ts`
- `fill-qa-gap.ts`
- `generate-co-pilot-response.ts`
- `enrich-copilot-prompt.ts`
- `extract-job-details.ts`
- `prettify-work-repository.ts`

Client-side tool bridge:
- `updateFormFields`
- `generateJobMaterial`

## Data Model

### `JobApplicationData`

```ts
{
  jobDescription: string
  workRepository: string
  questions?: string
  generationType: 'cv' | 'coverLetter' | 'qAndA' | 'deepAnalysis'
}
```

### `SavedJob`

```ts
{
  id: string
  companyName: string
  jobTitle: string
  status?: 'draft' | 'applied' | 'in_process' | 'accepted' | 'rejected' | 'interviewing' | 'offer'
  formData: {
    jobDescription: string
    workRepository: string
    questions?: string
  }
  allResults: AllGenerationResults
  savedAt: string
}
```

Notes:
- legacy tracker statuses like `interviewing` and `offer` are normalized in the current UI
- guest users save locally first; signed-in users sync through Firestore

## Local Development

### Prerequisites

- Node.js `18+`
- Firebase project with Auth and Firestore enabled
- Google AI Studio API key for Gemini

### Install

```bash
npm install
```

### Create `.env.local`

Create a `.env.local` file in the project root with:

```bash
GOOGLE_GENAI_API_KEY=your_google_genai_api_key
NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_firebase_auth_domain
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_firebase_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_firebase_storage_bucket
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_firebase_messaging_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_firebase_app_id
```

There is currently no committed `.env.local.example`, so create the file manually.

### Run The App

```bash
npm run dev
```

App URL:
- [http://localhost:9002](http://localhost:9002)

Optional Genkit dev server:

```bash
npm run genkit:dev
```

## Quality Checks

Run these before shipping:

```bash
npm run typecheck
npm run lint
npm test -- --runInBand
```

## Production Readiness Notes

This repo is now aligned around the current product shape, but productionizing should still include:
- real environment management and secret handling
- Firebase security rules review
- analytics and error monitoring
- deployment configuration
- rate limiting / abuse protection for AI endpoints
- stronger test coverage around the build flow, tracker movement, and export path

## Current Naming Conventions

Use these terms consistently:
- `Work Repository`
- `Prepare`
- `Build Your Application`
- `Fit Summary`
- `Resume`
- `Cover Letter`
- `Answers`
- `AI Coach`
- `Application Tracker`

Avoid older naming in new code or docs:
- `Application Studio`
- `Results Workspace`
- `Overview`
- `Documents & Answers`
- `bio`

## Additional Docs

- [User Journey](docs/user-journey.md)
