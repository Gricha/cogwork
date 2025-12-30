import { describe, it, expect } from "vitest";
import { SessionManager, generateSessionId } from "../session.js";
import type { GameDefinition } from "cogwork";
import type { SessionStorage } from "../types.js";

const testGame: GameDefinition = {
  id: "test-game",
  name: "Test Game",
  version: "1.0.0",

  rooms: [
    {
      id: "start",
      name: "Starting Room",
      description: "A simple room.",
      items: [],
      npcs: [],
      exits: [],
    },
  ],

  startingRoom: "start",
  initialFlags: {},

  introText: "Welcome!",
  winMessage: "You won!",
  hints: [],
};

describe("generateSessionId", () => {
  it("should generate unique session IDs", () => {
    const id1 = generateSessionId();
    const id2 = generateSessionId();

    expect(id1).not.toBe(id2);
    expect(id1).toMatch(/^session_\d+_[a-z0-9]+$/);
    expect(id2).toMatch(/^session_\d+_[a-z0-9]+$/);
  });
});

describe("SessionManager", () => {
  describe("with memory storage", () => {
    it("should create new session when no sessionId provided", async () => {
      const manager = new SessionManager(testGame);
      const session = await manager.getSession(undefined);

      expect(session.isNew).toBe(true);
      expect(session.sessionId).toBeDefined();
      expect(session.engine).toBeDefined();
    });

    it("should create new session for unknown sessionId", async () => {
      const manager = new SessionManager(testGame);
      const session = await manager.getSession("unknown-session-id");

      expect(session.isNew).toBe(true);
      expect(session.sessionId).toBe("unknown-session-id");
    });

    it("should retrieve existing session after save", async () => {
      const manager = new SessionManager(testGame);
      const session1 = await manager.getSession(undefined);
      session1.engine.startGame();

      await manager.saveSession(session1.sessionId, session1.engine);

      const session2 = await manager.getSession(session1.sessionId);

      expect(session2.isNew).toBe(false);
      expect(session2.sessionId).toBe(session1.sessionId);
    });

    it("should track session count", async () => {
      const manager = new SessionManager(testGame);

      expect(manager.getSessionCount()).toBe(0);

      const session = await manager.getSession(undefined);
      await manager.saveSession(session.sessionId, session.engine);

      expect(manager.getSessionCount()).toBe(1);
    });
  });

  describe("with custom storage", () => {
    it("should use custom storage for get/set", async () => {
      const storage = new Map<string, string>();
      const customStorage: SessionStorage = {
        get: (id) => storage.get(id) ?? null,
        set: (id, data) => {
          storage.set(id, data);
        },
      };

      const manager = new SessionManager(testGame, customStorage);
      const session1 = await manager.getSession(undefined);
      session1.engine.startGame();

      await manager.saveSession(session1.sessionId, session1.engine);

      expect(storage.has(session1.sessionId)).toBe(true);

      const session2 = await manager.getSession(session1.sessionId);
      expect(session2.isNew).toBe(false);
    });

    it("should work with async storage", async () => {
      const storage = new Map<string, string>();
      const asyncStorage: SessionStorage = {
        get: async (id) => storage.get(id) ?? null,
        set: async (id, data) => {
          storage.set(id, data);
        },
      };

      const manager = new SessionManager(testGame, asyncStorage);
      const session1 = await manager.getSession(undefined);
      session1.engine.startGame();

      await manager.saveSession(session1.sessionId, session1.engine);

      const session2 = await manager.getSession(session1.sessionId);
      expect(session2.isNew).toBe(false);
    });
  });
});
