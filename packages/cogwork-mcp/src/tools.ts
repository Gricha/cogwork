import type { GameEngine } from "cogwork";
import type { ToolDefinition } from "./types.js";

export const toolDefinitions: ToolDefinition[] = [
  {
    name: "start_game",
    description: "Start a new game. Call this first to begin your adventure!",
    inputSchema: {
      type: "object" as const,
      properties: {},
      required: [],
    },
  },
  {
    name: "look",
    description:
      "Look around the current room to see the description, exits, items, and characters. Optionally look at something specific.",
    inputSchema: {
      type: "object" as const,
      properties: {
        target: {
          type: "string",
          description: "Optional: specific item, person, or feature to look at",
        },
      },
      required: [],
    },
  },
  {
    name: "go",
    description: "Move to an adjacent room by direction or name.",
    inputSchema: {
      type: "object" as const,
      properties: {
        direction: {
          type: "string",
          description: "The direction or room name to move to",
        },
      },
      required: ["direction"],
    },
  },
  {
    name: "take",
    description: "Pick up an item from the current room and add it to your inventory.",
    inputSchema: {
      type: "object" as const,
      properties: {
        item: {
          type: "string",
          description: "The name of the item to pick up",
        },
      },
      required: ["item"],
    },
  },
  {
    name: "examine",
    description: "Examine an item or person closely for more details.",
    inputSchema: {
      type: "object" as const,
      properties: {
        target: {
          type: "string",
          description: "The item or person to examine closely",
        },
      },
      required: ["target"],
    },
  },
  {
    name: "talk",
    description:
      "Talk to a character in the room. First call shows dialogue options, then call again with a number to choose what to say.",
    inputSchema: {
      type: "object" as const,
      properties: {
        character: {
          type: "string",
          description: "The name of the character to talk to",
        },
        option: {
          type: "number",
          description: "Optional: the dialogue option number to choose (1, 2, 3, etc.)",
        },
      },
      required: ["character"],
    },
  },
  {
    name: "use",
    description:
      "Use an item from your inventory. Some items can be used on their own, others on specific targets, and some accept a number input.",
    inputSchema: {
      type: "object" as const,
      properties: {
        item: {
          type: "string",
          description: "The name of the item to use",
        },
        target: {
          type: "string",
          description: "Optional: what to use the item on",
        },
        number: {
          type: "number",
          description: "Optional: a number input for the action",
        },
      },
      required: ["item"],
    },
  },
  {
    name: "interact",
    description: "Interact with an item directly without specifying a target.",
    inputSchema: {
      type: "object" as const,
      properties: {
        item: {
          type: "string",
          description: "The name of the item to interact with",
        },
      },
      required: ["item"],
    },
  },
  {
    name: "inventory",
    description: "Check what items you are carrying.",
    inputSchema: {
      type: "object" as const,
      properties: {},
      required: [],
    },
  },
  {
    name: "hint",
    description:
      "Get a hint for the next step based on your current progress. Only call this if a user explicitly asks for a hint.",
    inputSchema: {
      type: "object" as const,
      properties: {},
      required: [],
    },
  },
  {
    name: "status",
    description: "Get the current game status as a human-readable summary.",
    inputSchema: {
      type: "object" as const,
      properties: {},
      required: [],
    },
  },
];

export function executeTool(
  engine: GameEngine,
  toolName: string,
  args: Record<string, unknown>,
): { result: string; isNewGame?: boolean } {
  let result: string;
  let isNewGame = false;

  switch (toolName) {
    case "start_game":
      result = engine.startGame();
      isNewGame = true;
      break;

    case "look":
      result = engine.look(args["target"] as string | undefined);
      break;

    case "go":
      result = engine.go(args["direction"] as string);
      break;

    case "take":
      result = engine.take(args["item"] as string);
      break;

    case "examine":
      result = engine.examine(args["target"] as string);
      break;

    case "talk":
      if (args["option"] !== undefined) {
        result = engine.talkOption(args["character"] as string, args["option"] as number);
      } else {
        result = engine.talk(args["character"] as string);
      }
      break;

    case "use":
      result = engine.use(
        args["item"] as string,
        args["target"] as string | undefined,
        args["number"] as number | undefined,
      );
      break;

    case "inventory":
      result = engine.inventory();
      break;

    case "interact":
      result = engine.use(args["item"] as string);
      break;

    case "hint":
      result = engine.hint();
      break;

    case "status":
      result = engine.getStatusMessage();
      break;

    default:
      result = `Unknown tool: ${toolName}`;
  }

  return { result, isNewGame };
}
