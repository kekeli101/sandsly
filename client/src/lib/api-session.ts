const SESSION_KEY = "sandsly_api_session";

export function readApiSessionToken() {
  if (typeof window === "undefined") return null;
  return window.sessionStorage.getItem(SESSION_KEY);
}

export function saveApiSessionToken(token: string | null | undefined) {
  if (typeof window === "undefined") return;
  if (!token) {
    window.sessionStorage.removeItem(SESSION_KEY);
    return;
  }
  window.sessionStorage.setItem(SESSION_KEY, token);
}

export function clearApiSessionToken() {
  if (typeof window === "undefined") return;
  window.sessionStorage.removeItem(SESSION_KEY);
}
