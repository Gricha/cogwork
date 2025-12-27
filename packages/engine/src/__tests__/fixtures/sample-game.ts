import type { GameDefinition } from "../../types";

/**
 * A simple test game with 2 rooms to test engine features:
 * - Basic room navigation
 * - Item pickup and use
 * - Conditions (including AND/OR/NOT)
 * - Global triggers (derived flags)
 * - Win condition
 */
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
        id: "start-desc",
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
              // Use torch on door (requires key in inventory)
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
            id: "door-examine",
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
              // Use key on door - unlocks it
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
          direction: "north",
          targetRoomId: "treasure",
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
      exits: [
        {
          direction: "south",
          targetRoomId: "start",
        },
      ],
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

  // Global trigger: when both key and torch are in inventory, set PREPARED flag
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

/**
 * Game specifically for testing condition combinators
 */
export const conditionTestGame: GameDefinition = {
  id: "condition-test",
  name: "Condition Test Game",
  version: "1.0.0",

  rooms: [
    {
      id: "test-room",
      name: "Test Room",
      description: {
        id: "test-desc",
        fragments: [
          // Test OR condition
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
          // Test AND condition
          {
            say: "You have both items!",
            when: [
              {
                and: [{ has: "item-a" }, { has: "item-b" }],
              },
            ],
          },
          // Test NOT condition
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
          // Test turnCount condition
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
