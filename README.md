# Kara Ladybug World 🐞  
A visual programming environment for learning basic algorithms and control flow.

This project is a React + TypeScript web app where you program a little ladybug to move around a grid world filled with clovers, mushrooms, trees, and walls. Users build a program from high-level commands (Move, Turn Left/Right, Pick, Place) and then run or step through it to see how the ladybug behaves.

---

## Tech Stack

**Core**

- **React 18** – UI layer and component model
- **TypeScript** – strong typing for the world model and simulation engine
- **Vite** (or CRA) – dev server and bundler
- **CSS / CSS Modules / Tailwind CSS** – layout and styling (choose one; Tailwind is a great fit)
- **ESLint + Prettier** – linting and formatting

**Recommended (Planned)**

- **React Testing Library + Vitest / Jest** – unit tests for the engine and components
- **React Context + `useReducer`** – more structured state management once the app grows
- **GitHub Pages / Vercel / Netlify** – hosting

---

## High-Level Architecture

The app is split into two layers:

1. **Simulation Engine (domain layer)**  
   Pure TypeScript modules that know nothing about React.  
   - `World`, `Cell`, `Ladybug`, `Direction` types  
   - Command and object types (`Command`, `WorldObject`)  
   - Functions that mutate the world (e.g. `moveForward`, `turnLeft`, `pickClover`)  
   - A `stepProgram` function that executes the next command

2. **React UI Layer**  
   Components that render the grid and controls and call the engine.  
   - **WorldView**: renders the grid and objects  
   - **CommandsPanel**: shows available commands  
   - **ProgramPanel**: shows the current sequence of commands  
   - **ExecutionControls**: Run / Step buttons and speed slider  
   - **WorldObjectsPanel**: palette for placing clovers, mushrooms, trees, walls  
   - **Layout** and helper components

Keeping the engine pure and UI-agnostic makes it easy to test and extend later (e.g., levels, different programming models, or an FSM editor).

---

## Features Checklist

### Core App

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

### Level / Scenario System

- [ ] Level (Scenario) model with:
  - [ ] Initial world layout
  - [ ] Allowed commands
  - [ ] Starting ladybug position and direction
  - [ ] `goalCondition(world)` function
- [ ] Level selector UI
- [ ] “Level complete” detection and success UI
- [ ] Persisted level progress (e.g., `localStorage`)

### Editing & UX Enhancements

- [ ] Advanced world editor features (drag to paint, clear world, preset templates)
- [ ] Export / Import worlds and programs as JSON
- [ ] Undo / Redo for world edits and program edits
- [ ] Keyboard shortcuts (e.g., arrow keys for navigation, space to step)
- [ ] Accessibility improvements (focus states, ARIA labels, high-contrast mode)

### Engine & Pedagogy Extensions

- [ ] Optional finite-state-machine (FSM) programming mode
- [ ] Support for loops / simple control structures (e.g., “repeat n times”)
- [ ] Built-in tutorial / walkthrough levels
- [ ] Teacher view (shareable links to specific levels/programs)

### Quality & Tooling

- [ ] Unit tests for the simulation engine
- [ ] Component tests for core UI
- [ ] Linting + formatting scripts
- [ ] Production build + deployment pipeline (GitHub Actions / Vercel / Netlify)

---

## Project Structure (Suggested)

```text
src/
  models/
    world.ts         // World, Cell, Ladybug, Direction types & helpers
    commands.ts      // Command enum/type and execution logic
    scenarios.ts     // Level definitions (planned)
  engine/
    stepProgram.ts   // Executes a single step of the current program
  components/
    WorldView/
      WorldView.tsx
      WorldView.css
    CommandsPanel/
      CommandsPanel.tsx
    ProgramPanel/
      ProgramPanel.tsx
    ExecutionControls/
      ExecutionControls.tsx
    WorldObjectsPanel/
      WorldObjectsPanel.tsx
  hooks/
    useSimulation.ts  // Custom hook to manage running/stepping logic (optional)
  App.tsx
  main.tsx


## Details on original Kara

The original Kara – finite-state ladybug

The “classic” Kara environment is a graphical finite-state-machine (FSM) programming lab. You see a rectangular grid world containing:

Kara the ladybug

Trees (solid obstacles)

Mushrooms (pushable blocks)

Clover leaves (collectable/placable tokens) 
Wikipedia
+1

Kara can move forward, turn left/right, put down a leaf and pick up a leaf. She has sensors such as “tree in front?”, “mushroom in front?”, “on leaf?” etc. Programs are finite automata drawn in a visual editor: states are nodes, labeled transitions test a combination of sensors and execute one or more commands when taken. 
swisseduc.ch
+1

The UI always has at least:

A world editor where teachers or students design levels (labyrinths, mazes, patterns of leaves, Sokoban-like puzzles, etc.).

A program editor for the FSM diagram.

A control panel to start, pause, single-step, and adjust speed. 
swisseduc.ch
+1

Kara ships with lots of built-in tasks of increasing difficulty, each with sample solutions – starting from “walk forward until the tree” and going up to fractal-like patterns, cellular automata and Pascal’s triangle mod 2. 
swisseduc.ch
+1
 Pedagogically, this gives students a concrete feel for:

States and transitions

Conditionals and loops (as cycles in the automaton)

Abstraction and decomposition (building reusable sub-automata)

Because everything is finite and graphical, you avoid syntax errors and can focus on algorithmic thinking and correctness.

JavaKara and the text-based Kara variants

Once students understand the ladybug world and FSMs, the next step is to move into real programming languages without losing the comforting environment. That’s what JavaKara and its siblings do.

JavaKara keeps exactly the same grid world, but you program Kara in Java instead of drawing automata. Every exercise is a Java class extending JavaKaraProgram. Inside myProgram() (or similar) you call methods like kara.move(), kara.turnLeft(), kara.onLeaf(), etc., and you can also access a world object (world.isTree(x, y), world.setLeaf(x, y, true)…) and some helper tools methods for I/O and randomness. 
swisseduc.ch
+1

The JavaKara environment bundles a tiny IDE with:

Syntax highlighting and auto-indent

Built-in compilation (invoking javac behind the scenes)

Direct run/step controls with the same visual world display 
Wikipedia

The design goal is a smooth transition from Kara’s FSMs to professional Java: the world and problems are familiar, so cognitive load is spent on Java syntax, control structures, methods, parameters, etc. 
swisseduc.ch
+1

On the same architecture, SwissEduc hosts RubyKara, PythonKara and JavaScriptKara. These reuse the Kara world but let you script it in the respective languages, teaching imperative/procedural basics (functions, conditionals, loops, methods with parameters and return values) in each language. 
swisseduc.ch
+3
Wikipedia
+3
swisseduc.ch
+3
 Because Ruby, Python and JavaScript have lighter syntax than Java, their Kara versions need less boilerplate; you typically just write a loop directly calling kara.move, kara.putLeaf, etc.

There are also independent re-implementations, such as a pure-Python Kara using Tkinter and reading the original Kara world XML files, created to modernize the Python 2–based version. 
Medium

TuringKara – Kara as a Turing machine world

TuringKara pushes students from finite automata to Turing machines and the theory of computation. It reuses Kara’s UI style but replaces the ladybug with a red read/write head and the naturalistic icons with abstract symbols:

Alphabet: 0, 1, #, blank □, and arrows ←, →, ↑, ↓.

The head can move up/down/left/right and write any symbol on any cell. 
swisseduc.ch

Again you build machines as graphical state diagrams, but each transition can contain multiple “write” and “move” commands, which are executed atomically. That makes most machines much smaller than textbook Turing machines, while remaining equivalent to the standard model. 
swisseduc.ch

Because the tape is now a 2-D sheet instead of a 1-D line, many algorithms become visually and conceptually simpler: addition of binary numbers arranged in columns, maze-filling with backtracking using arrow markers, multiplication via the “gypsy” doubling/halving algorithm, and even a universal Turing machine that simulates 1-D machines encoded in the 2-D world. 
swisseduc.ch
+1
 Teachers also use TuringKara to experiment with busy-beaver candidates and to discuss computability and undecidability in an almost game-like way. 
swisseduc.ch

The environment looks and behaves almost exactly like Kara: same style of program editor, same speed and step controls, so prior Kara experience transfers directly. 
swisseduc.ch
+1

MultiKara – concurrency with four ladybugs

MultiKara addresses concurrent programming. You can have up to four colored ladybugs running different state machines concurrently in the same world. 
swisseduc.ch
+1

Key features:

Scheduler and time model. Each bug’s state machine is run in its own process. A scheduler interleaves transitions in discrete time steps; each step executes one entire transition atomically. Students can adjust priorities, see a process life-cycle diagram, and even choose the next bug manually for debugging. 
swisseduc.ch
+1

Additional world objects. Besides leaves, trees and mushrooms, there are direction signs indicating allowed entry directions, and leaves are colored per bug to visualize who did what. 
swisseduc.ch

Concurrency mechanisms. MultiKara introduces four high-level synchronization primitives, each visualized in the world or the program:

Meeting room (world) and barrier states (program) for inclusive synchronization – everyone waits until all have arrived.

Monitor squares (world) and critical section states (program) for mutual exclusion – only one bug may enter at a time. 
swisseduc.ch
+1

Students use these to solve versions of classic concurrency problems – synchronized walks, traffic control, producer/consumer lines of leaves, etc. The environment is deliberately kept as close as possible to Kara so learners focus on concurrency concepts (nondeterminism, deadlocks, race conditions) rather than low-level API details. 
swisseduc.ch
+2
swisseduc.ch
+2

LegoKara – from screen to robot

LegoKara takes the same graphical FSM programs and compiles them to run on Lego Mindstorms RCX robots. The world is simplified (basically: Kara, leaves and trees), and icons are mapped to sensors/actuators: leaves correspond to light sensor readings, trees to touch sensors, and commands to motor control like “turn left/right” and forward motion. 
Wikipedia

The idea is to preserve Kara’s visual programming while giving students the thrill of seeing their “ladybug” as a real mobile robot reacting to the physical environment. This supports topics like sensor calibration, noise, and debugging in the real world.

GreenfootKara and GameGridKara – OO and IDE-agnostic versions

Later, independent educators re-implemented Kara concepts in other Java teaching frameworks.

GreenfootKara is a set of scenarios for the Greenfoot environment. Here, Kara is a Java class representing the general ladybug; students create objects (“MyKara”) that subclass it and override act() to implement behavior. They still have methods like move(), turnRight(), onLeaf() etc., but the emphasis shifts to object-oriented programming: classes vs objects, methods, return types, fields, and the compile–run cycle in Greenfoot. 
code.makery.ch

The tutorial series walks through GreenfootKara scenarios covering program flow, variables, methods, and even building a Sokoban-style game – all inside the Kara world, so students can focus on OO concepts rather than game asset complexity. 
code.makery.ch

GameGridKara combines Kara with the JGameGrid library. Instead of being tied to a custom IDE, it ships Kara scenarios as plain Java projects that run in any IDE (Eclipse, NetBeans, BlueJ). JGameGrid provides the grid-based playground; Kara implements the ladybug logic and exercises. 
GitHub
 This makes Kara more flexible for high-school or introductory university courses that already use standard Java tooling.

Other derivatives and the overall ecosystem

The Kara ecosystem has grown beyond the ETH environments:

JavaScriptKara, PythonKara, RubyKara – language-specific Kara variants hosted on SwissEduc, each with its own assignments and teaching notes, aimed at basic imperative programming in those languages. 
swisseduc.ch
+2
swisseduc.ch
+2

ScratchKara – a hybrid that lets you script Kara using Scratch-style blocks (mentioned in the German documentation as a further version). 
Wikipedia

Various teaching materials: slides, handouts, textbooks (e.g., Programmieren mit Kara), and online manuals help teachers integrate Kara into everything from middle-school CS to discrete math and theory-of-computation courses. 
Wikipedia
+2
ResearchGate
+2

Across all of these, the core constants are:

The world model – a small finite grid with a tiny set of objects.

The actor – Kara or some variant (ladybug, read/write head, robot).

The abstractions taught – finite automata → Turing machines → concurrency → structured / OO programming in mainstream languages.