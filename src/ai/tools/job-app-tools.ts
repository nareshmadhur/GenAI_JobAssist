
'use server';

/**
 * @fileOverview Defines Genkit tools for the AI Co-pilot to interact with the application UI.
 */
import { ai } from '@/ai/genkit';
import { z } from 'zod';

// By defining tools without a function body, we declare them as "client-side" tools.
// The Genkit flow will generate a tool_request, but the actual execution is handled
// by the client application, which provides the necessary context (like form data).

export const updateFormFields = ai.defineTool({
  name: 'updateFormFields',
  description:
    "Updates the text of one or more form fields: 'jobDescription', 'bio', or 'questions'.",
  inputSchema: z.object({
    jobDescription: z
      .string()
      .optional()
      .describe('The new text for the job description field.'),
    bio: z.string().optional().describe('The new text for the bio field.'),
    questions: z
      .string()
      .optional()
      .describe("The new text for the questions field."),
  }),
  outputSchema: z.string(),
});

export const generateJobMaterial = ai.defineTool({
  name: 'generateJobMaterial',
  description:
    "Triggers the generation of a specific job application material, like a 'coverLetter' or 'cv'.",
  inputSchema: z.object({
    generationType: z
      .enum(['coverLetter', 'cv', 'deepAnalysis', 'qAndA'])
      .describe('The type of material to generate.'),
  }),
  outputSchema: z.string(),
});
