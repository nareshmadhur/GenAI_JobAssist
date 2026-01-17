
'use server';
/**
 * @fileOverview A flow to test the availability of a specific AI model.
 */
import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { googleAI } from '@genkit-ai/google-genai';

const TestModelInputSchema = z.object({
  modelName: z.string().describe('The name of the model to test.'),
});
export type TestModelInput = z.infer<typeof TestModelInputSchema>;

const TestModelOutputSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  model: z.string(),
});
export type TestModelOutput = z.infer<typeof TestModelOutputSchema>;

export async function testModelAvailability(input: TestModelInput): Promise<TestModelOutput> {
    return testModelFlow(input);
}

const testModelFlow = ai.defineFlow(
  {
    name: 'testModelFlow',
    inputSchema: TestModelInputSchema,
    outputSchema: TestModelOutputSchema,
  },
  async ({ modelName }) => {
    try {
      // Construct the fully-qualified model name
      const model = googleAI.model(modelName);

      const { text } = await ai.generate({
        model: model,
        prompt: 'hello',
      });

      return {
        success: true,
        message: `Successfully generated content: "${text()}"`,
        model: modelName,
      };
    } catch (e: any) {
      return {
        success: false,
        message: e.message || 'An unknown error occurred.',
        model: modelName,
      };
    }
  }
);
