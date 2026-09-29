"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { api, ApiError } from "@/lib/api";
import { useVehicleQuery, formatDate } from "@/lib/useVehicleQuery";
import { LoadingRows, ErrorState, EmptyState } from "@/components/States";
import type { FuelRecord } from "@/lib/types";

interface FuelResponse {
  records: FuelRecord[];
  summary: {
    averageFuelEconomy: number | null;
    sampleSize: number;
    earlierAverage: number | null;
    recentAverage: number | null;
    changePercent: number | null;
    isEstimate: boolean;
    note: string;
  };
}

const BLANK = {
  date: new Date().toISOString().slice(0, 10),
  mileage: "",
  fuelQuantity: "",
  fuelCost: "",
  drivingType: "mixed",
  notes: "",
};

export default function FuelPage() {
  const params = useParams<{ id: string }>();
  const { data, loading, error, reload } = useVehicleQuery<FuelResponse>(
    `/api/vehicles/${params.id}/fuel`
  );

  const [form, setForm] = useState(BLANK);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setFormError(null);
    try {
      await api(`/api/vehicles/${params.id}/fuel`, {
        method: "POST",
        body: {
          date: form.date,
          mileage: Number(form.mileage),
          fuelQuantity: Number(form.fuelQuantity),
          fuelCost: Number(form.fuelCost),
          drivingType: form.drivingType,
          notes: form.notes || null,
        },
      });
      setForm(BLANK);
      setShowForm(false);
      reload();
    } catch (err) {
      setFormError(
        err instanceof ApiError ? err.message : "We couldn't save this fuel entry."
      );
    } finally {
      setSaving(false);
    }
  }

  const summary = data?.summary;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-semibold text-slate-100">Fuel economy</h2>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="btn-primary"
          aria-expanded={showForm}
        >
          {showForm ? "Cancel" : "Add fuel entry"}
        </button>
      </div>

      {formError && (
        <p role="alert" className="text-sm text-signal-red">
          {formError}
        </p>
      )}

      {showForm && (
        <form onSubmit={submit} className="card space-y-4">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            <div>
              <label className="label" htmlFor="fdate">Date</label>
              <input
                id="fdate" type="date" required className="input"
                value={form.date}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
              />
            </div>
            <div>
              <label className="label" htmlFor="fkm">Odometer (km)</label>
              <input
                id="fkm" type="number" required min={0} className="input"
                value={form.mileage}
                onChange={(e) => setForm({ ...form, mileage: e.target.value })}
              />
            </div>
            <div>
              <label className="label" htmlFor="fqty">Fuel quantity (L)</label>
              <input
                id="fqty" type="number" required min={0.01} step="0.01" className="input"
                value={form.fuelQuantity}
                onChange={(e) => setForm({ ...form, fuelQuantity: e.target.value })}
              />
            </div>
            <div>
              <label className="label" htmlFor="fcost">Fuel cost</label>
              <input
                id="fcost" type="number" required min={0} step="0.01" className="input"
                value={form.fuelCost}
                onChange={(e) => setForm({ ...form, fuelCost: e.target.value })}
              />
            </div>
            <div>
              <label className="label" htmlFor="fdriving">Driving type</label>
              <select
                id="fdriving" className="input"
                value={form.drivingType}
                onChange={(e) => setForm({ ...form, drivingType: e.target.value })}
              >
                <option value="city">City</option>
                <option value="highway">Highway</option>
                <option value="mixed">Mixed</option>
              </select>
            </div>
          </div>

          <p className="text-xs text-slate-500">
            Distance and fuel economy are calculated from your odometer readings
            and shown as estimates.
          </p>

          <button type="submit" disabled={saving} className="btn-primary">
            {saving ? "Saving…" : "Save fuel entry"}
          </button>
        </form>
      )}

      {loading && <LoadingRows />}
      {error && <ErrorState message={error} onRetry={reload} />}

      {data && data.records.length === 0 && (
        <EmptyState
          title="No fuel entries"
          description="Recording fill-ups lets the assistant show fuel economy trends over time."
        />
      )}

      {summary && summary.sampleSize > 0 && (
        <section className="grid gap-4 sm:grid-cols-3">
          <div className="stat">
            <p className="stat-label">Average economy</p>
            <p className="stat-value">
              {summary.averageFuelEconomy ?? "—"} km/L
            </p>
            <p className="mt-0.5 text-xs text-slate-500">
              from {summary.sampleSize} fill-ups
            </p>
          </div>
          <div className="stat">
            <p className="stat-label">Earlier average</p>
            <p className="stat-value">
              {summary.earlierAverage !== null ? `${summary.earlierAverage} km/L` : "—"}
            </p>
          </div>
          <div className="stat">
            <p className="stat-label">Recent average</p>
            <p className="stat-value">
              {summary.recentAverage !== null ? `${summary.recentAverage} km/L` : "—"}
            </p>
            {summary.changePercent !== null && (
              <p
                className={`mt-0.5 text-xs ${
                  summary.changePercent < 0 ? "text-signal-amber" : "text-signal-green"
                }`}
              >
                {summary.changePercent > 0 ? "+" : ""}
                {summary.changePercent}% vs earlier entries
              </p>
            )}
          </div>
        </section>
      )}

      {summary && summary.changePercent !== null && Math.abs(summary.changePercent) >= 10 && (
        <div className="card border-signal-amber/30 bg-signal-amber/5">
          <p className="text-sm text-slate-300">
            Your recorded fuel economy changed by{" "}
            <span className="font-semibold text-signal-amber">
              {summary.changePercent > 0 ? "+" : ""}
              {summary.changePercent}%
            </span>{" "}
            between your earlier and more recent entries.
          </p>
          <p className="mt-2 text-sm text-slate-400">
            This is a pattern in your recorded data, not a diagnosis. Changes in
            driving type, traffic, load or climate affect fuel economy. If it
            concerns you, have the vehicle inspected.
          </p>
        </div>
      )}

      {data && data.records.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-graphite-700 text-left text-xs uppercase tracking-wide text-slate-500">
                <th className="py-2.5 pr-4 font-medium">Date</th>
                <th className="py-2.5 pr-4 font-medium">Odometer</th>
                <th className="py-2.5 pr-4 font-medium">Fuel</th>
                <th className="py-2.5 pr-4 font-medium">Economy</th>
                <th className="py-2.5 pr-4 font-medium">Driving</th>
                <th className="py-2.5 font-medium">Cost</th>
              </tr>
            </thead>
            <tbody>
              {data.records.map((r) => (
                <tr key={r.id} className="border-b border-graphite-800">
                  <td className="py-2.5 pr-4 text-slate-300">{formatDate(r.date)}</td>
                  <td className="py-2.5 pr-4 font-mono text-slate-400">
                    {r.mileage.toLocaleString()} km
                  </td>
                  <td className="py-2.5 pr-4 text-slate-400">{r.fuelQuantity} L</td>
                  <td className="py-2.5 pr-4 text-slate-200">
                    {r.fuelEconomy ? `${r.fuelEconomy} km/L` : "—"}
                  </td>
                  <td className="py-2.5 pr-4 text-slate-400">
                    <span className="badge-grey">{r.drivingType ?? "—"}</span>
                  </td>
                  <td className="py-2.5 text-slate-400">
                    ₹{Number(r.fuelCost).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
