import { test as base } from '@playwright/test';
import { OAuthClient } from '../utils/oauthClient';

export const test = base.extend<{
  accessToken: string;
}>({
  accessToken: async ({}, use) => {
    const client = new OAuthClient();
    const res = await client.getToken('valid-code');
    const body = await res.json();

    await use(body.access_token);
  },
});