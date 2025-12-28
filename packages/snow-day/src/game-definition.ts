import type { GameDefinition } from "cogwork";

/**
 * Snow Day - A text-based holiday adventure game
 *
 * The player wakes up on a snowy morning and must:
 * 1. Confirm the snow day by checking the window and TV
 * 2. Gather winter gear (beanie, mittens, coat, scarf)
 * 3. Eat breakfast
 * 4. Go outside and build a snowman
 */
export const snowDay: GameDefinition = {
  id: "snow-day",
  name: "Snow Day",
  version: "1.0.0",
  description: "A text-based holiday adventure",

  startingRoom: "bedroom",

  initialFlags: {
    IS_SNOWING: false,
    SCHOOL_CLOSED: false,
    BATTERIES_TAKEN: false,
    REMOTE_POWERED: false,
    SCARF_DAMP: false,
    MITTENS_DRY: false,
    GEAR_BEANIE: false,
    GEAR_MITTENS: false,
    GEAR_COAT: false,
    GEAR_SCARF: false,
    GEAR_READY: false,
    GEAR_OUTSIDE_READY: false,
    BREAKFAST_EATEN: false,
    bucket_empty: false,
    fire_burning: true,
    snowman_state: "NONE",
    snowman_bucket: false,
    snowman_coal: false,
    snowman_carrot: false,
    SNOW_DAY_COMPLETE: false,
  },

  introText: `Welcome to the text-based holiday adventure.

Snow fell thick before the dawn,
A hush across the yard is drawn.
No buses rumble, streets lie still—
Today is yours, do what you will.

** Bedroom **`,

  winMessage: `----------------------------------------
CONGRATULATIONS

................................................................
.............................+=======--:........................
............................-:..........:-*....................
............................+............=+....................
...........................+............:==....................
..........................-=::::::::....::-:...................
.........................##:......:::==-:==:...................
........................=:..............=++=...................
......................:=...++.............#==..................
......................*....%%.....-@@......*...................
.....................:-.:-=**++=-..........+...................
.........+..-:........=....:-=+=...........*...................
..........:+=*........*....+.:.....+......:+........*..-........
.........:--+*+:.......+.....-.+.-.......-+........++==.........
...............=*:....-=:-.............:=+.......:+#*=--........
.................-++*.............:---.....*..:++-.............
...................#.........==............-++-................
..................*..........%@...........::.=:................
..................+...........................*................
..................=.........**................#................
..................*.........++...............:*................
..................=-........................:+.................
...................*-......:*%.............-*:.................
.................*...==.....-:...........:*---*................
...............+:...................:-==:......:+..............
..............*..................................*.............
.............+....................................+............
.............*....................................*............
............--....................................--...........
............--....................................--...........
.............*....................................*............
.............+...................................-+............
..............+................................:-+.............
...............*=.............................-++..............
............:::=*%=-.......................:=+%*=-::...........
...............:-=+*#*=.................-=##**+=-::............
..........................:-==++++==-:..........................

Your snowman stands ready, the winter morning finally made whole.
This playthrough took {turns} steps. Great work!
----------------------------------------
Thank you for playing our game. You can go back to https://gricha.dev/happyholidays or follow me on x.com/@gricha_91`,

  rooms: [
    {
      id: "bedroom",
      name: "Bedroom",
      description: {
        id: "bedroom-description",
        fragments: [
          {
            say: "Entering the room, you are struck by that specific, heavy silence of a cold school morning. The air feels thin and reluctant, as if the house itself hasn't quite decided to wake up yet, leave the comfort of dreams, and face the bracing chill waiting beyond the frosted window.",
            when: [{ once: "event.waking_up" }],
          },
          {
            say: "The bedroom is hushed, the usual morning bustle of the house muffled by a deep, expectant silence. A soft, blue-toned light filters in, casting long shadows across your unmade bed.",
          },
          {
            say: "The window is a solid sheet of white hoarfrost, blocking any view of the world outside. It feels cold just looking at it.",
            when: [{ falsy: "flags.IS_SNOWING" }],
            group: "window-view",
          },
          {
            say: "Through the patch you scraped clear, you can see the world transformed. Thick, heavy flakes of snow are falling steadily, burying the familiar garden in a pristine, pillowy landscape.",
            when: [{ truthy: "flags.IS_SNOWING" }],
            group: "window-view",
          },
          {
            say: "A heavy wooden desk stands in the corner, its surface cluttered with books, while a corkboard is pinned to the wall nearby. The desk has two deep drawers that look like they haven't been opened in weeks. On the floor, a worn rug provides a small island of warmth against the cold wood.",
          },
          {
            say: "The air is still, the kind of quiet that makes you notice your own breath.",
          },
        ],
      },
      items: [
        {
          id: "bedroom-window",
          name: "window",
          description: "The window is thick with frost.",
          examineText: {
            id: "bedroom-window-examine",
            fragments: [
              {
                say: "The glass is OPAQUE with frost. You could probably scrape it clear.",
                when: [{ falsy: "flags.IS_SNOWING" }],
              },
              {
                say: "A clear patch shows the world turned white, snow still falling in a slow, steady hush.",
                when: [{ truthy: "flags.IS_SNOWING" }],
              },
            ],
          },
          takeable: false,
          aliases: ["frost", "glass"],
          useActions: [
            {
              requires: [{ truthy: "flags.IS_SNOWING" }],
              response: "The frost is already scraped clear, the snow beyond quietly confirmed.",
            },
            {
              requires: [{ falsy: "flags.IS_SNOWING" }],
              response:
                "You scrape a clear patch in the frost. The world outside is falling white and slow. I wonder if school is off.",
              effects: [{ set: ["flags.IS_SNOWING", true] }],
            },
          ],
        },
        {
          id: "winter-coat",
          name: "winter coat",
          description: "A heavy winter coat is draped over a chair.",
          examineText: "A heavy coat that feels ready to wear.",
          takeable: true,
          aliases: ["coat"],
          useActions: [
            {
              response: "You shrug into the coat. The weight of it feels reassuring.",
              effects: [{ set: ["flags.GEAR_COAT", true] }],
            },
          ],
        },
        {
          id: "z-boy",
          name: "Z-Boy",
          description: "A handheld Z-Boy gaming device you found in the right desk drawer.",
          examineText: "A legendary gaming system. It seems to have some Working Batteries inside.",
          takeable: true,
          aliases: ["game", "handheld", "z-boy handheld", "handheld game"],
          location: "right-drawer",
          useActions: [
            {
              targetId: "tv-remote",
              requires: [{ falsy: "flags.BATTERIES_TAKEN" }],
              response:
                "You pop the batteries out of the Z-Boy and snap them into the remote. It blinks to life.",
              effects: [
                { set: ["flags.BATTERIES_TAKEN", true] },
                { set: ["flags.REMOTE_POWERED", true] },
                { removeItem: "working-batteries" },
              ],
            },
            {
              targetId: "tv-remote",
              requires: [{ truthy: "flags.BATTERIES_TAKEN" }],
              response: "The battery compartment is empty now.",
            },
            {
              requires: [{ truthy: "flags.BATTERIES_TAKEN" }],
              response: "The battery compartment is empty now.",
            },
            {
              requires: [{ falsy: "flags.BATTERIES_TAKEN" }],
              response:
                "You slide open the back panel and take the warm batteries out of the Z-Boy.",
              effects: [{ set: ["flags.BATTERIES_TAKEN", true] }, { addItem: "working-batteries" }],
            },
          ],
        },
        {
          id: "working-batteries",
          name: "working batteries",
          description: "A pair of AA batteries, still warm from the Z-Boy.",
          examineText: "They look fresh and ready to power something.",
          takeable: true,
          aliases: ["batteries", "battery", "aa"],
          location: "z-boy",
          useActions: [
            {
              targetId: "tv-remote",
              response: "You slide the batteries into the remote. It blinks to life.",
              effects: [
                { set: ["flags.REMOTE_POWERED", true] },
                { removeItem: "working-batteries" },
              ],
            },
          ],
        },
        {
          id: "crayon-drawing",
          name: "crayon drawing",
          description: "A colorful drawing pinned to the corkboard.",
          examineText:
            'It shows a snowy scene with a big number 42. A note at the bottom says: "Channel 42 for Snow!"',
          takeable: false,
          aliases: ["drawing", "picture"],
          location: "corkboard",
        },
        {
          id: "scarf",
          name: "scarf",
          description: "A knitted scarf is tangled in the bedsheets.",
          examineText: "A soft scarf, ready to wrap around your neck.",
          takeable: true,
          useActions: [
            {
              targetId: "bedroom-window",
              requires: [{ truthy: "flags.IS_SNOWING" }],
              response: "The frost is already scraped clear, the snow beyond quietly confirmed.",
            },
            {
              targetId: "bedroom-window",
              requires: [{ falsy: "flags.IS_SNOWING" }],
              response:
                "You scrub a clear patch with the scarf. The world outside is falling white and slow, and the scarf is left damp.",
              effects: [
                { set: ["flags.IS_SNOWING", true] },
                { set: ["flags.SCARF_DAMP", true] },
                { set: ["flags.GEAR_SCARF", false] },
              ],
            },
            {
              targetId: "mantle",
              requires: [{ truthy: "flags.SCARF_DAMP" }],
              response: "You leave the scarf on the mantle until the dampness fades.",
              effects: [{ set: ["flags.SCARF_DAMP", false] }],
            },
            {
              targetId: "mantle",
              requires: [{ falsy: "flags.SCARF_DAMP" }],
              response: "The scarf is already warm and dry.",
            },
            {
              requires: [{ truthy: "flags.SCARF_DAMP" }],
              response: "The scarf is still damp. It needs a little time on the mantle.",
            },
            {
              response: "You loop the scarf around your neck until it sits just right.",
              effects: [{ set: ["flags.GEAR_SCARF", true] }],
            },
          ],
        },
        {
          id: "desk",
          name: "desk",
          description: "A heavy wooden desk with two large drawers.",
          examineText:
            "The desk surface is a mess of schoolwork, but the two drawers below—one on the left and one on the right—look relatively undisturbed.",
          takeable: false,
          aliases: ["table", "workspace"],
        },
        {
          id: "left-drawer",
          name: "left drawer",
          description: "The left drawer of the desk.",
          examineText: {
            id: "left-drawer-examine",
            fragments: [
              {
                say: "You pull open the left drawer. It's filled with a tangle of dried-out pens, a half-empty box of paperclips, and a stack of old report cards from elementary school. Nothing useful for your current adventure.",
              },
            ],
          },
          takeable: false,
          aliases: ["left drawer", "drawer"],
          useActions: [
            {
              response: {
                id: "left-drawer-use",
                fragments: [
                  {
                    say: "You pull open the left drawer. It's filled with a tangle of dried-out pens, a half-empty box of paperclips, and a stack of old report cards from elementary school. Nothing useful for your current adventure.",
                  },
                ],
              },
            },
          ],
        },
        {
          id: "right-drawer",
          name: "right drawer",
          description: "The right drawer of the desk.",
          examineText: {
            id: "right-drawer-examine",
            fragments: [
              {
                say: "The right drawer slides open with a heavy wooden groan. Shoving aside a thick calculator and some loose-leaf paper, you spot something familiar.",
              },
              {
                say: "Your Z-Boy handheld is tucked away in the back corner, its plastic casing cool to the touch. It looks like it still has some life in it.",
                when: [{ is_at: ["z-boy", "right-drawer"] }],
              },
            ],
          },
          takeable: false,
          aliases: ["right drawer", "drawer"],
          useActions: [
            {
              response: {
                id: "right-drawer-use",
                fragments: [
                  {
                    say: "The right drawer slides open with a heavy wooden groan. Shoving aside a thick calculator and some loose-leaf paper, you spot something familiar.",
                  },
                  {
                    say: "Your Z-Boy handheld is tucked away in the back corner, its plastic casing cool to the touch. It looks like it still has some life in it.",
                    when: [{ is_at: ["z-boy", "right-drawer"] }],
                  },
                ],
              },
            },
          ],
        },
        {
          id: "corkboard",
          name: "corkboard",
          description: "A corkboard pinned with various notes and drawings.",
          examineText: {
            id: "corkboard-examine",
            fragments: [
              {
                say: "The corkboard is a messy repository of your life. Among the old movie tickets and schedule reminders, a specific crayon drawing catches your eye.",
                when: [{ is_at: ["crayon-drawing", "corkboard"] }],
              },
            ],
          },
          takeable: false,
          aliases: ["board", "wallboard"],
        },
        {
          id: "stuffed-animal",
          name: "stuffed animal",
          description: "A slightly bedraggled stuffed bear sits on your bed.",
          examineText: "Barnaby the Bear. He looks like he suggests staying in bed today.",
          takeable: false,
          takeBlockedText: "You don't think this will be useful.",
          aliases: ["bear", "toy", "barnaby"],
        },
        {
          id: "soccer-trophy",
          name: "soccer trophy",
          description: "A small gold-colored trophy sits on the windowsill.",
          examineText: '"Most Improved Player, 2023". It feels like a lifetime ago.',
          takeable: false,
          takeBlockedText: "You don't think this will be useful.",
          aliases: ["trophy", "award"],
        },
        {
          id: "rug",
          name: "rug",
          description: "A thick, braided rug lies on the floor.",
          examineText:
            "It's worn in the center, right where you stand when you first get out of bed.",
          takeable: false,
          aliases: ["carpet", "mat"],
        },
        {
          id: "snow-day-note",
          name: "snow day note",
          description: "A small note rests on the bedside table.",
          examineText:
            "Three steps are scrawled in pencil: 1) Check the bedroom window. 2) Get the official word. 3) Gear up, then build.",
          takeable: false,
          aliases: ["note", "paper", "checklist"],
        },
      ],
      npcs: [],
      exits: [
        {
          targetRoomId: "living-room",
          aliases: ["south"],
          requires: [{ truthy: "flags.IS_SNOWING" }],
          blockedMessage:
            'Your parent calls from down the hall: "Not yet. You need to get ready for school." You glance back at the window, wondering what it might show.',
        },
      ],
    },
    {
      id: "entry",
      name: "Mudroom",
      description: {
        id: "entry-description",
        fragments: [
          {
            say: "The mudroom is a narrow buffer between the warm house and the cold outside. A runner carpet dampens your footsteps, and the air here is slightly cooler, carrying the clean scent of the snow waiting beyond the door.",
          },
          {
            say: "The space doubles as the mudroom, a pragmatic buffer between the warm house and the biting cold outside. It smells faintly of rubber and wet wool.",
          },
          {
            say: "The tile underfoot is cool, the air sharp with the scent of damp wool.",
          },
          {
            say: "An old bucket sits in the corner, currently overflowing with a collection of long-forgotten, brightly colored umbrellas.",
            when: [{ present: "old-bucket" }, { falsy: "flags.bucket_empty" }],
            group: "bucket-status",
          },
          {
            say: "An old metal bucket, now empty of its umbrellas, sits waiting in the corner.",
            when: [{ present: "old-bucket" }, { truthy: "flags.bucket_empty" }],
            group: "bucket-status",
          },
          {
            say: "The corner where the bucket once sat is clear.",
            when: [{ absent: "old-bucket" }],
            group: "bucket-status",
          },
          {
            say: "A beanie and a pair of mittens are resting on one of the benches. The beanie looks ready to wear, but the mittens are damp and lonely.",
            when: [{ present: "beanie" }, { present: "mittens" }],
            group: "bench-items",
          },
          {
            say: "A beanie is resting on one of the benches, ready to wear.",
            when: [{ present: "beanie" }, { absent: "mittens" }],
            group: "bench-items",
          },
          {
            say: "A pair of mittens is resting on one of the benches, looking damp and lonely.",
            when: [{ absent: "beanie" }, { present: "mittens" }],
            group: "bench-items",
          },
          {
            say: "The bench is clear, still marked by the warmth of things recently moved.",
            when: [{ absent: "beanie" }, { absent: "mittens" }],
            group: "bench-items",
          },
        ],
      },
      items: [
        {
          id: "beanie",
          name: "beanie",
          description: "A wool beanie hat.",
          examineText: "A wool beanie that should keep your ears warm.",
          takeable: true,
          aliases: ["hat"],
          useActions: [
            {
              targetId: "snowman",
              requires: [{ eq: ["room.id", "outside"] }],
              response:
                "This hat is for you, not the snowman. It needs something sturdier, like a bucket.",
            },
            {
              response: "You pull on the beanie, and the warmth settles in right away.",
              effects: [{ set: ["flags.GEAR_BEANIE", true] }],
            },
          ],
        },
        {
          id: "mittens",
          name: "mittens",
          description: "A pair of thick mittens.",
          examineText: "They are damp and cold to the touch.",
          takeable: true,
          useActions: [
            {
              targetId: "mantle",
              requires: [{ truthy: "flags.MITTENS_DRY" }],
              response: "That is already dry and ready to go.",
            },
            {
              targetId: "mantle",
              requires: [{ falsy: "flags.MITTENS_DRY" }],
              response: "You leave the mittens on the mantle until the dampness fades.",
              effects: [{ set: ["flags.MITTENS_DRY", true] }],
            },
            {
              requires: [{ falsy: "flags.MITTENS_DRY" }],
              response: "The mittens are still damp and cold.",
            },
            {
              requires: [{ truthy: "flags.MITTENS_DRY" }],
              response:
                "You slide your hands into the mittens and flex your fingers inside the warmth.",
              effects: [{ set: ["flags.GEAR_MITTENS", true] }],
            },
          ],
        },
        {
          id: "old-bucket",
          name: "old bucket",
          description: "An old bucket sits in the corner.",
          examineText:
            "It is currently FULL_OF_UMBRELLAS. If you emptied it, it might make a good hat for a snowman.",
          takeable: true,
          aliases: ["bucket"],
          useActions: [
            {
              targetId: "snowman",
              requires: [{ eq: ["room.id", "outside"] }, { falsy: "flags.GEAR_OUTSIDE_READY" }],
              response: "You should be fully bundled before you start building.",
            },
            {
              targetId: "snowman",
              requires: [{ eq: ["room.id", "outside"] }, { falsy: "flags.bucket_empty" }],
              response: "The bucket is still full of umbrellas.",
            },
            {
              targetId: "snowman",
              requires: [
                { eq: ["room.id", "outside"] },
                { truthy: "flags.bucket_empty" },
                { eq: ["flags.snowman_state", "NONE"] },
              ],
              response: "You should start the snowman first.",
            },
            {
              targetId: "snowman",
              requires: [
                { eq: ["room.id", "outside"] },
                { truthy: "flags.bucket_empty" },
                { eq: ["flags.snowman_state", "STARTED"] },
              ],
              response: "You settle the bucket on top, and the snowman looks proud.",
              effects: [{ set: ["flags.snowman_bucket", true] }, { removeItem: "old-bucket" }],
            },
            {
              requires: [{ truthy: "flags.bucket_empty" }],
              response: "The bucket is already empty, light and ready.",
            },
            {
              requires: [{ falsy: "flags.bucket_empty" }],
              response:
                "You tip the bucket and the umbrellas spill out in a bright, clattering heap.",
              effects: [{ set: ["flags.bucket_empty", true] }],
            },
          ],
        },
      ],
      npcs: [],
      exits: [
        {
          targetRoomId: "living-room",
          aliases: ["west"],
          requires: [{ truthy: "flags.IS_SNOWING" }],
          blockedMessage:
            "The living room feels just out of reach until you know what's really happening outside.",
        },
        {
          targetRoomId: "outside",
          aliases: ["east"],
          requires: [
            { truthy: "flags.SCHOOL_CLOSED" },
            { truthy: "flags.GEAR_READY" },
            { truthy: "flags.BREAKFAST_EATEN" },
          ],
          blockedMessage: {
            id: "mudroom-outside-blocked",
            fragments: [
              {
                say: "The cold beyond the door feels like a promise you aren't quite ready to keep. You should eat breakfast first.",
                when: [{ falsy: "flags.BREAKFAST_EATEN" }],
                group: "outside-blocked",
              },
              {
                say: "The cold beyond the door feels like a promise you aren't quite ready to keep. You still need your winter gear.",
                when: [{ truthy: "flags.BREAKFAST_EATEN" }, { falsy: "flags.GEAR_READY" }],
                group: "outside-blocked",
              },
              {
                say: "The cold beyond the door feels like a promise you aren't quite ready to keep. You should make sure school is really closed.",
                when: [
                  { truthy: "flags.BREAKFAST_EATEN" },
                  { truthy: "flags.GEAR_READY" },
                  { falsy: "flags.SCHOOL_CLOSED" },
                ],
                group: "outside-blocked",
              },
            ],
          },
        },
        { targetRoomId: "bedroom", aliases: ["north"] },
      ],
    },
    {
      id: "living-room",
      name: "Living Room",
      description: {
        id: "living-room-description",
        fragments: [
          {
            say: "The living room is the warm heart of the home. Thick, cream-colored carpeting swallows the sound of your movements, and a large bay window looks out toward the front yard.",
          },
          {
            say: "A modest Christmas tree glows in the corner, its lights steady and soft.",
          },
          {
            say: "The grand stone fireplace stands cold and silent.",
            when: [{ falsy: "flags.fire_burning" }],
            group: "fireplace-status",
          },
          {
            say: "The fireplace is alive with a crackling, cheerful blaze. The dancing orange light reflects off the walls, and the stone mantle is radiating a deep, pervasive heat that makes the whole room feel safe.",
            when: [{ truthy: "flags.fire_burning" }],
            group: "fireplace-status",
          },
          {
            say: "The dark rectangle of the television sits on its stand, reflecting the room's stillness.",
            when: [{ falsy: "flags.SCHOOL_CLOSED" }],
            group: "tv-status",
          },
          {
            say: "The television is on, tuned to Channel 42. A colorful 'SCHOOL CLOSED' banner marches across the bottom of the screen in celebration of the snow.",
            when: [{ truthy: "flags.SCHOOL_CLOSED" }],
            group: "tv-status",
          },
          {
            say: "The coffee table holds the remote, and the wooden mantle above the fireplace looks like an ideal spot to set things to dry.",
          },
        ],
      },
      items: [
        {
          id: "tv",
          name: "TV",
          description: "A large television sits against the wall.",
          examineText: {
            id: "tv-examine",
            fragments: [
              {
                say: "It is currently off. You might need the remote and working batteries to turn it on.",
              },
              {
                say: "You will need to find the remote first.",
                when: [{ absent: "tv-remote" }, { lacks: "tv-remote" }],
              },
              {
                say: "The remote is on the coffee table.",
                when: [{ present: "tv-remote" }],
              },
            ],
          },
          takeable: false,
          useActions: [
            {
              requires: [{ truthy: "flags.SCHOOL_CLOSED" }],
              response: "The broadcast is already on. The banner keeps scrolling its good news.",
            },
            {
              numberAny: true,
              requires: [{ truthy: "flags.SCHOOL_CLOSED" }],
              response: "The broadcast is already on. The banner keeps scrolling its good news.",
            },
            {
              requires: [{ present: "tv-remote" }, { lacks: "tv-remote" }],
              response: "The remote is on the coffee table.",
            },
            {
              requires: [{ lacks: "tv-remote" }],
              response: "You need the remote to turn the TV on.",
            },
            {
              requires: [{ has: "tv-remote" }, { falsy: "flags.REMOTE_POWERED" }],
              response: "The remote is lifeless. It needs working batteries.",
            },
            {
              numberAny: true,
              requires: [{ has: "tv-remote" }, { falsy: "flags.REMOTE_POWERED" }],
              response: "The remote is lifeless. It needs working batteries.",
            },
            {
              requires: [{ has: "tv-remote" }, { truthy: "flags.REMOTE_POWERED" }],
              response:
                "Which channel should we check? There are hundreds of them. Perhaps there was a clue somewhere in my room.",
            },
            {
              number: 42,
              requires: [{ has: "tv-remote" }, { truthy: "flags.REMOTE_POWERED" }],
              response:
                "The TV clicks on. Channel 42 confirms the snow day, the banner marching with relief.",
              effects: [{ set: ["flags.SCHOOL_CLOSED", true] }],
            },
            {
              numberAny: true,
              requires: [{ has: "tv-remote" }, { truthy: "flags.REMOTE_POWERED" }],
              response: "You hop through a few channels, but none of them mention a snow day.",
            },
          ],
        },
        {
          id: "tv-remote",
          name: "TV remote",
          description: "The TV remote is on the coffee table.",
          examineText: {
            id: "remote-examine",
            fragments: [
              {
                say: "It seems to be DEAD. It needs fresh batteries.",
                when: [{ falsy: "flags.REMOTE_POWERED" }],
              },
              {
                say: "The remote hums faintly with power, ready to pick a channel.",
                when: [{ truthy: "flags.REMOTE_POWERED" }],
              },
            ],
          },
          takeable: true,
          aliases: ["remote"],
          useActions: [
            {
              targetId: "tv",
              requires: [{ truthy: "flags.SCHOOL_CLOSED" }],
              response: "The broadcast is already on. The banner keeps scrolling its good news.",
            },
            {
              targetId: "tv",
              numberAny: true,
              requires: [{ truthy: "flags.SCHOOL_CLOSED" }],
              response: "The broadcast is already on. The banner keeps scrolling its good news.",
            },
            {
              targetId: "tv",
              requires: [{ falsy: "flags.REMOTE_POWERED" }],
              response: "The remote is lifeless. It needs working batteries.",
            },
            {
              targetId: "tv",
              numberAny: true,
              requires: [{ falsy: "flags.REMOTE_POWERED" }],
              response: "The remote is lifeless. It needs working batteries.",
            },
            {
              targetId: "tv",
              requires: [{ truthy: "flags.REMOTE_POWERED" }],
              response:
                "Which channel should we check? There are hundreds of them. Perhaps there was a clue somewhere in my room.",
            },
            {
              targetId: "tv",
              number: 42,
              requires: [{ truthy: "flags.REMOTE_POWERED" }],
              response:
                "The TV clicks on. Channel 42 confirms the snow day, the banner marching with relief.",
              effects: [{ set: ["flags.SCHOOL_CLOSED", true] }],
            },
            {
              targetId: "tv",
              numberAny: true,
              requires: [{ truthy: "flags.REMOTE_POWERED" }],
              response: "You hop through a few channels, but none of them mention a snow day.",
            },
            {
              number: 42,
              requires: [{ truthy: "flags.REMOTE_POWERED" }],
              response:
                "The TV clicks on. Channel 42 confirms the snow day, the banner marching with relief.",
              effects: [{ set: ["flags.SCHOOL_CLOSED", true] }],
            },
            {
              numberAny: true,
              requires: [{ truthy: "flags.REMOTE_POWERED" }],
              response: "You hop through a few channels, but none of them mention a snow day.",
            },
            {
              requires: [{ truthy: "flags.SCHOOL_CLOSED" }],
              response: "The remote glows softly. The broadcast is already on.",
            },
            {
              requires: [{ falsy: "flags.REMOTE_POWERED" }],
              response: "The remote is lifeless. It needs working batteries.",
            },
            {
              requires: [{ truthy: "flags.REMOTE_POWERED" }],
              response: "You point the remote toward the TV. Which channel should we check?",
            },
          ],
        },
        {
          id: "fireplace",
          name: "fireplace",
          description: "A stone fireplace occupies the far wall.",
          examineText: "The fire is already burning, a steady warmth rolling out into the room.",
          takeable: false,
        },
        {
          id: "lump-of-coal",
          name: "lump of coal",
          description: "A small lump of coal rests on the coffee table.",
          examineText: "A potential fuel source, or maybe a snowman eye?",
          takeable: true,
          aliases: ["coal"],
          useActions: [
            {
              targetId: "bedroom-window",
              response:
                "The coal just leaves a sooty streak on the frost. It needs to be scraped clear.",
            },
            {
              targetId: "snowman",
              requires: [{ eq: ["room.id", "outside"] }, { falsy: "flags.GEAR_OUTSIDE_READY" }],
              response: "You should be fully bundled before you start building.",
            },
            {
              targetId: "snowman",
              requires: [{ eq: ["room.id", "outside"] }, { eq: ["flags.snowman_state", "NONE"] }],
              response: "You should start the snowman first.",
            },
            {
              targetId: "snowman",
              requires: [
                { eq: ["room.id", "outside"] },
                { eq: ["flags.snowman_state", "STARTED"] },
              ],
              response: "You press the coal into the snowman as eyes that catch the light.",
              effects: [{ set: ["flags.snowman_coal", true] }, { removeItem: "lump-of-coal" }],
            },
          ],
        },
        {
          id: "mantle",
          name: "mantle",
          description: "The wooden mantle above the fireplace is warm.",
          examineText: "The stone below is radiating heat. A good place to dry large items.",
          takeable: false,
        },
      ],
      npcs: [],
      exits: [
        { targetRoomId: "bedroom", aliases: ["north"] },
        { targetRoomId: "entry", aliases: ["east"] },
        { targetRoomId: "kitchen", aliases: ["west"] },
      ],
    },
    {
      id: "kitchen",
      name: "Kitchen",
      description: {
        id: "kitchen-description",
        fragments: [
          {
            say: "The kitchen is bright and bustling with the warmth of a morning in progress. The air is heavy with the irresistible scent of fresh pancakes and the sharp sweetness of maple syrup.",
          },
          {
            say: "A steaming plate of breakfast sits on the wooden table, waiting for you to sit down and eat.",
            when: [{ falsy: "flags.BREAKFAST_EATEN" }],
            group: "breakfast-status",
          },
          {
            say: "An empty plate with a few lingering syrup streaks on the table is all that remains of your morning meal.",
            when: [{ truthy: "flags.BREAKFAST_EATEN" }],
            group: "breakfast-status",
          },
          {
            say: "By the stove, a fresh carrot lies on the counter nearby, seemingly forgotten.",
          },
          {
            say: "Your parent is here, moving efficiently between the counter and the stove, occasionally glancing out the window at the mounting snow.",
          },
        ],
      },
      items: [
        {
          id: "breakfast",
          name: "breakfast",
          description: "A plate of hot breakfast sits on the table.",
          examineText: "It looks delicious. You probably should EAT BREAKFAST before heading out.",
          takeable: false,
          useActions: [
            {
              requires: [{ truthy: "flags.BREAKFAST_EATEN" }],
              response: "Only the warm memory of breakfast lingers now.",
            },
            {
              requires: [{ falsy: "flags.BREAKFAST_EATEN" }],
              response: "You sit down and eat. The warmth steadies you for the day ahead.",
              effects: [{ set: ["flags.BREAKFAST_EATEN", true] }],
            },
          ],
        },
        {
          id: "carrot",
          name: "carrot",
          description: "A fresh carrot is sitting on the counter.",
          examineText: "A perfect nose for a snowman, maybe?",
          takeable: true,
          useActions: [
            {
              targetId: "snowman",
              requires: [{ falsy: "flags.BREAKFAST_EATEN" }],
              response: "You should finish breakfast before using that.",
            },
            {
              targetId: "snowman",
              requires: [{ eq: ["room.id", "outside"] }, { falsy: "flags.GEAR_OUTSIDE_READY" }],
              response: "You should be fully bundled before you start building.",
            },
            {
              targetId: "snowman",
              requires: [{ eq: ["room.id", "outside"] }, { eq: ["flags.snowman_state", "NONE"] }],
              response: "You should start the snowman first.",
            },
            {
              targetId: "snowman",
              requires: [
                { eq: ["room.id", "outside"] },
                { eq: ["flags.snowman_state", "STARTED"] },
              ],
              response: "You set the carrot in place, and the snowman suddenly has a face.",
              effects: [{ set: ["flags.snowman_carrot", true] }, { removeItem: "carrot" }],
            },
          ],
        },
      ],
      npcs: [
        {
          id: "parent",
          name: "Parent",
          description: "Your parent is busy in the kitchen.",
          dialogue: [
            {
              when: [{ falsy: "flags.IS_SNOWING" }],
              playerLine: "Can I go outside?",
              response:
                "Not yet. You need to get ready for school. Have you looked out the window?",
            },
            {
              when: [{ truthy: "flags.IS_SNOWING" }, { falsy: "flags.SCHOOL_CLOSED" }],
              playerLine: "Can I go outside?",
              response: "Snow isn't enough. We need the official word from the news.",
            },
            {
              when: [{ truthy: "flags.IS_SNOWING" }, { falsy: "flags.SCHOOL_CLOSED" }],
              playerLine: "I scraped the window. It's snowing.",
              response: "Snow isn't enough. We need the official word from the news.",
            },
            {
              when: [{ truthy: "flags.SCHOOL_CLOSED" }, { falsy: "flags.GEAR_READY" }],
              playerLine: "What am I missing?",
              response: {
                id: "parent-gear-missing",
                fragments: [
                  {
                    say: "Beanie, mittens, coat, and scarf. Make sure everything is on and warm.",
                  },
                  {
                    say: "Oh sweetheart, you'll need to dry those mittens first.",
                    when: [{ has: "mittens" }, { falsy: "flags.MITTENS_DRY" }],
                  },
                ],
              },
            },
            {
              when: [
                { truthy: "flags.SCHOOL_CLOSED" },
                { truthy: "flags.GEAR_READY" },
                { falsy: "flags.BREAKFAST_EATEN" },
              ],
              playerLine: "I'm ready to go outside.",
              response: "Aren't you hungry? Have some breakfast first.",
            },
            {
              when: [
                { truthy: "flags.SCHOOL_CLOSED" },
                { truthy: "flags.GEAR_READY" },
                { truthy: "flags.BREAKFAST_EATEN" },
              ],
              playerLine: "I'm ready to go outside.",
              response: "Looks like it. Just be careful out there.",
            },
            {
              when: [{ truthy: "flags.SCHOOL_CLOSED" }, { falsy: "flags.GEAR_READY" }],
              playerLine: "I'm ready to go outside.",
              response: "Not quite. Make sure you've put everything on.",
            },
          ],
          aliases: ["mom", "dad"],
        },
      ],
      exits: [{ targetRoomId: "living-room", aliases: ["east"] }],
    },
    {
      id: "outside",
      name: "Outside",
      description: {
        id: "outside-description",
        fragments: [
          {
            say: "The world has been utterly transformed. A thick, heavy blanket of fresh snow has covered everything, rounding off the edges of the world and swallowing all sound in a profound, peaceful silence.",
          },
          {
            say: "The front yard is a pristine, untouched sheet of white, waiting for the first mark of a winter project.",
            when: [{ eq: ["flags.snowman_state", "NONE"] }],
            group: "snowman-status",
          },
          {
            say: "A packed base of snow stands in the center of the yard, waiting for a face and a hat.",
            when: [{ eq: ["flags.snowman_state", "STARTED"] }],
            group: "snowman-status",
          },
          {
            say: "The top is bare, waiting for a hat.",
            when: [{ eq: ["flags.snowman_state", "STARTED"] }, { falsy: "flags.snowman_bucket" }],
            group: "snowman-hat",
          },
          {
            say: "The face is still blank, missing eyes.",
            when: [{ eq: ["flags.snowman_state", "STARTED"] }, { falsy: "flags.snowman_coal" }],
            group: "snowman-eyes",
          },
          {
            say: "It still needs a nose.",
            when: [{ eq: ["flags.snowman_state", "STARTED"] }, { falsy: "flags.snowman_carrot" }],
            group: "snowman-nose",
          },
          {
            say: "A magnificent snowman stands proudly in the yard, complete with his coal eyes, carrot nose, and bucket hat. He seems to be watching over the snowy landscape with a quiet, frozen joy.",
            when: [{ eq: ["flags.snowman_state", "FINISHED"] }],
            group: "snowman-status",
          },
          {
            say: "The fence is sprinkled with powder, and the yard feels like it is holding its breath.",
          },
        ],
      },
      items: [
        {
          id: "snowman",
          name: "snowman",
          description: {
            id: "snowman-description",
            fragments: [
              {
                say: "A clear patch of snow waits for you to shape the first base.",
                when: [{ eq: ["flags.snowman_state", "NONE"] }],
              },
              {
                say: "A rounded base of packed snow stands steady, ready to become someone.",
                when: [{ eq: ["flags.snowman_state", "STARTED"] }],
              },
              {
                say: "The top is bare, waiting for a hat.",
                when: [
                  { eq: ["flags.snowman_state", "STARTED"] },
                  { falsy: "flags.snowman_bucket" },
                ],
                group: "snowman-desc-hat",
              },
              {
                say: "The face still needs eyes.",
                when: [{ eq: ["flags.snowman_state", "STARTED"] }, { falsy: "flags.snowman_coal" }],
                group: "snowman-desc-eyes",
              },
              {
                say: "It still needs a nose.",
                when: [
                  { eq: ["flags.snowman_state", "STARTED"] },
                  { falsy: "flags.snowman_carrot" },
                ],
                group: "snowman-desc-nose",
              },
              {
                say: "A finished snowman stands proudly in the yard.",
                when: [{ eq: ["flags.snowman_state", "FINISHED"] }],
              },
            ],
          },
          examineText: {
            id: "snowman-examine",
            fragments: [
              {
                say: "It is only a base for now, waiting for a face and a hat.",
                when: [{ eq: ["flags.snowman_state", "STARTED"] }],
              },
              {
                say: "The top is bare, waiting for a hat.",
                when: [
                  { eq: ["flags.snowman_state", "STARTED"] },
                  { falsy: "flags.snowman_bucket" },
                ],
              },
              {
                say: "The face still needs eyes.",
                when: [{ eq: ["flags.snowman_state", "STARTED"] }, { falsy: "flags.snowman_coal" }],
              },
              {
                say: "It still needs a nose.",
                when: [
                  { eq: ["flags.snowman_state", "STARTED"] },
                  { falsy: "flags.snowman_carrot" },
                ],
              },
              {
                say: "There is no snowman yet, just a clean patch of snow waiting to be shaped.",
                when: [{ eq: ["flags.snowman_state", "NONE"] }],
              },
              {
                say: "Coal eyes, a carrot nose, and a bucket hat sit in quiet balance. It feels complete.",
                when: [{ eq: ["flags.snowman_state", "FINISHED"] }],
              },
            ],
          },
          takeable: false,
          useActions: [
            {
              requires: [{ ne: ["room.id", "outside"] }],
              response: "There's no snow here to work with.",
            },
            {
              requires: [{ eq: ["flags.snowman_state", "FINISHED"] }],
              response: "The snowman is already complete, watching the yard in quiet satisfaction.",
            },
            {
              requires: [{ eq: ["flags.snowman_state", "STARTED"] }],
              response: "The base is ready. It needs a few finishing touches.",
            },
            {
              requires: [{ eq: ["flags.snowman_state", "NONE"] }],
              response: "You pack the snow into a solid base, the beginning of a snowman.",
              effects: [{ set: ["flags.snowman_state", "STARTED"] }],
            },
          ],
        },
      ],
      npcs: [],
      triggers: [
        {
          id: "snowman-complete",
          when: [
            { truthy: "flags.snowman_carrot" },
            { truthy: "flags.snowman_coal" },
            { truthy: "flags.snowman_bucket" },
            { ne: ["flags.snowman_state", "FINISHED"] },
          ],
          effects: [
            { set: ["flags.snowman_state", "FINISHED"] },
            { set: ["flags.SNOW_DAY_COMPLETE", true] },
            { set: ["won", true] },
            { set: ["gameOver", true] },
          ],
        },
      ],
      exits: [{ targetRoomId: "entry", aliases: ["west", "inside"] }],
    },
  ],

  hints: [
    {
      id: "hint-window",
      text: "The window is still frosted over. Maybe start there.",
      when: [{ falsy: "flags.IS_SNOWING" }],
    },
    {
      id: "hint-batteries",
      text: "In your room, something small and handheld still hums with borrowed power. It might be useful.",
      when: [{ truthy: "flags.IS_SNOWING" }, { falsy: "flags.BATTERIES_TAKEN" }],
    },
    {
      id: "hint-remote-power",
      text: "The TV remote feels lifeless. It needs working batteries.",
      when: [{ truthy: "flags.BATTERIES_TAKEN" }, { falsy: "flags.REMOTE_POWERED" }],
    },
    {
      id: "hint-channel",
      text: "The corkboard drawing might point to the right channel.",
      when: [{ truthy: "flags.REMOTE_POWERED" }, { falsy: "flags.SCHOOL_CLOSED" }],
    },
    {
      id: "hint-gear",
      text: "You are not fully bundled yet.",
      when: [{ truthy: "flags.SCHOOL_CLOSED" }, { falsy: "flags.GEAR_READY" }],
    },
    {
      id: "hint-breakfast",
      text: "A warm breakfast might still be expected before going out.",
      when: [{ truthy: "flags.GEAR_READY" }, { falsy: "flags.BREAKFAST_EATEN" }],
    },
    {
      id: "hint-snowman-base",
      text: "The yard is waiting for a packed base of snow.",
      when: [
        { truthy: "flags.GEAR_READY" },
        { truthy: "flags.BREAKFAST_EATEN" },
        { eq: ["flags.snowman_state", "NONE"] },
      ],
    },
    {
      id: "hint-snowman-nose",
      text: "It still needs a nose.",
      when: [{ eq: ["flags.snowman_state", "STARTED"] }, { falsy: "flags.snowman_carrot" }],
    },
    {
      id: "hint-snowman-eyes",
      text: "It still needs eyes.",
      when: [{ eq: ["flags.snowman_state", "STARTED"] }, { falsy: "flags.snowman_coal" }],
    },
    {
      id: "hint-snowman-hat",
      text: "It still needs a hat.",
      when: [{ eq: ["flags.snowman_state", "STARTED"] }, { falsy: "flags.snowman_bucket" }],
    },
  ],

  globalTriggers: [
    {
      id: "gear-ready",
      when: [
        {
          and: [
            { truthy: "flags.GEAR_BEANIE" },
            { truthy: "flags.GEAR_MITTENS" },
            { truthy: "flags.GEAR_COAT" },
            { truthy: "flags.GEAR_SCARF" },
            { falsy: "flags.GEAR_READY" },
          ],
        },
      ],
      effects: [{ set: ["flags.GEAR_READY", true] }, { set: ["flags.GEAR_OUTSIDE_READY", true] }],
    },
  ],
};
