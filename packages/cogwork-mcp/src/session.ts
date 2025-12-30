import { GameEngine } from "cogwork";
import type { GameDefinition } from "cogwork";
import type { Session, SessionStorage } from "./types.js";

const DEFAULT_TTL_MS = 7 * 24 * 60 * 60 * 1000;

export function generateSessionId(): string {
  return `session_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
}

export class SessionManager {
  private definition: GameDefinition;
  private storage: SessionStorage | null;
  private memoryFallback: Map<string, { engine: GameEngine; lastAccess: number }>;
  private ttlMs: number;

  constructor(
    definition: GameDefinition,
    storage?: SessionStorage,
    ttlMs: number = DEFAULT_TTL_MS,
  ) {
    this.definition = definition;
    this.storage = storage ?? null;
    this.memoryFallback = new Map();
    this.ttlMs = ttlMs;
  }

  async getSession(sessionId: string | undefined): Promise<Session> {
    if (this.storage) {
      return this.getSessionFromStorage(sessionId);
    }
    return this.getSessionFromMemory(sessionId);
  }

  async saveSession(sessionId: string, engine: GameEngine): Promise<void> {
    if (this.storage) {
      await this.storage.set(sessionId, engine.serialize());
    } else {
      this.memoryFallback.set(sessionId, { engine, lastAccess: Date.now() });
    }
  }

  private async getSessionFromStorage(sessionId: string | undefined): Promise<Session> {
    if (sessionId) {
      const data = await this.storage!.get(sessionId);
      if (data) {
        const engine = GameEngine.deserialize(this.definition, data);
        return { sessionId, engine, isNew: false };
      }
    }

    const newSessionId = sessionId ?? generateSessionId();
    const engine = new GameEngine(this.definition);
    return { sessionId: newSessionId, engine, isNew: true };
  }

  private getSessionFromMemory(sessionId: string | undefined): Session {
    this.cleanupMemory();

    if (sessionId && this.memoryFallback.has(sessionId)) {
      const session = this.memoryFallback.get(sessionId)!;
      session.lastAccess = Date.now();
      return { sessionId, engine: session.engine, isNew: false };
    }

    const newSessionId = sessionId ?? generateSessionId();
    const engine = new GameEngine(this.definition);
    return { sessionId: newSessionId, engine, isNew: true };
  }

  private cleanupMemory(): void {
    const now = Date.now();
    for (const [id, session] of this.memoryFallback.entries()) {
      if (now - session.lastAccess > this.ttlMs) {
        this.memoryFallback.delete(id);
      }
    }
  }

  getSessionCount(): number {
    return this.memoryFallback.size;
  }
}
