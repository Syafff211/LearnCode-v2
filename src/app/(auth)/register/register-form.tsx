"use client";

import Link from "next/link";
import { useActionState } from "react";
import { CircleCheck } from "lucide-react";

import { FormField, FormMessage, PasswordInput } from "@/components/auth/form-parts";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { signUpAction, type AuthActionState } from "@/lib/actions/auth";

const initialState: AuthActionState = { status: "idle" };

export function RegisterForm({ next }: { next: string }) {
  const [state, formAction, pending] = useActionState(signUpAction, initialState);
  const errors = state.fieldErrors ?? {};

  if (state.status === "verify-email") {
    return (
      <div className="rounded-[8px] border border-line bg-surface p-5">
        <p className="flex items-center gap-2 text-sm font-medium text-ok">
          <CircleCheck className="size-4" aria-hidden="true" />
          Akun berhasil dibuat
        </p>
        <p className="mt-2 text-sm leading-relaxed text-ink-soft">{state.message}</p>
        <p className="mt-3 text-xs leading-relaxed text-muted">
          Tidak menerima email? Periksa folder spam. Jika verifikasi email
          dimatikan pada project Supabase, kamu bisa langsung masuk.
        </p>
        <Button asChild className="mt-4 w-full">
          <Link href={`/login${next !== "/dashboard" ? `?next=${encodeURIComponent(next)}` : ""}`}>
            Ke halaman masuk
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <form action={formAction} className="space-y-4" noValidate>
      <FormField id="fullName" label="Nama lengkap" error={errors.fullName?.[0]}>
        <Input
          id="fullName"
          name="fullName"
          type="text"
          autoComplete="name"
          placeholder="Nama kamu"
          required
          aria-invalid={Boolean(errors.fullName)}
          aria-describedby={errors.fullName ? "fullName-error" : undefined}
        />
      </FormField>

      <FormField id="email" label="Email" error={errors.email?.[0]}>
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          inputMode="email"
          placeholder="nama@email.com"
          required
          aria-invalid={Boolean(errors.email)}
          aria-describedby={errors.email ? "email-error" : undefined}
        />
      </FormField>

      <FormField
        id="password"
        label="Password"
        error={errors.password?.[0]}
        hint="Minimal 8 karakter. Gunakan kombinasi huruf dan angka."
      >
        <PasswordInput
          id="password"
          name="password"
          autoComplete="new-password"
          minLength={8}
          required
          aria-invalid={Boolean(errors.password)}
          aria-describedby={errors.password ? "password-error" : "password-hint"}
        />
      </FormField>

      <FormField id="confirmPassword" label="Ulangi password" error={errors.confirmPassword?.[0]}>
        <PasswordInput
          id="confirmPassword"
          name="confirmPassword"
          autoComplete="new-password"
          required
          aria-invalid={Boolean(errors.confirmPassword)}
          aria-describedby={errors.confirmPassword ? "confirmPassword-error" : undefined}
        />
      </FormField>

      {state.status === "error" ? <FormMessage message={state.message} /> : null}

      <Button type="submit" className="w-full" loading={pending}>
        {pending ? "Membuat akun…" : "Buat akun"}
      </Button>

      <p className="text-xs leading-relaxed text-muted">
        Dengan membuat akun, kamu menyetujui bahwa LearnCode menyimpan nama,
        email, progress belajar, dan hasil quiz untuk menjalankan fitur
        pembelajaran.
      </p>

      <p className="text-center text-sm text-muted">
        Sudah punya akun?{" "}
        <Link
          href={`/login${next !== "/dashboard" ? `?next=${encodeURIComponent(next)}` : ""}`}
          className="font-medium text-accent-text underline-offset-2 hover:underline"
        >
          Masuk
        </Link>
      </p>
    </form>
  );
}
