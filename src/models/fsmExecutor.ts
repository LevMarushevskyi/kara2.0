// FSM Program Executor for Kara

import { World } from './types';
import { FSMProgram, FSMState, FSMTransition, FSMAction, DetectorType } from './fsm';
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
function transitionMatches(world: World, transition: FSMTransition): boolean {
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
 * Executes one step of the FSM program
 * Returns: { world, nextStateId, stopped, error }
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
} {
  // Find the current state
  const currentState = program.states.find((s) => s.id === currentStateId);

  if (!currentState) {
    return {
      world,
      nextStateId: currentStateId,
      stopped: true,
      error: 'Current state not found',
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
    return {
      world,
      nextStateId: currentStateId,
      stopped: true,
      error: 'No matching transition found in current state',
    };
  }

  // Execute all actions in the matching transition
  let newWorld = world;
  for (const action of matchingTransition.actions) {
    newWorld = executeAction(newWorld, action);
  }

  // Transition to the next state
  return {
    world: newWorld,
    nextStateId: matchingTransition.targetStateId,
    stopped: matchingTransition.targetStateId === program.stopStateId,
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
