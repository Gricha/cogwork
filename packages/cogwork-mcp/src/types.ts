import type { GameEngine } from "cogwork";

export interface JsonRpcRequest {
  jsonrpc: "2.0";
  id?: string | number;
  method: string;
  params?: Record<string, unknown>;
}

export interface JsonRpcResponse {
  jsonrpc: "2.0";
  id?: string | number;
  result?: unknown;
  error?: {
    code: number;
    message: string;
    data?: unknown;
  };
}

export interface Session {
  sessionId: string;
  engine: GameEngine;
  isNew: boolean;
}

export interface SessionStorage {
  get(sessionId: string): Promise<string | null> | string | null;
  set(sessionId: string, data: string): Promise<void> | void;
  delete?(sessionId: string): Promise<void> | void;
}

export interface McpServerConfig {
  name: string;
  version: string;
  storage?: SessionStorage;
  sessionTtlMs?: number;
}

export interface ToolDefinition {
  name: string;
  description: string;
  inputSchema: {
    type: "object";
    properties: Record<string, { type: string; description: string }>;
    required: string[];
  };
}
