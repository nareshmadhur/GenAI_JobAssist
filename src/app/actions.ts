
"use server";

import { z } from 'zod';
import { analyzeJobDescription, type AnalyzeJobDescriptionOutput } from '@/ai/flows/analyze-job-description';
import { generateCoverLetter, type CoverLetterOutput } from '@/ai/flows/generate-cover-letter';
import { generateCv, type CvOutput } from '@/ai/flows/generate-cv';
import { generateDeepAnalysis, type DeepAnalysisOutput } from '@/ai/flows/generate-deep-analysis';
import { generateQAndA, type QAndAOutput } from '@/ai/flows/generate-q-and-a';
import { reviseResponse, type ReviseResponseInput } from '@/ai/flows/revise-response';
import { JobApplicationSchema, ReviseResponseSchema, type ResponseData } from '@/lib/schemas';

type GenerateActionResponse = 
  | { success: true; data: AllGenerationResults }
  | { success: false; error: string };
  
type SingleGenerateActionResponse<T> = 
  | { success: true; data: T }
  | { success: false; error: string };

type ReviseActionResponse = 
  | { success: true; data: ResponseData }
  | { success: false; error: string };

export interface AllGenerationResults {
    analysis: AnalyzeJobDescriptionOutput;
    coverLetter?: CoverLetterOutput;
    cv?: CvOutput;
    deepAnalysis?: DeepAnalysisOutput;
    qAndA?: QAndAOutput;
}

// This action generates ONLY the initial analysis and one content type.
export async function generateInitialAction(
  rawData: unknown
): Promise<GenerateActionResponse> {
  const validationResult = JobApplicationSchema.safeParse(rawData);
  if (!validationResult.success) {
    const errorMessage = validationResult.error.issues.map((issue) => issue.message).join(' ');
    return { success: false, error: errorMessage || "Invalid input." };
  }

  const data = validationResult.data;
  
  try {
    let responsePromise;
    switch (data.generationType) {
        case 'cv':
            responsePromise = generateCv({ jobDescription: data.jobDescription, userBio: data.bio });
            break;
        case 'deepAnalysis':
            responsePromise = generateDeepAnalysis({ jobDescription: data.jobDescription, userBio: data.bio });
            break;
        case 'qAndA':
            responsePromise = generateQAndA({ jobDescription: data.jobDescription, userBio: data.bio });
            break;
        case 'coverLetter':
        default:
            responsePromise = generateCoverLetter({ jobDescription: data.jobDescription, userBio: data.bio });
            break;
    }

    const [analysis, response] = await Promise.all([
      analyzeJobDescription({ jobDescription: data.jobDescription, bio: data.bio }),
      responsePromise
    ]);

    const result: AllGenerationResults = { analysis };
    if (data.generationType === 'coverLetter') result.coverLetter = response as CoverLetterOutput;
    if (data.generationType === 'cv') result.cv = response as CvOutput;
    if (data.generationType === 'deepAnalysis') result.deepAnalysis = response as DeepAnalysisOutput;
    if (data.generationType === 'qAndA') result.qAndA = response as QAndAOutput;


    return {
      success: true,
      data: result
    };
  } catch (error) {
    console.error("Error in generateInitialAction:", error);
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
    return { success: false, error: `Failed to generate content: ${errorMessage}. Please try again.` };
  }
}

// This action generates a single content type when a tab is clicked.
export async function generateSingleAction(
  rawData: unknown
): Promise<
    | SingleGenerateActionResponse<CoverLetterOutput>
    | SingleGenerateActionResponse<CvOutput>
    | SingleGenerateActionResponse<DeepAnalysisOutput>
    | SingleGenerateActionResponse<QAndAOutput>
    | { success: false; error: string }
> {
    const validationResult = JobApplicationSchema.pick({ jobDescription: true, bio: true, generationType: true }).safeParse(rawData);
    if (!validationResult.success) {
        return { success: false, error: "Invalid input for single generation." };
    }
    const { jobDescription, bio, generationType } = validationResult.data;

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
                response = await generateQAndA({ jobDescription, userBio: bio });
                break;
            case 'coverLetter':
            default:
                response = await generateCoverLetter({ jobDescription, userBio: bio });
                break;
        }
        return { success: true, data: response };
    } catch (error) {
        console.error(`Error in generateSingleAction for ${generationType}:`, error);
        return { success: false, error: `Failed to generate ${generationType}.` };
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

  try {
    const response = await reviseResponse(validationResult.data as ReviseResponseInput);
    return {
      success: true,
      data: response,
    };
  } catch (error) {
    console.error("Error in reviseAction:", error);
    return { success: false, error: "Failed to revise content. Please try again." };
  }
}
