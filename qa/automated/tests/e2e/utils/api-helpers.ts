import { expect, type APIRequestContext } from "@playwright/test";

export const API_BASE = "http://localhost:5000";

export interface RegisteredUser {
  id: number;
  email: string;
  fullName: string;
  password: string;
  token: string;
}

export interface TaskDto {
  id: number;
  projectId: number;
  title: string;
  description: string;
  status: string;
  priority: string;
  dueDate: string | null;
  assigneeId: number | null;
  assigneeName: string | null;
  commentCount: number;
  createdAt: string;
  updatedAt: string | null;
}

export interface CommentDto {
  id: number;
  taskId: number;
  authorId: number;
  authorName: string;
  content: string;
  createdAt: string;
  updatedAt: string | null;
}

export interface ProjectDto {
  id: number;
  name: string;
  description: string;
  memberCount: number;
  createdById: number;
  members: any[];
  createdAt: string;
  updatedAt: string | null;
}

export function uniqueEmail(prefix: string = "test"): string {
  return `${prefix}_${Date.now()}_${Math.floor(Math.random() * 100000)}@example.com`;
}

export async function registerAndLogin(
  request: APIRequestContext,
  overrides?: { email?: string; fullName?: string; password?: string },
): Promise<RegisteredUser> {
  const email = overrides?.email ?? uniqueEmail();
  const fullName = overrides?.fullName ?? "Test User";
  const password = overrides?.password ?? "Test@1234";

  const registerRes = await request.post(`${API_BASE}/api/auth/register`, {
    data: { email, fullName, password },
  });
  if (registerRes.status() !== 201) {
    const errorBody = await registerRes.text();
    throw new Error(`Register failed for ${email}: ${registerRes.status()} ${errorBody}`);
  }
  const registerBody = await registerRes.json();

  const loginRes = await request.post(`${API_BASE}/api/auth/login`, {
    data: { email, password },
  });
  if (loginRes.status() !== 200) {
    const errorBody = await loginRes.text();
    throw new Error(`Login failed for ${email}: ${loginRes.status()} ${errorBody}`);
  }
  const loginBody = await loginRes.json();

  return {
    id: registerBody.id ?? loginBody.user?.id,
    email,
    fullName,
    password,
    token: loginBody.token,
  };
}

export async function createProjectViaApi(
  request: APIRequestContext,
  token: string,
  data: { name: string; description?: string },
): Promise<ProjectDto> {
  const res = await request.post(`${API_BASE}/api/projects`, {
    headers: { Authorization: `Bearer ${token}` },
    data: { name: data.name, description: data.description ?? "" },
  });
  if (res.status() !== 201) {
    const errorBody = await res.text();
    throw new Error(`Create project failed: ${res.status()} ${errorBody}`);
  }
  return res.json();
}

export async function createTaskViaApi(
  request: APIRequestContext,
  token: string,
  projectId: number,
  title: string | { title: string; description?: string; priority?: string; assigneeId?: number; dueDate?: string; status?: string }
): Promise<TaskDto> {
  const data = typeof title === "string"
    ? { title, description: "", priority: "Low" }
    : { description: "", priority: "Low", ...title };
  const res = await request.post(
    `${API_BASE}/api/projects/${projectId}/tasks`,
    {
      headers: { Authorization: `Bearer ${token}` },
      data,
    },
  );
  if (res.status() !== 201) {
    const errorBody = await res.text();
    throw new Error(`Create task failed: ${res.status()} ${errorBody}`);
  }
  return res.json();
}

export async function addMemberViaApi(
  request: APIRequestContext,
  ownerToken: string,
  projectId: number,
  memberEmail: string,
): Promise<void> {
  const res = await request.post(
    `${API_BASE}/api/projects/${projectId}/members`,
    {
      headers: { Authorization: `Bearer ${ownerToken}` },
      data: { email: memberEmail },
    },
  );
  if (res.status() !== 201) {
    const errorBody = await res.text();
    throw new Error(`Add member failed: ${memberEmail}: ${res.status()} ${errorBody}`);
  }
}

export async function getProjectDetailViaApi(
  request: APIRequestContext,
  token: string,
  projectId: number,
): Promise<{ status: number; body?: ProjectDto }> {
  const res = await request.get(`${API_BASE}/api/projects/${projectId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  let body;
  try {
    body = await res.json();
  } catch (e) {
    // some responses might not have JSON body if not 200
  }

  return { status: res.status(), body };
}

export async function getProjectsViaApi(
  request: APIRequestContext,
  token: string,
): Promise<ProjectDto[]> {
  const res = await request.get(`${API_BASE}/api/projects`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (res.status() !== 200) {
    const errorBody = await res.text();
    throw new Error(`Get projects failed: ${res.status()} ${errorBody}`);
  }
  return res.json();
}

export function futureDateISO(daysFromNow = 30): string {
  const d = new Date();
  d.setDate(d.getDate() + daysFromNow);
  return d.toISOString();
}

export async function updateTaskViaApi(
  request: APIRequestContext,
  token: string,
  taskId: number,
  data: { title: string; description?: string; priority?: string | number; dueDate?: string | null }
): Promise<{ status: number; body?: any }> {
  const res = await request.put(`${API_BASE}/api/tasks/${taskId}`, {
    headers: { Authorization: `Bearer ${token}` },
    data,
  });
  let body;
  try { body = await res.json(); } catch (e) { }
  return { status: res.status(), body };
}

export async function updateTaskStatusViaApi(
  request: APIRequestContext,
  token: string,
  taskId: number,
  status: string
): Promise<{ status: number; body?: any }> {
  const res = await request.patch(`${API_BASE}/api/tasks/${taskId}/status`, {
    headers: { Authorization: `Bearer ${token}` },
    data: { status },
  });
  let body;
  try { body = await res.json(); } catch (e) { }
  return { status: res.status(), body };
}

export async function assignTaskViaApi(
  request: APIRequestContext,
  token: string,
  taskId: number,
  assigneeId: number | null
): Promise<{ status: number; body?: any }> {
  const res = await request.patch(`${API_BASE}/api/tasks/${taskId}/assign`, {
    headers: { Authorization: `Bearer ${token}` },
    data: { assigneeId },
  });
  let body;
  try { body = await res.json(); } catch (e) { }
  return { status: res.status(), body };
}

export async function createCommentViaApi(
  request: APIRequestContext,
  token: string,
  taskId: number,
  content: string
): Promise<CommentDto> {
  const res = await request.post(`${API_BASE}/api/tasks/${taskId}/comments`, {
    headers: { Authorization: `Bearer ${token}` },
    data: { content },
  });
  if (res.status() !== 201) {
    const errorBody = await res.text();
    throw new Error(`Create comment failed: ${res.status()} ${errorBody}`);
  }
  return res.json();
}

export async function updateCommentViaApi(
  request: APIRequestContext,
  token: string,
  taskId: number,
  commentId: number,
  content: string
): Promise<{ status: number; body?: any }> {
  const res = await request.put(`${API_BASE}/api/tasks/${taskId}/comments/${commentId}`, {
    headers: { Authorization: `Bearer ${token}` },
    data: { content },
  });
  let body;
  try { body = await res.json(); } catch (e) { }
  return { status: res.status(), body };
}

export async function deleteCommentViaApi(
  request: APIRequestContext,
  token: string,
  taskId: number,
  commentId: number
): Promise<{ status: number; body?: any }> {
  const res = await request.delete(`${API_BASE}/api/tasks/${taskId}/comments/${commentId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  let body;
  try { body = await res.json(); } catch (e) { }
  return { status: res.status(), body };
}
