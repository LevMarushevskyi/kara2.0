import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { Play, Pause, SkipForward, Square, FastForward } from 'lucide-react';

// Speed presets in milliseconds (delay between steps)
const SPEED_PRESETS = {
  slow: { label: 'Slow', value: 1000, icon: '🐢' },
  normal: { label: 'Normal', value: 500, icon: '🚶' },
  fast: { label: 'Fast', value: 200, icon: '🏃' },
  instant: { label: 'Instant', value: 50, icon: '⚡' },
} as const;

type SpeedPreset = keyof typeof SPEED_PRESETS;

// Helper to determine which preset matches current speed (or null for custom)
const getActivePreset = (speed: number): SpeedPreset | null => {
  for (const [key, preset] of Object.entries(SPEED_PRESETS)) {
    if (preset.value === speed) return key as SpeedPreset;
  }
  return null;
};

// Helper to get speed description
const getSpeedDescription = (speed: number): string => {
  if (speed >= 900) return 'Very Slow';
  if (speed >= 700) return 'Slow';
  if (speed >= 400) return 'Normal';
  if (speed >= 150) return 'Fast';
  return 'Instant';
};

// Speed indicator that pulses during execution
const SpeedIndicator = ({
  isRunning,
  speed
}: {
  isRunning: boolean;
  speed: number;
}) => {
  if (!isRunning) return null;

  const pulseDuration = Math.max(0.2, speed / 1000);

  return (
    <div className="flex items-center gap-2 text-xs text-green-600 dark:text-green-400">
      <div
        className="w-2 h-2 rounded-full bg-green-500"
        style={{
          animation: `pulse ${pulseDuration}s ease-in-out infinite`,
        }}
      />
      <span>Running at {getSpeedDescription(speed)}</span>
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(0.8); }
        }
      `}</style>
    </div>
  );
};

interface ExecutionControlPanelProps {
  // Execution state
  isRunning: boolean;
  executionSpeed: number;
  onExecutionSpeedChange: (speed: number) => void;

  // Execution controls
  onRun: () => void;
  onPause: () => void;
  onStep: () => void;
  onEnd: () => void;
  onSkip?: () => void;

  // Disabled states
  canRun: boolean;
  canStep: boolean;
  canEnd: boolean;
  canSkip?: boolean;

  // Optional: compact mode for smaller spaces
  compact?: boolean;
}

const ExecutionControlPanel = ({
  isRunning,
  executionSpeed,
  onExecutionSpeedChange,
  onRun,
  onPause,
  onStep,
  onEnd,
  onSkip,
  canRun,
  canStep,
  canEnd,
  canSkip = false,
  compact = false,
}: ExecutionControlPanelProps) => {
  return (
    <Card className={`${compact ? 'p-3' : 'p-4'}`}>
      <div className="flex items-center justify-between mb-3">
        <h3 className={`font-semibold ${compact ? 'text-xs' : 'text-sm'}`}>
          Execute Program
        </h3>
        <SpeedIndicator isRunning={isRunning} speed={executionSpeed} />
      </div>

      {/* Run/Pause and Step buttons */}
      <div className="grid grid-cols-2 gap-2 mb-2">
        <Button
          onClick={isRunning ? onPause : onRun}
          disabled={!canRun && !isRunning}
          size="sm"
          variant={isRunning ? 'destructive' : 'default'}
          className="gap-1"
        >
          {isRunning ? (
            <>
              <Pause className="h-3 w-3" />
              Pause
            </>
          ) : (
            <>
              <Play className="h-3 w-3" />
              Run
            </>
          )}
        </Button>
        <Button
          onClick={onStep}
          disabled={!canStep || isRunning}
          size="sm"
          variant="secondary"
          className="gap-1"
        >
          <SkipForward className="h-3 w-3" />
          Step
        </Button>
      </div>

      {/* End and Skip buttons */}
      <div className={`grid ${onSkip ? 'grid-cols-2' : 'grid-cols-1'} gap-2 mb-4`}>
        <Button
          onClick={onEnd}
          disabled={!canEnd}
          size="sm"
          variant="outline"
          className="gap-1"
        >
          <Square className="h-3 w-3" />
          End
        </Button>
        {onSkip && (
          <Button
            onClick={onSkip}
            disabled={!canSkip}
            size="sm"
            variant="outline"
            className="gap-1"
          >
            <FastForward className="h-3 w-3" />
            Skip
          </Button>
        )}
      </div>

      {/* Divider */}
      <div className="border-t border-border my-4" />

      {/* Enhanced Execution Speed Control */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-medium">Execution Speed</h4>
          <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded">
            {getSpeedDescription(executionSpeed)} ({executionSpeed}ms)
          </span>
        </div>

        {/* Speed Preset Buttons */}
        <div className="grid grid-cols-4 gap-1">
          {(Object.entries(SPEED_PRESETS) as [SpeedPreset, typeof SPEED_PRESETS[SpeedPreset]][]).map(
            ([key, preset]) => {
              const isActive = executionSpeed === preset.value;
              return (
                <Button
                  key={key}
                  variant={isActive ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => onExecutionSpeedChange(preset.value)}
                  className={`
                    flex flex-col items-center gap-0.5 h-auto py-2 px-1
                    ${isActive ? 'ring-2 ring-offset-1 ring-primary' : ''}
                  `}
                  title={`${preset.label} speed (${preset.value}ms delay)`}
                >
                  <span className={compact ? 'text-sm' : 'text-base'}>{preset.icon}</span>
                  <span className="text-[10px] font-medium">{preset.label}</span>
                </Button>
              );
            }
          )}
        </div>

        {/* Fine-tuning Slider */}
        <div className="space-y-1">
          <div className="flex items-center justify-between text-[10px] text-muted-foreground">
            <span>Fine-tune:</span>
            <span className={getActivePreset(executionSpeed) ? 'opacity-50' : 'text-accent font-medium'}>
              {getActivePreset(executionSpeed) ? 'Using preset' : 'Custom speed'}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">🐢</span>
            <Slider
              value={[1000 - executionSpeed]}
              onValueChange={(value) => onExecutionSpeedChange(1000 - value[0])}
              min={0}
              max={950}
              step={50}
              className="flex-1"
            />
            <span className="text-xs text-muted-foreground">⚡</span>
          </div>
        </div>
      </div>
    </Card>
  );
};

export default ExecutionControlPanel;
