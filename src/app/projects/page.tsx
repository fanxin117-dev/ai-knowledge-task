import Link from "next/link";
import { ProjectCard } from "@/components/projects/project-card";
import { EmptyState } from "@/components/ui/empty-state";
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
  const visibleProjects = projects.filter((project) => project.id !== "project-inbox" || project.taskCount > 0);
  const filterLinks = [
    { href: "/projects", label: "活跃项目", active: view === "active" },
    { href: "/projects?view=archived", label: "已归档", active: view === "archived" },
    { href: "/projects?view=all", label: "全部", active: view === "all" },
  ];

  return (
    <main className="space-y-6">
      <PageHeader
        eyebrow="项目"
        title="项目"
        description="项目是任务的上层归属，一个具体项目下可以管理一组任务。"
        actions={
          <Link
            href="/projects/new"
            className="inline-flex min-h-11 items-center rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-slate-950"
          >
            新建项目
          </Link>
        }
      />

      <section className="grid gap-5 xl:grid-cols-[16rem_minmax(0,1fr)]">
        <aside className="xl:sticky xl:top-8 xl:self-start">
          <nav className="grid gap-2 rounded-lg border border-slate-200 bg-white p-3 shadow-sm" aria-label="项目状态筛选">
            {filterLinks.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                aria-current={item.active ? "page" : undefined}
                className={[
                  "inline-flex min-h-11 items-center rounded-md px-3 py-2 text-sm font-medium",
                  item.active ? "bg-blue-50 text-blue-700" : "text-slate-500 hover:bg-slate-50 hover:text-slate-950",
                ].join(" ")}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </aside>

        {visibleProjects.length > 0 ? (
          <section className="grid min-w-0 gap-3 lg:grid-cols-2 2xl:grid-cols-3" aria-label="项目列表">
            {visibleProjects.map((project) => (
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
      </section>
    </main>
  );
}
