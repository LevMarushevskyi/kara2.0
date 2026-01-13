// FSM Program Executor for Kara

import { World } from './types';
import { FSMProgram, FSMTransition, FSMAction, DetectorType } from './fsm';
import { moveForward, turnLeft, turnRight, pickClover, placeClover } from './world';
import {  treeFront, treeLeft, treeRight, mushroomFront, onLeaf } from './world';

/**
 * Evaluates a detector condition against the current world state
 */
function evaluateDetector(world: World, detector: DetectorType): boolean {
  switch (detector) {
    case 'treeFront':
      return treeFront(world);
    case 'treeLeft':
      return treeLeft(world);
    case 'treeRight':
      return treeRight(world);
    case 'mushroomFront':
      return mushroomFront(world);
    case 'onLeaf':
      return onLeaf(world);
  }
}

/**
 * Checks if a transition's detector conditions match the current world state
 */
export function transitionMatches(world: World, transition: FSMTransition): boolean {
  // Check all detector conditions
  for (const [detector, expectedValue] of Object.entries(transition.detectorConditions)) {
    const actualValue = evaluateDetector(world, detector as DetectorType);

    // null means "don't care" (yes or no), so we skip this check
    if (expectedValue === null) {
      continue;
    }

    // Check if the actual value matches the expected value
    if (actualValue !== expectedValue) {
      return false;
    }
  }

  return true;
}

/**
 * Finds the matching transition for a given state without executing it
 * Returns the transition ID if found, null otherwise
 */
export function findMatchingTransition(
  world: World,
  program: FSMProgram,
  stateId: string
): string | null {
  const state = program.states.find((s) => s.id === stateId);
  if (!state || stateId === program.stopStateId) return null;

  const matchingTransition = state.transitions.find((t) =>
    transitionMatches(world, t)
  );

  return matchingTransition?.id || null;
}

/**
 * Executes a single FSM action and returns the updated world
 */
function executeAction(world: World, action: FSMAction): World {
  switch (action.type) {
    case 'move':
      return moveForward(world);
    case 'turnLeft':
      return turnLeft(world);
    case 'turnRight':
      return turnRight(world);
    case 'pickClover':
      return pickClover(world);
    case 'placeClover':
      return placeClover(world);
    default:
      return world;
  }
}

/**
 * Gets a human-readable description of the current sensor conditions
 */
function describeSensorConditions(world: World): string {
  const conditions: string[] = [];

  if (treeFront(world)) conditions.push('tree in front');
  if (treeLeft(world)) conditions.push('tree to the left');
  if (treeRight(world)) conditions.push('tree to the right');
  if (mushroomFront(world)) conditions.push('mushroom in front');
  if (onLeaf(world)) conditions.push('standing on a clover');

  if (conditions.length === 0) {
    return 'no obstacles detected, not on a clover';
  }

  return conditions.join(', ');
}

/**
 * Gets a human-readable name for a state
 */
function getStateName(program: FSMProgram, stateId: string): string {
  const state = program.states.find(s => s.id === stateId);
  if (!state) return `unknown state (${stateId})`;
  if (stateId === program.stopStateId) return 'STOP';
  if (stateId === program.startStateId) return `${state.name} (Start)`;
  return state.name;
}

/**
 * Executes one step of the FSM program
 * Returns: { world, nextStateId, stopped, error, matchingTransitionId }
 */
export function executeFSMStep(
  world: World,
  program: FSMProgram,
  currentStateId: string
): {
  world: World;
  nextStateId: string;
  stopped: boolean;
  error?: string;
  matchingTransitionId?: string;
} {
  // Validate inputs
  if (!program || !program.states || !Array.isArray(program.states)) {
    return {
      world,
      nextStateId: currentStateId,
      stopped: true,
      error: 'The FSM program is not properly defined. Please create some states first.',
    };
  }

  // Find the current state
  const currentState = program.states.find((s) => s.id === currentStateId);

  if (!currentState) {
    return {
      world,
      nextStateId: currentStateId,
      stopped: true,
      error: `Cannot find the current state. This might happen if you deleted a state while the program was running. Try resetting the program.`,
    };
  }

  // Check if we've reached the STOP state
  if (currentStateId === program.stopStateId) {
    return {
      world,
      nextStateId: currentStateId,
      stopped: true,
    };
  }

  // Find the first transition that matches the current world state
  const matchingTransition = currentState.transitions.find((t) =>
    transitionMatches(world, t)
  );

  if (!matchingTransition) {
    // No matching transition - program is stuck
    const sensorDescription = describeSensorConditions(world);
    const stateName = getStateName(program, currentStateId);

    return {
      world,
      nextStateId: currentStateId,
      stopped: true,
      error: `Kara is stuck in state "${stateName}"! No transition matches the current situation: ${sensorDescription}.\n\nTip: Add a transition that handles this case, or use "yes or no" (wildcard) for sensor conditions you don't care about.`,
    };
  }

  // Execute all actions in the matching transition
  let newWorld = world;
  for (const action of matchingTransition.actions) {
    const previousWorld = newWorld;
    newWorld = executeAction(newWorld, action);

    // Check if action failed (world unchanged when it shouldn't be)
    if (newWorld === previousWorld) {
      // moveForward can fail if blocked
      if (action.type === 'move') {
        return {
          world: newWorld,
          nextStateId: currentStateId,
          stopped: true,
          error: `Kara cannot move forward - there's something blocking the way! Check your sensor conditions to avoid this situation.`,
        };
      }
      // pickClover can fail if no clover
      if (action.type === 'pickClover') {
        return {
          world: newWorld,
          nextStateId: currentStateId,
          stopped: true,
          error: `Kara cannot pick up a clover - there's no clover here! Make sure the "on leaf?" condition is "yes" before picking up.`,
        };
      }
      // placeClover can fail if inventory empty or cell not empty
      if (action.type === 'placeClover') {
        const inventoryEmpty = world.character.inventory === 0;
        return {
          world: newWorld,
          nextStateId: currentStateId,
          stopped: true,
          error: inventoryEmpty
            ? `Kara cannot place a clover - the inventory is empty! Pick up some clovers first.`
            : `Kara cannot place a clover here - the cell is not empty!`,
        };
      }
    }
  }

  // Transition to the next state
  return {
    world: newWorld,
    nextStateId: matchingTransition.targetStateId,
    stopped: matchingTransition.targetStateId === program.stopStateId,
    matchingTransitionId: matchingTransition.id,
  };
}

/**
 * Validates that an FSM program is ready to run
 */
export function validateFSMProgram(program: FSMProgram): {
  valid: boolean;
  error?: string;
} {
  // Check if there's a start state
  if (!program.startStateId) {
    return {
      valid: false,
      error: 'No start state set. Click "Set as Start" on a state to begin.',
    };
  }

  // Check if the start state exists
  const startState = program.states.find((s) => s.id === program.startStateId);
  if (!startState) {
    return {
      valid: false,
      error: 'Start state not found',
    };
  }

  // Check if there's at least one non-STOP state with transitions
  const hasTransitions = program.states.some(
    (s) => s.id !== program.stopStateId && s.transitions.length > 0
  );

  if (!hasTransitions) {
    return {
      valid: false,
      error: 'No transitions defined. Add at least one transition to a state.',
    };
  }

  return { valid: true };
}
