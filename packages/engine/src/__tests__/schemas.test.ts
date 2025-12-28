import { describe, it, expect } from "vitest";
import {
  GameDefinitionSchema,
  ConditionSchema,
  EffectSchema,
  RoomSchema,
  ItemSchema,
} from "../schemas/index";
import { sampleGame } from "./fixtures/sample-game";

describe("Zod Schemas", () => {
  describe("GameDefinitionSchema", () => {
    it("should validate a complete game definition", () => {
      const result = GameDefinitionSchema.safeParse(sampleGame);
      expect(result.success).toBe(true);
    });

    it("should reject missing required fields", () => {
      const result = GameDefinitionSchema.safeParse({
        id: "test",
        name: "Test",
      });
      expect(result.success).toBe(false);
    });

    it("should reject empty rooms array", () => {
      const result = GameDefinitionSchema.safeParse({
        ...sampleGame,
        rooms: [],
      });
      expect(result.success).toBe(false);
    });

    it("should reject invalid startingRoom reference", () => {
      const result = GameDefinitionSchema.safeParse({
        ...sampleGame,
        startingRoom: "nonexistent-room",
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain("nonexistent-room");
      }
    });

    it("should reject invalid exit targetRoomId reference", () => {
      const result = GameDefinitionSchema.safeParse({
        ...sampleGame,
        rooms: [
          {
            id: "room1",
            name: "Room One",
            description: "A room.",
            items: [],
            npcs: [],
            exits: [{ direction: "north", targetRoomId: "nonexistent-room" }],
          },
        ],
        startingRoom: "room1",
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain("nonexistent-room");
      }
    });

    it("should reject invalid exit requiredItem reference", () => {
      const result = GameDefinitionSchema.safeParse({
        ...sampleGame,
        rooms: [
          {
            id: "room1",
            name: "Room One",
            description: "A room.",
            items: [],
            npcs: [],
            exits: [
              {
                direction: "north",
                targetRoomId: "room2",
                requiredItem: "nonexistent-item",
              },
            ],
          },
          {
            id: "room2",
            name: "Room Two",
            description: "Another room.",
            items: [],
            npcs: [],
            exits: [],
          },
        ],
        startingRoom: "room1",
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain("nonexistent-item");
      }
    });

    it("should reject invalid item location reference", () => {
      const result = GameDefinitionSchema.safeParse({
        ...sampleGame,
        rooms: [
          {
            id: "room1",
            name: "Room One",
            description: "A room.",
            items: [
              {
                id: "key",
                name: "key",
                description: "A key.",
                examineText: "A brass key.",
                takeable: true,
                location: "nonexistent-container",
              },
            ],
            npcs: [],
            exits: [],
          },
        ],
        startingRoom: "room1",
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain("nonexistent-container");
      }
    });

    it("should allow item location referencing another item", () => {
      const result = GameDefinitionSchema.safeParse({
        ...sampleGame,
        rooms: [
          {
            id: "room1",
            name: "Room One",
            description: "A room.",
            items: [
              {
                id: "drawer",
                name: "drawer",
                description: "A drawer.",
                examineText: "A wooden drawer.",
                takeable: false,
              },
              {
                id: "key",
                name: "key",
                description: "A key.",
                examineText: "A brass key.",
                takeable: true,
                location: "drawer",
              },
            ],
            npcs: [],
            exits: [],
          },
        ],
        startingRoom: "room1",
      });
      expect(result.success).toBe(true);
    });
  });

  describe("ConditionSchema", () => {
    it("should validate eq condition", () => {
      const result = ConditionSchema.safeParse({ eq: ["path", "value"] });
      expect(result.success).toBe(true);
    });

    it("should validate truthy condition", () => {
      const result = ConditionSchema.safeParse({ truthy: "some.flag" });
      expect(result.success).toBe(true);
    });

    it("should validate has condition", () => {
      const result = ConditionSchema.safeParse({ has: "item-id" });
      expect(result.success).toBe(true);
    });

    it("should validate once condition", () => {
      const result = ConditionSchema.safeParse({ once: "event.something" });
      expect(result.success).toBe(true);
    });

    it("should validate AND combinator", () => {
      const result = ConditionSchema.safeParse({
        and: [{ truthy: "a" }, { truthy: "b" }],
      });
      expect(result.success).toBe(true);
    });

    it("should validate OR combinator", () => {
      const result = ConditionSchema.safeParse({
        or: [{ has: "key" }, { has: "lockpick" }],
      });
      expect(result.success).toBe(true);
    });

    it("should validate NOT combinator", () => {
      const result = ConditionSchema.safeParse({
        not: { truthy: "some.flag" },
      });
      expect(result.success).toBe(true);
    });

    it("should validate nested combinators", () => {
      const result = ConditionSchema.safeParse({
        and: [
          { has: "torch" },
          {
            or: [{ has: "key" }, { truthy: "door_unlocked" }],
          },
        ],
      });
      expect(result.success).toBe(true);
    });

    it("should reject invalid condition", () => {
      const result = ConditionSchema.safeParse({ invalid: "test" });
      expect(result.success).toBe(false);
    });
  });

  describe("EffectSchema", () => {
    it("should validate set effect", () => {
      const result = EffectSchema.safeParse({ set: ["path", "value"] });
      expect(result.success).toBe(true);
    });

    it("should validate set effect with boolean", () => {
      const result = EffectSchema.safeParse({ set: ["path", true] });
      expect(result.success).toBe(true);
    });

    it("should validate set effect with number", () => {
      const result = EffectSchema.safeParse({ set: ["path", 42] });
      expect(result.success).toBe(true);
    });

    it("should validate addItem effect", () => {
      const result = EffectSchema.safeParse({ addItem: "item-id" });
      expect(result.success).toBe(true);
    });

    it("should validate removeItem effect", () => {
      const result = EffectSchema.safeParse({ removeItem: "item-id" });
      expect(result.success).toBe(true);
    });

    it("should validate add effect", () => {
      const result = EffectSchema.safeParse({ add: ["score", 10] });
      expect(result.success).toBe(true);
    });

    it("should validate subtract effect", () => {
      const result = EffectSchema.safeParse({ subtract: ["health", 5] });
      expect(result.success).toBe(true);
    });

    it("should validate consume effect", () => {
      const result = EffectSchema.safeParse({ consume: "event.used" });
      expect(result.success).toBe(true);
    });

    it("should validate markOnce effect", () => {
      const result = EffectSchema.safeParse({ markOnce: "event.seen" });
      expect(result.success).toBe(true);
    });

    it("should reject invalid effect", () => {
      const result = EffectSchema.safeParse({ invalid: "test" });
      expect(result.success).toBe(false);
    });
  });

  describe("RoomSchema", () => {
    it("should validate room with string description", () => {
      const result = RoomSchema.safeParse({
        id: "room1",
        name: "Room One",
        description: "A simple room.",
        items: [],
        npcs: [],
        exits: [],
      });
      expect(result.success).toBe(true);
    });

    it("should validate room with DescriptiveText description", () => {
      const result = RoomSchema.safeParse({
        id: "room1",
        name: "Room One",
        description: {
          id: "room1-desc",
          fragments: [{ say: "A complex room." }],
        },
        items: [],
        npcs: [],
        exits: [],
      });
      expect(result.success).toBe(true);
    });

    it("should validate room with triggers", () => {
      const result = RoomSchema.safeParse({
        id: "room1",
        name: "Room One",
        description: "A room.",
        items: [],
        npcs: [],
        exits: [],
        triggers: [
          {
            when: [{ once: "event.entered" }],
            effects: [{ set: ["visited", true] }],
          },
        ],
      });
      expect(result.success).toBe(true);
    });
  });

  describe("ItemSchema", () => {
    it("should validate simple item", () => {
      const result = ItemSchema.safeParse({
        id: "key",
        name: "brass key",
        description: "A key.",
        examineText: "A brass key.",
        takeable: true,
      });
      expect(result.success).toBe(true);
    });

    it("should validate item with useActions", () => {
      const result = ItemSchema.safeParse({
        id: "key",
        name: "brass key",
        description: "A key.",
        examineText: "A brass key.",
        takeable: true,
        useActions: [
          {
            targetId: "door",
            response: "You unlock the door.",
            effects: [{ set: ["unlocked", true] }],
          },
        ],
      });
      expect(result.success).toBe(true);
    });

    it("should validate item with takeWhen conditions", () => {
      const result = ItemSchema.safeParse({
        id: "sword",
        name: "sword",
        description: "A sword.",
        examineText: "A sharp sword.",
        takeable: true,
        takeWhen: [{ truthy: "strong_enough" }],
        takeBlockedText: "The sword is too heavy.",
      });
      expect(result.success).toBe(true);
    });
  });
});
