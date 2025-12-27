import { describe, it, expect, beforeEach } from "vitest";
import { GameEngine } from "text-game-engine";
import { snowDay } from "../game-definition";

describe("Snow Day Walkthrough", () => {
  let engine: GameEngine;

  beforeEach(() => {
    engine = new GameEngine(snowDay);
  });

  it("should block the outside path until gear is ready", () => {
    const intro = engine.startGame();
    expect(intro).toContain("Bedroom");

    // Go to bedroom and confirm snow
    engine.go("north"); // bedroom
    engine.use("window");

    // Grab the Z-Boy for batteries
    engine.take("Z-Boy");

    // Power the remote and turn on the TV
    engine.go("south"); // living room
    engine.take("remote");
    engine.use("Z-Boy");
    engine.use("batteries", "remote");
    const tvResult = engine.use("remote", "TV", 42);
    expect(tvResult).toContain("Channel 42");

    // Exit should still be blocked without gear
    engine.go("east"); // entry
    const blocked = engine.go("east");
    expect(blocked).toContain("aren't quite ready");
  });

  it("should build the snowman with the required items", () => {
    engine.startGame();

    // Confirm snow day and power TV
    engine.go("north"); // bedroom
    engine.use("window");
    engine.take("Z-Boy");
    engine.go("south"); // living room
    engine.take("remote");
    engine.use("Z-Boy");
    engine.use("batteries", "remote");
    engine.use("remote", "TV", 42);

    // Eat breakfast and take carrot
    engine.go("west"); // kitchen
    engine.use("breakfast");
    engine.take("carrot");

    // Take coal
    engine.go("east"); // living room
    engine.take("coal");

    // Dry and wear gear
    engine.go("north"); // bedroom
    engine.take("scarf");
    engine.use("scarf");
    engine.take("winter coat");
    engine.use("winter coat");
    engine.go("south"); // living room
    engine.go("east"); // entry
    engine.take("beanie");
    engine.use("beanie");
    engine.go("west"); // living room
    engine.go("east"); // entry
    engine.take("mittens");
    engine.go("west"); // living room
    engine.use("mittens", "mantle");
    engine.use("mittens");

    engine.go("east"); // entry

    // Get bucket and empty it
    engine.take("bucket");
    engine.use("bucket");

    const gearStatus = engine.getStatus() as { flags: Record<string, boolean> };
    expect(gearStatus.flags.GEAR_BEANIE).toBe(true);
    expect(gearStatus.flags.GEAR_MITTENS).toBe(true);
    expect(gearStatus.flags.GEAR_COAT).toBe(true);
    expect(gearStatus.flags.GEAR_SCARF).toBe(true);
    expect(gearStatus.flags.GEAR_OUTSIDE_READY).toBe(true);

    // Build snowman
    engine.go("east"); // outside
    engine.use("snowman");
    engine.use("carrot", "snowman");
    engine.use("coal", "snowman");
    engine.use("bucket", "snowman");

    const outsideLook = engine.look();
    expect(outsideLook).toContain("CONGRATULATIONS");

    const status = engine.getStatus() as { flags: Record<string, string> };
    expect(status.flags.snowman_state).toBe("FINISHED");
    expect(status.flags.SNOW_DAY_COMPLETE).toBe(true);
    expect((engine.getStatus() as { won: boolean }).won).toBe(true);

    const examineResult = engine.examine("snowman");
    expect(examineResult).toContain("CONGRATULATIONS");
  });

  it("should persist flags and inventory through serialization", () => {
    engine.startGame();
    engine.go("north");
    engine.use("window");
    engine.take("Z-Boy");

    const serialized = engine.serialize();
    const restored = GameEngine.deserialize(snowDay, serialized);

    const status = restored.getStatus() as { flags: Record<string, string>; inventory: string[] };
    expect(status.flags.IS_SNOWING).toBe(true);
    expect(status.inventory).toContain("Z-Boy");
  });
});
