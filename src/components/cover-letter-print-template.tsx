'use client';

import ReactMarkdown from 'react-markdown';

interface CoverLetterPrintTemplateProps {
  coverLetter: string;
}

export function CoverLetterPrintTemplate({ coverLetter }: CoverLetterPrintTemplateProps) {
  return (
    <article className="print-container mx-auto max-w-[840px] bg-white px-5 py-8 text-[13px] leading-relaxed text-slate-950 shadow-2xl shadow-primary/10 sm:px-10 sm:py-12 print:max-w-none print:px-0 print:py-0 print:shadow-none">
      <div className="cover-letter-print-block prose max-w-none text-slate-800">
        <ReactMarkdown>{coverLetter}</ReactMarkdown>
      </div>
    </article>
  );
}
