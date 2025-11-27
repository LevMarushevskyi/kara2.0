import { useState } from 'react';
import { Code2 } from 'lucide-react';
import WorldView from '@/components/WorldView';
import Controls from '@/components/Controls';
import { createWorld, moveForward, turnLeft, turnRight, resetWorld } from '@/models/world';
import { World } from '@/models/types';

const Index = () => {
  const [world, setWorld] = useState<World>(() => createWorld(8, 8));

  const handleMoveForward = () => {
    setWorld((prevWorld) => moveForward(prevWorld));
  };

  const handleTurnLeft = () => {
    setWorld((prevWorld) => turnLeft(prevWorld));
  };

  const handleTurnRight = () => {
    setWorld((prevWorld) => turnRight(prevWorld));
  };

  const handleReset = () => {
    setWorld((prevWorld) => resetWorld(prevWorld));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      {/* Header */}
      <header className="container mx-auto px-6 py-6 border-b border-border/50">
        <nav className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-accent flex items-center justify-center">
              <Code2 className="h-5 w-5 text-accent-foreground" />
            </div>
            <span className="text-lg font-semibold">Ladybug World</span>
          </div>
          <div className="text-sm text-muted-foreground">
            Grid Simulation Engine
          </div>
        </nav>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-12">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12 animate-in fade-in slide-in-from-bottom-3 duration-500">
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">
              Programmable Grid World
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              A 2D simulation where a ladybug robot moves around based on simple commands.
              Pure logic layer with React visualization.
            </p>
          </div>

          <div className="grid md:grid-cols-[1fr,300px] gap-8 items-start animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* World View */}
            <div className="flex justify-center">
              <WorldView world={world} />
            </div>

            {/* Controls */}
            <div className="bg-card rounded-xl border border-border p-6 shadow-lg sticky top-6">
              <Controls
                onMoveForward={handleMoveForward}
                onTurnLeft={handleTurnLeft}
                onTurnRight={handleTurnRight}
                onReset={handleReset}
              />
            </div>
          </div>

          {/* Info Section */}
          <div className="mt-12 p-6 bg-muted/50 rounded-xl border border-border/50 animate-in fade-in slide-in-from-bottom-5 duration-900">
            <h2 className="text-xl font-semibold mb-3">Architecture</h2>
            <div className="grid md:grid-cols-2 gap-4 text-sm">
              <div>
                <h3 className="font-medium text-foreground mb-2">Pure Logic Layer</h3>
                <ul className="space-y-1 text-muted-foreground">
                  <li>• TypeScript types (World, Cell, Character)</li>
                  <li>• Pure functions (moveForward, turnLeft, turnRight)</li>
                  <li>• Immutable state updates</li>
                  <li>• Easy to test and reason about</li>
                </ul>
              </div>
              <div>
                <h3 className="font-medium text-foreground mb-2">React UI Layer</h3>
                <ul className="space-y-1 text-muted-foreground">
                  <li>• WorldView component for visualization</li>
                  <li>• Controls for user interaction</li>
                  <li>• State management with useState</li>
                  <li>• Clean separation of concerns</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Index;
