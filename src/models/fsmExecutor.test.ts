import { describe, it, expect } from 'vitest';
import { executeFSMStep, validateFSMProgram } from './fsmExecutor';
import { FSMProgram, createEmptyFSM } from './fsm';
import { World, CellType, Direction } from './types';

// Helper to create a simple test world
function createTestWorld(width = 5, height = 5): World {
  const grid = Array(height)
    .fill(null)
    .map(() =>
      Array(width)
        .fill(null)
        .map(() => ({ type: CellType.Empty }))
    );

  return {
    width,
    height,
    grid,
    character: {
      position: { x: 2, y: 2 },
      direction: Direction.North,
      inventory: 0,
    },
  };
}

// Helper to create a simple FSM with one state
function createSimpleFSM(): FSMProgram {
  return {
    states: [
      {
        id: 'stop',
        name: 'Stop',
        x: 300,
        y: 100,
        transitions: [],
      },
      {
        id: 'start',
        name: 'Start',
        x: 100,
        y: 100,
        transitions: [
          {
            id: 'trans-1',
            targetStateId: 'stop',
            detectorConditions: {
              treeFront: null,
              treeLeft: null,
              treeRight: null,
              mushroomFront: null,
              onLeaf: null,
            },
            actions: [{ type: 'move' }],
          },
        ],
        activeDetectors: [],
      },
    ],
    startStateId: 'start',
    stopStateId: 'stop',
  };
}

describe('FSMExecutor', () => {
  describe('validateFSMProgram', () => {
    it('should validate a correct FSM program', () => {
      const program = createSimpleFSM();
      const result = validateFSMProgram(program);
      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should reject program with no start state', () => {
      const program = createSimpleFSM();
      program.startStateId = '';
      const result = validateFSMProgram(program);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('start state');
    });

    it('should reject program with missing start state', () => {
      const program = createSimpleFSM();
      program.startStateId = 'nonexistent';
      const result = validateFSMProgram(program);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('not found');
    });

    it('should reject program with no transitions', () => {
      const program = createSimpleFSM();
      // Remove all transitions from non-stop states
      program.states = program.states.map((s) => ({
        ...s,
        transitions: [],
      }));
      const result = validateFSMProgram(program);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('transition');
    });

    it('should accept empty FSM for editing', () => {
      const program = createEmptyFSM();
      const result = validateFSMProgram(program);
      // Empty FSM is valid for editing but has no start state
      expect(result.valid).toBe(false);
      expect(result.error).toContain('start state');
    });
  });

  describe('executeFSMStep', () => {
    it('should execute a simple move action', () => {
      const world = createTestWorld();
      const program = createSimpleFSM();
      const result = executeFSMStep(world, program, 'start');

      expect(result.error).toBeUndefined();
      // Character moved north from (2,2) to (2,1)
      expect(result.world.character.position).toEqual({ x: 2, y: 1 });
      expect(result.nextStateId).toBe('stop');
      expect(result.stopped).toBe(true);
    });

    it('should stop when reaching STOP state', () => {
      const world = createTestWorld();
      const program = createSimpleFSM();
      const result = executeFSMStep(world, program, 'stop');

      expect(result.stopped).toBe(true);
      expect(result.nextStateId).toBe('stop');
      // World should be unchanged
      expect(result.world.character.position).toEqual({ x: 2, y: 2 });
    });

    it('should return error for invalid current state', () => {
      const world = createTestWorld();
      const program = createSimpleFSM();
      const result = executeFSMStep(world, program, 'nonexistent');

      expect(result.stopped).toBe(true);
      expect(result.error).toContain('current state');
    });

    it('should return error when no transition matches', () => {
      const world = createTestWorld();
      // Place a tree in front so treeFront = true
      world.grid[1][2] = { type: CellType.Tree };

      const program: FSMProgram = {
        states: [
          {
            id: 'stop',
            name: 'Stop',
            x: 300,
            y: 100,
            transitions: [],
          },
          {
            id: 'start',
            name: 'Start',
            x: 100,
            y: 100,
            transitions: [
              {
                id: 'trans-1',
                targetStateId: 'stop',
                detectorConditions: {
                  treeFront: false, // Only matches when no tree
                  treeLeft: null,
                  treeRight: null,
                  mushroomFront: null,
                  onLeaf: null,
                },
                actions: [{ type: 'move' }],
              },
            ],
            activeDetectors: ['treeFront'],
          },
        ],
        startStateId: 'start',
        stopStateId: 'stop',
      };

      const result = executeFSMStep(world, program, 'start');
      expect(result.stopped).toBe(true);
      expect(result.error).toContain('stuck');
      expect(result.error).toContain('tree in front');
    });

    it('should execute multiple actions in a transition', () => {
      const world = createTestWorld();
      const program: FSMProgram = {
        states: [
          {
            id: 'stop',
            name: 'Stop',
            x: 300,
            y: 100,
            transitions: [],
          },
          {
            id: 'start',
            name: 'Start',
            x: 100,
            y: 100,
            transitions: [
              {
                id: 'trans-1',
                targetStateId: 'stop',
                detectorConditions: {
                  treeFront: null,
                  treeLeft: null,
                  treeRight: null,
                  mushroomFront: null,
                  onLeaf: null,
                },
                actions: [{ type: 'turnLeft' }, { type: 'turnLeft' }, { type: 'move' }],
              },
            ],
            activeDetectors: [],
          },
        ],
        startStateId: 'start',
        stopStateId: 'stop',
      };

      const result = executeFSMStep(world, program, 'start');
      expect(result.error).toBeUndefined();
      // Turned left twice (North -> West -> South), then moved south
      expect(result.world.character.direction).toBe(Direction.South);
      expect(result.world.character.position).toEqual({ x: 2, y: 3 });
    });

    it('should handle circular transitions (looping)', () => {
      const world = createTestWorld();
      const program: FSMProgram = {
        states: [
          {
            id: 'stop',
            name: 'Stop',
            x: 300,
            y: 100,
            transitions: [],
          },
          {
            id: 'start',
            name: 'Start',
            x: 100,
            y: 100,
            transitions: [
              {
                id: 'trans-1',
                targetStateId: 'start', // Loops back to same state
                detectorConditions: {
                  treeFront: null,
                  treeLeft: null,
                  treeRight: null,
                  mushroomFront: null,
                  onLeaf: null,
                },
                actions: [{ type: 'turnRight' }],
              },
            ],
            activeDetectors: [],
          },
        ],
        startStateId: 'start',
        stopStateId: 'stop',
      };

      // Execute one step
      const result1 = executeFSMStep(world, program, 'start');
      expect(result1.stopped).toBe(false);
      expect(result1.nextStateId).toBe('start');
      expect(result1.world.character.direction).toBe(Direction.East);

      // Execute another step
      const result2 = executeFSMStep(result1.world, program, 'start');
      expect(result2.stopped).toBe(false);
      expect(result2.nextStateId).toBe('start');
      expect(result2.world.character.direction).toBe(Direction.South);
    });

    it('should handle sensor conditions correctly', () => {
      const world = createTestWorld();
      // Place a clover under the character
      world.grid[2][2] = { type: CellType.Clover };

      const program: FSMProgram = {
        states: [
          {
            id: 'stop',
            name: 'Stop',
            x: 300,
            y: 100,
            transitions: [],
          },
          {
            id: 'start',
            name: 'Start',
            x: 100,
            y: 100,
            transitions: [
              {
                id: 'trans-1',
                targetStateId: 'stop',
                detectorConditions: {
                  treeFront: null,
                  treeLeft: null,
                  treeRight: null,
                  mushroomFront: null,
                  onLeaf: true, // Only match when on leaf
                },
                actions: [{ type: 'pickClover' }],
              },
            ],
            activeDetectors: ['onLeaf'],
          },
        ],
        startStateId: 'start',
        stopStateId: 'stop',
      };

      const result = executeFSMStep(world, program, 'start');
      expect(result.error).toBeUndefined();
      expect(result.world.character.inventory).toBe(1);
      expect(result.world.grid[2][2].type).toBe(CellType.Empty);
    });

    it('should return error when action fails (move blocked)', () => {
      const world = createTestWorld();
      // Place a tree in front
      world.grid[1][2] = { type: CellType.Tree };

      const program: FSMProgram = {
        states: [
          {
            id: 'stop',
            name: 'Stop',
            x: 300,
            y: 100,
            transitions: [],
          },
          {
            id: 'start',
            name: 'Start',
            x: 100,
            y: 100,
            transitions: [
              {
                id: 'trans-1',
                targetStateId: 'stop',
                detectorConditions: {
                  treeFront: null, // Don't check, just try to move
                  treeLeft: null,
                  treeRight: null,
                  mushroomFront: null,
                  onLeaf: null,
                },
                actions: [{ type: 'move' }],
              },
            ],
            activeDetectors: [],
          },
        ],
        startStateId: 'start',
        stopStateId: 'stop',
      };

      const result = executeFSMStep(world, program, 'start');
      expect(result.stopped).toBe(true);
      expect(result.error).toContain('cannot move forward');
      expect(result.error).toContain('blocking');
    });

    it('should return error when pickClover fails (no clover)', () => {
      const world = createTestWorld();

      const program: FSMProgram = {
        states: [
          {
            id: 'stop',
            name: 'Stop',
            x: 300,
            y: 100,
            transitions: [],
          },
          {
            id: 'start',
            name: 'Start',
            x: 100,
            y: 100,
            transitions: [
              {
                id: 'trans-1',
                targetStateId: 'stop',
                detectorConditions: {
                  treeFront: null,
                  treeLeft: null,
                  treeRight: null,
                  mushroomFront: null,
                  onLeaf: null,
                },
                actions: [{ type: 'pickClover' }],
              },
            ],
            activeDetectors: [],
          },
        ],
        startStateId: 'start',
        stopStateId: 'stop',
      };

      const result = executeFSMStep(world, program, 'start');
      expect(result.stopped).toBe(true);
      expect(result.error).toContain('cannot pick');
      expect(result.error).toContain('no clover');
    });

    it('should return error when placeClover fails (empty inventory)', () => {
      const world = createTestWorld();
      world.character.inventory = 0;

      const program: FSMProgram = {
        states: [
          {
            id: 'stop',
            name: 'Stop',
            x: 300,
            y: 100,
            transitions: [],
          },
          {
            id: 'start',
            name: 'Start',
            x: 100,
            y: 100,
            transitions: [
              {
                id: 'trans-1',
                targetStateId: 'stop',
                detectorConditions: {
                  treeFront: null,
                  treeLeft: null,
                  treeRight: null,
                  mushroomFront: null,
                  onLeaf: null,
                },
                actions: [{ type: 'placeClover' }],
              },
            ],
            activeDetectors: [],
          },
        ],
        startStateId: 'start',
        stopStateId: 'stop',
      };

      const result = executeFSMStep(world, program, 'start');
      expect(result.stopped).toBe(true);
      expect(result.error).toContain('cannot place');
      expect(result.error).toContain('inventory');
    });

    it('should handle null program gracefully', () => {
      const world = createTestWorld();
      const result = executeFSMStep(world, null as unknown as FSMProgram, 'start');

      expect(result.stopped).toBe(true);
      expect(result.error).toContain('not properly defined');
    });

    it('should handle invalid program structure gracefully', () => {
      const world = createTestWorld();
      const invalidProgram = { states: 'not an array' } as unknown as FSMProgram;
      const result = executeFSMStep(world, invalidProgram, 'start');

      expect(result.stopped).toBe(true);
      expect(result.error).toContain('not properly defined');
    });

    it('should provide helpful error with sensor description when stuck', () => {
      const world = createTestWorld();
      // Setup: tree in front, clover under character
      world.grid[1][2] = { type: CellType.Tree };
      world.grid[2][2] = { type: CellType.Clover };

      const program: FSMProgram = {
        states: [
          {
            id: 'stop',
            name: 'Stop',
            x: 300,
            y: 100,
            transitions: [],
          },
          {
            id: 'walking',
            name: 'Walking',
            x: 100,
            y: 100,
            transitions: [
              {
                id: 'trans-1',
                targetStateId: 'stop',
                detectorConditions: {
                  treeFront: false, // Only if no tree
                  treeLeft: null,
                  treeRight: null,
                  mushroomFront: null,
                  onLeaf: false, // Only if not on leaf
                },
                actions: [],
              },
            ],
            activeDetectors: ['treeFront', 'onLeaf'],
          },
        ],
        startStateId: 'walking',
        stopStateId: 'stop',
      };

      const result = executeFSMStep(world, program, 'walking');
      expect(result.stopped).toBe(true);
      expect(result.error).toContain('Walking');
      expect(result.error).toContain('tree in front');
      expect(result.error).toContain('standing on a clover');
    });
  });
});
