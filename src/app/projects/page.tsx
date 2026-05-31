import Link from "next/link";
import { ProjectCard } from "@/components/projects/project-card";
import { EmptyState } from "@/components/ui/empty-state";
import { ModulePanel } from "@/components/ui/module-panel";
import { PageHeader } from "@/components/ui/page-header";
import { listProjects } from "@/lib/api/services";

export const dynamic = "force-dynamic";

type ProjectsPageProps = {
  searchParams?: Promise<{
    view?: string;
  }>;
};

export default async function ProjectsPage({ searchParams }: ProjectsPageProps) {
  const params = await searchParams;
  const view = params?.view === "archived" || params?.view === "all" ? params.view : "active";
  const projects = await listProjects({ visibility: view });
  const filterLinks = [
    { href: "/projects", label: "活跃项目", active: view === "active" },
    { href: "/projects?view=archived", label: "已归档", active: view === "archived" },
    { href: "/projects?view=all", label: "全部", active: view === "all" },
  ];

  return (
    <main className="space-y-6">
      <PageHeader
        eyebrow="Projects"
        title="项目"
        description="项目是任务的上层归属，一个具体项目下可以管理一组任务。"
      />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <nav className="flex flex-wrap gap-2" aria-label="项目状态筛选">
          {filterLinks.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={[
                "rounded-md border-2 border-line px-3 py-2 text-sm font-black shadow-panel",
                item.active ? "bg-ink text-surface" : "bg-paper text-ink",
              ].join(" ")}
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <Link
          href="/projects/new"
          className="inline-flex rounded-md border-2 border-line bg-ink px-4 py-2 text-sm font-black text-surface shadow-panel"
        >
          新建项目
        </Link>
      </div>

      <ModulePanel
        code="PROJECT-SPEC"
        title="项目管理原则"
        items={[
          "任务必须属于一个项目，默认项目是收件箱。",
          "AI 行动项转任务时会创建或复用项目，避免全局任务列表失控。",
          "项目结束后先归档，历史任务仍可查看，列表默认只显示活跃项目。",
        ]}
      />

      {projects.length > 0 ? (
        <section className="grid gap-4 lg:grid-cols-2" aria-label="项目列表">
          {projects.map((project) => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </section>
      ) : (
        <EmptyState
          title="还没有项目"
          description="创建一个项目后，再把任务归属到它下面。"
          actionLabel="新建项目"
          actionHref="/projects/new"
        />
      )}
    </main>
  );
}
