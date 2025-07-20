"use server";

import { z } from 'zod';
import { analyzeJobDescription } from '@/ai/flows/analyze-job-description';
import { filterBioInformation } from '@/ai/flows/filter-bio-information';
import { generateResponse } from '@/ai/flows/generate-response';
import { JobApplicationSchema, type GenerationResult } from '@/lib/schemas';

type ActionResponse = 
  | { success: true; data: GenerationResult }
  | { success: false; error: string };

export async function generateAction(
  rawData: unknown
): Promise<ActionResponse> {
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
        additionalComments: data.comments ?? '',
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
