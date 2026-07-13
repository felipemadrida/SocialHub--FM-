import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { AuthSessionProvider } from "@/components/providers/session-provider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "SocialHub -FM- - Marketing Hub + IA Studio",
  description:
    "Gestión de redes, campañas de marketing y generación de contenido e imágenes con IA",
  keywords: [
    "redes sociales",
    "social media",
    "automatización",
    "Facebook",
    "Instagram",
    "TikTok",
    "X",
    "Twitter",
  ],
  authors: [{ name: "SocialHub -FM-" }],
  icons: {
    icon: [{ url: "/favicon.png", type: "image/png" }],
    apple: "/brand/socialhub_logo.png",
  },
  openGraph: {
    title: "SocialHub -FM-",
    description: "Marketing Hub + IA Studio",
    images: ["/brand/socialhub_banner.png"],
  },
};

const themeInitScript = `
(function(){
  try {
    var t = localStorage.getItem('socialhub-theme');
    if (t !== 'light' && t !== 'dark') t = 'dark';
    var r = document.documentElement;
    if (t === 'dark') r.classList.add('dark');
    else r.classList.remove('dark');
    r.style.colorScheme = t;
  } catch (e) {}
})();
`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <AuthSessionProvider>
          {children}
          <Toaster />
        </AuthSessionProvider>
      </body>
    </html>
  );
}
