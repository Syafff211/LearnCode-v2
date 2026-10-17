import Link from "next/link";
import type { Metadata } from "next";
import { BookOpen, GraduationCap, ShieldCheck, Sparkles } from "lucide-react";

import { TutorChat, type TutorConversation, type TutorLessonOption } from "@/components/ai/tutor-chat";
import { Callout } from "@/components/ui/callout";
import { getAiSettings } from "@/lib/ai/settings";
import { requireProfile } from "@/lib/auth";
import { getCatalogCourses } from "@/lib/data/courses";
import { isAIConfigured } from "@/lib/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "AI Tutor",
  description:
    "Tanya, debug, minta hint, atau review kode dengan AI Tutor yang memahami konteks lesson LearnCode.",
};

export default async function AiTutorPage() {
  const { user, profile } = await requireProfile("/ai-tutor");
  const supabase = await createSupabaseServerClient();
  const aiSettings = await getAiSettings();

  const today = new Date().toISOString().slice(0, 10);
  const [conversationsRes, usageRes, courses] = await Promise.all([
    supabase
      .from("ai_conversations")
      .select("id, title, updated_at, lesson_id")
      .eq("user_id", user.id)
      .order("updated_at", { ascending: false })
      .limit(20),
    supabase
      .from("ai_usage")
      .select("message_count")
      .eq("user_id", user.id)
      .eq("usage_date", today)
      .maybeSingle(),
    getCatalogCourses(),
  ]);

  const conversations: TutorConversation[] = (conversationsRes.data ?? []).map((row) => ({
    id: row.id as string,
    title: row.title as string,
    updated_at: row.updated_at as string,
    lesson_id: (row.lesson_id as string | null) ?? null,
  }));

  const lessonOptions: TutorLessonOption[] = courses.flatMap((course) =>
    course.lessons
      .filter((lesson) => Boolean(lesson.id))
      .map((lesson) => ({
        id: lesson.id as string,
        title: lesson.title,
        courseTitle: course.title,
      })),
  );

  const used = Number(usageRes.data?.message_count ?? 0);

  return (
    <div className="container-lc py-8 sm:py-10">
      <div className="grid gap-8 lg:grid-cols-12">
        <div className="lg:col-span-8">
          <div className="border-b border-line pb-5">
            <p className="eyebrow">AI Tutor</p>
            <h1 className="display-section mt-2">Bertanya dengan konteks yang jelas.</h1>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted">
              Pilih mode, lampirkan kode bila perlu, dan hubungkan percakapan
              dengan lesson aktif. Jawaban disesuaikan dengan level belajarmu.
            </p>
          </div>

          <div className="mt-5 overflow-hidden rounded-[8px] border border-line bg-surface">
            <div className="h-[calc(100dvh-20rem)] min-h-[34rem] max-h-[48rem]">
              <TutorChat
                initialConversations={conversations}
                lessonOptions={lessonOptions}
                defaultLanguage={profile.preferred_language === "en" ? "en" : "id"}
                initialUsed={used}
                dailyLimit={aiSettings.dailyMessageLimit}
                aiConfigured={isAIConfigured() && aiSettings.enabled}
              />
            </div>
          </div>
        </div>

        <aside className="space-y-5 lg:col-span-4">
          <div className="rounded-[8px] border border-line bg-surface p-5">
            <p className="flex items-center gap-2 text-sm font-medium text-ink">
              <Sparkles className="size-4 text-accent-text" aria-hidden="true" />
              Cara memakai AI Tutor
            </p>
            <ol className="mt-3 space-y-3 text-xs leading-relaxed text-muted">
              <li>
                <span className="font-medium text-ink-soft">1. Pilih mode.</span>{" "}
                Hint cocok untuk latihan. Debug cocok ketika ada error.
              </li>
              <li>
                <span className="font-medium text-ink-soft">2. Tempel kode.</span>{" "}
                Sertakan kode yang relevan agar jawaban tidak menebak.
              </li>
              <li>
                <span className="font-medium text-ink-soft">3. Pilih lesson.</span>{" "}
                Konteks lesson membuat penjelasan selaras dengan materimu.
              </li>
              <li>
                <span className="font-medium text-ink-soft">4. Uji sendiri.</span>{" "}
                Jalankan hasilnya di playground sebelum mempercayai solusi.
              </li>
            </ol>
            <Link
              href="/playground"
              className="mt-4 inline-flex text-xs font-medium text-accent-text underline-offset-2 hover:underline"
            >
              Buka playground
            </Link>
          </div>

          <Callout tone="info" title="Batas dan kejujuran">
            AI Tutor tidak menjalankan kode. Ia tidak dapat melihat hasil runtime
            yang belum kamu lampirkan. Kuota {aiSettings.dailyMessageLimit} pesan per
            hari diperiksa dan dicatat di server.
          </Callout>

          <div className="rounded-[8px] border border-line bg-surface p-5">
            <p className="flex items-center gap-2 text-xs font-medium text-ink">
              <ShieldCheck className="size-3.5 text-accent-text" aria-hidden="true" />
              Privasi percakapan
            </p>
            <p className="mt-2 text-xs leading-relaxed text-muted">
              Percakapan tersimpan di akunmu dan hanya bisa dibaca olehmu
              melalui aturan Row Level Security. API key Groq tidak pernah
              dikirim ke browser.
            </p>
            <div className="mt-4 space-y-2 border-t border-line pt-3 text-xs">
              <p className="flex items-center gap-1.5 text-muted">
                <BookOpen className="size-3" aria-hidden="true" />
                Konteks diambil dari lesson pilihan
              </p>
              <p className="flex items-center gap-1.5 text-muted">
                <GraduationCap className="size-3" aria-hidden="true" />
                Level disesuaikan dari progress tersimpan
              </p>
            </div>
          </div>

          <p className="text-[11px] leading-relaxed text-muted">
            Sertifikat hanya diterbitkan setelah semua lesson dan quiz selesai
            dengan nilai yang memenuhi syarat. AI Tutor tidak dapat menerbitkan
            sertifikat atau mengubah nilai.
          </p>
        </aside>
      </div>
    </div>
  );
}
