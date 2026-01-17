
'use server';
/**
 * @fileOverview A flow to list available Google AI models.
 */
import { ai } from '@/ai/genkit';
import { z } from 'zod';

const ListModelsOutputSchema = z.object({
  models: z.array(z.string()).describe('A list of available model names.'),
});
export type ListModelsOutput = z.infer<typeof ListModelsOutputSchema>;

export async function listAvailableModels(): Promise<ListModelsOutput> {
    return listModelsFlow();
}

const listModelsFlow = ai.defineFlow(
  {
    name: 'listModelsFlow',
    outputSchema: ListModelsOutputSchema,
  },
  async () => {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY is not set in the environment.');
    }
    
    try {
      // Using v1beta as the error messages suggest that's the current API version being hit.
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`
      );
      if (!response.ok) {
        const errorBody = await response.json();
        throw new Error(`Failed to list models: ${errorBody.error?.message || response.statusText}`);
      }
      const data = await response.json();
      // Extract just the names, e.g., "models/gemini-1.5-flash-latest"
      const modelNames = data.models.map((model: any) => model.name);
      return { models: modelNames };
    } catch (e: any) {
      throw new Error(`An unexpected error occurred while fetching models: ${e.message}`);
    }
  }
);
