# Kara Ladybug World 🐞  
A visual programming environment for learning basic algorithms and control flow.

This project is a React + TypeScript web app where you program a little ladybug to move around a grid world filled with clovers, mushrooms, trees, and walls. Users build a program from commands (Move, Turn Left/Right, Pick, Place) and then run or step through it to see how the ladybug behaves.

---

## Tech Stack

**Core**

- **React 18** – UI layer and component model
- **TypeScript 5** – strong typing for the world model and simulation engine
- **Vite 5** – dev server and bundler with SWC for fast compilation
- **Tailwind CSS 3** – utility-first styling with dark mode support
- **Radix UI** – accessible, unstyled UI primitives (dialogs, dropdowns, sliders, tabs, etc.)
- **Lucide React** – icon library
- **ESLint 9 + Prettier** – linting and formatting

**Testing & Quality**

- **Vitest** – fast unit testing framework
- **React Testing Library** – component testing utilities
- **TypeScript strict mode** – comprehensive type checking

**State & Utilities**

- **React hooks** – useState, useEffect, useCallback, useMemo, useRef for state management
- **localStorage** – persisting user settings, progress, and code
- **Sonner** – toast notifications
- **class-variance-authority** – component variant styling

---

## High-Level Architecture

The app is organized into three main layers:

### 1. Domain Layer (`src/models/`)

Pure TypeScript modules with no React dependencies. Fully testable and reusable.

**Core Types** (`types.ts`)
- `World`, `Cell`, `Position`, `Character` – grid world data structures
- `Direction`, `CellType` – enums for cardinal directions and cell contents

**World Engine** (`world.ts`)
- Immutable state transformations: `moveForward`, `turnLeft`, `turnRight`, `pickClover`, `placeClover`
- World validation and bounds checking

**Programming Models**
- `program.ts` – Visual block-based commands (ScratchKara)
- `fsm.ts` + `fsmExecutor.ts` – Finite State Machine programming (Kara)
- `textKara.ts` + `textKaraExecutor.ts` – Text-based code execution (JavaKara, PythonKara, JavaScriptKara, RubyKara)

**Exercise System** (`scenario.ts`, `scenarios.ts`)
- Scenario definitions with initial world, goal conditions, and allowed commands
- Progress persistence to localStorage

**File I/O** (`worldTemplates.ts`)
- Export/import worlds and programs as `.karax` JSON files
- Preset world templates

### 2. React UI Layer (`src/components/`, `src/pages/`)

**Main Page** (`Index.tsx`)
- Central orchestrator managing all application state
- Two tabs: Map (world editing) and Program (code editing)
- Exercise mode vs Sandbox mode switching

**World Components**
- `WorldView` – Renders the interactive grid with drag-and-drop support
- `WorldEditor` – Palette for placing objects (Kara, clovers, mushrooms, trees)

**Programming Components**
- `ProgramPanel` – Visual command blocks for ScratchKara
- `FSMEditor` – Drag-and-drop finite state machine editor with states and transitions
- `CodeEditor` – Syntax-highlighted text editor for text-based languages
- `CommandPanel` – Available commands palette

**Dialog Components**
- `ExerciseSelector` – Browse and select exercises
- `ExerciseCompleteDialog` – Success celebration
- `Tutorial` – Interactive onboarding walkthrough
- `RepeatPatternDialog` – Loop/repeat command configuration

### 3. Hooks & Utilities (`src/hooks/`, `src/lib/`)

**Custom Hooks**
- `useSettings` – Theme, grid color, and view mode preferences (persisted)
- `useUndoRedo` – World state history management
- `useKeyboardShortcuts` – Global keyboard bindings
- `useScreenReader` – Accessibility announcements

**UI Components** (`src/components/ui/`)
- Radix UI primitives wrapped with Tailwind styling (Button, Dialog, Tabs, Slider, etc.)

---


### To Do

## Other Kara Variants To Add

- [ ] MultiKara 
- [ ] TuringKara 
- [ ] GreenFootKara 
- [ ] GamegridKara 

## In Development (Not tested and compatible with OG)

- [ ] PythonKara programming mode 
- [ ] JavaScriptKara programming mode 
- [ ] RubyKara programming mode 
- [ ] ScratchKara

## Misc

- [ ] Classroom/Teacher view (shareable links to specific levels/programs)
- [ ] Implement actual exercises from legacy version
- [ ] Ensure upload/download works through all test cases
- [ ] Add Mobile compatability?
- [ ] Fix comment functionallity in IDE
- [ ] Add determinisitc/non-deterministic modes


---


### Done (incomplete feature list)

## Core App

- [x] React app scaffolded (Vite/CRA)  
- [x] TypeScript configured  
- [x] Base layout with three main regions:
  - Commands + Program
  - Grid world
  - World objects + Quick Guide
- [x] 2D grid world rendered with CSS grid
- [x] Ladybug, clover, mushroom, tree, wall objects rendered
- [x] Command palette: Move, Turn Left, Turn Right, Pick, Place
- [x] Program list where commands can be added/removed (and reordered/dragged)  
- [x] Execution controls: Run and Step  
- [x] Execution speed slider  
- [x] Simulation engine that updates the world state according to commands

## Exercise / Scenario System

- [x] Exercise (Scenario) model with:
  - [x] Initial world layout
  - [x] Allowed commands
  - [x] Starting ladybug position and direction
  - [x] `goalCondition(world)` function
- [x] Exercise selector UI
- [x] "Exercise complete" detection and success UI
- [x] Persisted exercise progress (localStorage)

## Editing & UX Enhancements

- [x] Advanced world editor features (drag to paint, clear world, preset templates)
- [x] Export / Import worlds and programs as JSON
- [x] Undo / Redo for program edits (Ctrl+Z, Ctrl+Y)
- [x] Keyboard shortcuts (Space, S, R, C, L, Ctrl+S, Ctrl+Z, Ctrl+Y)
- [x] Accessibility improvements (focus states, ARIA labels, screen reader support, keyboard navigation)
- [x] Map size controls with dynamic limits (1-100x100)
- [x] Zoom controls (100%, Fit to screen, scroll wheel zoom without modifier keys)
- [x] Panning functionality (click and drag to pan map in both exercise and sandbox modes)
- [x] Kara Status panel showing position, facing direction, and clover inventory
- [x] Subtle hover highlighting on grid cells (visual feedback even without tools selected)
- [x] Fluid drag and drop with custom emoji drag images
- [x] Drag elements from World Editor palette to grid
- [x] Drag elements between grid cells with automatic source clearing
- [x] Performance optimizations (memoized Cell component, GPU acceleration with CSS transforms)
- [x] Toggle selection behavior for tools (click to select, click again to deselect)

## Engine & Pedagogy Extensions

- [x] Optional finite-state-machine (FSM) programming mode
- [x] Support for loops / simple control structures (e.g., "repeat n times")
- [x] Built-in tutorial / walkthrough levels

## Programming Modes

- [x] Default programming mode (visual command blocks)
- [x] JavaKara programming mode (Java syntax for Kara commands)
- [x] Finite-state machine (FSM/Kara) visual editor with drag-and-drop states and transitions
- [x] Code editor with syntax highlighting for text-based programming modes
- [x] Code editor features: auto-closing brackets, auto-indentation, undo/redo, bracket matching

## Settings & Customization

- [x] Light/Dark/System theme modes with automatic browser preference detection
- [x] Grid color themes (Green, Baby Blue, White, Dark)
- [x] "Kara's Vision" transparency mode (fade items Kara can't see)
- [x] Persistent settings via localStorage

## Quality & Tooling

- [x] Unit tests for the simulation engine (68 tests covering world model, commands, and scenarios)
- [x] Component tests for core UI
- [x] Linting + formatting scripts (ESLint, Prettier, TypeScript type checking)

---

