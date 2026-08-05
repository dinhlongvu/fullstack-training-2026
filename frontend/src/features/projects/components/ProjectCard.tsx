// features/projects/components/ProjectCard.tsx
// Displays a single project as a card
// Show name, description, and member count

import { Link, useNavigate } from "react-router-dom";
import { Users } from "lucide-react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/Card";
import { type Project } from "../api/projectsApi";


interface ProjectCardProps {
  project: Project;
}

export function ProjectCard({ project }: ProjectCardProps) {
  const navigate = useNavigate();
  const to = `/projects/${project.id}`;

  return (
    <Card
      className="cursor-pointer transition-shadow hover:shadow-md overflow-hidden"
      onClick={() => navigate(to)}
    >
      <CardHeader className="min-w-0">
        <CardTitle className="text-lg" title={project.name}>
          {/* The keyboard path in; the card's onClick stays a mouse shortcut.
              truncate sits on the link, not the title, so its focus ring is
              not clipped by the title's own overflow. */}
          <Link
            to={to}
            onClick={(e) => e.stopPropagation()}
            className="block truncate rounded-sm hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            {project.name}
          </Link>
        </CardTitle>
        <CardDescription className="line-clamp-2 break-words" title={project.description || ""}>
          {project.description || "No description"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-1 text-sm text-muted-foreground">
          <Users className="h-4 w-4" aria-hidden="true" />
          <span>
            {project.memberCount} {project.memberCount === 1 ? "member" : "members"}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
