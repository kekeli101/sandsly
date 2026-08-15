import { trpc } from "@/lib/trpc";
import { useCallback, useMemo } from "react";

type UseAuthOptions = {
  redirectOnUnauthenticated?: boolean;
  redirectPath?: string;
};

export function useAuth(options?: UseAuthOptions) {
  const { redirectOnUnauthenticated = false, redirectPath } = options ?? {};
  const utils = trpc.useUtils();
  const meQuery = trpc.auth.me.useQuery(undefined, { retry: false, refetchOnWindowFocus: false });
  const logoutMutation = trpc.auth.logout.useMutation({ onSuccess: () => utils.auth.me.setData(undefined, null) });
  const logout = useCallback(async () => {
    try { await logoutMutation.mutateAsync(); } finally {
      utils.auth.me.setData(undefined, null);
      await utils.auth.me.invalidate();
      if (redirectPath && typeof window !== "undefined") window.location.href = redirectPath;
    }
  }, [logoutMutation, redirectPath, utils]);
  const state = useMemo(() => ({
    user: meQuery.data ?? null,
    loading: meQuery.isLoading || logoutMutation.isPending,
    error: meQuery.error ?? logoutMutation.error ?? null,
    isAuthenticated: Boolean(meQuery.data),
  }), [meQuery.data, meQuery.error, meQuery.isLoading, logoutMutation.error, logoutMutation.isPending]);
  return { ...state, refresh: () => meQuery.refetch(), logout, redirectOnUnauthenticated };
}
