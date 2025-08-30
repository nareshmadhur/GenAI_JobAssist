
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
export * from './flows/extract-job-details';
export * from './flows/generate-co-pilot-response';
export * from './flows/analyze-bio-completeness';
export * from './flows/enrich-copilot-prompt';


import './flows/generate-cover-letter.ts';
import './flows/generate-cv.ts';
import './flows/generate-deep-analysis.ts';
import './flows/analyze-job-description.ts';
import './flows/filter-bio-information.ts';
import './flows/revise-response.ts';
import './flows/generate-q-and-a.ts';
import './flows/extract-job-details.ts';
import './flows/generate-co-pilot-response.ts';
import './flows/analyze-bio-completeness.ts';
import './flows/enrich-copilot-prompt.ts';
