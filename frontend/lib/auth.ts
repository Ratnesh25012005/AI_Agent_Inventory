/**
 * lib/auth.ts
 * Single source of truth for all auth token operations.
 * Used by AuthGuard, api.ts, and login page.
 */

const TOKEN_KEY   = "token";
const EMAIL_KEY   = "user_email";
const NAME_KEY    = "user_name";
const DATASET_KEY = "active_dataset_id";

/** Key used to persist a user's active dataset across sessions. */
const userDatasetKey = (email: string) => `ds:${email.toLowerCase().trim()}`;

/** Returns the raw token string, or null if not set. */
export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
}

/** Returns true if a non-empty token exists in localStorage. */
export function isAuthenticated(): boolean {
  const token = getToken();
  return !!token && token.trim().length > 0;
}

/**
 * Persist a login session.
 *
 * Restores the user's previously active dataset automatically:
 *   - Same email → restore their old active_dataset_id (data stays!)
 *   - Different email → clear active_dataset_id (fresh workspace)
 */
export function setSession(token: string, email: string, name?: string) {
  const cleanEmail = email.toLowerCase().trim();
  const prevEmail  = (localStorage.getItem(EMAIL_KEY) || "").toLowerCase().trim();

  // --- Save current dataset for the PREVIOUS user before switching ---
  if (prevEmail && prevEmail !== cleanEmail) {
    const currentDs = localStorage.getItem(DATASET_KEY);
    if (currentDs) {
      localStorage.setItem(userDatasetKey(prevEmail), currentDs);
    }
    // Clear the shared key so the new user starts fresh
    localStorage.removeItem(DATASET_KEY);
  }

  // --- Write the new session ---
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(EMAIL_KEY, cleanEmail);
  if (name) localStorage.setItem(NAME_KEY, name);

  // --- Restore this user's dataset (if they had one before) ---
  if (cleanEmail) {
    const savedDs = localStorage.getItem(userDatasetKey(cleanEmail));
    if (savedDs) {
      localStorage.setItem(DATASET_KEY, savedDs);
    }
    // If no saved dataset exists, leave active_dataset_id untouched
    // (it might already be empty from the switch above, which is correct)
  }
}

/**
 * Wipe the current session on sign-out.
 * IMPORTANT: saves the active dataset for this user BEFORE clearing,
 * so it can be restored on their next login.
 */
export function clearSession() {
  // 1. Persist the active dataset under this user's personal key
  const email = localStorage.getItem(EMAIL_KEY) || "";
  const dsId  = localStorage.getItem(DATASET_KEY);
  if (email && dsId) {
    localStorage.setItem(userDatasetKey(email), dsId);
  }

  // 2. Clear session keys — but NOT the per-user dataset keys (ds:*)
  //    so data survives logout/login cycles
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem("auth_token"); // legacy key
  localStorage.removeItem(EMAIL_KEY);
  localStorage.removeItem(NAME_KEY);
  localStorage.removeItem(DATASET_KEY);
}

/**
 * Explicitly saves the currently active dataset for the logged-in user.
 * Call this whenever active_dataset_id changes (dataset selected, uploaded, etc.)
 */
export function persistActiveDataset(datasetId: string) {
  if (typeof window === "undefined") return;
  const email = localStorage.getItem(EMAIL_KEY);
  if (email) {
    localStorage.setItem(userDatasetKey(email), datasetId);
  }
  localStorage.setItem(DATASET_KEY, datasetId);
}

/** Get display name (falls back to email prefix). */
export function getUserName(): string {
  if (typeof window === "undefined") return "";
  return (
    localStorage.getItem(NAME_KEY) ||
    (localStorage.getItem(EMAIL_KEY) || "User").split("@")[0]
  );
}

/** Get user email. */
export function getUserEmail(): string {
  if (typeof window === "undefined") return "";
  return localStorage.getItem(EMAIL_KEY) || "";
}
