import type {
  GameDefinition,
  GameState,
  Room,
  Item,
  NPC,
  Exit,
  DescriptionFragment,
  Condition,
  Effect,
  Scalar,
  UseAction,
  Trigger,
  TextOrDescriptive,
} from "./types";
import { GameDefinitionSchema } from "./schemas/index";

type ConditionResult = { pass: boolean; onceMarks: string[] };

export interface GameEngineOptions {
  skipValidation?: boolean;
}

export class GameEngine {
  private readonly definition: GameDefinition;
  private state: GameState;

  constructor(definition: GameDefinition, options: GameEngineOptions = {}) {
    if (!options.skipValidation) {
      const result = GameDefinitionSchema.safeParse(definition);
      if (!result.success) {
        throw new Error(`Invalid game definition: ${result.error.message}`);
      }
      this.definition = result.data as GameDefinition;
    } else {
      this.definition = definition;
    }

    if (!this.definition.rooms.find((r) => r.id === this.definition.startingRoom)) {
      throw new Error(`Starting room "${this.definition.startingRoom}" not found in rooms`);
    }

    this.state = this.getInitialState();
  }

  private getInitialState(): GameState {
    return {
      currentRoomId: this.definition.startingRoom,
      inventoryIds: [],
      takenItemIds: [],
      flags: { ...this.definition.initialFlags },
      visitedRooms: [],
      gameOver: false,
      won: false,
      turnCount: 0,
      once: [],
    };
  }

  private getRoomById(id: string): Room | undefined {
    return this.definition.rooms.find((room) => room.id === id);
  }

  private getCurrentRoom(): Room {
    const room = this.getRoomById(this.state.currentRoomId);
    if (!room) throw new Error(`Room not found: ${this.state.currentRoomId}`);
    return room;
  }

  private getRoomItems(room: Room): Item[] {
    return room.items.filter(
      (item) => !this.state.takenItemIds.includes(item.id) && !item.location,
    );
  }

  private getAllRoomItems(room: Room): Item[] {
    return room.items.filter((item) => !this.state.takenItemIds.includes(item.id));
  }

  private getItemById(itemId: string): Item | undefined {
    for (const room of this.definition.rooms) {
      const item = room.items.find((i) => i.id === itemId);
      if (item) return item;
    }
    return undefined;
  }

  private getInventoryItems(): Item[] {
    return this.state.inventoryIds
      .map((id) => this.getItemById(id))
      .filter((item): item is Item => item !== undefined);
  }

  private searchItemsByName(items: Item[], name: string): Item | undefined {
    const lowerName = name.toLowerCase();
    const exact = items.find(
      (item) =>
        item.name.toLowerCase() === lowerName ||
        item.aliases?.some((alias) => alias.toLowerCase() === lowerName),
    );
    if (exact) return exact;

    return items.find(
      (item) =>
        item.name.toLowerCase().includes(lowerName) ||
        item.aliases?.some((alias) => alias.toLowerCase().includes(lowerName)),
    );
  }

  private findItemInRoom(name: string): Item | undefined {
    return this.searchItemsByName(this.getAllRoomItems(this.getCurrentRoom()), name);
  }

  private findVisibleItemInRoom(name: string): Item | undefined {
    return this.searchItemsByName(this.getRoomItems(this.getCurrentRoom()), name);
  }

  private findItemInInventory(name: string): Item | undefined {
    return this.searchItemsByName(this.getInventoryItems(), name);
  }

  private findNPC(name: string): NPC | undefined {
    const room = this.getCurrentRoom();
    const lowerName = name.toLowerCase();
    return room.npcs.find(
      (npc) =>
        npc.name.toLowerCase().includes(lowerName) ||
        npc.aliases?.some((alias) => alias.toLowerCase().includes(lowerName)),
    );
  }

  private getAvailableDialogue(npc: NPC): NPC["dialogue"] {
    return npc.dialogue.filter((line) => {
      const { pass } = this.conditionsPass(line.when);
      return pass;
    });
  }

  private incrementTurn(): void {
    if (this.state.gameOver) return;
    this.state.turnCount++;
  }

  private hasItem(itemId: string): boolean {
    return this.state.inventoryIds.includes(itemId);
  }

  private removeInventoryItem(itemId: string): void {
    this.state.inventoryIds = this.state.inventoryIds.filter((id) => id !== itemId);
  }

  private getFlag(path: string): Scalar | undefined {
    return this.state.flags[path];
  }

  private setFlag(path: string, value: Scalar = true): void {
    this.state.flags[path] = value;
  }

  private hasOnce(path: string): boolean {
    return this.state.once.includes(path);
  }

  private markOnce(path: string): void {
    if (!this.hasOnce(path)) {
      this.state.once.push(path);
    }
  }

  private getPathValue(path: string): Scalar | undefined {
    if (path === "room" || path === "room.id") {
      return this.state.currentRoomId;
    }

    if (path === "won") {
      return this.state.won;
    }

    if (path === "gameOver") {
      return this.state.gameOver;
    }

    if (path === "turnCount") {
      return this.state.turnCount;
    }

    if (path.startsWith("flags.")) {
      return this.getFlag(path.slice("flags.".length));
    }

    if (path.startsWith("event.")) {
      return this.getFlag(path);
    }

    return this.getFlag(path);
  }

  private setPathValue(path: string, value: Scalar): void {
    if (path === "won") {
      this.state.won = Boolean(value);
      return;
    }

    if (path === "gameOver") {
      this.state.gameOver = Boolean(value);
      return;
    }

    if (path.startsWith("flags.")) {
      this.setFlag(path.slice("flags.".length), value);
      return;
    }

    this.setFlag(path, value);
  }

  private evaluateCondition(condition: Condition): ConditionResult {
    if ("and" in condition) {
      return this.evaluateAnd(condition.and);
    }

    if ("or" in condition) {
      return this.evaluateOr(condition.or);
    }

    if ("not" in condition) {
      return this.evaluateNot(condition.not);
    }

    if ("once" in condition) {
      const seen = this.hasOnce(condition.once);
      return { pass: !seen, onceMarks: seen ? [] : [condition.once] };
    }

    if ("truthy" in condition) {
      return { pass: Boolean(this.getPathValue(condition.truthy)), onceMarks: [] };
    }

    if ("falsy" in condition) {
      return { pass: !this.getPathValue(condition.falsy), onceMarks: [] };
    }

    if ("has" in condition) {
      return { pass: this.hasItem(condition.has), onceMarks: [] };
    }

    if ("lacks" in condition) {
      return { pass: !this.hasItem(condition.lacks), onceMarks: [] };
    }

    if ("eq" in condition) {
      const [path, value] = condition.eq;
      return { pass: this.getPathValue(path) === value, onceMarks: [] };
    }

    if ("ne" in condition) {
      const [path, value] = condition.ne;
      return { pass: this.getPathValue(path) !== value, onceMarks: [] };
    }

    if ("gt" in condition) {
      const [path, value] = condition.gt;
      return { pass: Number(this.getPathValue(path)) > value, onceMarks: [] };
    }

    if ("gte" in condition) {
      const [path, value] = condition.gte;
      return { pass: Number(this.getPathValue(path)) >= value, onceMarks: [] };
    }

    if ("lt" in condition) {
      const [path, value] = condition.lt;
      return { pass: Number(this.getPathValue(path)) < value, onceMarks: [] };
    }

    if ("lte" in condition) {
      const [path, value] = condition.lte;
      return { pass: Number(this.getPathValue(path)) <= value, onceMarks: [] };
    }

    if ("present" in condition) {
      return { pass: this.isObjectPresent(condition.present), onceMarks: [] };
    }

    if ("absent" in condition) {
      return { pass: !this.isObjectPresent(condition.absent), onceMarks: [] };
    }

    if ("is_at" in condition) {
      const [itemId, locationId] = condition.is_at;
      return { pass: this.isItemAt(itemId, locationId), onceMarks: [] };
    }

    return { pass: false, onceMarks: [] };
  }

  private evaluateAnd(conditions: Condition[]): ConditionResult {
    const onceMarks: string[] = [];

    for (const condition of conditions) {
      const result = this.evaluateCondition(condition);
      if (!result.pass) {
        return { pass: false, onceMarks: [] };
      }
      onceMarks.push(...result.onceMarks);
    }

    return { pass: true, onceMarks };
  }

  private evaluateOr(conditions: Condition[]): ConditionResult {
    for (const condition of conditions) {
      const result = this.evaluateCondition(condition);
      if (result.pass) {
        return { pass: true, onceMarks: result.onceMarks };
      }
    }

    return { pass: false, onceMarks: [] };
  }

  private evaluateNot(condition: Condition): ConditionResult {
    const result = this.evaluateCondition(condition);
    return { pass: !result.pass, onceMarks: [] };
  }

  private isObjectPresent(path: string): boolean {
    const room = this.getCurrentRoom();
    const itemId = path.includes(".") ? path.split(".").pop() || path : path;
    const item = room.items.find((candidate) => candidate.id === itemId);
    if (!item) return false;
    return !this.state.takenItemIds.includes(item.id);
  }

  private isItemAt(itemId: string, locationId: string): boolean {
    const room = this.getCurrentRoom();
    const item = room.items.find((candidate) => candidate.id === itemId);
    if (!item) return false;
    if (this.state.takenItemIds.includes(itemId)) return false;
    if (this.state.inventoryIds.includes(itemId)) return false;

    const itemLocation = item.location ?? room.id;
    return itemLocation === locationId;
  }

  private conditionsPass(conditions?: Condition[]): ConditionResult {
    if (!conditions || conditions.length === 0) return { pass: true, onceMarks: [] };

    const onceMarks: string[] = [];
    for (const condition of conditions) {
      const result = this.evaluateCondition(condition);
      if (!result.pass) return { pass: false, onceMarks: [] };
      onceMarks.push(...result.onceMarks);
    }

    return { pass: true, onceMarks };
  }

  private applyEffect(effect: Effect): void {
    if ("set" in effect) {
      const [path, value] = effect.set;
      this.setPathValue(path, value);
    }

    if ("consume" in effect) {
      this.setPathValue(effect.consume, false);
    }

    if ("markOnce" in effect) {
      this.markOnce(effect.markOnce);
    }

    if ("addItem" in effect) {
      const itemId = effect.addItem;
      if (!this.state.inventoryIds.includes(itemId)) {
        this.state.inventoryIds.push(itemId);
      }
      if (!this.state.takenItemIds.includes(itemId)) {
        this.state.takenItemIds.push(itemId);
      }
    }

    if ("removeItem" in effect) {
      this.removeInventoryItem(effect.removeItem);
    }

    if ("add" in effect) {
      const [path, amount] = effect.add;
      const current = Number(this.getPathValue(path)) || 0;
      this.setPathValue(path, current + amount);
    }

    if ("subtract" in effect) {
      const [path, amount] = effect.subtract;
      const current = Number(this.getPathValue(path)) || 0;
      this.setPathValue(path, current - amount);
    }
  }

  private applyEffects(effects?: Effect[]): void {
    if (!effects) return;

    for (const effect of effects) {
      this.applyEffect(effect);
    }

    this.processGlobalTriggers();
  }

  private processGlobalTriggers(): void {
    if (!this.definition.globalTriggers) return;

    for (const trigger of this.definition.globalTriggers) {
      const { pass, onceMarks } = this.conditionsPass(trigger.when);
      if (!pass) continue;

      for (const mark of onceMarks) {
        this.markOnce(mark);
      }

      if (trigger.effects) {
        for (const effect of trigger.effects) {
          this.applyEffect(effect);
        }
      }
    }
  }

  private applyRoomTriggers(triggers?: Trigger[]): void {
    if (!triggers || triggers.length === 0) return;
    for (const trigger of triggers) {
      const { pass } = this.conditionsPass(trigger.when);
      if (!pass) continue;
      this.applyEffects(trigger.effects);
    }
  }

  private renderFragments(fragments: DescriptionFragment[]): string {
    const passing: Array<{ fragment: DescriptionFragment; onceMarks: string[] }> = [];
    for (const fragment of fragments) {
      const { pass, onceMarks } = this.conditionsPass(fragment.when);
      if (!pass) continue;
      passing.push({ fragment, onceMarks });
    }

    if (passing.length === 0) return "";

    const maxPriority = Math.max(...passing.map((entry) => entry.fragment.priority ?? 0));

    const usedGroups = new Set<string>();
    const lines: string[] = [];

    for (const entry of passing) {
      const fragment = entry.fragment;
      const priority = fragment.priority ?? 0;
      if (priority !== maxPriority) continue;
      if (fragment.group) {
        if (usedGroups.has(fragment.group)) continue;
        usedGroups.add(fragment.group);
      }

      lines.push(fragment.say);
      entry.onceMarks.forEach((path) => this.markOnce(path));
    }

    return lines.join("\n\n");
  }

  private renderText(text: TextOrDescriptive): string {
    if (typeof text === "string") return this.interpolateText(text);
    return this.interpolateText(this.renderFragments(text.fragments));
  }

  private interpolateText(text: string): string {
    return text.replaceAll("{turns}", String(this.state.turnCount));
  }

  private getHintText(): string | null {
    for (const hint of this.definition.hints) {
      const { pass } = this.conditionsPass(hint.when);
      if (!pass) continue;
      return this.renderText(hint.text);
    }
    return null;
  }

  private findUseAction(
    item: Item,
    target: Item | undefined,
    number?: number,
  ): { action: UseAction; onceMarks: string[] } | null {
    const actions = item.useActions || [];
    for (const action of actions) {
      if (action.targetId) {
        if (!target || target.id !== action.targetId) continue;
      } else if (target) {
        continue;
      }

      if (number !== undefined) {
        if (action.number !== undefined && action.number !== number) continue;
        if (action.number === undefined && !action.numberAny) continue;
      } else if (action.number !== undefined || action.numberAny) {
        continue;
      }

      const { pass, onceMarks } = this.conditionsPass(action.requires);
      if (!pass) continue;
      return { action, onceMarks };
    }

    return null;
  }

  private describeCurrentRoom(): string {
    const room = this.getCurrentRoom();
    this.applyRoomTriggers(room.triggers);
    const roomItems = this.getRoomItems(room);
    const description = this.renderText(room.description);

    let output = `** ${room.name} **\n\n${description}`;

    if (roomItems.length > 0) {
      output += `\n\nYou see: ${roomItems.map((item) => item.name).join(", ")}`;
    }

    if (room.npcs.length > 0) {
      output += `\n\nPresent: ${room.npcs.map((npc) => npc.name).join(", ")}`;
    }

    const exitLabels = room.exits.map((exit) => {
      const targetRoom = this.getRoomById(exit.targetRoomId);
      const name = targetRoom ? targetRoom.name : exit.targetRoomId;
      let blocked = false;

      if (exit.requires) {
        const { pass } = this.conditionsPass(exit.requires);
        if (!pass) blocked = true;
      }

      if (exit.locked) {
        if (!exit.requiredItem || !this.hasItem(exit.requiredItem)) {
          blocked = true;
        }
      }

      return blocked ? `${name} (blocked)` : name;
    });

    output += `\n\nExits: ${exitLabels.length > 0 ? exitLabels.join(", ") : "none"}`;

    return output;
  }

  startGame(): string {
    this.state = this.getInitialState();
    this.state.visitedRooms.push(this.state.currentRoomId);

    const intro = this.renderText(this.definition.introText);
    return intro + "\n\n" + this.describeCurrentRoom();
  }

  look(target?: string): string {
    this.incrementTurn();
    if (this.state.gameOver) {
      return this.renderText(this.definition.winMessage);
    }

    if (!target) {
      return this.describeCurrentRoom();
    }

    const item = this.findItemInRoom(target) || this.findItemInInventory(target);
    if (item) {
      return `** ${item.name} **\n\n${this.renderText(item.examineText)}`;
    }

    const npc = this.findNPC(target);
    if (npc) {
      return `${npc.description}`;
    }

    return `You don't see any "${target}" here.`;
  }

  private findExit(input: string): Exit | undefined {
    const room = this.getCurrentRoom();
    const normalized = input.toLowerCase().trim();

    const byAlias = room.exits.find((e) =>
      e.aliases?.some((alias) => alias.toLowerCase() === normalized),
    );
    if (byAlias) return byAlias;

    const targetRoom = this.definition.rooms.find(
      (r) => r.id.toLowerCase() === normalized || r.name.toLowerCase() === normalized,
    );
    if (targetRoom) {
      return room.exits.find((e) => e.targetRoomId === targetRoom.id);
    }

    return undefined;
  }

  private canUseExit(exit: Exit): { allowed: boolean; message?: string } {
    if (exit.requires) {
      const { pass } = this.conditionsPass(exit.requires);
      if (!pass) {
        const message = exit.blockedMessage ? this.renderText(exit.blockedMessage) : undefined;
        return { allowed: false, message };
      }
    }

    if (exit.locked && !(exit.requiredItem && this.hasItem(exit.requiredItem))) {
      const message = exit.blockedMessage ? this.renderText(exit.blockedMessage) : undefined;
      return { allowed: false, message };
    }

    return { allowed: true };
  }

  go(direction: string): string {
    this.incrementTurn();
    if (this.state.gameOver) {
      return this.renderText(this.definition.winMessage);
    }

    const exit = this.findExit(direction);
    if (!exit) {
      return `You can't go ${direction} from here.`;
    }

    const { allowed, message } = this.canUseExit(exit);
    if (!allowed) {
      return message || `You can't go ${direction} right now.`;
    }

    this.state.currentRoomId = exit.targetRoomId;
    if (!this.state.visitedRooms.includes(exit.targetRoomId)) {
      this.state.visitedRooms.push(exit.targetRoomId);
    }

    return this.describeCurrentRoom();
  }

  take(itemName: string): string {
    this.incrementTurn();
    if (this.state.gameOver) {
      return this.renderText(this.definition.winMessage);
    }
    const item = this.findItemInRoom(itemName);

    if (!item) {
      return `You don't see any "${itemName}" here to take.`;
    }

    if (!item.takeable) {
      return item.takeBlockedText || `You can't take the ${item.name}.`;
    }

    if (item.takeWhen) {
      const { pass } = this.conditionsPass(item.takeWhen);
      if (!pass) {
        return item.takeBlockedText || `You can't take the ${item.name} right now.`;
      }
    }

    this.state.takenItemIds.push(item.id);
    this.state.inventoryIds.push(item.id);

    if (item.onTake) {
      this.applyEffects(item.onTake);
    } else {
      this.processGlobalTriggers();
    }

    if (item.onTakeText) {
      return this.renderText(item.onTakeText);
    }

    return `You pick up the ${item.name}.`;
  }

  examine(target: string): string {
    this.incrementTurn();
    if (this.state.gameOver) {
      return this.renderText(this.definition.winMessage);
    }
    const item = this.findItemInRoom(target) || this.findItemInInventory(target);

    if (item) {
      return `** ${item.name} **\n\n${this.renderText(item.examineText)}`;
    }

    const npc = this.findNPC(target);
    if (npc) {
      return `${npc.description}`;
    }

    return `You don't see any "${target}" to examine.`;
  }

  talk(characterName: string): string {
    this.incrementTurn();
    if (this.state.gameOver) {
      return this.renderText(this.definition.winMessage);
    }
    const npc = this.findNPC(characterName);

    if (!npc) {
      return `There's no one called "${characterName}" here to talk to.`;
    }

    const availableDialogue = this.getAvailableDialogue(npc);

    if (availableDialogue.length === 0) {
      return `${npc.name} has nothing more to say.`;
    }

    let response = `You approach ${npc.name}.\n\n`;
    response += "What would you like to say?\n\n";
    availableDialogue.forEach((line, index) => {
      response += `${index + 1}. "${line.playerLine}"\n`;
    });
    response += `\n(Use: talk ${characterName.toLowerCase()} [number] to choose)`;

    return response;
  }

  talkOption(characterName: string, optionNum: number): string {
    this.incrementTurn();
    if (this.state.gameOver) {
      return this.renderText(this.definition.winMessage);
    }
    const npc = this.findNPC(characterName);

    if (!npc) {
      return `There's no one called "${characterName}" here to talk to.`;
    }

    const availableDialogue = this.getAvailableDialogue(npc);

    const option = availableDialogue[optionNum - 1];
    if (!option) {
      return `Invalid dialogue option. Please choose a number from 1-${availableDialogue.length}.`;
    }

    let response = `You: "${option.playerLine}"\n\n${this.renderText(option.response)}`;

    if (option.effects) {
      this.applyEffects(option.effects);
    }

    if (this.state.won) {
      response += `\n\nYou feel a quiet certainty settle in.\n\nTurns taken: ${this.state.turnCount}`;
    }

    return response;
  }

  use(itemName: string, targetName?: string, number?: number): string {
    this.incrementTurn();
    if (this.state.gameOver) {
      return this.renderText(this.definition.winMessage);
    }
    const lowerName = itemName.toLowerCase();
    const roomItems = this.getRoomItems(this.getCurrentRoom());
    const exactRoomItem = roomItems.find(
      (roomItem) =>
        roomItem.name.toLowerCase() === lowerName ||
        roomItem.aliases?.some((alias) => alias.toLowerCase() === lowerName),
    );
    const inventoryItems = this.getInventoryItems();
    const exactInventoryItem = inventoryItems.find(
      (inventoryItem) =>
        inventoryItem.name.toLowerCase() === lowerName ||
        inventoryItem.aliases?.some((alias) => alias.toLowerCase() === lowerName),
    );
    const item =
      exactRoomItem ||
      exactInventoryItem ||
      this.findItemInInventory(itemName) ||
      this.findVisibleItemInRoom(itemName);

    if (!item) {
      return `You don't see any "${itemName}" to use.`;
    }

    const target = targetName
      ? this.findVisibleItemInRoom(targetName) || this.findItemInInventory(targetName)
      : undefined;

    const wasWon = this.state.won;
    let match = this.findUseAction(item, target, number);
    if (!match && target) {
      match = this.findUseAction(target, item, number);
    }
    if (match) {
      match.onceMarks.forEach((path) => this.markOnce(path));
      if (match.action.effects) {
        this.applyEffects(match.action.effects);
      }
      this.applyRoomTriggers(this.getCurrentRoom().triggers);
      const response = this.renderText(match.action.response);
      if (!wasWon && this.state.won) {
        return this.renderText(this.definition.winMessage);
      }
      return response;
    }

    return `You're not sure how to use the ${item.name}${targetName ? ` on ${targetName}` : ""}.`;
  }

  inventory(): string {
    if (this.state.gameOver) {
      return this.renderText(this.definition.winMessage);
    }
    const items = this.getInventoryItems();
    if (items.length === 0) {
      return "You're not carrying anything.";
    }

    return `You are carrying:\n${items.map((item) => `- ${item.name}`).join("\n")}`;
  }

  getStatus(): object {
    return {
      room: this.getCurrentRoom().name,
      roomId: this.state.currentRoomId,
      inventory: this.getInventoryItems().map((item) => item.name),
      turns: this.state.turnCount,
      gameOver: this.state.gameOver,
      won: this.state.won,
      flags: this.state.flags,
    };
  }

  getStatusMessage(): string {
    if (this.state.gameOver) {
      return this.renderText(this.definition.winMessage);
    }
    const inventory = this.getInventoryItems().map((item) => item.name);
    const room = this.getCurrentRoom();
    const lines = [
      `Location: ${room.name}`,
      `Turns: ${this.state.turnCount}`,
      `Inventory: ${inventory.length > 0 ? inventory.join(", ") : "empty"}`,
      `Won: ${this.state.won ? "yes" : "no"}`,
    ];

    return lines.join("\n");
  }

  hint(): string {
    this.incrementTurn();
    const hint = this.getHintText();
    return hint ?? "No hint comes to mind right now.";
  }

  isGameOver(): boolean {
    return this.state.gameOver;
  }

  hasWon(): boolean {
    return this.state.won;
  }

  serialize(): string {
    return JSON.stringify(this.state);
  }

  static deserialize(
    definition: GameDefinition,
    data: string | object,
    options: GameEngineOptions = {},
  ): GameEngine {
    const engine = new GameEngine(definition, options);
    const parsed = typeof data === "string" ? JSON.parse(data) : data;
    engine.state = {
      currentRoomId: parsed.currentRoomId ?? definition.startingRoom,
      inventoryIds: parsed.inventoryIds || [],
      takenItemIds: parsed.takenItemIds || [],
      flags: { ...definition.initialFlags, ...parsed.flags },
      visitedRooms: parsed.visitedRooms || [],
      gameOver: parsed.gameOver || false,
      won: parsed.won || false,
      turnCount: parsed.turnCount || 0,
      once: parsed.once || [],
    };
    return engine;
  }

  static create(definition: unknown): GameEngine {
    const validated = GameDefinitionSchema.parse(definition);
    return new GameEngine(validated as GameDefinition, { skipValidation: true });
  }
}
