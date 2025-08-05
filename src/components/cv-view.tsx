'use client';

import {
  AlertTriangle,
  Briefcase,
  GraduationCap,
  Mail,
  MapPin,
  Phone,
  User,
  Wrench,
  FileDown,
  Loader2,
} from 'lucide-react';
import React, { useState, useTransition } from 'react';
import type { CvOutput } from '@/lib/schemas';

import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Separator } from './ui/separator';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

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
import { updateCvFieldAction } from '@/app/actions';
import { useToast } from '@/hooks/use-toast';
import { EditableCvField } from './editable-cv-field';


const MISSING_INFO_PLACEHOLDER = '[Information not found in bio]';
const MISSING_NAME_PLACEHOLDER = '[Name not found in bio]';

const isMissing = (text: string | undefined | null): boolean => {
  if (!text) return true;
  const lowerText = text.toLowerCase();
  return (
    lowerText.includes(MISSING_INFO_PLACEHOLDER.toLowerCase()) ||
    lowerText.includes(MISSING_NAME_PLACEHOLDER.toLowerCase()) ||
    lowerText === 'unknown'
  );
};


const hasMissingInfo = (cvData: CvOutput): boolean => {
  if (isMissing(cvData.fullName) || isMissing(cvData.email) || isMissing(cvData.phone) || isMissing(cvData.location) || isMissing(cvData.summary)) {
    return true;
  }
  if (cvData.workExperience.some(job => isMissing(job.jobTitle) || isMissing(job.company) || isMissing(job.duration) || job.responsibilities.some(isMissing))) {
    return true;
  }
  if (cvData.education.some(edu => isMissing(edu.degree) || isMissing(edu.institution) || isMissing(edu.year))) {
    return true;
  }
  if (cvData.skills.some(isMissing)) {
    return true;
  }
  return false;
};


const ExportButton = ({ cvData }: { cvData: CvOutput }) => {
  const showsWarning = hasMissingInfo(cvData);

  const handleExport = () => {
    try {
      const jsonString = JSON.stringify(cvData);
      const base64String = btoa(jsonString);
      const url = `/cv/print?data=${encodeURIComponent(base64String)}`;
      window.open(url, '_blank');
    } catch (error) {
      console.error('Failed to serialize CV data for printing:', error);
      alert('An error occurred while preparing the CV for export.');
    }
  };

  if (showsWarning) {
    return (
      <AlertDialog>
        <AlertDialogTrigger asChild>
           <Button
            variant="ghost"
            size="icon"
            aria-label="Export CV as PDF"
            className="text-slate-600 hover:text-slate-900"
          >
            <FileDown className="h-4 w-4" />
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Incomplete CV</AlertDialogTitle>
            <AlertDialogDescription>
              Your CV has missing sections. Are you sure you want to export it? It's recommended to fill out all details first.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleExport}>
              Continue Anyway
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    );
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      aria-label="Export CV as PDF"
      className="text-slate-600 hover:text-slate-900"
      onClick={handleExport}
    >
      <FileDown className="h-4 w-4" />
    </Button>
  );
};


const MissingInfo = ({
  text,
  fieldName,
  isBlock,
}: {
  text: string;
  fieldName?: string;
  isBlock?: boolean;
}) => {
  if (!isMissing(text)) {
    return <>{text}</>;
  }
  
  const Wrapper = isBlock ? 'div': 'span';

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Wrapper
            className="font-semibold text-red-600"
            data-missing="true"
          >
            <AlertTriangle className="mr-1 inline-block h-4 w-4" />
            {fieldName}
          </Wrapper>
        </TooltipTrigger>
        <TooltipContent className="bg-slate-800 text-white">
          <div>This information was not found in your bio.</div>
          <div>Click to edit it directly.</div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

interface CvViewProps {
  cvData: CvOutput;
  onCvUpdate: (newCvData: CvOutput) => void;
  isPrintView?: boolean;
}

export function CvView({ cvData, onCvUpdate, isPrintView = false }: CvViewProps) {
  const [isUpdating, startUpdateTransition] = useTransition();
  const { toast } = useToast();

  if (!cvData) {
    return (
      <Card>
        <CardContent className="p-4 text-center text-muted-foreground">
          <p>No CV could be generated based on the provided input.</p>
        </CardContent>
      </Card>
    );
  }

  const handleFieldUpdate = (fieldKey: string, newValue: string) => {
    startUpdateTransition(async () => {
      const result = await updateCvFieldAction({
        existingCv: cvData,
        fieldToUpdate: fieldKey,
        newValue: newValue,
      });

      if (result.success) {
        onCvUpdate(result.data);
        toast({
            title: 'CV Updated',
            description: 'The field has been successfully updated.',
        });
      } else {
        toast({
            variant: 'destructive',
            title: 'Update Failed',
            description: result.error,
        });
      }
    });
  };

  return (
    <div className="rounded-lg bg-white p-2 text-black">
      {isUpdating && (
        <div className="absolute inset-0 z-10 flex items-center justify-center rounded-lg bg-white/70">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      )}
      <div>
        <Card className="font-sans bg-white text-black shadow-lg relative">
          {!isPrintView && (
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-foreground">Mockup CV</CardTitle>
              <ExportButton cvData={cvData} />
            </CardHeader>
          )}
          <CardContent className="p-6 text-sm">
            {/* Header Section */}
            <div className="mb-6 text-center" data-missing={isMissing(cvData.fullName)}>
              <h1 className="text-3xl font-bold text-slate-900">
                <EditableCvField
                    value={cvData.fullName}
                    onSave={(newValue) => handleFieldUpdate('fullName', newValue)}
                    fieldName="Full Name"
                    isMissing={isMissing(cvData.fullName)}
                    className="text-3xl font-bold"
                 />
              </h1>
              <div className="mt-2 flex flex-wrap justify-center gap-x-4 gap-y-1 text-slate-500">
                <div className="flex items-center gap-2" data-missing={isMissing(cvData.email)}>
                  <Mail className="h-4 w-4" />
                   <EditableCvField
                    value={cvData.email}
                    onSave={(newValue) => handleFieldUpdate('email', newValue)}
                    fieldName="Email"
                    isMissing={isMissing(cvData.email)}
                  />
                </div>
                <div className="flex items-center gap-2" data-missing={isMissing(cvData.phone)}>
                  <Phone className="h-4 w-4" />
                   <EditableCvField
                    value={cvData.phone}
                    onSave={(newValue) => handleFieldUpdate('phone', newValue)}
                    fieldName="Phone"
                    isMissing={isMissing(cvData.phone)}
                  />
                </div>
                <div className="flex items-center gap-2" data-missing={isMissing(cvData.location)}>
                  <MapPin className="h-4 w-4" />
                  <EditableCvField
                    value={cvData.location}
                    onSave={(newValue) => handleFieldUpdate('location', newValue)}
                    fieldName="Location"
                    isMissing={isMissing(cvData.location)}
                  />
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
                <EditableCvField
                    value={cvData.summary}
                    onSave={(newValue) => handleFieldUpdate('summary', newValue)}
                    fieldName="Summary"
                    isMissing={isMissing(cvData.summary)}
                    isBlock
                    multiline
                  />
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
                         <EditableCvField
                            value={job.jobTitle}
                            onSave={(newValue) => handleFieldUpdate(`workExperience.${index}.jobTitle`, newValue)}
                            fieldName="Job Title"
                            isMissing={isMissing(job.jobTitle)}
                            className="text-lg font-semibold"
                        />
                      </h3>
                      <div className="text-sm text-slate-500">
                        <EditableCvField
                            value={job.duration}
                            onSave={(newValue) => handleFieldUpdate(`workExperience.${index}.duration`, newValue)}
                            fieldName="Duration"
                            isMissing={isMissing(job.duration)}
                            className="text-sm"
                        />
                      </div>
                    </div>
                    <h4 className="text-md font-medium text-slate-700">
                       <EditableCvField
                            value={job.company}
                            onSave={(newValue) => handleFieldUpdate(`workExperience.${index}.company`, newValue)}
                            fieldName="Company"
                            isMissing={isMissing(job.company)}
                            className="text-md font-medium"
                        />
                    </h4>
                    <ul className="mt-2 list-disc space-y-1 pl-5 text-slate-600">
                      {job.responsibilities.map((responsibility, i) => (
                        <li key={i} data-missing={isMissing(responsibility)}>
                          <EditableCvField
                            value={responsibility}
                            onSave={(newValue) => handleFieldUpdate(`workExperience.${index}.responsibilities.${i}`, newValue)}
                            fieldName="Responsibility"
                            isMissing={isMissing(responsibility)}
                          />
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
                         <EditableCvField
                            value={edu.degree}
                            onSave={(newValue) => handleFieldUpdate(`education.${index}.degree`, newValue)}
                            fieldName="Degree"
                            isMissing={isMissing(edu.degree)}
                            className="text-lg font-semibold"
                        />
                      </h3>
                      <div className="text-md text-slate-600">
                        <EditableCvField
                            value={edu.institution}
                            onSave={(newValue) => handleFieldUpdate(`education.${index}.institution`, newValue)}
                            fieldName="Institution"
                            isMissing={isMissing(edu.institution)}
                            className="text-md"
                        />
                      </div>
                    </div>
                    <div className="text-sm text-slate-500">
                      <EditableCvField
                            value={edu.year || ''}
                            onSave={(newValue) => handleFieldUpdate(`education.${index}.year`, newValue)}
                            fieldName="Year"
                            isMissing={isMissing(edu.year)}
                            className="text-sm"
                        />
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
                   <div key={index} className="rounded-full bg-slate-100 px-3 py-1 text-sm text-slate-700" data-missing={isMissing(skill)}>
                     <EditableCvField
                        value={skill}
                        onSave={(newValue) => handleFieldUpdate(`skills.${index}`, newValue)}
                        fieldName="Skill"
                        isMissing={isMissing(skill)}
                        className="text-sm"
                    />
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
