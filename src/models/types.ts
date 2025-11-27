// Core types for the grid world simulation

export enum Direction {
  North = 'NORTH',
  East = 'EAST',
  South = 'SOUTH',
  West = 'WEST',
}

export enum CellType {
  Empty = 'EMPTY',
  Wall = 'WALL',
  Clover = 'CLOVER',
  Mushroom = 'MUSHROOM',
  Tree = 'TREE',
}

export interface Cell {
  type: CellType;
}

export interface Position {
  x: number;
  y: number;
}

export interface Character {
  position: Position;
  direction: Direction;
  inventory: number; // Number of clovers held
}

export interface World {
  width: number;
  height: number;
  grid: Cell[][];
  character: Character;
}
