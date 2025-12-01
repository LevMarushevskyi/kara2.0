// Finite State Machine types for Kara programming

export interface FSMState {
  id: string;
  name: string;
  x: number; // Position in the visual editor
  y: number;
  transitions: FSMTransition[];
  activeDetectors?: DetectorType[]; // Detectors selected for this state
}

export type DetectorType = 'treeFront' | 'treeLeft' | 'treeRight' | 'mushroomFront' | 'onLeaf';

export interface FSMTransition {
  id: string;
  targetStateId: string;
  detectorConditions: Partial<Record<DetectorType, boolean | null>>; // true = "yes", false = "no", null = "yes or no"
  actions: FSMAction[];
}

export interface FSMAction {
  type: 'move' | 'turnLeft' | 'turnRight' | 'pickClover' | 'placeClover';
}

export interface FSMProgram {
  states: FSMState[];
  startStateId: string | null; // null means no start state set yet
  stopStateId: string; // The special STOP state
}

/**
 * Creates a new empty FSM program with just a STOP state
 */
export function createEmptyFSM(): FSMProgram {
  const stopStateId = 'stop';

  return {
    states: [
      {
        id: stopStateId,
        name: 'Stop',
        x: 300,
        y: 100,
        transitions: [],
      },
    ],
    startStateId: null, // No start state initially
    stopStateId,
  };
}

/**
 * Adds a new state to the FSM
 */
export function addState(program: FSMProgram, name: string): FSMProgram {
  const newStateId = `state-${Date.now()}`;
  const newState: FSMState = {
    id: newStateId,
    name,
    x: 150 + program.states.length * 50,
    y: 100 + program.states.length * 20,
    transitions: [],
  };

  return {
    ...program,
    states: [...program.states, newState],
  };
}

/**
 * Deletes a state from the FSM
 */
export function deleteState(program: FSMProgram, stateId: string): FSMProgram {
  // Can't delete the STOP state
  if (stateId === program.stopStateId) {
    return program;
  }

  // Remove the state
  const newStates = program.states.filter((s) => s.id !== stateId);

  // Remove any transitions pointing to this state
  const cleanedStates = newStates.map((state) => ({
    ...state,
    transitions: state.transitions.filter((t) => t.targetStateId !== stateId),
  }));

  // If we deleted the start state, clear it
  let newStartStateId = program.startStateId;
  if (program.startStateId === stateId) {
    newStartStateId = null;
  }

  return {
    ...program,
    states: cleanedStates,
    startStateId: newStartStateId,
  };
}

/**
 * Updates a state's name
 */
export function updateStateName(
  program: FSMProgram,
  stateId: string,
  newName: string
): FSMProgram {
  return {
    ...program,
    states: program.states.map((state) =>
      state.id === stateId ? { ...state, name: newName } : state
    ),
  };
}

/**
 * Updates a state's position
 */
export function updateStatePosition(
  program: FSMProgram,
  stateId: string,
  x: number,
  y: number
): FSMProgram {
  return {
    ...program,
    states: program.states.map((state) =>
      state.id === stateId ? { ...state, x, y } : state
    ),
  };
}

// ========== .kara File Format Support (KaraX Compatibility) ==========

/**
 * Command name mapping between KaraX and internal format
 */
const KARAX_COMMAND_TO_INTERNAL: Record<string, FSMAction['type']> = {
  move: 'move',
  turnLeft: 'turnLeft',
  turnRight: 'turnRight',
  putLeaf: 'placeClover',
  removeLeaf: 'pickClover',
};

const INTERNAL_COMMAND_TO_KARAX: Record<FSMAction['type'], string> = {
  move: 'move',
  turnLeft: 'turnLeft',
  turnRight: 'turnRight',
  placeClover: 'putLeaf',
  pickClover: 'removeLeaf',
};

/**
 * Sensor value mapping
 * KaraX: 1 = true/yes, 2 = false/no
 * Internal: true = yes, false = no, null = don't care
 */
function karaXSensorValueToInternal(value: string): boolean | null {
  if (value === '1') return true;
  if (value === '2') return false;
  return null; // Unknown or "don't care"
}

function internalSensorValueToKaraX(value: boolean | null): string {
  if (value === true) return '1';
  if (value === false) return '2';
  return '1'; // Default to "yes" for null (don't care is not directly supported in KaraX single value)
}

/**
 * Parses a .kara XML file content and returns an FSMProgram
 */
export function parseKaraFile(xmlContent: string): FSMProgram {
  const parser = new DOMParser();
  const doc = parser.parseFromString(xmlContent, 'text/xml');

  // Check for parsing errors
  const parseError = doc.querySelector('parsererror');
  if (parseError) {
    throw new Error('Invalid XML format in .kara file');
  }

  const xmlStateMachine = doc.querySelector('XmlStateMachine');
  if (!xmlStateMachine) {
    throw new Error('Missing XmlStateMachine element in .kara file');
  }

  const startStateName = xmlStateMachine.getAttribute('startState') || '';

  // Parse all states
  const xmlStates = doc.querySelectorAll('XmlState');
  const states: FSMState[] = [];
  let stopStateId = 'stop';
  let startStateId: string | null = null;

  // First pass: create all states with their IDs
  const stateNameToId: Record<string, string> = {};

  xmlStates.forEach((xmlState) => {
    const name = xmlState.getAttribute('name') || 'Unnamed';
    const isFinalState = xmlState.getAttribute('finalstate') === 'true';
    const x = parseFloat(xmlState.getAttribute('x') || '100');
    const y = parseFloat(xmlState.getAttribute('y') || '100');

    // Generate a unique ID based on name
    const id = isFinalState ? 'stop' : `state-${name.replace(/\s+/g, '-').toLowerCase()}-${Date.now() + Math.random()}`;
    stateNameToId[name] = id;

    if (isFinalState) {
      stopStateId = id;
    }

    if (name === startStateName) {
      startStateId = id;
    }

    // Parse active detectors for this state
    const xmlSensors = xmlState.querySelectorAll('XmlSensor');
    const activeDetectors: DetectorType[] = [];
    xmlSensors.forEach((sensor) => {
      const sensorName = sensor.getAttribute('name') as DetectorType;
      if (sensorName && ['treeFront', 'treeLeft', 'treeRight', 'mushroomFront', 'onLeaf'].includes(sensorName)) {
        activeDetectors.push(sensorName);
      }
    });

    states.push({
      id,
      name,
      x: Math.max(0, x + 100), // Offset to ensure positive coordinates
      y: Math.max(0, y + 50),
      transitions: [],
      activeDetectors,
    });
  });

  // Second pass: parse transitions
  const xmlTransitions = doc.querySelectorAll('XmlTransition');
  xmlTransitions.forEach((xmlTransition) => {
    const fromName = xmlTransition.getAttribute('from') || '';
    const toName = xmlTransition.getAttribute('to') || '';

    const fromStateId = stateNameToId[fromName];
    const toStateId = stateNameToId[toName];

    if (!fromStateId || !toStateId) return;

    // Parse sensor conditions
    const detectorConditions: Partial<Record<DetectorType, boolean | null>> = {};
    const xmlSensorValues = xmlTransition.querySelectorAll('XmlSensorValue');
    xmlSensorValues.forEach((sensorValue) => {
      const name = sensorValue.getAttribute('name') as DetectorType;
      const value = sensorValue.getAttribute('value') || '';
      if (name && ['treeFront', 'treeLeft', 'treeRight', 'mushroomFront', 'onLeaf'].includes(name)) {
        detectorConditions[name] = karaXSensorValueToInternal(value);
      }
    });

    // Parse commands/actions
    const actions: FSMAction[] = [];
    const xmlCommands = xmlTransition.querySelectorAll('XmlCommand');
    xmlCommands.forEach((command) => {
      const commandName = command.getAttribute('name') || '';
      const actionType = KARAX_COMMAND_TO_INTERNAL[commandName];
      if (actionType) {
        actions.push({ type: actionType });
      }
    });

    // Find the source state and add this transition
    const sourceState = states.find((s) => s.id === fromStateId);
    if (sourceState) {
      sourceState.transitions.push({
        id: `transition-${Date.now()}-${Math.random()}`,
        targetStateId: toStateId,
        detectorConditions,
        actions,
      });
    }
  });

  // Ensure we have a stop state
  if (!states.find((s) => s.id === stopStateId)) {
    states.push({
      id: 'stop',
      name: 'Stop',
      x: 300,
      y: 100,
      transitions: [],
    });
    stopStateId = 'stop';
  }

  return {
    states,
    startStateId,
    stopStateId,
  };
}

/**
 * Exports an FSMProgram to .kara XML format (KaraX compatible)
 */
export function exportFSMToKaraXml(program: FSMProgram): string {
  const lines: string[] = [];

  lines.push('<?xml version="1.0" encoding="UTF-8" standalone="yes"?>');
  lines.push('<XmlStateMachines version="KaraX 1.0 kara">');

  // Find start state name
  const startState = program.states.find((s) => s.id === program.startStateId);
  const startStateName = startState?.name || '';

  lines.push(`    <XmlStateMachine actor="Kara" startState="${escapeXml(startStateName)}">`);

  // Export states
  program.states.forEach((state) => {
    const isFinalState = state.id === program.stopStateId;
    lines.push(
      `        <XmlState finalstate="${isFinalState}" name="${escapeXml(state.name)}" x="${state.x.toFixed(1)}" y="${state.y.toFixed(1)}">`
    );

    // Export active detectors as XmlSensors
    lines.push('            <XmlSensors>');
    if (state.activeDetectors) {
      state.activeDetectors.forEach((detector) => {
        lines.push(`                <XmlSensor name="${detector}"/>`);
      });
    }
    lines.push('            </XmlSensors>');
    lines.push('        </XmlState>');
  });

  // Export transitions
  program.states.forEach((state) => {
    state.transitions.forEach((transition) => {
      const targetState = program.states.find((s) => s.id === transition.targetStateId);
      if (!targetState) return;

      lines.push(`        <XmlTransition from="${escapeXml(state.name)}" to="${escapeXml(targetState.name)}">`);

      // Export sensor values
      lines.push('            <XmlSensorValues>');
      Object.entries(transition.detectorConditions).forEach(([detector, value]) => {
        if (value !== null && value !== undefined) {
          lines.push(
            `                <XmlSensorValue name="${detector}" value="${internalSensorValueToKaraX(value)}"/>`
          );
        }
      });
      lines.push('            </XmlSensorValues>');

      // Export commands
      lines.push('            <XmlCommands>');
      transition.actions.forEach((action) => {
        const commandName = INTERNAL_COMMAND_TO_KARAX[action.type];
        if (commandName) {
          lines.push(`                <XmlCommand name="${commandName}"/>`);
        }
      });
      lines.push('            </XmlCommands>');

      lines.push('        </XmlTransition>');
    });
  });

  lines.push('    </XmlStateMachine>');

  // Export sensor definitions (standard Kara sensors)
  lines.push('    <XmlSensorDefinition description="tree in front?" identifier="treeFront" name="treeFront"/>');
  lines.push('    <XmlSensorDefinition description="tree to the left?" identifier="treeLeft" name="treeLeft"/>');
  lines.push('    <XmlSensorDefinition description="tree to the right?" identifier="treeRight" name="treeRight"/>');
  lines.push(
    '    <XmlSensorDefinition description="mushroom in front?" identifier="mushroomFront" name="mushroomFront"/>'
  );
  lines.push('    <XmlSensorDefinition description="leaf on the ground?" identifier="onLeaf" name="onLeaf"/>');

  lines.push('</XmlStateMachines>');

  return lines.join('\n');
}

/**
 * Escapes special XML characters
 */
function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/**
 * Downloads an FSM program as a .kara file (KaraX compatible XML format)
 */
export function downloadFSMAsKaraX(program: FSMProgram, filename: string = 'kara-program.kara') {
  const xml = exportFSMToKaraXml(program);
  const blob = new Blob([xml], { type: 'application/xml' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename.endsWith('.kara') ? filename : `${filename}.kara`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Detects if content is XML (.kara format) or JSON
 */
export function detectFSMFileFormat(content: string): 'xml' | 'json' {
  const trimmed = content.trim();
  if (trimmed.startsWith('<?xml') || trimmed.startsWith('<XmlStateMachines')) {
    return 'xml';
  }
  return 'json';
}

/**
 * Parses FSM content from either .kara (XML) or JSON format
 */
export function parseFSMContent(content: string): FSMProgram {
  const format = detectFSMFileFormat(content);
  if (format === 'xml') {
    return parseKaraFile(content);
  }
  return JSON.parse(content);
}

/**
 * Validates that an FSMProgram is valid
 */
export function isValidFSMProgram(data: unknown): data is FSMProgram {
  if (!data || typeof data !== 'object') return false;
  const program = data as Record<string, unknown>;
  return (
    Array.isArray(program.states) &&
    program.states.every(
      (state: unknown) =>
        state &&
        typeof state === 'object' &&
        typeof (state as Record<string, unknown>).id === 'string' &&
        typeof (state as Record<string, unknown>).name === 'string'
    ) &&
    (program.startStateId === null || typeof program.startStateId === 'string') &&
    typeof program.stopStateId === 'string'
  );
}
