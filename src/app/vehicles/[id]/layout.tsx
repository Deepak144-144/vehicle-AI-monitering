"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { api, ApiError } from "@/lib/api";
import type { Vehicle } from "@/lib/types";

const NAV = [
  { href: "", label: "Overview" },
  { href: "/timeline", label: "Timeline" },
  { href: "/chat", label: "AI Assistant" },
  { href: "/problems", label: "Problems" },
  { href: "/services", label: "Services" },
  { href: "/parts", label: "Parts" },
  { href: "/diagnostics", label: "Diagnostics" },
  { href: "/fuel", label: "Fuel" },
  { href: "/documents", label: "Documents" },
  { href: "/memory", label: "Memory" },
  { href: "/analytics", label: "Analytics" },
];

export default function VehicleLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const params = useParams<{ id: string }>();
  const pathname = usePathname();
  const router = useRouter();
  const { user, loading } = useAuth();
  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && !user) router.replace("/login");
  }, [loading, user, router]);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const res = await api<{ vehicle: Vehicle }>(`/api/vehicles/${params.id}`);
        if (!cancelled) setVehicle(res.vehicle);
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof ApiError
              ? err.message
              : "We couldn't load this vehicle."
          );
        }
      }
    }
    if (user && params?.id) void load();
    return () => {
      cancelled = true;
    };
  }, [user, params?.id]);

  if (error) {
    return (
      <main className="mx-auto max-w-3xl px-6 py-16">
        <div className="card">
          <p className="text-sm text-signal-red">{error}</p>
          <Link href="/dashboard" className="btn-ghost mt-4">
            Back to vehicles
          </Link>
        </div>
      </main>
    );
  }

  const base = `/vehicles/${params.id}`;

  return (
    <div className="min-h-screen">
      <header className="border-b border-graphite-800 bg-graphite-900/60 backdrop-blur">
        <div className="mx-auto max-w-7xl px-6 py-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-4">
              <Link
                href="/dashboard"
                className="text-sm text-slate-400 hover:text-slate-200"
              >
                ← Vehicles
              </Link>
              <div>
                <h1 className="font-semibold text-slate-50">
                  {vehicle
                    ? `${vehicle.make} ${vehicle.model}`
                    : "Loading vehicle…"}
                </h1>
                {vehicle && (
                  <p className="text-xs text-slate-400">
                    {vehicle.manufacturingYear}
                    {vehicle.fuelType ? ` • ${vehicle.fuelType}` : ""} •{" "}
                    <span className="font-mono">
                      {vehicle.currentMileage.toLocaleString()} km
                    </span>
                  </p>
                )}
              </div>
            </div>
            {vehicle?.isDemo && <span className="badge-blue">Demo data</span>}
          </div>

          <nav aria-label="Vehicle sections" className="mt-4 -mb-4 overflow-x-auto">
            <ul className="flex gap-1 whitespace-nowrap">
              {NAV.map((item) => {
                const href = `${base}${item.href}`;
                const active =
                  item.href === ""
                    ? pathname === base
                    : pathname.startsWith(href);
                return (
                  <li key={item.label}>
                    <Link
                      href={href}
                      aria-current={active ? "page" : undefined}
                      className={`inline-block border-b-2 px-3.5 py-2.5 text-sm transition-colors ${
                        active
                          ? "border-electric-500 text-electric-400"
                          : "border-transparent text-slate-400 hover:text-slate-200"
                      }`}
                    >
                      {item.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-6 py-8">{children}</main>
    </div>
  );
}
