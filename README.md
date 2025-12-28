# cogwork

Declarative puzzle adventure game engine. Define games as data, not code.

[See it in action](https://gricha.dev/happyholidays/terminal)

## Install

```sh
npm install cogwork zod
```

## Quick Start

```typescript
import { GameEngine, type GameDefinition } from "cogwork";

const game: GameDefinition = {
  id: "escape",
  name: "Escape",
  version: "1.0.0",
  startingRoom: "cell",
  initialFlags: { DOOR_OPEN: false },
  introText: "You wake up in a cell.",
  winMessage: "You escaped!",
  hints: [],
  rooms: [
    {
      id: "cell",
      name: "Prison Cell",
      description: "A cold, damp cell. A rusty key lies on the floor.",
      items: [
        {
          id: "key",
          name: "rusty key",
          description: "A rusty key.",
          examineText: "Old but functional.",
          takeable: true,
        },
        {
          id: "door",
          name: "cell door",
          description: "Heavy iron bars.",
          examineText: "Locked tight.",
          takeable: false,
          useActions: [
            {
              targetId: "key",
              requires: [{ falsy: "DOOR_OPEN" }],
              response: "The door creaks open!",
              effects: [{ set: ["DOOR_OPEN", true] }],
            },
          ],
        },
      ],
      npcs: [],
      exits: [
        {
          targetRoomId: "freedom",
          aliases: ["north", "door"],
          requires: [{ truthy: "DOOR_OPEN" }],
          blockedMessage: "The door is locked.",
        },
      ],
    },
    {
      id: "freedom",
      name: "Outside",
      description: "Fresh air!",
      items: [
        {
          id: "exit",
          name: "path",
          description: "A path to freedom.",
          examineText: "Freedom awaits.",
          takeable: false,
          useActions: [
            {
              response: "You escape!",
              effects: [{ set: ["won", true] }, { set: ["gameOver", true] }],
            },
          ],
        },
      ],
      npcs: [],
      exits: [],
    },
  ],
};

const engine = new GameEngine(game);
console.log(engine.startGame());
console.log(engine.look());
console.log(engine.take("key"));
console.log(engine.use("key", "door"));
console.log(engine.go("north"));
```

## Engine API

```typescript
const engine = new GameEngine(game);

engine.startGame();              // Start/restart game, returns intro text
engine.look(target?);            // Look around or at something
engine.examine(target);          // Examine item/NPC closely
engine.take(item);               // Pick up an item
engine.use(item, target?);       // Use an item, optionally on a target
engine.go(direction);            // Move to another room
engine.inventory();              // List inventory
engine.talk(npc);                // Start dialogue with NPC
engine.talkOption(npc, number);  // Select dialogue option
engine.hint();                   // Get a context-aware hint

engine.hasWon();                 // Check win state
engine.isGameOver();             // Check if game ended
engine.serialize();              // Save game state to JSON
GameEngine.deserialize(game, json); // Restore from saved state
```

## Conditions

Control when things happen:

```typescript
{ truthy: "FLAG" }           // Flag is true
{ falsy: "FLAG" }            // Flag is false
{ eq: ["path", value] }      // Path equals value
{ gt: ["path", number] }     // Greater than
{ has: "item-id" }           // Player has item
{ lacks: "item-id" }         // Player doesn't have item
{ present: "item-id" }       // Item is in current room
{ absent: "item-id" }        // Item is not in current room
{ once: "unique-key" }       // Only passes once per game
{ and: [conditions] }        // All must pass
{ or: [conditions] }         // Any must pass
{ not: condition }           // Inverts condition
```

## Effects

Mutate game state:

```typescript
{ set: ["path", value] }     // Set flag/state
{ add: ["path", number] }    // Add to numeric value
{ subtract: ["path", n] }    // Subtract from numeric value
{ addItem: "item-id" }       // Add item to inventory
{ removeItem: "item-id" }    // Remove item from inventory
{ consume: "path" }          // Set path to false
{ markOnce: "key" }          // Mark a once-key as used
```

## Dynamic Text

Use fragments for conditional descriptions:

```typescript
description: {
  id: "room-desc",
  fragments: [
    { say: "A dark room." },
    { say: "Light streams through the window.", when: [{ truthy: "WINDOW_OPEN" }] },
    { say: "The door is locked.", when: [{ falsy: "DOOR_OPEN" }], group: "door" },
    { say: "The door is open.", when: [{ truthy: "DOOR_OPEN" }], group: "door" },
  ],
}
```

Fragments with the same `group` are mutually exclusive (highest priority wins).

## Schema Validation

Validate game definitions at build time:

```typescript
import { GameDefinitionSchema } from "cogwork/schemas";

const result = GameDefinitionSchema.safeParse(gameData);
if (!result.success) {
  console.error(result.error.issues);
}
```

## License

MIT
