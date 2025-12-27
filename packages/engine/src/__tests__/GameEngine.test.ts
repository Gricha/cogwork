import { describe, it, expect, beforeEach } from "vitest";
import { GameEngine } from "../GameEngine";
import { sampleGame, conditionTestGame } from "./fixtures/sample-game";

describe("GameEngine", () => {
  describe("initialization", () => {
    it("should create engine with valid game definition", () => {
      const engine = new GameEngine(sampleGame);
      expect(engine).toBeInstanceOf(GameEngine);
    });

    it("should throw on invalid game definition", () => {
      expect(() => {
        new GameEngine({} as any);
      }).toThrow("Invalid game definition");
    });

    it("should throw if starting room does not exist", () => {
      const invalidGame = {
        ...sampleGame,
        startingRoom: "nonexistent",
      };
      expect(() => {
        new GameEngine(invalidGame, { skipValidation: true });
      }).toThrow('Starting room "nonexistent" not found');
    });

    it("should allow skipping validation", () => {
      const engine = new GameEngine(sampleGame, { skipValidation: true });
      expect(engine).toBeInstanceOf(GameEngine);
    });
  });

  describe("startGame", () => {
    it("should return intro text and room description", () => {
      const engine = new GameEngine(sampleGame);
      const result = engine.startGame();

      expect(result).toContain("Welcome to the Test Adventure");
      expect(result).toContain("Starting Room");
      expect(result).toContain("stone walls");
    });
  });

  describe("look", () => {
    let engine: GameEngine;

    beforeEach(() => {
      engine = new GameEngine(sampleGame);
      engine.startGame();
    });

    it("should describe current room when no target", () => {
      const result = engine.look();
      expect(result).toContain("Starting Room");
      expect(result).toContain("stone walls");
    });

    it("should describe item when target is item", () => {
      const result = engine.look("key");
      expect(result).toContain("brass key");
      expect(result).toContain("ornate engravings");
    });

    it("should return error for unknown target", () => {
      const result = engine.look("unicorn");
      expect(result).toContain("don't see any");
    });
  });

  describe("take", () => {
    let engine: GameEngine;

    beforeEach(() => {
      engine = new GameEngine(sampleGame);
      engine.startGame();
    });

    it("should pick up takeable item", () => {
      const result = engine.take("key");
      expect(result).toContain("pick up");
      expect(result).toContain("brass key");
    });

    it("should show item in inventory after taking", () => {
      engine.take("key");
      const inv = engine.inventory();
      expect(inv).toContain("brass key");
    });

    it("should not take non-takeable item", () => {
      const result = engine.take("door");
      expect(result).toContain("can't take");
    });

    it("should return error for unknown item", () => {
      const result = engine.take("diamond");
      expect(result).toContain("don't see any");
    });
  });

  describe("go", () => {
    let engine: GameEngine;

    beforeEach(() => {
      engine = new GameEngine(sampleGame);
      engine.startGame();
    });

    it("should block exit with unmet conditions", () => {
      const result = engine.go("north");
      expect(result).toContain("locked");
    });

    it("should allow exit after conditions met", () => {
      engine.take("key");
      engine.use("key", "door");
      const result = engine.go("north");
      expect(result).toContain("Treasure Room");
    });

    it("should return error for invalid direction", () => {
      const result = engine.go("west");
      expect(result).toContain("can't go");
    });
  });

  describe("use", () => {
    let engine: GameEngine;

    beforeEach(() => {
      engine = new GameEngine(sampleGame);
      engine.startGame();
    });

    it("should execute use action with target", () => {
      engine.take("key");
      const result = engine.use("key", "door");
      expect(result).toContain("unlocks");
    });

    it("should set flags from effects", () => {
      engine.take("key");
      engine.use("key", "door");

      const status = engine.getStatus() as { flags: Record<string, boolean> };
      expect(status.flags["DOOR_UNLOCKED"]).toBe(true);
    });

    it("should return error for invalid use", () => {
      const result = engine.use("key", "torch");
      expect(result).toContain("not sure how to use");
    });
  });

  describe("inventory", () => {
    let engine: GameEngine;

    beforeEach(() => {
      engine = new GameEngine(sampleGame);
      engine.startGame();
    });

    it("should show empty inventory initially", () => {
      const result = engine.inventory();
      expect(result).toContain("not carrying anything");
    });

    it("should show items after taking", () => {
      engine.take("key");
      engine.take("torch");
      const result = engine.inventory();
      expect(result).toContain("brass key");
      expect(result).toContain("torch");
    });
  });

  describe("hint", () => {
    let engine: GameEngine;

    beforeEach(() => {
      engine = new GameEngine(sampleGame);
      engine.startGame();
    });

    it("should return appropriate hint based on game state", () => {
      const result = engine.hint();
      expect(result).toContain("picking up the key");
    });

    it("should update hint as game progresses", () => {
      engine.take("key");
      const result = engine.hint();
      expect(result).toContain("using the key on the door");
    });
  });

  describe("win condition", () => {
    let engine: GameEngine;

    beforeEach(() => {
      engine = new GameEngine(sampleGame);
      engine.startGame();
    });

    it("should detect win state", () => {
      engine.take("key");
      engine.use("key", "door");
      engine.go("north");
      engine.take("gold");

      expect(engine.hasWon()).toBe(true);
      expect(engine.isGameOver()).toBe(true);
    });

    it("should show win message after winning", () => {
      engine.take("key");
      engine.use("key", "door");
      engine.go("north");
      const result = engine.take("gold");

      expect(result).toContain("You win");
    });
  });

  describe("serialization", () => {
    it("should serialize and deserialize game state", () => {
      const engine = new GameEngine(sampleGame);
      engine.startGame();
      engine.take("key");

      const serialized = engine.serialize();
      const restored = GameEngine.deserialize(sampleGame, serialized);

      expect(restored.inventory()).toContain("brass key");
    });

    it("should preserve flags after deserialization", () => {
      const engine = new GameEngine(sampleGame);
      engine.startGame();
      engine.take("key");
      engine.use("key", "door");

      const serialized = engine.serialize();
      const restored = GameEngine.deserialize(sampleGame, serialized);

      const status = restored.getStatus() as { flags: Record<string, boolean> };
      expect(status.flags["DOOR_UNLOCKED"]).toBe(true);
    });
  });

  describe("global triggers", () => {
    it("should fire global trigger when conditions met", () => {
      const engine = new GameEngine(sampleGame);
      engine.startGame();

      // Take both key and torch to trigger PREPARED flag
      engine.take("key");
      engine.take("torch");

      const status = engine.getStatus() as { flags: Record<string, boolean> };
      expect(status.flags["PREPARED"]).toBe(true);
    });

    it("should not fire global trigger when conditions not met", () => {
      const engine = new GameEngine(sampleGame);
      engine.startGame();

      // Only take key
      engine.take("key");

      const status = engine.getStatus() as { flags: Record<string, boolean> };
      expect(status.flags["PREPARED"]).toBeUndefined();
    });
  });
});

describe("Condition Combinators", () => {
  let engine: GameEngine;

  beforeEach(() => {
    engine = new GameEngine(conditionTestGame);
    engine.startGame();
  });

  describe("OR conditions", () => {
    it("should pass when first condition passes", () => {
      engine.take("Item A");
      const result = engine.look();
      expect(result).toContain("either item A or item B");
    });

    it("should pass when second condition passes", () => {
      engine.take("Item B");
      const result = engine.look();
      expect(result).toContain("either item A or item B");
    });

    it("should fail when no condition passes", () => {
      const result = engine.look();
      expect(result).toContain("neither item A nor item B");
    });
  });

  describe("AND conditions", () => {
    it("should pass when all conditions pass", () => {
      engine.take("Item A");
      engine.take("Item B");
      const result = engine.look();
      expect(result).toContain("both items");
    });

    it("should fail when not all conditions pass", () => {
      engine.take("Item A");
      const result = engine.look();
      expect(result).not.toContain("both items");
    });
  });

  describe("NOT conditions", () => {
    it("should pass when inner condition fails", () => {
      const result = engine.look();
      expect(result).toContain("Flag X is not set");
    });

    it("should fail when inner condition passes", () => {
      engine.take("Flag Setter");
      engine.use("Flag Setter");
      const result = engine.look();
      expect(result).toContain("Flag X is set");
      expect(result).not.toContain("Flag X is not set");
    });
  });

  describe("turnCount conditions", () => {
    it("should track turn count", () => {
      // Do 6 actions to get past 5 turns
      engine.look();
      engine.look();
      engine.look();
      engine.look();
      engine.look();
      const result = engine.look();
      expect(result).toContain("More than 5 turns");
    });

    it("should not match before threshold", () => {
      const result = engine.look();
      expect(result).not.toContain("More than 5 turns");
    });
  });

  describe("add/subtract effects", () => {
    it("should add to numeric value", () => {
      engine.use("Counter");
      engine.use("Counter");
      engine.use("Counter");

      const status = engine.getStatus() as { flags: Record<string, number> };
      expect(status.flags["counter_value"]).toBe(3);
    });
  });
});
