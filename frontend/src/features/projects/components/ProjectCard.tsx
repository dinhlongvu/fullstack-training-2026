// features/projects/components/ProjectCard.tsx
// Displays a single project as a card
// Show name, description, and member count

import { useNavigate } from "react-router-dom";
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

    return (
        <Card
            className="cursor-pointer transition-shadow hover:shadow-md"
            onClick={() => navigate(`/projects/${project.id}`)}
        >
            <CardHeader>
                <CardTitle className="text-lg">{project.name}</CardTitle>
                <CardDescription className="line-clamp-2">
                    {project.description || "No description"}
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <Users className="h-4 w-4" />
                    <span>
                        {project.memberCount} {project.memberCount === 1 ? "member" : "members"}
                    </span>
                </div>
            </CardContent>
        </Card>
    );
}
