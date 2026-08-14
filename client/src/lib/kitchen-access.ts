export function getKitchenProfileAccess(role?: "user" | "kitchen" | "admin" | null) {
  const canUseKitchen = role === "kitchen" || role === "admin";
  return {
    canUseKitchen,
    description: canUseKitchen
      ? "Review live incoming orders and move them through preparation."
      : "Kitchen Board access is limited to accounts assigned the Kitchen or Admin role.",
    guidance: canUseKitchen ? null : "Ask an administrator to assign your account the Kitchen role.",
  };
}
