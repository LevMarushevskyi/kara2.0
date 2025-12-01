import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { scenarios } from '@/models/scenarios';
import { getScenarioProgress } from '@/models/scenario';
import { Lock, Star, Trophy } from 'lucide-react';

interface ExerciseSelectorProps {
  currentScenarioId?: string;
  onSelectScenario: (scenarioId: string) => void;
  onClose: () => void;
}

const ExerciseSelector = ({ currentScenarioId, onSelectScenario, onClose }: ExerciseSelectorProps) => {
  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy':
        return 'bg-green-500/10 text-green-700 dark:text-green-400';
      case 'medium':
        return 'bg-yellow-500/10 text-yellow-700 dark:text-yellow-400';
      case 'hard':
        return 'bg-red-500/10 text-red-700 dark:text-red-400';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  const renderStars = (stars: number) => {
    return (
      <div className="flex gap-0.5">
        {[1, 2, 3].map((i) => (
          <Star
            key={i}
            className={`h-3 w-3 ${
              i <= stars ? 'fill-yellow-500 text-yellow-500' : 'text-muted-foreground/30'
            }`}
          />
        ))}
      </div>
    );
  };

  const allProgress = scenarios.map((scenario) => ({
    scenario,
    progress: getScenarioProgress(scenario.id),
  }));

  const completedCount = allProgress.filter((p) => p.progress?.completed).length;

  return (
    <Card className="w-full max-w-4xl mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold">Exercise Select</h2>
          <p className="text-sm text-muted-foreground mt-1">Choose a challenge to solve</p>
        </div>
        <div className="flex items-center gap-2">
          <Trophy className="h-5 w-5 text-yellow-500" />
          <span className="font-semibold">
            {completedCount}/{scenarios.length}
          </span>
        </div>
      </div>

      <ScrollArea className="h-[500px] pr-4">
        <div className="grid gap-3">
          {allProgress.map(({ scenario, progress }, index) => {
            const isLocked = index > 0 && !allProgress[index - 1].progress?.completed;
            const isCurrent = scenario.id === currentScenarioId;

            return (
              <div
                key={scenario.id}
                className={`p-4 rounded-lg border-2 transition-all ${
                  isCurrent
                    ? 'border-accent bg-accent/5'
                    : 'border-border bg-card hover:border-accent/50'
                } ${isLocked ? 'opacity-50' : ''}`}
              >
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center font-bold text-lg">
                    {isLocked ? (
                      <Lock className="h-5 w-5 text-muted-foreground" />
                    ) : progress?.completed ? (
                      <Trophy className="h-5 w-5 text-yellow-500" />
                    ) : (
                      index + 1
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold">{scenario.title}</h3>
                      <Badge
                        variant="secondary"
                        className={getDifficultyColor(scenario.difficulty)}
                      >
                        {scenario.difficulty}
                      </Badge>
                    </div>

                    <p className="text-sm text-muted-foreground mb-2">{scenario.description}</p>

                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span>{scenario.allowedCommands.length} commands available</span>
                      {progress?.completed && (
                        <>
                          {renderStars(progress.stars)}
                          <span>Best: {progress.bestCommandCount} steps</span>
                        </>
                      )}
                    </div>
                  </div>

                  <Button
                    onClick={() => {
                      onSelectScenario(scenario.id);
                      onClose();
                    }}
                    disabled={isLocked}
                    variant={isCurrent ? 'default' : 'outline'}
                    size="sm"
                  >
                    {isCurrent ? 'Current' : isLocked ? 'Locked' : 'Play'}
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      </ScrollArea>
    </Card>
  );
};

export default ExerciseSelector;
