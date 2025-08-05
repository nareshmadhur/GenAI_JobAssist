
import type { CvOutput } from '@/ai/flows/generate-cv';
import {
  AlertTriangle,
  Briefcase,
  Check,
  Copy,
  FileDown,
  GraduationCap,
  Mail,
  MapPin,
  Phone,
  User,
  Wrench,
} from 'lucide-react';
import React, { useRef, useState } from 'react';

import type { EditRequest } from '@/app/page';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Separator } from './ui/separator';

const MISSING_INFO_PLACEHOLDER = '[Information not found in bio]';
const MISSING_NAME_PLACEHOLDER = '[Name not found in bio]';

const isMissing = (text: string | undefined | null): boolean => {
  if (!text) return true;
  return (
    text.includes(MISSING_INFO_PLACEHOLDER) ||
    text.includes(MISSING_NAME_PLACEHOLDER)
  );
};

function ExportButton({
  elementToExport,
  className,
  cvData,
}: {
  elementToExport: React.RefObject<HTMLDivElement>;
  className?: string;
  cvData: CvOutput;
}) {
  const [isExporting, setIsExporting] = useState(false);
  const { toast } = useToast();

  const hasMissingInfo = () => {
    if (
      isMissing(cvData.fullName) ||
      isMissing(cvData.email) ||
      isMissing(cvData.phone) ||
      isMissing(cvData.location) ||
      isMissing(cvData.summary)
    ) {
      return true;
    }
    if (cvData.workExperience.some(j => isMissing(j.jobTitle) || isMissing(j.company) || isMissing(j.duration) || j.responsibilities.some(r => isMissing(r)))) {
        return true;
    }
    if (cvData.education.some(e => isMissing(e.degree) || isMissing(e.institution) || isMissing(e.year))) {
        return true;
    }
    if (cvData.skills.some(s => isMissing(s))) {
        return true;
    }
    return false;
  };

  const exportToPdf = async () => {
    if (!elementToExport.current) {
      toast({
        variant: 'destructive',
        title: 'Export Failed',
        description: 'Could not find the CV element to export.',
      });
      return;
    }
    setIsExporting(true);

    // Temporarily hide elements with missing info
    const elementsToHide = elementToExport.current.querySelectorAll(
      '[data-missing="true"]'
    );
    elementsToHide.forEach((el) => el.classList.add('hidden'));

    try {
      const canvas = await html2canvas(elementToExport.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff',
      });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const canvasWidth = canvas.width;
      const canvasHeight = canvas.height;
      const ratio = canvasWidth / canvasHeight;
      let width = pdfWidth;
      let height = width / ratio;

      if (height > pdfHeight) {
        console.warn('CV content is longer than a single A4 page.');
        // Simple clipping, for multi-page a more complex solution is needed
        height = pdfHeight; 
      }

      pdf.addImage(imgData, 'PNG', 0, 0, width, height);
      pdf.save('cv.pdf');

      toast({ title: 'CV successfully exported as PDF!' });
    } catch (error) {
      console.error('Failed to export PDF:', error);
      toast({
        variant: 'destructive',
        title: 'Export Failed',
        description: 'An unexpected error occurred during PDF generation.',
      });
    } finally {
      // Show the elements again
      elementsToHide.forEach((el) => el.classList.remove('hidden'));
      setIsExporting(false);
    }
  };
  
  const triggerButton = (
     <Button
        variant="ghost"
        size="icon"
        disabled={isExporting}
        aria-label="Export CV as PDF"
        className={cn('text-slate-600 hover:text-slate-900', className)}
      >
        {isExporting ? (
          <Check className="h-4 w-4" />
        ) : (
          <FileDown className="h-4 w-4" />
        )}
      </Button>
  );

  if (!hasMissingInfo()) {
      return (
        <div onClick={exportToPdf}>
            {triggerButton}
        </div>
      )
  }

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        {triggerButton}
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Incomplete CV</AlertDialogTitle>
          <AlertDialogDescription>
            Your CV has missing information. Sections with missing details will
            be skipped in the exported PDF. Do you want to continue?
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={exportToPdf}>Continue Anyway</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

const MissingInfo = ({
  text,
  onEditRequest,
  fieldName,
  isBlock,
}: {
  text: string;
  onEditRequest?: () => void;
  fieldName?: string;
  isBlock?: boolean;
}) => {
  if (!isMissing(text)) {
    return <>{text}</>;
  }

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    onEditRequest?.();
  };
  
  const Wrapper = isBlock ? 'div': 'span';

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Wrapper
            className="cursor-pointer font-semibold text-red-600 hover:underline"
            onClick={handleClick}
            data-missing="true"
          >
            <AlertTriangle className="mr-1 inline-block h-4 w-4" />
            {fieldName}
          </Wrapper>
        </TooltipTrigger>
        <TooltipContent className="bg-slate-800 text-white">
          <p>This information was not found in your bio.</p>
          <p>Click to add it to your bio.</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

interface CvViewProps {
  cvData: CvOutput;
  onEditRequest: (request: EditRequest) => void;
}

export function CvView({ cvData, onEditRequest }: CvViewProps) {
  const cvRef = useRef<HTMLDivElement>(null);

  if (!cvData) {
    return (
      <Card>
        <CardContent className="p-4 text-center text-muted-foreground">
          <p>No CV could be generated based on the provided input.</p>
        </CardContent>
      </Card>
    );
  }

  const handleEditRequest = (fieldName: string) => {
    onEditRequest({ field: 'bio', appendText: `\n${fieldName}: ` });
  };

  return (
    <div className="rounded-lg bg-white p-2 text-black">
      <div ref={cvRef}>
        <Card className="font-sans bg-white text-black shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-slate-800">Mockup CV</CardTitle>
            <ExportButton
              elementToExport={cvRef}
              cvData={cvData}
            />
          </CardHeader>
          <CardContent className="p-6 text-sm">
            {/* Header Section */}
            <div className="mb-6 text-center" data-missing={isMissing(cvData.fullName)}>
              <h1 className="text-3xl font-bold text-slate-900">
                {isMissing(cvData.fullName) ? (
                  <MissingInfo
                    text={cvData.fullName}
                    onEditRequest={() => handleEditRequest('Full Name')}
                    fieldName="Full Name"
                  />
                ) : (
                  cvData.fullName
                )}
              </h1>
              <div className="mt-2 flex flex-wrap justify-center gap-x-4 gap-y-1 text-slate-500">
                <div className="flex items-center gap-2" data-missing={isMissing(cvData.email)}>
                  <Mail className="h-4 w-4" />
                  {isMissing(cvData.email) ? (
                    <MissingInfo
                      text={cvData.email}
                      onEditRequest={() => handleEditRequest('Email')}
                      fieldName="Email"
                    />
                  ) : (
                    cvData.email
                  )}
                </div>
                <div className="flex items-center gap-2" data-missing={isMissing(cvData.phone)}>
                  <Phone className="h-4 w-4" />
                  {isMissing(cvData.phone) ? (
                    <MissingInfo
                      text={cvData.phone}
                      onEditRequest={() => handleEditRequest('Phone')}
                      fieldName="Phone"
                    />
                  ) : (
                    cvData.phone
                  )}
                </div>
                <div className="flex items-center gap-2" data-missing={isMissing(cvData.location)}>
                  <MapPin className="h-4 w-4" />
                  {isMissing(cvData.location) ? (
                    <MissingInfo
                      text={cvData.location}
                      onEditRequest={() => handleEditRequest('Location')}
                      fieldName="Location"
                    />
                  ) : (
                    cvData.location
                  )}
                </div>
              </div>
            </div>

            <Separator className="my-6 bg-slate-200" />

            {/* Summary Section */}
            <div data-missing={isMissing(cvData.summary)}>
              <h2 className="mb-2 flex items-center gap-2 text-xl font-semibold text-slate-800">
                <User className="h-5 w-5" /> Professional Summary
              </h2>
              <div className="text-slate-600">
                {isMissing(cvData.summary) ? (
                  <MissingInfo
                    text={cvData.summary}
                    fieldName="Summary"
                    onEditRequest={() => handleEditRequest('Professional Summary')}
                    isBlock
                  />
                ) : (
                  <p>{cvData.summary}</p>
                )}
              </div>
            </div>

            <Separator className="my-6 bg-slate-200" />

            {/* Work Experience Section */}
            <div>
              <h2 className="mb-4 flex items-center gap-2 text-xl font-semibold text-slate-800">
                <Briefcase className="h-5 w-5" /> Work Experience
              </h2>
              <div className="space-y-6">
                {cvData.workExperience.map((job, index) => (
                  <div key={index} data-missing={isMissing(job.jobTitle) || isMissing(job.company) || isMissing(job.duration)}>
                    <div className="flex items-baseline justify-between">
                      <h3 className="text-lg font-semibold text-slate-800">
                        {isMissing(job.jobTitle) ? (
                          <MissingInfo
                            text={job.jobTitle}
                            fieldName="Job Title"
                            onEditRequest={() => handleEditRequest('Job Title')}
                          />
                        ) : (
                          job.jobTitle
                        )}
                      </h3>
                      <div className="text-sm text-slate-500">
                        {isMissing(job.duration) ? (
                          <MissingInfo
                            text={job.duration}
                            fieldName="Duration"
                            onEditRequest={() => handleEditRequest('Duration')}
                          />
                        ) : (
                          job.duration
                        )}
                      </div>
                    </div>
                    <h4 className="text-md font-medium text-slate-700">
                      {isMissing(job.company) ? (
                        <MissingInfo
                          text={job.company}
                          fieldName="Company"
                          onEditRequest={() => handleEditRequest('Company')}
                        />
                      ) : (
                        job.company
                      )}
                    </h4>
                    <ul className="mt-2 list-disc space-y-1 pl-5 text-slate-600">
                      {job.responsibilities.map((responsibility, i) => (
                        <li key={i} data-missing={isMissing(responsibility)}>
                          {isMissing(responsibility) ? (
                            <MissingInfo
                              text={responsibility}
                              fieldName="Responsibility"
                              onEditRequest={() =>
                                handleEditRequest('Responsibility/Achievement')
                              }
                            />
                          ) : (
                            responsibility
                          )}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>

            <Separator className="my-6 bg-slate-200" />

            {/* Education Section */}
            <div>
              <h2 className="mb-4 flex items-center gap-2 text-xl font-semibold text-slate-800">
                <GraduationCap className="h-5 w-5" /> Education
              </h2>
              <div className="space-y-2">
                {cvData.education.map((edu, index) => (
                  <div key={index} className="flex items-baseline justify-between" data-missing={isMissing(edu.degree) || isMissing(edu.institution) || isMissing(edu.year)}>
                    <div>
                      <h3 className="text-lg font-semibold text-slate-800">
                        {isMissing(edu.degree) ? (
                          <MissingInfo
                            text={edu.degree}
                            fieldName="Degree"
                            onEditRequest={() => handleEditRequest('Degree')}
                          />
                        ) : (
                          edu.degree
                        )}
                      </h3>
                      <div className="text-md text-slate-600">
                        {isMissing(edu.institution) ? (
                          <MissingInfo
                            text={edu.institution}
                            fieldName="Institution"
                            onEditRequest={() => handleEditRequest('Institution')}
                          />
                        ) : (
                          edu.institution
                        )}
                      </div>
                    </div>
                    <div className="text-sm text-slate-500">
                      {isMissing(edu.year) ? (
                         <MissingInfo
                          text={edu.year || ''}
                          fieldName="Year"
                          onEditRequest={() => handleEditRequest('Year')}
                        />
                      ) : (
                        edu.year
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <Separator className="my-6 bg-slate-200" />

            {/* Skills Section */}
            <div>
              <h2 className="mb-2 flex items-center gap-2 text-xl font-semibold text-slate-800">
                <Wrench className="h-5 w-5" /> Skills
              </h2>
              <div className="flex flex-wrap gap-2">
                {cvData.skills.map((skill, index) => (
                  <div
                    key={index}
                    className="rounded-full bg-slate-100 px-3 py-1 text-sm text-slate-700"
                    data-missing={isMissing(skill)}
                  >
                    {isMissing(skill) ? (
                      <MissingInfo
                        text={skill}
                        fieldName="Skill"
                        onEditRequest={() => handleEditRequest('Skill')}
                      />
                    ) : (
                      skill
                    )}
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

    