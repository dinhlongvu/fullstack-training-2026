// features/projects/api/projectsApi.ts
// API funtions for project management
// All calls go through the shared apiClient

import { apiClient } from "@/lib/api";

// Shape of a project returned by GET /api/projects
export interface Project {
    id: string;
    name: string;
    description: string;
    createdAt: string;
    memberCount: number;
}

// Shape of the request body for POST /api/projects
export interface CreateProjectRequest {
    name: string;
    description: string;
}

// Fetch all projects the current user belong to
export function getProjects() {
    return apiClient<Project[]>("/api/projects");
}

// Create a new project
export function createProject(request: CreateProjectRequest) {
    return apiClient<Project>("/api/projects", {
        method: "POST",
        body: JSON.stringify(request),
    });
}
