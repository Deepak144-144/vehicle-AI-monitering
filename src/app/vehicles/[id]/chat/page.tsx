"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import { api, ApiError } from "@/lib/api";
import type { ChatMessage, SearchResult, SuggestedMemory } from "@/lib/types";

const SUGGESTIONS = [
  "My car is vibrating at high speed.",
  "Have I had this problem before?",
  "What happened around 62,000 km?",
  "When did I last replace the brakes?",
  "How long did my last battery last?",
  "What changed in my vehicle over the last year?",
  "How much have I spent on maintenance?",
  "Show me all battery-related problems.",
];

interface LocalMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  suggestedMemory?: SuggestedMemory | null;
  savedState?: "pending" | "saved" | "dismissed";
}

export default function ChatPage() {
  const params = useParams<{ id: string }>();
  const [messages, setMessages] = useState<LocalMessage[]>([]);
  const [input, setInput] = useState("");
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  const [symptom, setSymptom] = useState("");
  const [matches, setMatches] = useState<SearchResult[] | null>(null);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, sending]);

  const send = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || sending) return;

      const userMessage: LocalMessage = {
        id: `local-${Date.now()}`,
        role: "user",
        content: trimmed,
      };
      setMessages((prev) => [...prev, userMessage]);
      setInput("");
      setSending(true);
      setError(null);

      try {
        const res = await api<{
          conversationId: string;
          reply: string;
          suggestedMemory: SuggestedMemory | null;
        }>(`/api/vehicles/${params.id}/chat`, {
          method: "POST",
          body: { message: trimmed, ...(conversationId ? { conversationId } : {}) },
        });

        setConversationId(res.conversationId);
        setMessages((prev) => [
          ...prev,
          {
            id: `assistant-${Date.now()}`,
            role: "assistant",
            content: res.reply,
            suggestedMemory: res.suggestedMemory,
            savedState: res.suggestedMemory ? "pending" : undefined,
          },
        ]);
      } catch (err) {
        setError(
          err instanceof ApiError ? err.message : "We couldn't reach the assistant."
        );
        setMessages((prev) => prev.filter((m) => m.id !== userMessage.id));
        setInput(trimmed);
      } finally {
        setSending(false);
      }
    },
    [conversationId, params.id, sending]
  );

  async function searchSymptom(e: React.FormEvent) {
    e.preventDefault();
    if (!symptom.trim()) return;
    setSearching(true);
    setMatches(null);
    try {
      const res = await api<{ matches: SearchResult[] }>(
        `/api/vehicles/${params.id}/memories/similar`,
        { method: "POST", body: { symptom: symptom.trim() } }
      );
      setMatches(res.matches);
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : "We couldn't search your history."
      );
    } finally {
      setSearching(false);
    }
  }

  async function respondToSuggestion(
    messageId: string,
    accept: boolean,
    apiMessageId?: string
  ) {
    // Optimistically mark resolved.
    setMessages((prev) =>
      prev.map((m) =>
        m.id === messageId
          ? { ...m, savedState: accept ? "saved" : "dismissed" }
          : m
      )
    );

    if (!conversationId || !apiMessageId) return;
    try {
      await api(
        `/api/vehicles/${params.id}/chat/${conversationId}/${apiMessageId}/save-memory`,
        { method: "POST", body: { accept } }
      );
    } catch {
      // The UI already reflects the decision; surface nothing further.
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <div className="lg:col-span-2">
        <div className="card flex h-[calc(100vh-15rem)] min-h-[32rem] flex-col p-0">
          <div className="border-b border-graphite-700 px-5 py-4">
            <h2 className="font-semibold text-slate-100">Vehicle Memory Assistant</h2>
            <p className="mt-0.5 text-xs text-slate-400">
              Answers are grounded in your recorded history. A past diagnosis
              never confirms the current cause.
            </p>
          </div>

          <div
            className="flex-1 space-y-4 overflow-y-auto px-5 py-5"
            aria-live="polite"
          >
            {messages.length === 0 && (
              <div className="space-y-4">
                <p className="text-sm text-slate-400">
                  Ask anything about this vehicle. The assistant searches your
                  full history first, then reasons over what it found.
                </p>
                <div className="flex flex-wrap gap-2">
                  {SUGGESTIONS.map((s) => (
                    <button
                      key={s}
                      onClick={() => void send(s)}
                      className="rounded-full border border-graphite-600 bg-graphite-800 px-3.5 py-1.5 text-xs text-slate-300 transition-colors hover:border-electric-500/50 hover:text-electric-400"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((m) => (
              <div
                key={m.id}
                className={m.role === "user" ? "flex justify-end" : ""}
              >
                <div
                  className={
                    m.role === "user"
                      ? "max-w-[85%] rounded-2xl rounded-br-sm bg-electric-600 px-4 py-2.5 text-sm text-white"
                      : "max-w-[92%] rounded-2xl rounded-bl-sm border border-graphite-700 bg-graphite-800 px-4 py-3 text-sm leading-relaxed text-slate-200"
                  }
                >
                  <p className="whitespace-pre-wrap">{m.content}</p>

                  {m.suggestedMemory && m.savedState === "pending" && (
                    <div className="mt-4 rounded-xl border border-signal-amber/30 bg-signal-amber/5 p-3.5">
                      <p className="text-xs font-semibold uppercase tracking-wide text-signal-amber">
                        Possible memory — not saved yet
                      </p>
                      <p className="mt-2 text-sm text-slate-200">
                        {m.suggestedMemory.title}
                      </p>
                      <p className="mt-1 text-sm text-slate-400">
                        {m.suggestedMemory.content}
                      </p>
                      <p className="mt-1 text-xs text-slate-500">
                        Approximate date: {m.suggestedMemory.eventDate}
                        {m.suggestedMemory.mileage !== null
                          ? ` • ${m.suggestedMemory.mileage.toLocaleString()} km`
                          : ""}
                      </p>
                      <div className="mt-3 flex gap-2">
                        <button
                          onClick={() => void respondToSuggestion(m.id, true)}
                          className="btn-primary px-3 py-1.5 text-xs"
                        >
                          Save to history
                        </button>
                        <button
                          onClick={() => void respondToSuggestion(m.id, false)}
                          className="btn-ghost px-3 py-1.5 text-xs"
                        >
                          Ignore
                        </button>
                      </div>
                    </div>
                  )}

                  {m.savedState === "saved" && (
                    <p className="mt-3 text-xs text-signal-green">
                      Saved to this vehicle&apos;s history.
                    </p>
                  )}
                  {m.savedState === "dismissed" && (
                    <p className="mt-3 text-xs text-slate-500">
                      Not saved.
                    </p>
                  )}
                </div>
              </div>
            ))}

            {sending && (
              <div className="flex items-center gap-2 text-sm text-slate-500">
                <span
                  className="h-2 w-2 animate-pulse rounded-full bg-electric-500"
                  aria-hidden
                />
                Searching vehicle history…
              </div>
            )}

            <div ref={bottomRef} />
          </div>

          {error && (
            <p
              role="alert"
              className="border-t border-graphite-700 px-5 py-3 text-sm text-signal-red"
            >
              {error}
            </p>
          )}

          <form
            onSubmit={(e) => {
              e.preventDefault();
              void send(input);
            }}
            className="flex gap-2 border-t border-graphite-700 p-4"
          >
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about your vehicle…"
              className="input"
              aria-label="Message"
              disabled={sending}
            />
            <button
              type="submit"
              disabled={sending || !input.trim()}
              className="btn-primary shrink-0"
            >
              Send
            </button>
          </form>
        </div>
      </div>

      <div className="space-y-6">
        <section className="card">
          <h2 className="font-semibold text-slate-100">
            Have I had this before?
          </h2>
          <p className="mt-1 text-sm text-slate-400">
            Describe a symptom and search your history for similar past events.
          </p>

          <form onSubmit={searchSymptom} className="mt-4 space-y-3">
            <input
              value={symptom}
              onChange={(e) => setSymptom(e.target.value)}
              placeholder="e.g. vibration at high speed"
              className="input"
              aria-label="Symptom"
            />
            <button
              type="submit"
              disabled={searching || !symptom.trim()}
              className="btn-primary w-full"
            >
              {searching ? "Searching…" : "Search my history"}
            </button>
          </form>

          {matches !== null && (
            <div className="mt-4 space-y-3">
              {matches.length === 0 ? (
                <p className="text-sm text-slate-400">
                  No similar event found in this vehicle&apos;s recorded history.
                </p>
              ) : (
                matches.map((m) => (
                  <article
                    key={m.id}
                    className="rounded-xl border border-graphite-700 bg-graphite-900 p-3.5"
                  >
                    <p className="text-xs uppercase tracking-wide text-slate-500">
                      {new Date(m.eventDate).toLocaleDateString()}
                      {m.mileage !== null &&
                        ` • ${m.mileage.toLocaleString()} km`}
                    </p>
                    <h3 className="mt-1.5 text-sm font-medium text-slate-100">
                      {m.title}
                    </h3>
                    <p className="mt-1.5 text-sm text-slate-400">{m.content}</p>
                    <p className="mt-2 text-xs text-slate-500">
                      Source: {m.sourceType.replace(/_/g, " ")} •{" "}
                      {m.verificationStatus.replace(/_/g, " ")}
                    </p>
                  </article>
                ))
              )}
            </div>
          )}
        </section>

        <section className="card">
          <h2 className="font-semibold text-slate-100">How this works</h2>
          <ul className="mt-3 space-y-2.5 text-sm text-slate-400">
            <li>
              Every question triggers a structured and semantic search of this
              vehicle&apos;s records first.
            </li>
            <li>
              The assistant can only describe events that exist in your history.
            </li>
            <li>
              A previous diagnosis is presented as a past event, never as the
              confirmed current cause.
            </li>
            <li>
              Nothing is added to your history without your confirmation.
            </li>
          </ul>
        </section>
      </div>
    </div>
  );
}
