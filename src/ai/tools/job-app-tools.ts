
'use server';

/**
 * @fileOverview Defines Genkit tools for the AI Co-pilot to interact with the application UI.
 */
import { ai } from '@/ai/genkit';
import { z } from 'zod';

export const getFormFields = ai.defineTool(
  {
    name: 'getFormFields',
    description: "Retrieves the current text from the 'jobDescription', 'bio', and 'questions' fields.",
    inputSchema: z.object({}),
    outputSchema: z.object({
      jobDescription: z.string(),
      bio: z.string(),
      questions: z.string(),
    }),
  },
  async () => {
    // This is a placeholder. The actual implementation will be handled on the client-side,
    // which will intercept this tool call and provide the form data.
    return { jobDescription: '', bio: '', questions: '' };
  }
);

export const updateFormFields = ai.defineTool(
  {
    name: 'updateFormFields',
    description: "Updates the text of one or more form fields: 'jobDescription', 'bio', or 'questions'.",
    inputSchema: z.object({
      jobDescription: z.string().optional().describe("The new text for the job description field."),
      bio: z.string().optional().describe("The new text for the bio field."),
      questions: z.string().optional().describe("The new text for the questions field."),
    }),
    outputSchema: z.string(),
  },
  async (fields) => {
    // This is a placeholder. The client-side will intercept this and update the UI.
    // The string returned here will be the AI's response to the user.
    const updatedFields = Object.keys(fields).join(', ');
    return `Okay, I've updated the following fields: ${updatedFields}.`;
  }
);

export const generateJobMaterial = ai.defineTool(
  {
    name: 'generateJobMaterial',
    description: "Triggers the generation of a specific job application material, like a 'coverLetter' or 'cv'.",
    inputSchema: z.object({
      generationType: z
        .enum(['coverLetter', 'cv', 'deepAnalysis', 'qAndA'])
        .describe('The type of material to generate.'),
    }),
    outputSchema: z.string(),
  },
  async ({ generationType }) => {
    // Placeholder. The client-side will intercept this call and trigger the generation.
    return `Sure, I'm generating the ${generationType} for you now.`;
  }
);
