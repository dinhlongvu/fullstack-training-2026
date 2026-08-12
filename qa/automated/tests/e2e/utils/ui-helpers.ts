import { expect, type Page, type APIRequestContext } from "@playwright/test";
import { API_BASE, type RegisteredUser, uniqueEmail } from "./api-helpers";

export interface TestUser {
  email: string;
  fullName: string;
  password: string;
}

export function getTestUser(): TestUser {
  return {
    email: uniqueEmail("ui_test"),
    fullName: "UI Test User",
    password: "Test@1234",
  };
}

export async function clearBrowserAuthState(page: Page) {
  await page.goto("/");
  await page.evaluate(() => {
    localStorage.clear();
  });
}

export async function fillRegisterForm(page: Page, user: Partial<TestUser>) {
  if (user.fullName !== undefined) {
    await page.getByLabel(/Full Name/i).fill(user.fullName);
  }
  if (user.email !== undefined) {
    await page.getByLabel(/Email/i).fill(user.email);
  }
  if (user.password !== undefined) {
    await page.getByLabel(/^Password/i).fill(user.password);
  }
}

export async function fillLoginForm(page: Page, email: string, password: string) {
  await page.getByLabel(/Email/i).fill(email);
  await page.getByLabel(/Password/i).fill(password);
}

export async function submitForm(page: Page) {
  await page.locator('button[type="submit"]').click();
}

export async function expectMessageVisible(page: Page, message: string | RegExp) {
  await expect(page.getByText(message).first()).toBeVisible();
}

export async function expectEmailInputInvalid(page: Page, selector: string) {
  const isInvalid = await page.locator(selector).evaluate(
    (el: HTMLInputElement) => !el.validity.valid,
  );
  expect(isInvalid, `Expected ${selector} to be invalid`).toBe(true);
}

export function trackApiCalls(page: Page, apiPath: RegExp) {
  const calls: string[] = [];

  page.on("request", (request) => {
    const method = request.method();
    const url = request.url();
    const isFetchOrXhr =
      request.resourceType() === "fetch" || request.resourceType() === "xhr";

    if (isFetchOrXhr && method !== "GET" && apiPath.test(url)) {
      calls.push(`${method} ${url}`);
    }
  });

  return calls;
}

export async function expectNoApiCall(page: Page, calls: string[], label: string) {
  await page.waitForTimeout(300);
  expect(
    calls,
    `Expected no ${label} API call, but got: ${calls.join(", ")}`,
  ).toHaveLength(0);
}

export async function registerUser(page: Page, user: TestUser) {
  await page.goto("/register");
  await fillRegisterForm(page, user);
  await submitForm(page);

  await expectMessageVisible(page, /Account created successfully/i);
  await expect(page).toHaveURL(/\/login/);
}

export async function loginUser(page: Page, email: string, password: string) {
  await page.goto("/login");
  await fillLoginForm(page, email, password);
  await submitForm(page);

  await expect(page).toHaveURL(/\/projects/);
}

export async function getPersistedToken(page: Page) {
  return page.evaluate(() => {
    const token = localStorage.getItem("taskboard_token");
    if (token && token.length > 0) return token;
    return null;
  });
}

// Additional helpers used in project UI
export async function registerViaApi(request: APIRequestContext): Promise<TestUser> {
  const user = getTestUser();
  const res = await request.post(`${API_BASE}/api/auth/register`, {
    data: user,
  });
  expect(res.status()).toBe(201);
  return user;
}

export async function loginViaUI(page: Page, email: string, password: string) {
  await page.goto("/login");
  await page.getByLabel(/Email/i).fill(email);
  await page.getByLabel(/Password/i).fill(password);
  await submitForm(page);
  await expect(page).toHaveURL(/\/projects/);
}

export async function registerAndLoginViaUI(
  page: Page,
  request?: APIRequestContext,
): Promise<TestUser> {
  let user: TestUser;
  if (request) {
    user = await registerViaApi(request);
  } else {
    user = getTestUser();
    await registerUser(page, user);
  }
  await loginViaUI(page, user.email, user.password);
  return user;
}

export async function createProjectViaDialog(
  page: Page,
  name: string,
  description: string = "",
) {
  await page.getByRole("button", { name: /Create Project/i }).first().click();
  await expect(page.getByRole("dialog")).toBeVisible();
  
  await page.getByLabel(/^Name$/i).fill(name);
  if (description) {
    await page.getByLabel(/Description/i).fill(description);
  }
  
  await page.getByRole("dialog").getByRole("button", { name: /Create/i }).click();
}
export async function createProjectViaUIContext(page: import('@playwright/test').Page, name: string, description: string = "") {
  const token = await getPersistedToken(page);
  const res = await page.request.post(`http://localhost:5000/api/projects`, {
    headers: { Authorization: `Bearer ${token}` },
    data: { name, description },
  });
  expect(res.status()).toBe(201);
  return res.json();
}
