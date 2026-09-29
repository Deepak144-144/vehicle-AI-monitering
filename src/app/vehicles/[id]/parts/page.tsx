"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { api, ApiError } from "@/lib/api";
import { useVehicleQuery, formatDate, formatKm } from "@/lib/useVehicleQuery";
import { LoadingRows, ErrorState, EmptyState } from "@/components/States";
import type { Part } from "@/lib/types";

const CATEGORIES = [
  "battery", "brakes", "tyres", "engine", "electrical", "filters",
  "suspension", "fluids", "cooling", "other",
];

const BLANK = {
  partName: "",
  partCategory: "battery",
  manufacturer: "",
  partNumber: "",
  installDate: new Date().toISOString().slice(0, 10),
  installMileage: "",
  replacementDate: "",
  replacementMileage: "",
  reason: "",
  cost: "",
  warrantyMonths: "",
  expectedLifespanKm: "",
  symptomsBefore: "",
  resultAfter: "",
  notes: "",
  currentlyInstalled: true,
};

export default function PartsPage() {
  const params = useParams<{ id: string }>();
  const { data, loading, error, reload } = useVehicleQuery<{ parts: Part[] }>(
    `/api/vehicles/${params.id}/parts`
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
      await api(`/api/vehicles/${params.id}/parts`, {
        method: "POST",
        body: {
          partName: form.partName,
          partCategory: form.partCategory,
          manufacturer: form.manufacturer || null,
          partNumber: form.partNumber || null,
          installDate: form.installDate,
          installMileage: Number(form.installMileage),
          replacementDate: form.replacementDate || null,
          replacementMileage: form.replacementMileage
            ? Number(form.replacementMileage)
            : null,
          reason: form.reason || null,
          cost: form.cost ? Number(form.cost) : null,
          warrantyMonths: form.warrantyMonths ? Number(form.warrantyMonths) : null,
          expectedLifespanKm: form.expectedLifespanKm
            ? Number(form.expectedLifespanKm)
            : null,
          symptomsBefore: form.symptomsBefore || null,
          resultAfter: form.resultAfter || null,
          notes: form.notes || null,
          currentlyInstalled: form.currentlyInstalled,
        },
      });
      setForm(BLANK);
      setShowForm(false);
      reload();
    } catch (err) {
      setFormError(
        err instanceof ApiError ? err.message : "We couldn't save this part."
      );
    } finally {
      setSaving(false);
    }
  }

  async function remove(id: string) {
    setDeleting(id);
    try {
      await api(`/api/vehicles/${params.id}/parts/${id}`, { method: "DELETE" });
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
        <h2 className="text-lg font-semibold text-slate-100">Parts history</h2>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="btn-primary"
          aria-expanded={showForm}
        >
          {showForm ? "Cancel" : "Add part"}
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
              <label className="label" htmlFor="ptname">Part name</label>
              <input
                id="ptname" required className="input"
                value={form.partName}
                onChange={(e) => setForm({ ...form, partName: e.target.value })}
                placeholder="12V Battery"
              />
            </div>
            <div>
              <label className="label" htmlFor="ptcat">Category</label>
              <select
                id="ptcat" className="input"
                value={form.partCategory}
                onChange={(e) => setForm({ ...form, partCategory: e.target.value })}
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label" htmlFor="ptmfr">Manufacturer</label>
              <input
                id="ptmfr" className="input"
                value={form.manufacturer}
                onChange={(e) => setForm({ ...form, manufacturer: e.target.value })}
              />
            </div>
            <div>
              <label className="label" htmlFor="ptdate">Installation date</label>
              <input
                id="ptdate" type="date" required className="input"
                value={form.installDate}
                onChange={(e) => setForm({ ...form, installDate: e.target.value })}
              />
            </div>
            <div>
              <label className="label" htmlFor="ptkm">Installation mileage</label>
              <input
                id="ptkm" type="number" required min={0} className="input"
                value={form.installMileage}
                onChange={(e) => setForm({ ...form, installMileage: e.target.value })}
              />
            </div>
            <div>
              <label className="label" htmlFor="ptcost">Cost</label>
              <input
                id="ptcost" type="number" min={0} step="0.01" className="input"
                value={form.cost}
                onChange={(e) => setForm({ ...form, cost: e.target.value })}
              />
            </div>
            <div>
              <label className="label" htmlFor="ptrepldate">Replacement date</label>
              <input
                id="ptrepldate" type="date" className="input"
                value={form.replacementDate}
                onChange={(e) => setForm({ ...form, replacementDate: e.target.value })}
              />
            </div>
            <div>
              <label className="label" htmlFor="ptreplkm">Replacement mileage</label>
              <input
                id="ptreplkm" type="number" min={0} className="input"
                value={form.replacementMileage}
                onChange={(e) => setForm({ ...form, replacementMileage: e.target.value })}
              />
            </div>
            <div>
              <label className="label" htmlFor="ptlife">Expected lifespan (km)</label>
              <input
                id="ptlife" type="number" min={0} className="input"
                value={form.expectedLifespanKm}
                onChange={(e) => setForm({ ...form, expectedLifespanKm: e.target.value })}
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="label" htmlFor="ptreason">Reason for replacement</label>
              <input
                id="ptreason" className="input"
                value={form.reason}
                onChange={(e) => setForm({ ...form, reason: e.target.value })}
                placeholder="wear / failure / accident"
              />
            </div>
            <div>
              <label className="label" htmlFor="ptwarranty">Warranty (months)</label>
              <input
                id="ptwarranty" type="number" min={0} className="input"
                value={form.warrantyMonths}
                onChange={(e) => setForm({ ...form, warrantyMonths: e.target.value })}
              />
            </div>
            <div>
              <label className="label" htmlFor="ptbefore">Symptoms before replacement</label>
              <input
                id="ptbefore" className="input"
                value={form.symptomsBefore}
                onChange={(e) => setForm({ ...form, symptomsBefore: e.target.value })}
              />
            </div>
            <div>
              <label className="label" htmlFor="ptafter">Result after replacement</label>
              <input
                id="ptafter" className="input"
                value={form.resultAfter}
                onChange={(e) => setForm({ ...form, resultAfter: e.target.value })}
              />
            </div>
          </div>

          <label className="flex items-center gap-2.5 text-sm text-slate-300">
            <input
              type="checkbox"
              checked={form.currentlyInstalled}
              onChange={(e) => setForm({ ...form, currentlyInstalled: e.target.checked })}
              className="h-4 w-4 rounded border-graphite-600 bg-graphite-900"
            />
            This part is still installed
          </label>

          <button type="submit" disabled={saving} className="btn-primary">
            {saving ? "Saving…" : "Save part"}
          </button>
        </form>
      )}

      {loading && <LoadingRows />}
      {error && <ErrorState message={error} onRetry={reload} />}

      {data && data.parts.length === 0 && (
        <EmptyState
          title="No parts tracked"
          description="Tracking what was replaced, when, and at what mileage lets the assistant answer questions like 'how long did my last battery last'."
        />
      )}

      {data && data.parts.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2">
          {data.parts.map((p) => (
            <article key={p.id} className="card">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <h3 className="font-medium text-slate-100">{p.partName}</h3>
                  <p className="mt-0.5 text-xs text-slate-500">
                    {formatDate(p.installDate)} • {formatKm(p.installMileage)}
                    {p.manufacturer ? ` • ${p.manufacturer}` : ""}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={p.currentlyInstalled ? "badge-green" : "badge-grey"}>
                    {p.currentlyInstalled ? "Installed" : "Replaced"}
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

              {p.lifetimeKm != null && p.lifetimeKm > 0 && (
                <p className="mt-3 rounded-lg bg-graphite-900 px-3 py-2 text-sm">
                  <span className="text-slate-500">Lifetime: </span>
                  <span className="font-mono text-electric-400">
                    {p.lifetimeKm.toLocaleString()} km
                  </span>
                  {p.lifetimeMonths != null && p.lifetimeMonths > 0 && (
                    <span className="text-slate-400">
                      {" "}over {p.lifetimeMonths} months
                    </span>
                  )}
                </p>
              )}

              <dl className="mt-3 space-y-1.5 text-sm">
                {p.reason && (
                  <div>
                    <dt className="text-slate-500">Reason</dt>
                    <dd className="text-slate-300">{p.reason}</dd>
                  </div>
                )}
                {p.symptomsBefore && (
                  <div>
                    <dt className="text-slate-500">Symptoms before</dt>
                    <dd className="text-slate-300">{p.symptomsBefore}</dd>
                  </div>
                )}
                {p.resultAfter && (
                  <div>
                    <dt className="text-slate-500">Result after</dt>
                    <dd className="text-slate-300">{p.resultAfter}</dd>
                  </div>
                )}
                {p.cost && (
                  <div>
                    <dt className="text-slate-500">Cost</dt>
                    <dd className="text-slate-300">₹{Number(p.cost).toLocaleString()}</dd>
                  </div>
                )}
                {p.expectedLifespanKm && (
                  <div>
                    <dt className="text-slate-500">Expected lifespan</dt>
                    <dd className="text-slate-300">{formatKm(p.expectedLifespanKm)}</dd>
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
