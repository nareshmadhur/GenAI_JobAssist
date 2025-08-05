'use client';

import React, { useState, useRef, useEffect } from 'react';
import { AlertTriangle, Check, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Textarea } from './ui/textarea';
import { Input } from './ui/input';
import { Button } from './ui/button';

interface EditableCvFieldProps {
  value: string;
  onSave: (newValue: string) => void;
  isMissing: boolean;
  fieldName: string;
  className?: string;
  isBlock?: boolean;
  multiline?: boolean;
}

export function EditableCvField({
  value,
  onSave,
  isMissing,
  fieldName,
  className,
  isBlock = false,
  multiline = false,
}: EditableCvFieldProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [currentValue, setCurrentValue] = useState(value);
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleSave = () => {
    if (currentValue !== value) {
      onSave(currentValue);
    }
    setIsEditing(false);
  };

  const handleCancel = () => {
    setCurrentValue(value);
    setIsEditing(false);
  };
  
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSave();
    }
    if (e.key === 'Escape') {
        e.preventDefault();
        handleCancel();
    }
  };

  if (isEditing) {
    const InputComponent = multiline ? Textarea : Input;
    const props = {
      ref: inputRef as any,
      value: currentValue,
      onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setCurrentValue(e.target.value),
      onBlur: handleSave,
      onKeyDown: handleKeyDown,
      className: cn('h-auto p-1 text-sm bg-background/80', multiline ? 'min-h-[60px]' : '', className),
    };
    return (
      <div className={cn('flex w-full items-center gap-2', isBlock ? 'flex-col items-start' : '')}>
        <InputComponent {...props} />
        <div className="flex gap-1">
          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={handleSave}><Check className="h-4 w-4"/></Button>
          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={handleCancel}><X className="h-4 w-4"/></Button>
        </div>
      </div>
    );
  }

  const Wrapper = isBlock ? 'div' : 'span';

  if (isMissing) {
    return (
      <Wrapper
        className={cn(
          'cursor-pointer font-semibold text-red-600 hover:underline',
          className
        )}
        onClick={() => {
          setCurrentValue(''); // Clear placeholder text on edit
          setIsEditing(true);
        }}
      >
        <AlertTriangle className="mr-1 inline-block h-4 w-4" />
        {fieldName}
      </Wrapper>
    );
  }

  return (
    <Wrapper
      className={cn('cursor-pointer rounded-sm hover:bg-slate-100 p-1 -m-1', className)}
      onClick={() => setIsEditing(true)}
    >
      {value}
    </Wrapper>
  );
}
