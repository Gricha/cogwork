import { z } from "zod";
import { ScalarSchema, DirectionSchema } from "./primitives";
import { ConditionSchema } from "./conditions";
import { EffectSchema } from "./effects";

export const DescriptionFragmentSchema = z.object({
  say: z.string(),
  when: z.array(ConditionSchema).optional(),
  priority: z.number().optional(),
  group: z.string().optional(),
  effects: z.array(EffectSchema).optional(),
});

export const DescriptiveTextSchema = z.object({
  id: z.string(),
  fragments: z.array(DescriptionFragmentSchema),
  objectFragments: z.record(z.array(DescriptionFragmentSchema)).optional(),
});

export const TextOrDescriptiveSchema = z.union([z.string(), DescriptiveTextSchema]);

export const TriggerSchema = z.object({
  id: z.string().optional(),
  when: z.array(ConditionSchema),
  effects: z.array(EffectSchema),
  message: TextOrDescriptiveSchema.optional(),
});

export const UseActionSchema = z.object({
  targetId: z.string().optional(),
  number: z.number().optional(),
  numberAny: z.boolean().optional(),
  requires: z.array(ConditionSchema).optional(),
  response: TextOrDescriptiveSchema,
  effects: z.array(EffectSchema).optional(),
});

export const ItemSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: TextOrDescriptiveSchema,
  examineText: TextOrDescriptiveSchema,
  takeable: z.boolean(),
  aliases: z.array(z.string()).optional(),
  location: z.string().optional(),
  takeWhen: z.array(ConditionSchema).optional(),
  takeBlockedText: z.string().optional(),
  onTake: z.array(EffectSchema).optional(),
  onTakeText: TextOrDescriptiveSchema.optional(),
  useActions: z.array(UseActionSchema).optional(),
});

export const DialogueLineSchema = z.object({
  when: z.array(ConditionSchema).optional(),
  playerLine: z.string(),
  response: TextOrDescriptiveSchema,
  effects: z.array(EffectSchema).optional(),
});

export const NPCSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  dialogue: z.array(DialogueLineSchema),
  aliases: z.array(z.string()).optional(),
});

export const ExitSchema = z.object({
  direction: DirectionSchema,
  targetRoomId: z.string(),
  locked: z.boolean().optional(),
  requiredItem: z.string().optional(),
  description: z.string().optional(),
  requires: z.array(ConditionSchema).optional(),
  blockedMessage: TextOrDescriptiveSchema.optional(),
});

export const RoomSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: TextOrDescriptiveSchema,
  items: z.array(ItemSchema),
  npcs: z.array(NPCSchema),
  exits: z.array(ExitSchema),
  dark: z.boolean().optional(),
  onEnter: z.string().optional(),
  triggers: z.array(TriggerSchema).optional(),
});

export const HintSchema = z.object({
  id: z.string(),
  text: TextOrDescriptiveSchema,
  when: z.array(ConditionSchema).optional(),
});

const GameDefinitionBaseSchema = z.object({
  id: z.string(),
  name: z.string(),
  version: z.string(),
  description: z.string().optional(),

  rooms: z.array(RoomSchema).min(1),
  startingRoom: z.string(),
  initialFlags: z.record(ScalarSchema),

  introText: TextOrDescriptiveSchema,
  winMessage: TextOrDescriptiveSchema,
  hints: z.array(HintSchema),

  globalTriggers: z.array(TriggerSchema).optional(),
});

export const GameDefinitionSchema = GameDefinitionBaseSchema.superRefine((data, ctx) => {
  const roomIds = new Set(data.rooms.map((r) => r.id));
  const allItemIds = new Set(data.rooms.flatMap((r) => r.items.map((i) => i.id)));

  if (!roomIds.has(data.startingRoom)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: `startingRoom "${data.startingRoom}" does not exist`,
      path: ["startingRoom"],
    });
  }

  for (const [roomIdx, room] of data.rooms.entries()) {
    for (const [exitIdx, exit] of room.exits.entries()) {
      if (!roomIds.has(exit.targetRoomId)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `exit targetRoomId "${exit.targetRoomId}" does not exist`,
          path: ["rooms", roomIdx, "exits", exitIdx, "targetRoomId"],
        });
      }
      if (exit.requiredItem && !allItemIds.has(exit.requiredItem)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `exit requiredItem "${exit.requiredItem}" does not exist`,
          path: ["rooms", roomIdx, "exits", exitIdx, "requiredItem"],
        });
      }
    }
    for (const [itemIdx, item] of room.items.entries()) {
      if (item.location && !roomIds.has(item.location) && !allItemIds.has(item.location)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `item location "${item.location}" does not exist`,
          path: ["rooms", roomIdx, "items", itemIdx, "location"],
        });
      }
    }
  }
});

export const GameStateSchema = z.object({
  currentRoomId: z.string(),
  inventoryIds: z.array(z.string()),
  takenItemIds: z.array(z.string()),
  flags: z.record(ScalarSchema),
  visitedRooms: z.array(z.string()),
  gameOver: z.boolean(),
  won: z.boolean(),
  turnCount: z.number(),
  once: z.array(z.string()),
});
