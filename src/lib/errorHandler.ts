/**
 * Centralized error handling for Kara 2.0
 * Provides consistent error codes, user-friendly messages, and recovery actions
 */

export enum ErrorSeverity {
  INFO = 'info',
  WARNING = 'warning',
  ERROR = 'error',
  CRITICAL = 'critical',
}

export interface AppError {
  code: string;
  message: string;
  userMessage: string;
  severity: ErrorSeverity;
  context?: Record<string, unknown>;
  recoverable: boolean;
}

export const ErrorCodes = {
  // Execution errors
  EXEC_BLOCKED: 'EXEC_BLOCKED',
  EXEC_INFINITE_LOOP: 'EXEC_INFINITE_LOOP',
  EXEC_PARSE_ERROR: 'EXEC_PARSE_ERROR',
  EXEC_INVALID_COMMAND: 'EXEC_INVALID_COMMAND',

  // File errors
  FILE_INVALID_FORMAT: 'FILE_INVALID_FORMAT',
  FILE_TOO_LARGE: 'FILE_TOO_LARGE',
  FILE_PARSE_ERROR: 'FILE_PARSE_ERROR',

  // Storage errors
  STORAGE_QUOTA_EXCEEDED: 'STORAGE_QUOTA_EXCEEDED',
  STORAGE_UNAVAILABLE: 'STORAGE_UNAVAILABLE',

  // World errors
  WORLD_INVALID_SIZE: 'WORLD_INVALID_SIZE',
  WORLD_INVALID_STATE: 'WORLD_INVALID_STATE',
  WORLD_NO_CLOVER: 'WORLD_NO_CLOVER',
  WORLD_NO_INVENTORY: 'WORLD_NO_INVENTORY',

  // FSM errors
  FSM_INVALID_STATE: 'FSM_INVALID_STATE',
  FSM_NO_TRANSITION: 'FSM_NO_TRANSITION',

  // Unknown
  UNKNOWN: 'UNKNOWN',
} as const;

export type ErrorCode = keyof typeof ErrorCodes;

const errorDefinitions: Record<ErrorCode, Omit<AppError, 'code' | 'context'>> = {
  EXEC_BLOCKED: {
    message: 'Kara cannot move forward - path is blocked',
    userMessage: "Oops! Kara bumped into something. There's a tree or the edge of the world in the way.",
    severity: ErrorSeverity.WARNING,
    recoverable: true,
  },
  EXEC_INFINITE_LOOP: {
    message: 'Execution limit exceeded',
    userMessage: 'Your program seems to run forever! Check for infinite loops in your code.',
    severity: ErrorSeverity.ERROR,
    recoverable: true,
  },
  EXEC_PARSE_ERROR: {
    message: 'Failed to parse code',
    userMessage: 'There\'s a syntax error in your code. Check for missing brackets or typos.',
    severity: ErrorSeverity.ERROR,
    recoverable: true,
  },
  EXEC_INVALID_COMMAND: {
    message: 'Invalid command',
    userMessage: 'This command is not allowed in this exercise.',
    severity: ErrorSeverity.WARNING,
    recoverable: true,
  },
  FILE_INVALID_FORMAT: {
    message: 'Invalid file format',
    userMessage: 'This file format is not supported. Please use .world or .json files.',
    severity: ErrorSeverity.ERROR,
    recoverable: true,
  },
  FILE_TOO_LARGE: {
    message: 'File too large',
    userMessage: 'This file is too large. Maximum file size is 1MB.',
    severity: ErrorSeverity.ERROR,
    recoverable: true,
  },
  FILE_PARSE_ERROR: {
    message: 'Failed to parse file',
    userMessage: 'This file appears to be corrupted or in an invalid format.',
    severity: ErrorSeverity.ERROR,
    recoverable: true,
  },
  STORAGE_QUOTA_EXCEEDED: {
    message: 'Storage quota exceeded',
    userMessage: 'Your browser storage is full. Try clearing some saved data.',
    severity: ErrorSeverity.ERROR,
    recoverable: true,
  },
  STORAGE_UNAVAILABLE: {
    message: 'Storage unavailable',
    userMessage: 'Unable to save data. Your browser may be in private mode.',
    severity: ErrorSeverity.WARNING,
    recoverable: true,
  },
  WORLD_INVALID_SIZE: {
    message: 'Invalid world size',
    userMessage: 'World size must be between 1 and 100 cells.',
    severity: ErrorSeverity.ERROR,
    recoverable: true,
  },
  WORLD_INVALID_STATE: {
    message: 'Invalid world state',
    userMessage: 'The world data is corrupted. Try resetting the world.',
    severity: ErrorSeverity.ERROR,
    recoverable: true,
  },
  WORLD_NO_CLOVER: {
    message: 'No clover at current position',
    userMessage: 'There\'s no clover here for Kara to pick up!',
    severity: ErrorSeverity.WARNING,
    recoverable: true,
  },
  WORLD_NO_INVENTORY: {
    message: 'No clovers in inventory',
    userMessage: 'Kara doesn\'t have any clovers to place!',
    severity: ErrorSeverity.WARNING,
    recoverable: true,
  },
  FSM_INVALID_STATE: {
    message: 'Invalid FSM state',
    userMessage: 'The state machine has an invalid state. Check your transitions.',
    severity: ErrorSeverity.ERROR,
    recoverable: true,
  },
  FSM_NO_TRANSITION: {
    message: 'No matching transition',
    userMessage: 'No transition matches the current conditions. Add more transitions to handle this case.',
    severity: ErrorSeverity.WARNING,
    recoverable: true,
  },
  UNKNOWN: {
    message: 'Unknown error',
    userMessage: 'Something unexpected happened. Please try again.',
    severity: ErrorSeverity.ERROR,
    recoverable: true,
  },
};

/**
 * Creates a structured error with user-friendly message
 */
export function createError(
  code: ErrorCode,
  context?: Record<string, unknown>
): AppError {
  const definition = errorDefinitions[code];
  return {
    code,
    ...definition,
    context,
  };
}

/**
 * Type guard to check if an error is an AppError
 */
export function isAppError(error: unknown): error is AppError {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    'userMessage' in error &&
    'severity' in error
  );
}

/**
 * Handles any error and converts it to an AppError
 */
export function handleError(error: unknown, context: string): AppError {
  if (isAppError(error)) {
    return error;
  }

  const message = error instanceof Error ? error.message : String(error);
  console.error(`[${context}]`, error);

  return {
    code: 'UNKNOWN',
    message: `${context}: ${message}`,
    userMessage: 'Something unexpected happened. Please try again.',
    severity: ErrorSeverity.ERROR,
    recoverable: true,
    context: { originalError: message },
  };
}

/**
 * Gets the toast function type based on error severity
 */
export function getToastType(severity: ErrorSeverity): 'info' | 'warning' | 'error' | 'success' {
  switch (severity) {
    case ErrorSeverity.INFO:
      return 'info';
    case ErrorSeverity.WARNING:
      return 'warning';
    case ErrorSeverity.ERROR:
    case ErrorSeverity.CRITICAL:
      return 'error';
    default:
      return 'error';
  }
}
