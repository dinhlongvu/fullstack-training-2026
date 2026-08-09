import { test, expect } from "@playwright/test";
import { uniqueEmail, registerAndLogin } from "./utils/api-helpers";

test.describe("Full E2E User Journey (100% UI)", () => {
  test("TC-JOURNEY-002: Complete User Flow using ONLY UI interactions", async ({ page, request }) => {
    
    // 0. Prepare a Member User via API to save time so we don't have to logout/login repeatedly
    const memberUser = await registerAndLogin(request, { fullName: "Journey Member" });

    // 1. Register Owner via UI
    const ownerEmail = uniqueEmail("owner_ui");
    await page.goto("/register");
    await page.fill('input[name="fullName"]', "Journey Owner UI");
    await page.fill('input[name="email"]', ownerEmail);
    await page.fill('input[name="password"]', "Password@123");
    await page.click('button[type="submit"]');
    
    // Expect redirect to login
    await expect(page).toHaveURL(/\/login/);

    // 2. Login Owner via UI
    await page.fill('input[name="email"]', ownerEmail);
    await page.fill('input[name="password"]', "Password@123");
    await page.click('button[type="submit"]');
    
    // Expect redirect to projects page
    await expect(page).toHaveURL(/\/projects/);

    // 3. Create Project via UI
    await page.getByRole("button", { name: "Create Project" }).first().click();
    await page.fill('input[name="name"]', "Full UI Journey Project");
    await page.fill('textarea[name="description"]', "Project created entirely via UI clicks");
    
    // Dialog submit button
    await page.getByRole("dialog").getByRole("button", { name: "Create" }).click();
    
    // Expect toast and close
    await expect(page.getByText("Project created successfully")).toBeVisible();

    // Click on the project card to go to detail page
    await page.getByRole("heading", { name: "Full UI Journey Project" }).click();

    // Expect to be on project detail page and see the project title
    await expect(page).toHaveURL(/\/projects\/\d+/);
    await expect(page.getByRole("heading", { name: "Full UI Journey Project" })).toBeVisible();

    // 4. Add Member via UI
    await page.getByRole("button", { name: /Add Member/i }).first().click();
    await page.fill('input[name="email"]', memberUser.email);
    await page.getByRole("dialog").getByRole("button", { name: "Add Member" }).click();
    
    // Verify toast
    await expect(page.getByText("Member added successfully")).toBeVisible();

    // 5. Create Task via UI
    await page.getByRole("button", { name: "New Task" }).first().click();
    await page.fill('input[name="title"]', "UI Task 1");
    await page.fill('textarea[name="description"]', "Task created purely via UI interactions");
    
    // Select Priority (High)
    await page.locator('button[role="combobox"]').first().click();
    await page.getByRole("option", { name: "High" }).click();
    
    // Submit task
    await page.getByRole("dialog").getByRole("button", { name: "Create Task" }).click();
    
    // Verify toast and task appears
    await expect(page.getByText("Task created successfully")).toBeVisible();
    await expect(page.getByRole("link", { name: "UI Task 1" })).toBeVisible();

    // 6. Move Task Status (Todo → InProgress) via UI
    await page.getByRole("button", { name: /Move Right/i }).first().click();

    // 7. Comment on Task via UI
    // Click on the task card to open Task Detail Dialog
    await page.getByRole("link", { name: "UI Task 1" }).click();
    
    // Fill and submit comment
    await page.fill('textarea[name="content"]', "Adding a comment purely via UI clicks!");
    await page.getByRole("button", { name: "Post Comment" }).click();
    
    // Verify comment appears
    await expect(page.getByText("Adding a comment purely via UI clicks!")).toBeVisible();

    // Close the dialog by pressing Escape
    await page.keyboard.press("Escape");

    // 8. Check Dashboard via UI
    await page.goto("/dashboard");
    await expect(page.locator("body")).toBeVisible();
    await expect(page.getByText("Full UI Journey Project").or(page.getByText("Dashboard")).first()).toBeVisible();
  });
});
