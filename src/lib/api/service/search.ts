import { listNotes } from "@/lib/api/service/notes";
import { listProjects } from "@/lib/api/service/projects";
import { listTags } from "@/lib/api/service/tags";
import { listTasks } from "@/lib/api/service/tasks";

export async function searchKnowledge(input: { query?: string }) {
  const query = input.query?.trim() ?? "";

  if (!query) {
    return {
      query,
      notes: [],
      tasks: [],
      projects: [],
      tags: [],
      totalCount: 0,
    };
  }

  const [notes, tasks, projects, tags] = await Promise.all([
    listNotes({ query }),
    listTasks({ query }),
    listProjects({ visibility: "all" }),
    listTags(),
  ]);

  const lowerQuery = query.toLowerCase();
  const matchedProjects = projects.filter((project) => {
    return project.name.toLowerCase().includes(lowerQuery) || project.description?.toLowerCase().includes(lowerQuery);
  });
  const matchedTags = tags.filter((tag) => tag.name.toLowerCase().includes(lowerQuery));

  return {
    query,
    notes,
    tasks,
    projects: matchedProjects,
    tags: matchedTags,
    totalCount: notes.length + tasks.length + matchedProjects.length + matchedTags.length,
  };
}
