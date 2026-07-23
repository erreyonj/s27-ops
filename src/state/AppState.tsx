import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { getSupabase, peekJwtClaims, supabaseConfigured, supabaseHost } from "../lib/supabase";
import { MemoryRepository } from "../repo/MemoryRepository";
import { SupabaseRepository } from "../repo/SupabaseRepository";
import type { Repository } from "../repo/Repository";
import type { AppData } from "../domain/types";

interface AppState {
  repo: Repository;
  data: AppData | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

const Ctx = createContext<AppState | null>(null);

export function AppStateProvider({ children }: { children: ReactNode }) {
  const repo = useMemo<Repository>(
    () => (supabaseConfigured ? new SupabaseRepository() : new MemoryRepository()),
    []
  );
  const [data, setData] = useState<AppData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const mounted = useRef(true);

  const refresh = useCallback(async () => {
    const clientNowMs = Date.now();
    let sessionPresent = false;
    let claims: ReturnType<typeof peekJwtClaims> = null;
    try {
      if (supabaseConfigured) {
        const { data: sess } = await getSupabase().auth.getSession();
        sessionPresent = Boolean(sess.session);
        claims = peekJwtClaims(sess.session?.access_token);
      }
      // #region agent log
      {
        const skewSec =
          claims?.iat != null ? claims.iat - Math.floor(clientNowMs / 1000) : null;
        fetch("http://127.0.0.1:7649/ingest/62df8067-0c40-42dd-81ce-cd8af4651473", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Debug-Session-Id": "99ac98",
          },
          body: JSON.stringify({
            sessionId: "99ac98",
            runId: "jwt-pre",
            hypothesisId: "A,B,C",
            location: "AppState.tsx:refresh:before",
            message: "loadAll about to run",
            data: {
              pageHost: typeof location !== "undefined" ? location.host : null,
              sessionPresent,
              clientIso: new Date(clientNowMs).toISOString(),
              clientNowSec: Math.floor(clientNowMs / 1000),
              jwtIat: claims?.iat ?? null,
              jwtExp: claims?.exp ?? null,
              jwtRole: claims?.role ?? null,
              skewSec,
              iatInFutureVsClient: skewSec != null ? skewSec > 0 : null,
              supabaseHost: supabaseHost(),
            },
            timestamp: Date.now(),
          }),
        }).catch(() => {});
      }
      // #endregion
      const next = await repo.loadAll();
      // #region agent log
      fetch("http://127.0.0.1:7649/ingest/62df8067-0c40-42dd-81ce-cd8af4651473", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Debug-Session-Id": "99ac98",
        },
        body: JSON.stringify({
          sessionId: "99ac98",
          runId: "jwt-pre",
          hypothesisId: "D,E",
          location: "AppState.tsx:refresh:success",
          message: "loadAll succeeded",
          data: {
            ingredientCount: next.ingredients.length,
            menuEntryCount: next.menu.entries.length,
          },
          timestamp: Date.now(),
        }),
      }).catch(() => {});
      // #endregion
      if (mounted.current) {
        setData(next);
        setError(null);
      }
    } catch (e: any) {
      // #region agent log
      {
        const nowSec = Math.floor(Date.now() / 1000);
        const skewSec = claims?.iat != null ? claims.iat - nowSec : null;
        fetch("http://127.0.0.1:7649/ingest/62df8067-0c40-42dd-81ce-cd8af4651473", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Debug-Session-Id": "99ac98",
          },
          body: JSON.stringify({
            sessionId: "99ac98",
            runId: "jwt-pre",
            hypothesisId: "A,B,C,D,E",
            location: "AppState.tsx:refresh:error",
            message: "loadAll failed",
            data: {
              pageHost: typeof location !== "undefined" ? location.host : null,
              errMsg: e?.message ?? String(e),
              errCode: e?.code ?? null,
              errDetails: e?.details ?? null,
              errHint: e?.hint ?? null,
              sessionPresent,
              jwtIat: claims?.iat ?? null,
              jwtExp: claims?.exp ?? null,
              clientNowSec: nowSec,
              skewSec,
              iatInFutureVsClient: skewSec != null ? skewSec > 0 : null,
              secondsUntilIatIfFuture: skewSec != null && skewSec > 0 ? skewSec : 0,
              supabaseHost: supabaseHost(),
            },
            timestamp: Date.now(),
          }),
        }).catch(() => {});
      }
      // #endregion
      if (mounted.current) setError(e.message ?? String(e));
    } finally {
      if (mounted.current) setLoading(false);
    }
  }, [repo]);

  useEffect(() => {
    mounted.current = true;
    refresh();
    const unsub = repo.onMenuChange(() => refresh());
    return () => {
      mounted.current = false;
      unsub();
    };
  }, [repo, refresh]);

  return (
    <Ctx.Provider value={{ repo, data, loading, error, refresh }}>{children}</Ctx.Provider>
  );
}

export function useApp(): AppState {
  const v = useContext(Ctx);
  if (!v) throw new Error("useApp must be used inside AppStateProvider");
  return v;
}
