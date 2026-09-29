"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { ApiError } from "@/lib/api";

export default function RegisterPage() {
  const { register } = useAuth();
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setFieldErrors({});
    setBusy(true);
    try {
      await register(name, email, password);
      router.replace("/dashboard");
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
        if (err.fields) {
          setFieldErrors(
            Object.fromEntries(err.fields.map((f) => [f.path, f.message]))
          );
        }
      } else {
        setError("We couldn't create your account. Please try again.");
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-6 py-10">
      <div className="w-full max-w-sm">
        <Link href="/" className="mb-8 block text-center text-lg font-semibold">
          Vehicle<span className="text-electric-400">Memory</span>
        </Link>

        <form onSubmit={onSubmit} className="card space-y-4">
          <h1 className="text-lg font-semibold text-slate-100">
            Create your account
          </h1>

          {error && (
            <p
              role="alert"
              className="rounded-xl border border-signal-red/30 bg-signal-red/10 px-3.5 py-2.5 text-sm text-signal-red"
            >
              {error}
            </p>
          )}

          <div>
            <label className="label" htmlFor="name">
              Name
            </label>
            <input
              id="name"
              required
              className="input"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            {fieldErrors.name && (
              <p className="mt-1 text-xs text-signal-red">{fieldErrors.name}</p>
            )}
          </div>

          <div>
            <label className="label" htmlFor="email">
              Email
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              required
              className="input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            {fieldErrors.email && (
              <p className="mt-1 text-xs text-signal-red">{fieldErrors.email}</p>
            )}
          </div>

          <div>
            <label className="label" htmlFor="password">
              Password
            </label>
            <input
              id="password"
              type="password"
              autoComplete="new-password"
              required
              minLength={8}
              className="input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            {fieldErrors.password ? (
              <p className="mt-1 text-xs text-signal-red">
                {fieldErrors.password}
              </p>
            ) : (
              <p className="mt-1 text-xs text-slate-500">
                At least 8 characters.
              </p>
            )}
          </div>

          <button type="submit" disabled={busy} className="btn-primary w-full">
            {busy ? "Creating account…" : "Create account"}
          </button>

          <p className="text-center text-sm text-slate-400">
            Already registered?{" "}
            <Link href="/login" className="text-electric-400 hover:underline">
              Sign in
            </Link>
          </p>
        </form>
      </div>
    </main>
  );
}
