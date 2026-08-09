import { test as base, request as playwrightRequest } from "@playwright/test";
import { registerAndLogin, type RegisteredUser } from "./api-helpers";

export type ApiFixtures = {
  owner: RegisteredUser;
  member: RegisteredUser;
  nonMember: RegisteredUser;
  member2: RegisteredUser;
  assignee: RegisteredUser;
  user: RegisteredUser;
};

// Use 'worker' scope so we only register these users once per worker process,
// mirroring the previous beforeAll behavior.
export const test = base.extend<{}, ApiFixtures>({
  owner: [
    async ({}, use) => {
      const apiContext = await playwrightRequest.newContext();
      const user = await registerAndLogin(apiContext, { fullName: "Test Owner" });
      await use(user);
      await apiContext.dispose();
    },
    { scope: "worker" },
  ],
  member: [
    async ({}, use) => {
      const apiContext = await playwrightRequest.newContext();
      const user = await registerAndLogin(apiContext, { fullName: "Test Member" });
      await use(user);
      await apiContext.dispose();
    },
    { scope: "worker" },
  ],
  nonMember: [
    async ({}, use) => {
      const apiContext = await playwrightRequest.newContext();
      const user = await registerAndLogin(apiContext, { fullName: "Test NonMember" });
      await use(user);
      await apiContext.dispose();
    },
    { scope: "worker" },
  ],
  member2: [
    async ({}, use) => {
      const apiContext = await playwrightRequest.newContext();
      const user = await registerAndLogin(apiContext, { fullName: "Test Member2" });
      await use(user);
      await apiContext.dispose();
    },
    { scope: "worker" },
  ],
  assignee: [
    async ({}, use) => {
      const apiContext = await playwrightRequest.newContext();
      const user = await registerAndLogin(apiContext, { fullName: "Test Assignee" });
      await use(user);
      await apiContext.dispose();
    },
    { scope: "worker" },
  ],
  user: [
    async ({}, use) => {
      const apiContext = await playwrightRequest.newContext();
      const u = await registerAndLogin(apiContext, { fullName: "Test User" });
      await use(u);
      await apiContext.dispose();
    },
    { scope: "worker" },
  ],
});

export { expect } from "@playwright/test";
