import { test, expect } from "@playwright/test";
import { API_BASE, uniqueEmail, registerAndLogin, createProjectViaApi, createTaskViaApi, addMemberViaApi, createCommentViaApi, updateTaskStatusViaApi } from "./utils/api-helpers";

test.describe("Full E2E User Journey", () => {
  test("TC-JOURNEY-001: Complete User Flow (Register → Login → Create Project → Add Member → Create Task → Update Status → Comment → Check Dashboard)", async ({ page, request }) => {
    // 1. Register & Login User A (Owner)
    const ownerEmail = uniqueEmail("journey_owner");
    const ownerPassword = "Password@123";
    const ownerName = "Journey Owner";

    await page.goto("/register");
    await page.fill('input[name="fullName"]', ownerName);
    await page.fill('input[name="email"]', ownerEmail);
    await page.fill('input[name="password"]', ownerPassword);
    await page.click('button[type="submit"]');

    await expect(page).toHaveURL("/login");

    // Login via UI
    await page.fill('input[name="email"]', ownerEmail);
    await page.fill('input[name="password"]', ownerPassword);
    await page.click('button[type="submit"]');

    await expect(page).toHaveURL("/projects");

    // Wait for the token to be saved
    let token = "";
    await expect.poll(async () => {
      token = await page.evaluate(() => localStorage.getItem("taskboard_token") || "");
      return token;
    }).toBeTruthy();

    // 2. Register Member User B via API for fast setup
    const memberUser = await registerAndLogin(request, { fullName: "Journey Member" });

    // 3. Create Project via UI or API and add member
    const projRes = await request.post(`${API_BASE}/api/projects`, {
      headers: { Authorization: `Bearer ${token}` },
      data: { name: "Full Journey Project", description: "Project for E2E user journey testing" },
    });
    expect(projRes.status()).toBe(201);
    const project = await projRes.json();

    // Add member
    await addMemberViaApi(request, token, project.id, memberUser.email);

    // 4. Create Task
    const task1 = await createTaskViaApi(request, token, project.id, {
      title: "Journey Task 1",
      description: "First task in journey",
      priority: "High"
    });

    // 5. Move Task Status (Todo → InProgress)
    const statusRes = await updateTaskStatusViaApi(request, token, task1.id, "InProgress");
    expect(statusRes.status).toBe(200);

    // 6. Comment on Task
    const comment = await createCommentViaApi(request, token, task1.id, "Task is progressing well!");
    expect(comment.content).toBe("Task is progressing well!");

    // 7. Check Dashboard via UI
    await page.goto("/dashboard");
    await expect(page.locator("body")).toBeVisible();
    await expect(page.getByText("Full Journey Project").or(page.getByText("Dashboard")).first()).toBeVisible();
  });
});
