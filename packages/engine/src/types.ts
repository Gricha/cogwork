export type Scalar = string | number | boolean;

export type BuiltinPath = "room" | "room.id" | "won" | "gameOver" | "turnCount";
export type FlagPath = `flags.${string}`;
export type Path = BuiltinPath | FlagPath | string;

export type BaseCondition =
  | { eq: [Path, Scalar] }
  | { ne: [Path, Scalar] }
  | { gt: [Path, number] }
  | { gte: [Path, number] }
  | { lt: [Path, number] }
  | { lte: [Path, number] }
  | { truthy: Path }
  | { falsy: Path }
  | { has: Path }
  | { lacks: Path }
  | { present: Path }
  | { absent: Path }
  | { once: Path }
  | { is_at: [Path, Path] };

export type Condition =
  | BaseCondition
  | { and: Condition[] }
  | { or: Condition[] }
  | { not: Condition };

export type Effect =
  | { consume: Path }
  | { set: [Path, Scalar] }
  | { markOnce: Path }
  | { addItem: string }
  | { removeItem: string }
  | { add: [Path, number] }
  | { subtract: [Path, number] };

export interface DescriptionFragment {
  say: string;
  when?: Condition[];
  priority?: number;
  group?: string;
  effects?: Effect[];
}

export interface DescriptiveText {
  id: string;
  fragments: DescriptionFragment[];
  objectFragments?: Record<string, DescriptionFragment[]>;
}

export type TextOrDescriptive = string | DescriptiveText;

export interface UseAction {
  targetId?: string;
  number?: number;
  numberAny?: boolean;
  requires?: Condition[];
  response: TextOrDescriptive;
  effects?: Effect[];
}

export interface Item {
  id: string;
  name: string;
  description: TextOrDescriptive;
  examineText: TextOrDescriptive;
  takeable: boolean;
  aliases?: string[];
  location?: string;
  takeWhen?: Condition[];
  takeBlockedText?: string;
  onTake?: Effect[];
  onTakeText?: TextOrDescriptive;
  useActions?: UseAction[];
}

export interface DialogueLine {
  when?: Condition[];
  playerLine: string;
  response: TextOrDescriptive;
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
  targetRoomId: string;
  aliases?: string[];
  locked?: boolean;
  requiredItem?: string;
  description?: string;
  requires?: Condition[];
  blockedMessage?: TextOrDescriptive;
}

export interface Trigger {
  id?: string;
  when: Condition[];
  effects: Effect[];
  message?: TextOrDescriptive;
}

export interface Room {
  id: string;
  name: string;
  description: TextOrDescriptive;
  items: Item[];
  npcs: NPC[];
  exits: Exit[];
  dark?: boolean;
  onEnter?: string;
  triggers?: Trigger[];
}

export interface Hint {
  id: string;
  text: TextOrDescriptive;
  when?: Condition[];
}

export interface GameDefinition {
  id: string;
  name: string;
  version: string;
  description?: string;
  rooms: Room[];
  startingRoom: string;
  initialFlags: Record<string, Scalar>;
  introText: TextOrDescriptive;
  winMessage: TextOrDescriptive;
  hints: Hint[];
  globalTriggers?: Trigger[];
}

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
