export const DEMO_SESSION_STORAGE_KEY = "crunch-demo-session";
export const DEMO_SESSION_VALUE = "crunch-demo-customer";
export const DEMO_CUSTOMER_SESSION_VALUE = "crunch-demo-customer-test";

export function getDemoSession() {
  try {
    const storedSession = localStorage.getItem(DEMO_SESSION_STORAGE_KEY);
    if (storedSession) return storedSession;
    if (!import.meta.env.DEV) return null;
    const demoMode = new URLSearchParams(window.location.search).get("demo");
    return demoMode === "kitchen" ? DEMO_SESSION_VALUE : demoMode === "customer" ? DEMO_CUSTOMER_SESSION_VALUE : null;
  } catch { return null; }
}

export function setDemoSession() {
  try { localStorage.setItem(DEMO_SESSION_STORAGE_KEY, DEMO_SESSION_VALUE); } catch {}
}

export function clearDemoSession() {
  try { localStorage.removeItem(DEMO_SESSION_STORAGE_KEY); } catch {}
}
