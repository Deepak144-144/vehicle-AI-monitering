"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { api } from "@/lib/api";
import { useVehicleQuery, formatDate, formatKm } from "@/lib/useVehicleQuery";
import { LoadingRows, ErrorState, EmptyState } from "@/components/States";
import type { Problem } from "@/lib/types";

interface SpendingYear {
  year: string;
  service: number;
  parts: number;
  diagnostics: number;
  maintenance: number;
  fuel: number;
  total: number;
}

interface RecurringResponse {
  recurring: Array<{
    symptom: string;
    occurrences: number;
    firstReported: string;
    lastReported: string;
    averageKmBetween: number | null;
    allResolved: boolean;
    events: Pick<Problem, "id" | "reportedDate" | "mileage" | "confirmedDiagnosis" | "initialDiagnosis" | "resolutionStatus">[];
  }>;
  note: string;
}

const CATEGORIES: Array<{ key: keyof Omit<SpendingYear, "year" | "total">; label: string }> = [
  { key: "service", label: "Service" },
  { key: "parts", label: "Parts" },
  { key: "maintenance", label: "Maintenance" },
  { key: "diagnostics", label: "Diagnostics" },
  { key: "fuel", label: "Fuel" },
];

const COLORS: Record<string, string> = {
  service: "bg-electric-500",
  parts: "bg-signal-amber",
  maintenance: "bg-signal-green",
  diagnostics: "bg-signal-red",
  fuel: "bg-graphite-500",
};

export default function AnalyticsPage() {
  const params = useParams<{ id: string }>();
  const [component, setComponent] = useState("");

  const spending = useVehicleQuery<{
    currency: string;
    byYear: SpendingYear[];
    note: string;
  }>(`/api/vehicles/${params.id}/analytics/spending`);

  const recurring = useVehicleQuery<RecurringResponse>(
    `/api/vehicles/${params.id}/analytics/recurring`
  );

  const componentData = useVehicleQuery<{
    component: string;
    parts: Array<{ id: string; partName: string; installDate: string; installMileage: number; replacementMileage: number | null }>;
    problems: Problem[];
    diagnostics: Array<{ id: string; obdCode: string | null; description: string | null; date: string; diagnosis: string | null }>;
  }>(component ? `/api/vehicles/${params.id}/analytics/component/${encodeURIComponent(component)}` : null, [component]);

  const maxTotal = Math.max(
    1,
    ...(spending.data?.byYear.map((y) => y.total) ?? [1])
  );

  return (
    <div className="space-y-10">
      <section>
        <h2 className="text-lg font-semibold text-slate-100">Spending</h2>
        <p className="mt-1 text-sm text-slate-400">{spending.data?.note}</p>

        {spending.loading && <div className="mt-4"><LoadingRows rows={2} /></div>}
        {spending.error && (
          <div className="mt-4"><ErrorState message={spending.error} onRetry={spending.reload} /></div>
        )}

        {spending.data && spending.data.byYear.length === 0 && (
          <div className="mt-4">
            <EmptyState
              title="No costs recorded"
              description="Add costs to service, part, diagnostic, maintenance and fuel records and the breakdown will appear here."
            />
          </div>
        )}

        {spending.data && spending.data.byYear.length > 0 && (
          <div className="mt-5 space-y-5">
            {spending.data.byYear
              .slice()
              .reverse()
              .map((year) => (
                <div key={year.year}>
                  <div className="mb-2 flex items-baseline justify-between">
                    <span className="font-mono text-sm text-slate-300">
                      {year.year}
                    </span>
                    <span className="text-sm font-semibold text-slate-100">
                      ₹{year.total.toLocaleString()}
                    </span>
                  </div>
                  <div
                    className="flex h-3 overflow-hidden rounded-full bg-graphite-800"
                    role="img"
                    aria-label={`${year.year} spending total ${year.total} rupees`}
                  >
                    {CATEGORIES.map(({ key }) => {
                      const value = year[key];
                      if (value <= 0) return null;
                      return (
                        <div
                          key={key}
                          className={COLORS[key]}
                          style={{ width: `${(value / maxTotal) * 100}%` }}
                          title={`${key}: ₹${value.toLocaleString()}`}
                        />
                      );
                    })}
                  </div>
                </div>
              ))}

            <div className="flex flex-wrap gap-4 pt-1">
              {CATEGORIES.map(({ key, label }) => (
                <span key={key} className="flex items-center gap-2 text-xs text-slate-400">
                  <span className={`h-2.5 w-2.5 rounded-full ${COLORS[key]}`} aria-hidden />
                  {label}
                </span>
              ))}
            </div>
          </div>
        )}
      </section>

      <section>
        <h2 className="text-lg font-semibold text-slate-100">Recurring problems</h2>
        <p className="mt-1 text-sm text-slate-400">{recurring.data?.note}</p>

        {recurring.loading && <div className="mt-4"><LoadingRows rows={2} /></div>}

        {recurring.data && recurring.data.recurring.length === 0 && (
          <div className="mt-4">
            <EmptyState
              title="No repeated symptoms detected"
              description="If the same symptom appears more than once in your records, it will show up here as a historical pattern."
            />
          </div>
        )}

        {recurring.data && recurring.data.recurring.length > 0 && (
          <div className="mt-5 space-y-3">
            {recurring.data.recurring.map((r) => (
              <article key={r.symptom} className="card">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <h3 className="font-medium text-slate-100">{r.symptom}</h3>
                  <span className="badge-amber">
                    {r.occurrences} occurrence{r.occurrences === 1 ? "" : "s"}
                  </span>
                </div>

                <ol className="mt-3 space-y-2">
                  {r.events.map((e) => (
                    <li key={e.id} className="flex flex-wrap gap-2 text-sm text-slate-400">
                      <span className="text-slate-500">{formatDate(e.reportedDate)}</span>
                      <span className="font-mono">{formatKm(e.mileage)}</span>
                      <span className="text-slate-300">
                        {e.confirmedDiagnosis ?? e.initialDiagnosis ?? "No diagnosis recorded"}
                      </span>
                      <span
                        className={
                          e.resolutionStatus === "resolved" ? "badge-green" : "badge-amber"
                        }
                      >
                        {e.resolutionStatus}
                      </span>
                    </li>
                  ))}
                </ol>

                {r.averageKmBetween !== null && (
                  <p className="mt-3 text-sm text-slate-400">
                    Average interval between occurrences: about{" "}
                    <span className="font-mono text-electric-400">
                      {r.averageKmBetween.toLocaleString()} km
                    </span>
                  </p>
                )}
              </article>
            ))}
          </div>
        )}
      </section>

      <section>
        <h2 className="text-lg font-semibold text-slate-100">Component history</h2>
        <p className="mt-1 text-sm text-slate-400">
          See everything recorded about one part or system, for example the
          complete battery history.
        </p>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            void componentData.reload();
          }}
          className="mt-4 flex gap-2"
        >
          <input
            value={component}
            onChange={(e) => setComponent(e.target.value)}
            placeholder="battery, brakes, tyres…"
            className="input"
            aria-label="Component"
          />
          <button type="submit" disabled={!component.trim() || componentData.loading} className="btn-primary shrink-0">
            {componentData.loading ? "Loading…" : "Show"}
          </button>
        </form>

        {component && componentData.data && (
          <div className="mt-5 space-y-5">
            {componentData.data.parts.length === 0 &&
              componentData.data.problems.length === 0 &&
              componentData.data.diagnostics.length === 0 && (
                <div className="card text-sm text-slate-400">
                  Nothing matching &ldquo;{componentData.data.component}&rdquo; was
                  found in this vehicle&apos;s records.
                </div>
              )}

            {componentData.data.parts.length > 0 && (
              <div className="card">
                <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-400">
                  Parts
                </h3>
                <ul className="mt-3 space-y-2 text-sm">
                  {componentData.data.parts.map((p) => (
                    <li key={p.id} className="flex flex-wrap items-center gap-3">
                      <span className="text-slate-200">{p.partName}</span>
                      <span className="text-slate-500">{formatDate(p.installDate)}</span>
                      <span className="font-mono text-slate-400">
                        {formatKm(p.installMileage)}
                      </span>
                      {p.replacementMileage !== null && (
                        <span className="text-slate-500">
                          → {formatKm(p.replacementMileage)}
                        </span>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {componentData.data.problems.length > 0 && (
              <div className="card">
                <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-400">
                  Related problems
                </h3>
                <ul className="mt-3 space-y-2 text-sm">
                  {componentData.data.problems.map((p) => (
                    <li key={p.id} className="flex flex-wrap items-center gap-3">
                      <span className="text-slate-200">{p.symptom}</span>
                      <span className="text-slate-500">{formatDate(p.reportedDate)}</span>
                      <span className="font-mono text-slate-400">{formatKm(p.mileage)}</span>
                      <span
                        className={p.resolutionStatus === "resolved" ? "badge-green" : "badge-amber"}
                      >
                        {p.resolutionStatus}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {componentData.data.diagnostics.length > 0 && (
              <div className="card">
                <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-400">
                  Diagnostics
                </h3>
                <ul className="mt-3 space-y-2 text-sm">
                  {componentData.data.diagnostics.map((d) => (
                    <li key={d.id} className="flex flex-wrap items-center gap-3">
                      {d.obdCode && <span className="badge-blue">{d.obdCode}</span>}
                      <span className="text-slate-200">{d.description ?? "Diagnostic event"}</span>
                      <span className="text-slate-500">{formatDate(d.date)}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </section>
    </div>
  );
}
