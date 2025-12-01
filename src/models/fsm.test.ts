import { describe, it, expect } from 'vitest';
import {
  parseKaraFile,
  exportFSMToKaraXml,
  detectFSMFileFormat,
  parseFSMContent,
  isValidFSMProgram,
  createEmptyFSM,
  FSMProgram,
} from './fsm';

describe('FSM - KaraX .kara format', () => {
  const sampleKaraXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<XmlStateMachines version="KaraX 1.0 kara">
    <XmlStateMachine actor="Kara" startState="Start">
        <XmlState finalstate="true" name="Stop" x="300.0" y="100.0">
            <XmlSensors/>
        </XmlState>
        <XmlState finalstate="false" name="Start" x="100.0" y="100.0">
            <XmlSensors>
                <XmlSensor name="treeFront"/>
            </XmlSensors>
        </XmlState>
        <XmlTransition from="Start" to="Stop">
            <XmlSensorValues>
                <XmlSensorValue name="treeFront" value="1"/>
            </XmlSensorValues>
            <XmlCommands>
                <XmlCommand name="move"/>
                <XmlCommand name="turnLeft"/>
            </XmlCommands>
        </XmlTransition>
        <XmlTransition from="Start" to="Start">
            <XmlSensorValues>
                <XmlSensorValue name="treeFront" value="2"/>
            </XmlSensorValues>
            <XmlCommands>
                <XmlCommand name="move"/>
            </XmlCommands>
        </XmlTransition>
    </XmlStateMachine>
    <XmlSensorDefinition description="tree in front?" identifier="treeFront" name="treeFront"/>
</XmlStateMachines>`;

  describe('parseKaraFile', () => {
    it('should parse states correctly', () => {
      const program = parseKaraFile(sampleKaraXml);
      expect(program.states).toHaveLength(2);

      const stopState = program.states.find((s) => s.name === 'Stop');
      expect(stopState).toBeDefined();
      expect(stopState?.id).toBe(program.stopStateId);

      const startState = program.states.find((s) => s.name === 'Start');
      expect(startState).toBeDefined();
      expect(startState?.id).toBe(program.startStateId);
    });

    it('should parse active detectors correctly', () => {
      const program = parseKaraFile(sampleKaraXml);
      const startState = program.states.find((s) => s.name === 'Start');
      expect(startState?.activeDetectors).toContain('treeFront');
    });

    it('should parse transitions correctly', () => {
      const program = parseKaraFile(sampleKaraXml);
      const startState = program.states.find((s) => s.name === 'Start');
      expect(startState?.transitions).toHaveLength(2);
    });

    it('should parse sensor conditions correctly', () => {
      const program = parseKaraFile(sampleKaraXml);
      const startState = program.states.find((s) => s.name === 'Start');

      // Find transition with treeFront = true (value="1")
      const trueTransition = startState?.transitions.find(
        (t) => t.detectorConditions.treeFront === true
      );
      expect(trueTransition).toBeDefined();

      // Find transition with treeFront = false (value="2")
      const falseTransition = startState?.transitions.find(
        (t) => t.detectorConditions.treeFront === false
      );
      expect(falseTransition).toBeDefined();
    });

    it('should parse actions correctly', () => {
      const program = parseKaraFile(sampleKaraXml);
      const startState = program.states.find((s) => s.name === 'Start');

      // Find transition to Stop with move and turnLeft
      const stopTransition = startState?.transitions.find((t) => {
        const targetState = program.states.find((s) => s.id === t.targetStateId);
        return targetState?.name === 'Stop';
      });

      expect(stopTransition?.actions).toHaveLength(2);
      expect(stopTransition?.actions[0].type).toBe('move');
      expect(stopTransition?.actions[1].type).toBe('turnLeft');
    });

    it('should map KaraX commands to internal action types', () => {
      const xmlWithAllCommands = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<XmlStateMachines version="KaraX 1.0 kara">
    <XmlStateMachine actor="Kara" startState="Test">
        <XmlState finalstate="false" name="Test" x="100.0" y="100.0">
            <XmlSensors/>
        </XmlState>
        <XmlState finalstate="true" name="Stop" x="300.0" y="100.0">
            <XmlSensors/>
        </XmlState>
        <XmlTransition from="Test" to="Stop">
            <XmlSensorValues/>
            <XmlCommands>
                <XmlCommand name="move"/>
                <XmlCommand name="turnLeft"/>
                <XmlCommand name="turnRight"/>
                <XmlCommand name="putLeaf"/>
                <XmlCommand name="removeLeaf"/>
            </XmlCommands>
        </XmlTransition>
    </XmlStateMachine>
</XmlStateMachines>`;

      const program = parseKaraFile(xmlWithAllCommands);
      const testState = program.states.find((s) => s.name === 'Test');
      const transition = testState?.transitions[0];

      expect(transition?.actions).toHaveLength(5);
      expect(transition?.actions[0].type).toBe('move');
      expect(transition?.actions[1].type).toBe('turnLeft');
      expect(transition?.actions[2].type).toBe('turnRight');
      expect(transition?.actions[3].type).toBe('placeClover');
      expect(transition?.actions[4].type).toBe('pickClover');
    });
  });

  describe('exportFSMToKaraXml', () => {
    it('should export states with correct attributes', () => {
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
            id: 'state-1',
            name: 'Start',
            x: 100,
            y: 100,
            transitions: [],
            activeDetectors: ['treeFront', 'onLeaf'],
          },
        ],
        startStateId: 'state-1',
        stopStateId: 'stop',
      };

      const xml = exportFSMToKaraXml(program);

      expect(xml).toContain('startState="Start"');
      expect(xml).toContain('finalstate="true"');
      expect(xml).toContain('name="Stop"');
      expect(xml).toContain('name="Start"');
      expect(xml).toContain('<XmlSensor name="treeFront"/>');
      expect(xml).toContain('<XmlSensor name="onLeaf"/>');
    });

    it('should export transitions with sensor values and commands', () => {
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
            id: 'state-1',
            name: 'Walk',
            x: 100,
            y: 100,
            transitions: [
              {
                id: 'trans-1',
                targetStateId: 'stop',
                detectorConditions: { treeFront: true, onLeaf: false },
                actions: [{ type: 'move' }, { type: 'pickClover' }],
              },
            ],
            activeDetectors: ['treeFront', 'onLeaf'],
          },
        ],
        startStateId: 'state-1',
        stopStateId: 'stop',
      };

      const xml = exportFSMToKaraXml(program);

      expect(xml).toContain('<XmlTransition from="Walk" to="Stop">');
      expect(xml).toContain('<XmlSensorValue name="treeFront" value="1"/>');
      expect(xml).toContain('<XmlSensorValue name="onLeaf" value="2"/>');
      expect(xml).toContain('<XmlCommand name="move"/>');
      expect(xml).toContain('<XmlCommand name="removeLeaf"/>');
    });

    it('should include sensor definitions', () => {
      const program = createEmptyFSM();
      const xml = exportFSMToKaraXml(program);

      expect(xml).toContain('<XmlSensorDefinition description="tree in front?" identifier="treeFront" name="treeFront"/>');
      expect(xml).toContain('<XmlSensorDefinition description="tree to the left?" identifier="treeLeft" name="treeLeft"/>');
      expect(xml).toContain('<XmlSensorDefinition description="tree to the right?" identifier="treeRight" name="treeRight"/>');
      expect(xml).toContain('<XmlSensorDefinition description="mushroom in front?" identifier="mushroomFront" name="mushroomFront"/>');
      expect(xml).toContain('<XmlSensorDefinition description="leaf on the ground?" identifier="onLeaf" name="onLeaf"/>');
    });
  });

  describe('round-trip parsing', () => {
    it('should preserve FSM structure through export and re-import', () => {
      const originalProgram: FSMProgram = {
        states: [
          {
            id: 'stop',
            name: 'Stop',
            x: 300,
            y: 100,
            transitions: [],
          },
          {
            id: 'state-1',
            name: 'Walking',
            x: 100,
            y: 100,
            transitions: [
              {
                id: 'trans-1',
                targetStateId: 'stop',
                detectorConditions: { treeFront: true },
                actions: [{ type: 'move' }],
              },
            ],
            activeDetectors: ['treeFront'],
          },
        ],
        startStateId: 'state-1',
        stopStateId: 'stop',
      };

      // Export and re-import
      const xml = exportFSMToKaraXml(originalProgram);
      const reimportedProgram = parseKaraFile(xml);

      // Check state count
      expect(reimportedProgram.states).toHaveLength(2);

      // Check start state is preserved
      const startState = reimportedProgram.states.find(
        (s) => s.id === reimportedProgram.startStateId
      );
      expect(startState?.name).toBe('Walking');

      // Check transitions are preserved
      expect(startState?.transitions).toHaveLength(1);
      expect(startState?.transitions[0].detectorConditions.treeFront).toBe(true);
      expect(startState?.transitions[0].actions[0].type).toBe('move');
    });
  });

  describe('detectFSMFileFormat', () => {
    it('should detect XML format', () => {
      expect(detectFSMFileFormat('<?xml version="1.0"?><XmlStateMachines/>')).toBe('xml');
      expect(detectFSMFileFormat('<XmlStateMachines version="1.0">')).toBe('xml');
    });

    it('should detect JSON format', () => {
      expect(detectFSMFileFormat('{"states": [], "startStateId": null}')).toBe('json');
      expect(detectFSMFileFormat('  { "stopStateId": "stop" }')).toBe('json');
    });
  });

  describe('parseFSMContent', () => {
    it('should parse XML content', () => {
      const program = parseFSMContent(sampleKaraXml);
      expect(program.states).toHaveLength(2);
    });

    it('should parse JSON content', () => {
      const jsonContent = JSON.stringify({
        states: [
          { id: 'stop', name: 'Stop', x: 100, y: 100, transitions: [] },
        ],
        startStateId: null,
        stopStateId: 'stop',
      });

      const program = parseFSMContent(jsonContent);
      expect(program.states).toHaveLength(1);
      expect(program.states[0].name).toBe('Stop');
    });
  });

  describe('isValidFSMProgram', () => {
    it('should validate correct FSM program', () => {
      const validProgram = {
        states: [{ id: 'stop', name: 'Stop', x: 0, y: 0, transitions: [] }],
        startStateId: null,
        stopStateId: 'stop',
      };
      expect(isValidFSMProgram(validProgram)).toBe(true);
    });

    it('should reject invalid FSM program', () => {
      expect(isValidFSMProgram(null)).toBe(false);
      expect(isValidFSMProgram({})).toBe(false);
      expect(isValidFSMProgram({ states: 'not an array' })).toBe(false);
      expect(isValidFSMProgram({ states: [], startStateId: null })).toBe(false);
    });
  });
});
