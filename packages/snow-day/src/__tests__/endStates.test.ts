import { describe, it, expect, beforeEach } from "vitest";
import { GameEngine } from "text-game-engine";
import { snowDay } from "../game-definition";

describe("Game State", () => {
  let engine: GameEngine;

  beforeEach(() => {
    engine = new GameEngine(snowDay);
  });

  it("should start without a win state", () => {
    engine.startGame();

    expect(engine.hasWon()).toBe(false);
    expect(engine.isGameOver()).toBe(false);
  });

  it("should track visited rooms", () => {
    engine.startGame();
    engine.go("north");
    engine.use("window");
    engine.go("south");
    engine.go("east");

    const serialized = JSON.parse(engine.serialize());
    expect(serialized.visitedRooms).toContain("bedroom");
    expect(serialized.visitedRooms).toContain("entry");
    expect(serialized.visitedRooms).toContain("living-room");
    expect(serialized.visitedRooms).toContain("bedroom");
  });

  it("should persist once flags across serialization", () => {
    engine.startGame();
    engine.go("north");
    engine.look();

    const serialized = engine.serialize();
    const restored = GameEngine.deserialize(snowDay, serialized);

    const firstLook = restored.look();
    expect(firstLook).not.toContain("Entering the room, you are struck");
  });

  it("should update bucket state", () => {
    engine.startGame();
    engine.go("north");
    engine.use("window");
    engine.go("south");
    engine.go("east");

    const before = engine.look();
    expect(before).toContain("overflowing");

    const result = engine.use("bucket");
    expect(result).toContain("umbrellas");

    const after = engine.look();
    expect(after).toContain("now empty");
  });
});
