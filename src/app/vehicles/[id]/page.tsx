"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { api, ApiError } from "@/lib/api";
import type { Health, Reminder } from "@/lib/types";

export default function VehicleOverviewPage() {
  const params = useParams<{ id: string }>();
  const [health, setHealth] = useState<Health | null>(null);
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const [h, r] = await Promise.all([
          api<Health>(`/api/vehicles/${params.id}/health`),
          api<{ reminders: Reminder[] }>(`/api/vehicles/${params.id}/reminders`),
        ]);
        if (!cancelled) {
          setHealth(h);
          setReminders(r.reminders);
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof ApiError ? err.message : "We couldn't load this vehicle."
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [params.id]);

  if (loading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
          <div key={i} className="stat h-24 animate-pulse bg-graphite-800/50" aria-hidden />
        ))}
      </div>
    );
  }

  if (error) return <div className="card text-sm text-signal-red">{error}</div>;
  if (!health) return null;

  const currency = "₹";

  return (
    <div className="space-y-8">
      <section>
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-400">
            Vehicle health
          </h2>
          <Link href={`/vehicles/${params.id}/chat`} className="btn-primary">
            Ask about this vehicle
          </Link>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="stat">
            <p className="stat-label">Mileage</p>
            <p className="stat-value font-mono">
              {health.currentMileage.toLocaleString()} km
            </p>
          </div>
          <div className="stat">
            <p className="stat-label">Since last service</p>
            <p className="stat-value font-mono">
              {health.kmSinceLastService !== null
                ? `${health.kmSinceLastService.toLocaleString()} km`
                : "—"}
            </p>
          </div>
          <div className="stat">
            <p className="stat-label">Open issues</p>
            <p className="stat-value">{health.openProblems}</p>
          </div>
          <div className="stat">
            <p className="stat-label">Resolved issues</p>
            <p className="stat-value">{health.resolvedProblems}</p>
          </div>
          <div className="stat">
            <p className="stat-label">Parts tracked</p>
            <p className="stat-value">{health.partsReplaced}</p>
          </div>
          <div className="stat">
            <p className="stat-label">Diagnostic events</p>
            <p className="stat-value">{health.diagnosticEvents}</p>
          </div>
          <div className="stat">
            <p className="stat-label">Average fuel economy</p>
            <p className="stat-value">
              {health.averageFuelEconomy !== null
                ? `${health.averageFuelEconomy} km/L`
                : "—"}
            </p>
            {health.fuelSampleSize > 0 && (
              <p className="mt-0.5 text-xs text-slate-500">
                from {health.fuelSampleSize} fill-ups
              </p>
            )}
          </div>
          <div className="stat">
            <p className="stat-label">Maintenance spending</p>
            <p className="stat-value">
              {currency}
              {health.maintenanceSpending.toLocaleString()}
            </p>
            <p className="mt-0.5 text-xs text-slate-500">
              recorded costs only
            </p>
          </div>
        </div>
      </section>

      <section>
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-slate-400">
          Upcoming maintenance
        </h2>
        {reminders.length === 0 ? (
          <div className="card text-sm text-slate-400">
            No reminders set. Add one from the service page, or define your own
            interval in the memory page. Reminders use intervals you entered —
            this app does not assert manufacturer schedules.
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {reminders.map((r) => (
              <div key={r.id} className="card">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-medium text-slate-100">{r.title}</h3>
                  <span
                    className={
                      r.status === "overdue"
                        ? "badge-red"
                        : r.status === "due_soon"
                          ? "badge-amber"
                          : "badge-blue"
                    }
                  >
                    {r.status === "overdue"
                      ? "Overdue"
                      : r.status === "due_soon"
                        ? "Due soon"
                        : "Scheduled"}
                  </span>
                </div>
                {r.description && (
                  <p className="mt-2 text-sm text-slate-400">{r.description}</p>
                )}
                <p className="mt-3 text-sm text-slate-300">
                  {r.remainingKm !== null && (
                    <>
                      {r.remainingKm <= 0
                        ? `${Math.abs(r.remainingKm).toLocaleString()} km past due mileage`
                        : `Due in about ${r.remainingKm.toLocaleString()} km`}
                    </>
                  )}
                  {r.remainingKm !== null && r.daysRemaining !== null && " • "}
                  {r.daysRemaining !== null && (
                    <>
                      {r.daysRemaining <= 0
                        ? "date passed"
                        : `in ${r.daysRemaining} days`}
                    </>
                  )}
                </p>
                {r.sourceNote && (
                  <p className="mt-2 text-xs text-slate-500">{r.sourceNote}</p>
                )}
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
