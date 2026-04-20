import { test, expect } from '@playwright/test';
import { config } from '../../config/env';

test('OAuth login redirect flow', async ({ page }) => {
  const authUrl = `${config.baseUrl}/o/oauth2/v2/auth?response_type=code&client_id=${config.clientId}&redirect_uri=${config.redirectUri}`;

  await page.goto(authUrl);

  // Mock server auto-approves → redirects
  await page.waitForURL(/code=/);

  const url = new URL(page.url());
  const code = url.searchParams.get('code');

  expect(code).not.toBeNull();
});