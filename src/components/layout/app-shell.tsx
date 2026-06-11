import { SidebarNav } from "@/components/layout/sidebar-nav";

type AppShellProps = {
  children: React.ReactNode;
};

export function AppShell({ children }: AppShellProps) {
  return (
    <div className="min-h-dvh bg-slate-50">
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 px-4 py-3 backdrop-blur lg:hidden">
        <p className="text-sm font-semibold text-slate-950">AI 知识任务工作台</p>
      </header>

      <div className="grid min-h-dvh w-full lg:grid-cols-[17rem_minmax(0,1fr)]">
        <aside className="sticky top-0 hidden h-dvh border-r border-slate-200 bg-white lg:block">
          <SidebarNav />
        </aside>

        <div className="min-w-0">
          <div className="sticky top-[2.875rem] z-20 border-b border-slate-200 bg-slate-50/95 px-3 py-3 backdrop-blur sm:px-4 lg:hidden">
            <SidebarNav compact />
          </div>

          <div className="mx-auto w-full max-w-[1600px] px-4 py-6 sm:px-6 lg:px-10 lg:py-12 2xl:px-14">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
