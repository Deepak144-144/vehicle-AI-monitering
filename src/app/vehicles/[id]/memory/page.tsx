"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { api, ApiError } from "@/lib/api";
import { useVehicleQuery, formatDate, formatKm } from "@/lib/useVehicleQuery";
import { LoadingRows, ErrorState, EmptyState } from "@/components/States";
import type { Memory, SearchResult } from "@/lib/types";

const STATUS_BADGE: Record<string, string> = {
  confirmed: "badge-green",
  user_reported: "badge-blue",
  imported: "badge-blue",
  unverified: "badge-amber",
  ai_inferred: "badge-amber",
};

const TYPE_FILTERS = [
  "", "identity", "service", "maintenance", "part", "problem",
  "diagnostic", "mileage", "fuel", "driving_condition", "incident",
  "modification", "ai_observation",
];

export default function MemoryPage() {
  const params = useParams<{ id: string }>();
  const [typeFilter, setTypeFilter] = useState("");
  const { data, loading, error, reload } = useVehicleQuery<{ memories: Memory[] }>(
    `/api/vehicles/${params.id}/memories${typeFilter ? `?memoryType=${typeFilter}` : ""}`
  );

  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[] | null>(null);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [eventDate, setEventDate] = useState(new Date().toISOString().slice(0, 10));
  const [mileage, setMileage] = useState("");
  const [memoryType, setMemoryType] = useState("ai_observation");
  const [saving, setSaving] = useState(false);

  async function search(e: React.FormEvent) {
    e.preventDefault();
    if (query.trim().length < 2) return;
    setSearching(true);
    setSearchError(null);
    try {
      const res = await api<{ results: SearchResult[] }>(
        `/api/vehicles/${params.id}/memories/search?q=${encodeURIComponent(query.trim())}`
      );
      setResults(res.results);
    } catch (err) {
      setSearchError(
        err instanceof ApiError ? err.message : "We couldn't search your memory."
      );
    } finally {
      setSearching(false);
    }
  }

  async function verify(id: string) {
    try {
      await api(`/api/vehicles/${params.id}/memories/${id}/verify`, { method: "POST" });
      reload();
    } catch (err) {
      setActionError(
        err instanceof ApiError ? err.message : "We couldn't update this memory."
      );
    }
  }

  async function remove(id: string) {
    try {
      await api(`/api/vehicles/${params.id}/memories/${id}`, { method: "DELETE" });
      reload();
    } catch (err) {
      setActionError(
        err instanceof ApiError ? err.message : "We couldn't delete this memory."
      );
    }
  }

  async function addMemory(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setActionError(null);
    try {
      await api(`/api/vehicles/${params.id}/memories`, {
        method: "POST",
        body: {
          memoryType,
          title,
          content,
          eventDate,
          mileage: mileage ? Number(mileage) : null,
          sourceType: "user_entry",
          verificationStatus: "confirmed",
        },
      });
      setTitle("");
      setContent("");
      setMileage("");
      reload();
    } catch (err) {
      setActionError(
        err instanceof ApiError ? err.message : "We couldn't save this memory."
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-8">
      <section>
        <h2 className="text-lg font-semibold text-slate-100">Vehicle memory</h2>
        <p className="mt-1 text-sm text-slate-400">
          Every record above is projected into this searchable memory. The
          assistant retrieves from here before answering.
        </p>
      </section>

      <form onSubmit={search} className="card">
        <label className="label" htmlFor="memsearch">
          Search memory
        </label>
        <div className="flex gap-2">
          <input
            id="memsearch"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="battery, brakes, vibration, or a full sentence"
            className="input"
          />
          <button
            type="submit"
            disabled={searching || query.trim().length < 2}
            className="btn-primary shrink-0"
          >
            {searching ? "Searching…" : "Search"}
          </button>
        </div>
        <p className="mt-2 text-xs text-slate-500">
          Uses semantic similarity, so related wording still matches even when
          the exact words differ.
        </p>

        {searchError && (
          <p role="alert" className="mt-2 text-sm text-signal-red">
            {searchError}
          </p>
        )}

        {results && (
          <div className="mt-4 space-y-3">
            <p className="text-xs uppercase tracking-wide text-slate-500">
              {results.length} result{results.length === 1 ? "" : "s"}
            </p>
            {results.length === 0 && (
              <p className="text-sm text-slate-400">
                Nothing in this vehicle&apos;s memory matched that.
              </p>
            )}
            {results.map((r) => (
              <article
                key={r.id}
                className="rounded-xl border border-graphite-700 bg-graphite-900 p-3.5"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h3 className="text-sm font-medium text-slate-100">{r.title}</h3>
                  <span className={STATUS_BADGE[r.verificationStatus] ?? "badge-grey"}>
                    {r.verificationStatus.replace(/_/g, " ")}
                  </span>
                </div>
                <p className="mt-1.5 text-sm text-slate-400">{r.content}</p>
                <p className="mt-2 text-xs text-slate-500">
                  {formatDate(r.eventDate)}
                  {r.mileage !== null ? ` • ${formatKm(r.mileage)}` : ""} •{" "}
                  {r.memoryType.replace(/_/g, " ")}
                </p>
              </article>
            ))}
          </div>
        )}
      </form>

      <section>
        <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-slate-400">
          Add a memory
        </h3>
        <form onSubmit={addMemory} className="card space-y-4">
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label className="label" htmlFor="mtype">Type</label>
              <select
                id="mtype"
                className="input"
                value={memoryType}
                onChange={(e) => setMemoryType(e.target.value)}
              >
                {TYPE_FILTERS.filter(Boolean).map((t) => (
                  <option key={t} value={t}>
                    {t.replace(/_/g, " ")}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="label" htmlFor="mdate">Event date</label>
              <input
                id="mdate"
                type="date"
                required
                className="input"
                value={eventDate}
                onChange={(e) => setEventDate(e.target.value)}
              />
            </div>
            <div>
              <label className="label" htmlFor="mkm">Mileage</label>
              <input
                id="mkm"
                type="number"
                min={0}
                className="input"
                value={mileage}
                onChange={(e) => setMileage(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className="label" htmlFor="mtitle">Title</label>
            <input
              id="mtitle"
              required
              className="input"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Battery replaced after starting failure"
            />
          </div>

          <div>
            <label className="label" htmlFor="mcontent">
              What happened (this is what the assistant reads)
            </label>
            <textarea
              id="mcontent"
              required
              rows={3}
              className="input"
              value={content}
              onChange={(e) => setContent(e.target.value)}
            />
          </div>

          {actionError && (
            <p role="alert" className="text-sm text-signal-red">
              {actionError}
            </p>
          )}

          <button type="submit" disabled={saving} className="btn-primary">
            {saving ? "Saving…" : "Add memory"}
          </button>
        </form>
      </section>

      <section>
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-400">
            All memories
          </h3>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="input w-auto py-1.5 text-xs"
            aria-label="Filter by type"
          >
            {TYPE_FILTERS.map((t) => (
              <option key={t || "all"} value={t}>
                {t ? t.replace(/_/g, " ") : "All types"}
              </option>
            ))}
          </select>
        </div>

        {loading && <LoadingRows rows={4} />}
        {error && <ErrorState message={error} onRetry={reload} />}

        {data && data.memories.length === 0 && (
          <EmptyState
            title="No memories yet"
            description="Memories are created automatically from the records you add, and you can add them directly here too."
          />
        )}

        {data && data.memories.length > 0 && (
          <div className="space-y-3">
            {data.memories.map((m) => (
              <article key={m.id} className="card">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h4 className="font-medium text-slate-100">{m.title}</h4>
                    <p className="mt-0.5 text-xs text-slate-500">
                      {formatDate(m.eventDate)}
                      {m.mileage !== null ? ` • ${formatKm(m.mileage)}` : ""} •{" "}
                      {m.memoryType.replace(/_/g, " ")}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={STATUS_BADGE[m.verificationStatus] ?? "badge-grey"}>
                      {m.verificationStatus.replace(/_/g, " ")}
                    </span>
                    {m.verificationStatus !== "confirmed" && (
                      <button
                        onClick={() => void verify(m.id)}
                        className="btn-ghost px-2.5 py-1 text-xs"
                      >
                        Verify
                      </button>
                    )}
                    <button
                      onClick={() => void remove(m.id)}
                      className="btn-danger px-2.5 py-1 text-xs"
                    >
                      Delete
                    </button>
                  </div>
                </div>

                <p className="mt-3 text-sm text-slate-400">{m.content}</p>

                <p className="mt-2.5 text-xs text-slate-500">
                  Source: {m.sourceType.replace(/_/g, " ")}
                </p>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
