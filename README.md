# AI Job Assist

This application is an intelligent assistant designed to streamline the job application process. By leveraging Generative AI, it helps users tailor their application materials to specific job descriptions, saving time and improving the quality of their submissions.

## How It Works

The process is simple:

1.  **Build Your Bio**: Use the dedicated **AI Bio Creator** to build a comprehensive professional bio. You can chat with an AI assistant to add sections, paste your resume for automatic structuring, and track your bio's completeness.
2.  **Provide a Job Description**: In the **Job Matching Assistant**, paste the full text of the job description you are interested in.
3.  **Provide Your Bio**: Load the bio you created.
4.  **Generate**: The application analyzes both texts and generates several types of content to help you with your application.

### Key Features

-   **AI Bio Creator**: A dedicated workspace to build and manage your professional bio. Chat with an AI to add, edit, and structure your information, and track its completeness across key sections (Contact Info, Experience, etc.).
-   **Job Matching Assistant**: The core tool for generating job-specific materials.
    -   **Cover Letter**: Generates a professional cover letter that highlights how your experience aligns with the job requirements.
    -   **CV (Curriculum Vitae)**: Formats your bio into a clean, well-structured, and professional CV, tailored to the tone of the job description. You can edit the generated CV directly in the app.
    -   **Q&A**: Finds explicit questions within the job description and provides answers based on your bio.
    -   **Deep Analysis**: Offers a detailed report on your key strengths, identifies gaps, and provides actionable advice on how to improve your bio for the specific role.
-   **AI Co-pilot**: A conversational sidebar assistant available throughout the app. You can ask it to:
    -   Revise generated content (e.g., "make my cover letter more formal").
    -   Update your bio or the job description directly from the chat.
    -   Trigger new content generation.
    -   The Co-pilot shows its "thinking" process, giving you insight into how it interprets your requests.
-   **Data Persistence**: Log in to save your bios and job applications. Your data is automatically synced across devices, allowing you to pick up where you left off.

---

## Technical Documentation (For Developers)

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
│   ├── page.tsx          # Main entry for the Job Matching Assistant UI
│   ├── bio-creator/      # UI for the AI Bio Creator page
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
│   └── app-context.tsx   # Global React context for managing shared state (auth, data, etc.)
├── lib/
│   ├── firebase.ts       # Firebase SDK initialization
│   ├── firestore-service.ts # Functions for interacting with Firestore
│   ├── schemas.ts        # Zod schemas for form and API validation
│   └── utils.ts          # Utility functions
└── hooks/
    └── ...               # Custom React hooks
`

### Architectural Decisions & Explanations

#### 1. Next.js App Router and Server Actions

-   **Decision**: The application exclusively uses the Next.js App Router and relies heavily on **Server Actions** (`src/app/actions.ts`).
-   **Reasoning**: This architecture simplifies the stack significantly. Instead of creating traditional API endpoints (`/api/...`), we can call server-side functions directly from our React components. This reduces boilerplate and improves security by keeping sensitive logic on the server.

#### 2. Genkit for AI Logic

-   **Decision**: All AI-powered logic is encapsulated within **Genkit Flows** located in `src/ai/flows/`.
-   **Reasoning**: Genkit provides a structured and observable way to interact with large language models.
    -   **Structured I/O**: Each flow defines its input and output using Zod schemas. This provides strong type safety and allows the AI model to return structured JSON data, which is far more reliable than parsing plain text.
    -   **Separation of Concerns**: By keeping AI prompts and logic separate from the UI, the application is easier to maintain. Prompt engineering can be done independently of UI development.
    -   **Observability**: Genkit includes a development UI (`genkit start`) for tracing and debugging AI calls, which is invaluable for refining prompts.

#### 3. Firebase for Authentication and Data Persistence

-   **Decision**: **Firebase Authentication** is used for user sign-up and login. User data (saved jobs and bios) is stored in **Cloud Firestore**.
-   **Reasoning**: This provides a secure, scalable, and fully-managed backend without requiring a custom server.
    -   **Authentication**: Firebase Auth offers a robust, easy-to-implement solution for user management.
    -   **Data Syncing**: Firestore allows for seamless data persistence. When a user logs in, their locally stored data is merged with their Firestore document, enabling them to access their saved work from any device. For users who are not logged in, the application gracefully falls back to using the browser's `localStorage`.

#### 4. AI Co-pilot: Two-Step Enrichment

-   **Decision**: The AI Co-pilot uses a two-step process. First, an "enrichment" flow (`enrich-copilot-prompt.ts`) translates the user's raw query into a context-aware prompt. This is then sent to the main generation flow (`generate-co-pilot-response.ts`).
-   **Reasoning**: This architecture has two main benefits:
    1.  **Higher Quality Responses**: The enrichment step acts as a "planner," ensuring the final AI model has all necessary information to generate a concise, accurate response suitable for the sidebar UI.
    2.  **Improved Transparency**: The enrichment flow also generates a user-facing "thinking" message (e.g., "Okay, planning to rewrite the summary..."). This gives the user insight into the AI's reasoning process.

#### 5. Global State Management with React Context

-   **Decision**: A global state is managed via React Context (`src/context/app-context.tsx`).
-   **Reasoning**: A centralized context is sufficient for this application's needs. It holds shared state like authentication status, user data (`savedJobs`, `savedBios`), and the Co-pilot's `chatHistory`. This avoids prop-drilling and keeps page components cleaner. The context also manages the hybrid data storage strategy, interacting with either Firestore or `localStorage` based on the user's auth state.
