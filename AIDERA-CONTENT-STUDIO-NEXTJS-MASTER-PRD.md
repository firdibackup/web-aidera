# AIDERA Content Studio — Master PRD, UX, Architecture & Build Specification

> **Owner:** Firdi Audi  
> **Frontend target:** laptop lokal / Next.js App Router  
> **Backend:** AIDERA Agent Bridge di VPS Hermes  
> **Status:** kontrak implementasi frontend  
> **Dokumen ini adalah sumber kebenaran utama untuk coding agent.** Jangan mengganti arsitektur, menambah fitur dummy, atau menyalin dashboard template mentah.

---

## 0. Instruksi untuk Coding Agent

Bangun aplikasi kerja AIDERA yang benar-benar berfungsi, bukan dashboard demo.

1. Gunakan **Next.js App Router + TypeScript + Tailwind CSS**.
2. NextAdmin hanya boleh menjadi sumber primitive/component yang relevan. Jangan clone seluruh template, demo route, sample user, upsell, atau branding NextAdmin.
3. Browser **tidak boleh** memanggil VPS Bridge langsung dan tidak boleh menerima bridge token.
4. Browser memanggil Next.js Route Handlers/BFF. BFF memanggil AIDERA Bridge memakai secret server-side.
5. Semua data operasional permanen berada di SQLite VPS melalui Bridge API. Frontend hanya menyimpan cache sementara dan preferensi UI non-kritis.
6. Gunakan TDD per vertical slice. Setiap fitur dianggap selesai hanya setelah interaksi nyata dan persistensi setelah refresh lolos Playwright.
7. Jangan menampilkan agent palsu sedang bekerja. Activity hanya berasal dari event Bridge.
8. Jangan auto-approve dan jangan auto-publish Instagram.
9. Jika API belum tersedia, tampilkan error/empty state—jangan isi dummy seolah data nyata.

---

## 1. Visi Produk

AIDERA Content Studio adalah control center produksi konten dengan tujuh agent spesialis, perencanaan CEO, Kanban seperti Trello, kalender editorial seperti Notion Calendar, structured chatbot, artifact versioning, dan human approval gates.

Aplikasi memisahkan:

- **UI lokal:** pengalaman kerja, routing, rendering, cache, optimistic interaction.
- **Next.js BFF:** menjaga token, validasi request UI, meneruskan request dan SSE.
- **Bridge VPS:** sumber kebenaran data, job queue, Hermes execution, artifacts, approval, audit.
- **Hermes profiles:** kemampuan agent terisolasi per profesi.

### Sasaran utama

- Firdi dapat menghubungi satu agent tanpa menjalankan pipeline penuh.
- CEO dapat membuat rencana mingguan/bulanan yang harus di-ACC.
- Content card dapat dipindah antar tahap dengan drag-and-drop dan tersimpan.
- Jadwal dapat dipindah di kalender dan tersimpan.
- Respons agent tersaji sebagai cards/blocks/actions, bukan Markdown berantakan.
- Hasil penting menjadi artifact terversi.
- Pipeline otomatis berhenti pada approval gate.
- Semua aktivitas dapat diaudit.

---

## 2. Arsitektur Terhubung

```text
Browser
  │ same-origin /api/*
  ▼
Next.js lokal (App Router)
  ├─ Server Components: initial reads
  ├─ Client Components: DnD, chat, calendar, optimistic UI
  ├─ Route Handlers: BFF/proxy
  └─ AIDERA_BRIDGE_TOKEN hanya server-side
          │ HTTPS + Bearer + Idempotency-Key
          ▼
AIDERA Agent Bridge — VPS
  ├─ ThreadingHTTPServer API
  ├─ SQLite durable state
  ├─ Job worker + SSE
  ├─ Artifact/file workspace
  ├─ Approval + activity audit
  └─ Hermes profile runner (shell=False)
          ├─ aidera-ceo
          ├─ aidera-research
          ├─ aidera-writer
          ├─ aidera-validator
          ├─ aidera-growth
          ├─ aidera-design
          └─ aidera-qa
```

### Kepemilikan data

**VPS/Bridge — permanen:**
- agents, models, status;
- threads dan messages;
- plans dan plan items;
- contents, stage, schedule;
- tasks, runs, retries, errors;
- approvals;
- artifacts dan attachments;
- instructions dan versions;
- activity events;
- settings dan performance metrics.

**Next.js/browser — sementara:**
- TanStack Query cache;
- filter/sort aktif;
- sidebar state;
- draft composer belum dikirim;
- selected cards;
- optimistic position sambil menunggu server.

Jangan simpan sumber kebenaran Kanban, kalender, approval, atau artifacts di localStorage.

---

## 3. Stack Frontend

### Wajib

- Next.js App Router terbaru stabil
- React + TypeScript strict
- Tailwind CSS
- TanStack Query untuk server-state cache
- Zod untuk validasi boundary UI/BFF
- dnd-kit untuk Kanban drag-and-drop
- FullCalendar React atau kalender setara yang mendukung month/timeGrid/list dan editable events
- React Hook Form untuk form kompleks
- date-fns dengan locale Indonesia
- Lucide React untuk ikon
- Sonner untuk toast
- Playwright untuk E2E
- Vitest + Testing Library untuk unit/component test

### Primitive UI yang boleh diadaptasi dari NextAdmin

- Button
- Input, Textarea, Select
- Dialog/Modal
- Drawer/Sheet
- Tabs
- Badge
- Dropdown
- Tooltip
- Table primitive
- Skeleton
- Empty state shell
- Responsive sidebar shell

### Yang dilarang disalin

- branding NextAdmin;
- menu demo;
- dashboard e-commerce;
- sample user;
- upgrade/pro card;
- charts dummy;
- halaman forms/tables/components demo;
- identitas visual template secara utuh.

---

## 4. Visual System

### Direction

Premium editorial, hangat, tegas, dan tidak terasa seperti template SaaS generik.

- Latar: warm off-white.
- Teks: near-black.
- Aksen utama: oranye AIDERA.
- Border tipis dan selektif.
- Shadow lembut hanya untuk hierarchy penting.
- Typography kuat, whitespace lega.
- Status memakai warna semantik konsisten.
- Agent memakai ikon/geometri sederhana—bukan stock avatar.

### Token awal

```css
:root {
  --background: 36 33% 97%;
  --foreground: 20 12% 10%;
  --surface: 0 0% 100%;
  --muted: 30 12% 92%;
  --muted-foreground: 24 7% 44%;
  --brand: 21 92% 52%;
  --brand-foreground: 0 0% 100%;
  --success: 142 62% 37%;
  --warning: 38 92% 50%;
  --danger: 0 72% 51%;
  --info: 213 80% 52%;
  --radius: 14px;
}
```

### Responsive

- Desktop: sidebar tetap + content canvas.
- Tablet: sidebar collapsible.
- Mobile: bottom navigation untuk 4 fungsi utama, menu lainnya via sheet.
- Kanban mobile: horizontal scroll per kolom; jangan mengecilkan seluruh board.
- Agent workspace mobile: panel berubah menjadi tabs Thread / Chat / Context.

---

## 5. Route Map

```text
/
/dashboard
/agents
/agents/[slug]
/plans
/plans/[id]
/content
/content/board
/content/calendar
/content/[id]
/approvals
/approvals/[id]
/activity
/settings
/settings/workflow
/settings/agents
/settings/instructions
/settings/integrations
```

Navigasi utama:

- Ikhtisar
- Agents
- Plans
- Produksi
  - Board
  - Kalender
  - Content Library
- Approval
- Aktivitas
- Pengaturan

---

## 6. Tujuh Agent

| Slug | Nama UI | Tugas utama |
|---|---|---|
| `ceo` | CEO | Strategi dan plan mingguan/bulanan |
| `research` | Research | Reference mining slide per slide |
| `writer` | Writer | Hook, carousel copy, caption, CTA |
| `validator` | Validator | Klaim, logika, misleading, completeness |
| `growth` | Growth Critic | Retention, save/share/comment, distribusi |
| `design` | Design Director | Layout brief/prompt, bukan generate gambar |
| `qa` | QA | Final checklist, typo, branding, safe area |

Design Director wajib menerapkan:

- Instagram portrait `1080×1350 px`, rasio `4:5`.
- Margin luar `50 px` pada semua sisi.
- Baris canvas dan safe area diulang dalam setiap prompt slide.
- Branding `@aidera`.
- Tagline `Maximize your AI & Digital Tools! 🚀`.

---

## 7. Dashboard

### Snippet fungsi

> **Ikhtisar keputusan dan kesehatan produksi hari ini.** Bukan analytics dummy.

### Isi

- Needs Decision: approval pending/blocked.
- Active Agents: run `working`.
- Upcoming: konten 7 hari ke depan.
- Overdue/Not Ready.
- Pipeline Health: queued, working, failed, blocked.
- Token/cost/duration rollup jika tersedia.
- Recent Activity.
- Quick actions:
  - Chat CEO
  - Buat Konten
  - Buat Weekly Plan
  - Buka Approval

### Endpoint

- `GET /api/dashboard`
- `GET /api/activities?limit=10`

---

## 8. Agent Workspace — Tiga Panel

### Panel kiri: Threads & Context

- Search thread.
- New thread.
- Scope selector: Global / Plan / Content.
- Thread title, last message, timestamp.
- Context summary saat thread dipilih.

### Panel tengah: Structured Chat

- Message list.
- Streaming/run status.
- Composer multiline.
- Attachment button.
- Run/Kirim.
- Cancel saat working.
- Regenerate.
- Request Revision.
- Handoff ke agent berikut.

### Panel kanan: Agent Inspector

- Model aktif.
- Profile slug.
- Skills aktif.
- Active instructions.
- Instruction version history.
- Artifacts pada context aktif.
- Run metadata: duration, token estimate, cost, attempts.

### Endpoint

- `GET /api/agents/{slug}`
- `GET/POST /api/threads`
- `GET/PATCH/DELETE /api/threads/{id}`
- `GET /api/threads/{id}/messages`
- `POST /api/runs`
- `GET /api/runs/{id}`
- `GET /api/runs/{id}/events`
- `POST /api/runs/{id}/cancel`
- `POST /api/runs/{id}/retry`
- `POST /api/attachments`

---

## 9. Structured Chat Format

Gunakan discriminated union. Markdown hanya fallback ketika schema gagal.

```ts
export type BlockType =
  | "recommendation"
  | "warning"
  | "checklist"
  | "comparison"
  | "plan_item"
  | "metric"
  | "quote"
  | "code"
  | "prompt";

export interface StructuredBlock {
  type: BlockType;
  title: string;
  content?: string;
  severity?: "info" | "success" | "warning" | "critical";
  items?: Array<{ id?: string; label: string; checked?: boolean }>;
  before?: string;
  after?: string;
  metadata?: Record<string, unknown>;
}

export interface AgentArtifact {
  id?: number;
  type: "research" | "draft" | "validation" | "growth" | "design_brief" | "qa" | "final";
  title: string;
  version: number;
  path: string;
}

export interface AgentAction {
  type: "approve" | "revise" | "save_instruction" | "send_to_agent" | "create_tasks";
  label: string;
  payload: Record<string, unknown>;
}

export interface AgentResponse {
  message: string;
  summary?: { title: string; items: string[] };
  blocks: StructuredBlock[];
  artifacts: AgentArtifact[];
  proposedInstructions?: Array<{
    scope: "agent" | "workflow" | "content";
    text: string;
    reason: string;
  }>;
  actions: AgentAction[];
  unstructured?: boolean;
}
```

### Renderer registry

```tsx
const blockRenderers = {
  recommendation: RecommendationCard,
  warning: AlertCard,
  checklist: ChecklistCard,
  comparison: DiffCard,
  plan_item: PlanItemCard,
  metric: MetricCard,
  quote: QuoteCard,
  code: CodeBlock,
  prompt: PromptCard,
} satisfies Record<BlockType, React.ComponentType<{ block: StructuredBlock }>>;

export function StructuredMessage({ result }: { result: AgentResponse }) {
  return (
    <article className="space-y-4">
      <p className="leading-7">{result.message}</p>
      {result.summary && <SummaryCard summary={result.summary} />}
      {result.blocks.map((block, index) => {
        const Renderer = blockRenderers[block.type] ?? UnknownBlock;
        return <Renderer key={`${block.type}-${index}`} block={block} />;
      })}
      <ArtifactGrid artifacts={result.artifacts} />
      <ActionBar actions={result.actions} />
      {result.unstructured && <Badge variant="warning">Unstructured response</Badge>}
    </article>
  );
}
```

---

## 10. Plans

### Snippet fungsi

> **CEO menyusun proposal; manusia menentukan mana yang diproduksi.**

### Tabs

- Weekly
- Monthly
- Archived

### Builder

- Periode.
- Goal.
- Target audience.
- Content pillars.
- Frequency.
- Reference accounts/URLs.
- Previous performance input.
- Notes.

### Plan item

- title;
- hook;
- summary;
- source/reference;
- format;
- pillar;
- objective;
- CTA concept;
- planned date;
- approval status.

### Actions

- Generate with CEO.
- Edit item.
- Request revision.
- Approve selected.
- Approve all.
- Reject selected/all.
- Convert approved items.
- Archive.

### Endpoint

- `GET/POST /api/plans`
- `GET/PATCH /api/plans/{id}`
- `POST /api/plans/{id}/generate`
- `POST /api/plans/{id}/revise`
- `POST /api/plans/{id}/approve`
- `POST /api/plans/{id}/reject`
- `POST /api/plans/{id}/convert`
- `POST /api/plans/{id}/archive`
- `GET/PATCH /api/plan-items/{id}`

---

## 11. Kanban Trello-like

### 15 kolom

1. Ideas
2. CEO Planning
3. Waiting Plan Approval
4. Research
5. Writing
6. Validation
7. Growth Review
8. Waiting Copy Approval
9. Design
10. QA
11. Final Approval
12. Scheduled
13. Published
14. Performance Review
15. Blocked

### Card

- code + title;
- hook ringkas;
- format/pillar;
- priority;
- owner/agent;
- scheduled date;
- approval badge;
- blocked/revision badge;
- artifact count;
- active run status.

### DnD behavior

- Gunakan `DndContext`, `SortableContext`, `DragOverlay` dari dnd-kit.
- Optimistic move segera.
- Kirim `POST /api/contents/{id}/stage`.
- Jika gagal, rollback posisi dan toast error.
- Setelah sukses, invalidate `board`, `contents`, `content:{id}`, `dashboard`.
- Drag ke stage agent **tidak otomatis run** kecuali automation aktif.
- Drag melewati gate membuat approval pending atau ditolak server.
- Persistensi wajib terbukti setelah reload.

```tsx
const moveStage = useMutation({
  mutationFn: ({ id, stage }: { id: number; stage: Stage }) =>
    bff(`/api/contents/${id}/stage`, {
      method: "POST",
      headers: { "Idempotency-Key": crypto.randomUUID() },
      body: JSON.stringify({ stage }),
    }),
  onMutate: async (variables) => optimisticMove(queryClient, variables),
  onError: (_error, _variables, context) => context?.rollback(),
  onSettled: () => queryClient.invalidateQueries({ queryKey: ["board"] }),
});
```

### Filter

- agent;
- pillar;
- format;
- priority;
- status;
- date range;
- approval/blocker.

### Bulk

- assign owner;
- schedule;
- archive;
- limited stage move.

### Endpoint

- `GET /api/board`
- `POST /api/contents/{id}/stage`
- `POST /api/contents/bulk`
- `POST /api/contents/{id}/pipeline`

---

## 12. Calendar

### Views

- Month
- Week
- List

### Features

- Drag event untuk mengubah tanggal.
- Click event membuka preview drawer.
- Preview menuju content detail.
- Filter platform, format, pillar, status.
- Overdue indicator.
- Not-ready indicator.
- Unscheduled tray untuk konten tanpa tanggal; drag ke tanggal jika library mendukung external draggable.

```tsx
function handleEventDrop(info: EventDropArg) {
  const previous = info.oldEvent.start;
  scheduleMutation.mutate(
    { id: Number(info.event.id), scheduled_at: info.event.start!.toISOString() },
    { onError: () => { info.revert(); restorePreviousDate(previous); } },
  );
}
```

### Endpoint

- `GET /api/calendar?view=month&start=...&end=...`
- `POST /api/contents/{id}/schedule`

---

## 13. Content Library

### Snippet fungsi

> **Semua ide, draft, paket final, template, dan referensi dalam satu katalog.**

- Search.
- Sort.
- Filter stage/pillar/format/priority/date/archived.
- Table dan compact-card view.
- Create new idea.
- Duplicate as idea.
- Archive/unarchive.
- Save/use template.
- Import reference URL/file.

Endpoint:

- `GET/POST /api/contents`
- `GET/PATCH/DELETE /api/contents/{id}`
- `POST /api/contents/{id}/duplicate`
- `POST /api/contents/{id}/archive`
- `POST /api/contents/{id}/template`
- `GET /api/templates`

---

## 14. Content Detail

### Header

- code/title;
- stage/status;
- priority;
- owner;
- scheduled date;
- Run Next Stage;
- Request Revision;
- Approve;
- Block;
- Open Final Package.

### 10 tabs

1. Overview
2. Research
3. Copy
4. Validation
5. Growth
6. Design Brief
7. QA
8. Files
9. Activity
10. Performance

### Artifacts

- List per type/version.
- Open preview.
- Raw download.
- Compare any two versions.
- Promote/assemble final package.

Endpoint:

- `GET /api/contents/{id}`
- `POST /api/tasks`
- `POST /api/tasks/{id}/dispatch`
- `POST /api/tasks/{id}/handoff`
- `POST /api/contents/{id}/revision`
- `POST /api/contents/{id}/final-package`
- `GET /api/artifacts`
- `GET /api/artifacts/{id}`
- `GET /api/artifacts/{id}/raw`
- `GET /api/artifacts/{id}/compare/{other_id}`

---

## 15. Approval Center

### Jenis

- Plan
- Copy
- Permanent instruction
- Final package

### Detail wajib

- target;
- proposer;
- reason/impact;
- before/after;
- artifact preview;
- diff;
- timestamps/history;
- decision note.

### Actions

- Approve
- Request revision
- Reject

Endpoint:

- `GET /api/approvals`
- `GET /api/approvals/{id}`
- `POST /api/approvals/{id}/approve`
- `POST /api/approvals/{id}/revise`
- `POST /api/approvals/{id}/reject`

---

## 16. Saved Instructions

```text
Agent proposes instruction
→ UI shows scope + reason + diff
→ Pending approval
→ Approve & Save
→ New active version
→ Future prompts use active version
→ User can rollback
```

Endpoint:

- `GET/POST /api/instructions`
- `GET /api/instructions/{id}`
- `GET /api/instructions/history`
- `POST /api/instructions/{id}/approve`
- `POST /api/instructions/{id}/reject`
- `POST /api/instructions/{id}/rollback`

Ordinary chat must never silently mutate permanent instructions.

---

## 17. Pipeline

```text
Approved Plan
→ Research
→ Writing
→ Validation
→ Growth Review
→ Waiting Copy Approval
→ Design
→ QA
→ Final Approval
→ Scheduled
→ Published
→ Performance Review
```

### Rules

- Manual-first; automatic optional.
- Retry teknis maksimal 2.
- Job exhausted → Blocked.
- Copy/final/instruction gates tidak boleh dilewati jika aktif.
- Retry idempotent; tidak menggandakan task/artifact.
- Cancel menghentikan process group.
- Telegram notification saat approval dibutuhkan.
- Tidak ada auto-publish MVP.

---

## 18. Activity dan Live Updates

### Real events only

- task created;
- run queued/started/completed/failed/cancelled;
- artifact saved;
- handoff;
- approval requested/decided;
- retry;
- stage moved;
- instruction version changed.

Gunakan SSE:

- `/api/events` untuk global event.
- `/api/runs/{id}/events` untuk run tertentu.

Frontend harus:

1. menerima event lewat BFF proxy;
2. patch cache jika payload cukup;
3. fallback invalidate query;
4. reconnect dengan exponential backoff;
5. melakukan refetch saat browser kembali online/visible.

---

## 19. Cache Strategy

Gunakan TanStack Query sebagai satu-satunya server-state cache.

```ts
export const keys = {
  dashboard: ["dashboard"] as const,
  agents: ["agents"] as const,
  agent: (slug: string) => ["agent", slug] as const,
  threads: (agent: string) => ["threads", agent] as const,
  thread: (id: number) => ["thread", id] as const,
  plans: (filters: object) => ["plans", filters] as const,
  plan: (id: number) => ["plan", id] as const,
  board: (filters: object) => ["board", filters] as const,
  calendar: (range: object) => ["calendar", range] as const,
  contents: (filters: object) => ["contents", filters] as const,
  content: (id: number) => ["content", id] as const,
  approvals: ["approvals"] as const,
  activities: ["activities"] as const,
};
```

### Defaults

- dashboard: stale 15 detik;
- agents: stale 30 detik;
- board/calendar: stale 10 detik + SSE;
- content detail: stale 15 detik;
- messages: stale 5 detik saat run aktif;
- artifacts/instructions: stale 60 detik;
- settings: stale 5 menit.

### Mutation invalidation matrix

- Move card → board, contents, content, dashboard, activity.
- Reschedule → calendar, board, content, dashboard, activity.
- Approval decision → approvals, content/plan/instruction target, dashboard, activity.
- Run completion → run, thread/messages, agent, artifacts, content, board, activity.
- Instruction approval → agent, instruction history, pending approvals.

Optional persisted cache boleh memakai IndexedDB, tetapi:

- jangan persist token;
- beri maxAge pendek;
- version bust saat schema berubah;
- selalu revalidate saat online.

---

## 20. Next.js BFF Security

`.env.local`:

```env
AIDERA_BRIDGE_URL=https://aidera-bridge.firdiaudi.my.id
AIDERA_BRIDGE_TOKEN=server-secret-only
```

Jangan gunakan prefix `NEXT_PUBLIC_`.

```ts
// src/lib/bridge/server.ts
import "server-only";

const base = process.env.AIDERA_BRIDGE_URL!;
const token = process.env.AIDERA_BRIDGE_TOKEN!;

export async function bridge<T>(path: string, init: RequestInit = {}): Promise<T> {
  const response = await fetch(`${base}${path}`, {
    ...init,
    cache: "no-store",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      ...init.headers,
    },
  });
  const payload = await response.json();
  if (!response.ok) throw new BridgeError(response.status, payload.error);
  return payload.data as T;
}
```

Browser hanya memanggil `/api/bridge/*` atau route domain yang eksplisit. Jangan buat open proxy seperti `/api/proxy?url=`.

```ts
// app/api/runs/route.ts
export async function POST(request: Request) {
  const input = RunCreateSchema.parse(await request.json());
  const key = request.headers.get("idempotency-key") ?? crypto.randomUUID();
  const data = await bridge<Run>("/api/runs", {
    method: "POST",
    headers: { "Idempotency-Key": key },
    body: JSON.stringify(input),
  });
  return Response.json({ data }, { status: 202 });
}
```

---

## 21. Struktur Folder Lokal

```text
src/
  app/
    (studio)/
      layout.tsx
      dashboard/page.tsx
      agents/page.tsx
      agents/[slug]/page.tsx
      plans/page.tsx
      plans/[id]/page.tsx
      content/page.tsx
      content/board/page.tsx
      content/calendar/page.tsx
      content/[id]/page.tsx
      approvals/page.tsx
      approvals/[id]/page.tsx
      activity/page.tsx
      settings/page.tsx
    api/
      dashboard/route.ts
      agents/route.ts
      agents/[slug]/route.ts
      threads/route.ts
      threads/[id]/route.ts
      runs/route.ts
      runs/[id]/route.ts
      runs/[id]/cancel/route.ts
      runs/[id]/retry/route.ts
      runs/[id]/events/route.ts
      plans/...
      contents/...
      approvals/...
      artifacts/...
      events/route.ts
  components/
    shell/
    dashboard/
    agents/
    chat/blocks/
    plans/
    board/
    calendar/
    content/
    approvals/
    activity/
    settings/
    ui/
  lib/
    bridge/server.ts
    api/client.ts
    api/schemas.ts
    api/types.ts
    query/keys.ts
    query/provider.tsx
    dnd/
    dates/
    errors/
  hooks/
  styles/
tests/
e2e/
```

---

## 22. Feature Snippets untuk UI

Gunakan subtitle singkat ini agar fungsi halaman mudah dipahami:

- **Ikhtisar:** “Apa yang bergerak, apa yang tertahan, dan apa yang membutuhkan keputusanmu.”
- **Agents:** “Hubungi spesialis yang tepat tanpa menjalankan seluruh pipeline.”
- **CEO Plans:** “Rencana adalah proposal. Produksi dimulai setelah kamu menyetujuinya.”
- **Board:** “Geser konten antar tahap; setiap perpindahan disimpan dan diaudit.”
- **Kalender:** “Atur ritme publikasi dengan drag-and-drop tanpa fitur kalender berbayar.”
- **Content Library:** “Satu tempat untuk ide, referensi, draft, dan paket final.”
- **Approvals:** “Tidak ada keputusan strategis yang dilewati otomatis.”
- **Activity:** “Timeline kejadian nyata—bukan simulasi agent bekerja.”
- **Instructions:** “Simpan aturan yang berulang sebagai versi yang dapat di-rollback.”
- **Settings:** “Atur gate, automation, model, retry, Telegram, dan branding.”

---

## 23. Loading, Empty, Error, Offline

Setiap feature wajib memiliki:

- Skeleton sesuai bentuk konten.
- Empty state dengan CTA relevan.
- Inline validation.
- Error state dengan retry.
- 401/403 bridge configuration error.
- 429 countdown dari `Retry-After`.
- Offline banner.
- Reconnecting SSE indicator.
- Job timeout/failed/blocked state dengan error summary.
- Confirm dialog untuk destructive action.

Tidak boleh spinner penuh tanpa konteks pada seluruh aplikasi.

---

## 24. Testing Matrix

### Unit

- Zod schemas.
- Structured block registry.
- Stage transition helpers.
- Calendar mapper.
- Query invalidation.
- Error mapping.

### Component

- Structured cards semua jenis.
- ContentCard badges.
- Approval diff.
- Composer attachments.
- Empty/error/loading states.

### Integration

- BFF meneruskan Bearer token server-side.
- Browser payload tidak pernah mengandung bridge token.
- Idempotency header diteruskan.
- Error envelope dinormalisasi.
- SSE proxy tidak buffering.

### Playwright E2E

1. Dashboard menampilkan data Bridge.
2. Research chat → structured cards → history persist.
3. Design propose instruction → diff → approve → history → rollback.
4. CEO weekly plan → revise → approve selected → convert.
5. Kanban drag persists setelah refresh.
6. Calendar event drag persists setelah refresh.
7. Manual Research → Writer handoff.
8. Automatic pipeline berhenti pada copy approval dan lanjut setelah approve.
9. Retry tidak menggandakan artifact.
10. Cancel menghentikan run aktif.
11. Artifact versions dapat dibuka dan dibandingkan.
12. Content final package dapat dirakit.
13. SSE activity memperbarui UI.
14. Token Bridge tidak muncul di browser/network response/source map.
15. Mobile navigation dan agent tabs usable.

---

## 25. Definition of Done

Fitur hanya selesai jika memenuhi semua:

- UI route tersedia.
- Loading/empty/error states tersedia.
- Route Handler/BFF tersedia.
- Bridge endpoint nyata, bukan mock/404.
- Mutation memiliki idempotency bila relevan.
- Optimistic UI rollback saat gagal.
- Data tetap benar setelah refresh.
- Activity event tercatat.
- Unit/component/integration/E2E terkait lulus.
- Tidak ada console error.
- Tidak ada bridge token di browser.

Build sukses atau tampilan card saja bukan bukti fitur selesai.

---

## 26. Fase Implementasi

### Phase 0 — Bootstrap

- Next.js, TypeScript strict, Tailwind.
- Testing stack.
- Env validation.
- Bridge client server-only.
- Query provider.
- AIDERA visual tokens.

### Phase 1 — Shell + Data Boundary

- Custom sidebar/header/mobile nav.
- Explicit BFF Route Handlers.
- Error normalization.
- Connection health page/indicator.

### Phase 2 — Dashboard + Agents

- Operational dashboard.
- Agent grid.
- Agent inspector.

### Phase 3 — Threads + Structured Chat

- Threads.
- Composer/attachments.
- Run/cancel/retry.
- SSE.
- Structured renderer.
- Artifact/action cards.

### Phase 4 — Instructions

- Proposal.
- Diff.
- Approval.
- Versioning/rollback.

### Phase 5 — CEO Planning

- Weekly/monthly builder.
- Plan-item editor.
- Partial approval/conversion.

### Phase 6 — Kanban

- 15 columns.
- DnD/optimistic persistence.
- Filters, WIP, badges, bulk actions.

### Phase 7 — Calendar

- Month/week/list.
- DnD schedule persistence.
- Preview and filters.

### Phase 8 — Content Workspace

- Library.
- Detail tabs.
- Artifact preview/compare/raw.
- Handoff/revision/final package.

### Phase 9 — Approvals + Automation

- Approval center.
- Gate controls.
- Auto pipeline.
- Telegram settings.

### Phase 10 — Hardening

- Full E2E.
- Accessibility.
- Performance/cache review.
- Security/token leakage review.
- Production local build.

Setiap phase: RED test → minimal implementation → GREEN → refactor → commit.

---

## 27. Bridge Contract dan Status

Backend bridge berada di VPS repository:

```text
/home/ubuntu/aidera-bridge
```

Kontrak:

```text
/home/ubuntu/aidera-bridge/API-CONTRACT.md
```

OpenAPI:

```text
/home/ubuntu/aidera-bridge/docs/OPENAPI.json
```

Status kontrak saat dokumen ini dibuat:

- commit: `117a664`;
- 68 test lulus;
- Bearer auth aktif;
- response envelope `{data, meta}`;
- error envelope `{error: {code, message, details}}`;
- 63 OpenAPI paths;
- tidak ada placeholder `/api/contract/*`;
- belum dideploy ke subdomain produksi;
- focused test task dispatch/handoff, artifact raw/compare, workflow, dan metrics masih perlu diperkuat sebelum Bridge dinyatakan final produksi.

Dokumen frontend harus mengikuti OpenAPI aktual jika ada selisih. Jangan menebak payload.

---

## 28. Setup Checklist Setelah Bridge Dideploy

- [ ] Buat subdomain `aidera-bridge.firdiaudi.my.id`.
- [ ] Deploy Bridge hanya di loopback + Nginx HTTPS.
- [ ] Generate token random kuat; simpan server-side.
- [ ] Set CORS untuk origin Next.js yang benar.
- [ ] Test `/api/health` tanpa token.
- [ ] Test `/api/whoami` dengan token.
- [ ] Pastikan endpoint data tanpa token → 401.
- [ ] Pastikan origin tak diizinkan → ditolak.
- [ ] Jalankan fake run smoke.
- [ ] Jalankan satu real Hermes Research smoke setelah persetujuan biaya.
- [ ] Test backup + restore integrity.
- [ ] Test SSE melalui Nginx tanpa buffering.
- [ ] Masukkan URL/token ke `.env.local`.
- [ ] Jalankan E2E lokal terhadap Bridge staging.

---

## 29. Non-Goals MVP

- Auto-publish Instagram.
- Bot massal like/comment/follow.
- Multi-user/team RBAC.
- Public client portal.
- Office/avatar animation.
- Agent chatter tanpa bounded task.
- Local browser langsung memegang credential Hermes/Bridge.

---

## 30. Phase 0 Wajib Sebelum UI Besar

Review arsitektur final menemukan beberapa risiko yang harus diselesaikan sebelum membangun halaman besar. Jika dilewati, UI bisa terlihat jadi tetapi data mudah konflik.

### 30.1 Board ordering dan concurrency

Kanban tidak cukup hanya menyimpan `stage`. Perlu strategi ordering.

Frontend harus mengirim:

```json
{
  "stage": "writing",
  "position": 24000,
  "after_id": 12,
  "before_id": 18,
  "version": 7
}
```

Aturan:

- Setiap card perlu `sort_order` atau ranking numerik.
- Setiap content card perlu `version`/`updated_at` untuk deteksi konflik.
- Jika Bridge membalas conflict, UI harus rollback dan refetch board.
- Optimistic drag tidak boleh dianggap sukses sebelum server menerima.
- Bulk move harus atomic atau mengembalikan daftar item gagal.

### 30.2 Calendar timezone

Semua tanggal publikasi harus punya timezone eksplisit.

- Simpan ISO string dari Bridge.
- UI tampilkan dalam `Asia/Jakarta`.
- Date-only post memakai jam default, misalnya `09:00 Asia/Jakarta`.
- Calendar drag harus menjaga timezone, bukan menggeser karena UTC.
- E2E wajib memindah event melewati reload dan memeriksa tanggal lokal.

### 30.3 SSE semantics

Event SSE harus punya bentuk konsisten:

```ts
export interface BridgeEvent {
  id: number;
  type: "activity" | "run" | "content" | "approval" | "artifact" | "heartbeat";
  target_type?: string;
  target_id?: number;
  message?: string;
  payload?: Record<string, unknown>;
  created_at: string;
}
```

Frontend harus:

- menyimpan `lastEventId`;
- reconnect dengan backoff;
- refetch query saat kehilangan koneksi;
- tidak membuat event palsu;
- menampilkan `Live / Reconnecting / Offline`.

### 30.4 Structured schema versioning

Agent response perlu `schema_version` agar renderer tidak rusak saat format berubah.

```ts
export interface AgentResponseV1 {
  schema_version: "aidera.agent_response.v1";
  message: string;
  summary?: { title: string; items: string[] };
  blocks: StructuredBlock[];
  artifacts: AgentArtifact[];
  proposedInstructions?: ProposedInstruction[];
  actions: AgentAction[];
  unstructured?: boolean;
}
```

Renderer harus graceful untuk block unknown:

- tampilkan UnknownBlockCard;
- simpan raw payload;
- jangan crash halaman chat.

### 30.5 Attachment lifecycle

Attachment bukan hanya upload.

- Upload → mendapat `attachment_id`.
- Composer menampilkan preview dan remove sebelum run.
- Run mengirim daftar `attachment_id` atau attachment object sesuai kontrak Bridge.
- Attachment harus tampil di thread message dan artifact context.
- Gagal upload harus tidak mengirim prompt.
- File besar/ekstensi tidak didukung harus menampilkan error ramah.

### 30.6 Auth lokal untuk aplikasi Next.js

Walau Bridge memakai Bearer token server-side, UI lokal tetap perlu pembatas jika nanti dibuka di jaringan.

Pilihan:

1. Local-only development tanpa auth, bind ke localhost.
2. Basic auth/reverse proxy jika dibuka LAN.
3. NextAuth/Clerk nanti jika dipublikasikan.

Larangan mutlak: bridge token tidak boleh masuk bundle browser, console log, source map, atau response JSON.

### 30.7 OpenAPI typed contract

Gunakan OpenAPI Bridge untuk menghasilkan tipe awal:

```bash
pnpm dlx openapi-typescript ./openapi/aidera-bridge.json -o src/lib/bridge/openapi-types.ts
```

Tetap buat Zod schemas untuk input dari UI dan structured agent response.

### 30.8 Data freshness dan conflict policy

- Mutation dengan efek besar wajib memakai `Idempotency-Key`.
- Board/calendar memakai optimistic update + rollback.
- Approval dan instruction mutation tidak optimistic penuh; tampilkan pending state sampai server sukses.
- Jika status run berubah dari SSE, invalidate `runs`, `thread`, `content`, `board`, dan `activities`.

### 30.9 Phase 0 acceptance

Sebelum mengerjakan semua halaman:

- [ ] Bridge client server-only terbukti tidak bocor token.
- [ ] Query keys dan invalidation matrix tersedia.
- [ ] DnD ordering model disepakati dengan Bridge.
- [ ] Calendar timezone helper tersedia.
- [ ] SSE reconnect helper tersedia.
- [ ] Structured renderer dapat menampilkan unknown block tanpa crash.
- [ ] Route Handler tidak menjadi open proxy bebas.
- [ ] E2E minimal membuktikan one mutation dari browser → BFF → Bridge → cache update.

---

## 31. Ringkasan Produk Final

AIDERA Content Studio lokal adalah frontend Next.js premium yang mengendalikan runtime agent dan data di VPS melalui API Bridge. Aplikasi harus terasa seperti gabungan Trello, Notion Calendar, content operations workspace, dan specialist-agent chat—tetapi tetap dibangun khusus untuk workflow AIDERA.

Prinsip penentu:

- **UI boleh dibangun ulang; data dan agent runtime tetap aman di VPS.**
- **Manual-first; automation optional.**
- **Structured output, persistent artifacts, explicit approvals.**
- **DnD harus persisten, bukan kosmetik.**
- **Activity nyata, bukan simulasi.**
- **NextAdmin hanya primitive, bukan identitas produk.**
- **Bridge token tidak pernah masuk browser.**
- **Sebuah fitur belum selesai sebelum state bertahan setelah refresh dan E2E lulus.**
