
'use client';

import React, { useState, useRef, useEffect } from 'react';
import { AlertTriangle, Check, X, Sparkles, Loader2, Send } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Textarea } from './ui/textarea';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { useToast } from '@/hooks/use-toast';
import { reviseCvFieldAction } from '@/app/actions';

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
  const [isRevising, setIsRevising] = useState(false);
  const [showRevisionInput, setShowRevisionInput] = useState(false);
  const [revisionInstruction, setRevisionInstruction] = useState('');
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null);
  const { toast } = useToast();

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
    setShowRevisionInput(false);
    setRevisionInstruction('');
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

  const handleEditClick = () => {
    setCurrentValue(isMissing ? '' : value); // Clear placeholder text on edit
    setIsEditing(true);
  }

  const handleRevise = async () => {
    if (!currentValue.trim()) return;
    setIsRevising(true);
    const result = await reviseCvFieldAction({
      originalText: currentValue,
      instruction: revisionInstruction,
      fieldName,
    });
    setIsRevising(false);
    
    if (result && 'error' in result && result.error) {
       toast({ title: 'AI Revision Failed', description: result.error, variant: 'destructive' });
    } else if (result && 'revisedText' in result) {
       setCurrentValue(result.revisedText);
       setShowRevisionInput(false);
       setRevisionInstruction('');
       toast({ title: 'AI Revision Applied', description: 'Review the changes before saving.' });
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
      className: cn('h-auto p-1 text-sm bg-slate-100', multiline ? 'min-h-[60px]' : '', className),
    };
    return (
      <div className={cn('flex w-full flex-col gap-2', isBlock ? 'items-start' : '')}>
        <div className="flex w-full items-center gap-2">
          <InputComponent {...props} disabled={isRevising} />
          <div className="flex gap-1 shrink-0">
            <Button variant="ghost" size="icon" className="h-6 w-6 text-indigo-500 hover:text-indigo-600 hover:bg-indigo-50" onClick={() => setShowRevisionInput(!showRevisionInput)} title="Revise with AI">
              <Sparkles className="h-4 w-4"/>
            </Button>
            <Button variant="ghost" size="icon" className="h-6 w-6 text-green-600 hover:bg-green-50" onClick={handleSave} disabled={isRevising}><Check className="h-4 w-4"/></Button>
            <Button variant="ghost" size="icon" className="h-6 w-6 text-red-500 hover:bg-red-50" onClick={handleCancel} disabled={isRevising}><X className="h-4 w-4"/></Button>
          </div>
        </div>
        
        {showRevisionInput && (
          <div className="flex w-full items-center gap-2 rounded-md bg-indigo-50 p-2 text-sm border border-indigo-100 mb-1">
            <Sparkles className="h-4 w-4 text-indigo-500 shrink-0" />
            <Input 
              autoFocus
              placeholder="E.g. Make it sound more impactful, quantify achievements..." 
              value={revisionInstruction}
              onChange={(e) => setRevisionInstruction(e.target.value)}
              disabled={isRevising}
              className="h-8 bg-white text-xs"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleRevise();
                }
              }}
            />
            <Button size="sm" className="h-8 px-3 shrink-0 bg-indigo-600 hover:bg-indigo-700" onClick={handleRevise} disabled={isRevising}>
              {isRevising ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <Send className="h-3 w-3 mr-1" />}
              Revise
            </Button>
          </div>
        )}
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
        onClick={handleEditClick}
      >
        <AlertTriangle className="mr-1 inline-block h-4 w-4" />
        {fieldName}
      </Wrapper>
    );
  }

  return (
    <Wrapper
      className={cn('cursor-pointer rounded-sm hover:bg-slate-100 p-1 -m-1', className)}
      onClick={handleEditClick}
    >
      {value}
    </Wrapper>
  );
}
