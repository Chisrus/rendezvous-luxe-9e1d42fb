interface Profile {
  id: string;
  name: string;
  photo_url: string | null;
}

interface Message {
  id: string;
  content: string;
  created_at: string;
  sender_id: string | null;
  receiver_id: string | null;
  profile_sender_id: string | null;
  profile_receiver_id: string | null;
  read: boolean | null;
}

interface Conversation {
  profile: Profile;
  lastMessage: Message;
  unread: number;
}

interface CacheShape {
  userId: string | null;
  profiles: Record<string, Profile>;
  profilesAt: number;
  conversations: Conversation[];
  conversationsAt: number;
  messagesByProfile: Record<string, { messages: Message[]; at: number }>;
  selectedProfile: Profile | null;
}

const cache: CacheShape = {
  userId: null,
  profiles: {},
  profilesAt: 0,
  conversations: [],
  conversationsAt: 0,
  messagesByProfile: {},
  selectedProfile: null,
};

const DEFAULT_TTL_CONVERSATIONS = 60; // seconds
const DEFAULT_TTL_MESSAGES = 60; // seconds

const readTtl = (key: string, fallback: number): number => {
  if (typeof window === "undefined") return fallback * 1000;
  const raw = window.localStorage.getItem(key);
  if (!raw) return fallback * 1000;
  const n = Number(raw);
  if (!Number.isFinite(n) || n < 0) return fallback * 1000;
  return Math.min(n, 60 * 60) * 1000; // cap 1h
};

const ttlConversations = () => readTtl("cache_ttl_conversations", DEFAULT_TTL_CONVERSATIONS);
const ttlMessages = () => readTtl("cache_ttl_messages", DEFAULT_TTL_MESSAGES);

export const cacheTtlDefaults = {
  conversations: DEFAULT_TTL_CONVERSATIONS,
  messages: DEFAULT_TTL_MESSAGES,
};

const ensureUser = (userId: string) => {
  if (cache.userId !== userId) {
    cache.userId = userId;
    cache.profiles = {};
    cache.profilesAt = 0;
    cache.conversations = [];
    cache.conversationsAt = 0;
    cache.messagesByProfile = {};
    cache.selectedProfile = null;
  }
};

export const inboxCache = {
  isFresh(at: number, kind: "conversations" | "messages" = "conversations") {
    const ttl = kind === "messages" ? ttlMessages() : ttlConversations();
    if (ttl === 0) return false;
    return at > 0 && Date.now() - at < ttl;
  },
  getProfiles(userId: string) {
    ensureUser(userId);
    return { data: cache.profiles, fresh: this.isFresh(cache.profilesAt) };
  },
  setProfiles(userId: string, data: Record<string, Profile>) {
    ensureUser(userId);
    cache.profiles = data;
    cache.profilesAt = Date.now();
  },
  getConversations(userId: string) {
    ensureUser(userId);
    return { data: cache.conversations, fresh: this.isFresh(cache.conversationsAt, "conversations") };
  },
  setConversations(userId: string, data: Conversation[]) {
    ensureUser(userId);
    cache.conversations = data;
    cache.conversationsAt = Date.now();
  },
  getMessages(userId: string, profileId: string) {
    ensureUser(userId);
    const entry = cache.messagesByProfile[profileId];
    if (!entry) return { data: null as Message[] | null, fresh: false };
    return { data: entry.messages, fresh: this.isFresh(entry.at, "messages") };
  },
  setMessages(userId: string, profileId: string, messages: Message[]) {
    ensureUser(userId);
    cache.messagesByProfile[profileId] = { messages, at: Date.now() };
  },
  getSelectedProfile(userId: string) {
    ensureUser(userId);
    return cache.selectedProfile;
  },
  setSelectedProfile(userId: string, profile: Profile | null) {
    ensureUser(userId);
    cache.selectedProfile = profile;
  },
};

export type { Profile, Message, Conversation };