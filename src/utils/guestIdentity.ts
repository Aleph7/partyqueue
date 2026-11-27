const GUEST_ID_KEY = "partyqueue_guest_id";
const NICKNAME_KEY = "partyqueue_nickname";

function createFallbackId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `guest_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
}

export function getGuestId(): string {
  try {
    const existing = localStorage.getItem(GUEST_ID_KEY);
    if (existing && existing.trim().length > 0) {
      return existing;
    }
    const created = createFallbackId();
    localStorage.setItem(GUEST_ID_KEY, created);
    return created;
  } catch {
    return createFallbackId();
  }
}

export function getStoredNickname(): string {
  try {
    return localStorage.getItem(NICKNAME_KEY)?.trim() ?? "";
  } catch {
    return "";
  }
}

export function setStoredNickname(nickname: string): string {
  const cleaned = nickname.trim().slice(0, 24);
  try {
    if (cleaned) {
      localStorage.setItem(NICKNAME_KEY, cleaned);
    } else {
      localStorage.removeItem(NICKNAME_KEY);
    }
  } catch {
    // Ignore storage errors in private browsing modes
  }
  return cleaned;
}
