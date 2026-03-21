# AI Job Assist 🤖

An intelligent, end-to-end job application assistant powered by **Google Gemini** and **Firebase Genkit**. AI Job Assist helps you craft tailored CVs, cover letters, strategic role analyses, and interview preparation materials — all from a single, unified workspace.

---

## Table of Contents

1. [Overview](#overview)
2. [Features](#features)
3. [Architecture](#architecture)
4. [AI Flows](#ai-flows)
5. [Data Model](#data-model)
6. [Pages & Routes](#pages--routes)
7. [Key Components](#key-components)
8. [Setup & Running Locally](#setup--running-locally)
9. [Environment Variables](#environment-variables)
10. [Development Roadmap](#development-roadmap)

---

## Overview

AI Job Assist is designed around a core philosophy: **give the AI high-quality, well-structured input to get premium output**. The application acts as a personal career co-pilot, enabling you to:

- Maintain a comprehensive **Work Repository** (your complete professional history, structured for AI extraction)
- Paste or extract any job description
- Generate fully tailored application materials in seconds
- Track your entire job pipeline in a Kanban-style **Application Tracker**
- Get real-time coaching from an **AI Co-pilot** sidebar

The app is built with **Next.js 14 (App Router)**, **Firebase (Auth + Firestore)**, and **Google Genkit** for orchestrating Gemini model calls.

---

## Features

### 🗃️ Work Repository
- Paste raw experience notes and let AI prettify them into a structured, data-dense format
- The format prioritizes machine readability (`## Experience / ### Role | Company | Date`) over visual aesthetics, ensuring all downstream generation tools extract maximum detail
- Built-in AI Assistant modal for interactive refinement and guided building
- Expandable in-place preview with scrollable Markdown rendering

### 📋 Job Description Input
- Paste raw text directly
- **Extract from URL**: enter a job posting URL and the app fetches and parses the text automatically
- Clipboard paste button for single-click population

### 🤖 Application Studio (4 Generation Modes)
Each is a Genkit flow that receives your Job Description + Work Repository as context:

| Mode | Description |
|---|---|
| **ATS-Optimized Resume** | Generates a full CV in a structured format, editable field-by-field |
| **Tailored Cover Letter** | A persuasive, role-specific cover letter |
| **Interview Simulator** | Generates likely interview Q&As based on JD + your experience |
| **Strategic Role Analysis** | Deep-dives on fit, gaps, growth potential, and negotiation points |

### 📊 Application Tracker
- **Kanban board** (Drafts → Applied → Interviewing → Offer → Closed)
- **List view** with search and sort
- Each saved application stores the JD, Work Repository, and all generated artifacts
- "Open in Studio" loads everything back instantly for editing or regeneration

### 🧠 AI Co-pilot Sidebar
- Persistent chat interface available across all pages
- Context-aware: knows your current Job Description and Work Repository
- Can execute tool calls: update form fields, trigger generation types, provide coaching
- Two-step reasoning: enriches prompts before calling Gemini for higher quality responses

### 📄 CV Editor & Print
- Full in-app CV editor after generation
- Field-by-field AI revision assistant
- Clean print/PDF export view at `/cv/print`

---

## Architecture

```
src/
├── app/                     # Next.js App Router pages
│   ├── page.tsx             # Landing / Home page
│   ├── job-matcher/         # Application Studio (main workspace)
│   ├── admin/               # Application Tracker (Kanban + List)
│   ├── cv/print/            # Print-optimized CV view
│   ├── login/               # Auth page
│   ├── layout.tsx           # Root layout with providers
│   ├── globals.css          # Global styles + Markdown prose system
│   └── actions.ts           # Next.js Server Actions (AI call gateway)
│
├── ai/
│   ├── genkit.ts            # Genkit + Gemini plugin initialization
│   └── flows/               # 18 Genkit AI flows (see below)
│
├── components/
│   ├── input-form.tsx       # Main data entry form
│   ├── expandable-textarea.tsx  # Reusable Markdown preview + edit modal
│   ├── output-view.tsx      # Renders all generation results
│   ├── bio-creator-modal.tsx    # AI-assisted Work Repository builder
│   ├── co-pilot-sidebar.tsx     # AI chat sidebar
│   ├── saved-jobs-carousel.tsx  # Saved application cards
│   └── cv-view.tsx          # Editable CV display
│
├── context/
│   └── app-context.tsx      # Global state: auth, Co-pilot, saved jobs/repos
│
└── lib/
    ├── schemas.ts           # Zod schemas + TypeScript types
    ├── firestore-service.ts # Firestore CRUD operations
    ├── firebase.ts          # Firebase client initialization
    └── extract-url.ts       # URL fetching + HTML → text extraction
```

---

## AI Flows

All flows live in `src/ai/flows/` and are called from `src/app/actions.ts` (Server Actions).

| Flow File | Purpose | Input | Output |
|---|---|---|---|
| `generate-cv.ts` | Creates full ATS-optimized CV | JD + Work Repository | Structured CV object |
| `generate-cover-letter.ts` | Tailored persuasive letter | JD + Work Repository | Cover letter text |
| `generate-q-and-a.ts` | Interview Q&A pairs | JD + Work Repository + questions | Q&A list |
| `generate-deep-analysis.ts` | Strategic role/fit analysis | JD + Work Repository | Analysis sections |
| `prettify-work-repository.ts` | Structures raw experience text | Raw notes | Hierarchical Markdown |
| `analyze-job-description.ts` | Extracts key role details | JD text | Skills, level, type |
| `analyze-bio-completeness.ts` | Completeness score for Work Repo | Work Repository | Score + suggestions |
| `revise-cv-field.ts` | AI field-level CV revision | Field + context | Revised field text |
| `revise-response.ts` | Revises any generation output | Previous output + instruction | Revised output |
| `fill-qa-gap.ts` | Generates missing Q&A answers | Q + context | Answer text |
| `generate-bio-chat-response.ts` | Guides Work Repository building | Chat history + context | Chat reply |
| `generate-co-pilot-response.ts` | Main Co-pilot reasoning engine | Enriched prompt | Response + tool calls |
| `enrich-copilot-prompt.ts` | Enriches raw user message | History + form context | Enriched prompt |
| `extract-job-details.ts` | Pulls job title + company | JD text | `{jobTitle, companyName}` |
| `filter-bio-information.ts` | Selects relevant experience | Work Repository + JD | Filtered experience |
| `generate-learning-path.ts` | Suggests upskilling resources | Gap analysis | Learning plan |
| `list-models.ts` | Lists available Gemini models | — | Model list |
| `test-model-availability.ts` | Tests model connectivity | — | Status |

### Flow Architecture Pattern

Every flow follows the same Genkit pattern:

```typescript
// 1. Define input/output schemas with Zod
const InputSchema = z.object({ ... });
const OutputSchema = z.object({ ... });

// 2. Define the flow
export const myFlow = ai.defineFlow(
  { name: 'myFlow', inputSchema: InputSchema, outputSchema: OutputSchema },
  async (input) => {
    const { output } = await ai.generate({
      prompt: `...`,
      output: { schema: OutputSchema },
    });
    return output!;
  }
);
```

---

## Data Model

Defined in `src/lib/schemas.ts`:

### `JobApplicationData`
The form state for the Application Studio:
```typescript
{
  jobDescription: string;    // Full JD text or extracted from URL
  workRepository: string;    // Structured professional history (Markdown)
  questions: string;         // Specific interview questions for Q&A mode
  generationType: 'cv' | 'coverLetter' | 'qAndA' | 'deepAnalysis';
}
```

### `SavedJob`
Stored in Firestore / localStorage under `savedJobs`:
```typescript
{
  id: string;           // UUID
  jobTitle: string;     // AI-extracted from JD
  companyName: string;  // AI-extracted from JD
  formData: { jobDescription, workRepository, questions };
  allResults: AllGenerationResults;   // All generated artifacts
  savedAt: string;      // ISO timestamp
  status: 'draft' | 'applied' | 'interviewing' | 'offer' | 'rejected';
}
```

### `SavedRepository`
Work Repository entries, stored separately for reuse across applications:
```typescript
{
  id: string;
  name: string;
  content: string;  // Structured Markdown
  savedAt: string;
}
```

---

## Pages & Routes

| Route | Component | Description |
|---|---|---|
| `/` | `page.tsx` | Landing page with feature cards |
| `/job-matcher` | `job-matcher/page.tsx` | Main Application Studio workspace |
| `/admin` | `admin/page.tsx` | Application Tracker (Kanban + List) |
| `/cv/print` | `cv/print/page.tsx` | Print-optimized CV for PDF export |
| `/login` | `login/page.tsx` | Firebase Auth (email/password) |

### URL Parameter Support
- `/job-matcher?jobId=<uuid>` — Automatically loads a saved application from the Tracker into the Studio for editing or regeneration

---

## Key Components

### `ExpandableTextarea`
The core input widget used for both Job Description and Work Repository. Features:
- **Collapsed view**: 320px scrollable Markdown preview using `ReactMarkdown`
- **Modal editor**: Large (max 90vh, 4xl wide) dialog with:
  - **Edit Text** tab: Full-height raw textarea
  - **Preview Formatting** tab *(Work Repository only)*: Rendered Markdown preview
- Configurable action button (AI Prettify / Extract from URL)
- `showTabs` prop to toggle tabbed interface (JD has tabs disabled)

### `InputForm`
Assembles the main data entry form:
- Job Description: `ExpandableTextarea` + URL extraction + clipboard paste
- Work Repository: `ExpandableTextarea` + AI Prettify + AI Assistant + clipboard paste
- Specific Questions: standard textarea with clipboard paste

### `AppContext` (Global State)
Manages the entire application state tree:
- **Auth**: Firebase user state, login/signup/logout
- **Saved Jobs**: synced to Firestore (logged in) or localStorage (guest)
- **Saved Repositories**: user's Work Repository library
- **Co-pilot**: chat history, message submission, tool execution
- **Tool Context**: bridge between Co-pilot and the active form page

### `CoPilotSidebar`
A two-step AI reasoning chain:
1. `enrichCopilotPrompt` → adds JD/Work Repo context to the raw user message
2. `generateCoPilotResponse` → generates the final response, optionally calling tools
3. Tools available: `updateFormFields`, `generateJobMaterial`

---

## Setup & Running Locally

### Prerequisites
- Node.js 18+
- A Firebase project (Auth + Firestore enabled)
- A Google AI API key (for Gemini)

### Installation

```bash
git clone <repo-url>
cd GenAI_JobAssist
npm install
```

### Configure Environment

Copy `.env.local.example` to `.env.local` and fill in:

```bash
cp .env.local.example .env.local
```

### Run Development Server

```bash
npm run dev
```

The app will be available at `http://localhost:9002`.

---

## Environment Variables

| Variable | Description |
|---|---|
| `GOOGLE_GENAI_API_KEY` | Gemini API key from [Google AI Studio](https://aistudio.google.com/) |
| `NEXT_PUBLIC_FIREBASE_API_KEY` | Firebase project API key |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | Firebase auth domain |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | Firebase project ID |
| `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` | Firebase storage bucket |
| `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | Firebase messaging sender ID |
| `NEXT_PUBLIC_FIREBASE_APP_ID` | Firebase app ID |

---

## Development Roadmap

### ✅ Sprint 1 — Seamless Input & Prettification *(Complete)*
- Work Repository paradigm (renamed from Bio)
- Clipboard paste buttons across all input fields
- AI-powered Prettify & Structure for Work Repository
- URL extraction with smarter UX
- Premium editing modals with Markdown preview
- Dark mode safe Markdown rendering
- Application Tracker "Open in Studio" deep-link fix

### 🔜 Sprint 2 — Strategic Interviewer & Orchestration
- Interview Prep Guide (gap analysis + actionable study tips)
- Integrated tips in the Interview Simulator flow
- "Generate All" button in the Application Studio

### 📅 Sprint 3 — Cost-Efficiency & Traceability
- Model-switching strategy (Gemini Flash for low-cost tasks, Pro for deep analysis)
- LangGraph integration for complex, multi-step generation cycles
- Basic observability setup (logging + tracing for AI calls)

---

*Built with ❤️ using Next.js · Firebase · Google Gemini · Genkit*
