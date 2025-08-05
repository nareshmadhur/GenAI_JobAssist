

'use client';

import React, { useState, useEffect } from 'react';
import type { ControllerRenderProps } from 'react-hook-form';
import { Edit } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import type { JobApplicationData } from '@/lib/schemas';
import type { EditRequest } from '@/app/page';

interface ExpandableTextareaProps {
  field: ControllerRenderProps<Omit<JobApplicationData, 'generationType'>>;
  label: string;
  placeholder: string;
  editRequest: EditRequest | null;
  onEditRequestProcessed: () => void;
  fieldName: 'bio' | 'jobDescription';
}

/**
 * A component that displays a preview of a text area and opens a dialog
 * for full editing. It shows a persistent edit icon for better UX on all devices.
 */
export function ExpandableTextarea({
  field,
  label,
  placeholder,
  editRequest,
  onEditRequestProcessed,
  fieldName,
}: ExpandableTextareaProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [editedValue, setEditedValue] = useState(field.value || '');

  useEffect(() => {
    // This effect handles appending text when a user clicks a "missing info" warning.
    if (editRequest && editRequest.field === fieldName) {
      // Always get the latest value from the form state to avoid using stale local state.
      const currentVal = field.value || '';
      
      // Ensure there's a double newline before appending the new text,
      // unless the current value is empty.
      const separator = currentVal.trim().length > 0 ? '\n\n' : '';

      setEditedValue(currentVal + separator + editRequest.appendText);
      setIsOpen(true); // Open the dialog to show the change
      onEditRequestProcessed(); // Reset the request so it doesn't fire again
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editRequest, fieldName, onEditRequestProcessed]);


  useEffect(() => {
    // This effect ensures that if the dialog is opened manually,
    // it shows the latest value from the form state.
    if (isOpen) {
      setEditedValue(field.value || '');
    }
  }, [isOpen, field.value]);

  const handleSave = () => {
    field.onChange(editedValue);
    setIsOpen(false);
  };

  const handleCancel = () => {
    setIsOpen(false);
  };

  const hasValue = field.value && field.value.length > 0;

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <FormItem>
        <FormLabel>{label}</FormLabel>
        <DialogTrigger asChild>
          <div
            role="button"
            className={cn(
              'relative flex w-full cursor-pointer rounded-md border border-input bg-background/50 px-3 py-2 text-sm ring-offset-background transition-colors hover:border-primary/50',
              !hasValue && 'text-muted-foreground'
            )}
          >
            <p className="line-clamp-3 w-full whitespace-pre-wrap pr-6 opacity-70">
              {hasValue ? field.value : placeholder}
            </p>
            <Edit className="absolute right-2 top-2 h-4 w-4 text-muted-foreground" />
          </div>
        </DialogTrigger>
        <FormMessage />
      </FormItem>

      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{label}</DialogTitle>
          <DialogDescription>
            View and edit the content below. Click save when you're done.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <Textarea
            value={editedValue}
            onChange={(e) => setEditedValue(e.target.value)}
            placeholder={placeholder}
            className="h-96 min-h-96"
            aria-label={label}
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={handleCancel}>
            Cancel
          </Button>
          <Button onClick={handleSave}>Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
