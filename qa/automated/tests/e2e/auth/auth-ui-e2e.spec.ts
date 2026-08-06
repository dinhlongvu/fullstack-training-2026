import { test, expect, type Page } from "@playwright/test";

type TestUser = {
  email: string;
  fullName: string;
  password: string;
};

const LOGIN_PAGE_URL = /\/login\/?(?:\?.*)?$/;
const REGISTER_PAGE_URL = /\/register\/?(?:\?.*)?$/;
const PROJECTS_PAGE_URL = /\/projects\/?(?:\?.*)?$/;

const AUTH_LOGIN_API = /\/api\/auth\/login\/?(?:\?.*)?$/;
const AUTH_REGISTER_API = /\/api\/auth\/register\/?(?:\?.*)?$/;

// --- Exact messages from the frontend Zod schemas and backend responses ---
const REGISTER_SUCCESS_TOAST = /Account created successfully/i;
// The apiClient intercepts 401 and throws Error("Unauthorized") before
// reading the backend body, so toast.error shows "Unauthorized".
const LOGIN_ERROR_TOAST = /Unauthorized/i;
const EMAIL_ERROR = /Please enter a valid email address/i;
const PASSWORD_ERROR = /Password must be at least 8 characters/i;
const FULL_NAME_ERROR = /Full name is required/i;
const LOADING_BUTTON_TEXT_LOGIN = /Signing In/i;
const LOADING_BUTTON_TEXT_REGISTER = /Creating account/i;

function getTestUser(): TestUser {
  return {
    email: `testui_${Date.now()}_${Math.floor(Math.random() * 10000)}@example.com`,
    fullName: "Test User UI",
    password: "Test@1234",
  };
}

async function clearBrowserAuthState(page: Page) {
  await page.goto("/");
  await page.evaluate(() => {
    localStorage.clear();
    sessionStorage.clear();
  });
}

async function fillRegisterForm(page: Page, user: Partial<TestUser>) {
  if (user.email !== undefined) {
    await page.fill('input[name="email"]', user.email);
  }

  if (user.fullName !== undefined) {
    await page.fill('input[name="fullName"]', user.fullName);
  }

  if (user.password !== undefined) {
    await page.fill('input[name="password"]', user.password);
  }
}

async function fillLoginForm(page: Page, email: string, password: string) {
  await page.fill('input[name="email"]', email);
  await page.fill('input[name="password"]', password);
}

async function submitForm(page: Page) {
  await page.locator('button[type="submit"]').click();
}

async function expectMessageVisible(page: Page, message: string | RegExp) {
  await expect(page.getByText(message).first()).toBeVisible();
}

// The register/login forms use <input type="email"> without noValidate,
// so the browser's native HTML5 validation fires a tooltip popup that
// is NOT a DOM element Playwright can find with getByText.
// Instead we verify the input's validity state via JavaScript.
async function expectEmailInputInvalid(page: Page, selector: string) {
  const isInvalid = await page.locator(selector).evaluate(
    (el: HTMLInputElement) => !el.validity.valid,
  );
  expect(isInvalid, `Expected ${selector} to be invalid`).toBe(true);
}

function trackApiCalls(page: Page, apiPath: RegExp) {
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

async function expectNoApiCall(page: Page, calls: string[], label: string) {
  await page.waitForTimeout(300);
  expect(
    calls,
    `Expected no ${label} API call, but got: ${calls.join(", ")}`,
  ).toHaveLength(0);
}

async function registerUser(page: Page, user: TestUser) {
  await page.goto("/register");
  await fillRegisterForm(page, user);
  await submitForm(page);

  await expectMessageVisible(page, REGISTER_SUCCESS_TOAST);
  await expect(page).toHaveURL(LOGIN_PAGE_URL);
}

async function loginUser(page: Page, email: string, password: string) {
  await page.goto("/login");
  await fillLoginForm(page, email, password);
  await submitForm(page);

  await expect(page).toHaveURL(PROJECTS_PAGE_URL);
}

async function getPersistedToken(page: Page) {
  return page.evaluate(() => {
    // The store uses "taskboard_token" key directly
    const token = localStorage.getItem("taskboard_token");
    if (token && token.length > 0) return token;
    return null;
  });
}

test.describe("Authentication UI Flow", () => {
  test.beforeEach(async ({ page, context }) => {
    await context.clearCookies();
    await clearBrowserAuthState(page);
  });

  test("TC-UI-01: Register with valid data → toast + redirect to /login", async ({
    page,
  }) => {
    const testUser = getTestUser();

    await page.goto("/register");
    await fillRegisterForm(page, testUser);
    await submitForm(page);

    await expectMessageVisible(page, REGISTER_SUCCESS_TOAST);
    await expect(page).toHaveURL(LOGIN_PAGE_URL);
  });

  test("TC-UI-02: Login with valid credentials → persist token + redirect to /projects", async ({
    page,
  }) => {
    const testUser = getTestUser();

    await registerUser(page, testUser);
    await loginUser(page, testUser.email, testUser.password);

    await expect(page).toHaveURL(PROJECTS_PAGE_URL);
    await expect.poll(() => getPersistedToken(page)).toBeTruthy();
  });

  test("TC-UI-03: Register validation - invalid email → field error + no register API call", async ({
    page,
  }) => {
    await page.goto("/register");
    const registerCalls = trackApiCalls(page, AUTH_REGISTER_API);

    await fillRegisterForm(page, {
      email: "invalid-email",
      fullName: "Test User UI",
      password: "Test@1234",
    });
    await submitForm(page);

    // Browser native validation prevents submission for type="email" inputs
    await expectEmailInputInvalid(page, 'input[name="email"]');
    await expect(page).toHaveURL(REGISTER_PAGE_URL);
    await expectNoApiCall(page, registerCalls, "register");
  });

  test("TC-UI-04: Register validation - password < 8 characters → field error + no register API call", async ({
    page,
  }) => {
    await page.goto("/register");
    const registerCalls = trackApiCalls(page, AUTH_REGISTER_API);

    await fillRegisterForm(page, {
      email: getTestUser().email,
      fullName: "Test User UI",
      password: "1234567",
    });
    await submitForm(page);

    await expectMessageVisible(page, PASSWORD_ERROR);
    await expect(page).toHaveURL(REGISTER_PAGE_URL);
    await expectNoApiCall(page, registerCalls, "register");
  });

  test("TC-UI-05: Register validation - empty full name → field error + no register API call", async ({
    page,
  }) => {
    await page.goto("/register");
    const registerCalls = trackApiCalls(page, AUTH_REGISTER_API);

    await fillRegisterForm(page, {
      email: getTestUser().email,
      fullName: "",
      password: "Test@1234",
    });
    await submitForm(page);

    await expectMessageVisible(page, FULL_NAME_ERROR);
    await expect(page).toHaveURL(REGISTER_PAGE_URL);
    await expectNoApiCall(page, registerCalls, "register");
  });

  test("TC-UI-06: Login validation - invalid email → field error + no login API call", async ({
    page,
  }) => {
    await page.goto("/login");
    const loginCalls = trackApiCalls(page, AUTH_LOGIN_API);

    await fillLoginForm(page, "invalid-email", "Test@1234");
    await submitForm(page);

    // Browser native validation prevents submission for type="email" inputs
    await expectEmailInputInvalid(page, 'input[name="email"]');
    await expect(page).toHaveURL(LOGIN_PAGE_URL);
    await expectNoApiCall(page, loginCalls, "login");
  });

  test("TC-UI-07: Login validation - password < 8 characters → field error + no login API call", async ({
    page,
  }) => {
    await page.goto("/login");
    const loginCalls = trackApiCalls(page, AUTH_LOGIN_API);

    await fillLoginForm(page, getTestUser().email, "1234567");
    await submitForm(page);

    await expectMessageVisible(page, PASSWORD_ERROR);
    await expect(page).toHaveURL(LOGIN_PAGE_URL);
    await expectNoApiCall(page, loginCalls, "login");
  });

  test("TC-UI-08: Server error - wrong password → show error toast and stay on /login", async ({
    page,
  }) => {
    const testUser = getTestUser();

    await registerUser(page, testUser);

    await page.goto("/login");
    await fillLoginForm(page, testUser.email, "Wrong@1234");
    await submitForm(page);

    await expectMessageVisible(page, LOGIN_ERROR_TOAST);
    await expect(page).toHaveURL(LOGIN_PAGE_URL);
  });

  test("TC-UI-09: Server error - unregistered email → show error toast and stay on /login", async ({
    page,
  }) => {
    const testUser = getTestUser();

    await page.goto("/login");
    await fillLoginForm(page, testUser.email, testUser.password);
    await submitForm(page);

    await expectMessageVisible(page, LOGIN_ERROR_TOAST);
    await expect(page).toHaveURL(LOGIN_PAGE_URL);
  });

  test("TC-UI-10: Loading state - submit button disabled + text changed while login API is pending", async ({
    page,
  }) => {
    const testUser = getTestUser();
    await registerUser(page, testUser);

    let delayedLoginRequest = false;

    await page.route("**/api/auth/login", async (route) => {
      const request = route.request();

      if (request.method() === "POST") {
        delayedLoginRequest = true;
        await page.waitForTimeout(1200);
      }

      await route.continue();
    });

    await page.goto("/login");
    await fillLoginForm(page, testUser.email, testUser.password);

    const submitButton = page.locator('button[type="submit"]');
    await submitButton.click();

    await expect(submitButton).toBeDisabled();
    await expect(submitButton).toHaveText(LOADING_BUTTON_TEXT_LOGIN);

    await expect(page).toHaveURL(PROJECTS_PAGE_URL);
    expect(delayedLoginRequest).toBeTruthy();
  });

  test("TC-UI-11: Keep logged in - after login and reload → still authenticated", async ({
    page,
  }) => {
    const testUser = getTestUser();

    await registerUser(page, testUser);
    await loginUser(page, testUser.email, testUser.password);

    const tokenBeforeReload = await getPersistedToken(page);
    expect(tokenBeforeReload).toBeTruthy();

    await page.reload();

    await expect(page).toHaveURL(PROJECTS_PAGE_URL);

    const tokenAfterReload = await getPersistedToken(page);
    expect(tokenAfterReload).toBeTruthy();
  });

  test("TC-UI-12: Protected route - access /projects without login → redirect to /login", async ({
    page,
  }) => {
    await page.goto("/projects");

    await expect(page).toHaveURL(LOGIN_PAGE_URL);
  });

  test("TC-UI-13: Navigation link - Register link on /login works", async ({
    page,
  }) => {
    await page.goto("/login");

    await page
      .locator('a[href="/register"], a:has-text("Register")')
      .first()
      .click();

    await expect(page).toHaveURL(REGISTER_PAGE_URL);
  });

  test("TC-UI-14: Navigation link - Login link on /register works", async ({
    page,
  }) => {
    await page.goto("/register");

    await page.locator('a[href="/login"], a:has-text("Login")').first().click();

    await expect(page).toHaveURL(LOGIN_PAGE_URL);
  });
});
