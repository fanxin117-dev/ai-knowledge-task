import { SidebarNav } from "@/components/layout/sidebar-nav";

type AppShellProps = {
  children: React.ReactNode;
};

export function AppShell({ children }: AppShellProps) {
  return (
    <div className="min-h-screen">
      {/* 移动端保留紧凑品牌栏，确保小屏打开时先看到产品身份和当前实验阶段。 */}
      <header className="border-b-2 border-line bg-ink px-4 py-3 text-surface lg:hidden">
        <p className="font-[var(--font-mono)] text-xs uppercase">AI Knowledge Task Hub / MVP-01</p>
      </header>

      <div className="mx-auto flex w-full max-w-7xl gap-0 px-4 py-4 lg:gap-6 lg:px-6 lg:py-6">
        <aside className="hidden w-64 shrink-0 lg:block">
          <SidebarNav />
        </aside>

        <div className="min-w-0 flex-1">
          {/* 移动端把导航放在内容上方，减少第一阶段的交互复杂度。 */}
          <div className="mb-4 lg:hidden">
            <SidebarNav compact />
          </div>

          <div className="relative overflow-hidden rounded-lg border-2 border-line bg-surface p-5 shadow-panel md:p-8">
            {/* 右上角状态条是全局视觉锚点，强调这是一个仍处在实验阶段的工作台。 */}
            <div className="pointer-events-none absolute right-0 top-0 h-2 w-40 bg-accent" />
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
