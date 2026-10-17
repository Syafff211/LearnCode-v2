import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import {
  ArrowRight,
  Award,
  Check,
  ChevronRight,
  Circle,
  Clock,
  FileQuestion,
  Layers,
  Lock,
  Play,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Callout } from "@/components/ui/callout";
import { Progress } from "@/components/ui/progress";
import { getSessionContext } from "@/lib/auth";
import { getCourseSummary } from "@/lib/data/courses";
import { getUserCourseState } from "@/lib/data/learning";
import { formatDuration, formatScore } from "@/lib/utils";

export const dynamic = "force-dynamic";

type PageProps = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const course = await getCourseSummary(slug);
  if (!course) return { title: "Kursus tidak ditemukan" };
  return {
    title: course.title,
    description: course.description,
  };
}

export default async function CourseDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const course = await getCourseSummary(slug);
  if (!course) notFound();

  const session = await getSessionContext();
  const state = session ? await getUserCourseState(session.user.id, slug) : null;

  const completed = new Set(state?.completedLessonIds ?? []);
  const nextLesson =
    course.lessons.find((lesson) => !completed.has(lesson.slug)) ?? course.lessons[0];
  const allLessonsDone = state ? state.completedCount >= state.totalLessons : false;
  const quizPassed = Boolean(
    state && state.bestScore !== null && state.bestScore >= course.passingScore,
  );
  const startHref = nextLesson ? `/learn/${nextLesson.slug}` : "/dashboard";
  const isDatabaseCourse = Boolean(course.id);

  return (
    <>
      <section className="border-b border-line">
        <div className="container-lc py-10 sm:py-14">
          <nav aria-label="Breadcrumb" className="mb-6">
            <ol className="flex flex-wrap items-center gap-2 font-mono text-[10px] uppercase tracking-[0.1em] text-muted">
              <li>
                <Link href="/" className="hover:text-ink">
                  Beranda
                </Link>
              </li>
              <li aria-hidden="true">/</li>
              <li>
                <Link href="/courses" className="hover:text-ink">
                  Kursus
                </Link>
              </li>
              <li aria-hidden="true">/</li>
              <li aria-current="page" className="text-ink">
                {course.title}
              </li>
            </ol>
          </nav>

          <div className="grid gap-10 lg:grid-cols-12">
            <div className="lg:col-span-8">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="accent">Kursus {String(course.position).padStart(2, "0")}</Badge>
                <Badge variant="outline">{course.level}</Badge>
              </div>
              <h1 className="display-section mt-5 max-w-[18ch]">{course.title}</h1>
              <p className="lead mt-4 max-w-2xl">{course.tagline}</p>
              <p className="mt-4 max-w-2xl text-sm leading-relaxed text-muted">
                {course.description}
              </p>

              <dl className="mt-7 flex flex-wrap items-center gap-x-8 gap-y-3 text-sm text-ink-soft">
                <div className="flex items-center gap-2">
                  <Clock className="size-4 text-muted" aria-hidden="true" />
                  <dt className="sr-only">Estimasi durasi</dt>
                  <dd>{formatDuration(course.durationMinutes)}</dd>
                </div>
                <div className="flex items-center gap-2">
                  <Layers className="size-4 text-muted" aria-hidden="true" />
                  <dt className="sr-only">Jumlah lesson</dt>
                  <dd>{course.lessons.length} lesson</dd>
                </div>
                <div className="flex items-center gap-2">
                  <Award className="size-4 text-muted" aria-hidden="true" />
                  <dt className="sr-only">Passing score</dt>
                  <dd>Nilai minimal {course.passingScore}%</dd>
                </div>
              </dl>
            </div>

            <aside className="lg:col-span-4">
              <div className="rounded-[8px] border border-line bg-surface p-5">
                {state?.certificate ? (
                  <>
                    <p className="flex items-center gap-2 text-sm font-medium text-ok">
                      <Check className="size-4" aria-hidden="true" />
                      Kursus selesai
                    </p>
                    <p className="mt-2 text-xs leading-relaxed text-muted">
                      Sertifikat diterbitkan {new Date(state.certificate.issuedAt).getFullYear()}.
                      Nilai akhir {state.certificate.finalScore}%.
                    </p>
                    <Button asChild className="mt-4 w-full">
                      <Link href={`/certificates/${state.certificate.certificateNumber}`}>
                        Lihat sertifikat
                      </Link>
                    </Button>
                  </>
                ) : (
                  <>
                    <p className="eyebrow">{state ? "Progress kamu" : "Siap dimulai"}</p>
                    {state ? (
                      <>
                        <div className="mt-3 flex items-baseline justify-between">
                          <p className="font-display text-2xl text-ink">
                            {state.completedCount}
                            <span className="text-base text-muted"> / {state.totalLessons} lesson</span>
                          </p>
                          <span className="mono-meta">{state.percent}%</span>
                        </div>
                        <Progress value={state.percent} className="mt-2" label="Progress kursus" />
                        <p className="mt-3 text-xs text-muted">
                          {quizPassed
                            ? `Quiz sudah lulus dengan nilai ${formatScore(state.bestScore)}.`
                            : state.attemptsCount > 0
                              ? `Nilai quiz terbaik ${formatScore(state.bestScore)} dari ${state.attemptsCount} percobaan.`
                              : "Quiz belum dikerjakan."}
                        </p>
                      </>
                    ) : (
                      <p className="mt-2 text-sm leading-relaxed text-muted">
                        Masuk untuk menyimpan progress, mengerjakan quiz, dan
                        memperoleh sertifikat.
                      </p>
                    )}

                    <Button asChild className="mt-4 w-full">
                      <Link href={session ? startHref : `/register?next=/courses/${course.slug}`}>
                        <Play aria-hidden="true" />
                        {state && state.completedCount > 0 ? "Lanjutkan kursus" : "Mulai kursus"}
                      </Link>
                    </Button>

                    {state && allLessonsDone ? (
                      <Button asChild variant="secondary" className="mt-2 w-full">
                        <Link href={`/courses/${course.slug}/quiz`}>
                          <FileQuestion aria-hidden="true" />
                          {quizPassed ? "Tinjau quiz" : "Kerjakan quiz"}
                        </Link>
                      </Button>
                    ) : null}

                    {!session ? (
                      <p className="mt-3 text-center text-xs text-muted">
                        Sudah punya akun?{" "}
                        <Link
                          href={`/login?next=/courses/${course.slug}`}
                          className="text-accent-text underline-offset-2 hover:underline"
                        >
                          Masuk
                        </Link>
                      </p>
                    ) : null}
                  </>
                )}

                <dl className="mt-5 space-y-2.5 border-t border-line pt-4 text-xs">
                  <div className="flex justify-between gap-3">
                    <dt className="text-muted">Level</dt>
                    <dd className="text-ink-soft capitalize">{course.level}</dd>
                  </div>
                  <div className="flex justify-between gap-3">
                    <dt className="text-muted">Bahasa materi</dt>
                    <dd className="text-ink-soft">Indonesia</dd>
                  </div>
                  <div className="flex justify-between gap-3">
                    <dt className="text-muted">Praktik</dt>
                    <dd className="text-ink-soft">Playground browser</dd>
                  </div>
                  <div className="flex justify-between gap-3">
                    <dt className="text-muted">Sertifikat</dt>
                    <dd className="text-ink-soft">Verifikasi publik</dd>
                  </div>
                </dl>
              </div>

              {!isDatabaseCourse ? (
                <Callout tone="warning" title="Kursus belum tersinkron ke database" className="mt-4">
                  Jalankan migration dan seed Supabase untuk membuka progress,
                  quiz, dan sertifikat. Materi kursus tetap bisa dibaca dari
                  katalog publik.
                </Callout>
              ) : null}
            </aside>
          </div>
        </div>
      </section>

      <section className="container-lc py-12 sm:py-16">
        <div className="grid gap-12 lg:grid-cols-12">
          <div className="lg:col-span-8">
            <div>
              <p className="eyebrow">Yang akan kamu pelajari</p>
              <ul className="mt-4 grid gap-3 sm:grid-cols-2">
                {course.objectives.map((objective) => (
                  <li key={objective} className="flex items-start gap-2.5 text-sm leading-relaxed text-ink-soft">
                    <Check className="mt-0.5 size-4 shrink-0 text-accent-text" aria-hidden="true" />
                    {objective}
                  </li>
                ))}
              </ul>
            </div>

            <div className="mt-12">
              <div className="flex items-end justify-between gap-4">
                <div>
                  <p className="eyebrow">Kurikulum</p>
                  <h2 className="display-title mt-2">{course.lessons.length} lesson berurutan</h2>
                </div>
                {state ? (
                  <span className="mono-meta">
                    {state.completedCount}/{state.totalLessons} selesai
                  </span>
                ) : null}
              </div>

              <ol className="mt-5 border-t border-line">
                {course.lessons.map((lesson, index) => {
                  const done = completed.has(lesson.slug);
                  return (
                    <li key={lesson.slug} className="border-b border-line">
                      <Link
                        href={`/learn/${lesson.slug}`}
                        className="group flex items-start gap-4 py-4 transition-colors hover:bg-surface-2/60 sm:items-center sm:gap-5 sm:px-2"
                      >
                        <span
                          className={`mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full border font-mono text-[10px] sm:mt-0 ${
                            done
                              ? "border-ok/30 bg-ok-soft text-ok"
                              : "border-line-strong bg-surface text-muted"
                          }`}
                          aria-hidden="true"
                        >
                          {done ? <Check className="size-3" /> : String(index + 1).padStart(2, "0")}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="flex flex-wrap items-center gap-2">
                            <span className="text-[0.9375rem] font-medium text-ink">
                              {lesson.title}
                            </span>
                            {done ? <Badge variant="success">Selesai</Badge> : null}
                          </span>
                          <span className="mt-1 block text-sm leading-relaxed text-muted">
                            {lesson.summary}
                          </span>
                        </span>
                        <span className="hidden shrink-0 items-center gap-3 text-xs text-muted sm:flex">
                          <Clock className="size-3.5" aria-hidden="true" />
                          {lesson.estimatedMinutes} menit
                          <ChevronRight className="size-4 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
                        </span>
                      </Link>
                    </li>
                  );
                })}

                <li className="border-b border-line">
                  <Link
                    href={`/courses/${course.slug}/quiz`}
                    className="group flex items-start gap-4 py-4 transition-colors hover:bg-surface-2/60 sm:items-center sm:gap-5 sm:px-2"
                  >
                    <span
                      className={`mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full border sm:mt-0 ${
                        quizPassed
                          ? "border-ok/30 bg-ok-soft text-ok"
                          : "border-line-strong bg-surface-2 text-accent-text"
                      }`}
                      aria-hidden="true"
                    >
                      {quizPassed ? <Check className="size-3" /> : <FileQuestion className="size-3.5" />}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex flex-wrap items-center gap-2">
                        <span className="text-[0.9375rem] font-medium text-ink">Quiz akhir kursus</span>
                        <Badge variant="outline">Passing {course.passingScore}%</Badge>
                        {quizPassed ? <Badge variant="success">Lulus</Badge> : null}
                      </span>
                      <span className="mt-1 block text-sm leading-relaxed text-muted">
                        Diperiksa di server dengan umpan balik untuk setiap pertanyaan.
                      </span>
                    </span>
                    <ChevronRight className="hidden size-4 shrink-0 text-muted transition-transform group-hover:translate-x-0.5 sm:block" aria-hidden="true" />
                  </Link>
                </li>
              </ol>
            </div>

            <div className="mt-10">
              <p className="eyebrow">Syarat sertifikat</p>
              <h2 className="display-title mt-2">Tiga pemeriksaan sebelum sertifikat diterbitkan.</h2>
              <ul className="mt-4 space-y-3">
                {[
                  `Seluruh ${course.lessons.length} lesson ditandai selesai.`,
                  "Quiz akhir kursus sudah dikerjakan minimal satu kali.",
                  `Nilai terbaik memenuhi passing score ${course.passingScore}%.`,
                ].map((item) => (
                  <li key={item} className="flex items-start gap-2.5 text-sm text-ink-soft">
                    <Lock className="mt-0.5 size-4 shrink-0 text-muted" aria-hidden="true" />
                    {item}
                  </li>
                ))}
              </ul>
              <p className="mt-3 text-xs leading-relaxed text-muted">
                Semua syarat diperiksa ulang oleh server berdasarkan data
                tersimpan. Status di halaman tidak dapat dijadikan dasar
                penerbitan sertifikat.
              </p>
            </div>
          </div>

          <aside className="lg:col-span-4">
            <div className="lg:sticky lg:top-24">
              <div className="rounded-[8px] border border-line bg-surface p-5">
                <p className="eyebrow">Sebelum mulai</p>
                <ul className="mt-3 space-y-3 text-sm text-ink-soft">
                  <li className="flex gap-2.5">
                    <Circle className="mt-1 size-2 shrink-0 fill-accent text-accent" aria-hidden="true" />
                    Browser modern (Chrome, Firefox, atau Safari).
                  </li>
                  <li className="flex gap-2.5">
                    <Circle className="mt-1 size-2 shrink-0 fill-accent text-accent" aria-hidden="true" />
                    Tidak perlu memasang aplikasi tambahan.
                  </li>
                  <li className="flex gap-2.5">
                    <Circle className="mt-1 size-2 shrink-0 fill-accent text-accent" aria-hidden="true" />
                    Akun LearnCode untuk menyimpan progress.
                  </li>
                </ul>
                <div className="mt-5 border-t border-line pt-4">
                  <p className="eyebrow">Cara belajar</p>
                  <p className="mt-2 text-sm leading-relaxed text-muted">
                    Baca materi, jalankan contoh kode, lalu kerjakan latihan.
                    Tandai lesson selesai hanya setelah kamu bisa menjelaskan
                    inti materinya.
                  </p>
                </div>
              </div>

              <div className="mt-4 rounded-[8px] border border-dashed border-line-strong p-4">
                <p className="flex items-center gap-2 text-xs font-medium text-ink-soft">
                  <ArrowRight className="size-3.5 text-accent-text" aria-hidden="true" />
                  Butuh bantuan di tengah lesson?
                </p>
                <p className="mt-1.5 text-xs leading-relaxed text-muted">
                  AI Tutor dapat menjelaskan kode, memberi hint, dan membantu
                  proses debug tanpa langsung memberi jawaban.
                </p>
              </div>
            </div>
          </aside>
        </div>
      </section>
    </>
  );
}
