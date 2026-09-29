"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { api, ApiError } from "@/lib/api";
import { useVehicleQuery, formatDate, formatKm } from "@/lib/useVehicleQuery";
import { LoadingRows, ErrorState, EmptyState } from "@/components/States";
import type { ServiceRecord } from "@/lib/types";

const BLANK = {
  serviceDate: new Date().toISOString().slice(0, 10),
  mileage: "",
  serviceCenter: "",
  serviceType: "Periodic Maintenance",
  workPerformed: "",
  technicianNotes: "",
  cost: "",
  nextServiceMileage: "",
  nextServiceDate: "",
};

export default function ServicesPage() {
  const params = useParams<{ id: string }>();
  const { data, loading, error, reload } = useVehicleQuery<{
    records: ServiceRecord[];
  }>(`/api/vehicles/${params.id}/services`);

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
      await api(`/api/vehicles/${params.id}/services`, {
        method: "POST",
        body: {
          serviceDate: form.serviceDate,
          mileage: Number(form.mileage),
          serviceCenter: form.serviceCenter || null,
          serviceType: form.serviceType,
          workPerformed: form.workPerformed || null,
          technicianNotes: form.technicianNotes || null,
          cost: form.cost ? Number(form.cost) : null,
          nextServiceMileage: form.nextServiceMileage
            ? Number(form.nextServiceMileage)
            : null,
          nextServiceDate: form.nextServiceDate || null,
        },
      });
      setForm(BLANK);
      setShowForm(false);
      reload();
    } catch (err) {
      setFormError(
        err instanceof ApiError ? err.message : "We couldn't save this service record."
      );
    } finally {
      setSaving(false);
    }
  }

  async function remove(id: string) {
    setDeleting(id);
    try {
      await api(`/api/vehicles/${params.id}/services/${id}`, {
        method: "DELETE",
      });
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
        <h2 className="text-lg font-semibold text-slate-100">Service history</h2>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="btn-primary"
          aria-expanded={showForm}
        >
          {showForm ? "Cancel" : "Add service record"}
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
              <label className="label" htmlFor="sdate">Service date</label>
              <input
                id="sdate" type="date" required className="input"
                value={form.serviceDate}
                onChange={(e) => setForm({ ...form, serviceDate: e.target.value })}
              />
            </div>
            <div>
              <label className="label" htmlFor="smileage">Mileage (km)</label>
              <input
                id="smileage" type="number" required min={0} className="input"
                value={form.mileage}
                onChange={(e) => setForm({ ...form, mileage: e.target.value })}
                placeholder="45200"
              />
            </div>
            <div>
              <label className="label" htmlFor="stype">Service type</label>
              <input
                id="stype" required className="input"
                value={form.serviceType}
                onChange={(e) => setForm({ ...form, serviceType: e.target.value })}
              />
            </div>
            <div>
              <label className="label" htmlFor="scenter">Service center</label>
              <input
                id="scenter" className="input"
                value={form.serviceCenter}
                onChange={(e) => setForm({ ...form, serviceCenter: e.target.value })}
              />
            </div>
            <div>
              <label className="label" htmlFor="scost">Cost</label>
              <input
                id="scost" type="number" min={0} step="0.01" className="input"
                value={form.cost}
                onChange={(e) => setForm({ ...form, cost: e.target.value })}
              />
            </div>
            <div>
              <label className="label" htmlFor="snextkm">Next service mileage</label>
              <input
                id="snextkm" type="number" min={0} className="input"
                value={form.nextServiceMileage}
                onChange={(e) => setForm({ ...form, nextServiceMileage: e.target.value })}
              />
            </div>
            <div>
              <label className="label" htmlFor="snextdate">Next service date</label>
              <input
                id="snextdate" type="date" className="input"
                value={form.nextServiceDate}
                onChange={(e) => setForm({ ...form, nextServiceDate: e.target.value })}
              />
            </div>
          </div>

          <div>
            <label className="label" htmlFor="swork">Work performed (one per line)</label>
            <textarea
              id="swork" rows={4} className="input"
              value={form.workPerformed}
              onChange={(e) => setForm({ ...form, workPerformed: e.target.value })}
              placeholder={"Engine oil changed\nOil filter replaced\nBrake inspection"}
            />
          </div>

          <div>
            <label className="label" htmlFor="snotes">Technician notes</label>
            <textarea
              id="snotes" rows={2} className="input"
              value={form.technicianNotes}
              onChange={(e) => setForm({ ...form, technicianNotes: e.target.value })}
            />
          </div>

          <button type="submit" disabled={saving} className="btn-primary">
            {saving ? "Saving…" : "Save service record"}
          </button>
        </form>
      )}

      {loading && <LoadingRows />}
      {error && <ErrorState message={error} onRetry={reload} />}

      {data && data.records.length === 0 && (
        <EmptyState
          title="No service records yet"
          description="Add your first service visit so the assistant can reference it when you ask about maintenance or costs."
        />
      )}

      {data && data.records.length > 0 && (
        <div className="space-y-3">
          {data.records.map((r) => (
            <article key={r.id} className="card">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h3 className="font-medium text-slate-100">{r.serviceType}</h3>
                  <p className="mt-0.5 text-xs text-slate-500">
                    {formatDate(r.serviceDate)} • {formatKm(r.mileage)}
                    {r.serviceCenter ? ` • ${r.serviceCenter}` : ""}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {r.cost && <span className="badge-grey">₹{Number(r.cost).toLocaleString()}</span>}
                  <button
                    onClick={() => void remove(r.id)}
                    disabled={deleting === r.id}
                    className="btn-danger px-2.5 py-1 text-xs"
                  >
                    {deleting === r.id ? "…" : "Delete"}
                  </button>
                </div>
              </div>

              {r.workPerformed && (
                <ul className="mt-3 space-y-1">
                  {r.workPerformed.split("\n").filter(Boolean).map((line, i) => (
                    <li key={i} className="flex gap-2 text-sm text-slate-300">
                      <span className="text-slate-600" aria-hidden>•</span>
                      {line}
                    </li>
                  ))}
                </ul>
              )}

              {r.technicianNotes && (
                <p className="mt-3 rounded-lg bg-graphite-900 px-3 py-2 text-sm text-slate-400">
                  <span className="text-slate-500">Technician notes: </span>
                  {r.technicianNotes}
                </p>
              )}

              {(r.nextServiceMileage || r.nextServiceDate) && (
                <p className="mt-3 text-xs text-slate-500">
                  Next service:{" "}
                  {r.nextServiceMileage ? formatKm(r.nextServiceMileage) : ""}
                  {r.nextServiceMileage && r.nextServiceDate ? " or " : ""}
                  {r.nextServiceDate ? formatDate(r.nextServiceDate) : ""}
                </p>
              )}
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
