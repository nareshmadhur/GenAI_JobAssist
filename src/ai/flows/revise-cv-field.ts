'use server';

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const ReviseCvFieldSchema = z.object({
  originalText: z.string(),
  instruction: z.string().optional(),
  fieldName: z.string(),
});

const ReviseCvFieldOutputSchema = z.object({
  revisedText: z.string()
});

export type ReviseCvFieldInput = z.infer<typeof ReviseCvFieldSchema>;
export type ReviseCvFieldOutput = z.infer<typeof ReviseCvFieldOutputSchema>;

export async function reviseCvField(
  input: ReviseCvFieldInput
): Promise<ReviseCvFieldOutput> {
  return reviseCvFieldFlow(input);
}

const prompt = ai.definePrompt({
  name: 'reviseCvFieldPrompt',
  input: { schema: ReviseCvFieldSchema },
  prompt: `You are an expert resume writer. The user wants to improve a specific field in their CV.

Field Name: {{fieldName}}
Current Text:
"{{originalText}}"

{{#if instruction}}
User Instruction: "{{instruction}}"
{{/if}}

Please revise the "Current Text" to be more professional, impactful, and concise. 
If a "User Instruction" is provided, obey it closely.
Do NOT use markdown (like bold or italics) unless the original text had it. Just return the plain text suitable for a resume.`,
});

const reviseCvFieldFlow = ai.defineFlow(
  {
    name: 'reviseCvFieldFlow',
    inputSchema: ReviseCvFieldSchema,
    outputSchema: ReviseCvFieldOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input, {
      output: { schema: ReviseCvFieldOutputSchema },
    });
    return output!;
  }
);
