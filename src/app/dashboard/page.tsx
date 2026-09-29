"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { api, ApiError } from "@/lib/api";
import type { Vehicle } from "@/lib/types";

export default function DashboardPage() {
  const { user, loading, logout } = useAuth();
  const router = useRouter();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [state, setState] = useState<"loading" | "ready" | "error">("loading");
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    make: "",
    model: "",
    manufacturingYear: new Date().getFullYear(),
    fuelType: "Petrol",
    transmission: "Manual",
    currentMileage: "",
    registrationNumber: "",
    vin: "",
    nickname: "",
  });
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setState("loading");
    try {
      const res = await api<{ vehicles: Vehicle[] }>("/api/vehicles");
      setVehicles(res.vehicles);
      setState("ready");
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : "We couldn't load your vehicles."
      );
      setState("error");
    }
  }, []);

  useEffect(() => {
    if (!loading && !user) router.replace("/login");
  }, [loading, user, router]);

  useEffect(() => {
    if (user) void load();
  }, [user, load]);

  async function createVehicle(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setFormError(null);
    try {
      await api<{ vehicle: Vehicle }>("/api/vehicles", {
        method: "POST",
        body: {
          make: form.make,
          model: form.model,
          manufacturingYear: Number(form.manufacturingYear),
          fuelType: form.fuelType || null,
          transmission: form.transmission || null,
          currentMileage: Number(form.currentMileage),
          registrationNumber: form.registrationNumber || null,
          vin: form.vin || null,
          nickname: form.nickname || null,
        },
      });
      setShowForm(false);
      setForm({ ...form, make: "", model: "", currentMileage: "" });
      await load();
    } catch (err) {
      setFormError(
        err instanceof ApiError ? err.message : "We couldn't save this vehicle."
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="mx-auto min-h-screen max-w-6xl px-6 py-8">
      <header className="mb-10 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-slate-50">
            My Vehicles
          </h1>
          {user && (
            <p className="mt-1 text-sm text-slate-400">Signed in as {user.email}</p>
          )}
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowForm((v) => !v)}
            className="btn-primary"
            aria-expanded={showForm}
          >
            {showForm ? "Cancel" : "Add vehicle"}
          </button>
          <button onClick={logout} className="btn-ghost">
            Sign out
          </button>
        </div>
      </header>

      {showForm && (
        <form onSubmit={createVehicle} className="card mb-8 space-y-4">
          <h2 className="font-semibold text-slate-100">New vehicle</h2>

          {formError && (
            <p
              role="alert"
              className="rounded-xl border border-signal-red/30 bg-signal-red/10 px-3.5 py-2.5 text-sm text-signal-red"
            >
              {formError}
            </p>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="label" htmlFor="make">
                Make
              </label>
              <input
                id="make"
                required
                className="input"
                value={form.make}
                onChange={(e) => setForm({ ...form, make: e.target.value })}
                placeholder="Honda"
              />
            </div>
            <div>
              <label className="label" htmlFor="model">
                Model
              </label>
              <input
                id="model"
                required
                className="input"
                value={form.model}
                onChange={(e) => setForm({ ...form, model: e.target.value })}
                placeholder="City"
              />
            </div>
            <div>
              <label className="label" htmlFor="year">
                Year
              </label>
              <input
                id="year"
                type="number"
                required
                min={1900}
                max={new Date().getFullYear() + 1}
                className="input"
                value={form.manufacturingYear}
                onChange={(e) =>
                  setForm({ ...form, manufacturingYear: Number(e.target.value) })
                }
              />
            </div>
            <div>
              <label className="label" htmlFor="mileage">
                Current mileage (km)
              </label>
              <input
                id="mileage"
                type="number"
                required
                min={0}
                className="input"
                value={form.currentMileage}
                onChange={(e) =>
                  setForm({ ...form, currentMileage: e.target.value })
                }
                placeholder="68450"
              />
            </div>
            <div>
              <label className="label" htmlFor="fuel">
                Fuel type
              </label>
              <input
                id="fuel"
                className="input"
                value={form.fuelType}
                onChange={(e) => setForm({ ...form, fuelType: e.target.value })}
              />
            </div>
            <div>
              <label className="label" htmlFor="transmission">
                Transmission
              </label>
              <input
                id="transmission"
                className="input"
                value={form.transmission}
                onChange={(e) => setForm({ ...form, transmission: e.target.value })}
              />
            </div>
            <div>
              <label className="label" htmlFor="reg">
                Registration number (optional)
              </label>
              <input
                id="reg"
                className="input"
                value={form.registrationNumber}
                onChange={(e) =>
                  setForm({ ...form, registrationNumber: e.target.value })
                }
              />
            </div>
            <div>
              <label className="label" htmlFor="vin">
                VIN / chassis number (optional)
              </label>
              <input
                id="vin"
                className="input"
                value={form.vin}
                onChange={(e) => setForm({ ...form, vin: e.target.value })}
              />
            </div>
          </div>

          <p className="text-xs text-slate-500">
            Registration and VIN are stored privately and never shown to anyone
            else with access to this vehicle.
          </p>

          <button type="submit" disabled={saving} className="btn-primary">
            {saving ? "Saving…" : "Create vehicle"}
          </button>
        </form>
      )}

      {state === "loading" && (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="card h-40 animate-pulse bg-graphite-800/50"
              aria-hidden
            />
          ))}
        </div>
      )}

      {state === "error" && (
        <div className="card border-signal-red/30">
          <p className="text-sm text-signal-red">{error}</p>
          <button onClick={load} className="btn-ghost mt-4">
            Try again
          </button>
        </div>
      )}

      {state === "ready" && vehicles.length === 0 && (
        <div className="card text-center">
          <p className="text-slate-300">No vehicles yet.</p>
          <p className="mt-1 text-sm text-slate-500">
            Add a vehicle, record a few services and problems, then ask the
            assistant whether it has seen a symptom before.
          </p>
          <button
            onClick={() => setShowForm(true)}
            className="btn-primary mt-5"
          >
            Add your first vehicle
          </button>
        </div>
      )}

      {state === "ready" && vehicles.length > 0 && (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {vehicles.map((v) => (
            <Link
              key={v.id}
              href={`/vehicles/${v.id}`}
              className="card card-hover block focus:outline-none focus:ring-2 focus:ring-electric-500"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="font-semibold text-slate-100">
                    {v.make} {v.model}
                  </h2>
                  <p className="mt-0.5 text-sm text-slate-400">
                    {v.manufacturingYear}
                    {v.fuelType ? ` • ${v.fuelType}` : ""}
                    {v.transmission ? ` • ${v.transmission}` : ""}
                  </p>
                </div>
                {v.isDemo && <span className="badge-blue">Demo</span>}
              </div>

              <p className="mt-4 font-mono text-lg text-electric-400">
                {v.currentMileage.toLocaleString()} km
              </p>

              <p className="mt-4 text-sm text-electric-400">
                Open vehicle →
              </p>
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}
