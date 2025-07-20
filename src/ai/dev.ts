import { config } from 'dotenv';
config();

// Barrel export for flows and their types
export * from './flows/analyze-job-description';
export * from './flows/generate-cover-letter';
export * from './flows/generate-cv';
export * from './flows/generate-deep-analysis';
export * from './flows/revise-response';

import './flows/generate-cover-letter.ts';
import './flows/generate-cv.ts';
import './flows/generate-deep-analysis.ts';
import './flows/analyze-job-description.ts';
import './flows/filter-bio-information.ts';
import './flows/revise-response.ts';
