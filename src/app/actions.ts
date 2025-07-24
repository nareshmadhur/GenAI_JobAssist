
"use server";

import { z } from 'zod';
import { generateCoverLetter, type CoverLetterOutput } from '@/ai/flows/generate-cover-letter';
import { generateCv, type CvOutput } from '@/ai/flows/generate-cv';
import { generateDeepAnalysis, type DeepAnalysisOutput } from '@/ai/flows/generate-deep-analysis';
import { generateQAndA } from '@/ai/flows/generate-q-and-a';
import { reviseResponse, type ReviseResponseInput } from '@/ai/flows/revise-response';
import { JobApplicationSchema, ReviseResponseSchema, type ResponseData, type QAndAOutput } from '@/lib/schemas';

type SingleGenerateActionResponse<T> = 
  | { success: true; data: T }
  | { success: false; error: string };

type ReviseActionResponse = 
  | { success: true; data: ResponseData }
  | { success: false; error: string };

export type GenerationResult = 
    | CoverLetterOutput
    | CvOutput
    | DeepAnalysisOutput
    | QAndAOutput;

export type AllGenerationResults = {
    coverLetter?: CoverLetterOutput;
    cv?: CvOutput;
    deepAnalysis?: DeepAnalysisOutput;
    qAndA?: QAndAOutput;
};

const SingleGenerationSchema = JobApplicationSchema.pick({ jobDescription: true, bio: true, generationType: true, questions: true });

export async function generateAction(
  rawData: unknown
): Promise<
    | SingleGenerateActionResponse<CoverLetterOutput>
    | SingleGenerateActionResponse<CvOutput>
    | SingleGenerateActionResponse<DeepAnalysisOutput>
    | SingleGenerateActionResponse<QAndAOutput>
    | { success: false; error: string }
> {
    const validationResult = SingleGenerationSchema.safeParse(rawData);
    if (!validationResult.success) {
        const errorMessage = validationResult.error.issues.map((issue) => issue.message).join(' ');
        return { success: false, error: errorMessage || "Invalid input." };
    }
    const { jobDescription, bio, generationType, questions } = validationResult.data;

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
                response = await generateQAndA({ jobDescription, userBio: bio, questions });
                break;
            case 'coverLetter':
            default:
                response = await generateCoverLetter({ jobDescription, userBio: bio });
                break;
        }
        return { success: true, data: response };
    } catch (error) {
        console.error(`Error in generateAction for ${generationType}:`, error);
        const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
        return { success: false, error: `Failed to generate ${generationType}: ${errorMessage}.` };
    }
}


export async function reviseAction(
  rawData: unknown
): Promise<ReviseActionResponse> {
  const validationResult = ReviseResponseSchema.safeParse(rawData);
  if (!validationResult.success) {
    const errorMessage = validationResult.error.issues.map((issue) => issue.message).join(' ');
    return { success: false, error: errorMessage || "Invalid input for revision." };
  }
  const validatedData = validationResult.data;
  if (validatedData.generationType === 'cv') {
      return { success: false, error: "Revision is not supported for this format." };
  }

  const response = await reviseResponse(validatedData as ReviseResponseInput);
  return {
    success: true,
    data: response,
  };
}


