import { describe, it, expect, beforeEach } from "vitest";
import { GameEngine } from "../GameEngine";
import {
  sampleGame,
  conditionTestGame,
  npcTestGame,
  containerTestGame,
  priorityTestGame,
  effectsTestGame,
} from "./fixtures/sample-game";

describe("GameEngine", () => {
  describe("initialization", () => {
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

      engine.take("key");
      engine.take("torch");

      const status = engine.getStatus() as { flags: Record<string, boolean> };
      expect(status.flags["PREPARED"]).toBe(true);
    });

    it("should not fire global trigger when conditions not met", () => {
      const engine = new GameEngine(sampleGame);
      engine.startGame();

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

    it("should subtract from numeric value", () => {
      engine.use("Counter");
      engine.use("Counter");
      engine.use("Subtractor");

      const status = engine.getStatus() as { flags: Record<string, number> };
      expect(status.flags["counter_value"]).toBe(1);
    });
  });
});

describe("Once auto-marking", () => {
  it("should show fragment only on first visit via once condition", () => {
    const engine = new GameEngine(sampleGame);
    engine.startGame();

    engine.take("key");
    engine.use("key", "door");
    const firstVisit = engine.go("north");
    expect(firstVisit).toContain("Treasure Room");

    engine.go("south");
    const secondVisit = engine.go("north");
    expect(secondVisit).toContain("Treasure Room");

    const status = engine.getStatus() as { flags: Record<string, boolean> };
    expect(status.flags["VISITED_TREASURE"]).toBe(true);
  });
});

describe("Exit navigation", () => {
  let engine: GameEngine;

  beforeEach(() => {
    engine = new GameEngine(sampleGame);
    engine.startGame();
    engine.take("key");
    engine.use("key", "door");
  });

  it("should navigate via exit alias", () => {
    const result = engine.go("north");
    expect(result).toContain("Treasure Room");
  });

  it("should navigate via room name", () => {
    const result = engine.go("Treasure Room");
    expect(result).toContain("Treasure Room");
  });

  it("should navigate via room id", () => {
    const result = engine.go("treasure");
    expect(result).toContain("Treasure Room");
  });

  it("should be case-insensitive for room name", () => {
    const result = engine.go("TREASURE ROOM");
    expect(result).toContain("Treasure Room");
  });
});

describe("Locked exits with requiredItem", () => {
  it("should block exit when locked without required item", () => {
    const game: typeof sampleGame = {
      ...sampleGame,
      rooms: [
        {
          ...sampleGame.rooms[0],
          exits: [
            {
              targetRoomId: "treasure",
              aliases: ["north"],
              locked: true,
              requiredItem: "key",
              blockedMessage: "The door is locked and needs a key.",
            },
          ],
        },
        sampleGame.rooms[1],
      ],
    };

    const engine = new GameEngine(game);
    engine.startGame();

    const result = engine.go("north");
    expect(result).toContain("locked and needs a key");
  });

  it("should allow exit when player has required item", () => {
    const game: typeof sampleGame = {
      ...sampleGame,
      rooms: [
        {
          ...sampleGame.rooms[0],
          exits: [
            {
              targetRoomId: "treasure",
              aliases: ["north"],
              locked: true,
              requiredItem: "key",
              blockedMessage: "The door is locked and needs a key.",
            },
          ],
        },
        sampleGame.rooms[1],
      ],
    };

    const engine = new GameEngine(game);
    engine.startGame();
    engine.take("key");

    const result = engine.go("north");
    expect(result).toContain("Treasure Room");
  });
});

describe("Fragment groups", () => {
  it("should only show one fragment per group", () => {
    const engine = new GameEngine(sampleGame);
    engine.startGame();

    const result = engine.look();

    const hasLocked = result.includes("heavy wooden door blocks");
    const hasUnlocked = result.includes("door to the north is now unlocked");
    expect(hasLocked !== hasUnlocked).toBe(true);
  });

  it("should switch group fragment based on conditions", () => {
    const engine = new GameEngine(sampleGame);
    engine.startGame();

    const beforeUnlock = engine.look();
    expect(beforeUnlock).toContain("heavy wooden door blocks");

    engine.take("key");
    engine.use("key", "door");

    const afterUnlock = engine.look();
    expect(afterUnlock).toContain("door to the north is now unlocked");
    expect(afterUnlock).not.toContain("heavy wooden door blocks");
  });
});

describe("Fragment priority", () => {
  let engine: GameEngine;

  beforeEach(() => {
    engine = new GameEngine(priorityTestGame);
    engine.startGame();
  });

  it("should only show highest priority fragment", () => {
    const result = engine.look();
    expect(result).toContain("High priority");
    expect(result).not.toContain("Low priority");
  });

  it("should show lower priority when high priority condition fails", () => {
    engine.use("Disabler");
    const result = engine.look();
    expect(result).toContain("Low priority");
    expect(result).not.toContain("High priority");
  });
});

describe("Item containers (location)", () => {
  let engine: GameEngine;

  beforeEach(() => {
    engine = new GameEngine(containerTestGame);
    engine.startGame();
  });

  it("should not show items inside containers in room description", () => {
    const result = engine.look();
    expect(result).toContain("box");
    expect(result).not.toContain("hidden gem");
  });

  it("should allow examining items inside containers", () => {
    const result = engine.look("gem");
    expect(result).toContain("sparkling gem");
  });

  it("should allow taking items from containers after examining", () => {
    engine.examine("box");
    engine.take("gem");
    const inv = engine.inventory();
    expect(inv).toContain("hidden gem");
  });
});

describe("NPC dialogue", () => {
  let engine: GameEngine;

  beforeEach(() => {
    engine = new GameEngine(npcTestGame);
    engine.startGame();
  });

  it("should show NPC in room", () => {
    const result = engine.look();
    expect(result).toContain("Present:");
    expect(result).toContain("Old Wizard");
  });

  it("should describe NPC when looked at", () => {
    const result = engine.look("wizard");
    expect(result).toContain("wise old wizard");
  });

  it("should show dialogue options when talking", () => {
    const result = engine.talk("wizard");
    expect(result).toContain("What would you like to say?");
    expect(result).toContain("Hello, wizard!");
    expect(result).toContain("talk wizard");
  });

  it("should respond to dialogue selection", () => {
    engine.talk("wizard");
    const result = engine.talkOption("wizard", 1);
    expect(result).toContain("Greetings, adventurer!");
  });

  it("should apply dialogue effects", () => {
    engine.talk("wizard");
    engine.talkOption("wizard", 2);

    const status = engine.getStatus() as { flags: Record<string, boolean> };
    expect(status.flags["WIZARD_KNOWLEDGE"]).toBe(true);
  });

  it("should hide dialogue options when conditions not met", () => {
    const result = engine.talk("wizard");
    expect(result).not.toContain("Secret option");
  });

  it("should show conditional dialogue after conditions met", () => {
    engine.talk("wizard");
    engine.talkOption("wizard", 2);

    const result = engine.talk("wizard");
    expect(result).toContain("Secret option");
  });

  it("should return error for invalid dialogue number", () => {
    engine.talk("wizard");
    const result = engine.talkOption("wizard", 99);
    expect(result).toContain("Invalid dialogue option");
  });

  it("should return error when talking to nonexistent NPC", () => {
    const result = engine.talk("dragon");
    expect(result).toContain("no one called");
  });

  it("should handle NPC with no available dialogue", () => {
    engine.talk("wizard");
    engine.talkOption("wizard", 1);

    engine.talk("wizard");
    engine.talkOption("wizard", 1);

    engine.talk("wizard");
    engine.talkOption("wizard", 1);

    const result = engine.talk("wizard");
    expect(result).toContain("nothing more to say");
  });
});

describe("Additional conditions", () => {
  describe("lacks condition", () => {
    it("should pass when player does not have item", () => {
      const engine = new GameEngine(sampleGame);
      engine.startGame();

      const result = engine.hint();
      expect(result).toContain("picking up the key");
    });

    it("should fail when player has item", () => {
      const engine = new GameEngine(sampleGame);
      engine.startGame();
      engine.take("key");

      const result = engine.hint();
      expect(result).not.toContain("picking up the key");
    });
  });

  describe("present/absent conditions", () => {
    let engine: GameEngine;

    beforeEach(() => {
      engine = new GameEngine(containerTestGame);
      engine.startGame();
    });

    it("present should pass when item is in room", () => {
      const result = engine.look();
      expect(result).toContain("The gem is here");
    });

    it("present should fail when item is taken", () => {
      engine.examine("box");
      engine.take("gem");
      const result = engine.look();
      expect(result).not.toContain("The gem is here");
    });

    it("absent should pass when item is not in room", () => {
      engine.examine("box");
      engine.take("gem");
      const result = engine.look();
      expect(result).toContain("The gem is gone");
    });

    it("absent should fail when item is still present", () => {
      const result = engine.look();
      expect(result).not.toContain("The gem is gone");
    });
  });

  describe("is_at condition", () => {
    it("should check if item is at location", () => {
      const engine = new GameEngine(containerTestGame);
      engine.startGame();

      const result = engine.look();
      expect(result).toContain("inside the box");
    });
  });
});

describe("Additional effects", () => {
  let engine: GameEngine;

  beforeEach(() => {
    engine = new GameEngine(effectsTestGame);
    engine.startGame();
  });

  describe("addItem effect", () => {
    it("should add item to inventory", () => {
      engine.use("Summoner");

      const inv = engine.inventory();
      expect(inv).toContain("magic wand");
    });

    it("should mark item as taken", () => {
      engine.use("Summoner");

      const result = engine.look();
      expect(result).not.toContain("magic wand");
    });
  });

  describe("removeItem effect", () => {
    it("should remove item from inventory", () => {
      engine.take("coin");
      expect(engine.inventory()).toContain("gold coin");

      engine.use("coin", "altar");
      expect(engine.inventory()).not.toContain("gold coin");
    });
  });

  describe("consume effect", () => {
    it("should set path to false", () => {
      engine.use("Power Source");

      let status = engine.getStatus() as { flags: Record<string, boolean> };
      expect(status.flags["HAS_POWER"]).toBe(true);

      engine.use("Consumer");

      status = engine.getStatus() as { flags: Record<string, boolean> };
      expect(status.flags["HAS_POWER"]).toBe(false);
    });
  });
});
