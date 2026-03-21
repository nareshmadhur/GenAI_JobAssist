'use server';

/**
 * @fileOverview Defines Genkit tools for the AI Co-pilot to interact with the application UI.
 */
import { ai } from '@/ai/genkit';
import { z } from 'zod';

// By defining tools with a no-op function, we declare them in a way that
// the Genkit flow can generate a tool_request, but the actual execution
// is safely handled by the client application on its own terms.

export const updateFormFields = ai.defineTool({
  name: 'updateFormFields',
  description:
    "Updates the text of one or more form fields: 'jobDescription', 'workRepository', or 'questions'.",
  inputSchema: z.object({
    jobDescription: z
      .string()
      .optional()
      .describe('The new text for the job description field.'),
    workRepository: z.string().optional().describe('The new text for the work repository field.'),
    questions: z
      .string()
      .optional()
      .describe("The new text for the questions field."),
  }),
  outputSchema: z.string(),
}, async () => 'Tool execution handled by client context.');

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
}, async () => 'Tool execution handled by client context.');
