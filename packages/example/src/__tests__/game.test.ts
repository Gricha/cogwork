import { describe, it, expect, beforeEach } from "vitest";
import { GameEngine } from "cogwork";
import { dungeonEscape } from "../game-definition";

describe("Dungeon Escape Game", () => {
  let engine: GameEngine;

  beforeEach(() => {
    engine = new GameEngine(dungeonEscape);
    engine.startGame();
  });

  it("should start in the prison cell", () => {
    const result = engine.look();
    expect(result).toContain("Prison Cell");
    expect(result).toContain("cold, damp");
  });

  it("should find the key behind the loose stone", () => {
    engine.use("loose stone");
    const inv = engine.inventory();
    expect(inv).toContain("rusty key");
  });

  it("should unlock the cell with the key", () => {
    engine.use("stone");
    engine.use("key", "door");
    const result = engine.look();
    expect(result).toContain("open");
  });

  it("should complete the game", () => {
    engine.use("stone");
    engine.use("key", "cell door");
    engine.go("north");
    engine.take("coin");
    engine.use("coin");
    engine.go("north");
    engine.use("exit door");
    const result = engine.use("outside");

    expect(result).toContain("escaped");
    expect(engine.hasWon()).toBe(true);
    expect(engine.isGameOver()).toBe(true);
  });

  it("should block exit when guard is not distracted", () => {
    engine.use("stone");
    engine.use("key", "door");
    engine.go("north");
    const result = engine.go("north");
    expect(result).toContain("guard");
  });

  it("should provide hints based on game state", () => {
    const hint1 = engine.hint();
    expect(hint1).toContain("loose");

    engine.use("stone");
    const hint2 = engine.hint();
    expect(hint2).toContain("key");
  });

  describe("global triggers", () => {
    it("should set ESCAPE_READY when conditions are met", () => {
      engine.use("stone");
      engine.use("key", "door");
      engine.go("north");
      engine.take("coin");
      engine.use("coin");

      const status = engine.getStatus() as { flags: Record<string, boolean> };
      expect(status.flags["ESCAPE_READY"]).toBe(true);
    });
  });

  describe("OR conditions", () => {
    it("should allow exit when guard is distracted OR gone", () => {
      engine.use("stone");
      engine.use("key", "door");
      engine.go("north");
      engine.take("coin");
      engine.use("coin");

      const result = engine.go("north");
      expect(result).toContain("Dungeon Exit");
    });
  });
});
