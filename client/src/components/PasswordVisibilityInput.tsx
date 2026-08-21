import { Eye, EyeOff } from "lucide-react";
import { useState } from "react";

export function PasswordVisibilityInput({
  value,
  onChange,
  autoComplete,
  id,
  describedBy,
  placeholder,
}: {
  value: string;
  onChange: (value: string) => void;
  autoComplete: "current-password" | "new-password";
  id?: string;
  describedBy?: string;
  placeholder?: string;
}) {
  const [isVisible, setIsVisible] = useState(false);
  const controlLabel = isVisible ? "Hide password" : "Show password";

  return (
    <div className="relative">
      <input
        id={id}
        required
        minLength={8}
        value={value}
        onChange={event => onChange(event.target.value)}
        type={isVisible ? "text" : "password"}
        autoComplete={autoComplete}
        aria-describedby={describedBy}
        placeholder={placeholder}
        className="pr-12"
      />
      <button
        type="button"
        aria-label={controlLabel}
        aria-pressed={isVisible}
        title={controlLabel}
        onClick={() => setIsVisible(current => !current)}
        className="absolute inset-y-0 right-0 flex w-11 items-center justify-center rounded-r-[9px] text-[#bdb2ac] transition-colors hover:text-[#ffb09a] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ff5a1f] focus-visible:ring-offset-2 focus-visible:ring-offset-[#171717]"
      >
        {isVisible ? <EyeOff size={18} aria-hidden="true" /> : <Eye size={18} aria-hidden="true" />}
      </button>
    </div>
  );
}
