// Text-based Kara code executor (JavaKara, PythonKara, JavaScriptKara, RubyKara)

import { World, Direction, CellType } from './types';
import { moveForward, turnLeft, turnRight, pickClover, placeClover } from './world';
import { TextKaraLanguage } from './textKara';

export interface ExecutionResult {
  world: World;
  error?: string;
  stopped: boolean;
}

export interface StepExecutionResult {
  world: World;
  error?: string;
  done: boolean;
}

export interface ExecutionContext {
  world: World;
  steps: number;
  maxSteps: number;
  stopped: boolean;
  error?: string;
}

// Kara API for the interpreter
class KaraAPI {
  private ctx: ExecutionContext;

  constructor(ctx: ExecutionContext) {
    this.ctx = ctx;
  }

  // Commands
  move(): void {
    if (this.ctx.stopped || this.ctx.error) return;
    this.ctx.steps++;
    if (this.ctx.steps > this.ctx.maxSteps) {
      this.ctx.error = `Execution limit exceeded (${this.ctx.maxSteps} steps). Possible infinite loop.`;
      this.ctx.stopped = true;
      return;
    }
    const newWorld = moveForward(this.ctx.world);
    if (newWorld === this.ctx.world) {
      this.ctx.error = 'Cannot move forward - blocked!';
      this.ctx.stopped = true;
      return;
    }
    this.ctx.world = newWorld;
  }

  turnLeft(): void {
    if (this.ctx.stopped || this.ctx.error) return;
    this.ctx.steps++;
    if (this.ctx.steps > this.ctx.maxSteps) {
      this.ctx.error = `Execution limit exceeded (${this.ctx.maxSteps} steps). Possible infinite loop.`;
      this.ctx.stopped = true;
      return;
    }
    this.ctx.world = turnLeft(this.ctx.world);
  }

  turnRight(): void {
    if (this.ctx.stopped || this.ctx.error) return;
    this.ctx.steps++;
    if (this.ctx.steps > this.ctx.maxSteps) {
      this.ctx.error = `Execution limit exceeded (${this.ctx.maxSteps} steps). Possible infinite loop.`;
      this.ctx.stopped = true;
      return;
    }
    this.ctx.world = turnRight(this.ctx.world);
  }

  // Java/JS style
  putLeaf(): void {
    this.placeClover();
  }

  removeLeaf(): void {
    this.pickClover();
  }

  // Python/Ruby style (snake_case)
  put_leaf(): void {
    this.placeClover();
  }

  remove_leaf(): void {
    this.pickClover();
  }

  turn_left(): void {
    this.turnLeft();
  }

  turn_right(): void {
    this.turnRight();
  }

  private placeClover(): void {
    if (this.ctx.stopped || this.ctx.error) return;
    this.ctx.steps++;
    if (this.ctx.steps > this.ctx.maxSteps) {
      this.ctx.error = `Execution limit exceeded (${this.ctx.maxSteps} steps). Possible infinite loop.`;
      this.ctx.stopped = true;
      return;
    }
    const newWorld = placeClover(this.ctx.world);
    if (newWorld === this.ctx.world) {
      this.ctx.error = this.ctx.world.character.inventory === 0
        ? 'No clovers in inventory!'
        : 'Cannot place clover here!';
      this.ctx.stopped = true;
      return;
    }
    this.ctx.world = newWorld;
  }

  private pickClover(): void {
    if (this.ctx.stopped || this.ctx.error) return;
    this.ctx.steps++;
    if (this.ctx.steps > this.ctx.maxSteps) {
      this.ctx.error = `Execution limit exceeded (${this.ctx.maxSteps} steps). Possible infinite loop.`;
      this.ctx.stopped = true;
      return;
    }
    const newWorld = pickClover(this.ctx.world);
    if (newWorld === this.ctx.world) {
      this.ctx.error = 'No clover here to pick!';
      this.ctx.stopped = true;
      return;
    }
    this.ctx.world = newWorld;
  }

  // Sensors - Java/JS style
  treeFront(): boolean {
    return this.checkTreeFront();
  }

  treeLeft(): boolean {
    return this.checkTreeLeft();
  }

  treeRight(): boolean {
    return this.checkTreeRight();
  }

  mushroomFront(): boolean {
    return this.checkMushroomFront();
  }

  onLeaf(): boolean {
    return this.checkOnLeaf();
  }

  // Sensors - Python/Ruby style (snake_case)
  tree_front(): boolean {
    return this.checkTreeFront();
  }

  tree_left(): boolean {
    return this.checkTreeLeft();
  }

  tree_right(): boolean {
    return this.checkTreeRight();
  }

  mushroom_front(): boolean {
    return this.checkMushroomFront();
  }

  on_leaf(): boolean {
    return this.checkOnLeaf();
  }

  // Internal sensor implementations
  private checkTreeFront(): boolean {
    const { world } = this.ctx;
    const { x, y } = world.character.position;
    const dir = world.character.direction;
    let targetX = x, targetY = y;

    switch (dir) {
      case 'NORTH': targetY--; break;
      case 'SOUTH': targetY++; break;
      case 'EAST': targetX++; break;
      case 'WEST': targetX--; break;
    }

    if (targetX < 0 || targetX >= world.width || targetY < 0 || targetY >= world.height) {
      return true; // Treat out of bounds as blocked
    }

    return world.grid[targetY][targetX].type === 'TREE';
  }

  private checkTreeLeft(): boolean {
    const { world } = this.ctx;
    const { x, y } = world.character.position;
    const dir = world.character.direction;
    let targetX = x, targetY = y;

    switch (dir) {
      case 'NORTH': targetX--; break;
      case 'SOUTH': targetX++; break;
      case 'EAST': targetY--; break;
      case 'WEST': targetY++; break;
    }

    if (targetX < 0 || targetX >= world.width || targetY < 0 || targetY >= world.height) {
      return true;
    }

    return world.grid[targetY][targetX].type === 'TREE';
  }

  private checkTreeRight(): boolean {
    const { world } = this.ctx;
    const { x, y } = world.character.position;
    const dir = world.character.direction;
    let targetX = x, targetY = y;

    switch (dir) {
      case 'NORTH': targetX++; break;
      case 'SOUTH': targetX--; break;
      case 'EAST': targetY++; break;
      case 'WEST': targetY--; break;
    }

    if (targetX < 0 || targetX >= world.width || targetY < 0 || targetY >= world.height) {
      return true;
    }

    return world.grid[targetY][targetX].type === 'TREE';
  }

  private checkMushroomFront(): boolean {
    const { world } = this.ctx;
    const { x, y } = world.character.position;
    const dir = world.character.direction;
    let targetX = x, targetY = y;

    switch (dir) {
      case 'NORTH': targetY--; break;
      case 'SOUTH': targetY++; break;
      case 'EAST': targetX++; break;
      case 'WEST': targetX--; break;
    }

    if (targetX < 0 || targetX >= world.width || targetY < 0 || targetY >= world.height) {
      return false;
    }

    return world.grid[targetY][targetX].type === 'MUSHROOM';
  }

  private checkOnLeaf(): boolean {
    const { world } = this.ctx;
    const { x, y } = world.character.position;
    return world.grid[y][x].type === 'CLOVER';
  }
}

/**
 * Extracts balanced braces content from code starting at a given position
 */
function extractBalancedBraces(code: string, startIndex: number): string {
  let braceCount = 0;
  let started = false;
  let contentStart = startIndex;

  for (let i = startIndex; i < code.length; i++) {
    if (code[i] === '{') {
      if (!started) {
        started = true;
        contentStart = i + 1;
      }
      braceCount++;
    } else if (code[i] === '}') {
      braceCount--;
      if (braceCount === 0 && started) {
        return code.substring(contentStart, i);
      }
    }
  }

  return '';
}

/**
 * Extracts the main program code from text-based Kara code
 */
function extractMainCode(code: string, language: TextKaraLanguage): string {
  // Remove comments first
  let cleanCode = code;

  if (language === 'JavaKara' || language === 'JavaScriptKara') {
    // Remove single-line comments
    cleanCode = cleanCode.replace(/\/\/.*$/gm, '');
    // Remove multi-line comments
    cleanCode = cleanCode.replace(/\/\*[\s\S]*?\*\//g, '');
  } else if (language === 'PythonKara') {
    // Remove single-line comments
    cleanCode = cleanCode.replace(/#.*$/gm, '');
    // Remove docstrings
    cleanCode = cleanCode.replace(/"""[\s\S]*?"""/g, '');
    cleanCode = cleanCode.replace(/'''[\s\S]*?'''/g, '');
  } else if (language === 'RubyKara') {
    // Remove single-line comments
    cleanCode = cleanCode.replace(/#.*$/gm, '');
    // Remove multi-line comments
    cleanCode = cleanCode.replace(/=begin[\s\S]*?=end/g, '');
  }

  // Try to find the main program method/function
  let mainCode = '';

  if (language === 'JavaKara') {
    // Look for myProgram method and extract balanced braces
    const match = cleanCode.match(/void\s+myProgram\s*\(\s*\)\s*\{/);
    if (match && match.index !== undefined) {
      mainCode = extractBalancedBraces(cleanCode, match.index);
    }
  } else if (language === 'PythonKara') {
    // Look for my_program method (indented code after def my_program)
    const match = cleanCode.match(/def\s+my_program\s*\(\s*self\s*\)\s*:([\s\S]*?)(?=\ndef\s|\nclass\s|\n*$)/);
    if (match) {
      mainCode = match[1];
    }
  } else if (language === 'JavaScriptKara') {
    // Look for myProgram function and extract balanced braces
    const match = cleanCode.match(/function\s+myProgram\s*\(\s*\)\s*\{/);
    if (match && match.index !== undefined) {
      mainCode = extractBalancedBraces(cleanCode, match.index);
    }
  } else if (language === 'RubyKara') {
    // Look for my_program method
    const match = cleanCode.match(/def\s+my_program([\s\S]*?)end/);
    if (match) {
      mainCode = match[1];
    }
  }

  return mainCode.trim();
}

/**
 * Transpiles Kara code to executable JavaScript
 */
function transpileToJS(code: string, language: TextKaraLanguage): string {
  let jsCode = code;

  // Normalize method calls to use the kara object
  // Already in kara.method() format, but ensure consistency

  if (language === 'PythonKara' || language === 'RubyKara') {
    // Convert Python/Ruby style to JS
    // while not kara.tree_front(): -> while (!kara.tree_front()) {
    // if kara.on_leaf(): -> if (kara.on_leaf()) {

    // Handle 'not' keyword
    jsCode = jsCode.replace(/\bnot\s+/g, '!');

    // Handle 'and' and 'or'
    jsCode = jsCode.replace(/\band\b/g, '&&');
    jsCode = jsCode.replace(/\bor\b/g, '||');

    // Handle while/if without parentheses (Python style)
    jsCode = jsCode.replace(/while\s+([^:]+):/g, 'while ($1) {');
    jsCode = jsCode.replace(/if\s+([^:]+):/g, 'if ($1) {');
    jsCode = jsCode.replace(/elif\s+([^:]+):/g, '} else if ($1) {');
    jsCode = jsCode.replace(/else\s*:/g, '} else {');

    // Add closing braces based on indentation (simplified approach)
    // This is a simplified transpiler - real Python parsing would be more complex
    const lines = jsCode.split('\n');
    const result: string[] = [];
    const indentStack: number[] = [0];

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;

      const indent = line.search(/\S/);
      if (indent === -1) continue;

      // Close blocks when indentation decreases
      while (indentStack.length > 1 && indent < indentStack[indentStack.length - 1]) {
        indentStack.pop();
        result.push('}');
      }

      result.push(trimmed);

      // Track new blocks
      if (trimmed.endsWith('{')) {
        indentStack.push(indent + 2);
      }
    }

    // Close remaining blocks
    while (indentStack.length > 1) {
      indentStack.pop();
      result.push('}');
    }

    jsCode = result.join('\n');
  }

  if (language === 'RubyKara') {
    // Handle Ruby's ? for boolean methods
    jsCode = jsCode.replace(/kara\.tree_front\?/g, 'kara.tree_front()');
    jsCode = jsCode.replace(/kara\.tree_left\?/g, 'kara.tree_left()');
    jsCode = jsCode.replace(/kara\.tree_right\?/g, 'kara.tree_right()');
    jsCode = jsCode.replace(/kara\.mushroom_front\?/g, 'kara.mushroom_front()');
    jsCode = jsCode.replace(/kara\.on_leaf\?/g, 'kara.on_leaf()');

    // Handle Ruby's end keyword
    jsCode = jsCode.replace(/\bend\b/g, '}');

    // Handle while/if
    jsCode = jsCode.replace(/while\s+([^\n]+)\s+do/g, 'while ($1) {');
    jsCode = jsCode.replace(/while\s+([^\n{]+)$/gm, 'while ($1) {');
    jsCode = jsCode.replace(/if\s+([^\n]+)\s+then/g, 'if ($1) {');
    jsCode = jsCode.replace(/elsif\s+([^\n]+)\s+then/g, '} else if ($1) {');
  }

  // Ensure method calls have parentheses
  jsCode = jsCode.replace(/kara\.move(?!\()/g, 'kara.move()');
  jsCode = jsCode.replace(/kara\.turnLeft(?!\()/g, 'kara.turnLeft()');
  jsCode = jsCode.replace(/kara\.turnRight(?!\()/g, 'kara.turnRight()');
  jsCode = jsCode.replace(/kara\.turn_left(?!\()/g, 'kara.turn_left()');
  jsCode = jsCode.replace(/kara\.turn_right(?!\()/g, 'kara.turn_right()');
  jsCode = jsCode.replace(/kara\.putLeaf(?!\()/g, 'kara.putLeaf()');
  jsCode = jsCode.replace(/kara\.removeLeaf(?!\()/g, 'kara.removeLeaf()');
  jsCode = jsCode.replace(/kara\.put_leaf(?!\()/g, 'kara.put_leaf()');
  jsCode = jsCode.replace(/kara\.remove_leaf(?!\()/g, 'kara.remove_leaf()');

  // Add semicolons to lines that need them (simplified)
  jsCode = jsCode.replace(/\)$/gm, ');');
  jsCode = jsCode.replace(/\);\s*;/g, ');'); // Fix double semicolons

  return jsCode;
}

/**
 * Executes text-based Kara code and returns the resulting world state
 */
export function executeTextKaraCode(
  code: string,
  language: TextKaraLanguage,
  world: World,
  maxSteps: number = 10000
): ExecutionResult {
  const ctx: ExecutionContext = {
    world: JSON.parse(JSON.stringify(world)), // Deep copy
    steps: 0,
    maxSteps,
    stopped: false,
  };

  const kara = new KaraAPI(ctx);

  try {
    // Extract the main program code
    const mainCode = extractMainCode(code, language);

    if (!mainCode) {
      return {
        world: ctx.world,
        error: `Could not find main program. Make sure you have a ${
          language === 'PythonKara' || language === 'RubyKara'
            ? 'my_program'
            : 'myProgram'
        } method.`,
        stopped: true,
      };
    }

    // Transpile to JavaScript
    const jsCode = transpileToJS(mainCode, language);

    // Create a function that executes the code with kara in scope
    // Using Function constructor to create a sandboxed execution
    const execFn = new Function('kara', jsCode);
    execFn(kara);

    return {
      world: ctx.world,
      stopped: ctx.stopped,
      error: ctx.error,
    };
  } catch (error) {
    return {
      world: ctx.world,
      error: `Execution error: ${error instanceof Error ? error.message : String(error)}`,
      stopped: true,
    };
  }
}

/**
 * Validates that the code has the expected structure
 */
export function validateTextKaraCode(code: string, language: TextKaraLanguage): { valid: boolean; error?: string } {
  const mainCode = extractMainCode(code, language);

  if (!mainCode) {
    return {
      valid: false,
      error: `Could not find main program. Make sure you have a ${
        language === 'PythonKara' || language === 'RubyKara'
          ? 'my_program'
          : 'myProgram'
      } method.`,
    };
  }

  return { valid: true };
}

// ========== Step-by-step execution support ==========

export type CommandName = 'move' | 'turnLeft' | 'turnRight' | 'putLeaf' | 'removeLeaf' |
                          'turn_left' | 'turn_right' | 'put_leaf' | 'remove_leaf';

/**
 * Streaming interpreter state for step-by-step execution
 * This allows infinite loops to be executed one step at a time by
 * running the program in small batches and yielding control between batches.
 */
export interface StreamingInterpreterState {
  // The simulated world state for sensor evaluation
  simWorld: World;
  // Pending commands to execute
  pendingCommands: CommandName[];
  // Index of next command to return
  nextCommandIndex: number;
  // Whether execution is complete
  done: boolean;
  // Any error that occurred
  error?: string;
  // The transpiled JS code
  jsCode: string;
  // Batch execution state
  batchSize: number;
  totalCommandsGenerated: number;
}

/**
 * Creates a streaming interpreter that generates commands in batches.
 * This allows infinite loops to execute step-by-step without blocking.
 */
export function createStreamingInterpreter(
  code: string,
  language: TextKaraLanguage,
  world: World
): { interpreter: StreamingInterpreterState | null; error?: string } {
  const mainCode = extractMainCode(code, language);

  if (!mainCode) {
    return {
      interpreter: null,
      error: `Could not find main program. Make sure you have a ${
        language === 'PythonKara' || language === 'RubyKara'
          ? 'my_program'
          : 'myProgram'
      } method.`,
    };
  }

  // Transpile to JavaScript
  const jsCode = transpileToJS(mainCode, language);

  // Validate the code by trying to parse it
  try {
    new Function('kara', jsCode);
  } catch (error) {
    return {
      interpreter: null,
      error: `Syntax error: ${error instanceof Error ? error.message : String(error)}`,
    };
  }

  return {
    interpreter: {
      simWorld: JSON.parse(JSON.stringify(world)),
      pendingCommands: [],
      nextCommandIndex: 0,
      done: false,
      jsCode,
      batchSize: 100, // Generate commands in batches of 100
      totalCommandsGenerated: 0,
    },
  };
}

/**
 * Generates more commands by running the program with a step limit.
 * Returns true if more commands were generated, false if program ended.
 */
function generateMoreCommands(state: StreamingInterpreterState): boolean {
  if (state.done || state.error) return false;

  const commands: CommandName[] = [];
  let commandCount = 0;
  const maxCommands = state.batchSize;

  const getTargetPosition = (dir: string, x: number, y: number) => {
    switch (dir) {
      case 'NORTH': return { x, y: y - 1 };
      case 'SOUTH': return { x, y: y + 1 };
      case 'EAST': return { x: x + 1, y };
      case 'WEST': return { x: x - 1, y };
      default: return { x, y };
    }
  };

  const getLeftPosition = (dir: string, x: number, y: number) => {
    switch (dir) {
      case 'NORTH': return { x: x - 1, y };
      case 'SOUTH': return { x: x + 1, y };
      case 'EAST': return { x, y: y - 1 };
      case 'WEST': return { x, y: y + 1 };
      default: return { x, y };
    }
  };

  const getRightPosition = (dir: string, x: number, y: number) => {
    switch (dir) {
      case 'NORTH': return { x: x + 1, y };
      case 'SOUTH': return { x: x - 1, y };
      case 'EAST': return { x, y: y + 1 };
      case 'WEST': return { x, y: y - 1 };
      default: return { x, y };
    }
  };

  const isBlocked = (pos: { x: number; y: number }) => {
    if (pos.x < 0 || pos.x >= state.simWorld.width || pos.y < 0 || pos.y >= state.simWorld.height) {
      return true;
    }
    const cell = state.simWorld.grid[pos.y][pos.x];
    return cell.type === 'TREE';
  };

  const hasMushroom = (pos: { x: number; y: number }) => {
    if (pos.x < 0 || pos.x >= state.simWorld.width || pos.y < 0 || pos.y >= state.simWorld.height) {
      return false;
    }
    return state.simWorld.grid[pos.y][pos.x].type === 'MUSHROOM';
  };

  // Custom error to break out of execution when we have enough commands
  class BatchLimitReached extends Error {
    constructor() {
      super('BatchLimitReached');
      this.name = 'BatchLimitReached';
    }
  }

  const kara = {
    move: () => {
      commandCount++;
      commands.push('move');
      const target = getTargetPosition(
        state.simWorld.character.direction,
        state.simWorld.character.position.x,
        state.simWorld.character.position.y
      );
      if (!isBlocked(target)) {
        state.simWorld.character.position = target;
      }
      if (commandCount >= maxCommands) throw new BatchLimitReached();
    },
    turnLeft: () => {
      commandCount++;
      commands.push('turnLeft');
      const dirs = [Direction.North, Direction.West, Direction.South, Direction.East];
      const idx = dirs.indexOf(state.simWorld.character.direction);
      state.simWorld.character.direction = dirs[(idx + 1) % 4];
      if (commandCount >= maxCommands) throw new BatchLimitReached();
    },
    turnRight: () => {
      commandCount++;
      commands.push('turnRight');
      const dirs = [Direction.North, Direction.East, Direction.South, Direction.West];
      const idx = dirs.indexOf(state.simWorld.character.direction);
      state.simWorld.character.direction = dirs[(idx + 1) % 4];
      if (commandCount >= maxCommands) throw new BatchLimitReached();
    },
    putLeaf: () => {
      commandCount++;
      commands.push('putLeaf');
      if (commandCount >= maxCommands) throw new BatchLimitReached();
    },
    removeLeaf: () => {
      commandCount++;
      commands.push('removeLeaf');
      const { x, y } = state.simWorld.character.position;
      if (state.simWorld.grid[y][x].type === 'CLOVER') {
        state.simWorld.grid[y][x] = { type: CellType.Empty };
      }
      if (commandCount >= maxCommands) throw new BatchLimitReached();
    },
    turn_left: function() { this.turnLeft(); },
    turn_right: function() { this.turnRight(); },
    put_leaf: function() { this.putLeaf(); },
    remove_leaf: function() { this.removeLeaf(); },
    treeFront: () => {
      const target = getTargetPosition(
        state.simWorld.character.direction,
        state.simWorld.character.position.x,
        state.simWorld.character.position.y
      );
      return isBlocked(target);
    },
    treeLeft: () => {
      const target = getLeftPosition(
        state.simWorld.character.direction,
        state.simWorld.character.position.x,
        state.simWorld.character.position.y
      );
      return isBlocked(target);
    },
    treeRight: () => {
      const target = getRightPosition(
        state.simWorld.character.direction,
        state.simWorld.character.position.x,
        state.simWorld.character.position.y
      );
      return isBlocked(target);
    },
    mushroomFront: () => {
      const target = getTargetPosition(
        state.simWorld.character.direction,
        state.simWorld.character.position.x,
        state.simWorld.character.position.y
      );
      return hasMushroom(target);
    },
    onLeaf: () => {
      const { x, y } = state.simWorld.character.position;
      return state.simWorld.grid[y][x].type === 'CLOVER';
    },
    tree_front: function() { return this.treeFront(); },
    tree_left: function() { return this.treeLeft(); },
    tree_right: function() { return this.treeRight(); },
    mushroom_front: function() { return this.mushroomFront(); },
    on_leaf: function() { return this.onLeaf(); },
  };

  try {
    const execFn = new Function('kara', state.jsCode);
    execFn(kara);
    // If we get here, the program completed normally
    state.pendingCommands.push(...commands);
    state.totalCommandsGenerated += commands.length;
    state.done = true;
    return commands.length > 0;
  } catch (error) {
    if (error instanceof BatchLimitReached) {
      // We hit our batch limit - add commands and continue later
      state.pendingCommands.push(...commands);
      state.totalCommandsGenerated += commands.length;
      return true;
    }
    // Real error
    state.error = `Execution error: ${error instanceof Error ? error.message : String(error)}`;
    state.done = true;
    return false;
  }
}

/**
 * Gets the next command from the streaming interpreter.
 * Returns null if done or error, otherwise returns the next command.
 */
export function getNextStreamingCommand(
  state: StreamingInterpreterState
): { command: CommandName | null; done: boolean; error?: string } {
  if (state.error) {
    return { command: null, done: true, error: state.error };
  }

  // If we have pending commands, return the next one
  if (state.nextCommandIndex < state.pendingCommands.length) {
    const command = state.pendingCommands[state.nextCommandIndex];
    state.nextCommandIndex++;
    return { command, done: false };
  }

  // If program is done and no more commands, we're finished
  if (state.done) {
    return { command: null, done: true };
  }

  // Need to generate more commands - but this would block for infinite loops
  // Instead, we generate in the background and this call will get more next time
  // For now, generate one more batch synchronously
  const hasMore = generateMoreCommands(state);

  if (state.error) {
    return { command: null, done: true, error: state.error };
  }

  if (hasMore && state.nextCommandIndex < state.pendingCommands.length) {
    const command = state.pendingCommands[state.nextCommandIndex];
    state.nextCommandIndex++;
    return { command, done: false };
  }

  return { command: null, done: state.done };
}

/**
 * Resets the streaming interpreter to use the actual world state.
 * This syncs the interpreter's simulation with the real world after each command.
 */
export function syncStreamingInterpreterWorld(
  state: StreamingInterpreterState,
  actualWorld: World
): void {
  state.simWorld = JSON.parse(JSON.stringify(actualWorld));
}

/**
 * Legacy function - parses and collects ALL commands upfront.
 * Only use this for programs that are known to terminate.
 * For infinite loops, use createTextKaraInterpreter instead.
 */
export function parseTextKaraCommands(
  code: string,
  language: TextKaraLanguage,
  world: World,
  maxIterations: number = 10000
): { commands: CommandName[]; error?: string } {
  const mainCode = extractMainCode(code, language);

  if (!mainCode) {
    return {
      commands: [],
      error: `Could not find main program. Make sure you have a ${
        language === 'PythonKara' || language === 'RubyKara'
          ? 'my_program'
          : 'myProgram'
      } method.`,
    };
  }

  // Transpile to JavaScript
  const jsCode = transpileToJS(mainCode, language);

  // Create a mock kara that collects commands
  const commands: CommandName[] = [];
  let iterationCount = 0;
  let executionError: string | undefined;

  // Create a simulated world for sensor checks
  let simWorld = JSON.parse(JSON.stringify(world)) as World;

  const getTargetPosition = (dir: string, x: number, y: number) => {
    switch (dir) {
      case 'NORTH': return { x, y: y - 1 };
      case 'SOUTH': return { x, y: y + 1 };
      case 'EAST': return { x: x + 1, y };
      case 'WEST': return { x: x - 1, y };
      default: return { x, y };
    }
  };

  const getLeftPosition = (dir: string, x: number, y: number) => {
    switch (dir) {
      case 'NORTH': return { x: x - 1, y };
      case 'SOUTH': return { x: x + 1, y };
      case 'EAST': return { x, y: y - 1 };
      case 'WEST': return { x, y: y + 1 };
      default: return { x, y };
    }
  };

  const getRightPosition = (dir: string, x: number, y: number) => {
    switch (dir) {
      case 'NORTH': return { x: x + 1, y };
      case 'SOUTH': return { x: x - 1, y };
      case 'EAST': return { x, y: y + 1 };
      case 'WEST': return { x, y: y - 1 };
      default: return { x, y };
    }
  };

  const isBlocked = (pos: { x: number; y: number }) => {
    if (pos.x < 0 || pos.x >= simWorld.width || pos.y < 0 || pos.y >= simWorld.height) {
      return true;
    }
    const cell = simWorld.grid[pos.y][pos.x];
    return cell.type === 'TREE';
  };

  const hasMushroom = (pos: { x: number; y: number }) => {
    if (pos.x < 0 || pos.x >= simWorld.width || pos.y < 0 || pos.y >= simWorld.height) {
      return false;
    }
    return simWorld.grid[pos.y][pos.x].type === 'MUSHROOM';
  };

  const mockKara = {
    move: () => {
      iterationCount++;
      if (iterationCount > maxIterations) {
        executionError = `Execution limit exceeded (${maxIterations} steps). Possible infinite loop.`;
        throw new Error(executionError);
      }
      commands.push('move');
      // Update simulated position
      const target = getTargetPosition(
        simWorld.character.direction,
        simWorld.character.position.x,
        simWorld.character.position.y
      );
      if (!isBlocked(target)) {
        simWorld.character.position = target;
      }
    },
    turnLeft: () => {
      iterationCount++;
      if (iterationCount > maxIterations) {
        executionError = `Execution limit exceeded (${maxIterations} steps). Possible infinite loop.`;
        throw new Error(executionError);
      }
      commands.push('turnLeft');
      const dirsL = [Direction.North, Direction.West, Direction.South, Direction.East];
      const idxL = dirsL.indexOf(simWorld.character.direction);
      simWorld.character.direction = dirsL[(idxL + 1) % 4];
    },
    turnRight: () => {
      iterationCount++;
      if (iterationCount > maxIterations) {
        executionError = `Execution limit exceeded (${maxIterations} steps). Possible infinite loop.`;
        throw new Error(executionError);
      }
      commands.push('turnRight');
      const dirsR = [Direction.North, Direction.East, Direction.South, Direction.West];
      const idxR = dirsR.indexOf(simWorld.character.direction);
      simWorld.character.direction = dirsR[(idxR + 1) % 4];
    },
    putLeaf: () => {
      iterationCount++;
      if (iterationCount > maxIterations) {
        executionError = `Execution limit exceeded (${maxIterations} steps). Possible infinite loop.`;
        throw new Error(executionError);
      }
      commands.push('putLeaf');
    },
    removeLeaf: () => {
      iterationCount++;
      if (iterationCount > maxIterations) {
        executionError = `Execution limit exceeded (${maxIterations} steps). Possible infinite loop.`;
        throw new Error(executionError);
      }
      commands.push('removeLeaf');
    },
    // Snake_case versions
    turn_left: () => mockKara.turnLeft(),
    turn_right: () => mockKara.turnRight(),
    put_leaf: () => mockKara.putLeaf(),
    remove_leaf: () => mockKara.removeLeaf(),
    // Sensors
    treeFront: () => {
      const target = getTargetPosition(
        simWorld.character.direction,
        simWorld.character.position.x,
        simWorld.character.position.y
      );
      return isBlocked(target);
    },
    treeLeft: () => {
      const target = getLeftPosition(
        simWorld.character.direction,
        simWorld.character.position.x,
        simWorld.character.position.y
      );
      return isBlocked(target);
    },
    treeRight: () => {
      const target = getRightPosition(
        simWorld.character.direction,
        simWorld.character.position.x,
        simWorld.character.position.y
      );
      return isBlocked(target);
    },
    mushroomFront: () => {
      const target = getTargetPosition(
        simWorld.character.direction,
        simWorld.character.position.x,
        simWorld.character.position.y
      );
      return hasMushroom(target);
    },
    onLeaf: () => {
      const { x, y } = simWorld.character.position;
      return simWorld.grid[y][x].type === 'CLOVER';
    },
    // Snake_case sensor versions
    tree_front: function() { return this.treeFront(); },
    tree_left: function() { return this.treeLeft(); },
    tree_right: function() { return this.treeRight(); },
    mushroom_front: function() { return this.mushroomFront(); },
    on_leaf: function() { return this.onLeaf(); },
  };

  try {
    const execFn = new Function('kara', jsCode);
    execFn(mockKara);
    return { commands };
  } catch (error) {
    return {
      commands,
      error: executionError || `Parse error: ${error instanceof Error ? error.message : String(error)}`,
    };
  }
}

/**
 * Executes a single command and returns the new world state
 */
export function executeSingleCommand(
  command: CommandName,
  world: World
): StepExecutionResult {
  let newWorld = world;
  let error: string | undefined;

  switch (command) {
    case 'move':
      newWorld = moveForward(world);
      if (newWorld === world) {
        error = 'Cannot move forward - blocked!';
      }
      break;
    case 'turnLeft':
    case 'turn_left':
      newWorld = turnLeft(world);
      break;
    case 'turnRight':
    case 'turn_right':
      newWorld = turnRight(world);
      break;
    case 'putLeaf':
    case 'put_leaf':
      newWorld = placeClover(world);
      if (newWorld === world) {
        error = world.character.inventory === 0
          ? 'No clovers in inventory!'
          : 'Cannot place clover here!';
      }
      break;
    case 'removeLeaf':
    case 'remove_leaf':
      newWorld = pickClover(world);
      if (newWorld === world) {
        error = 'No clover here to pick!';
      }
      break;
  }

  return {
    world: newWorld,
    error,
    done: false,
  };
}
