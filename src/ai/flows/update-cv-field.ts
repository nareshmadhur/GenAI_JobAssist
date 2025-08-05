'use server';
/**
 * @fileOverview Updates a specific field in a CV and returns the regenerated CV.
 *
 * - updateCvField - A function that handles updating a field in the CV.
 * - UpdateCvFieldInput - The input type for the updateCvField function.
 * - CvOutput - The return type for the updateCvField function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { CvOutputSchema, type CvOutput, UpdateCvFieldInputSchema, type UpdateCvFieldInput } from '@/lib/schemas';


export async function updateCvField(input: UpdateCvFieldInput): Promise<CvOutput> {
  return updateCvFieldFlow(input);
}

const promptTemplate = `You are an intelligent CV editor. Your task is to update a single field in an existing CV and then return the entire, complete, and valid CV data structure.

**CRITICAL INSTRUCTIONS:**
1.  You will be given an 'existingCv' as a JSON object, a 'fieldToUpdate' key, and a 'newValue'.
2.  Update the value of the specified field within the 'existingCv' object. The 'fieldToUpdate' might be a simple key like "email" or a nested key like "workExperience.0.company".
3.  After updating the single field, you MUST return the **entire, complete, and valid CV object** in the correct JSON format. Do not return only the changed field.
4.  Do not change any other fields. Preserve the rest of the CV data exactly as it was.
5.  Ensure all original fields are present in the final output.

Existing CV Data:
\`\`\`json
__EXISTING_CV_JSON__
\`\`\`

Field to Update: "{{fieldToUpdate}}"
New Value: "{{newValue}}"

Generate the complete, updated CV JSON object now.`;


const updateCvFieldFlow = ai.defineFlow(
  {
    name: 'updateCvFieldFlow',
    inputSchema: UpdateCvFieldInputSchema,
    outputSchema: CvOutputSchema,
  },
  async (input) => {
    // Manually stringify the CV object and inject it into the prompt.
    const cvJsonString = JSON.stringify(input.existingCv, null, 2);
    const finalPrompt = promptTemplate
        .replace('__EXISTING_CV_JSON__', cvJsonString)
        .replace('{{fieldToUpdate}}', input.fieldToUpdate)
        .replace('{{newValue}}', input.newValue);
        
    const { output } = await ai.generate({
      prompt: finalPrompt,
      model: 'googleai/gemini-2.0-flash',
      output: { schema: CvOutputSchema },
    });

    return output!;
  }
);
