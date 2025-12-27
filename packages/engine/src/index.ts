// Main engine class
export { GameEngine, type GameEngineOptions } from "./GameEngine";

// Types
export type {
  GameDefinition,
  GameState,
  Room,
  Item,
  NPC,
  Exit,
  Hint,
  Trigger,
  UseAction,
  DialogueLine,
  DescriptiveText,
  DescriptionFragment,
  Condition,
  BaseCondition,
  Effect,
  Direction,
  Scalar,
  Path,
  TextOrDescriptive,
} from "./types";

// Re-export schemas for consumers who want to validate
export * from "./schemas/index";
