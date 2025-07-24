"use server";

import type { CoverLetterOutput } from '@/ai/flows/generate-cover-letter';
import { generateCoverLetter } from '@/ai/flows/generate-cover-letter';
import type { CvOutput } from '@/ai/flows/generate-cv';
import { generateCv } from '@/ai/flows/generate-cv';
import type { DeepAnalysisOutput } from '@/ai/flows/generate-deep-analysis';
import { generateDeepAnalysis } from '@/ai/flows/generate-deep-analysis';
import { generateQAndA } from '@/ai/flows/generate-q-and-a';
import { reviseResponse } from '@/ai/flows/revise-response';
import type {
  QAndAOutput,
  ReviseResponseData,
  ReviseResponseOutput,
} from '@/lib/schemas';
import { JobApplicationSchema, ReviseResponseSchema } from '@/lib/schemas';

/**
 * Type union for a successful generation response.
 */
export type GenerationResult =
  | CoverLetterOutput
  | CvOutput
  | DeepAnalysisOutput
  | QAndAOutput;

/**
 * Type for an object holding all possible generation results.
 */
export type AllGenerationResults = {
  coverLetter?: CoverLetterOutput;
  cv?: CvOutput;
  deepAnalysis?: DeepAnalysisOutput;
  qAndA?: QAndAOutput;
};

/**
 * A discriminated union for the result of a generation server action.
 */
type GenerateActionResponse =
  | { success: true; data: GenerationResult }
  | { success: false; error: string };

/**
 * A discriminated union for the result of a revision server action.
 */
type ReviseActionResponse =
  | { success: true; data: ReviseResponseOutput }
  | { success: false; error: string };

const SingleGenerationSchema = JobApplicationSchema.pick({
  jobDescription: true,
  bio: true,
  generationType: true,
  questions: true,
});

/**
 * Server Action to generate content based on the specified `generationType`.
 * It validates the input and calls the corresponding Genkit flow.
 *
 * @param rawData - The raw input data from the form.
 * @returns A promise that resolves to a `GenerateActionResponse`.
 */
export async function generateAction(
  rawData: unknown
): Promise<GenerateActionResponse> {
  const validationResult = SingleGenerationSchema.safeParse(rawData);
  if (!validationResult.success) {
    const errorMessage = validationResult.error.issues
      .map((issue) => issue.message)
      .join(' ');
    return { success: false, error: errorMessage || 'Invalid input.' };
  }
  const { jobDescription, bio, generationType, questions } =
    validationResult.data;

  try {
    let response;
    switch (generationType) {
      case 'cv':
        response = await generateCv({ jobDescription, userBio: bio });
        break;
      case 'deepAnalysis':
        response = await generateDeepAnalysis({ jobDescription, userBio: bio });
        break;
      case 'qAndA':
        response = await generateQAndA({
          jobDescription,
          userBio: bio,
          questions,
        });
        break;
      case 'coverLetter':
      default:
        response = await generateCoverLetter({ jobDescription, userBio: bio });
        break;
    }
    return { success: true, data: response };
  } catch (error) {
    console.error(`Error in generateAction for ${generationType}:`, error);
    const errorMessage =
      error instanceof Error ? error.message : 'An unknown error occurred.';
    return {
      success: false,
      error: `Failed to generate ${generationType}: ${errorMessage}.`,
    };
  }
}

/**
 * Server Action to revise previously generated content.
 * It validates the input and calls the revision Genkit flow.
 *
 * @param rawData - The raw input data for the revision.
 * @returns A promise that resolves to a `ReviseActionResponse`.
 */
export async function reviseAction(
  rawData: unknown
): Promise<ReviseActionResponse> {
  const validationResult = ReviseResponseSchema.safeParse(rawData);
  if (!validationResult.success) {
    const errorMessage = validationResult.error.issues
      .map((issue) => issue.message)
      .join(' ');
    return { success: false, error: errorMessage || 'Invalid input for revision.' };
  }

  const validatedData = validationResult.data as ReviseResponseData;
  if (validatedData.generationType === 'cv' || validatedData.generationType === 'deepAnalysis') {
    return {
      success: false,
      error: 'Revision is not supported for this format.',
    };
  }

  const response = await reviseResponse(validatedData);
  return {
    success: true,
    data: response,
  };
}
