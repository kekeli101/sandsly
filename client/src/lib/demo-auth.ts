export const DEMO_SESSION_STORAGE_KEY = "crunch-demo-session";
export const DEMO_SESSION_VALUE = "crunch-demo-customer";

export function getDemoSession() {
  try { return localStorage.getItem(DEMO_SESSION_STORAGE_KEY); } catch { return null; }
}

export function setDemoSession() {
  try { localStorage.setItem(DEMO_SESSION_STORAGE_KEY, DEMO_SESSION_VALUE); } catch {}
}

export function clearDemoSession() {
  try { localStorage.removeItem(DEMO_SESSION_STORAGE_KEY); } catch {}
}
