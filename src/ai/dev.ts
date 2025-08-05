'use server';

import { config } from 'dotenv';
config();

// Barrel export for flows and their types
export * from './flows/analyze-job-description';
export * from './flows/generate-cover-letter';
export * from './flows/generate-cv';
export * from './flows/generate-deep-analysis';
export * from './flows/revise-response';
export * from './flows/generate-q-and-a';
export * from './flows/update-cv-field';

import './flows/generate-cover-letter.ts';
import './flows/generate-cv.ts';
import './flows/generate-deep-analysis.ts';
import './flows/analyze-job-description.ts';
import './flows/filter-bio-information.ts';
import './flows/revise-response.ts';
import './flows/generate-q-and-a.ts';
import './flows/update-cv-field.ts';
