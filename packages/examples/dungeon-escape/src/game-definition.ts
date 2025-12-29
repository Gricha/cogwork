import type { GameDefinition } from "cogwork";

export const dungeonEscape: GameDefinition = {
  id: "dungeon-escape",
  name: "Dungeon Escape",
  version: "1.0.0",
  description: "Escape from the dungeon!",

  rooms: [
    {
      id: "cell",
      name: "Prison Cell",
      description: {
        fragments: [
          {
            say: "You wake up in a cold, damp prison cell. Stone walls surround you on three sides. Iron bars block the way out.",
          },
          {
            say: "The cell door is now open!",
            when: [{ truthy: "CELL_UNLOCKED" }],
            group: "door-state",
          },
          {
            say: "The cell door is locked tight.",
            when: [{ falsy: "CELL_UNLOCKED" }],
            group: "door-state",
          },
          {
            say: "A faint light flickers from the corridor beyond.",
            when: [{ truthy: "CELL_UNLOCKED" }],
          },
        ],
      },
      items: [
        {
          id: "loose-stone",
          name: "loose stone",
          description: "One of the stones in the wall looks loose.",
          examineText: {
            fragments: [
              {
                say: "The stone can be pulled out. Behind it, you see a rusty key!",
                when: [{ falsy: "KEY_FOUND" }],
              },
              {
                say: "The stone has been moved, revealing an empty hole.",
                when: [{ truthy: "KEY_FOUND" }],
              },
            ],
          },
          takeable: false,
          aliases: ["stone", "wall"],
          useActions: [
            {
              requires: [{ falsy: "KEY_FOUND" }],
              response:
                "You pull the loose stone from the wall and find a rusty key hidden behind it!",
              effects: [{ set: ["KEY_FOUND", true] }, { addItem: "rusty-key" }],
            },
            {
              requires: [{ truthy: "KEY_FOUND" }],
              response: "The hole behind the stone is empty.",
            },
          ],
        },
        {
          id: "rusty-key",
          name: "rusty key",
          description: "A rusty iron key.",
          examineText: "The key is old and rusted, but might still work.",
          takeable: true,
          aliases: ["key"],
        },
        {
          id: "cell-door",
          name: "cell door",
          description: "Heavy iron bars.",
          examineText: {
            fragments: [
              {
                say: "The iron bars are cold to the touch. There is a keyhole in the lock.",
                when: [{ falsy: "CELL_UNLOCKED" }],
              },
              {
                say: "The door hangs open on its rusty hinges.",
                when: [{ truthy: "CELL_UNLOCKED" }],
              },
            ],
          },
          takeable: false,
          aliases: ["door", "bars", "lock"],
          useActions: [
            {
              targetId: "rusty-key",
              requires: [{ falsy: "CELL_UNLOCKED" }],
              response:
                "The rusty key fits! With a grinding screech, the lock turns and the door swings open.",
              effects: [{ set: ["CELL_UNLOCKED", true] }],
            },
          ],
        },
      ],
      npcs: [],
      exits: [
        {
          targetRoomId: "corridor",
          aliases: ["north"],
          requires: [{ truthy: "CELL_UNLOCKED" }],
          blockedMessage: "The cell door is locked. You need to find a way to open it.",
        },
      ],
    },
    {
      id: "corridor",
      name: "Dungeon Corridor",
      description: {
        fragments: [
          {
            say: "A long stone corridor stretches before you. Torches flicker on the walls, casting dancing shadows.",
          },
          {
            say: "You notice a guard slumped against the wall, fast asleep.",
            when: [{ falsy: "GUARD_DISTRACTED" }],
          },
          {
            say: "The guard is distracted, examining something on the floor.",
            when: [{ truthy: "GUARD_DISTRACTED" }, { falsy: "GUARD_GONE" }],
          },
          {
            say: "The guard has wandered off down a side passage.",
            when: [{ truthy: "GUARD_GONE" }],
          },
        ],
      },
      items: [
        {
          id: "torch",
          name: "torch",
          description: "A burning torch mounted on the wall.",
          examineText: "The torch burns with a warm, steady flame.",
          takeable: true,
          aliases: ["fire", "light"],
        },
        {
          id: "coin",
          name: "gold coin",
          description: "A shiny gold coin on the floor.",
          examineText: "A freshly minted gold coin. The guard must have dropped it.",
          takeable: true,
          aliases: ["gold", "money"],
          useActions: [
            {
              requires: [{ falsy: "GUARD_DISTRACTED" }, { eq: ["room", "corridor"] }],
              response:
                "You toss the coin down the corridor. It clinks against the stone, and the guard stirs, looking for the source of the sound.",
              effects: [{ set: ["GUARD_DISTRACTED", true] }, { removeItem: "coin" }],
            },
          ],
        },
      ],
      npcs: [],
      exits: [
        { targetRoomId: "cell", aliases: ["south"] },
        {
          targetRoomId: "exit",
          aliases: ["north"],
          requires: [
            {
              or: [{ truthy: "GUARD_GONE" }, { truthy: "GUARD_DISTRACTED" }],
            },
          ],
          blockedMessage:
            "The sleeping guard blocks your path. You need to get past without waking them.",
        },
      ],
      triggers: [
        {
          id: "guard-leaves",
          when: [{ truthy: "GUARD_DISTRACTED" }, { gt: ["turnCount", 3] }, { falsy: "GUARD_GONE" }],
          effects: [{ set: ["GUARD_GONE", true] }],
        },
      ],
    },
    {
      id: "exit",
      name: "Dungeon Exit",
      description: {
        fragments: [
          {
            say: "You see a heavy wooden door ahead. Moonlight seeps through the cracks - freedom is just beyond!",
          },
          {
            say: "The exit door stands open. Fresh night air fills your lungs!",
            when: [{ truthy: "EXIT_OPEN" }],
            group: "exit-state",
          },
          {
            say: "The exit door is barred from this side. A simple latch holds it closed.",
            when: [{ falsy: "EXIT_OPEN" }],
            group: "exit-state",
          },
        ],
      },
      items: [
        {
          id: "exit-door",
          name: "exit door",
          description: "A heavy wooden door.",
          examineText: {
            fragments: [
              {
                say: "The door is barred with a simple wooden latch. You can easily open it from this side.",
                when: [{ falsy: "EXIT_OPEN" }],
              },
              {
                say: "The door is open. Freedom awaits!",
                when: [{ truthy: "EXIT_OPEN" }],
              },
            ],
          },
          takeable: false,
          aliases: ["door", "latch", "exit"],
          useActions: [
            {
              requires: [{ falsy: "EXIT_OPEN" }],
              response: "You lift the latch and push the door open. Cool night air rushes in!",
              effects: [{ set: ["EXIT_OPEN", true] }],
            },
            {
              requires: [{ truthy: "EXIT_OPEN" }],
              response: "The door is already open.",
            },
          ],
        },
        {
          id: "freedom",
          name: "outside",
          description: "The world beyond the dungeon.",
          examineText: "Stars twinkle in the night sky. You can see a forest in the distance.",
          takeable: false,
          aliases: ["outside", "freedom", "night", "sky"],
          useActions: [
            {
              requires: [{ truthy: "EXIT_OPEN" }],
              response:
                "You step through the door into the cool night air. You are free!\n\nCongratulations, you have escaped the dungeon!",
              effects: [{ set: ["won", true] }, { set: ["gameOver", true] }],
            },
            {
              requires: [{ falsy: "EXIT_OPEN" }],
              response: "The door is still closed. Open it first!",
            },
          ],
        },
      ],
      npcs: [],
      exits: [{ targetRoomId: "corridor", aliases: ["south"] }],
    },
  ],

  startingRoom: "cell",
  initialFlags: {
    KEY_FOUND: false,
    CELL_UNLOCKED: false,
    GUARD_DISTRACTED: false,
    GUARD_GONE: false,
    EXIT_OPEN: false,
  },

  introText: `
=== DUNGEON ESCAPE ===

You don't remember how you got here, but one thing is clear: you need to escape.

Commands: look, examine <target>, take <item>, use <item>, use <item> on <target>, go <direction>, inventory, hint

Good luck!
`.trim(),

  winMessage: `
╔══════════════════════════════════════════╗
║           CONGRATULATIONS!               ║
║                                          ║
║     You escaped the dungeon in {turns} turns!    ║
║                                          ║
╚══════════════════════════════════════════╝
`.trim(),

  hints: [
    {
      id: "hint-stone",
      text: "The walls of your cell look old. Perhaps some stones are loose?",
      when: [{ falsy: "KEY_FOUND" }],
    },
    {
      id: "hint-door",
      text: "You have a key. Try using it on the cell door.",
      when: [{ has: "rusty-key" }, { falsy: "CELL_UNLOCKED" }],
    },
    {
      id: "hint-guard",
      text: "The guard is blocking your way. Maybe you can distract them somehow?",
      when: [
        { truthy: "CELL_UNLOCKED" },
        { falsy: "GUARD_DISTRACTED" },
        { eq: ["room", "corridor"] },
      ],
    },
    {
      id: "hint-exit",
      text: "The exit is right there! Just open the door and step outside.",
      when: [
        { or: [{ truthy: "GUARD_DISTRACTED" }, { truthy: "GUARD_GONE" }] },
        { falsy: "EXIT_OPEN" },
      ],
    },
  ],

  globalTriggers: [
    {
      id: "escape-ready",
      when: [
        {
          and: [
            { truthy: "CELL_UNLOCKED" },
            { or: [{ truthy: "GUARD_DISTRACTED" }, { truthy: "GUARD_GONE" }] },
            { falsy: "ESCAPE_READY" },
          ],
        },
      ],
      effects: [{ set: ["ESCAPE_READY", true] }],
    },
  ],
};
