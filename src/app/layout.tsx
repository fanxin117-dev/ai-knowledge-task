import type { Metadata } from "next";
import "./globals.css";
import { AppShell } from "@/components/layout/app-shell";

export const metadata: Metadata = {
  title: "AI Knowledge Task Hub",
  description: "A learning project for AI-assisted knowledge and task workflows.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body>
        {/* AppShell 负责全局导航和页面容器，让每个页面只关注自己的业务内容。 */}
        <div className="paper-grain">
          <AppShell>{children}</AppShell>
        </div>
      </body>
    </html>
  );
}
