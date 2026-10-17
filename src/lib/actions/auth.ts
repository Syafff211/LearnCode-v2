"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

import { getAppUrl, isSupabaseConfigured } from "@/lib/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { safeRedirectPath } from "@/lib/utils";
import {
  forgotPasswordSchema,
  loginSchema,
  registerSchema,
  resetPasswordSchema,
} from "@/lib/validation/auth";

export type AuthActionState = {
  status: "idle" | "error" | "success" | "verify-email";
  message?: string;
  fieldErrors?: Record<string, string[]>;
};

const SETUP_MESSAGE =
  "Autentikasi belum aktif. Hubungkan project Supabase dan isi environment variables terlebih dahulu.";

function zodFieldErrors(error: {
  issues: { path: PropertyKey[]; message: string }[];
}): Record<string, string[]> {
  const fieldErrors: Record<string, string[]> = {};
  for (const issue of error.issues) {
    const key = issue.path.map(String).join(".") || "form";
    fieldErrors[key] = [...(fieldErrors[key] ?? []), issue.message];
  }
  return fieldErrors;
}

function translateAuthError(message: string): string {
  const normalized = message.toLowerCase();
  if (normalized.includes("invalid login credentials")) {
    return "Email atau password salah. Periksa kembali lalu coba lagi.";
  }
  if (normalized.includes("email not confirmed")) {
    return "Email kamu belum diverifikasi. Buka tautan konfirmasi di inbox, lalu coba masuk lagi.";
  }
  if (normalized.includes("already registered") || normalized.includes("already been registered")) {
    return "Email ini sudah terdaftar. Coba masuk atau gunakan fitur lupa password.";
  }
  if (normalized.includes("password should be") || normalized.includes("weak password")) {
    return "Password terlalu lemah. Gunakan minimal 8 karakter.";
  }
  if (normalized.includes("rate limit") || normalized.includes("too many")) {
    return "Terlalu banyak percobaan. Tunggu sebentar sebelum mencoba lagi.";
  }
  if (normalized.includes("invalid email")) {
    return "Format email tidak valid.";
  }
  return "Permintaan belum berhasil. Coba lagi beberapa saat.";
}

export async function signInAction(
  _prevState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  if (!isSupabaseConfigured()) {
    return { status: "error", message: SETUP_MESSAGE };
  }

  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
    next: formData.get("next") ?? undefined,
  });

  if (!parsed.success) {
    return {
      status: "error",
      message: "Periksa kembali data yang kamu masukkan.",
      fieldErrors: zodFieldErrors(parsed.error),
    };
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.signInWithPassword({
    email: parsed.data.email,
    password: parsed.data.password,
  });

  if (error || !data.user) {
    return {
      status: "error",
      message: translateAuthError(error?.message ?? "invalid login credentials"),
    };
  }

  // Suspended accounts can authenticate, but must not receive a usable session.
  const { data: profile } = await supabase
    .from("profiles")
    .select("suspended_at")
    .eq("id", data.user.id)
    .maybeSingle();

  if (profile?.suspended_at) {
    await supabase.auth.signOut();
    redirect("/login?error=suspended");
  }

  revalidatePath("/", "layout");
  redirect(safeRedirectPath(parsed.data.next));
}

export async function signUpAction(
  _prevState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  if (!isSupabaseConfigured()) {
    return { status: "error", message: SETUP_MESSAGE };
  }

  const parsed = registerSchema.safeParse({
    fullName: formData.get("fullName"),
    email: formData.get("email"),
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
  });

  if (!parsed.success) {
    return {
      status: "error",
      message: "Periksa kembali data yang kamu masukkan.",
      fieldErrors: zodFieldErrors(parsed.error),
    };
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      data: { full_name: parsed.data.fullName },
      emailRedirectTo: `${getAppUrl()}/auth/callback?next=/dashboard`,
    },
  });

  if (error) {
    return { status: "error", message: translateAuthError(error.message) };
  }

  // If email confirmation is disabled Supabase returns a session immediately.
  if (data.session) {
    revalidatePath("/", "layout");
    redirect("/dashboard");
  }

  return {
    status: "verify-email",
    message: `Kami mengirim tautan verifikasi ke ${parsed.data.email}. Buka tautan tersebut untuk mengaktifkan akun, lalu masuk.`,
  };
}

export async function signOutAction(): Promise<void> {
  if (isSupabaseConfigured()) {
    try {
      const supabase = await createSupabaseServerClient();
      await supabase.auth.signOut();
    } catch {
      // Ignore network errors; clearing the local cookies still signs the user out.
    }
  }
  revalidatePath("/", "layout");
  redirect("/");
}

export async function requestPasswordResetAction(
  _prevState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  if (!isSupabaseConfigured()) {
    return { status: "error", message: SETUP_MESSAGE };
  }

  const parsed = forgotPasswordSchema.safeParse({ email: formData.get("email") });
  if (!parsed.success) {
    return {
      status: "error",
      message: "Periksa email yang kamu masukkan.",
      fieldErrors: zodFieldErrors(parsed.error),
    };
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.resetPasswordForEmail(parsed.data.email, {
    redirectTo: `${getAppUrl()}/auth/callback?type=recovery&next=/reset-password`,
  });

  if (error && !error.message.toLowerCase().includes("rate limit")) {
    return { status: "error", message: translateAuthError(error.message) };
  }

  // Always report success to avoid revealing whether an email is registered.
  return {
    status: "success",
    message:
      "Jika email tersebut terdaftar, kami mengirim tautan reset password. Periksa inbox dan folder spam.",
  };
}

export async function resetPasswordAction(
  _prevState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  if (!isSupabaseConfigured()) {
    return { status: "error", message: SETUP_MESSAGE };
  }

  const parsed = resetPasswordSchema.safeParse({
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
  });

  if (!parsed.success) {
    return {
      status: "error",
      message: "Periksa kembali data yang kamu masukkan.",
      fieldErrors: zodFieldErrors(parsed.error),
    };
  }

  const supabase = await createSupabaseServerClient();
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData.user) {
    return {
      status: "error",
      message:
        "Tautan reset password tidak valid atau sudah kedaluwarsa. Ajukan tautan baru dari halaman lupa password.",
    };
  }

  const { error } = await supabase.auth.updateUser({ password: parsed.data.password });
  if (error) {
    return { status: "error", message: translateAuthError(error.message) };
  }

  await supabase.auth.signOut({ scope: "others" }).catch(() => undefined);
  return {
    status: "success",
    message: "Password berhasil diperbarui. Kamu akan diarahkan ke dashboard.",
  };
}
