import * as readline from "node:readline";
import { GameEngine } from "text-game-engine";
import { dungeonEscape } from "./game-definition";

const engine = new GameEngine(dungeonEscape);

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function parseCommand(input: string): { command: string; args: string[] } {
  const parts = input.trim().toLowerCase().split(/\s+/);
  const command = parts[0] ?? "";
  const args = parts.slice(1);
  return { command, args };
}

function handleCommand(input: string): string {
  const { command, args } = parseCommand(input);

  switch (command) {
    case "look":
    case "l":
      return engine.look(args.join(" ") || undefined);

    case "examine":
    case "x":
      if (args.length === 0) return "Examine what?";
      return engine.examine(args.join(" "));

    case "take":
    case "get":
    case "pick":
      if (args.length === 0) return "Take what?";
      return engine.take(args.join(" "));

    case "use": {
      if (args.length === 0) return "Use what?";
      const onIndex = args.indexOf("on");
      if (onIndex > 0) {
        const item = args.slice(0, onIndex).join(" ");
        const target = args.slice(onIndex + 1).join(" ");
        return engine.use(item, target);
      }
      return engine.use(args.join(" "));
    }

    case "go":
    case "walk":
    case "move":
      if (args.length === 0) return "Go where?";
      return engine.go(args.join(" "));

    case "north":
    case "n":
      return engine.go("north");

    case "south":
    case "s":
      return engine.go("south");

    case "east":
    case "e":
      return engine.go("east");

    case "west":
    case "w":
      return engine.go("west");

    case "inventory":
    case "inv":
    case "i":
      return engine.inventory();

    case "hint":
    case "h":
      return engine.hint();

    case "status":
      return engine.getStatusMessage();

    case "quit":
    case "exit":
    case "q":
      console.log("\nThanks for playing!\n");
      process.exit(0);

    case "help":
    case "?":
      return `
Available commands:
  look [target]     - Look around or at something
  examine <target>  - Examine something closely
  take <item>       - Pick up an item
  use <item>        - Use an item
  use <item> on <target> - Use item on target
  go <direction>    - Move in a direction (north, south, east, west)
  n/s/e/w           - Shorthand for directions
  inventory         - Check your inventory
  hint              - Get a hint
  status            - Check game status
  quit              - Exit the game
`.trim();

    default:
      if (command === "") return 'Type a command. Try "help" for options.';
      return `Unknown command: "${command}". Try "help" for options.`;
  }
}

function prompt(): void {
  rl.question("\n> ", (answer) => {
    const response = handleCommand(answer);
    console.log("\n" + response);

    if (engine.isGameOver()) {
      rl.close();
      return;
    }

    prompt();
  });
}

console.log("\n" + engine.startGame());
prompt();
