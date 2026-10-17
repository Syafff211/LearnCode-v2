"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  BookOpen,
  Bug,
  Check,
  ClipboardCheck,
  Code2,
  Copy,
  FileSearch,
  FlaskConical,
  History,
  Lightbulb,
  MessageSquare,
  Plus,
  RotateCcw,
  Send,
  Sparkles,
  Square,
  Trash2,
  X,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Callout } from "@/components/ui/callout";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { Select as NativeSelect, Textarea } from "@/components/ui/input";
import { cn, formatShortDate, truncate } from "@/lib/utils";
import type { AiAction } from "@/lib/validation/ai";

export type TutorMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  created_at: string;
  streaming?: boolean;
  stopped?: boolean;
};

export type TutorConversation = {
  id: string;
  title: string;
  updated_at: string;
  lesson_id: string | null;
};

export type TutorLessonOption = {
  id: string;
  title: string;
  courseTitle: string;
};

type TutorError = {
  message: string;
  code: string;
  retryable: boolean;
};

type Modes = {
  action: AiAction;
  label: string;
  icon: typeof MessageSquare;
  needsCode?: boolean;
  needsLesson?: boolean;
};

const modes: Modes[] = [
  { action: "free_chat", label: "Tanya", icon: MessageSquare },
  { action: "explain_code", label: "Jelaskan kode", icon: FileSearch, needsCode: true },
  { action: "debug_code", label: "Debug", icon: Bug, needsCode: true },
  { action: "hint", label: "Hint", icon: Lightbulb },
  { action: "code_review", label: "Review kode", icon: ClipboardCheck, needsCode: true },
  { action: "explain_lesson", label: "Jelaskan lesson", icon: BookOpen, needsLesson: true },
  { action: "practice_suggestions", label: "Saran latihan", icon: FlaskConical },
];

const modePlaceholders: Partial<Record<AiAction, string>> = {
  free_chat: "Tulis pertanyaan tentang HTML, CSS, atau JavaScript…",
  explain_code: "Apa yang ingin kamu pahami dari kode ini?",
  debug_code: "Apa yang terjadi dan error apa yang muncul?",
  hint: "Minta hint untuk latihan ini… (jangan minta jawaban lengkap dulu)",
  code_review: "Bagian mana yang paling kamu ragukan?",
  explain_lesson: "Bagian mana dari lesson ini yang ingin dijelaskan ulang?",
  practice_suggestions: "Fokus latihan apa yang kamu inginkan?",
};

const actionEndpoints: Partial<Record<AiAction, string>> = {
  explain_code: "/api/ai/explain",
  debug_code: "/api/ai/debug",
  hint: "/api/ai/hint",
};

function newId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `local-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function MessageContent({ content }: { content: string }) {
  return (
    <div className="chat-prose">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          a: ({ children, href, ...props }) => (
            <a href={href} target="_blank" rel="noopener noreferrer" {...props}>
              {children}
            </a>
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}

export function TutorChat({
  initialConversations = [],
  lessonOptions = [],
  defaultLessonId = null,
  fixedLesson = null,
  defaultLanguage = "id",
  initialUsed = 0,
  dailyLimit = 30,
  aiConfigured = true,
  embedded = false,
  autoFocus = false,
  onClose,
}: {
  initialConversations?: TutorConversation[];
  lessonOptions?: TutorLessonOption[];
  defaultLessonId?: string | null;
  fixedLesson?: { id: string; title: string } | null;
  defaultLanguage?: "id" | "en";
  initialUsed?: number;
  dailyLimit?: number;
  aiConfigured?: boolean;
  embedded?: boolean;
  autoFocus?: boolean;
  onClose?: () => void;
}) {
  const router = useRouter();
  const [conversations, setConversations] = React.useState(initialConversations);
  const [activeId, setActiveId] = React.useState<string | null>(null);
  const [messages, setMessages] = React.useState<TutorMessage[]>([]);
  const [mode, setMode] = React.useState<AiAction>("free_chat");
  const [message, setMessage] = React.useState("");
  const [code, setCode] = React.useState("");
  const [showCode, setShowCode] = React.useState(false);
  const [codeLanguage, setCodeLanguage] = React.useState<"html" | "css" | "javascript">("html");
  const [lessonId, setLessonId] = React.useState<string | null>(
    fixedLesson?.id ?? defaultLessonId,
  );
  const [language, setLanguage] = React.useState<"id" | "en">(defaultLanguage);
  const [used, setUsed] = React.useState(Math.min(initialUsed, dailyLimit));
  const [streaming, setStreaming] = React.useState(false);
  const [error, setError] = React.useState<TutorError | null>(null);
  const [formError, setFormError] = React.useState<string | null>(null);
  const [loadingConversation, setLoadingConversation] = React.useState(false);
  const [historyOpen, setHistoryOpen] = React.useState(false);
  const [copiedId, setCopiedId] = React.useState<string | null>(null);

  const abortRef = React.useRef<AbortController | null>(null);
  const scrollRef = React.useRef<HTMLDivElement | null>(null);
  const inputRef = React.useRef<HTMLTextAreaElement | null>(null);
  const lastPayloadRef = React.useRef<{
    action: AiAction;
    message: string;
    code: string;
    lessonId: string | null;
  } | null>(null);

  const remaining = Math.max(0, dailyLimit - used);
  const activeMode = modes.find((entry) => entry.action === mode) ?? modes[0]!;

  React.useEffect(() => {
    if (autoFocus) inputRef.current?.focus();
  }, [autoFocus]);

  React.useEffect(() => {
    let alive = true;
    fetch("/api/ai/usage", { cache: "no-store" })
      .then(async (response) => (response.ok ? response.json() : null))
      .then((data: { used?: number } | null) => {
        if (alive && typeof data?.used === "number") {
          setUsed(Math.min(data.used, dailyLimit));
        }
      })
      .catch(() => undefined);
    return () => {
      alive = false;
    };
  }, [dailyLimit]);

  React.useEffect(() => {
    const node = scrollRef.current;
    if (node) node.scrollTop = node.scrollHeight;
  }, [messages, streaming]);

  React.useEffect(() => {
    return () => abortRef.current?.abort();
  }, []);

  function chooseMode(next: AiAction) {
    setMode(next);
    setFormError(null);
    const selected = modes.find((entry) => entry.action === next);
    if (selected?.needsCode) setShowCode(true);
    if (embedded) inputRef.current?.focus();
  }

  async function loadConversation(id: string) {
    if (streaming || loadingConversation) return;
    setLoadingConversation(true);
    setError(null);
    try {
      const response = await fetch(`/api/ai/conversations/${id}`, { cache: "no-store" });
      if (response.status === 401) {
        toast.error("Sesi berakhir. Silakan masuk kembali.");
        router.push(`/login?next=${encodeURIComponent("/ai-tutor")}`);
        return;
      }
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload?.error?.message ?? "Percakapan belum bisa dimuat.");
      }
      setActiveId(id);
      setMessages(
        (payload.messages as TutorMessage[]).map((entry) => ({
          id: entry.id,
          role: entry.role,
          content: entry.content,
          created_at: entry.created_at,
        })),
      );
      const conversationLesson = payload.conversation?.lesson_id as string | null;
      if (conversationLesson) setLessonId(conversationLesson);
      setHistoryOpen(false);
    } catch (loadError) {
      toast.error(loadError instanceof Error ? loadError.message : "Percakapan belum bisa dimuat.");
    } finally {
      setLoadingConversation(false);
    }
  }

  async function deleteConversation(id: string) {
    if (!window.confirm("Hapus percakapan ini beserta seluruh pesannya?")) return;
    try {
      const response = await fetch(`/api/ai/conversations/${id}`, { method: "DELETE" });
      if (response.status === 401) {
        router.push(`/login?next=${encodeURIComponent("/ai-tutor")}`);
        return;
      }
      if (!response.ok) throw new Error("Percakapan belum bisa dihapus.");
      setConversations((current) => current.filter((entry) => entry.id !== id));
      if (activeId === id) startNewChat();
      toast.success("Percakapan dihapus");
    } catch (deleteError) {
      toast.error(deleteError instanceof Error ? deleteError.message : "Gagal menghapus.");
    }
  }

  function startNewChat() {
    abortRef.current?.abort();
    setActiveId(null);
    setMessages([]);
    setError(null);
    setFormError(null);
    setStreaming(false);
    setHistoryOpen(false);
    inputRef.current?.focus();
  }

  async function send(retry = false) {
    if (streaming) return;
    if (!aiConfigured) return;

    const payload = retry && lastPayloadRef.current
      ? lastPayloadRef.current
      : {
          action: mode,
          message: message.trim(),
          code: code.trim(),
          lessonId: fixedLesson?.id ?? lessonId,
        };

    if (!retry) {
      if (activeMode.needsCode && payload.code.length === 0) {
        setFormError("Tempel kode terlebih dahulu pada panel Kode.");
        setShowCode(true);
        return;
      }
      if (activeMode.needsLesson && !payload.lessonId) {
        setFormError("Pilih lesson yang ingin dijelaskan.");
        return;
      }
      if (payload.action === "free_chat" && payload.message.length === 0) {
        setFormError("Tulis pertanyaan terlebih dahulu.");
        inputRef.current?.focus();
        return;
      }
      if (remaining <= 0) {
        setFormError("Kuota AI harian sudah habis. Coba lagi besok.");
        return;
      }
    }

    setFormError(null);
    setError(null);
    lastPayloadRef.current = payload;

    const userContent =
      payload.action === "free_chat" || payload.message.length > 0
        ? payload.message
        : "";
    const storedContent = [
      userContent,
      payload.code
        ? `\`\`\`${codeLanguage}\n${payload.code}\n\`\`\``
        : "",
    ]
      .filter(Boolean)
      .join("\n\n");

    const userId = newId();
    const assistantId = newId();

    if (!retry) {
      setMessages((current) => [
        ...current,
        {
          id: userId,
          role: "user",
          content:
            storedContent ||
            (payload.action === "explain_lesson"
              ? `Jelaskan lesson ${fixedLesson?.title ?? ""}`.trim()
              : modes.find((entry) => entry.action === payload.action)?.label ?? "Bantu saya"),
          created_at: new Date().toISOString(),
        },
        {
          id: assistantId,
          role: "assistant",
          content: "",
          created_at: new Date().toISOString(),
          streaming: true,
        },
      ]);
      setMessage("");
    } else {
      setMessages((current) => [
        ...current.filter((entry) => !entry.streaming),
        {
          id: assistantId,
          role: "assistant",
          content: "",
          created_at: new Date().toISOString(),
          streaming: true,
        },
      ]);
    }

    setStreaming(true);
    const controller = new AbortController();
    abortRef.current = controller;
    let streamedContent = "";
    let streamFailed = false;

    try {
      const endpoint = actionEndpoints[payload.action] ?? "/api/ai/chat";
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
        cache: "no-store",
        body: JSON.stringify({
          action: payload.action,
          message: payload.message || undefined,
          code: payload.code || undefined,
          codeLanguage,
          lessonId: payload.lessonId || undefined,
          conversationId: activeId ?? undefined,
          language,
        }),
      });

      const headerRemaining = Number(response.headers.get("x-ai-remaining"));
      if (Number.isFinite(headerRemaining)) {
        setUsed(Math.min(dailyLimit, dailyLimit - headerRemaining));
      }

      if (!response.ok) {
        const body = await response.json().catch(() => null);
        const apiError = body?.error as { code?: string; message?: string } | undefined;
        if (response.status === 401) {
          toast.error("Sesi kamu berakhir. Silakan masuk kembali.");
          router.push(`/login?next=${encodeURIComponent("/ai-tutor")}`);
          return;
        }
        streamFailed = true;
        setMessages((current) =>
          current.filter((entry) => entry.id !== assistantId && entry.id !== userId),
        );
        setError({
          code: apiError?.code ?? "request_failed",
          message: apiError?.message ?? "Permintaan AI belum berhasil. Coba lagi.",
          retryable: response.status !== 503,
        });
        if (apiError?.code === "quota_exceeded") setUsed(dailyLimit);
        return;
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error("Streaming tidak didukung browser ini.");
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const events = buffer.split("\n\n");
        buffer = events.pop() ?? "";

        for (const event of events) {
          for (const line of event.split("\n")) {
            if (!line.startsWith("data:")) continue;
            const raw = line.slice(5).trim();
            if (!raw) continue;
            let parsed: {
              type?: string;
              text?: string;
              conversationId?: string;
              remaining?: number;
              code?: string;
              message?: string;
              retryable?: boolean;
            };
            try {
              parsed = JSON.parse(raw);
            } catch {
              continue;
            }

            if (parsed.type === "start") {
              if (parsed.conversationId) {
                setActiveId(parsed.conversationId);
                setConversations((current) => {
                  if (current.some((entry) => entry.id === parsed.conversationId)) {
                    return current;
                  }
                  return [
                    {
                      id: parsed.conversationId as string,
                      title: truncate(storedContent || "Percakapan baru", 60),
                      updated_at: new Date().toISOString(),
                      lesson_id: payload.lessonId,
                    },
                    ...current,
                  ];
                });
              }
              if (typeof parsed.remaining === "number") {
                setUsed(Math.min(dailyLimit, dailyLimit - parsed.remaining));
              }
            }

            if (parsed.type === "delta" && typeof parsed.text === "string") {
              streamedContent += parsed.text;
              setMessages((current) =>
                current.map((entry) =>
                  entry.id === assistantId
                    ? { ...entry, content: streamedContent }
                    : entry,
                ),
              );
            }

            if (parsed.type === "done") {
              if (typeof parsed.remaining === "number") {
                setUsed(Math.min(dailyLimit, dailyLimit - parsed.remaining));
              }
              setMessages((current) =>
                current.map((entry) =>
                  entry.id === assistantId ? { ...entry, streaming: false } : entry,
                ),
              );
              setConversations((current) =>
                current
                  .map((entry) =>
                    entry.id === (parsed.conversationId ?? activeId)
                      ? { ...entry, updated_at: new Date().toISOString() }
                      : entry,
                  )
                  .sort((a, b) => b.updated_at.localeCompare(a.updated_at)),
              );
            }

            if (parsed.type === "error") {
              streamFailed = true;
              if (streamedContent.length === 0) {
                setMessages((current) =>
                  current.filter((entry) => entry.id !== assistantId),
                );
              } else {
                setMessages((current) =>
                  current.map((entry) =>
                    entry.id === assistantId ? { ...entry, streaming: false } : entry,
                  ),
                );
              }
              setError({
                code: parsed.code ?? "stream_error",
                message: parsed.message ?? "Jawaban AI terputus. Coba lagi.",
                retryable: parsed.retryable ?? true,
              });
              if (parsed.code === "quota_exceeded") setUsed(dailyLimit);
            }
          }
        }
      }

      if (streamedContent.length === 0 && !streamFailed) {
        setMessages((current) =>
          current.map((entry) =>
            entry.id === assistantId
              ? {
                  ...entry,
                  streaming: false,
                  content: "AI tidak mengembalikan teks. Coba kirim ulang pertanyaanmu.",
                }
              : entry,
          ),
        );
      }
    } catch (streamError) {
      const aborted = streamError instanceof DOMException && streamError.name === "AbortError";
      setMessages((current) =>
        current
          .filter((entry) => entry.id !== assistantId || entry.content.length > 0)
          .map((entry) =>
            entry.id === assistantId
              ? { ...entry, streaming: false, stopped: aborted }
              : entry,
          ),
      );
      if (!aborted && streamedContent.length === 0) {
        setError({
          code: "network_error",
          message: "Koneksi ke AI terputus. Periksa jaringan lalu coba lagi.",
          retryable: true,
        });
      }
    } finally {
      setStreaming(false);
      abortRef.current = null;
    }
  }

  function stop() {
    abortRef.current?.abort();
  }

  async function copyMessage(entry: TutorMessage) {
    try {
      await navigator.clipboard.writeText(entry.content);
      setCopiedId(entry.id);
      setTimeout(() => setCopiedId(null), 1600);
    } catch {
      toast.error("Clipboard tidak tersedia di browser ini.");
    }
  }

  const historyList = (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between gap-2 border-b border-line px-3 py-2.5">
        <span className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.1em] text-muted">
          <History className="size-3" aria-hidden="true" />
          Riwayat
        </span>
        <Button type="button" size="sm" variant="ghost" onClick={startNewChat}>
          <Plus aria-hidden="true" />
          Baru
        </Button>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto p-2">
        {conversations.length === 0 ? (
          <p className="px-2 py-3 text-xs leading-relaxed text-muted">
            Belum ada percakapan tersimpan. Pertanyaanmu akan tersimpan sebagai
            riwayat setelah jawaban selesai.
          </p>
        ) : (
          <ul className="space-y-0.5">
            {conversations.map((conversation) => (
              <li key={conversation.id} className="group relative">
                <button
                  type="button"
                  onClick={() => loadConversation(conversation.id)}
                  aria-current={activeId === conversation.id ? "true" : undefined}
                  className={cn(
                    "w-full rounded-[4px] px-2.5 py-2 pr-8 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-text",
                    activeId === conversation.id
                      ? "bg-surface-2 text-ink"
                      : "text-ink-soft hover:bg-surface-2",
                  )}
                >
                  <span className="block truncate text-xs font-medium">
                    {conversation.title}
                  </span>
                  <span className="mt-0.5 block font-mono text-[9px] text-muted">
                    {formatShortDate(conversation.updated_at)}
                  </span>
                </button>
                <button
                  type="button"
                  aria-label={`Hapus percakapan ${conversation.title}`}
                  onClick={() => deleteConversation(conversation.id)}
                  className="absolute right-1.5 top-2 rounded-[3px] p-1 text-muted opacity-0 transition-opacity hover:bg-danger-soft hover:text-danger focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-text group-hover:opacity-100"
                >
                  <Trash2 className="size-3" aria-hidden="true" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
      <p className="border-t border-line px-3 py-2 text-[10px] leading-relaxed text-muted">
        Percakapan disimpan di akunmu. Kamu dapat menghapusnya kapan saja.
      </p>
    </div>
  );

  return (
    <div className={cn("flex min-h-0 flex-col", embedded ? "h-full" : "")}>
      {!embedded ? (
        <div className="flex items-center justify-between gap-3 border-b border-line px-4 py-3">
          <div className="flex items-center gap-2">
            <span className="flex size-7 items-center justify-center rounded-[4px] bg-accent-soft">
              <Sparkles className="size-3.5 text-accent-text" aria-hidden="true" />
            </span>
            <div>
              <p className="text-sm font-medium text-ink">AI Tutor</p>
              <p className="text-[10px] text-muted">
                {remaining} dari {dailyLimit} pesan tersisa hari ini
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="hidden w-24 sm:block">
              <Progress
                value={(used / dailyLimit) * 100}
                tone={remaining === 0 ? "success" : "accent"}
                label="Penggunaan kuota AI hari ini"
              />
            </div>
            <Dialog open={historyOpen} onOpenChange={setHistoryOpen}>
              <DialogTrigger asChild>
                <Button type="button" size="sm" variant="secondary" className="lg:hidden">
                  <History aria-hidden="true" />
                  Riwayat
                </Button>
              </DialogTrigger>
              <DialogContent className="h-[70dvh] max-w-sm p-0">
                <DialogHeader className="sr-only">
                  <DialogTitle>Riwayat percakapan</DialogTitle>
                </DialogHeader>
                {historyList}
              </DialogContent>
            </Dialog>

          </div>
        </div>
      ) : (
        <div className="flex items-center justify-between gap-2 border-b border-line px-4 py-2.5">
          <div>
            <p className="flex items-center gap-1.5 text-sm font-medium text-ink">
              <Sparkles className="size-3.5 text-accent-text" aria-hidden="true" />
              AI Tutor
            </p>
            <p className="mt-0.5 text-[10px] text-muted">
              {remaining}/{dailyLimit} pesan tersisa
            </p>
          </div>
          {onClose ? (
            <button
              type="button"
              onClick={onClose}
              aria-label="Tutup AI Tutor"
              className="rounded-[4px] p-1.5 text-muted hover:bg-surface-2 hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-text"
            >
              <X className="size-4" aria-hidden="true" />
            </button>
          ) : null}
        </div>
      )}

      {!aiConfigured ? (
        <div className="p-4">
          <Callout tone="warning" title="AI Tutor belum aktif">
            Tambahkan <code className="font-mono text-[0.8em]">GROQ_API_KEY</code> pada
            environment server, lalu restart aplikasi. Selama belum dikonfigurasi,
            AI Tutor tidak dapat mengirim permintaan ke Groq.
          </Callout>
        </div>
      ) : null}

      <div className="flex min-h-0 flex-1">
        {!embedded ? (
          <aside className="hidden w-60 shrink-0 border-r border-line lg:block">
            {historyList}
          </aside>
        ) : null}

        <div className="flex min-h-0 flex-1 flex-col">
          <div className="border-b border-line px-3 py-2">
            <div
              role="group"
              aria-label="Mode AI Tutor"
              className="flex flex-wrap items-center gap-1"
            >
              {modes.map((entry) => (
                <button
                  key={entry.action}
                  type="button"
                  onClick={() => chooseMode(entry.action)}
                  aria-pressed={mode === entry.action}
                  disabled={streaming}
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-[4px] border px-2 py-1 text-[11px] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-text disabled:opacity-60",
                    mode === entry.action
                      ? "border-accent/40 bg-accent-soft text-accent-text"
                      : "border-transparent text-muted hover:bg-surface-2 hover:text-ink",
                  )}
                >
                  <entry.icon className="size-3" aria-hidden="true" />
                  {entry.label}
                </button>
              ))}
            </div>

            <div className="mt-2 flex flex-wrap items-center gap-2">
              {fixedLesson ? (
                <span className="inline-flex items-center gap-1.5 rounded-[4px] border border-line bg-surface-2 px-2 py-1 text-[10px] text-ink-soft">
                  <BookOpen className="size-3 text-accent-text" aria-hidden="true" />
                  {fixedLesson.title}
                </span>
              ) : lessonOptions.length > 0 ? (
                <label className="flex items-center gap-1.5 text-[10px] text-muted">
                  <BookOpen className="size-3" aria-hidden="true" />
                  <span className="sr-only">Konteks lesson</span>
                  <NativeSelect
                    value={lessonId ?? ""}
                    onChange={(event) => setLessonId(event.target.value || null)}
                    disabled={streaming}
                    className="h-7 rounded-[4px] border-line bg-surface px-2 py-1 text-[10px] text-ink"
                    aria-label="Konteks lesson"
                  >
                    <option value="">Tanpa konteks lesson</option>
                    {lessonOptions.map((lesson) => (
                      <option key={lesson.id} value={lesson.id}>
                        {lesson.courseTitle} — {lesson.title}
                      </option>
                    ))}
                  </NativeSelect>
                </label>
              ) : null}

              <div
                role="group"
                aria-label="Bahasa jawaban"
                className="ml-auto flex items-center rounded-[4px] border border-line p-0.5"
              >
                {(["id", "en"] as const).map((value) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setLanguage(value)}
                    aria-pressed={language === value}
                    className={cn(
                      "rounded-[3px] px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-[0.08em] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-text",
                      language === value
                        ? "bg-surface-2 text-ink"
                        : "text-muted hover:text-ink",
                    )}
                  >
                    {value}
                  </button>
                ))}
              </div>

              <button
                type="button"
                onClick={() => setShowCode((value) => !value)}
                aria-expanded={showCode}
                className={cn(
                  "inline-flex items-center gap-1 rounded-[4px] px-2 py-1 text-[10px] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-text",
                  showCode || code.length > 0
                    ? "bg-surface-2 text-ink"
                    : "text-muted hover:text-ink",
                )}
              >
                <Code2 className="size-3" aria-hidden="true" />
                Kode
                {code.length > 0 ? ` · ${code.length}` : ""}
              </button>
            </div>

            {showCode ? (
              <div className="mt-2 space-y-1.5">
                <div className="flex items-center justify-between">
                  <label htmlFor="ai-code" className="text-[10px] text-muted">
                    Tempel kode (maks. 8000 karakter)
                  </label>
                  <NativeSelect
                    value={codeLanguage}
                    onChange={(event) =>
                      setCodeLanguage(event.target.value as "html" | "css" | "javascript")
                    }
                    className="h-6 w-24 rounded-[3px] border-line bg-surface px-1 py-0 text-[10px]"
                    aria-label="Bahasa kode"
                  >
                    <option value="html">HTML</option>
                    <option value="css">CSS</option>
                    <option value="javascript">JavaScript</option>
                  </NativeSelect>
                </div>
                <Textarea
                  id="ai-code"
                  value={code}
                  onChange={(event) => setCode(event.target.value.slice(0, 8000))}
                  placeholder="Tempel kode yang ingin dijelaskan atau di-debug…"
                  className="min-h-24 resize-y font-mono text-xs leading-relaxed"
                  spellCheck={false}
                />
              </div>
            ) : null}
          </div>

          <div
            ref={scrollRef}
            role="log"
            aria-live="polite"
            aria-label="Percakapan dengan AI Tutor"
            className="min-h-0 flex-1 overflow-y-auto px-4 py-4"
          >
            {messages.length === 0 ? (
              <div className="mx-auto max-w-md py-6 text-center">
                <span className="mx-auto flex size-10 items-center justify-center rounded-full border border-line bg-surface-2">
                  <Sparkles className="size-4 text-accent-text" aria-hidden="true" />
                </span>
                <p className="mt-3 font-display text-lg text-ink">
                  Apa yang ingin kamu pahami?
                </p>
                <p className="mt-1.5 text-xs leading-relaxed text-muted">
                  Pilih mode di atas, tempel kode jika perlu, lalu kirim
                  pertanyaan. Untuk latihan, coba mode Hint agar kamu tetap
                  mengerjakan sendiri.
                </p>
                <div className="mt-4 flex flex-wrap justify-center gap-1.5">
                  {[
                    "Apa perbedaan Flexbox dan Grid?",
                    "Jelaskan box model dengan contoh.",
                    "Berikan hint untuk latihan formulir HTML.",
                  ].map((suggestion) => (
                    <button
                      key={suggestion}
                      type="button"
                      onClick={() => {
                        setMode("free_chat");
                        setMessage(suggestion);
                        inputRef.current?.focus();
                      }}
                      className="rounded-full border border-line bg-surface px-2.5 py-1 text-[11px] text-ink-soft transition-colors hover:border-line-strong hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-text"
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <ul className="space-y-4">
                {messages.map((entry) => (
                  <li
                    key={entry.id}
                    className={cn(
                      "flex flex-col",
                      entry.role === "user" ? "items-end" : "items-start",
                    )}
                  >
                    <span className="mb-1 font-mono text-[9px] uppercase tracking-[0.08em] text-muted">
                      {entry.role === "user" ? "Kamu" : "AI Tutor"}
                    </span>
                    <div
                      className={cn(
                        "max-w-[92%] rounded-[6px] border px-3 py-2.5",
                        entry.role === "user"
                          ? "border-line bg-surface-2"
                          : "border-line bg-surface",
                      )}
                    >
                      {entry.content.length > 0 ? (
                        <MessageContent content={entry.content} />
                      ) : entry.streaming ? (
                        <span className="flex items-center gap-1.5 py-0.5 text-xs text-muted">
                          <span className="pulse-dot size-1.5 rounded-full bg-accent" />
                          <span className="pulse-dot size-1.5 rounded-full bg-accent [animation-delay:150ms]" />
                          <span className="pulse-dot size-1.5 rounded-full bg-accent [animation-delay:300ms]" />
                          <span className="sr-only">AI sedang menulis jawaban</span>
                        </span>
                      ) : null}
                      {entry.streaming && entry.content.length > 0 ? (
                        <span className="mt-1 inline-block h-3.5 w-[2px] animate-pulse bg-accent align-middle" aria-hidden="true" />
                      ) : null}
                      {entry.stopped ? (
                        <p className="mt-1.5 font-mono text-[9px] uppercase tracking-[0.06em] text-muted">
                          Dihentikan
                        </p>
                      ) : null}
                      {entry.role === "assistant" && entry.content.length > 0 && !entry.streaming ? (
                        <div className="mt-2 flex items-center gap-2 border-t border-line pt-1.5">
                          <button
                            type="button"
                            onClick={() => copyMessage(entry)}
                            className="inline-flex items-center gap-1 rounded-[3px] px-1.5 py-0.5 text-[10px] text-muted transition-colors hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-text"
                          >
                            {copiedId === entry.id ? (
                              <Check className="size-3" aria-hidden="true" />
                            ) : (
                              <Copy className="size-3" aria-hidden="true" />
                            )}
                            {copiedId === entry.id ? "Tersalin" : "Salin"}
                          </button>
                        </div>
                      ) : null}
                    </div>
                  </li>
                ))}
              </ul>
            )}

            {error ? (
              <div
                role="alert"
                className="mt-3 rounded-[6px] border border-danger/30 bg-danger-soft px-3 py-2.5 text-xs leading-relaxed text-ink-soft"
              >
                <p>{error.message}</p>
                <div className="mt-2 flex items-center gap-2">
                  {error.retryable ? (
                    <Button
                      type="button"
                      size="sm"
                      variant="secondary"
                      onClick={() => send(true)}
                      disabled={streaming}
                    >
                      <RotateCcw aria-hidden="true" />
                      Coba lagi
                    </Button>
                  ) : null}
                  <button
                    type="button"
                    onClick={() => setError(null)}
                    className="text-[10px] uppercase tracking-[0.06em] text-muted hover:text-ink"
                  >
                    Tutup
                  </button>
                </div>
              </div>
            ) : null}
          </div>

          <div className="border-t border-line px-3 py-2.5">
            {remaining <= 0 ? (
              <p className="mb-2 text-xs text-danger">
                Kuota AI harian sudah habis. Coba lagi besok.
              </p>
            ) : null}
            {formError ? (
              <p role="alert" className="mb-2 text-xs text-danger">
                {formError}
              </p>
            ) : null}
            <form
              onSubmit={(event) => {
                event.preventDefault();
                void send();
              }}
            >
              <label htmlFor="ai-message" className="sr-only">
                Pesan untuk AI Tutor
              </label>
              <Textarea
                ref={inputRef}
                id="ai-message"
                value={message}
                onChange={(event) => setMessage(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" && !event.shiftKey) {
                    event.preventDefault();
                    void send();
                  }
                }}
                placeholder={
                  remaining <= 0
                    ? "Kuota AI harian sudah habis."
                    : modePlaceholders[mode] ?? "Tulis pertanyaan…"
                }
                disabled={!aiConfigured || streaming || remaining <= 0}
                maxLength={4000}
                rows={2}
                className="min-h-[52px] resize-none text-[13px]"
              />
              <div className="mt-2 flex items-center justify-between gap-3">
                <p className="hidden text-[10px] leading-relaxed text-muted sm:block">
                  Enter untuk kirim · Shift+Enter baris baru. AI bisa keliru dan
                  tidak menjalankan kode.
                </p>
                <div className="flex items-center gap-1.5">
                  {streaming ? (
                    <Button type="button" variant="secondary" size="sm" onClick={stop}>
                      <Square aria-hidden="true" />
                      Hentikan
                    </Button>
                  ) : null}
                  <Button
                    type="submit"
                    size="sm"
                    disabled={!aiConfigured || streaming || remaining <= 0}
                  >
                    <Send aria-hidden="true" />
                    Kirim
                  </Button>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
