// features/projects/api/useProjects.ts
// React Query hooks for project data
// useQuery for reading, useMutation for writing

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getProjects,
  getProjectDetail,
  createProject,
  updateProject,
  deleteProject,
  addProjectMember,
  type CreateProjectRequest,
  type UpdateProjectRequest,
  type AddMemberRequest,
} from "./projectsApi";

// Cache key for project list - React Query uses this for caching + invalidation
const PROJECTS_QUERY_KEY = ["projects"];

// Hook to fetch all projects
export function useProjectsQuery() {
  return useQuery({
    queryKey: PROJECTS_QUERY_KEY,
    queryFn: getProjects,
  });
}

// Hook to fetch a single project's detail
export function useProjectDetailQuery(id: number) {
  return useQuery({
    queryKey: ["projects", id],
    queryFn: () => getProjectDetail(id),
    enabled: id > 0,
  });
}

// Hook to create a new project
export function useCreateProjectMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (request: CreateProjectRequest) => createProject(request),
    onSuccess: () => {
      // Invalidate the projects query to trigger a refetch after successful creation
      queryClient.invalidateQueries({ queryKey: PROJECTS_QUERY_KEY });
    },
  });
}

// Hook to update a project
export function useUpdateProjectMutation(id: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (request: UpdateProjectRequest) => updateProject(id, request),
    onSuccess: () => {
      // Invalidate both the list and the detail cache
      queryClient.invalidateQueries({ queryKey: PROJECTS_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: ["projects", id] });
    },
  });
}

// Hook to delete a project (owner only)
export function useDeleteProjectMutation(id: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => deleteProject(id),
    onSuccess: () => {
      // Remove the detail cache and refresh the list
      queryClient.removeQueries({ queryKey: ["projects", id] });
      queryClient.invalidateQueries({ queryKey: PROJECTS_QUERY_KEY });
    },
  });
}

// Hook to add a member to a project
export function useAddMemberMutation(projectId: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (request: AddMemberRequest) =>
      addProjectMember(projectId, request),
    onSuccess: () => {
      // Refresh project detail (members list changed)
      queryClient.invalidateQueries({ queryKey: PROJECTS_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: ["projects", projectId] });
    },
  });
}
