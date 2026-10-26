import type { Metadata } from "next";
import { Geist } from "next/font/google";
import { AuthProvider } from "@/components/auth";
import { Cabecalho } from "@/components/cabecalho";
import { AvisosProvider } from "@/components/toast";
import "./globals.css";

const geist = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Moeda Estudantil",
    template: "%s · Moeda Estudantil",
  },
  description:
    "Sistema de reconhecimento do mérito estudantil por meio de uma moeda virtual.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="pt-BR" className={`${geist.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col bg-slate-50 text-slate-900">
        <AvisosProvider>
          <AuthProvider>
            <Cabecalho />
            <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col px-4 py-8">
              {children}
            </main>
          </AuthProvider>
        </AvisosProvider>
      </body>
    </html>
  );
}
