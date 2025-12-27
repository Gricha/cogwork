// =============================================================================
// Primitives
// =============================================================================

export type Direction = "north" | "south" | "east" | "west" | "up" | "down";
export type Path = string;
export type Scalar = string | number | boolean;

// =============================================================================
// Conditions
// =============================================================================

/** Base conditions - simple comparisons and checks */
export type BaseCondition =
  | { eq: [Path, Scalar] }
  | { ne: [Path, Scalar] }
  | { gt: [Path, number] }
  | { gte: [Path, number] }
  | { lt: [Path, number] }
  | { lte: [Path, number] }
  | { truthy: Path }
  | { falsy: Path }
  | { has: Path } // item id present in inventory
  | { lacks: Path } // item id absent from inventory
  | { present: Path } // object present in current room
  | { absent: Path } // object absent from current room
  | { once: Path } // one-shot gate (marks automatically)
  | { is_at: [Path, Path] }; // [item-id, location-id]

/** Full condition type including combinators */
export type Condition =
  | BaseCondition
  | { and: Condition[] }
  | { or: Condition[] }
  | { not: Condition };

// =============================================================================
// Effects
// =============================================================================

export type Effect =
  | { consume: Path } // sets path to false
  | { set: [Path, Scalar] } // arbitrary state update
  | { markOnce: Path } // record "once" memory
  | { addItem: string } // add item to inventory
  | { removeItem: string } // remove item from inventory
  | { add: [Path, number] } // add to numeric value
  | { subtract: [Path, number] }; // subtract from numeric value

// =============================================================================
// Descriptive Text System
// =============================================================================

export interface DescriptionFragment {
  /** Text to emit if conditions pass */
  say: string;
  /** All conditions must pass (AND semantics) */
  when?: Condition[];
  /** Higher priority fragments suppress lower ones */
  priority?: number;
  /** Only one fragment per group (switch/case behavior) */
  group?: string;
  /** Side effects triggered when this fragment is shown */
  effects?: Effect[];
}

export interface DescriptiveText {
  id: string;
  fragments: DescriptionFragment[];
  /** Optional object-contributed fragments (unused currently) */
  objectFragments?: Record<string, DescriptionFragment[]>;
}

/** Either plain string or complex descriptive text */
export type TextOrDescriptive = string | DescriptiveText;

// =============================================================================
// Game Entities
// =============================================================================

export interface UseAction {
  /** Target item ID (if targeting another item) */
  targetId?: string;
  /** Specific number required (e.g., "use remote 42") */
  number?: number;
  /** Accept any number */
  numberAny?: boolean;
  /** Conditions required for this action */
  requires?: Condition[];
  /** Response text when action executes */
  response: TextOrDescriptive;
  /** Effects applied when action executes */
  effects?: Effect[];
}

export interface Item {
  id: string;
  name: string;
  description: TextOrDescriptive;
  examineText: TextOrDescriptive;
  takeable: boolean;
  aliases?: string[];
  /** If set, item is at this location rather than visible in room */
  location?: string;
  /** Conditions required to take this item */
  takeWhen?: Condition[];
  /** Message when item cannot be taken */
  takeBlockedText?: string;
  /** Effects when item is taken */
  onTake?: Effect[];
  /** Text shown when item is taken */
  onTakeText?: TextOrDescriptive;
  /** Available use actions for this item */
  useActions?: UseAction[];
}

export interface DialogueLine {
  /** @deprecated Use `when` instead */
  condition?: string;
  /** Conditions for this dialogue to be available */
  when?: Condition[];
  /** What the player says */
  playerLine: string;
  /** NPC's response */
  response: TextOrDescriptive;
  /** Flag to set when this option is chosen */
  setsFlag?: string;
  /** Item ID to give player when this option is chosen */
  givesItem?: string;
  /** Additional effects when dialogue is chosen */
  effects?: Effect[];
}

export interface NPC {
  id: string;
  name: string;
  description: string;
  dialogue: DialogueLine[];
  aliases?: string[];
}

export interface Exit {
  direction: Direction;
  targetRoomId: string;
  /** If true, requires requiredItem to pass */
  locked?: boolean;
  /** Item ID required to unlock */
  requiredItem?: string;
  /** Description of the exit */
  description?: string;
  /** Conditions required to use this exit */
  requires?: Condition[];
  /** Message shown when exit is blocked */
  blockedMessage?: TextOrDescriptive;
}

export interface Trigger {
  /** Optional identifier for debugging */
  id?: string;
  /** Conditions that must pass for trigger to fire */
  when: Condition[];
  /** Effects applied when trigger fires */
  effects: Effect[];
  /** Optional message shown when trigger fires */
  message?: TextOrDescriptive;
}

export interface Room {
  id: string;
  name: string;
  description: TextOrDescriptive;
  items: Item[];
  npcs: NPC[];
  exits: Exit[];
  /** Whether room is dark (requires light source) */
  dark?: boolean;
  /** @deprecated Script to run on enter */
  onEnter?: string;
  /** Triggers evaluated when entering/in this room */
  triggers?: Trigger[];
}

export interface Hint {
  id: string;
  text: TextOrDescriptive;
  /** Conditions for when this hint is relevant */
  when?: Condition[];
}

// =============================================================================
// Game Definition
// =============================================================================

export interface GameDefinition {
  // Metadata
  id: string;
  name: string;
  version: string;
  description?: string;

  // World data
  rooms: Room[];

  // Initial state
  startingRoom: string;
  initialFlags: Record<string, Scalar>;

  // Content
  introText: TextOrDescriptive;
  winMessage: TextOrDescriptive;
  hints: Hint[];

  // Global triggers (evaluated after every action)
  globalTriggers?: Trigger[];
}

// =============================================================================
// Game State (Internal)
// =============================================================================

export interface GameState {
  currentRoomId: string;
  inventoryIds: string[];
  takenItemIds: string[];
  flags: Record<string, Scalar>;
  visitedRooms: string[];
  gameOver: boolean;
  won: boolean;
  turnCount: number;
  once: string[];
}
