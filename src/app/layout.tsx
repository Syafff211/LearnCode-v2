import type { Metadata, Viewport } from "next";
import { cookies } from "next/headers";

import "@fontsource-variable/inter";
import "@fontsource-variable/fraunces";
import "@fontsource-variable/jetbrains-mono";
import "./globals.css";

import { AppToaster } from "@/components/app-toaster";
import { ThemeProvider, type ThemePreference } from "@/components/theme-provider";
import { getPlatformSettings } from "@/lib/platform";

const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

export async function generateMetadata(): Promise<Metadata> {
  const platform = await getPlatformSettings();
  const name = platform.platformName;
  const description =
    platform.shortDescription ||
    "Belajar HTML, CSS, dan JavaScript melalui materi praktik, playground kode, quiz, dan AI Tutor.";
  return {
    metadataBase: new URL(appUrl),
    title: {
      default: `${name} — Learn by doing. Understand with AI.`,
      template: `%s · ${name}`,
    },
    description,
    applicationName: name,
    authors: [{ name }],
    openGraph: {
      title: `${name} — Belajar coding dengan membangun sesuatu`,
      description,
      type: "website",
      locale: "id_ID",
      siteName: name,
    },
    ...(platform.faviconUrl ? { icons: { icon: [{ url: platform.faviconUrl }] } } : {}),
  };
}

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#faf9f5" },
    { media: "(prefers-color-scheme: dark)", color: "#121310" },
  ],
  width: "device-width",
  initialScale: 1,
};

const themeScript = `
(function () {
  try {
    var key = "learncode-theme";
    var match = document.cookie.match(/(?:^|; )learncode-theme=([^;]+)/);
    var stored = match ? decodeURIComponent(match[1]) : window.localStorage.getItem(key);
    var theme = (stored === "light" || stored === "dark" || stored === "system") ? stored : "system";
    var isDark = theme === "dark" || (theme === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);
    document.documentElement.classList.toggle("dark", isDark);
    document.documentElement.dataset.theme = theme;
  } catch (error) {}
})();
`;

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies();
  const cookieTheme = cookieStore.get("learncode-theme")?.value;
  const initialTheme: ThemePreference =
    cookieTheme === "light" || cookieTheme === "dark" || cookieTheme === "system"
      ? cookieTheme
      : "system";

  return (
    <html
      lang="id"
      className={initialTheme === "dark" ? "dark" : undefined}
      data-theme={initialTheme}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="min-h-dvh bg-canvas text-ink antialiased">
        <ThemeProvider initialTheme={initialTheme}>
          <a href="#main-content" className="skip-link">
            Lewati ke konten utama
          </a>
          {children}
          <AppToaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
