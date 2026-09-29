"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { api, ApiError } from "@/lib/api";
import type { TimelineEvent } from "@/lib/types";

const FILTERS = [
  { key: "services", label: "Services" },
  { key: "problems", label: "Problems" },
  { key: "parts", label: "Parts" },
  { key: "diagnostics", label: "Diagnostics" },
  { key: "mileage", label: "Mileage" },
  { key: "fuel", label: "Fuel" },
  { key: "incidents", label: "Incidents" },
  { key: "modifications", label: "Modifications" },
];

const TYPE_STYLE: Record<string, { dot: string; badge: string }> = {
  service: { dot: "bg-electric-500", badge: "badge-blue" },
  problem: { dot: "bg-signal-red", badge: "badge-red" },
  part: { dot: "bg-signal-amber", badge: "badge-amber" },
  diagnostic: { dot: "bg-signal-green", badge: "badge-green" },
  mileage: { dot: "bg-graphite-500", badge: "badge-grey" },
  fuel: { dot: "bg-graphite-500", badge: "badge-grey" },
  incident: { dot: "bg-signal-red", badge: "badge-red" },
  modification: { dot: "bg-signal-amber", badge: "badge-amber" },
};

export default function TimelinePage() {
  const params = useParams<{ id: string }>();
  const [events, setEvents] = useState<TimelineEvent[]>([]);
  const [active, setActive] = useState<Set<string>>(
    new Set(FILTERS.map((f) => f.key))
  );
  const [selected, setSelected] = useState<TimelineEvent | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      try {
        const res = await api<{ events: TimelineEvent[] }>(
          `/api/vehicles/${params.id}/timeline`
        );
        if (!cancelled) setEvents(res.events);
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof ApiError ? err.message : "We couldn't load the timeline."
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

  const visible = useMemo(
    () => events.filter((e) => active.has(e.type)),
    [events, active]
  );

  const byYear = useMemo(() => {
    const groups = new Map<string, TimelineEvent[]>();
    for (const e of visible) {
      const year = new Date(e.date).getFullYear().toString();
      const list = groups.get(year) ?? [];
      list.push(e);
      groups.set(year, list);
    }
    return Array.from(groups.entries()).sort((a, b) => b[0].localeCompare(a[0]));
  }, [visible]);

  function toggle(key: string) {
    setActive((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  if (loading) {
    return (
      <div className="space-y-3">
        {[0, 1, 2, 3, 4].map((i) => (
          <div key={i} className="h-16 animate-pulse rounded-xl bg-graphite-800/50" aria-hidden />
        ))}
      </div>
    );
  }

  if (error) return <div className="card text-sm text-signal-red">{error}</div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs uppercase tracking-wide text-slate-500">
          Filter:
        </span>
        {FILTERS.map((f) => (
          <button
            key={f.key}
            onClick={() => toggle(f.key)}
            aria-pressed={active.has(f.key)}
            className={`rounded-full border px-3 py-1 text-xs transition-colors ${
              active.has(f.key)
                ? "border-electric-500/50 bg-electric-500/10 text-electric-400"
                : "border-graphite-600 bg-graphite-800 text-slate-400 hover:text-slate-200"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {visible.length === 0 ? (
        <div className="card text-center text-sm text-slate-400">
          No events match these filters yet. Add records from the sections above
          and they will appear here chronologically.
        </div>
      ) : (
        byYear.map(([year, yearEvents]) => (
          <section key={year}>
            <h2 className="mb-4 font-mono text-lg text-electric-400">{year}</h2>
            <ol className="timeline-rail relative space-y-3 pl-7">
              {yearEvents.map((e) => {
                const style = TYPE_STYLE[e.type] ?? TYPE_STYLE.mileage;
                return (
                  <li key={`${e.type}-${e.id}`} className="relative">
                    <span
                      className={`absolute -left-[26px] top-4 h-3.5 w-3.5 rounded-full ring-4 ring-graphite-950 ${style.dot}`}
                      aria-hidden
                    />
                    <button
                      onClick={() => setSelected(e)}
                      className="card card-hover w-full text-left"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2.5">
                          <span className={style.badge}>{e.type}</span>
                          <span className="text-xs text-slate-500">
                            {new Date(e.date).toLocaleDateString()}
                            {e.mileage !== null &&
                              ` • ${e.mileage.toLocaleString()} km`}
                          </span>
                        </div>
                      </div>
                      <p className="mt-2 text-sm font-medium text-slate-100">
                        {e.title}
                      </p>
                      {e.summary && (
                        <p className="mt-1 line-clamp-2 text-sm text-slate-400">
                          {e.summary}
                        </p>
                      )}
                    </button>
                  </li>
                );
              })}
            </ol>
          </section>
        ))
      )}

      {selected && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-graphite-950/80 p-4"
          role="dialog"
          aria-modal="true"
          aria-label="Event details"
          onClick={() => setSelected(null)}
        >
          <div
            className="card max-h-[80vh] w-full max-w-lg overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <span className={TYPE_STYLE[selected.type]?.badge ?? "badge-grey"}>
                  {selected.type}
                </span>
                <h2 className="mt-2 text-lg font-semibold text-slate-100">
                  {selected.title}
                </h2>
                <p className="mt-1 text-xs text-slate-500">
                  {new Date(selected.date).toLocaleDateString()}
                  {selected.mileage !== null &&
                    ` • ${selected.mileage.toLocaleString()} km`}
                </p>
              </div>
              <button
                onClick={() => setSelected(null)}
                className="btn-ghost px-2.5 py-1.5 text-xs"
                aria-label="Close"
              >
                Close
              </button>
            </div>

            {selected.summary && (
              <div className="mt-5">
                <p className="label">Details</p>
                <p className="whitespace-pre-wrap text-sm text-slate-300">
                  {selected.summary}
                </p>
              </div>
            )}

            {Object.keys(selected.detail).length > 0 && (
              <div className="mt-5">
                <p className="label">Additional information</p>
                <dl className="space-y-2">
                  {Object.entries(selected.detail)
                    .filter(([, v]) => v !== null && v !== undefined && v !== "")
                    .map(([k, v]) => (
                      <div key={k} className="flex justify-between gap-4 text-sm">
                        <dt className="text-slate-500">
                          {k.replace(/([A-Z])/g, " $1").replace(/^./, (c) =>
                            c.toUpperCase()
                          )}
                        </dt>
                        <dd className="text-right text-slate-300">
                          {v instanceof Date
                            ? v.toLocaleDateString()
                            : String(v)}
                        </dd>
                      </div>
                    ))}
                </dl>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
