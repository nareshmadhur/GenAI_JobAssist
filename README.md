# AI Job Assist

Welcome to **AI Job Assist**, your intelligent partner for streamlining the job application process. This application leverages cutting-edge Generative AI to help you create polished, tailored application materials that stand out to recruiters, saving you time and dramatically improving the quality of your submissions.

## How It Works: A Guided Journey

The application is designed around a simple, powerful, and intuitive workflow.

1.  **Start on the Main Workspace**: Begin by pasting the full text of a job description you're interested in. This is the context the AI will use for all generations.

2.  **Craft a Perfect Bio**: Your professional bio or resume is the foundation for a great application.
    *   You can paste your existing resume directly into the "Your Bio / Resume" field.
    *   For a truly powerful bio, click **"Launch AI Bio Assistant"**. This opens an interactive chat where an AI coach helps you build a comprehensive bio from scratch, analyzes it for completeness, and helps you refine every section. When you're done, the polished bio is automatically loaded back into the main form.

3.  **Generate Application Materials**: With your job description and bio in place, you can instantly generate a suite of tailored documents with a single click:
    *   **Cover Letter**: A professional cover letter that perfectly aligns your experience with the employer's needs.
    *   **CV (Curriculum Vitae)**: A clean, well-structured CV formatted from your bio. You can even edit the generated CV directly in the app.
    *   **Deep Analysis**: A detailed report on your strengths and weaknesses for the role, with actionable advice for improvement.
    *   **Q&A**: Finds questions within the job description (e.g., "Why are you a good fit?") and provides compelling answers based on your bio.

4.  **Refine and Apply**: Review the generated content, make any final edits directly in the app, and you're ready to apply with confidence.

## Key Features

-   **Integrated AI Bio Assistant**: A dedicated, modal-based chat experience to build and refine your professional bio, complete with a progress tracker.
-   **One-Click Generation**: Instantly create a Cover Letter, CV, Deep Analysis, and Q&A from a single workspace.
-   **In-App CV Editor**: Modify your generated CV directly within the application. Make quick changes to job titles, responsibilities, and skills without needing an external editor.
-   **AI Co-pilot**: A conversational sidebar assistant available throughout the app. Ask it to revise content, update your bio, or trigger new generations.
-   **Data Persistence with Firebase**: Log in to save your bios and job applications securely. Your data is automatically synced across devices. Anonymous users can enjoy a limited number of free queries with their session saved locally.

---

## Technical Documentation

This project is a modern web application built with a focus on server-side rendering, type safety, and a component-based UI. The AI capabilities are powered by Firebase Genkit.

### Core Technologies

-   **Framework**: **Next.js 15** (using the App Router)
-   **Language**: **TypeScript**
-   **Styling**: **Tailwind CSS**
-   **UI Components**: **ShadCN UI**
-   **Generative AI**: **Firebase Genkit** (with Google's Gemini models)
-   **Authentication**: **Firebase Authentication**
-   **Database**: **Cloud Firestore** (for user data persistence)
-   **Form Management**: **React Hook Form** with **Zod** for validation

### Project Structure

`
src
├── app/
│   ├── page.tsx          # Main welcome/landing page
│   ├── job-matcher/      # The primary workspace for the application
│   ├── login/            # UI for the login/signup page
│   ├── layout.tsx        # Root layout
│   └── actions.ts        # Server Actions that call Genkit flows
├── ai/
│   ├── genkit.ts         # Genkit initialization and configuration
│   └── flows/
│       ├── ...           # All Genkit flows (e.g., generate-cv.ts)
├── components/
│   ├── ui/               # Reusable ShadCN UI components
│   └── co-pilot-sidebar.tsx # The main component for the AI Co-pilot
├── context/
│   └── app-context.tsx   # Global React context for managing shared state
├── lib/
│   ├── firebase.ts       # Firebase SDK initialization
│   ├── firestore-service.ts # Functions for interacting with Firestore
│   └── schemas.ts        # Zod schemas for form and API validation
└── hooks/
    └── ...               # Custom React hooks
`
