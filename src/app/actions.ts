
"use server";

import type { CoverLetterOutput } from '@/ai/flows/generate-cover-letter';
import { generateCoverLetter } from '@/ai/flows/generate-cover-letter';
import { generateCv } from '@/ai/flows/generate-cv';
import type { DeepAnalysisOutput } from '@/ai/flows/generate-deep-analysis';
import { generateDeepAnalysis } from '@/ai/flows/generate-deep-analysis';
import { generateQAndA } from '@/ai/flows/generate-q-and-a';
import { reviseResponse } from '@/ai/flows/revise-response';
import type { JobDetailsOutput } from '@/lib/schemas';
import { extractJobDetails } from '@/ai/flows/extract-job-details';
import { analyzeBioCompleteness } from '@/ai/flows/analyze-bio-completeness';
import type {
  BioCompletenessOutput,
  CvOutput,
  QAndAOutput,
  ReviseResponseData,
  ReviseResponseOutput,
} from '@/lib/schemas';
import {
  JobApplicationSchema,
  ReviseResponseSchema,
  JobDetailsInputSchema,
  BioCompletenessInputSchema,
} from '@/lib/schemas';

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
 * @returns A promise that resolves to a `GenerationResult`.
 */
export async function generateAction(
  rawData: unknown
): Promise<GenerationResult> {
  const validationResult = SingleGenerationSchema.safeParse(rawData);
  if (!validationResult.success) {
    const errorMessage = validationResult.error.issues
      .map((issue) => issue.message)
      .join(' ');
    throw new Error(errorMessage || 'Invalid input.');
  }
  const { jobDescription, bio, generationType, questions } =
    validationResult.data;

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
  return response;
}

/**
 * Server Action to revise previously generated content.
 * It validates the input and calls the revision Genkit flow.
 *
 * @param rawData - The raw input data for the revision.
 * @returns A promise that resolves to a `ReviseResponseOutput`.
 */
export async function reviseAction(
  rawData: unknown
): Promise<ReviseResponseOutput> {
  const validationResult = ReviseResponseSchema.safeParse(rawData);
  if (!validationResult.success) {
    const errorMessage = validationResult.error.issues
      .map((issue) => issue.message)
      .join(' ');
    throw new Error(errorMessage || 'Invalid input for revision.');
  }

  const validatedData = validationResult.data as ReviseResponseData;
  if (validatedData.generationType === 'cv' || validatedData.generationType === 'deepAnalysis') {
    throw new Error('Revision is not supported for this format.');
  }

  const response = await reviseResponse(validatedData);
  return response;
}

/**
 * Server Action to extract company name and job title from a job description.
 *
 * @param rawData - The raw input containing the job description.
 * @returns A promise that resolves to an `JobDetailsOutput`.
 */
export async function extractJobDetailsAction(rawData: unknown): Promise<JobDetailsOutput> {
  const validationResult = JobDetailsInputSchema.safeParse(rawData);
  if (!validationResult.success) {
    throw new Error('Invalid job description provided.');
  }

  const response = await extractJobDetails(validationResult.data);
  return response;
}

/**
 * Server Action to analyze the completeness of a user's bio.
 *
 * @param rawData - The raw input containing the bio text.
 * @returns A promise that resolves to an `BioCompletenessOutput`.
 */
export async function analyzeBioCompletenessAction(
  rawData: unknown
): Promise<BioCompletenessOutput> {
  const validationResult = BioCompletenessInputSchema.safeParse(rawData);
  if (!validationResult.success) {
    throw new Error('Invalid bio provided for analysis.');
  }
  
  const response = await analyzeBioCompleteness(validationResult.data);
  return response;
}
