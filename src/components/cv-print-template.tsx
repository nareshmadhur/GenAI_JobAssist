'use client';

import type { CvOutput, DeepAnalysisOutput } from '@/lib/schemas';
import { getHighlightedTextSegments, getRoleAlignmentTerms } from '@/lib/role-alignment';

interface CvPrintTemplateProps {
  cvData: CvOutput;
  jobDescription?: string;
  deepAnalysis?: DeepAnalysisOutput | null;
}

export function CvPrintTemplate({
  cvData,
  jobDescription,
  deepAnalysis,
}: CvPrintTemplateProps) {
  const roleAlignmentTerms = getRoleAlignmentTerms({
    cvData,
    deepAnalysis,
    jobDescription,
  });

  return (
    <article className="print-container mx-auto max-w-[840px] bg-white px-5 py-8 text-[13px] leading-relaxed text-slate-950 shadow-2xl shadow-primary/10 sm:px-10 sm:py-12 print:max-w-none print:px-0 print:py-0 print:shadow-none">
      <header className="border-b border-slate-200 pb-6 text-center">
        <h1 className="text-3xl font-bold tracking-tight text-slate-950">{cvData.fullName}</h1>
        <div className="mt-3 flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-[12px] text-slate-600">
          {cvData.email ? <span>{cvData.email}</span> : null}
          {cvData.phone ? <span>{cvData.phone}</span> : null}
          {cvData.location ? <span>{cvData.location}</span> : null}
        </div>
      </header>

      <section className="resume-print-section mt-7 [break-inside:avoid]">
        <h2 className="border-b border-slate-200 pb-2 text-xs font-bold uppercase tracking-[0.2em] text-slate-500">
          Professional Summary
        </h2>
        <p className="mt-3 whitespace-pre-wrap text-sm text-slate-700">
          {getHighlightedTextSegments(cvData.summary, roleAlignmentTerms).map((segment, index) =>
            segment.isHighlighted ? (
              <strong key={`${segment.text}-${index}`} className="font-semibold text-slate-900">
                {segment.text}
              </strong>
            ) : (
              <span key={`${segment.text}-${index}`}>{segment.text}</span>
            )
          )}
        </p>
      </section>

      <section className="resume-print-section mt-7 [break-inside:avoid]">
        <h2 className="border-b border-slate-200 pb-2 text-xs font-bold uppercase tracking-[0.2em] text-slate-500">
          Work Experience
        </h2>
        <div className="mt-4 space-y-5">
          {cvData.workExperience.map((job, index) => (
            <div key={`${job.company}-${job.jobTitle}-${index}`} className="resume-print-entry [break-inside:avoid]">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <h3 className="text-base font-semibold text-slate-900">{job.jobTitle}</h3>
                  <p className="text-sm font-medium text-slate-700">{job.company}</p>
                </div>
                <p className="shrink-0 text-xs font-medium uppercase tracking-wide text-slate-500">{job.duration}</p>
              </div>
              <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-700">
                {job.responsibilities.map((responsibility, responsibilityIndex) => (
                  <li key={`${job.company}-${responsibilityIndex}`} className="whitespace-pre-wrap">
                    {getHighlightedTextSegments(responsibility, roleAlignmentTerms).map((segment, index) =>
                      segment.isHighlighted ? (
                        <strong key={`${segment.text}-${index}`} className="font-semibold text-slate-900">
                          {segment.text}
                        </strong>
                      ) : (
                        <span key={`${segment.text}-${index}`}>{segment.text}</span>
                      )
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      <section className="resume-print-section mt-7 [break-inside:avoid]">
        <h2 className="border-b border-slate-200 pb-2 text-xs font-bold uppercase tracking-[0.2em] text-slate-500">
          Education
        </h2>
        <div className="mt-4 space-y-3">
          {cvData.education.map((education, index) => (
            <div key={`${education.institution}-${education.degree}-${index}`} className="resume-print-entry flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between [break-inside:avoid]">
              <div>
                <h3 className="text-base font-semibold text-slate-900">{education.degree}</h3>
                <p className="text-sm text-slate-700">{education.institution}</p>
              </div>
              {education.year ? (
                <p className="shrink-0 text-xs font-medium uppercase tracking-wide text-slate-500">{education.year}</p>
              ) : null}
            </div>
          ))}
        </div>
      </section>

      <section className="resume-print-section mt-7 [break-inside:avoid]">
        <h2 className="border-b border-slate-200 pb-2 text-xs font-bold uppercase tracking-[0.2em] text-slate-500">
          Skills
        </h2>
        <div className="mt-4 flex flex-wrap gap-2">
          {cvData.skills.map((skill, index) => (
            <span
              key={`${skill}-${index}`}
              className={
                roleAlignmentTerms.some((term) => term.toLowerCase() === skill.toLowerCase())
                  ? 'rounded-full border border-slate-900 px-3 py-1 text-xs font-semibold text-slate-900'
                  : 'rounded-full border border-slate-300 px-3 py-1 text-xs font-medium text-slate-700'
              }
            >
              {skill}
            </span>
          ))}
        </div>
      </section>
    </article>
  );
}
