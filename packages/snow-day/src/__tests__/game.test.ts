import { describe, it, expect, beforeEach } from "vitest";
import { GameEngine } from "cogwork";
import { snowDay } from "../game-definition";

describe("GameEngine - Core Loop", () => {
  let engine: GameEngine;
  const reachLivingRoom = () => {
    engine.go("north");
    engine.use("window");
    engine.go("south");
  };

  beforeEach(() => {
    engine = new GameEngine(snowDay);
  });

  describe("start_game", () => {
    it("should initialize the game and show intro", () => {
      const result = engine.startGame();

      expect(result).toContain("Welcome to the text-based holiday adventure.");
      expect(result).toContain("Snow fell thick before the dawn,");
      expect(result).toContain("Bedroom");
    });

    it("should start player in bedroom", () => {
      engine.startGame();
      const status = engine.getStatus() as { roomId: string };

      expect(status.roomId).toBe("bedroom");
    });
  });

  describe("look", () => {
    beforeEach(() => {
      engine.startGame();
    });

    it("should describe current room when no target specified", () => {
      const result = engine.look();

      expect(result).toContain("Bedroom");
      expect(result).toContain("window");
    });

    it("should describe specific item when target specified", () => {
      reachLivingRoom();
      const result = engine.look("TV");

      expect(result).toContain("TV");
      expect(result).toContain("off");
    });

    it("should return error for non-existent target", () => {
      const result = engine.look("unicorn");

      expect(result).toContain("don't see");
    });

    it("should not list items hidden in containers", () => {
      engine.go("north");
      const result = engine.look();

      expect(result).toContain("Bedroom");
      expect(result).not.toContain("Z-Boy");
    });
  });

  describe("hint", () => {
    beforeEach(() => {
      engine.startGame();
    });

    it("should suggest starting at the window", () => {
      const hint = engine.hint();
      expect(hint).toContain("window");
    });

    it("should advance hints as progress is made", () => {
      engine.use("window");
      const afterWindow = engine.hint();
      expect(afterWindow).toContain("handheld");

      engine.take("Z-Boy");
      engine.use("Z-Boy");
      const afterBatteries = engine.hint();
      expect(afterBatteries).toContain("remote");

      engine.go("south");
      engine.take("remote");
      engine.use("batteries", "remote");
      const afterRemote = engine.hint();
      expect(afterRemote).toContain("corkboard");
    });
  });

  describe("go", () => {
    beforeEach(() => {
      engine.startGame();
    });

    it("should move player to valid direction", () => {
      engine.use("window");
      const result = engine.go("south");

      expect(result).toContain("Living Room");

      const status = engine.getStatus() as { roomId: string };
      expect(status.roomId).toBe("living-room");
    });

    it("should move player by adjacent room name", () => {
      engine.use("window");
      const result = engine.go("living room");

      expect(result).toContain("Living Room");
      expect((engine.getStatus() as { roomId: string }).roomId).toBe("living-room");
    });

    it("should return error for invalid direction", () => {
      const result = engine.go("up");

      expect(result).toContain("can't go");
    });

    it("should block entry to outside before school closure", () => {
      engine.use("window");
      engine.go("south");
      engine.go("east");
      const result = engine.go("east");

      expect(result).toContain("aren't quite ready");
      expect((engine.getStatus() as { roomId: string }).roomId).toBe("entry");
    });
  });

  describe("take", () => {
    beforeEach(() => {
      engine.startGame();
    });

    it("should pick up takeable item", () => {
      reachLivingRoom();
      const result = engine.take("remote");

      expect(result).toContain("pick up");
      expect(result).toContain("TV remote");
    });

    it("should add item to inventory", () => {
      reachLivingRoom();
      engine.take("remote");
      const status = engine.getStatus() as { inventory: string[] };

      expect(status.inventory).toContain("TV remote");
    });

    it("should return error for non-existent item", () => {
      const result = engine.take("golden key");

      expect(result).toContain("don't see");
    });
  });

  describe("inventory", () => {
    beforeEach(() => {
      engine.startGame();
    });

    it("should show empty inventory at start", () => {
      const result = engine.inventory();

      expect(result).toContain("not carrying anything");
    });

    it("should list items after picking them up", () => {
      reachLivingRoom();
      engine.take("remote");
      const result = engine.inventory();

      expect(result).toContain("TV remote");
    });
  });

  describe("examine", () => {
    beforeEach(() => {
      engine.startGame();
      engine.go("north");
    });

    it("should show detailed description of room item", () => {
      const result = engine.examine("desk");

      expect(result).toContain("desk surface");
    });

    it("should reveal drawer contents before taking item", () => {
      const result = engine.examine("right drawer");

      expect(result).toContain("Z-Boy");
    });

    it("should hide drawer contents after taking item", () => {
      engine.take("Z-Boy");
      const result = engine.examine("right drawer");

      expect(result).not.toContain("Z-Boy");
    });
  });

  describe("talk", () => {
    beforeEach(() => {
      engine.startGame();
      reachLivingRoom();
      engine.go("west");
    });

    it("should show dialogue options for NPC", () => {
      const result = engine.talk("parent");

      expect(result).toContain("Parent");
      expect(result).toContain("What would you like to say");
      expect(result).toContain("1.");
    });

    it("should return error for non-existent NPC", () => {
      const result = engine.talk("santa");

      expect(result).toContain("no one called");
    });
  });

  describe("use", () => {
    beforeEach(() => {
      engine.startGame();
    });

    it("should set snowing flag after scraping window", () => {
      engine.go("north");

      const before = engine.look();
      expect(before).toContain("sheet of white hoarfrost");

      const useResult = engine.use("window");
      expect(useResult).toContain("scrape");

      const after = engine.look();
      expect(after).toContain("Thick, heavy flakes of snow");
    });

    it("should allow scraping the window with the scarf and dry it on the mantle", () => {
      engine.go("north");
      engine.take("scarf");

      const scrapeResult = engine.use("scarf", "window");
      expect(scrapeResult).toContain("damp");

      const statusAfterScrape = engine.getStatus() as { flags: Record<string, boolean> };
      expect(statusAfterScrape.flags.IS_SNOWING).toBe(true);
      expect(statusAfterScrape.flags.SCARF_DAMP).toBe(true);

      const wearDamp = engine.use("scarf");
      expect(wearDamp).toContain("damp");

      engine.go("south");
      const dryResult = engine.use("scarf", "mantle");
      expect(dryResult).toContain("mantle");

      const wearResult = engine.use("scarf");
      expect(wearResult).toContain("scarf");

      const finalStatus = engine.getStatus() as { flags: Record<string, boolean> };
      expect(finalStatus.flags.GEAR_SCARF).toBe(true);
    });

    it("should power the remote and set school closed", () => {
      reachLivingRoom();
      engine.take("remote");
      engine.go("north");
      engine.take("Z-Boy");

      const extractResult = engine.use("Z-Boy");
      expect(extractResult).toContain("batteries");

      const powerResult = engine.use("batteries", "remote");
      expect(powerResult).toContain("remote");

      engine.go("south");
      const tvResult = engine.use("remote", "TV", 42);
      expect(tvResult).toContain("Channel 42");

      const status = engine.getStatus() as { flags: Record<string, string> };
      expect(status.flags.SCHOOL_CLOSED).toBe(true);
    });

    it("should prompt for a channel before tuning the TV", () => {
      reachLivingRoom();
      engine.take("remote");
      engine.go("north");
      engine.take("Z-Boy");
      engine.use("Z-Boy");
      engine.use("batteries", "remote");

      engine.go("south");
      const tvResult = engine.use("remote", "TV");
      expect(tvResult).toContain("Which channel");
    });

    it("should allow powering the remote by using it on the batteries", () => {
      reachLivingRoom();
      engine.take("remote");
      engine.go("north");
      engine.take("Z-Boy");
      engine.use("Z-Boy");
      engine.use("remote", "batteries");

      const status = engine.getStatus() as { flags: Record<string, boolean> };
      expect(status.flags.REMOTE_POWERED).toBe(true);
    });

    it("should allow using the Z-Boy directly on the remote", () => {
      reachLivingRoom();
      engine.take("remote");
      engine.go("north");
      engine.take("Z-Boy");

      const powerResult = engine.use("Z-Boy", "remote");
      expect(powerResult).toContain("remote");

      engine.go("south");
      const tvResult = engine.use("remote", "TV", 42);
      expect(tvResult).toContain("Channel 42");
    });

    it("should hint about the remote when using the TV directly", () => {
      reachLivingRoom();

      const tvResult = engine.use("TV");
      expect(tvResult).toContain("remote");
    });

    it("should allow using the TV directly once the remote is powered", () => {
      reachLivingRoom();
      engine.take("remote");
      engine.go("north");
      engine.take("Z-Boy");
      engine.use("Z-Boy");
      engine.use("batteries", "remote");

      engine.go("south");
      const tvResult = engine.use("TV", undefined, 42);
      expect(tvResult).toContain("Channel 42");
    });

    it("should update breakfast state", () => {
      reachLivingRoom();
      engine.go("west");

      const before = engine.look();
      expect(before).toContain("steaming plate of breakfast");

      const result = engine.use("breakfast");
      expect(result).toContain("eat");

      const after = engine.look();
      expect(after).toContain("empty plate");
    });

    it("should require breakfast before going outside", () => {
      engine.go("north");
      engine.use("window");
      engine.take("Z-Boy");
      engine.go("south");
      engine.take("remote");
      engine.use("Z-Boy");
      engine.use("batteries", "remote");
      engine.use("remote", "TV", 42);

      engine.go("west");
      engine.take("carrot");

      engine.go("east");
      engine.go("north");
      engine.take("scarf");
      engine.use("scarf");
      engine.take("winter coat");
      engine.go("south");
      engine.use("winter coat");
      engine.go("east");
      engine.take("beanie");
      engine.use("beanie");
      engine.go("west");
      engine.go("east");
      engine.take("mittens");
      engine.go("west");
      engine.use("mittens", "mantle");
      engine.use("mittens");

      engine.go("east");
      engine.go("east");
      const blocked = engine.go("east");
      expect(blocked).toContain("breakfast");

      engine.go("west");
      engine.go("west");
      engine.go("west");
      engine.use("breakfast");
      engine.go("east");
      engine.go("east");
      engine.go("east");
      engine.use("snowman");
      const result = engine.use("carrot", "snowman");
      expect(result).toContain("snowman");
    });

    it("should allow taking coal before school closure", () => {
      reachLivingRoom();

      const result = engine.take("coal");
      expect(result).toContain("pick up");
    });

    it("should wear the beanie", () => {
      reachLivingRoom();
      engine.go("east");
      engine.take("beanie");

      const wearResult = engine.use("beanie");
      expect(wearResult).toContain("beanie");
    });

    it("should require gear before going outside", () => {
      engine.go("north");
      engine.use("window");
      engine.take("Z-Boy");
      engine.go("south");
      engine.take("remote");
      engine.use("Z-Boy");
      engine.use("batteries", "remote");
      engine.use("remote", "TV", 42);
      engine.go("east");

      const blocked = engine.go("east");
      expect(blocked).toContain("aren't quite ready");
    });
  });

  describe("turn counter", () => {
    beforeEach(() => {
      engine.startGame();
    });

    it("should increment turns with each action", () => {
      const status1 = engine.getStatus() as { turns: number };
      const initialTurns = status1.turns;

      engine.look();
      const status2 = engine.getStatus() as { turns: number };

      expect(status2.turns).toBe(initialTurns + 1);
    });
  });
});
