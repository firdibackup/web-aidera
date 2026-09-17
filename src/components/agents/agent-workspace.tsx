"use client";

import { useQuery } from "@tanstack/react-query";
import { Loader2, Send } from "lucide-react";
import { useState, type FormEvent } from "react";
import { toast } from "sonner";

import { agentStatusLabel, agentStatusTone } from "@/components/agents/agents-screen";
import { StructuredMessage } from "@/components/chat/structured-message";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import { Skeleton, StateBlock } from "@/components/ui/state";
import { bff, createIdempotencyKey } from "@/lib/api/client";
import {
  RunDetailSchema,
  RunSummarySchema,
  TERMINAL_RUN_STATUSES,
  type AgentResponseV1,
  type AgentSlug,
  type Message,
  type RunDetail,
  type Thread,
} from "@/lib/api/contracts";
import { formatInJakarta } from "@/lib/dates/jakarta";
import {
  agentQueryOptions,
  messagesQueryOptions,
  threadsQueryOptions,
} from "@/lib/query/options";
import { cn } from "@/lib/utils/cn";

type WorkspaceTab = "thread" | "chat" | "context";

const tabs: { id: WorkspaceTab; label: string }[] = [
  { id: "thread", label: "Thread" },
  { id: "chat", label: "Chat" },
  { id: "context", label: "Context" },
];

export function AgentWorkspace({ slug }: { slug: AgentSlug }) {
  const agent = useQuery(agentQueryOptions(slug));
  const threads = useQuery(threadsQueryOptions({ agent: slug }));
  const [activeThreadId, setActiveThreadId] = useState<number | null>(null);
  const [tab, setTab] = useState<WorkspaceTab>("chat");

  const threadList = threads.data?.data ?? [];
  const selectedThread =
    threadList.find((thread) => thread.id === activeThreadId) ?? threadList[0] ?? null;

  return (
    <>
      <PageHeader
        title={agent.data?.data.name ?? "Agent"}
        snippet={agent.data?.data.role ?? "Memuat profil agent."}
        meta={
          agent.data ? (
            <>
              <Badge tone={agentStatusTone[agent.data.data.status]}>
                {agentStatusLabel[agent.data.data.status]}
              </Badge>
              <Badge tone="neutral">{agent.data.data.profile}</Badge>
              <Badge tone="neutral">{agent.data.data.model}</Badge>
            </>
          ) : null
        }
      />

      {agent.isError ? (
        <StateBlock
          tone="danger"
          title="Agent tidak dapat dimuat"
          description="Profil agent tidak tersedia dari BFF saat ini."
          action={
            <Button size="sm" variant="secondary" onClick={() => void agent.refetch()}>
              Coba lagi
            </Button>
          }
        />
      ) : null}

      <div
        role="tablist"
        aria-label="Panel agent"
        className="flex gap-1 rounded-[var(--radius-control)] bg-surface-sunken p-1 lg:hidden"
      >
        {tabs.map((item) => (
          <button
            key={item.id}
            type="button"
            role="tab"
            aria-selected={tab === item.id}
            onClick={() => setTab(item.id)}
            className={cn(
              "min-h-11 flex-1 rounded-[9px] text-[0.8125rem] font-medium transition-colors",
              tab === item.id ? "bg-surface text-ink shadow-sm" : "text-ink-muted",
            )}
          >
            {item.label}
          </button>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,17rem)_minmax(0,1fr)_minmax(0,19rem)]">
        <section
          aria-label="Threads"
          className={cn("panel flex flex-col p-4", tab === "thread" ? "flex" : "hidden lg:flex")}
        >
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-sm font-semibold text-ink">Threads</h2>
            <Badge tone="neutral">{threadList.length}</Badge>
          </div>

          {threads.isPending ? (
            <div className="mt-3 flex flex-col gap-2">
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
            </div>
          ) : null}

          {threads.data && threadList.length === 0 ? (
            <p className="mt-3 text-[0.8125rem] text-ink-muted">
              Belum ada percakapan untuk agent ini.
            </p>
          ) : null}

          <ul className="mt-3 flex flex-col gap-1.5">
            {threadList.map((thread) => (
              <li key={thread.id}>
                <button
                  type="button"
                  onClick={() => {
                    setActiveThreadId(thread.id);
                    setTab("chat");
                  }}
                  aria-current={selectedThread?.id === thread.id ? "true" : undefined}
                  className={cn(
                    "w-full rounded-[var(--radius-control)] px-3 py-2.5 text-left transition-colors duration-150",
                    selectedThread?.id === thread.id
                      ? "bg-brand-soft text-brand-strong"
                      : "hover:bg-surface-sunken",
                  )}
                >
                  <span className="flex items-center justify-between gap-2">
                    <span className="truncate text-[0.8125rem] font-medium">{thread.title}</span>
                    <Badge tone="neutral">{thread.scope}</Badge>
                  </span>
                  {thread.last_message ? (
                    <span className="mt-1 block truncate text-[0.6875rem] text-ink-faint">
                      {thread.last_message}
                    </span>
                  ) : null}
                </button>
              </li>
            ))}
          </ul>
        </section>

        <section
          aria-label="Percakapan"
          className={cn("panel flex flex-col p-4", tab === "chat" ? "flex" : "hidden lg:flex")}
        >
          <AgentChat
            key={`${slug}-${selectedThread?.id ?? "none"}`}
            slug={slug}
            thread={selectedThread}
          />
        </section>

        <aside
          aria-label="Inspector agent"
          className={cn("panel flex flex-col gap-4 p-4", tab === "context" ? "flex" : "hidden lg:flex")}
        >
          <div>
            <h2 className="text-sm font-semibold text-ink">Inspector</h2>
            <p className="mt-1 text-[0.6875rem] text-ink-faint">
              Konfigurasi aktif dan instruksi yang disetujui.
            </p>
          </div>

          {agent.isPending ? <Skeleton className="h-40 w-full" /> : null}

          {agent.data ? (
            <>
              <dl className="flex flex-col gap-2 text-[0.8125rem]">
                <div className="flex justify-between gap-3">
                  <dt className="text-ink-muted">Profile</dt>
                  <dd className="font-medium text-ink">{agent.data.data.profile}</dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-ink-muted">Model</dt>
                  <dd className="font-medium text-ink">{agent.data.data.model}</dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-ink-muted">Status</dt>
                  <dd className="font-medium text-ink">
                    {agentStatusLabel[agent.data.data.status]}
                  </dd>
                </div>
              </dl>

              <div>
                <h3 className="text-[0.6875rem] font-semibold tracking-wide text-ink-muted">
                  Skills
                </h3>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {agent.data.data.skills.map((skill) => (
                    <Badge key={skill} tone="neutral">
                      {skill}
                    </Badge>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="text-[0.6875rem] font-semibold tracking-wide text-ink-muted">
                  Instruksi aktif
                </h3>
                {agent.data.data.active_instructions.length === 0 ? (
                  <p className="mt-2 text-[0.8125rem] text-ink-muted">
                    Belum ada instruksi permanen yang disetujui.
                  </p>
                ) : (
                  <ul className="mt-2 flex flex-col gap-2">
                    {agent.data.data.active_instructions.map((instruction) => (
                      <li
                        key={instruction.id}
                        className="rounded-[var(--radius-control)] bg-surface-sunken px-3 py-2"
                      >
                        <span className="flex items-center justify-between gap-2">
                          <Badge tone="brand">v{instruction.version}</Badge>
                          <time
                            className="tabular text-[0.6875rem] text-ink-faint"
                            dateTime={instruction.approved_at}
                          >
                            {formatInJakarta(instruction.approved_at, "d MMM yyyy")}
                          </time>
                        </span>
                        <p className="mt-1.5 text-[0.75rem] text-ink">{instruction.text}</p>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {selectedThread ? (
                <div className="mt-auto rounded-[var(--radius-control)] border border-line px-3 py-2.5">
                  <h3 className="text-[0.6875rem] font-semibold tracking-wide text-ink-muted">
                    Konteks thread
                  </h3>
                  <p className="mt-1 text-[0.75rem] text-ink">{selectedThread.context_summary}</p>
                </div>
              ) : null}
            </>
          ) : null}
        </aside>
      </div>
    </>
  );
}

type ChatEntry = {
  id: string;
  role: "user" | "assistant";
  content?: string;
  structured?: AgentResponseV1;
  pending?: boolean;
};

function AgentChat({ slug, thread }: { slug: AgentSlug; thread: Thread | null }) {
  const messages = useQuery({
    ...messagesQueryOptions(thread?.id ?? 0),
    enabled: thread !== null,
  });
  const [entries, setEntries] = useState<ChatEntry[]>([]);
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const prompt = draft.trim();

    if (prompt.length === 0 || busy) {
      return;
    }

    const userId = crypto.randomUUID();
    const assistantId = crypto.randomUUID();
    setDraft("");
    setBusy(true);
    setEntries((prev) => [
      ...prev,
      { id: userId, role: "user", content: prompt },
      { id: assistantId, role: "assistant", pending: true },
    ]);

    try {
      const started = await bff("/api/runs", RunSummarySchema, {
        method: "POST",
        headers: { "Idempotency-Key": createIdempotencyKey() },
        body: { agent: slug, prompt },
      });

      let detail: RunDetail | null = null;

      for (let attempt = 0; attempt < 40; attempt += 1) {
        const polled = await bff(`/api/runs/${started.data.run_id}`, RunDetailSchema);
        detail = polled.data;

        if ((TERMINAL_RUN_STATUSES as readonly string[]).includes(detail.status)) {
          break;
        }

        await new Promise((resolve) => setTimeout(resolve, 1200));
      }

      const resolved = detail;
      setEntries((prev) =>
        prev.map((entry) => {
          if (entry.id !== assistantId) {
            return entry;
          }

          if (resolved?.result) {
            return { id: assistantId, role: "assistant", structured: resolved.result };
          }

          return {
            id: assistantId,
            role: "assistant",
            content: resolved?.error ?? "Run selesai tetapi tidak mengembalikan hasil terstruktur.",
          };
        }),
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : "Permintaan gagal.";
      setEntries((prev) =>
        prev.map((entry) =>
          entry.id === assistantId
            ? { id: assistantId, role: "assistant", content: `Gagal menjalankan agent: ${message}` }
            : entry,
        ),
      );
      toast.error("Gagal menjalankan agent", { description: message });
    } finally {
      setBusy(false);
    }
  }

  const historical = messages.data?.data ?? [];
  const isEmpty = historical.length === 0 && entries.length === 0;

  return (
    <div className="flex h-full min-h-[28rem] flex-col">
      <header className="flex flex-wrap items-center justify-between gap-2 border-b border-line pb-3">
        <div>
          <h2 className="text-sm font-semibold text-ink">
            {thread ? thread.title : "Chat langsung"}
          </h2>
          <p className="text-[0.6875rem] text-ink-faint">
            {thread
              ? thread.context_summary
              : "Kirim tugas langsung ke agent. Eksekusi dijalankan Bridge dan hasilnya tampil terstruktur."}
          </p>
        </div>
        <Badge tone="neutral">{thread ? thread.scope : "run"}</Badge>
      </header>

      <div className="flex-1 overflow-y-auto py-4">
        {thread && messages.isPending ? (
          <div className="flex flex-col gap-3">
            <Skeleton className="h-16 w-3/4" />
            <Skeleton className="h-28 w-full" />
          </div>
        ) : null}

        {isEmpty && !(thread && messages.isPending) ? (
          <p className="text-sm text-ink-muted">
            Belum ada percakapan. Tulis instruksi di bawah untuk menjalankan agent ini.
          </p>
        ) : null}

        <ol className="flex flex-col gap-4">
          {historical.map((message) => (
            <li key={`msg-${message.id}`}>
              <MessageBubble message={message} />
            </li>
          ))}
          {entries.map((entry) => (
            <li key={entry.id}>
              <ChatEntryBubble entry={entry} />
            </li>
          ))}
        </ol>
      </div>

      <form className="flex flex-col gap-2 border-t border-line pt-3" onSubmit={handleSubmit}>
        <label htmlFor="composer" className="sr-only">
          Tulis instruksi untuk agent
        </label>
        <textarea
          id="composer"
          rows={3}
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter" && (event.metaKey || event.ctrlKey)) {
              event.preventDefault();
              event.currentTarget.form?.requestSubmit();
            }
          }}
          placeholder="Tulis tugas spesifik untuk agent ini…"
          className="w-full resize-y rounded-[var(--radius-control)] border border-line bg-surface px-3 py-2.5 text-sm text-ink placeholder:text-ink-faint"
        />
        <div className="flex items-center justify-between gap-2">
          <span className="text-[0.6875rem] text-ink-faint">⌘/Ctrl + Enter untuk kirim</span>
          <Button
            variant="primary"
            size="sm"
            type="submit"
            disabled={busy || draft.trim().length === 0}
          >
            {busy ? (
              <Loader2 aria-hidden className="size-4 animate-spin" />
            ) : (
              <Send aria-hidden className="size-4" />
            )}
            {busy ? "Menjalankan…" : "Kirim"}
          </Button>
        </div>
      </form>
    </div>
  );
}

function ChatEntryBubble({ entry }: { entry: ChatEntry }) {
  const isUser = entry.role === "user";

  return (
    <div className={cn("flex flex-col gap-1.5", isUser ? "items-end" : "items-start")}>
      <span className="text-[0.6875rem] text-ink-faint">{isUser ? "Kamu" : "Agent"}</span>
      <div
        className={cn(
          "max-w-full rounded-[var(--radius-panel)] px-4 py-3",
          isUser ? "bg-brand text-brand-ink" : "bg-surface-sunken",
        )}
      >
        {entry.pending ? (
          <span className="flex items-center gap-2 text-sm text-ink-muted">
            <Loader2 aria-hidden className="size-4 animate-spin" />
            Agent sedang mengeksekusi…
          </span>
        ) : entry.structured ? (
          <StructuredMessage result={entry.structured} />
        ) : (
          <p className="max-w-[68ch] whitespace-pre-wrap text-sm leading-relaxed">
            {entry.content}
          </p>
        )}
      </div>
    </div>
  );
}

function MessageBubble({ message }: { message: Message }) {
  const isUser = message.role === "user";

  return (
    <div className={cn("flex flex-col gap-1.5", isUser ? "items-end" : "items-start")}>
      <span className="text-[0.6875rem] text-ink-faint">
        {isUser ? "Kamu" : message.role === "system" ? "Sistem" : "Agent"} ·{" "}
        <time dateTime={message.created_at}>
          {formatInJakarta(message.created_at, "d MMM HH:mm")}
        </time>
      </span>
      <div
        className={cn(
          "max-w-full rounded-[var(--radius-panel)] px-4 py-3",
          isUser ? "bg-brand text-brand-ink" : "bg-surface-sunken",
        )}
      >
        {message.structured ? (
          <StructuredMessage result={message.structured} />
        ) : (
          <p className="max-w-[68ch] whitespace-pre-wrap text-sm leading-relaxed">
            {message.content}
          </p>
        )}
      </div>
    </div>
  );
}
