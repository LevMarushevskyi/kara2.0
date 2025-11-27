import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Trophy, Star, ArrowRight, RotateCcw } from 'lucide-react';

interface LevelCompleteDialogProps {
  isOpen: boolean;
  levelTitle: string;
  commandCount: number;
  stars: number;
  onNextLevel: () => void;
  onRetry: () => void;
  onLevelSelect: () => void;
  hasNextLevel: boolean;
}

const LevelCompleteDialog = ({
  isOpen,
  levelTitle,
  commandCount,
  stars,
  onNextLevel,
  onRetry,
  onLevelSelect,
  hasNextLevel,
}: LevelCompleteDialogProps) => {
  return (
    <Dialog open={isOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex justify-center mb-4">
            <div className="h-20 w-20 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center animate-in zoom-in duration-500">
              <Trophy className="h-10 w-10 text-white" />
            </div>
          </div>
          <DialogTitle className="text-center text-2xl">
            Level Complete! 🎉
          </DialogTitle>
          <DialogDescription className="text-center text-base">
            {levelTitle}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Stars */}
          <div className="flex justify-center gap-2">
            {[1, 2, 3].map((i) => (
              <Star
                key={i}
                className={`h-8 w-8 transition-all duration-300 ${
                  i <= stars
                    ? 'fill-yellow-500 text-yellow-500 animate-in zoom-in'
                    : 'text-muted-foreground/30'
                }`}
                style={{ animationDelay: `${i * 100}ms` }}
              />
            ))}
          </div>

          {/* Stats */}
          <div className="bg-muted/50 rounded-lg p-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Commands used:</span>
              <span className="font-semibold">{commandCount}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Rating:</span>
              <span className="font-semibold">
                {stars === 3 ? 'Excellent!' : stars === 2 ? 'Good!' : 'Complete!'}
              </span>
            </div>
          </div>

          {/* Actions */}
          <div className="space-y-2">
            {hasNextLevel && (
              <Button onClick={onNextLevel} size="lg" className="w-full gap-2">
                Next Level
                <ArrowRight className="h-4 w-4" />
              </Button>
            )}
            <div className="grid grid-cols-2 gap-2">
              <Button onClick={onRetry} variant="outline" size="lg" className="gap-2">
                <RotateCcw className="h-4 w-4" />
                Retry
              </Button>
              <Button onClick={onLevelSelect} variant="outline" size="lg">
                Level Select
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default LevelCompleteDialog;
