"use client";

import Link from "next/link";
import { useActionState, useState } from "react";

import { FormField, FormMessage } from "@/components/admin/primitives";
import { Button } from "@/components/ui/button";
import { Input, Select, Textarea } from "@/components/ui/input";
import { IDLE_ADMIN_STATE, type AdminActionState } from "@/lib/actions/admin-state";

type LessonInitial = {
  id: string;
  courseId: string;
  title: string;
  slug: string;
  summary: string;
  contentMd: string;
  objectives: string[];
  estimatedMinutes: number;
  required: boolean;
  status: string;
  codeExample: { language?: string; filename?: string; caption?: string; code?: string };
  exercise: {
    title?: string;
    brief?: string;
    steps?: string[];
    hint?: string;
    starter?: { html?: string; css?: string; js?: string };
  };
};

function slugify(value: string) {
  return value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 80);
}

export function LessonForm({
  action,
  courses,
  lesson,
  defaultCourseId,
}: {
  action: (state: AdminActionState, formData: FormData) => Promise<AdminActionState>;
  courses: { id: string; title: string; slug: string }[];
  lesson?: LessonInitial;
  defaultCourseId?: string;
}) {
  const [state, formAction, pending] = useActionState(action, IDLE_ADMIN_STATE);
  const isEdit = Boolean(lesson);
  const errors = state.fieldErrors ?? {};
  const [slug, setSlug] = useState(lesson?.slug ?? "");
  const [slugTouched, setSlugTouched] = useState(isEdit);

  return (
    <form action={formAction} className="space-y-5" noValidate>
      {isEdit ? <input type="hidden" name="lessonId" value={lesson?.id} /> : null}

      <section className="rounded-[8px] border border-line bg-surface p-4 sm:p-5">
        <h2 className="font-display text-base font-semibold text-ink">Dasar lesson</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <FormField label="Kursus induk" htmlFor="courseId" error={errors.courseId}>
            <Select
              id="courseId"
              name="courseId"
              defaultValue={lesson?.courseId ?? defaultCourseId ?? ""}
              required
              disabled={isEdit}
            >
              <option value="" disabled>
                Pilih kursus
              </option>
              {courses.map((course) => (
                <option key={course.id} value={course.id}>
                  {course.title}
                </option>
              ))}
            </Select>
            {isEdit ? <input type="hidden" name="courseId" value={lesson?.courseId} /> : null}
          </FormField>

          <FormField label="Judul" htmlFor="title" error={errors.title}>
            <Input
              id="title"
              name="title"
              defaultValue={lesson?.title}
              required
              maxLength={120}
              onChange={(event) => {
                if (!slugTouched) setSlug(slugify(event.target.value));
              }}
            />
          </FormField>

          <FormField
            label="Slug URL"
            htmlFor="slug"
            error={errors.slug}
            hint="Unik di seluruh platform: /learn/<slug>."
          >
            <Input
              id="slug"
              name="slug"
              value={slug}
              onChange={(event) => {
                setSlugTouched(true);
                setSlug(slugify(event.target.value));
              }}
              required
              className="font-mono text-[0.8125rem]"
            />
          </FormField>

          <FormField label="Estimasi (menit)" htmlFor="estimatedMinutes" error={errors.estimatedMinutes}>
            <Input
              id="estimatedMinutes"
              name="estimatedMinutes"
              type="number"
              min={1}
              max={600}
              defaultValue={lesson?.estimatedMinutes ?? 20}
              required
            />
          </FormField>

          <FormField label="Ringkasan" htmlFor="summary" error={errors.summary} className="sm:col-span-2">
            <Input id="summary" name="summary" defaultValue={lesson?.summary} required maxLength={280} />
          </FormField>

          <FormField
            label="Tujuan lesson"
            htmlFor="objectives"
            error={errors.objectives}
            hint="Satu tujuan per baris."
            className="sm:col-span-2"
          >
            <Textarea id="objectives" name="objectives" defaultValue={(lesson?.objectives ?? []).join("\n")} rows={3} />
          </FormField>

          <FormField label="Status" htmlFor="status" error={errors.status}>
            <Select id="status" name="status" defaultValue={lesson?.status ?? "draft"}>
              <option value="draft">Draft</option>
              <option value="published">Terbit</option>
              <option value="archived">Arsip</option>
            </Select>
          </FormField>

          <div className="flex items-start gap-2 pt-6">
            <input
              id="required"
              name="required"
              type="checkbox"
              defaultChecked={lesson?.required ?? true}
              className="mt-0.5 size-4 rounded border-line-strong text-accent focus-visible:ring-accent-text"
            />
            <div>
              <label htmlFor="required" className="text-[0.8125rem] font-medium text-ink">
                Lesson wajib
              </label>
              <p className="mt-0.5 text-[11px] leading-relaxed text-muted">
                Lesson wajib ikut menentukan kelulusan kursus (bila kursus mewajibkan semua lesson).
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-[8px] border border-line bg-surface p-4 sm:p-5">
        <h2 className="font-display text-base font-semibold text-ink">Materi</h2>
        <p className="mt-1 text-[11px] leading-relaxed text-muted">
          Markdown didukung: heading, paragraf, daftar, tautan, dan blok kode berpagar.
          HTML mentah di dalam materi tidak dieksekusi.
        </p>
        <FormField label="Isi lesson (Markdown)" htmlFor="contentMd" error={errors.contentMd} className="mt-4">
          <Textarea
            id="contentMd"
            name="contentMd"
            defaultValue={lesson?.contentMd}
            required
            rows={16}
            className="font-mono text-[0.8125rem] leading-relaxed"
          />
        </FormField>
      </section>

      <section className="rounded-[8px] border border-line bg-surface p-4 sm:p-5">
        <h2 className="font-display text-base font-semibold text-ink">Contoh kode</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <FormField label="Bahasa" htmlFor="codeLanguage" error={errors.codeLanguage}>
            <Select id="codeLanguage" name="codeLanguage" defaultValue={lesson?.codeExample?.language ?? "html"}>
              <option value="html">HTML</option>
              <option value="css">CSS</option>
              <option value="javascript">JavaScript</option>
            </Select>
          </FormField>
          <FormField label="Nama file" htmlFor="codeFilename" error={errors.codeFilename}>
            <Input
              id="codeFilename"
              name="codeFilename"
              defaultValue={lesson?.codeExample?.filename}
              maxLength={60}
              placeholder="index.html"
              className="font-mono text-[0.8125rem]"
            />
          </FormField>
          <FormField label="Keterangan" htmlFor="codeCaption" error={errors.codeCaption} className="sm:col-span-2">
            <Input id="codeCaption" name="codeCaption" defaultValue={lesson?.codeExample?.caption} maxLength={160} />
          </FormField>
          <FormField label="Kode" htmlFor="code" error={errors.code} className="sm:col-span-2">
            <Textarea
              id="code"
              name="code"
              defaultValue={lesson?.codeExample?.code}
              rows={8}
              className="font-mono text-[0.8125rem] leading-relaxed"
            />
          </FormField>
        </div>
      </section>

      <section className="rounded-[8px] border border-line bg-surface p-4 sm:p-5">
        <h2 className="font-display text-base font-semibold text-ink">Latihan</h2>
        <p className="mt-1 text-[11px] leading-relaxed text-muted">
          Latihan dirender di panel playground lesson. Starter dipakai sebagai isi awal editor.
        </p>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <FormField label="Judul latihan" htmlFor="exerciseTitle" error={errors.exerciseTitle}>
            <Input id="exerciseTitle" name="exerciseTitle" defaultValue={lesson?.exercise?.title} maxLength={120} />
          </FormField>
          <FormField label="Hint" htmlFor="exerciseHint" error={errors.exerciseHint}>
            <Input id="exerciseHint" name="exerciseHint" defaultValue={lesson?.exercise?.hint} maxLength={400} />
          </FormField>
          <FormField label="Brief" htmlFor="exerciseBrief" error={errors.exerciseBrief} className="sm:col-span-2">
            <Textarea id="exerciseBrief" name="exerciseBrief" defaultValue={lesson?.exercise?.brief} rows={3} />
          </FormField>
          <FormField
            label="Langkah latihan"
            htmlFor="exerciseSteps"
            error={errors.exerciseSteps}
            hint="Satu langkah per baris."
            className="sm:col-span-2"
          >
            <Textarea
              id="exerciseSteps"
              name="exerciseSteps"
              defaultValue={(lesson?.exercise?.steps ?? []).join("\n")}
              rows={4}
            />
          </FormField>
          <FormField label="Starter HTML" htmlFor="starterHtml" error={errors.starterHtml}>
            <Textarea
              id="starterHtml"
              name="starterHtml"
              defaultValue={lesson?.exercise?.starter?.html}
              rows={6}
              className="font-mono text-[0.8125rem]"
            />
          </FormField>
          <FormField label="Starter CSS" htmlFor="starterCss" error={errors.starterCss}>
            <Textarea
              id="starterCss"
              name="starterCss"
              defaultValue={lesson?.exercise?.starter?.css}
              rows={6}
              className="font-mono text-[0.8125rem]"
            />
          </FormField>
          <FormField label="Starter JavaScript" htmlFor="starterJs" error={errors.starterJs} className="sm:col-span-2">
            <Textarea
              id="starterJs"
              name="starterJs"
              defaultValue={lesson?.exercise?.starter?.js}
              rows={6}
              className="font-mono text-[0.8125rem]"
            />
          </FormField>
        </div>
      </section>

      <FormMessage status={state.status} message={state.message} />

      <div className="flex flex-wrap items-center gap-2">
        <Button type="submit" loading={pending}>
          {isEdit ? "Simpan lesson" : "Simpan lesson"}
        </Button>
        <Button asChild variant="ghost" type="button">
          <Link href={isEdit ? `/admin/lessons/${lesson?.id}` : "/admin/lessons"}>Batal</Link>
        </Button>
      </div>
    </form>
  );
}
