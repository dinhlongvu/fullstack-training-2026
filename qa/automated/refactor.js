const fs = require('fs');
const path = require('path');

const dirs = ['tests/e2e/comment', 'tests/e2e/task'];
const files = [];

dirs.forEach(d => {
  const full = path.join(__dirname, d);
  if (fs.existsSync(full)) {
    fs.readdirSync(full).forEach(f => {
      if (f.endsWith('.spec.ts')) files.push(path.join(full, f));
    });
  }
});

for (const file of files) {
  let content = fs.readFileSync(file, 'utf8');
  
  if (!content.includes('apiContext = await playwrightRequest.newContext()') && !content.includes('owner = await registerAndLogin(apiContext')) {
    console.log('Skipping ' + file);
    continue;
  }

  // 1. Imports
  content = content.replace(
    /import\s+\{\s*test,\s*expect(?:[^}]*)\}\s*from\s*["']@playwright\/test["'];/g,
    'import { test, expect } from "../utils/api-fixtures";'
  );

  let lines = content.split('\n');
  let newLines = [];
  let inBeforeAll = false;
  let inAfterAll = false;
  
  for (let i = 0; i < lines.length; i++) {
    let line = lines[i];
    
    // Check if THIS is the specific beforeAll that creates apiContext
    if (line.includes('test.beforeAll(async () => {') && line.trim().startsWith('test.beforeAll')) {
      // Look ahead to see if it creates apiContext
      let isSetupBlock = false;
      for (let j = i + 1; j < i + 10 && j < lines.length; j++) {
        if (lines[j].includes('playwrightRequest.newContext()')) {
          isSetupBlock = true;
          break;
        }
      }
      if (isSetupBlock) {
        inBeforeAll = true;
        continue;
      }
    }
    
    if (inBeforeAll) {
      if (line.trim() === '});') inBeforeAll = false;
      continue;
    }
    
    if (line.includes('test.afterAll(async () => {') && line.trim().startsWith('test.afterAll')) {
      // Look ahead to see if it disposes apiContext
      let isDisposeBlock = false;
      for (let j = i + 1; j < i + 5 && j < lines.length; j++) {
        if (lines[j].includes('apiContext.dispose()')) {
          isDisposeBlock = true;
          break;
        }
      }
      if (isDisposeBlock) {
        inAfterAll = true;
        continue;
      }
    }
    if (inAfterAll) {
      if (line.trim() === '});') inAfterAll = false;
      continue;
    }
    
    // Remove let declarations
    if (line.trim().startsWith('let apiContext: APIRequestContext;')) continue;
    if (line.trim().startsWith('let owner: RegisteredUser;')) continue;
    if (line.trim().startsWith('let member: RegisteredUser;')) continue;
    if (line.trim().startsWith('let member2: RegisteredUser;')) continue;
    if (line.trim().startsWith('let nonMember: RegisteredUser;')) continue;
    if (line.trim().startsWith('let assignee: RegisteredUser;')) continue;
    if (line.trim().startsWith('let user: RegisteredUser;')) continue;

    // Convert test.beforeAll(async () => { to test.beforeEach(async ({ request, owner, member, ... }) => {
    if (line.includes('test.beforeAll(async () => {')) {
      line = line.replace('test.beforeAll(async () => {', 'test.beforeEach(async ({ request, owner, member, nonMember, member2, assignee, user }) => {');
    }
    if (line.includes('test.afterAll(async () => {')) {
      line = line.replace('test.afterAll(async () => {', 'test.afterEach(async ({ request, owner, member, nonMember, member2, assignee, user }) => {');
    }

    // Replace apiContext with request
    line = line.replace(/apiContext/g, 'request');

    newLines.push(line);
  }
  
  content = newLines.join('\n');
  
  // 5. Replace test function parameters to inject fixtures
  content = content.replace(/async\s*\(\{\s*request,?\s*\}\)\s*=>/g, 'async ({ request, owner, member, nonMember, member2, assignee, user }) =>');

  fs.writeFileSync(file, content);
  console.log('Refactored ' + file);
}
