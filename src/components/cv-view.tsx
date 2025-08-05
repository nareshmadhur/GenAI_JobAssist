
import React, { useState } from 'react';
import type { CvOutput } from '@/ai/flows/generate-cv';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Briefcase, GraduationCap, Wrench, User, Mail, Phone, MapPin, Copy, Check, AlertTriangle } from 'lucide-react';
import { Button } from './ui/button';
import { Separator } from './ui/separator';
import { useToast } from '@/hooks/use-toast';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip';
import { cn } from '@/lib/utils';
import { EditRequest } from '@/app/page';

const MISSING_INFO_PLACEHOLDER = '[Information not found in bio]';
const MISSING_NAME_PLACEHOLDER = '[Name not found in bio]';

function CopyButton({ textToCopy, className }: { textToCopy: string, className?: string }) {
  const [isCopied, setIsCopied] = useState(false);
  const { toast } = useToast();

  const copy = () => {
    navigator.clipboard.writeText(textToCopy).then(
      () => {
        setIsCopied(true);
        toast({ title: 'CV content copied to clipboard!' });
        setTimeout(() => setIsCopied(false), 2000);
      },
      (err) => {
        console.error('Failed to copy text:', err);
        toast({
          variant: 'destructive',
          title: 'Copy Failed',
          description: 'Could not write to clipboard.',
        });
      }
    );
  };

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={copy}
      aria-label="Copy text"
      className={cn("text-slate-600 hover:text-slate-900", className)}
    >
      {isCopied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
    </Button>
  );
}

const formatCvToText = (cvData: CvOutput): string => {
  let text = '';
  text += `${cvData.fullName}\n`;
  text += `${cvData.email} | ${cvData.phone} | ${cvData.location}\n\n`;
  
  text += '--- Summary ---\n';
  text += `${cvData.summary}\n\n`;

  text += '--- Work Experience ---\n';
  cvData.workExperience.forEach(job => {
    text += `${job.jobTitle} | ${job.company} (${job.duration})\n`;
    job.responsibilities.forEach(res => {
      text += `- ${res}\n`;
    });
    text += '\n';
  });

  text += '--- Education ---\n';
  cvData.education.forEach(edu => {
    text += `${edu.degree}, ${edu.institution} (${edu.year || 'N/A'})\n`;
  });
  text += '\n';

  text += '--- Skills ---\n';
  text += cvData.skills.join(', ');

  return text;
};

const isMissing = (text: string) => 
  text.includes(MISSING_INFO_PLACEHOLDER) || text.includes(MISSING_NAME_PLACEHOLDER);


const MissingInfo = ({ text, onEditRequest, fieldName }: { text: string; onEditRequest?: () => void; fieldName?: string; }) => {
  if (!isMissing(text)) {
    return <>{text}</>;
  }

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    onEditRequest?.();
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <span
            className="text-red-600 font-semibold cursor-pointer hover:underline flex items-center gap-1"
            onClick={handleClick}
          >
            <AlertTriangle className="h-4 w-4" />
            {fieldName}
          </span>
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
  if (!cvData) {
    return (
      <Card>
        <CardContent className="p-4 text-center text-muted-foreground">
          <p>No CV could be generated based on the provided input.</p>
        </CardContent>
      </Card>
    );
  }
  
  const plainTextCv = formatCvToText(cvData);
  
  const handleEditRequest = (fieldName: string) => {
    onEditRequest({ field: 'bio', appendText: `\n${fieldName}: ` });
  };


  return (
    <div className="bg-white dark:bg-white text-black p-2 rounded-lg">
    <Card className="font-sans bg-white text-black shadow-lg">
        <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-slate-800">Mockup CV</CardTitle>
            <CopyButton textToCopy={plainTextCv} />
        </CardHeader>
      <CardContent className="p-6 text-sm">
        {/* Header Section */}
        <div className="text-center mb-6">
            <h1 className="text-3xl font-bold text-slate-900">
                {isMissing(cvData.fullName) ? (
                    <MissingInfo text={cvData.fullName} onEditRequest={() => handleEditRequest('Full Name')} fieldName="Full Name"/>
                ) : (
                    cvData.fullName
                )}
            </h1>
          <div className="mt-2 flex justify-center items-center gap-x-4 gap-y-1 text-slate-500 flex-wrap">
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4" />
                {isMissing(cvData.email) ? (
                    <MissingInfo text={cvData.email} onEditRequest={() => handleEditRequest('Email')} fieldName="Email"/>
                ) : (
                    cvData.email
                )}
              </div>
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4" />
                {isMissing(cvData.phone) ? (
                    <MissingInfo text={cvData.phone} onEditRequest={() => handleEditRequest('Phone')} fieldName="Phone"/>
                ) : (
                    cvData.phone
                )}
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                {isMissing(cvData.location) ? (
                    <MissingInfo text={cvData.location} onEditRequest={() => handleEditRequest('Location')} fieldName="Location"/>
                ) : (
                    cvData.location
                )}
              </div>
          </div>
        </div>

        <Separator className="my-6 bg-slate-200" />

        {/* Summary Section */}
        <div>
          <h2 className="text-xl font-semibold text-slate-800 mb-2 flex items-center gap-2">
            <User className="h-5 w-5" /> Professional Summary
          </h2>
          <p className="text-slate-600">{cvData.summary}</p>
        </div>

        <Separator className="my-6 bg-slate-200" />

        {/* Work Experience Section */}
        <div>
          <h2 className="text-xl font-semibold text-slate-800 mb-4 flex items-center gap-2">
            <Briefcase className="h-5 w-5" /> Work Experience
          </h2>
          <div className="space-y-6">
            {cvData.workExperience.map((job, index) => (
              <div key={index}>
                <div className="flex justify-between items-baseline">
                    <h3 className="text-lg font-semibold text-slate-800">
                        {isMissing(job.jobTitle) ? <MissingInfo text={job.jobTitle} fieldName="Job Title" onEditRequest={() => handleEditRequest('Job Title')} /> : job.jobTitle}
                    </h3>
                    <p className="text-sm text-slate-500">
                        {isMissing(job.duration) ? <MissingInfo text={job.duration} fieldName="Duration" onEditRequest={() => handleEditRequest('Duration')} /> : job.duration}
                    </p>
                </div>
                <h4 className="text-md font-medium text-slate-700">
                    {isMissing(job.company) ? <MissingInfo text={job.company} fieldName="Company" onEditRequest={() => handleEditRequest('Company')} /> : job.company}
                </h4>
                <ul className="mt-2 list-disc pl-5 space-y-1 text-slate-600">
                  {job.responsibilities.map((responsibility, i) => (
                    <li key={i}>
                        {isMissing(responsibility) ? <MissingInfo text={responsibility} fieldName="Responsibility" onEditRequest={() => handleEditRequest('Responsibility')} /> : responsibility}
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
          <h2 className="text-xl font-semibold text-slate-800 mb-4 flex items-center gap-2">
            <GraduationCap className="h-5 w-5" /> Education
          </h2>
          <div className="space-y-2">
            {cvData.education.map((edu, index) => (
              <div key={index} className="flex justify-between items-baseline">
                <div>
                    <h3 className="text-lg font-semibold text-slate-800">
                        {isMissing(edu.degree) ? <MissingInfo text={edu.degree} fieldName="Degree" onEditRequest={() => handleEditRequest('Degree')} /> : edu.degree}
                    </h3>
                    <p className="text-md text-slate-600">
                        {isMissing(edu.institution) ? <MissingInfo text={edu.institution} fieldName="Institution" onEditRequest={() => handleEditRequest('Institution')} /> : edu.institution}
                    </p>
                </div>
                <p className="text-sm text-slate-500">
                    {edu.year && !isMissing(edu.year) ? edu.year : <MissingInfo text={edu.year || ''} fieldName="Year" onEditRequest={() => handleEditRequest('Year')} />}
                </p>
              </div>
            ))}
          </div>
        </div>

        <Separator className="my-6 bg-slate-200" />

        {/* Skills Section */}
        <div>
          <h2 className="text-xl font-semibold text-slate-800 mb-2 flex items-center gap-2">
            <Wrench className="h-5 w-5" /> Skills
          </h2>
          <div className="flex flex-wrap gap-2">
            {cvData.skills.map((skill, index) => (
              <div key={index} className="bg-slate-100 text-slate-700 px-3 py-1 rounded-full text-sm">
                 {isMissing(skill) ? <MissingInfo text={skill} fieldName="Skill" onEditRequest={() => handleEditRequest('Skill')} /> : skill}
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
    </div>
  );
}
