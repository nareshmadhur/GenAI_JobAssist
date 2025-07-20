# AI Job Assist

This application is an intelligent assistant designed to streamline the job application process. By leveraging Generative AI, it helps users tailor their application materials to specific job descriptions, saving time and improving the quality of their submissions.

## How It Works (For Everyone)

The process is simple:

1.  **Provide a Job Description**: Paste the full text of the job description you are interested in.
2.  **Provide Your Bio**: Paste your resume, a detailed work history, or a personal bio. The more detail you provide, the better the AI's output will be.
3.  **Generate**: The application analyzes both texts and generates several types of content to help you with your application.

### Key Features

-   **Cover Letter**: Generates a professional cover letter that highlights how your experience aligns with the job requirements.
-   **CV (Curriculum Vitae)**: Formats your bio into a clean, well-structured, and professional CV, tailored to the tone of the job description.
-   **Q&A**: Finds explicit questions within the job description and provides answers based on your bio. It highlights any questions it cannot answer, showing you where you might need to add more information.
-   **Deep Analysis**: Offers a detailed report on:
    -   **Key Strengths**: Where your bio directly matches the job's needs.
    -   **Gaps**: Important qualifications mentioned in the job description that are missing from your bio.
    -   **Improvement Areas**: Actionable advice on how to better phrase or quantify the experience already in your bio.
-   **Interactive Revision**: You can ask the AI to revise any generated content (like the Cover Letter or CV) with simple text commands, such as "make it more formal" or "emphasize my project management skills."

---

## Technical Documentation (For Developers)

This project is a modern web application built with a focus on server-side rendering, type safety, and a component-based UI. The AI capabilities are powered by Firebase Genkit.

### Core Technologies

-   **Framework**: **Next.js 15** (using the App Router)
-   **Language**: **TypeScript**
-   **Styling**: **Tailwind CSS**
-   **UI Components**: **ShadCN UI**
-   **Generative AI**: **Firebase Genkit** (with Google's Gemini models)
-   **Form Management**: **React Hook Form** with **Zod** for validation

### Project Structure

```
src
├── app/
│   ├── page.tsx          # Main entry point for the UI
│   ├── layout.tsx        # Root layout
│   └── actions.ts        # Server Actions that call Genkit flows
├── ai/
│   ├── genkit.ts         # Genkit initialization and configuration
│   └── flows/
│       ├── ...           # All Genkit flows (e.g., generate-cv.ts)
├── components/
│   ├── ui/               # Reusable ShadCN UI components
│   └── job-spark-app.tsx # The main application component orchestrating the UI
├── lib/
│   ├── schemas.ts        # Zod schemas for form and API validation
│   └── utils.ts          # Utility functions (e.g., cn for Tailwind)
└── hooks/
    └── ...               # Custom React hooks (e.g., use-toast)
```

### Architectural Decisions & Explanations

#### 1. Next.js App Router and Server Actions

-   **Decision**: The application exclusively uses the Next.js App Router and relies heavily on **Server Actions** (`src/app/actions.ts`).
-   **Reasoning**: This architecture simplifies the stack significantly. Instead of creating traditional API endpoints (`/api/...`) that need to be manually fetched from the client, we can call server-side functions directly from our React components. This reduces boilerplate, improves security by keeping sensitive logic on the server, and allows for seamless data mutations and AI calls without client-side state management complexity.

#### 2. Genkit for AI Logic

-   **Decision**: All AI-powered logic is encapsulated within **Genkit Flows** located in `src/ai/flows/`.
-   **Reasoning**: Genkit provides a structured, observable, and extensible way to interact with large language models.
    -   **Structured IO**: Each flow defines its input and output using Zod schemas. This provides strong type safety and allows the AI model to return structured JSON data, which is far more reliable than parsing plain text.
    -   **Separation of Concerns**: By keeping AI prompts and logic separate from the UI, the application is easier to maintain. Prompt engineering can be done independently of UI development.
    -   **Observability**: Genkit includes a development UI (`genkit start`) for tracing and debugging AI calls, which is invaluable for refining prompts and understanding model behavior.

#### 3. State Management and Data Flow

-   **Decision**: The primary state is managed within the main `JobSparkApp` component (`src/components/job-spark-app.tsx`) using `useState` and `useTransition`. There is no global state manager like Redux or Zustand.
-   **Reasoning**: For an application of this scope, a complex state management library is overkill.
    -   **Form Data**: The user's input (job description and bio) is persisted in `localStorage` to prevent data loss on page refresh.
    -   **AI-Generated Data**: The results from the AI are stored in a single state object (`allResults`). When a user switches tabs, the app first checks if the data for that tab already exists in this object. If not, it triggers a new Server Action to generate it. This lazy-loading approach saves API calls and improves performance.
    -   **`useTransition`**: This React hook is used to handle pending states for server actions. It allows the UI to remain interactive and display loading indicators without blocking the main thread.

#### 4. Rich Text Copy Functionality

-   **Decision**: The "Copy" button uses the `navigator.clipboard.write()` API to place both `text/html` and `text/plain` versions of the content onto the clipboard.
-   **Reasoning**: Simply copying the raw Markdown (`**bold**`) is not user-friendly. Pasting formatted text directly into applications like Microsoft Word or Google Docs is a significant quality-of-life feature. The plain text version is also cleaned of Markdown artifacts, providing a reliable fallback.
