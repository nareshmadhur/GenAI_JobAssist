
"use server";

import type { CoverLetterOutput } from '@/ai/flows/generate-cover-letter';
import { generateCoverLetter } from '@/ai/flows/generate-cover-letter';
import { generateCv } from '@/ai/flows/generate-cv';
import type { DeepAnalysisOutput } from '@/lib/schemas';
import { generateDeepAnalysis } from '@/ai/flows/generate-deep-analysis';
import { generateQAndA } from '@/ai/flows/generate-q-and-a';
import { reviseResponse } from '@/ai/flows/revise-response';
import type { JobDetailsOutput } from '@/lib/schemas';
import { extractJobDetails } from '@/ai/flows/extract-job-details';
import { analyzeBioCompleteness } from '@/ai/flows/analyze-bio-completeness';
import { fetchAndExtractTextFromUrl } from '@/lib/extract-url';
import { reviseCvField, type ReviseCvFieldInput, type ReviseCvFieldOutput } from '@/ai/flows/revise-cv-field';
import { fillQaGap, type FillQaGapInput, type FillQaGapOutput } from '@/ai/flows/fill-qa-gap';
import { generateLearningPath, type GenerateLearningPathInput, type GenerateLearningPathOutput } from '@/ai/flows/generate-learning-path';
import { prettifyWorkRepository } from '@/ai/flows/prettify-work-repository';
import { generateInterviewPrep } from '@/ai/flows/generate-interview-prep';
import { extractJobDescriptionFromWebpage } from '@/ai/flows/extract-job-description-from-webpage';

import type {
  BioCompletenessOutput,
  CvOutput,
  QAndAOutput,
  InterviewPrepOutput,
  ReviseResponseData,
  ReviseResponseOutput,
} from '@/lib/schemas';
import {
  JobApplicationSchema,
  ReviseResponseSchema,
  JobDetailsInputSchema,
  BioCompletenessInputSchema,
} from '@/lib/schemas';

type ActionError = { error: string };

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
  interviewPrep?: InterviewPrepOutput;
};

const SingleGenerationSchema = JobApplicationSchema.pick({
  jobDescription: true,
  workRepository: true,
  generationType: true,
  questions: true,
});

/**
 * Server Action to generate content based on the specified `generationType`.
 * It validates the input and calls the corresponding Genkit flow.
 *
 * @param rawData - The raw input data from the form.
 * @returns A promise that resolves to a `GenerationResult` or an error object.
 */
export async function generateAction(
  rawData: unknown
): Promise<GenerationResult | ActionError> {
  const validationResult = SingleGenerationSchema.safeParse(rawData);
  if (!validationResult.success) {
    const errorMessage = validationResult.error.issues
      .map((issue) => issue.message)
      .join(' ');
    return { error: errorMessage || 'Invalid input.' };
  }
  const { jobDescription, workRepository, generationType, questions } =
    validationResult.data;

  try {
    let response;
    switch (generationType) {
      case 'cv':
        response = await generateCv({ jobDescription, workRepository });
        break;
      case 'deepAnalysis':
        response = await generateDeepAnalysis({ jobDescription, workRepository });
        break;
      case 'qAndA':
        response = await generateQAndA({
          jobDescription,
          workRepository,
          questions: questions || '',
        });
        break;
      case 'coverLetter':
      default:
        response = await generateCoverLetter({ jobDescription, workRepository });
        break;
    }
    return response;
  } catch (error: any) {
    console.error(`Error in generateAction for ${generationType}:`, error);
    return { error: error.message || 'The AI model seems to be unavailable right now. Please try again in a moment.' };
  }
}

/**
 * Server Action to revise previously generated content.
 * It validates the input and calls the revision Genkit flow.
 *
 * @param rawData - The raw input data for the revision.
 * @returns A promise that resolves to a `ReviseResponseOutput` or an error object.
 */
export async function reviseAction(
  rawData: unknown
): Promise<ReviseResponseOutput | ActionError> {
  const validationResult = ReviseResponseSchema.safeParse(rawData);
  if (!validationResult.success) {
    const errorMessage = validationResult.error.issues
      .map((issue) => issue.message)
      .join(' ');
    return { error: errorMessage || 'Invalid input for revision.' };
  }

  const validatedData = validationResult.data as ReviseResponseData;
  if (validatedData.generationType === 'cv' || validatedData.generationType === 'deepAnalysis') {
    return { error: 'Revision is not supported for this format.' };
  }

  try {
    const response = await reviseResponse(validatedData);
    return response;
  } catch (error: any) {
    console.error('Error in reviseAction:', error);
    return { error: error.message || 'The AI model seems to be unavailable right now. Please try again in a moment.' };
  }
}

/**
 * Server Action to extract company name and job title from a job description.
 *
 * @param rawData - The raw input containing the job description.
 * @returns A promise that resolves to a `JobDetailsOutput` or an error object.
 */
export async function extractJobDetailsAction(rawData: unknown): Promise<JobDetailsOutput | ActionError> {
  const validationResult = JobDetailsInputSchema.safeParse(rawData);
  if (!validationResult.success) {
    return { error: 'Invalid job description provided.' };
  }
  try {
    const response = await extractJobDetails(validationResult.data);
    return response;
  } catch (error: any) {
    console.error('Error in extractJobDetailsAction:', error);
    return { error: error.message || 'Could not extract job details.' };
  }
}

/**
 * Server Action to analyze the completeness of a user's work repository.
 *
 * @param rawData - The raw input containing the repository text.
 * @returns A promise that resolves to a `BioCompletenessOutput` or an error object.
 */
export async function analyzeBioCompletenessAction(
  rawData: unknown
): Promise<BioCompletenessOutput | ActionError> {
  const validationResult = BioCompletenessInputSchema.safeParse(rawData);
  if (!validationResult.success) {
    return { error: 'Invalid repository provided for analysis.' };
  }
  try {
    const response = await analyzeBioCompleteness(validationResult.data);
    return response;
  } catch (error: any) {
    console.error('Error in analyzeBioCompletenessAction:', error);
    return { error: error.message || 'Could not analyze repository completeness.' };
  }
}

/**
 * Server Action to extract text content from a given URL.
 *
 * @param url - The URL to fetch.
 * @returns A promise that resolves to an object containing the extracted text or an error.
 */
export async function extractUrlTextAction(url: string): Promise<{ text?: string; error?: string }> {
  if (!url || !url.startsWith('http')) {
    return { error: 'Invalid URL provided.' };
  }
  try {
    const extractedContent = await fetchAndExtractTextFromUrl(url);
    if (!extractedContent.pageText || extractedContent.pageText.length < 50) {
      return { error: 'Could not extract meaningful text from this URL. Please paste the text manually.' };
    }
    const cleanedJobPage = await extractJobDescriptionFromWebpage({
      url,
      pageTitle: extractedContent.pageTitle,
      pageText: extractedContent.pageText,
      candidateBlocksText:
        extractedContent.candidateBlocks.length > 0
          ? extractedContent.candidateBlocks.map((block) => `- ${block}`).join('\n\n')
          : '- No clear candidate sections were detected.',
    });

    if (!cleanedJobPage.isLikelyJobPosting || cleanedJobPage.jobDescription.trim().length < 120) {
      return { error: 'This page does not look like a clear job posting. Please paste the job description text manually.' };
    }

    return { text: cleanedJobPage.jobDescription };
  } catch (error: any) {
    console.error('Error in extractUrlTextAction:', error);
    return { error: error.message || 'Could not extract text from URL.' };
  }
}

/**
 * Server Action to prettify a work repository using AI.
 * 
 * @param rawText - The raw text to prettify.
 * @returns A promise that resolves to the prettified text or an error.
 */
export async function prettifyWorkRepositoryAction(rawText: string): Promise<{ text?: string; error?: string }> {
  if (!rawText || rawText.length < 20) {
    return { error: 'Please provide more details to prettify.' };
  }
  try {
    const result = await prettifyWorkRepository({ rawText });
    return { text: result.structuredText };
  } catch (error: any) {
    console.error('Error in prettifyWorkRepositoryAction:', error);
    return { error: error.message || 'Could not prettify text.' };
  }
}

/**
 * Server Action to revise a specific CV field.
 *
 * @param rawData - The input data containing original text, instruction, and field name.
 * @returns A promise that resolves to the revised text or an error.
 */
export async function reviseCvFieldAction(rawData: unknown): Promise<ReviseCvFieldOutput | ActionError> {
  try {
    const input = rawData as ReviseCvFieldInput;
    if (!input.originalText || !input.fieldName) {
      return { error: 'Missing required fields for revision.' };
    }
    const response = await reviseCvField(input);
    return response;
  } catch (error: any) {
    console.error('Error in reviseCvFieldAction:', error);
    return { error: error.message || 'Could not revise CV field.' };
  }
}

/**
 * Server Action to fill a missing Q&A answer based on user-provided context.
 *
 * @param rawData - The input data containing job description, question, and user context.
 * @returns A promise that resolves to the generated answer or an error.
 */
export async function fillQaGapAction(rawData: unknown): Promise<FillQaGapOutput | ActionError> {
  try {
    const input = rawData as FillQaGapInput;
    if (!input.jobDescription || !input.question || !input.userContext) {
      return { error: 'Missing required fields to fill the Q&A gap.' };
    }
    const response = await fillQaGap(input);
    return response;
  } catch (error: any) {
    console.error('Error in fillQaGapAction:', error);
    return { error: error.message || 'Could not generate answer.' };
  }
}

/**
 * Server Action to generate a learning path for a missing job requirement.
 */
export async function generateLearningPathAction(rawData: unknown): Promise<GenerateLearningPathOutput | ActionError> {
  try {
    const input = rawData as GenerateLearningPathInput;
    if (!input.jobDescription || !input.missingRequirement) {
      return { error: 'Missing required fields to generate learning path.' };
    }
    const response = await generateLearningPath(input);
    return response;
  } catch (error: any) {
    console.error('Error in generateLearningPathAction:', error);
    return { error: error.message || 'Could not generate learning path.' };
  }
}

/**
 * Server Action to generate an interview preparation coaching guide.
 */
export async function generateInterviewPrepAction(rawData: unknown): Promise<InterviewPrepOutput | ActionError> {
  try {
    const input = rawData as { jobDescription: string; workRepository: string };
    if (!input.jobDescription || !input.workRepository) {
      return { error: 'Job description and work repository are required.' };
    }
    const response = await generateInterviewPrep(input);
    return response;
  } catch (error: any) {
    console.error('Error in generateInterviewPrepAction:', error);
    return { error: error.message || 'Could not generate interview prep guide.' };
  }
}
