"use client";

import * as React from "react";
import Link from "next/link";
import { useActionState } from "react";

import { FormField, FormMessage, PasswordInput } from "@/components/auth/form-parts";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { signInAction, type AuthActionState } from "@/lib/actions/auth";

const initialState: AuthActionState = { status: "idle" };

export function LoginForm({ next }: { next: string }) {
  const [state, formAction, pending] = useActionState(signInAction, initialState);
  const emailError = state.fieldErrors?.email?.[0];
  const passwordError = state.fieldErrors?.password?.[0];

  return (
    <form action={formAction} className="space-y-4" noValidate>
      <input type="hidden" name="next" value={next} />

      <FormField id="email" label="Email" error={emailError}>
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          inputMode="email"
          placeholder="nama@email.com"
          required
          aria-invalid={Boolean(emailError)}
          aria-describedby={emailError ? "email-error" : undefined}
        />
      </FormField>

      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <label htmlFor="password" className="text-[0.8125rem] font-medium text-ink">
            Password
          </label>
          <Link
            href="/forgot-password"
            className="text-xs text-muted underline-offset-2 hover:text-ink hover:underline"
          >
            Lupa password?
          </Link>
        </div>
        <PasswordInput
          id="password"
          name="password"
          autoComplete="current-password"
          required
          aria-invalid={Boolean(passwordError)}
          aria-describedby={passwordError ? "password-error" : undefined}
        />
        {passwordError ? (
          <p id="password-error" role="alert" className="text-xs text-danger">
            {passwordError}
          </p>
        ) : null}
      </div>

      {state.status === "error" ? <FormMessage message={state.message} /> : null}

      <Button type="submit" className="w-full" loading={pending}>
        {pending ? "Memeriksa…" : "Masuk"}
      </Button>

      <p className="text-center text-sm text-muted">
        Belum punya akun?{" "}
        <Link
          href={`/register${next !== "/dashboard" ? `?next=${encodeURIComponent(next)}` : ""}`}
          className="font-medium text-accent-text underline-offset-2 hover:underline"
        >
          Buat akun
        </Link>
      </p>
    </form>
  );
}
