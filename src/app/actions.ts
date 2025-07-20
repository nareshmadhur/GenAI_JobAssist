
"use server";

import { z } from 'zod';
import { analyzeJobDescription } from '@/ai/flows/analyze-job-description';
import { generateCoverLetter } from '@/ai/flows/generate-cover-letter';
import { generateCv } from '@/ai/flows/generate-cv';
import { generateDeepAnalysis } from '@/ai/flows/generate-deep-analysis';
import { reviseResponse } from '@/ai/flows/revise-response';
import { JobApplicationSchema, ReviseResponseSchema, type GenerationResult, type ResponseData } from '@/lib/schemas';

type GenerateActionResponse = 
  | { success: true; data: GenerationResult }
  | { success: false; error: string };

type ReviseActionResponse = 
  | { success: true; data: ResponseData }
  | { success: false; error: string };

export async function generateAction(
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
        case 'coverLetter':
        default:
            responsePromise = generateCoverLetter({ jobDescription: data.jobDescription, userBio: data.bio });
            break;
    }

    const [analysis, response] = await Promise.all([
      analyzeJobDescription({ jobDescription: data.jobDescription, bio: data.bio }),
      responsePromise
    ]);

    return {
      success: true,
      data: {
        analysis,
        response,
        // Deprecated, but kept for schema compatibility for now
        filteredInfo: { filteredBio: '', relevantInterests: '' }
      },
    };
  } catch (error) {
    console.error("Error in generateAction:", error);
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
    return { success: false, error: `Failed to generate content: ${errorMessage}. Please try again.` };
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
    const response = await reviseResponse(validationResult.data);
    return {
      success: true,
      data: response,
    };
  } catch (error) {
    console.error("Error in reviseAction:", error);
    return { success: false, error: "Failed to revise content. Please try again." };
  }
}
