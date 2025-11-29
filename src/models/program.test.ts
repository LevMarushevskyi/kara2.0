import { describe, it, expect } from 'vitest';
import { CommandType, repeatLastCommands, createProgram, availableCommands } from './program';

describe('Program Model', () => {
  describe('repeatLastCommands', () => {
    it('should repeat last 2 commands 3 times', () => {
      const program = [
        CommandType.MoveForward,
        CommandType.TurnLeft,
        CommandType.MoveForward,
        CommandType.TurnRight,
      ];

      const result = repeatLastCommands(program, 2, 3);

      expect(result).toEqual([
        CommandType.MoveForward,
        CommandType.TurnLeft,
        CommandType.MoveForward,
        CommandType.TurnRight,
        CommandType.MoveForward,
        CommandType.TurnRight,
        CommandType.MoveForward,
        CommandType.TurnRight,
        CommandType.MoveForward,
        CommandType.TurnRight,
      ]);
    });

    it('should repeat last command once', () => {
      const program = [CommandType.MoveForward, CommandType.TurnLeft];

      const result = repeatLastCommands(program, 1, 1);

      expect(result).toEqual([CommandType.MoveForward, CommandType.TurnLeft, CommandType.TurnLeft]);
    });

    it('should return original program when commandCount is 0', () => {
      const program = [CommandType.MoveForward, CommandType.TurnLeft];
      const result = repeatLastCommands(program, 0, 5);
      expect(result).toEqual(program);
    });

    it('should return original program when times is 0', () => {
      const program = [CommandType.MoveForward, CommandType.TurnLeft];
      const result = repeatLastCommands(program, 2, 0);
      expect(result).toEqual(program);
    });

    it('should return original program when commandCount exceeds program length', () => {
      const program = [CommandType.MoveForward, CommandType.TurnLeft];
      const result = repeatLastCommands(program, 5, 2);
      expect(result).toEqual(program);
    });

    it('should repeat entire program when commandCount equals program length', () => {
      const program = [CommandType.MoveForward, CommandType.TurnLeft];
      const result = repeatLastCommands(program, 2, 2);

      expect(result).toEqual([
        CommandType.MoveForward,
        CommandType.TurnLeft,
        CommandType.MoveForward,
        CommandType.TurnLeft,
        CommandType.MoveForward,
        CommandType.TurnLeft,
      ]);
    });

    it('should handle repeating pattern multiple times', () => {
      const program = [CommandType.MoveForward, CommandType.PickClover];

      const result = repeatLastCommands(program, 2, 4);

      expect(result).toHaveLength(10); // 2 original + 8 repeated (2 * 4)
      expect(result.filter((cmd) => cmd === CommandType.MoveForward)).toHaveLength(5);
      expect(result.filter((cmd) => cmd === CommandType.PickClover)).toHaveLength(5);
    });

    it('should return empty array when program is empty', () => {
      const program: CommandType[] = [];
      const result = repeatLastCommands(program, 1, 1);
      expect(result).toEqual([]);
    });
  });

  describe('createProgram', () => {
    it('should create empty program', () => {
      const program = createProgram();
      expect(program.commands).toEqual([]);
      expect(program.currentStep).toBe(-1);
      expect(program.isRunning).toBe(false);
    });
  });

  describe('availableCommands', () => {
    it('should contain all command types', () => {
      const commandTypes = availableCommands.map((cmd) => cmd.type);
      expect(commandTypes).toContain(CommandType.MoveForward);
      expect(commandTypes).toContain(CommandType.TurnLeft);
      expect(commandTypes).toContain(CommandType.TurnRight);
      expect(commandTypes).toContain(CommandType.PickClover);
      expect(commandTypes).toContain(CommandType.PlaceClover);
    });

    it('should have unique ids', () => {
      const ids = availableCommands.map((cmd) => cmd.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(availableCommands.length);
    });

    it('should have labels and icons for all commands', () => {
      availableCommands.forEach((cmd) => {
        expect(cmd.label).toBeTruthy();
        expect(cmd.icon).toBeTruthy();
        expect(cmd.type).toBeTruthy();
        expect(cmd.id).toBeTruthy();
      });
    });
  });

  describe('Integration: repeatLastCommands for common patterns', () => {
    it('should create square pattern (4 moves with 3 right turns)', () => {
      const singleSide = [CommandType.MoveForward, CommandType.TurnRight];

      const result = repeatLastCommands(singleSide, 2, 3);

      // Should be: original 2 + (2 * 3) = 8 commands total
      expect(result).toHaveLength(8);
      expect(result.filter((cmd) => cmd === CommandType.MoveForward)).toHaveLength(4);
      expect(result.filter((cmd) => cmd === CommandType.TurnRight)).toHaveLength(4);
    });

    it('should create zigzag pattern', () => {
      const zigzag = [
        CommandType.MoveForward,
        CommandType.TurnRight,
        CommandType.MoveForward,
        CommandType.TurnLeft,
      ];

      const result = repeatLastCommands(zigzag, 4, 2);

      expect(result).toHaveLength(12); // 4 + (4 * 2)
    });
  });
});
