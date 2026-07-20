import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import { getSupabase, supabaseConfigured } from "../lib/supabase";

/** Requires the single shared login when Supabase is configured.
    In demo mode (no env), passes straight through with a banner elsewhere. */
export function AuthGate({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<"checking" | "in" | "out">(
    supabaseConfigured ? "checking" : "in"
  );
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!supabaseConfigured) return;
    const sb = getSupabase();
    sb.auth.getSession().then(({ data }) => {
      setStatus(data.session ? "in" : "out");
    });
    const { data: sub } = sb.auth.onAuthStateChange((_evt, session) => {
      setStatus(session ? "in" : "out");
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  async function signIn(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setErr(null);
    const { error } = await getSupabase().auth.signInWithPassword({ email, password });
    if (error) setErr(error.message);
    setBusy(false);
  }

  if (status === "checking") {
    return <div className="page centered muted">Checking session…</div>;
  }

  if (status === "out") {
    return (
      <div className="page centered">
        <form className="card login-card" onSubmit={signIn}>
          <p className="eyebrow">Tailer Nicole</p>
          <h1>Bakery Ops</h1>
          <p className="muted">Sign in with the shared bakery account.</p>
          <label>
            Email
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="username"
              required
            />
          </label>
          <label>
            Password
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              required
            />
          </label>
          {err && <p className="error-text">{err}</p>}
          <button className="btn" disabled={busy}>
            {busy ? "Signing in…" : "Sign in"}
          </button>
        </form>
      </div>
    );
  }

  return <>{children}</>;
}
