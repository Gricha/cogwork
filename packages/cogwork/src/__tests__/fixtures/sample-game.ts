import type { GameDefinition } from "../../types";

export const sampleGame: GameDefinition = {
  id: "test-game",
  name: "Test Adventure",
  version: "1.0.0",
  description: "A simple test game",

  rooms: [
    {
      id: "start",
      name: "Starting Room",
      description: {
        fragments: [
          {
            say: "You are in a small room with stone walls.",
          },
          {
            say: "The door to the north is now unlocked!",
            when: [{ truthy: "DOOR_UNLOCKED" }],
            group: "door-status",
          },
          {
            say: "A heavy wooden door blocks the way north.",
            when: [{ falsy: "DOOR_UNLOCKED" }],
            group: "door-status",
          },
        ],
      },
      items: [
        {
          id: "key",
          name: "brass key",
          description: "A small brass key.",
          examineText: "The key has ornate engravings on it.",
          takeable: true,
          aliases: ["key"],
        },
        {
          id: "torch",
          name: "torch",
          description: "A wooden torch.",
          examineText: "The torch is unlit.",
          takeable: true,
          useActions: [
            {
              targetId: "door",
              requires: [{ has: "key" }],
              response: "You light the torch and see the keyhole clearly.",
              effects: [{ set: ["TORCH_LIT", true] }],
            },
          ],
        },
        {
          id: "door",
          name: "wooden door",
          description: "A heavy wooden door.",
          examineText: {
            fragments: [
              {
                say: "The door is locked. There is a keyhole.",
                when: [{ falsy: "DOOR_UNLOCKED" }],
              },
              {
                say: "The door is unlocked and slightly ajar.",
                when: [{ truthy: "DOOR_UNLOCKED" }],
              },
            ],
          },
          takeable: false,
          aliases: ["door"],
          useActions: [
            {
              targetId: "key",
              response: "You insert the key and turn it. The door unlocks with a click!",
              effects: [{ set: ["DOOR_UNLOCKED", true] }],
            },
          ],
        },
      ],
      npcs: [],
      exits: [
        {
          targetRoomId: "treasure",
          aliases: ["north"],
          requires: [{ truthy: "DOOR_UNLOCKED" }],
          blockedMessage: "The door is locked. You need to find a way to open it.",
        },
      ],
    },
    {
      id: "treasure",
      name: "Treasure Room",
      description: "You are in a glittering treasure room!",
      items: [
        {
          id: "gold",
          name: "pile of gold",
          description: "A magnificent pile of gold coins.",
          examineText: "So much gold! You feel rich just looking at it.",
          takeable: true,
          aliases: ["gold", "coins"],
          onTake: [{ set: ["won", true] }, { set: ["gameOver", true] }],
          onTakeText: "You grab the gold! You win!",
        },
      ],
      npcs: [],
      exits: [{ targetRoomId: "start", aliases: ["south"] }],
      triggers: [
        {
          id: "treasure-found",
          when: [{ once: "event.treasure_room_entered" }],
          effects: [{ set: ["VISITED_TREASURE", true] }],
        },
      ],
    },
  ],

  startingRoom: "start",
  initialFlags: {
    DOOR_UNLOCKED: false,
    score: 0,
  },

  introText: "Welcome to the Test Adventure! Find the treasure to win.",
  winMessage: "Congratulations! You found the treasure in {turns} turns!",
  hints: [
    {
      id: "hint-key",
      text: "Have you tried picking up the key?",
      when: [{ lacks: "key" }],
    },
    {
      id: "hint-door",
      text: "Try using the key on the door.",
      when: [{ has: "key" }, { falsy: "DOOR_UNLOCKED" }],
    },
    {
      id: "hint-go",
      text: "The door is unlocked. Try going north.",
      when: [{ truthy: "DOOR_UNLOCKED" }, { ne: ["room", "treasure"] }],
    },
  ],

  globalTriggers: [
    {
      id: "prepared-check",
      when: [
        {
          and: [{ has: "key" }, { has: "torch" }, { falsy: "PREPARED" }],
        },
      ],
      effects: [{ set: ["PREPARED", true] }],
    },
  ],
};

export const conditionTestGame: GameDefinition = {
  id: "condition-test",
  name: "Condition Test Game",
  version: "1.0.0",

  rooms: [
    {
      id: "test-room",
      name: "Test Room",
      description: {
        fragments: [
          {
            say: "You have either item A or item B.",
            when: [{ or: [{ has: "item-a" }, { has: "item-b" }] }],
            group: "or-test",
          },
          {
            say: "You have neither item A nor item B.",
            when: [
              {
                not: { or: [{ has: "item-a" }, { has: "item-b" }] },
              },
            ],
            group: "or-test",
          },
          {
            say: "You have both items!",
            when: [
              {
                and: [{ has: "item-a" }, { has: "item-b" }],
              },
            ],
          },
          {
            say: "Flag X is not set.",
            when: [{ not: { truthy: "FLAG_X" } }],
            group: "not-test",
          },
          {
            say: "Flag X is set.",
            when: [{ truthy: "FLAG_X" }],
            group: "not-test",
          },
          {
            say: "More than 5 turns have passed.",
            when: [{ gt: ["turnCount", 5] }],
          },
        ],
      },
      items: [
        {
          id: "item-a",
          name: "Item A",
          description: "Test item A",
          examineText: "This is item A.",
          takeable: true,
        },
        {
          id: "item-b",
          name: "Item B",
          description: "Test item B",
          examineText: "This is item B.",
          takeable: true,
        },
        {
          id: "setter",
          name: "Flag Setter",
          description: "Sets FLAG_X when used.",
          examineText: "A device that sets flags.",
          takeable: true,
          useActions: [
            {
              response: "FLAG_X is now set.",
              effects: [{ set: ["FLAG_X", true] }],
            },
          ],
        },
        {
          id: "counter",
          name: "Counter",
          description: "Increments a counter.",
          examineText: "A counting device.",
          takeable: false,
          useActions: [
            {
              response: "Counter incremented.",
              effects: [{ add: ["counter_value", 1] }],
            },
          ],
        },
        {
          id: "subtractor",
          name: "Subtractor",
          description: "Decrements a counter.",
          examineText: "A subtracting device.",
          takeable: false,
          useActions: [
            {
              response: "Counter decremented.",
              effects: [{ subtract: ["counter_value", 1] }],
            },
          ],
        },
      ],
      npcs: [],
      exits: [],
    },
  ],

  startingRoom: "test-room",
  initialFlags: {
    FLAG_X: false,
    counter_value: 0,
  },

  introText: "Condition test game started.",
  winMessage: "Test complete.",
  hints: [],
};

export const npcTestGame: GameDefinition = {
  id: "npc-test",
  name: "NPC Test Game",
  version: "1.0.0",

  rooms: [
    {
      id: "tower",
      name: "Wizard Tower",
      description: "A tall tower filled with magical artifacts.",
      items: [],
      npcs: [
        {
          id: "wizard",
          name: "Old Wizard",
          description: "A wise old wizard with a long white beard.",
          aliases: ["mage", "old man"],
          dialogue: [
            {
              when: [{ once: "wizard.greeted" }],
              playerLine: "Hello, wizard!",
              response: "Greetings, adventurer! What brings you here?",
            },
            {
              when: [{ once: "wizard.knowledge" }],
              playerLine: "Tell me your secrets.",
              response: "Very well. I shall share my knowledge with you.",
              effects: [{ set: ["WIZARD_KNOWLEDGE", true] }],
            },
            {
              when: [{ truthy: "WIZARD_KNOWLEDGE" }, { once: "wizard.secret" }],
              playerLine: "Secret option only after knowledge",
              response: "You have learned well.",
            },
          ],
        },
      ],
      exits: [],
    },
  ],

  startingRoom: "tower",
  initialFlags: {},

  introText: "Welcome to the wizard's tower.",
  winMessage: "You have mastered the tower.",
  hints: [],
};

export const containerTestGame: GameDefinition = {
  id: "container-test",
  name: "Container Test Game",
  version: "1.0.0",

  rooms: [
    {
      id: "storage",
      name: "Storage Room",
      description: {
        fragments: [
          {
            say: "A dusty storage room.",
          },
          {
            say: "The gem is here, inside the box.",
            when: [{ present: "gem" }, { is_at: ["gem", "box"] }],
          },
          {
            say: "The gem is gone from its hiding spot.",
            when: [{ absent: "gem" }],
          },
        ],
      },
      items: [
        {
          id: "box",
          name: "wooden box",
          description: "An old wooden box.",
          examineText: "The box is slightly open.",
          takeable: false,
          aliases: ["container"],
        },
        {
          id: "gem",
          name: "hidden gem",
          description: "A sparkling gem hidden in the box.",
          examineText: "A sparkling gem that catches the light.",
          takeable: true,
          location: "box",
          aliases: ["jewel"],
        },
      ],
      npcs: [],
      exits: [],
    },
  ],

  startingRoom: "storage",
  initialFlags: {},

  introText: "Find what's hidden.",
  winMessage: "You found it!",
  hints: [],
};

export const priorityTestGame: GameDefinition = {
  id: "priority-test",
  name: "Priority Test Game",
  version: "1.0.0",

  rooms: [
    {
      id: "hall",
      name: "Great Hall",
      description: {
        fragments: [
          {
            say: "Low priority message.",
            priority: 0,
          },
          {
            say: "High priority message!",
            when: [{ falsy: "DISABLED" }],
            priority: 10,
          },
        ],
      },
      items: [
        {
          id: "disabler",
          name: "Disabler",
          description: "Disables high priority.",
          examineText: "A toggle switch.",
          takeable: false,
          useActions: [
            {
              response: "High priority disabled.",
              effects: [{ set: ["DISABLED", true] }],
            },
          ],
        },
      ],
      npcs: [],
      exits: [],
    },
  ],

  startingRoom: "hall",
  initialFlags: {
    DISABLED: false,
  },

  introText: "Priority test.",
  winMessage: "Done.",
  hints: [],
};

export const effectsTestGame: GameDefinition = {
  id: "effects-test",
  name: "Effects Test Game",
  version: "1.0.0",

  rooms: [
    {
      id: "lab",
      name: "Laboratory",
      description: "A magical laboratory.",
      items: [
        {
          id: "wand",
          name: "magic wand",
          description: "A powerful wand.",
          examineText: "It hums with power.",
          takeable: true,
        },
        {
          id: "summoner",
          name: "Summoner",
          description: "Summons items.",
          examineText: "A strange device.",
          takeable: false,
          useActions: [
            {
              response: "A magic wand appears in your hands!",
              effects: [{ addItem: "wand" }],
            },
          ],
        },
        {
          id: "coin",
          name: "gold coin",
          description: "A shiny coin.",
          examineText: "Very valuable.",
          takeable: true,
        },
        {
          id: "altar",
          name: "stone altar",
          description: "An ancient altar.",
          examineText: "It seems to want an offering.",
          takeable: false,
          useActions: [
            {
              targetId: "coin",
              response: "You place the coin on the altar. It vanishes!",
              effects: [{ removeItem: "coin" }],
            },
          ],
        },
        {
          id: "power-source",
          name: "Power Source",
          description: "Provides power.",
          examineText: "Glowing with energy.",
          takeable: false,
          useActions: [
            {
              response: "Power activated!",
              effects: [{ set: ["HAS_POWER", true] }],
            },
          ],
        },
        {
          id: "consumer",
          name: "Consumer",
          description: "Consumes power.",
          examineText: "Needs power to work.",
          takeable: false,
          useActions: [
            {
              response: "Power consumed!",
              effects: [{ consume: "HAS_POWER" }],
            },
          ],
        },
      ],
      npcs: [],
      exits: [],
    },
  ],

  startingRoom: "lab",
  initialFlags: {
    HAS_POWER: false,
  },

  introText: "Test effects here.",
  winMessage: "Effects tested.",
  hints: [],
};
