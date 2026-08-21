import { CheckCircle2, KeyRound, LockKeyhole } from "lucide-react";
import { FormEvent, useState } from "react";
import { useLocation, useSearch } from "wouter";
import { toast } from "sonner";
import { PasswordVisibilityInput } from "@/components/PasswordVisibilityInput";
import { trpc } from "@/lib/trpc";

export default function ResetPassword() {
  const search = useSearch();
  const [, setLocation] = useLocation();
  const token = new URLSearchParams(search).get("token") ?? "";
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const resetMutation = trpc.auth.resetPassword.useMutation({
    onSuccess: () => {
      toast.success("Password updated", { description: "You are now signed in." });
      setLocation("/profile");
    },
    onError: error => toast.error("Couldn’t reset password", { description: error.message }),
  });

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!token) {
      toast.error("This password-reset link is incomplete.");
      return;
    }
    if (password !== confirmation) {
      toast.error("Passwords do not match.");
      return;
    }
    resetMutation.mutate({ token, password });
  };

  return (
    <main className="min-h-screen bg-[#0b0b0b] px-5 py-14 text-[#fff7f2] sm:px-8 md:px-12 md:py-24">
      <div className="mx-auto max-w-[520px]">
        <span className="flex h-14 w-14 items-center justify-center rounded-[14px] bg-[#ff5a1f] text-[#111111] shadow-[4px_4px_0_#000]"><KeyRound size={24} /></span>
        <p className="mt-10 text-[10px] font-black uppercase tracking-[0.18em] text-[#ff5a1f]">Sandsly account security</p>
        <h1 className="mt-2 font-display text-[clamp(2.4rem,10vw,4.4rem)] font-black uppercase leading-[0.86] tracking-[-0.08em]">Set a new password.</h1>
        <p className="mt-6 max-w-[430px] text-[0.98rem] leading-7 text-[#bdb2ac]">Choose a new password with at least 8 characters. This secure link can be used once.</p>
        <form onSubmit={submit} className="mt-8 rounded-[15px] border border-[#48413e] bg-[#242424] p-5 shadow-[3px_3px_0_#050505]">
          <Field label="New password">
            <PasswordVisibilityInput value={password} onChange={setPassword} autoComplete="new-password" id="new-password" describedBy="reset-password-help" />
          </Field>
          <Field label="Confirm new password">
            <PasswordVisibilityInput value={confirmation} onChange={setConfirmation} autoComplete="new-password" id="confirm-password" describedBy="reset-password-help" />
          </Field>
          <p id="reset-password-help" className="mt-3 flex gap-2 text-xs leading-5 text-[#a89d96]"><CheckCircle2 size={15} className="mt-0.5 shrink-0 text-[#ff5a1f]" />At least 8 characters. You will be signed in after a successful reset.</p>
          <button type="submit" disabled={resetMutation.isPending} className="mt-5 inline-flex h-12 w-full items-center justify-center gap-3 rounded-[10px] bg-[#ff5a1f] px-5 text-xs font-black uppercase tracking-[0.16em] text-[#111111] shadow-[4px_4px_0_#000] disabled:opacity-60">
            <LockKeyhole size={17} /> {resetMutation.isPending ? "Updating…" : "Update password"}
          </button>
          <button type="button" onClick={() => setLocation("/profile")} className="mt-4 w-full text-center text-xs font-bold text-[#bdb2ac] underline decoration-[#ff5a1f]/60 underline-offset-4 hover:text-[#ffb09a]">Back to sign in</button>
        </form>
      </div>
    </main>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="mt-4 block text-[10px] font-black uppercase tracking-[0.13em] text-[#bdb2ac]">{label}<span className="mt-2 block [&_input]:h-11 [&_input]:w-full [&_input]:rounded-[9px] [&_input]:border [&_input]:border-[#4a403c] [&_input]:bg-[#171717] [&_input]:px-3 [&_input]:text-sm [&_input]:font-normal [&_input]:normal-case [&_input]:tracking-normal [&_input]:text-[#fff7f2]">{children}</span></label>;
}
