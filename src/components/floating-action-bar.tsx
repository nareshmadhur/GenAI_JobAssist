
import {
  Briefcase,
  FileText,
  Lightbulb,
  Loader2,
  MessageSquareMore,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import type { ActiveView, GenerationType } from './job-spark-app';

interface FloatingActionBarProps {
  isGenerating: boolean;
  activeView: ActiveView;
  onGeneration: (generationType: GenerationType) => void;
}

/**
 * A floating action bar that contains the main generation buttons.
 *
 * @param {FloatingActionBarProps} props - The component props.
 * @returns {JSX.Element} The rendered floating action bar.
 */
export function FloatingActionBar({
  isGenerating,
  activeView,
  onGeneration,
}: FloatingActionBarProps) {
  const baseButtonClass =
    'h-auto flex-col rounded-full py-2 text-primary-foreground hover:bg-primary/70 hover:text-primary-foreground/90 data-[active=true]:bg-primary-foreground data-[active=true]:text-primary data-[active=true]:hover:bg-primary-foreground/90';

  return (
    <footer className="fixed bottom-0 left-0 z-20 w-full p-4">
      <div className="mx-auto grid w-full max-w-lg grid-cols-2 gap-1 rounded-full bg-primary p-1 shadow-lg sm:grid-cols-4">
        <Button
          onClick={() => onGeneration('coverLetter')}
          disabled={isGenerating}
          variant="ghost"
          data-active={activeView === 'coverLetter'}
          className={baseButtonClass}
        >
          {isGenerating && activeView === 'coverLetter' ? (
            <Loader2 className="animate-spin" />
          ) : (
            <FileText />
          )}
          <span className="text-xs">Cover Letter</span>
        </Button>

        <Button
          onClick={() => onGeneration('cv')}
          disabled={isGenerating}
          variant="ghost"
          data-active={activeView === 'cv'}
          className={baseButtonClass}
        >
          {isGenerating && activeView === 'cv' ? (
            <Loader2 className="animate-spin" />
          ) : (
            <Briefcase />
          )}
          <span className="text-xs">CV Advice</span>
        </Button>

        <Button
          onClick={() => onGeneration('deepAnalysis')}
          disabled={isGenerating}
          variant="ghost"
          data-active={activeView === 'deepAnalysis'}
          className={baseButtonClass}
        >
          {isGenerating && activeView === 'deepAnalysis' ? (
            <Loader2 className="animate-spin" />
          ) : (
            <Lightbulb />
          )}
          <span className="text-xs">Analysis</span>
        </Button>

        <Button
          onClick={() => onGeneration('qAndA')}
          disabled={isGenerating}
          variant="ghost"
          data-active={activeView === 'qAndA'}
          className={baseButtonClass}
        >
          {isGenerating && activeView === 'qAndA' ? (
            <Loader2 className="animate-spin" />
          ) : (
            <MessageSquareMore />
          )}
          <span className="text-xs">Q & A</span>
        </Button>
      </div>
    </footer>
  );
}
