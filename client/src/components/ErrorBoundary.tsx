import { cn } from "@/lib/utils";
import { AlertTriangle, RotateCcw } from "lucide-react";
import { Component, ReactNode } from "react";
import { isLazyImportFailure } from "@/lib/lazy-import-recovery";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      const updateAvailable = isLazyImportFailure(this.state.error);
      return (
        <div className="flex min-h-screen items-center justify-center bg-[#0b0b0b] p-8 text-[#fff7f2]">
          <div className="flex w-full max-w-md flex-col items-center rounded-[18px] border border-[#4a403c] bg-[#242424] p-8 text-center shadow-[5px_5px_0_#080808]">
            <AlertTriangle
              size={48}
              className="mb-6 shrink-0 text-[#ff5a1f]"
            />

            <h2 className="font-display text-2xl font-black uppercase tracking-[-0.05em]">{updateAvailable ? "A new version is ready" : "Something needs a refresh"}</h2>
            <p className="mt-3 text-sm leading-6 text-[#c4b9b2]">{updateAvailable ? "Your browser still has an earlier version of this page. Refresh once to load the current menu and continue safely." : "The page could not complete its last step. Refreshing will return you to a clean, current version."}</p>

            <button
              onClick={() => window.location.reload()}
              className="mt-6 flex items-center gap-2 rounded-[10px] bg-[#ff5a1f] px-5 py-3 text-xs font-black uppercase tracking-[0.12em] text-[#17100d] shadow-[3px_3px_0_#080808] hover:bg-[#ff7141]"
            >
              <RotateCcw size={16} />
              Refresh page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
