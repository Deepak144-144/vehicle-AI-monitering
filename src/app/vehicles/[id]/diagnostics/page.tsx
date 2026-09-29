"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { api, ApiError } from "@/lib/api";
import { useVehicleQuery, formatDate, formatKm } from "@/lib/useVehicleQuery";
import { LoadingRows, ErrorState, EmptyState } from "@/components/States";
import type { Diagnostic } from "@/lib/types";

const BLANK = {
  date: new Date().toISOString().slice(0, 10),
  mileage: "",
  obdCode: "",
  description: "",
  technicianNotes: "",
  scannerResults: "",
  diagnosis: "",
  repair: "",
  resolution: "",
  cost: "",
};

export default function DiagnosticsPage() {
  const params = useParams<{ id: string }>();
  const { data, loading, error, reload } = useVehicleQuery<{ records: Diagnostic[] }>(
    `/api/vehicles/${params.id}/diagnostics`
  );

  const [form, setForm] = useState(BLANK);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setFormError(null);
    try {
      await api(`/api/vehicles/${params.id}/diagnostics`, {
        method: "POST",
        body: {
          date: form.date,
          mileage: form.mileage ? Number(form.mileage) : null,
          obdCode: form.obdCode || null,
          description: form.description || null,
          technicianNotes: form.technicianNotes || null,
          scannerResults: form.scannerResults || null,
          diagnosis: form.diagnosis || null,
          repair: form.repair || null,
          resolution: form.resolution || null,
          cost: form.cost ? Number(form.cost) : null,
        },
      });
      setForm(BLANK);
      setShowForm(false);
      reload();
    } catch (err) {
      setFormError(
        err instanceof ApiError ? err.message : "We couldn't save this diagnostic."
      );
    } finally {
      setSaving(false);
    }
  }

  async function remove(id: string) {
    setDeleting(id);
    try {
      await api(`/api/vehicles/${params.id}/diagnostics/${id}`, { method: "DELETE" });
      reload();
    } catch (err) {
      setFormError(
        err instanceof ApiError ? err.message : "We couldn't delete this record."
      );
    } finally {
      setDeleting(null);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-semibold text-slate-100">Diagnostic history</h2>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="btn-primary"
          aria-expanded={showForm}
        >
          {showForm ? "Cancel" : "Add diagnostic"}
        </button>
      </div>

      {formError && (
        <p role="alert" className="text-sm text-signal-red">
          {formError}
        </p>
      )}

      {showForm && (
        <form onSubmit={submit} className="card space-y-4">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <label className="label" htmlFor="ddate">Date</label>
              <input
                id="ddate" type="date" required className="input"
                value={form.date}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
              />
            </div>
            <div>
              <label className="label" htmlFor="dkm">Mileage (km)</label>
              <input
                id="dkm" type="number" min={0} className="input"
                value={form.mileage}
                onChange={(e) => setForm({ ...form, mileage: e.target.value })}
              />
            </div>
            <div>
              <label className="label" htmlFor="dcode">OBD code</label>
              <input
                id="dcode" className="input" placeholder="P0301"
                value={form.obdCode}
                onChange={(e) => setForm({ ...form, obdCode: e.target.value.toUpperCase() })}
              />
            </div>
            <div>
              <label className="label" htmlFor="dcost">Cost</label>
              <input
                id="dcost" type="number" min={0} step="0.01" className="input"
                value={form.cost}
                onChange={(e) => setForm({ ...form, cost: e.target.value })}
              />
            </div>
          </div>

          <div>
            <label className="label" htmlFor="ddesc">Description</label>
            <input
              id="ddesc" className="input"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Cylinder 1 misfire detected"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="label" htmlFor="ddiag">Diagnosis</label>
              <input
                id="ddiag" className="input"
                value={form.diagnosis}
                onChange={(e) => setForm({ ...form, diagnosis: e.target.value })}
              />
            </div>
            <div>
              <label className="label" htmlFor="drepair">Repair</label>
              <input
                id="drepair" className="input"
                value={form.repair}
                onChange={(e) => setForm({ ...form, repair: e.target.value })}
              />
            </div>
            <div>
              <label className="label" htmlFor="dres">Resolution</label>
              <input
                id="dres" className="input"
                value={form.resolution}
                onChange={(e) => setForm({ ...form, resolution: e.target.value })}
              />
            </div>
            <div>
              <label className="label" htmlFor="dscan">Scanner results</label>
              <input
                id="dscan" className="input"
                value={form.scannerResults}
                onChange={(e) => setForm({ ...form, scannerResults: e.target.value })}
              />
            </div>
          </div>

          <button type="submit" disabled={saving} className="btn-primary">
            {saving ? "Saving…" : "Save diagnostic"}
          </button>
        </form>
      )}

      {loading && <LoadingRows />}
      {error && <ErrorState message={error} onRetry={reload} />}

      {data && data.records.length === 0 && (
        <EmptyState
          title="No diagnostics recorded"
          description="Log OBD codes, scanner results and their resolution so the assistant can connect a future warning light back to a past event."
        />
      )}

      {data && data.records.length > 0 && (
        <div className="space-y-3">
          {data.records.map((d) => (
            <article key={d.id} className="card">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h3 className="font-medium text-slate-100">
                    {d.obdCode ? `OBD ${d.obdCode}` : "Diagnostic event"}
                  </h3>
                  <p className="mt-0.5 text-xs text-slate-500">
                    {formatDate(d.date)}
                    {d.mileage !== null ? ` • ${formatKm(d.mileage)}` : ""}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {d.cost && (
                    <span className="badge-grey">₹{Number(d.cost).toLocaleString()}</span>
                  )}
                  <button
                    onClick={() => void remove(d.id)}
                    disabled={deleting === d.id}
                    className="btn-danger px-2.5 py-1 text-xs"
                  >
                    {deleting === d.id ? "…" : "Delete"}
                  </button>
                </div>
              </div>

              {d.description && (
                <p className="mt-3 text-sm text-slate-300">{d.description}</p>
              )}

              <dl className="mt-3 space-y-1.5 text-sm">
                {d.scannerResults && (
                  <div>
                    <dt className="text-slate-500">Scanner</dt>
                    <dd className="text-slate-300">{d.scannerResults}</dd>
                  </div>
                )}
                {d.diagnosis && (
                  <div>
                    <dt className="text-slate-500">Diagnosis</dt>
                    <dd className="text-slate-300">{d.diagnosis}</dd>
                  </div>
                )}
                {d.repair && (
                  <div>
                    <dt className="text-slate-500">Repair</dt>
                    <dd className="text-slate-300">{d.repair}</dd>
                  </div>
                )}
                {d.resolution && (
                  <div>
                    <dt className="text-slate-500">Resolution</dt>
                    <dd className="text-slate-300">{d.resolution}</dd>
                  </div>
                )}
              </dl>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
