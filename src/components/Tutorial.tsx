import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ChevronLeft, ChevronRight, Lightbulb } from 'lucide-react';

interface TutorialStep {
  title: string;
  description: string;
  highlight?: string; // CSS selector or area to highlight
  position?: 'left' | 'right' | 'center';
}

interface TutorialProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: () => void;
}

const tutorialSteps: TutorialStep[] = [
  {
    title: 'Welcome to Kara Ladybug World! 🐞',
    description:
      "Kara is an educational programming environment where you'll learn to code by controlling a ladybug through puzzles. Let's learn the basics!",
    position: 'center',
  },
  {
    title: 'The World Grid',
    description:
      "This is Kara's world - a grid filled with objects. The red ladybug (🐞) is Kara, who you'll control. You'll see clovers (🍀), trees (🌳), mushrooms (🍄), and walls (🧱).",
    position: 'center',
  },
  {
    title: 'Building a Program',
    description:
      "On the left, you'll find the Programming Panel. Drag commands from the palette into the program area to create a sequence of instructions for Kara.",
    position: 'left',
  },
  {
    title: 'Available Commands',
    description:
      'Commands include Move Forward, Turn Left, Turn Right, Pick Clover, and Place Clover. Different levels allow different commands.',
    position: 'left',
  },
  {
    title: 'Running Your Program',
    description:
      'Use the Run button to execute all commands at once, or Step to execute one command at a time. This helps you debug your program!',
    position: 'left',
  },
  {
    title: 'World Editor',
    description:
      'On the right side, you can edit the world! Click objects to select them, then click on the grid to place them. You can also use templates and export your creations.',
    position: 'right',
  },
  {
    title: 'Keyboard Shortcuts',
    description:
      'Speed up your workflow with shortcuts: Space (Run/Pause), S (Step), R (Reset), C (Clear Program), and Ctrl+S (Export).',
    position: 'right',
  },
  {
    title: 'Levels & Goals',
    description:
      'Each level has a goal to complete. Solve it efficiently to earn up to 3 stars! Complete levels to unlock new challenges.',
    position: 'center',
  },
  {
    title: 'Ready to Start!',
    description:
      "You're all set! Start with Level 1: First Steps to begin your journey. Have fun learning to code with Kara! 🎉",
    position: 'center',
  },
];

const Tutorial = ({ isOpen, onClose, onComplete }: TutorialProps) => {
  const [currentStep, setCurrentStep] = useState(0);

  const handleNext = () => {
    if (currentStep < tutorialSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = () => {
    setCurrentStep(0);
    onComplete();
    onClose();
  };

  const handleSkip = () => {
    setCurrentStep(0);
    onClose();
  };

  const step = tutorialSteps[currentStep];
  const progress = ((currentStep + 1) / tutorialSteps.length) * 100;

  return (
    <Dialog open={isOpen} onOpenChange={handleSkip}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Lightbulb className="h-5 w-5 text-yellow-500" />
            {step.title}
          </DialogTitle>
          <DialogDescription className="text-base">{step.description}</DialogDescription>
        </DialogHeader>

        {/* Progress Bar */}
        <div className="w-full bg-muted rounded-full h-2 my-4">
          <div
            className="bg-accent h-2 rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Step Counter */}
        <div className="text-center text-sm text-muted-foreground mb-4">
          Step {currentStep + 1} of {tutorialSteps.length}
        </div>

        {/* Navigation Buttons */}
        <div className="flex justify-between gap-2">
          <Button
            variant="outline"
            onClick={handlePrevious}
            disabled={currentStep === 0}
            className="gap-2"
          >
            <ChevronLeft className="h-4 w-4" />
            Previous
          </Button>

          <div className="flex gap-2">
            <Button variant="ghost" onClick={handleSkip}>
              Skip Tutorial
            </Button>
            <Button onClick={handleNext} className="gap-2">
              {currentStep === tutorialSteps.length - 1 ? (
                'Get Started!'
              ) : (
                <>
                  Next
                  <ChevronRight className="h-4 w-4" />
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default Tutorial;
