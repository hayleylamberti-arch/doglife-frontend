import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { HelpCircle, BookOpen, RotateCcw, CheckCircle } from "lucide-react";

interface TutorialTriggerProps {
  hasCompleted: boolean;
  onStartTutorial: () => void;
  onResetTutorial: () => void;
}

export default function TutorialTrigger({ hasCompleted, onStartTutorial, onResetTutorial }: TutorialTriggerProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="relative">
          <HelpCircle className="h-4 w-4" />
          {!hasCompleted && (
            <div className="absolute -top-1 -right-1 h-3 w-3 bg-blue-500 rounded-full animate-pulse" />
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuItem onClick={onStartTutorial} className="flex items-center gap-2">
          <BookOpen className="h-4 w-4" />
          {hasCompleted ? 'View Tutorial Again' : 'Start Tutorial'}
        </DropdownMenuItem>
        {hasCompleted && (
          <DropdownMenuItem onClick={onResetTutorial} className="flex items-center gap-2">
            <RotateCcw className="h-4 w-4" />
            Reset Tutorial Progress
          </DropdownMenuItem>
        )}
        {hasCompleted && (
          <DropdownMenuItem disabled className="flex items-center gap-2 text-green-600">
            <CheckCircle className="h-4 w-4" />
            Tutorial Completed
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}