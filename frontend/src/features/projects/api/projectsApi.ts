// features/projects/api/projectsApi.ts
// API funtions for project management
// All calls go through the shared apiClient

import { apiClient } from "@/lib/api";

// Shape of a project returned by GET /api/projects 
export interface Project {
    id: number;
    name: string;
    description: string;
    createdAt: string;
    memberCount: number;
}

// Shape of a project returned by POST /api/projects 
export interface ProjectDetails {
    id: number;
    name: string;
    description: string;
    createdAt: string;
    createdById: number;
}

// Shape of the request body for POST /api/projects
export interface CreateProjectRequest {
    name: string;
    description: string;
}

// Shape of the request body for PUT /api/projects/{id}
export interface UpdateProjectRequest {
    name: string;
    description: string;
}

// Shape of the request body for POST /api/projects/{id}/members
export interface AddMemberRequest {
    email: string;
}

// Shape of a member within the project detail response
export interface ProjectMember {
    userId: number;
    email: string;
    fullName: string;
    joinedAt: string;
}

// Shape of a response from GET /api/projects/{id}
export interface ProjectDetailResponse {
    id: number;
    name: string;
    description: string;
    createdAt: string;
    createdById: number;
    members: ProjectMember[];
}


// Fetch all projects the current user belong to
export function getProjects() {
    return apiClient<Project[]>("/api/projects");
}

// Create a new project
export function createProject(request: CreateProjectRequest) {
    return apiClient<ProjectDetails>("/api/projects", {
        method: "POST",
        body: JSON.stringify(request),
    });
}

// Fetch a single project's detail with members list
export function getProjectDetail(id: number) {
    return apiClient<ProjectDetailResponse>(`/api/projects/${id}`);
}

// Update project (owner only)
export function updateProject(id: number, request: UpdateProjectRequest) {
    return apiClient<ProjectDetails>(`/api/projects/${id}`, {
        method: "PUT",
        body: JSON.stringify(request),
    });
}

// Delete project (owner only)
export function deleteProject(id: number) {
    return apiClient(`/api/projects/${id}`, {
        method: "DELETE",
    });
}

// Add a member to a project by email
export function addProjectMember(projectId: number, request: AddMemberRequest) {
    return apiClient<void>(`/api/projects/${projectId}/members`, {
        method: "POST",
        body: JSON.stringify(request),
    });
}
