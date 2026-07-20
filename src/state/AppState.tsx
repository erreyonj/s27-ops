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
import { supabaseConfigured } from "../lib/supabase";
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
    try {
      const next = await repo.loadAll();
      if (mounted.current) {
        setData(next);
        setError(null);
      }
    } catch (e: any) {
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
