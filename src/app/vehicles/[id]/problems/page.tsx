"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { api, ApiError } from "@/lib/api";
import { useVehicleQuery, formatDate, formatKm } from "@/lib/useVehicleQuery";
import { LoadingRows, ErrorState, EmptyState } from "@/components/States";
import type { Problem } from "@/lib/types";

const BLANK = {
  reportedDate: new Date().toISOString().slice(0, 10),
  mileage: "",
  symptom: "",
  location: "",
  severity: "medium",
  frequency: "",
  drivingConditions: "",
  initialDiagnosis: "",
  confirmedDiagnosis: "",
  repair: "",
  partsReplaced: "",
  resolution: "",
  resolutionStatus: "open",
  notes: "",
};

const SEVERITY_BADGE: Record<string, string> = {
  low: "badge-grey",
  medium: "badge-amber",
  high: "badge-red",
  critical: "badge-red",
};

export default function ProblemsPage() {
  const params = useParams<{ id: string }>();
  const { data, loading, error, reload } = useVehicleQuery<{ records: Problem[] }>(
    `/api/vehicles/${params.id}/problems`
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
      await api(`/api/vehicles/${params.id}/problems`, {
        method: "POST",
        body: {
          reportedDate: form.reportedDate,
          mileage: Number(form.mileage),
          symptom: form.symptom,
          location: form.location || null,
          severity: form.severity || null,
          frequency: form.frequency || null,
          drivingConditions: form.drivingConditions || null,
          initialDiagnosis: form.initialDiagnosis || null,
          confirmedDiagnosis: form.confirmedDiagnosis || null,
          repair: form.repair || null,
          partsReplaced: form.partsReplaced || null,
          resolution: form.resolution || null,
          resolutionStatus: form.resolutionStatus,
          notes: form.notes || null,
        },
      });
      setForm(BLANK);
      setShowForm(false);
      reload();
    } catch (err) {
      setFormError(
        err instanceof ApiError ? err.message : "We couldn't save this problem."
      );
    } finally {
      setSaving(false);
    }
  }

  async function remove(id: string) {
    setDeleting(id);
    try {
      await api(`/api/vehicles/${params.id}/problems/${id}`, { method: "DELETE" });
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
        <h2 className="text-lg font-semibold text-slate-100">Problem history</h2>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="btn-primary"
          aria-expanded={showForm}
        >
          {showForm ? "Cancel" : "Add problem"}
        </button>
      </div>

      {formError && (
        <p role="alert" className="text-sm text-signal-red">
          {formError}
        </p>
      )}

      {showForm && (
        <form onSubmit={submit} className="card space-y-4">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div>
              <label className="label" htmlFor="pdate">Reported date</label>
              <input
                id="pdate" type="date" required className="input"
                value={form.reportedDate}
                onChange={(e) => setForm({ ...form, reportedDate: e.target.value })}
              />
            </div>
            <div>
              <label className="label" htmlFor="pmileage">Mileage (km)</label>
              <input
                id="pmileage" type="number" required min={0} className="input"
                value={form.mileage}
                onChange={(e) => setForm({ ...form, mileage: e.target.value })}
                placeholder="62000"
              />
            </div>
            <div>
              <label className="label" htmlFor="pseverity">Severity</label>
              <select
                id="pseverity" className="input"
                value={form.severity}
                onChange={(e) => setForm({ ...form, severity: e.target.value })}
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
              </select>
            </div>
            <div>
              <label className="label" htmlFor="plocation">Location</label>
              <input
                id="plocation" className="input"
                value={form.location}
                onChange={(e) => setForm({ ...form, location: e.target.value })}
                placeholder="front / rear / engine bay"
              />
            </div>
            <div>
              <label className="label" htmlFor="pstatus">Status</label>
              <select
                id="pstatus" className="input"
                value={form.resolutionStatus}
                onChange={(e) => setForm({ ...form, resolutionStatus: e.target.value })}
              >
                <option value="open">Open</option>
                <option value="monitoring">Monitoring</option>
                <option value="resolved">Resolved</option>
              </select>
            </div>
            <div>
              <label className="label" htmlFor="pfrequency">Frequency</label>
              <input
                id="pfrequency" className="input"
                value={form.frequency}
                onChange={(e) => setForm({ ...form, frequency: e.target.value })}
                placeholder="constant / intermittent"
              />
            </div>
          </div>

          <div>
            <label className="label" htmlFor="psymptom">Symptom</label>
            <input
              id="psymptom" required className="input"
              value={form.symptom}
              onChange={(e) => setForm({ ...form, symptom: e.target.value })}
              placeholder="High-speed vibration"
            />
          </div>

          <div>
            <label className="label" htmlFor="pconditions">Driving conditions</label>
            <input
              id="pconditions" className="input"
              value={form.drivingConditions}
              onChange={(e) => setForm({ ...form, drivingConditions: e.target.value })}
              placeholder="80-100 km/h on highway"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="label" htmlFor="pinitial">Initial diagnosis</label>
              <input
                id="pinitial" className="input"
                value={form.initialDiagnosis}
                onChange={(e) => setForm({ ...form, initialDiagnosis: e.target.value })}
              />
            </div>
            <div>
              <label className="label" htmlFor="pconfirmed">Confirmed diagnosis</label>
              <input
                id="pconfirmed" className="input"
                value={form.confirmedDiagnosis}
                onChange={(e) => setForm({ ...form, confirmedDiagnosis: e.target.value })}
              />
            </div>
            <div>
              <label className="label" htmlFor="prepair">Repair</label>
              <input
                id="prepair" className="input"
                value={form.repair}
                onChange={(e) => setForm({ ...form, repair: e.target.value })}
              />
            </div>
            <div>
              <label className="label" htmlFor="pparts">Parts replaced</label>
              <input
                id="pparts" className="input"
                value={form.partsReplaced}
                onChange={(e) => setForm({ ...form, partsReplaced: e.target.value })}
              />
            </div>
          </div>

          <div>
            <label className="label" htmlFor="presolution">Resolution / result</label>
            <textarea
              id="presolution" rows={2} className="input"
              value={form.resolution}
              onChange={(e) => setForm({ ...form, resolution: e.target.value })}
            />
          </div>

          <button type="submit" disabled={saving} className="btn-primary">
            {saving ? "Saving…" : "Save problem"}
          </button>
        </form>
      )}

      {loading && <LoadingRows />}
      {error && <ErrorState message={error} onRetry={reload} />}

      {data && data.records.length === 0 && (
        <EmptyState
          title="No problems recorded"
          description="Recording a symptom, its diagnosis and how it was resolved is what lets the assistant connect a future symptom back to this event."
        />
      )}

      {data && data.records.length > 0 && (
        <div className="space-y-3">
          {data.records.map((p) => (
            <article key={p.id} className="card">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h3 className="font-medium text-slate-100">{p.symptom}</h3>
                  <p className="mt-0.5 text-xs text-slate-500">
                    {formatDate(p.reportedDate)} • {formatKm(p.mileage)}
                    {p.location ? ` • ${p.location}` : ""}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {p.severity && (
                    <span className={SEVERITY_BADGE[p.severity] ?? "badge-grey"}>
                      {p.severity}
                    </span>
                  )}
                  <span
                    className={
                      p.resolutionStatus === "resolved" ? "badge-green" : "badge-amber"
                    }
                  >
                    {p.resolutionStatus}
                  </span>
                  <button
                    onClick={() => void remove(p.id)}
                    disabled={deleting === p.id}
                    className="btn-danger px-2.5 py-1 text-xs"
                  >
                    {deleting === p.id ? "…" : "Delete"}
                  </button>
                </div>
              </div>

              {p.drivingConditions && (
                <p className="mt-3 text-sm text-slate-400">
                  <span className="text-slate-500">Conditions: </span>
                  {p.drivingConditions}
                </p>
              )}

              <dl className="mt-3 space-y-1.5 text-sm">
                {p.confirmedDiagnosis && (
                  <div>
                    <dt className="text-slate-500">Diagnosis</dt>
                    <dd className="text-slate-300">{p.confirmedDiagnosis}</dd>
                  </div>
                )}
                {p.repair && (
                  <div>
                    <dt className="text-slate-500">Repair</dt>
                    <dd className="text-slate-300">{p.repair}</dd>
                  </div>
                )}
                {p.partsReplaced && (
                  <div>
                    <dt className="text-slate-500">Parts</dt>
                    <dd className="text-slate-300">{p.partsReplaced}</dd>
                  </div>
                )}
                {p.resolution && (
                  <div>
                    <dt className="text-slate-500">Result</dt>
                    <dd className="text-slate-300">{p.resolution}</dd>
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
