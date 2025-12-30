import { describe, it, expect } from "vitest";
import { createMcpHandler } from "../handler.js";
import type { GameDefinition } from "cogwork";

const testGame: GameDefinition = {
  id: "test-game",
  name: "Test Game",
  version: "1.0.0",

  rooms: [
    {
      id: "start",
      name: "Starting Room",
      description: "You are in a simple room.",
      items: [
        {
          id: "key",
          name: "brass key",
          description: "A small brass key.",
          examineText: "The key has ornate engravings.",
          takeable: true,
          aliases: ["key"],
        },
        {
          id: "door",
          name: "wooden door",
          description: "A heavy wooden door.",
          examineText: {
            fragments: [
              {
                say: "The door is locked.",
                when: [{ falsy: "DOOR_UNLOCKED" }],
              },
              {
                say: "The door is unlocked.",
                when: [{ truthy: "DOOR_UNLOCKED" }],
              },
            ],
          },
          takeable: false,
          aliases: ["door"],
          useActions: [
            {
              targetId: "key",
              response: "You unlock the door!",
              effects: [{ set: ["DOOR_UNLOCKED", true] }],
            },
          ],
        },
      ],
      npcs: [
        {
          id: "guard",
          name: "Guard",
          description: "A sleepy guard.",
          aliases: ["guard"],
          dialogue: [
            {
              playerLine: "Hello",
              response: "Zzz...",
            },
          ],
        },
      ],
      exits: [
        {
          targetRoomId: "end",
          aliases: ["north"],
          requires: [{ truthy: "DOOR_UNLOCKED" }],
          blockedMessage: "The door is locked.",
        },
      ],
    },
    {
      id: "end",
      name: "End Room",
      description: "You made it!",
      items: [
        {
          id: "treasure",
          name: "treasure",
          description: "A pile of gold.",
          examineText: "So shiny!",
          takeable: true,
          onTake: [{ set: ["won", true] }, { set: ["gameOver", true] }],
          onTakeText: "You win!",
        },
      ],
      npcs: [],
      exits: [{ targetRoomId: "start", aliases: ["south"] }],
    },
  ],

  startingRoom: "start",
  initialFlags: {
    DOOR_UNLOCKED: false,
  },

  introText: "Welcome to the test game!",
  winMessage: "You won in {turns} turns!",
  hints: [
    {
      id: "hint-key",
      text: "Try picking up the key.",
      when: [{ lacks: "key" }],
    },
  ],
};

describe("McpHandler", () => {
  describe("initialize", () => {
    it("should return protocol version and server info", async () => {
      const handler = createMcpHandler(testGame, { name: "test-server", version: "1.0.0" });
      const { response } = await handler.handleRequest(
        { jsonrpc: "2.0", id: 1, method: "initialize", params: {} },
        undefined,
      );

      expect(response).not.toBeNull();
      expect(response!.result).toBeDefined();
      const result = response!.result as {
        protocolVersion: string;
        serverInfo: { name: string; version: string };
      };
      expect(result.protocolVersion).toBe("2024-11-05");
      expect(result.serverInfo.name).toBe("test-server");
      expect(result.serverInfo.version).toBe("1.0.0");
    });

    it("should return capabilities with tools", async () => {
      const handler = createMcpHandler(testGame);
      const { response } = await handler.handleRequest(
        { jsonrpc: "2.0", id: 1, method: "initialize", params: {} },
        undefined,
      );

      expect(response).not.toBeNull();
      const result = response!.result as { capabilities: { tools: object } };
      expect(result.capabilities.tools).toBeDefined();
    });
  });

  describe("tools/list", () => {
    it("should return all game tools", async () => {
      const handler = createMcpHandler(testGame);
      const { response } = await handler.handleRequest(
        { jsonrpc: "2.0", id: 1, method: "tools/list", params: {} },
        undefined,
      );

      expect(response).not.toBeNull();
      const result = response!.result as { tools: Array<{ name: string }> };
      expect(result.tools).toHaveLength(11);

      const toolNames = result.tools.map((t) => t.name);
      expect(toolNames).toContain("start_game");
      expect(toolNames).toContain("look");
      expect(toolNames).toContain("go");
      expect(toolNames).toContain("take");
      expect(toolNames).toContain("examine");
      expect(toolNames).toContain("talk");
      expect(toolNames).toContain("use");
      expect(toolNames).toContain("interact");
      expect(toolNames).toContain("inventory");
      expect(toolNames).toContain("hint");
      expect(toolNames).toContain("status");
    });

    it("should include input schemas for tools", async () => {
      const handler = createMcpHandler(testGame);
      const { response } = await handler.handleRequest(
        { jsonrpc: "2.0", id: 1, method: "tools/list", params: {} },
        undefined,
      );

      expect(response).not.toBeNull();
      const result = response!.result as { tools: Array<{ name: string; inputSchema: object }> };
      const goTool = result.tools.find((t) => t.name === "go");

      expect(goTool?.inputSchema).toBeDefined();
    });
  });

  describe("tools/call", () => {
    it("should execute start_game tool", async () => {
      const handler = createMcpHandler(testGame);
      const { response, sessionId } = await handler.handleRequest(
        {
          jsonrpc: "2.0",
          id: 1,
          method: "tools/call",
          params: { name: "start_game", arguments: {} },
        },
        undefined,
      );

      expect(sessionId).toBeDefined();
      expect(response).not.toBeNull();
      expect(response!.result).toBeDefined();

      const result = response!.result as { content: Array<{ type: string; text: string }> };
      expect(result.content[0]?.type).toBe("text");
      expect(result.content[0]?.text).toContain("Welcome to the test game!");
    });

    it("should maintain session across calls", async () => {
      const handler = createMcpHandler(testGame);

      const { sessionId } = await handler.handleRequest(
        {
          jsonrpc: "2.0",
          id: 1,
          method: "tools/call",
          params: { name: "start_game", arguments: {} },
        },
        undefined,
      );

      await handler.handleRequest(
        {
          jsonrpc: "2.0",
          id: 2,
          method: "tools/call",
          params: { name: "take", arguments: { item: "key" } },
        },
        sessionId,
      );

      const { response } = await handler.handleRequest(
        {
          jsonrpc: "2.0",
          id: 3,
          method: "tools/call",
          params: { name: "inventory", arguments: {} },
        },
        sessionId,
      );

      expect(response).not.toBeNull();
      const result = response!.result as { content: Array<{ text: string }> };
      expect(result.content[0]?.text).toContain("brass key");
    });

    it("should handle go tool with direction", async () => {
      const handler = createMcpHandler(testGame);

      const { sessionId } = await handler.handleRequest(
        {
          jsonrpc: "2.0",
          id: 1,
          method: "tools/call",
          params: { name: "start_game", arguments: {} },
        },
        undefined,
      );

      await handler.handleRequest(
        {
          jsonrpc: "2.0",
          id: 2,
          method: "tools/call",
          params: { name: "take", arguments: { item: "key" } },
        },
        sessionId,
      );

      await handler.handleRequest(
        {
          jsonrpc: "2.0",
          id: 3,
          method: "tools/call",
          params: { name: "use", arguments: { item: "key", target: "door" } },
        },
        sessionId,
      );

      const { response } = await handler.handleRequest(
        {
          jsonrpc: "2.0",
          id: 4,
          method: "tools/call",
          params: { name: "go", arguments: { direction: "north" } },
        },
        sessionId,
      );

      expect(response).not.toBeNull();
      const result = response!.result as { content: Array<{ text: string }> };
      expect(result.content[0]?.text).toContain("End Room");
    });

    it("should handle talk tool", async () => {
      const handler = createMcpHandler(testGame);

      const { sessionId } = await handler.handleRequest(
        {
          jsonrpc: "2.0",
          id: 1,
          method: "tools/call",
          params: { name: "start_game", arguments: {} },
        },
        undefined,
      );

      await handler.handleRequest(
        {
          jsonrpc: "2.0",
          id: 2,
          method: "tools/call",
          params: { name: "talk", arguments: { character: "guard" } },
        },
        sessionId,
      );

      const { response } = await handler.handleRequest(
        {
          jsonrpc: "2.0",
          id: 3,
          method: "tools/call",
          params: { name: "talk", arguments: { character: "guard", option: 1 } },
        },
        sessionId,
      );

      expect(response).not.toBeNull();
      const result = response!.result as { content: Array<{ text: string }> };
      expect(result.content[0]?.text).toContain("Zzz");
    });

    it("should handle status tool", async () => {
      const handler = createMcpHandler(testGame);

      const { sessionId } = await handler.handleRequest(
        {
          jsonrpc: "2.0",
          id: 1,
          method: "tools/call",
          params: { name: "start_game", arguments: {} },
        },
        undefined,
      );

      const { response } = await handler.handleRequest(
        {
          jsonrpc: "2.0",
          id: 2,
          method: "tools/call",
          params: { name: "status", arguments: {} },
        },
        sessionId,
      );

      expect(response).not.toBeNull();
      const result = response!.result as { content: Array<{ text: string }> };
      expect(result.content[0]?.text).toContain("Starting Room");
      expect(result.content[0]?.text).toContain("Turns:");
    });

    it("should handle hint tool", async () => {
      const handler = createMcpHandler(testGame);

      const { sessionId } = await handler.handleRequest(
        {
          jsonrpc: "2.0",
          id: 1,
          method: "tools/call",
          params: { name: "start_game", arguments: {} },
        },
        undefined,
      );

      const { response } = await handler.handleRequest(
        {
          jsonrpc: "2.0",
          id: 2,
          method: "tools/call",
          params: { name: "hint", arguments: {} },
        },
        sessionId,
      );

      expect(response).not.toBeNull();
      const result = response!.result as { content: Array<{ text: string }> };
      expect(result.content[0]?.text).toContain("key");
    });

    it("should handle examine tool", async () => {
      const handler = createMcpHandler(testGame);

      const { sessionId } = await handler.handleRequest(
        {
          jsonrpc: "2.0",
          id: 1,
          method: "tools/call",
          params: { name: "start_game", arguments: {} },
        },
        undefined,
      );

      const { response } = await handler.handleRequest(
        {
          jsonrpc: "2.0",
          id: 2,
          method: "tools/call",
          params: { name: "examine", arguments: { target: "key" } },
        },
        sessionId,
      );

      expect(response).not.toBeNull();
      const result = response!.result as { content: Array<{ text: string }> };
      expect(result.content[0]?.text).toContain("ornate engravings");
    });

    it("should handle interact tool", async () => {
      const handler = createMcpHandler(testGame);

      const { sessionId } = await handler.handleRequest(
        {
          jsonrpc: "2.0",
          id: 1,
          method: "tools/call",
          params: { name: "start_game", arguments: {} },
        },
        undefined,
      );

      const { response } = await handler.handleRequest(
        {
          jsonrpc: "2.0",
          id: 2,
          method: "tools/call",
          params: { name: "interact", arguments: { item: "door" } },
        },
        sessionId,
      );

      expect(response).not.toBeNull();
      const result = response!.result as { content: Array<{ text: string }> };
      expect(result.content[0]?.text).toBeDefined();
    });
  });

  describe("ping", () => {
    it("should respond to ping", async () => {
      const handler = createMcpHandler(testGame);
      const { response } = await handler.handleRequest(
        { jsonrpc: "2.0", id: 1, method: "ping", params: {} },
        undefined,
      );

      expect(response).not.toBeNull();
      expect(response!.result).toEqual({});
    });
  });

  describe("unknown method", () => {
    it("should return error for unknown method", async () => {
      const handler = createMcpHandler(testGame);
      const { response } = await handler.handleRequest(
        { jsonrpc: "2.0", id: 1, method: "unknown/method", params: {} },
        undefined,
      );

      expect(response).not.toBeNull();
      expect(response!.error).toBeDefined();
      expect(response!.error!.code).toBe(-32601);
      expect(response!.error!.message).toContain("Method not found");
    });
  });

  describe("notifications/initialized", () => {
    it("should return null response for notifications", async () => {
      const handler = createMcpHandler(testGame);
      const { response } = await handler.handleRequest(
        { jsonrpc: "2.0", method: "notifications/initialized" },
        undefined,
      );

      expect(response).toBeNull();
    });
  });
});
