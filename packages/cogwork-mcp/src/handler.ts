import type { GameDefinition } from "cogwork";
import type { JsonRpcRequest, JsonRpcResponse, McpServerConfig } from "./types.js";
import { toolDefinitions, executeTool } from "./tools.js";
import { SessionManager } from "./session.js";

const PROTOCOL_VERSION = "2024-11-05";

export class McpHandler {
  private config: McpServerConfig;
  private sessionManager: SessionManager;

  constructor(definition: GameDefinition, config: Partial<McpServerConfig> = {}) {
    this.config = {
      name: config.name ?? "cogwork-game",
      version: config.version ?? "1.0.0",
      storage: config.storage,
      sessionTtlMs: config.sessionTtlMs,
    };
    this.sessionManager = new SessionManager(
      definition,
      this.config.storage,
      this.config.sessionTtlMs,
    );
  }

  async handleRequest(
    request: JsonRpcRequest,
    sessionId: string | undefined,
  ): Promise<{ response: JsonRpcResponse | null; sessionId: string }> {
    const session = await this.sessionManager.getSession(sessionId);

    let response: JsonRpcResponse | null;

    try {
      switch (request.method) {
        case "initialize":
          response = {
            jsonrpc: "2.0",
            id: request.id,
            result: {
              protocolVersion: PROTOCOL_VERSION,
              serverInfo: {
                name: this.config.name,
                version: this.config.version,
              },
              capabilities: {
                tools: {},
                resources: {},
                prompts: {},
              },
            },
          };
          break;

        case "notifications/initialized":
          response = null;
          break;

        case "tools/list":
          response = {
            jsonrpc: "2.0",
            id: request.id,
            result: {
              tools: toolDefinitions,
            },
          };
          break;

        case "tools/call": {
          const { name, arguments: args } = (request.params ?? {}) as {
            name: string;
            arguments?: Record<string, unknown>;
          };

          const { result } = executeTool(session.engine, name, args ?? {});

          await this.sessionManager.saveSession(session.sessionId, session.engine);

          response = {
            jsonrpc: "2.0",
            id: request.id,
            result: {
              content: [
                {
                  type: "text",
                  text: result,
                },
              ],
              isError: false,
            },
          };
          break;
        }

        case "resources/list":
          response = {
            jsonrpc: "2.0",
            id: request.id,
            result: {
              resources: [],
            },
          };
          break;

        case "prompts/list":
          response = {
            jsonrpc: "2.0",
            id: request.id,
            result: {
              prompts: [],
            },
          };
          break;

        case "ping":
          response = {
            jsonrpc: "2.0",
            id: request.id,
            result: {},
          };
          break;

        default:
          response = {
            jsonrpc: "2.0",
            id: request.id,
            error: {
              code: -32601,
              message: `Method not found: ${request.method}`,
            },
          };
      }
    } catch (error) {
      response = {
        jsonrpc: "2.0",
        id: request.id,
        error: {
          code: -32603,
          message: error instanceof Error ? error.message : "Internal error",
          data: error instanceof Error ? error.stack : undefined,
        },
      };
    }

    return { response, sessionId: session.sessionId };
  }

  getSessionManager(): SessionManager {
    return this.sessionManager;
  }
}

export function createMcpHandler(
  definition: GameDefinition,
  config?: Partial<McpServerConfig>,
): McpHandler {
  return new McpHandler(definition, config);
}
