"use client";

import { useRef, useState } from "react";
import { useParams } from "next/navigation";
import { api, API_URL, ApiError, getToken } from "@/lib/api";
import { useVehicleQuery, formatDate } from "@/lib/useVehicleQuery";
import { LoadingRows, ErrorState, EmptyState } from "@/components/States";
import type { VehicleDocument } from "@/lib/types";

const DOC_TYPES = [
  { value: "service_invoice", label: "Service invoice" },
  { value: "repair_bill", label: "Repair bill" },
  { value: "diagnostic_report", label: "Diagnostic report" },
  { value: "obd_report", label: "OBD report" },
  { value: "maintenance_record", label: "Maintenance record" },
  { value: "inspection", label: "Inspection report" },
  { value: "warranty", label: "Warranty document" },
  { value: "parts_invoice", label: "Parts invoice" },
  { value: "other", label: "Other" },
];

interface Extraction {
  id: string;
  method: string;
  detectedType: string;
  mileage: string | null;
  rawPreview: string | null;
  requiresUserConfirmation: boolean;
}

export default function DocumentsPage() {
  const params = useParams<{ id: string }>();
  const { data, loading, error, reload } = useVehicleQuery<{
    documents: VehicleDocument[];
  }>(`/api/vehicles/${params.id}/documents`);

  const fileRef = useRef<HTMLInputElement>(null);
  const [docType, setDocType] = useState("service_invoice");
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [extraction, setExtraction] = useState<Extraction | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

  async function upload(e: React.FormEvent) {
    e.preventDefault();
    const file = fileRef.current?.files?.[0];
    if (!file) {
      setUploadError("Please choose a file to upload.");
      return;
    }

    setUploading(true);
    setUploadError(null);
    setExtraction(null);

    const formData = new FormData();
    formData.append("file", file);
    formData.append("docType", docType);

    try {
      const res = await fetch(`${API_URL}/api/vehicles/${params.id}/documents`, {
        method: "POST",
        headers: { Authorization: `Bearer ${getToken()}` },
        body: formData,
      });
      const parsed = await res.json();
      if (!res.ok) {
        throw new ApiError(
          res.status,
          parsed?.error?.code ?? "upload_failed",
          parsed?.error?.message ?? "We couldn't upload that file."
        );
      }
      setExtraction(parsed.extraction);
      if (fileRef.current) fileRef.current.value = "";
      reload();
    } catch (err) {
      setUploadError(
        err instanceof ApiError ? err.message : "We couldn't upload that file."
      );
    } finally {
      setUploading(false);
    }
  }

  async function confirmExtraction(docId: string) {
    if (!extraction) return;
    const title = window.prompt(
      "Short title for this memory (you can edit it later):",
      extraction.detectedType === "service_record"
        ? "Service record from uploaded document"
        : "Record from uploaded document"
    );
    if (!title) return;

    const content = extraction.rawPreview
      ? window.prompt(
          "Review the extracted text. Edit it to record what this document actually shows:",
          extraction.rawPreview
        )
      : null;
    if (!content) return;

    const eventDate = window.prompt(
      "Date of the service or event (YYYY-MM-DD):",
      new Date().toISOString().slice(0, 10)
    );
    if (!eventDate) return;

    try {
      await api(
        `/api/vehicles/${params.id}/documents/${docId}/confirm-extraction`,
        {
          method: "POST",
          body: {
            extractionId: extraction.id,
            title,
            content,
            eventDate,
            mileage: extraction.mileage ? Number(extraction.mileage) : null,
            memoryType: "service",
          },
        }
      );
      setExtraction(null);
      reload();
    } catch (err) {
      setUploadError(
        err instanceof ApiError ? err.message : "We couldn't save this memory."
      );
    }
  }

  async function remove(id: string) {
    setDeleting(id);
    try {
      const token = getToken();
      const res = await fetch(
        `${API_URL}/api/vehicles/${params.id}/documents/${id}`,
        { method: "DELETE", headers: { Authorization: `Bearer ${token}` } }
      );
      if (!res.ok && res.status !== 204) {
        throw new ApiError(res.status, "delete_failed", "We couldn't delete that file.");
      }
      reload();
    } catch (err) {
      setUploadError(
        err instanceof ApiError ? err.message : "We couldn't delete that file."
      );
    } finally {
      setDeleting(null);
    }
  }

  const latestDocId = data?.documents[0]?.id;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-slate-100">Documents</h2>
        <p className="mt-1 text-sm text-slate-400">
          Upload invoices, reports and warranties. Extracted text is only
          reviewed by you before anything becomes part of this vehicle&apos;s
          history.
        </p>
      </div>

      <form onSubmit={upload} className="card space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label" htmlFor="doctype">Document type</label>
            <select
              id="doctype"
              className="input"
              value={docType}
              onChange={(e) => setDocType(e.target.value)}
            >
              {DOC_TYPES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label" htmlFor="docfile">File</label>
            <input
              id="docfile"
              ref={fileRef}
              type="file"
              accept=".pdf,.jpg,.jpeg,.png,.webp,application/pdf,image/jpeg,image/png,image/webp"
              required
              className="input file:mr-3 file:rounded-lg file:border-0 file:bg-graphite-700 file:px-3 file:py-1.5 file:text-sm file:text-slate-200"
            />
            <p className="mt-1.5 text-xs text-slate-500">
              PDF, JPG, PNG or WEBP. Maximum 10 MB.
            </p>
          </div>
        </div>

        {uploadError && (
          <p role="alert" className="text-sm text-signal-red">
            {uploadError}
          </p>
        )}

        <button type="submit" disabled={uploading} className="btn-primary">
          {uploading ? "Uploading and extracting…" : "Upload document"}
        </button>
      </form>

      {extraction && (
        <section className="card border-electric-500/30">
          <h3 className="font-semibold text-slate-100">
            Extracted information — not saved yet
          </h3>
          <p className="mt-1.5 text-sm text-slate-400">
            Read this over before adding it to your history. The extraction may be
            incomplete, especially for scanned or photographed documents.
          </p>

          <dl className="mt-4 space-y-2 text-sm">
            <div className="flex gap-3">
              <dt className="w-32 shrink-0 text-slate-500">Suggested type</dt>
              <dd className="text-slate-300">{extraction.detectedType}</dd>
            </div>
            <div className="flex gap-3">
              <dt className="w-32 shrink-0 text-slate-500">Detected mileage</dt>
              <dd className="text-slate-300">
                {extraction.mileage ? `${Number(extraction.mileage).toLocaleString()} km` : "Not found"}
              </dd>
            </div>
            <div className="flex gap-3">
              <dt className="w-32 shrink-0 text-slate-500">Extraction method</dt>
              <dd className="text-slate-300">{extraction.method.replace(/_/g, " ")}</dd>
            </div>
          </dl>

          {extraction.method === "image_requires_ocr" && (
            <p className="mt-4 rounded-lg bg-signal-amber/10 px-3.5 py-2.5 text-sm text-signal-amber">
              This is an image. Automatic text reading is not available for it
              yet, so please enter the details manually rather than relying on
              extraction.
            </p>
          )}

          {extraction.rawPreview && (
            <pre className="mt-4 max-h-56 overflow-y-auto whitespace-pre-wrap rounded-lg bg-graphite-900 p-3.5 text-xs text-slate-400">
              {extraction.rawPreview}
            </pre>
          )}

          {latestDocId && (
            <div className="mt-4 flex gap-2">
              <button
                onClick={() => void confirmExtraction(latestDocId)}
                className="btn-primary"
              >
                Review and add to history
              </button>
              <button
                onClick={() => setExtraction(null)}
                className="btn-ghost"
              >
                Discard
              </button>
            </div>
          )}
        </section>
      )}

      {loading && <LoadingRows />}
      {error && <ErrorState message={error} onRetry={reload} />}

      {data && data.documents.length === 0 && (
        <EmptyState
          title="No documents uploaded"
          description="Upload a service invoice or diagnostic report to keep the original paperwork alongside your records."
        />
      )}

      {data && data.documents.length > 0 && (
        <div className="space-y-3">
          {data.documents.map((d) => (
            <article key={d.id} className="card">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <h3 className="truncate font-medium text-slate-100">
                    {d.fileName}
                  </h3>
                  <p className="mt-0.5 text-xs text-slate-500">
                    {formatDate(d.uploadedAt)} •{" "}
                    {(d.fileSize / 1024).toFixed(0)} KB • {d.mimeType}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="badge-grey">
                    {DOC_TYPES.find((t) => t.value === d.docType)?.label ?? d.docType}
                  </span>
                  <a
                    href={`${API_URL}/api/vehicles/${params.id}/documents/${d.id}?download=1`}
                    className="btn-ghost px-2.5 py-1 text-xs"
                    onClick={(e) => {
                      // Downloads are authorization-checked server-side.
                      e.preventDefault();
                      void fetch(
                        `${API_URL}/api/vehicles/${params.id}/documents/${d.id}?download=1`,
                        { headers: { Authorization: `Bearer ${getToken()}` } }
                      )
                        .then((r) => r.blob())
                        .then((blob) => {
                          const url = URL.createObjectURL(blob);
                          const a = document.createElement("a");
                          a.href = url;
                          a.download = d.fileName;
                          a.click();
                          URL.revokeObjectURL(url);
                        });
                    }}
                  >
                    Download
                  </a>
                  <button
                    onClick={() => void remove(d.id)}
                    disabled={deleting === d.id}
                    className="btn-danger px-2.5 py-1 text-xs"
                  >
                    {deleting === d.id ? "…" : "Delete"}
                  </button>
                </div>
              </div>

              {d.extractions && d.extractions.length > 0 && (
                <p className="mt-2.5 text-xs text-slate-500">
                  {d.extractions.some((e) => e.confirmedAt)
                    ? "Extraction reviewed and added to history"
                    : "Extraction pending review"}
                </p>
              )}
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
