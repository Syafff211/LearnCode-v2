import Link from "next/link";
import {
  ArrowRight,
  BookOpen,
  Bug,
  Check,
  ClipboardCheck,
  Code2,
  FileSearch,
  FlaskConical,
  Keyboard,
  Lightbulb,
  Play,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

import { AiChatMock } from "@/components/marketing/ai-chat-mock";
import { CertificateMock } from "@/components/marketing/certificate-mock";
import { CourseCard } from "@/components/marketing/course-card";
import { HeroEditor } from "@/components/marketing/hero-editor";
import { PlaygroundMock } from "@/components/marketing/playground-mock";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getCatalogCourses } from "@/lib/data/courses";

export const dynamic = "force-dynamic";

const howItWorks = [
  {
    step: "01",
    title: "Pahami satu konsep",
    body: "Setiap lesson dibuka dengan penjelasan singkat dan contoh kode nyata. Kamu membaca alasan di balik setiap baris, bukan sekadar menyalinnya.",
  },
  {
    step: "02",
    title: "Praktikkan di playground",
    body: "Ubah kode, jalankan, dan lihat hasilnya langsung di browser. Error yang muncul menjadi bagian dari proses belajar.",
  },
  {
    step: "03",
    title: "Uji dengan quiz",
    body: "Quiz menilai pemahamanmu di server. Umpan balik menjelaskan mengapa sebuah jawaban benar atau keliru.",
  },
  {
    step: "04",
    title: "Tuntaskan dan verifikasi",
    body: "Setelah semua lesson selesai dan nilai memenuhi syarat, sertifikat diterbitkan otomatis dan bisa diverifikasi publik.",
  },
];

const aiModes = [
  {
    icon: FileSearch,
    title: "Explain Code",
    body: "Membaca kodemu baris per baris dan menyebut konsep yang sedang bekerja.",
  },
  {
    icon: Bug,
    title: "Debug Code",
    body: "Menunjukkan kemungkinan penyebab error dan cara memeriksanya di DevTools.",
  },
  {
    icon: Lightbulb,
    title: "Give Me a Hint",
    body: "Hint bertahap: satu petunjuk dulu, solusi lengkap belakangan jika kamu memintanya.",
  },
  {
    icon: ClipboardCheck,
    title: "Code Review",
    body: "Menyoroti kebenaran, keterbacaan, aksesibilitas, dan potensi masalah keamanan.",
  },
  {
    icon: BookOpen,
    title: "Explain This Lesson",
    body: "Menjelaskan ulang lesson aktif dengan bahasa yang lebih sederhana.",
  },
  {
    icon: FlaskConical,
    title: "Practice Suggestions",
    body: "Menyusun latihan kecil berikutnya sesuai level dan lesson yang sedang kamu buka.",
  },
];

const faqs = [
  {
    question: "Apakah saya perlu pengalaman coding sebelumnya?",
    answer:
      "Tidak. Kursus dimulai dari HTML dasar dan bergerak naik ke CSS lalu JavaScript. Jika kamu sudah pernah menulis kode, kamu bisa langsung masuk ke lesson yang relevan dan tetap mengerjakan quiz untuk mengukur pemahaman.",
  },
  {
    question: "Bahasa pemrograman apa yang didukung playground?",
    answer:
      "Playground menjalankan HTML, CSS, dan JavaScript di browser. Kode dieksekusi di dalam iframe yang diisolasi. Node.js, Python, dan bahasa backend lain tidak dijalankan di playground ini.",
  },
  {
    question: "Bagaimana cara kerja AI Tutor?",
    answer:
      "AI Tutor memakai Groq API melalui server LearnCode. Ia menerima konteks lesson yang sedang kamu buka dan kode yang kamu lampirkan, lalu menjawab dengan penjelasan. AI tidak menjalankan kode; ia membantu kamu membaca dan memperbaikinya. Setiap akun memiliki batas pesan harian.",
  },
  {
    question: "Apakah sertifikat ini terakreditasi?",
    answer:
      "Tidak. Sertifikat LearnCode adalah bukti penyelesaian kursus di platform ini, bukan akreditasi dari lembaga eksternal. Setiap sertifikat memiliki nomor dan kode verifikasi yang bisa dicek siapa saja melalui halaman verifikasi publik.",
  },
  {
    question: "Apa syarat mendapatkan sertifikat?",
    answer:
      "Kamu harus menyelesaikan seluruh lesson pada kursus, mengerjakan quiz, dan memperoleh nilai yang memenuhi passing score kursus tersebut. Syarat ini diperiksa ulang oleh server berdasarkan data progress dan hasil quiz, bukan berdasarkan status di halaman.",
  },
  {
    question: "Apakah progress saya tersimpan?",
    answer:
      "Ya. Setelah masuk, setiap lesson yang kamu tandai selesai dan setiap quiz yang dikirim disimpan di database. Kamu bisa melanjutkan dari perangkat lain tanpa kehilangan progress.",
  },
];

export default async function LandingPage() {
  const courses = await getCatalogCourses();
  const featured = courses.slice(0, 3);
  const lessonCount = courses.reduce((total, course) => total + course.lessons.length, 0);

  return (
    <>
      {/* ---------------------------------------------------------------- Hero */}
      <section className="border-b border-line">
        <div className="container-lc grid items-center gap-12 py-14 sm:py-16 lg:grid-cols-[1.02fr_1fr] lg:gap-14 lg:py-24">
          <div>
            <p className="eyebrow flex items-center gap-2">
              <span aria-hidden="true" className="size-1.5 bg-accent" />
              Platform belajar coding berbasis praktik
            </p>
            <h1 className="display-hero mt-6 max-w-[15ch]">
              Belajar coding dengan membangun sesuatu.
            </h1>
            <p className="lead mt-6 max-w-[46ch]">
              Pelajari pemrograman melalui materi praktik, latihan interaktif, dan
              AI Tutor yang membantu kamu memahami kode, bukan sekadar menyalin
              jawaban.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Button asChild size="lg" className="justify-center">
                <Link href="/register">
                  Mulai Belajar
                  <ArrowRight aria-hidden="true" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="secondary" className="justify-center">
                <Link href="#kursus">Jelajahi Kursus</Link>
              </Button>
            </div>

            <dl className="mt-10 grid max-w-lg grid-cols-3 gap-4 border-t border-line pt-5">
              <div>
                <dt className="eyebrow">Kursus inti</dt>
                <dd className="mt-1 text-sm text-ink">{courses.length} kursus</dd>
              </div>
              <div>
                <dt className="eyebrow">Lesson praktik</dt>
                <dd className="mt-1 text-sm text-ink">{lessonCount} lesson</dd>
              </div>
              <div>
                <dt className="eyebrow">Sertifikat</dt>
                <dd className="mt-1 text-sm text-ink">Verifikasi publik</dd>
              </div>
            </dl>
            <p className="mt-4 text-xs text-muted">
              Tanpa instalasi. Editor dan latihan berjalan langsung di browser.
            </p>
          </div>

          <HeroEditor />
        </div>
      </section>

      {/* ------------------------------------------------------------- Courses */}
      <section id="kursus" className="border-b border-line">
        <div className="container-lc py-16 lg:py-24">
          <div className="grid gap-6 lg:grid-cols-12 lg:items-end">
            <div className="lg:col-span-7">
              <p className="eyebrow">01 — Kurikulum</p>
              <h2 className="display-section mt-4 max-w-[18ch]">
                Tiga fondasi. Satu jalur yang jelas.
              </h2>
            </div>
            <div className="lg:col-span-5 lg:justify-self-end">
              <p className="max-w-sm text-sm leading-relaxed text-muted">
                Mulai dari struktur halaman, lanjut ke tata letak dan tampilan,
                lalu tambahkan interaksi. Setiap kursus berakhir dengan quiz dan
                sertifikat.
              </p>
              <Link
                href="/courses"
                className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-accent-text underline-offset-4 hover:underline"
              >
                Lihat seluruh katalog
                <ArrowRight className="size-3.5" aria-hidden="true" />
              </Link>
            </div>
          </div>

          <div className="mt-10 grid gap-4 md:grid-cols-3">
            {featured.map((course) => (
              <CourseCard key={course.slug} course={course} />
            ))}
          </div>
        </div>
      </section>

      {/* --------------------------------------------------------- How it works */}
      <section className="border-b border-line">
        <div className="container-lc py-16 lg:py-24">
          <div className="grid gap-10 lg:grid-cols-12">
            <div className="lg:col-span-4">
              <p className="eyebrow">02 — Cara kerja</p>
              <h2 className="display-section mt-4 max-w-[14ch]">
                Dari membaca kode sampai menjelaskannya sendiri.
              </h2>
              <p className="mt-5 max-w-sm text-sm leading-relaxed text-muted">
                LearnCode tidak memisahkan teori dari praktik. Kamu membaca,
                mencoba, salah, memperbaiki, lalu menguji pemahaman di akhir
                kursus.
              </p>
            </div>

            <ol className="lg:col-span-8">
              {howItWorks.map((item, index) => (
                <li
                  key={item.step}
                  className={`grid gap-3 border-t border-line py-6 sm:grid-cols-[4rem_1fr_1.5fr] sm:gap-6 ${
                    index === howItWorks.length - 1 ? "border-b" : ""
                  }`}
                >
                  <span className="font-mono text-xs tracking-[0.08em] text-muted">
                    {item.step}
                  </span>
                  <h3 className="font-display text-xl leading-snug text-ink">
                    {item.title}
                  </h3>
                  <p className="text-sm leading-relaxed text-muted">{item.body}</p>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </section>

      {/* ---------------------------------------------------------- Playground */}
      <section className="border-b border-line bg-surface-2/50">
        <div className="container-lc grid gap-10 py-16 lg:grid-cols-12 lg:items-center lg:gap-12 lg:py-24">
          <div className="lg:col-span-5">
            <p className="eyebrow">03 — Playground</p>
            <h2 className="display-section mt-4 max-w-[15ch]">
              Tulis kode. Jalankan. Lihat apa yang terjadi.
            </h2>
            <p className="mt-5 max-w-md text-sm leading-relaxed text-muted">
              Editor kode dengan syntax highlighting, line numbers, dan preview
              langsung. Error ditampilkan di panel console, jadi kamu belajar
              membaca pesan kesalahan sejak awal.
            </p>
            <ul className="mt-6 space-y-3">
              {[
                "Monaco Editor untuk HTML, CSS, dan JavaScript.",
                "Preview dijalankan di iframe tersandbox tanpa akses ke aplikasi.",
                "Reset contoh kode kapan saja untuk mulai dari awal.",
              ].map((item) => (
                <li key={item} className="flex items-start gap-2.5 text-sm text-ink-soft">
                  <Check className="mt-0.5 size-4 shrink-0 text-accent-text" aria-hidden="true" />
                  {item}
                </li>
              ))}
            </ul>
            <div className="mt-6 rounded-[6px] border border-line bg-surface p-3.5 text-xs leading-relaxed text-muted">
              <span className="font-medium text-ink">Catatan jujur:</span> playground
              hanya menjalankan HTML, CSS, dan JavaScript di browser. Tidak ada
              eksekusi Node.js, Python, atau bahasa backend.
            </div>
            <Button asChild className="mt-6">
              <Link href="/playground">
                <Play aria-hidden="true" />
                Buka playground
              </Link>
            </Button>
          </div>
          <div className="lg:col-span-7">
            <PlaygroundMock />
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------- AI Tutor */}
      <section className="border-b border-line">
        <div className="container-lc py-16 lg:py-24">
          <div className="grid gap-10 lg:grid-cols-12 lg:gap-12">
            <div className="lg:col-span-6">
              <p className="eyebrow">04 — AI Tutor</p>
              <h2 className="display-section mt-4 max-w-[17ch]">
                Bantuan yang membuatmu berpikir, bukan menggantikanmu.
              </h2>
              <p className="mt-5 max-w-lg text-sm leading-relaxed text-muted">
                AI Tutor menyesuaikan jawaban dengan lesson aktif dan level
                pemahamanmu. Untuk soal latihan, ia memberi hint bertahap lebih
                dulu sebelum solusi lengkap.
              </p>

              <div className="mt-8 grid gap-x-6 gap-y-5 sm:grid-cols-2">
                {aiModes.map((mode) => (
                  <div key={mode.title} className="flex gap-3">
                    <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-[5px] border border-line bg-surface">
                      <mode.icon className="size-4 text-accent-text" aria-hidden="true" />
                    </span>
                    <div>
                      <p className="text-sm font-medium text-ink">{mode.title}</p>
                      <p className="mt-1 text-xs leading-relaxed text-muted">{mode.body}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-7 flex flex-wrap items-center gap-3">
                <Button asChild>
                  <Link href="/ai-tutor">
                    <Sparkles aria-hidden="true" />
                    Coba AI Tutor
                  </Link>
                </Button>
                <span className="font-mono text-[10px] uppercase tracking-[0.08em] text-muted">
                  Groq · jawaban streaming
                </span>
              </div>
            </div>
            <div className="lg:col-span-6 lg:pl-6">
              <AiChatMock />
              <p className="mt-3 font-mono text-[10px] uppercase tracking-[0.07em] text-muted">
                Contoh percakapan · bukan sesi langsung
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* -------------------------------------------------------- Certificates */}
      <section className="border-b border-line bg-surface-2/50">
        <div className="container-lc grid gap-10 py-16 lg:grid-cols-12 lg:items-center lg:gap-12 lg:py-24">
          <div className="lg:col-span-6">
            <p className="eyebrow">05 — Progress & sertifikat</p>
            <h2 className="display-section mt-4 max-w-[16ch]">
              Bukti belajar yang bisa diperiksa, bukan sekadar gambar.
            </h2>
            <p className="mt-5 max-w-lg text-sm leading-relaxed text-muted">
              Progress disimpan setelah kamu menandai lesson selesai dan
              mengirim quiz. Ketika seluruh syarat terpenuhi, server menerbitkan
              sertifikat dengan nomor unik dan kode verifikasi.
            </p>
            <ul className="mt-6 space-y-3">
              {[
                "Sertifikat PDF landscape A4 dengan QR code verifikasi.",
                "Nilai akhir dan tanggal penerbitan diambil dari data yang tersimpan.",
                "Halaman verifikasi publik menampilkan penerima, kursus, dan status keaslian.",
                "Sertifikat LearnCode adalah bukti penyelesaian kursus, bukan akreditasi eksternal.",
              ].map((item) => (
                <li key={item} className="flex items-start gap-2.5 text-sm text-ink-soft">
                  <ShieldCheck className="mt-0.5 size-4 shrink-0 text-accent-text" aria-hidden="true" />
                  {item}
                </li>
              ))}
            </ul>
            <Button asChild variant="secondary" className="mt-7">
              <Link href="/register">
                Mulai perjalanan belajarmu
                <ArrowRight aria-hidden="true" />
              </Link>
            </Button>
          </div>
          <div className="lg:col-span-6">
            <CertificateMock />
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------------ FAQ */}
      <section className="border-b border-line">
        <div className="container-lc py-16 lg:py-24">
          <div className="grid gap-8 lg:grid-cols-12">
            <div className="lg:col-span-4">
              <p className="eyebrow">06 — Pertanyaan umum</p>
              <h2 className="display-section mt-4 max-w-[12ch]">Hal yang sering ditanyakan.</h2>
              <p className="mt-4 max-w-xs text-sm leading-relaxed text-muted">
                Belum menemukan jawaban? Baca detail kursus atau mulai saja dari
                lesson pertama.
              </p>
            </div>
            <div className="lg:col-span-8">
              <div className="divide-y divide-line border-y border-line">
                {faqs.map((faq) => (
                  <details key={faq.question} className="group">
                    <summary className="flex cursor-pointer list-none items-center justify-between gap-6 py-4 text-[0.9375rem] font-medium text-ink marker:hidden hover:text-accent-text [&::-webkit-details-marker]:hidden">
                      {faq.question}
                      <span
                        aria-hidden="true"
                        className="relative flex size-5 shrink-0 items-center justify-center rounded-full border border-line-strong text-muted transition-transform group-open:rotate-45"
                      >
                        <span className="absolute h-px w-2 bg-current" />
                        <span className="absolute h-2 w-px bg-current" />
                      </span>
                    </summary>
                    <p className="max-w-2xl pb-5 text-sm leading-relaxed text-muted">
                      {faq.answer}
                    </p>
                  </details>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* -------------------------------------------------------------- Final CTA */}
      <section>
        <div className="container-lc py-16 lg:py-24">
          <div className="grid gap-8 border border-line bg-surface px-6 py-10 sm:px-10 lg:grid-cols-[1.4fr_1fr] lg:items-center lg:px-12 lg:py-14">
            <div>
              <p className="eyebrow">Mulai dari satu halaman</p>
              <h2 className="display-section mt-3 max-w-[20ch]">
                Bangun kebiasaan belajar lewat proyek kecil.
              </h2>
              <p className="mt-4 max-w-lg text-sm leading-relaxed text-muted">
                Buat akun, pilih kursus, dan selesaikan lesson pertamamu hari ini.
                Progress-mu bisa dilanjutkan kapan saja.
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row lg:justify-end">
              <Button asChild size="lg">
                <Link href="/register">
                  Mulai Belajar
                  <ArrowRight aria-hidden="true" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="secondary">
                <Link href="/courses">Jelajahi Kursus</Link>
              </Button>
            </div>
          </div>

          <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-2 font-mono text-[10px] uppercase tracking-[0.08em] text-muted">
            <span className="flex items-center gap-1.5">
              <Code2 className="size-3" aria-hidden="true" /> HTML · CSS · JavaScript
            </span>
            <span className="flex items-center gap-1.5">
              <Keyboard className="size-3" aria-hidden="true" /> Dapat digunakan dengan keyboard
            </span>
            <span className="flex items-center gap-1.5">
              <Badge variant="outline" className="py-0">AI</Badge> Groq-powered tutor
            </span>
          </div>
        </div>
      </section>
    </>
  );
}
