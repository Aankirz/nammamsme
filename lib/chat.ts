export interface ChatTurn {
  role: "user" | "assistant";
  content: string;
  trace?: Array<{ tool: string; args: Record<string, unknown> }>;
  at: string;
}

export interface RememberedFact {
  id: string;
  fact: string;
  source: "user" | "document";
  at: string;
}

export interface Conversation {
  id: string;
  turns: ChatTurn[];
  startedAt: string;
}

interface ChatStore {
  conversation(id: string): Conversation;
  append(id: string, turn: ChatTurn): Conversation;
  facts(): RememberedFact[];
  remember(fact: string, source: RememberedFact["source"]): RememberedFact;
  forget(id: string): boolean;
  reset(): void;
}

const MAX_TURNS = 40;
const MAX_FACTS = 60;

function createStore(): ChatStore {
  const conversations = new Map<string, Conversation>();
  let facts: RememberedFact[] = [];
  let counter = 0;

  return {
    conversation(id) {
      const found = conversations.get(id);
      if (found) return found;

      const fresh: Conversation = { id, turns: [], startedAt: new Date().toISOString() };
      conversations.set(id, fresh);
      return fresh;
    },

    append(id, turn) {
      const current = this.conversation(id);
      const turns = [...current.turns, turn].slice(-MAX_TURNS);
      const updated = { ...current, turns };
      conversations.set(id, updated);
      return updated;
    },

    facts() {
      return [...facts];
    },

    remember(fact, source) {
      const trimmed = fact.trim();
      const existing = facts.find((f) => f.fact.toLowerCase() === trimmed.toLowerCase());
      if (existing) return existing;

      counter += 1;
      const entry: RememberedFact = {
        id: `fact_${counter}`,
        fact: trimmed,
        source,
        at: new Date().toISOString(),
      };
      facts = [...facts, entry].slice(-MAX_FACTS);
      return entry;
    },

    forget(id) {
      const before = facts.length;
      facts = facts.filter((f) => f.id !== id);
      return facts.length !== before;
    },

    reset() {
      conversations.clear();
      facts = [];
      counter = 0;
    },
  };
}

const globalChat = globalThis as unknown as { __nammamsmeChat?: ChatStore };

export const chat: ChatStore = (globalChat.__nammamsmeChat ??= createStore());
