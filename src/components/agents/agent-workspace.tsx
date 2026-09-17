"use client";

import { useQuery } from "@tanstack/react-query";
import { Paperclip, Send } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { agentStatusLabel, agentStatusTone } from "@/components/agents/agents-screen";
import { StructuredMessage } from "@/components/chat/structured-message";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import { Skeleton, StateBlock } from "@/components/ui/state";
import type { AgentSlug, Message, Thread } from "@/lib/api/contracts";
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
          {selectedThread ? (
            <ThreadConversation thread={selectedThread} />
          ) : (
            <StateBlock
              title="Pilih thread"
              description="Pilih salah satu thread untuk melihat percakapan dan output terstruktur."
            />
          )}
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

function ThreadConversation({ thread }: { thread: Thread }) {
  const messages = useQuery(messagesQueryOptions(thread.id));
  const [draft, setDraft] = useState("");

  return (
    <div className="flex h-full min-h-[28rem] flex-col">
      <header className="flex flex-wrap items-center justify-between gap-2 border-b border-line pb-3">
        <div>
          <h2 className="text-sm font-semibold text-ink">{thread.title}</h2>
          <p className="text-[0.6875rem] text-ink-faint">{thread.context_summary}</p>
        </div>
        <Badge tone="neutral">{thread.scope}</Badge>
      </header>

      <div className="flex-1 overflow-y-auto py-4">
        {messages.isPending ? (
          <div className="flex flex-col gap-3">
            <Skeleton className="h-16 w-3/4" />
            <Skeleton className="h-28 w-full" />
          </div>
        ) : null}

        {messages.isError ? (
          <StateBlock
            tone="danger"
            title="Pesan gagal dimuat"
            description="Riwayat percakapan tidak dapat diambil."
            action={
              <Button size="sm" variant="secondary" onClick={() => void messages.refetch()}>
                Coba lagi
              </Button>
            }
          />
        ) : null}

        {messages.data ? (
          <ol className="flex flex-col gap-4">
            {messages.data.data.map((message) => (
              <li key={message.id}>
                <MessageBubble message={message} />
              </li>
            ))}
          </ol>
        ) : null}
      </div>

      <form
        className="flex flex-col gap-2 border-t border-line pt-3"
        onSubmit={(event) => {
          event.preventDefault();
          toast.info("Prototype: run belum dikirim ke Bridge", {
            description: "Eksekusi agent nyata aktif setelah integrasi Bridge selesai.",
          });
          setDraft("");
        }}
      >
        <label htmlFor="composer" className="sr-only">
          Tulis instruksi untuk agent
        </label>
        <textarea
          id="composer"
          rows={3}
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          placeholder="Tulis tugas spesifik untuk agent ini…"
          className="w-full resize-y rounded-[var(--radius-control)] border border-line bg-surface px-3 py-2.5 text-sm text-ink placeholder:text-ink-faint"
        />
        <div className="flex items-center justify-between gap-2">
          <Button variant="ghost" size="sm" type="button">
            <Paperclip aria-hidden className="size-4" />
            Lampiran
          </Button>
          <Button variant="primary" size="sm" type="submit" disabled={draft.trim().length === 0}>
            <Send aria-hidden className="size-4" />
            Kirim
          </Button>
        </div>
      </form>
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
