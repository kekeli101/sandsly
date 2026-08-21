import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const projectRoot = path.resolve(import.meta.dirname, "..");
const readClientSource = (relativePath: string) => readFileSync(path.join(projectRoot, "client", "src", relativePath), "utf8");

describe("account password UI contracts", () => {
  it("keeps the visibility control accessible and toggles the controlled input type", () => {
    const source = readClientSource("components/PasswordVisibilityInput.tsx");
    expect(source).toContain('const [isVisible, setIsVisible] = useState(false)');
    expect(source).toContain('type={isVisible ? "text" : "password"}');
    expect(source).toContain('aria-label={controlLabel}');
    expect(source).toContain('aria-pressed={isVisible}');
    expect(source).toContain('type="button"');
  });

  it("keeps the account recovery request generic and reachable from sign-in", () => {
    const source = readClientSource("pages/Account.tsx");
    expect(source).toContain('trpc.auth.requestPasswordReset.useMutation');
    expect(source).toContain('Forgot your password?');
    expect(source).toContain('If an eligible Sandsly account matches that email');
    expect(source).toContain('role="status"');
    expect(source).not.toContain('No account exists for');
  });

  it("keeps reset completion protected by matching passwords and two independent visibility fields", () => {
    const source = readClientSource("pages/ResetPassword.tsx");
    expect(source).toContain('trpc.auth.resetPassword.useMutation');
    expect(source).toContain('if (password !== confirmation)');
    expect(source).toContain('Passwords do not match.');
    expect((source.match(/<PasswordVisibilityInput/g) ?? []).length).toBe(2);
    expect(source).toContain('autoComplete="new-password"');
  });
});
