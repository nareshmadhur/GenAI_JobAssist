"use server";

import { z } from 'zod';
import { analyzeJobDescription } from '@/ai/flows/analyze-job-description';
import { filterBioInformation } from '@/ai/flows/filter-bio-information';
import { generateResponse } from '@/ai/flows/generate-response';
import { reviseResponse } from '@/ai/flows/revise-response';
import { JobApplicationSchema, ReviseResponseSchema, ResponseSchema, type GenerationResult, type ResponseData } from '@/lib/schemas';

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
    const [analysis, filteredInfo, response] = await Promise.all([
      analyzeJobDescription({ jobDescription: data.jobDescription, bio: data.bio }),
      filterBioInformation({ jobDescription: data.jobDescription, bio: data.bio }),
      generateResponse({
        jobDescription: data.jobDescription,
        userBio: data.bio,
        additionalComments: '', // Kept for schema compatibility, but not used in UI
      })
    ]);

    return {
      success: true,
      data: {
        analysis,
        filteredInfo,
        response,
      },
    };
  } catch (error) {
    console.error("Error in generateAction:", error);
    return { success: false, error: "Failed to generate content. Please try again." };
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
